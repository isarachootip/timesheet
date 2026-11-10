import express from 'express';
import { pool } from '../config/db.js';
import { checkPermission } from './projectRoutes.js';
import {
  encodeOAuthState, decodeOAuthState, buildMicrosoftAuthUrl,
  isTokenExpired, exchangeMicrosoftCode, refreshMicrosoftAccessToken,
  fetchMicrosoftProfile, fetchCalendarView,
} from '../services/outlookService.js';

const router = express.Router();

function getMsConfig(req) {
  return {
    clientId: process.env.MS_CLIENT_ID || '',
    clientSecret: process.env.MS_CLIENT_SECRET || '',
    tenantId: process.env.MS_TENANT_ID || 'common',
    redirectUri: process.env.MS_CALLBACK_URL || `${req.protocol}://${req.get('host')}/api/auth/microsoft/callback`,
  };
}

async function ensureValidAccessToken(user, msConfig) {
  if (user.ms_access_token && !isTokenExpired(user.ms_token_expires_at)) return user.ms_access_token;
  if (!user.ms_refresh_token) throw new Error('Microsoft session expired. Please reconnect your Outlook account.');
  const tokenData = await refreshMicrosoftAccessToken({
    refreshToken: user.ms_refresh_token,
    clientId: msConfig.clientId,
    clientSecret: msConfig.clientSecret,
    tenantId: msConfig.tenantId,
  });
  const expiresAt = Date.now() + Number(tokenData.expires_in || 3600) * 1000;
  const newRefresh = tokenData.refresh_token || user.ms_refresh_token;
  await pool.query(
    `UPDATE users SET ms_access_token = $1, ms_refresh_token = $2, ms_token_expires_at = $3 WHERE id = $4`,
    [tokenData.access_token, newRefresh, expiresAt, user.id]
  );
  return tokenData.access_token;
}

router.get('/api/auth/microsoft', (req, res) => {
  const origin = String(req.query.origin || `${req.protocol}://${req.get('host')}`);
  const userId = String(req.query.userId || '');
  const returnPath = String(req.query.returnPath || '/tasks');
  const { clientId, tenantId, redirectUri } = getMsConfig(req);
  if (!clientId) {
    const errMsg = encodeURIComponent('MS_CLIENT_ID is not configured in server environment (.env)');
    return res.redirect(userId ? `${origin}${returnPath}?outlook_error=${errMsg}` : `${origin}/?error=${errMsg}`);
  }
  const state = encodeOAuthState({ origin, userId, returnPath });
  res.redirect(buildMicrosoftAuthUrl({ clientId, tenantId, redirectUri, state }));
});

router.get('/api/auth/microsoft/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;
  const decoded = decodeOAuthState(String(state || ''));
  const clientOrigin = decoded.origin || `${req.protocol}://${req.get('host')}`;
  const returnPath = decoded.returnPath || '/tasks';

  if (error || !code) {
    const msg = encodeURIComponent(String(error_description || error || 'no_code_provided'));
    return res.redirect(decoded.userId ? `${clientOrigin}${returnPath}?outlook_error=${msg}` : `${clientOrigin}/?error=${msg}`);
  }

  const msConfig = getMsConfig(req);
  try {
    const tokenData = await exchangeMicrosoftCode({ code: String(code), ...msConfig });
    const profile = await fetchMicrosoftProfile(tokenData.access_token);
    const msUserId = String(profile.id || '');
    const msEmail = String(profile.mail || profile.userPrincipalName || '').toLowerCase();
    const expiresAt = Date.now() + Number(tokenData.expires_in || 3600) * 1000;

    if (decoded.userId) {
      await pool.query(
        `UPDATE users SET ms_user_id = $1, ms_email = $2, ms_access_token = $3, ms_refresh_token = COALESCE($4, ms_refresh_token), ms_token_expires_at = $5 WHERE id = $6`,
        [msUserId, msEmail, tokenData.access_token, tokenData.refresh_token || null, expiresAt, decoded.userId]
      );
      return res.redirect(`${clientOrigin}${returnPath}?outlook_connected=1`);
    }

    let userRes = await pool.query('SELECT * FROM users WHERE ms_user_id = $1', [msUserId]);
    let user = userRes.rows[0];
    if (!user && msEmail) {
      userRes = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [msEmail]);
      user = userRes.rows[0];
    }
    if (!user) return res.redirect(`${clientOrigin}/?error=unauthorized&email=${encodeURIComponent(msEmail)}`);
    if (user.is_active === false) {
      return res.redirect(`${clientOrigin}/?error=${encodeURIComponent('บัญชีผู้ใช้งานนี้ถูกระงับชั่วคราว (Inactive) กรุณาติดต่อ Admin')}`);
    }

    await pool.query(
      `UPDATE users SET ms_user_id = $1, ms_email = $2, ms_access_token = $3, ms_refresh_token = COALESCE($4, ms_refresh_token), ms_token_expires_at = $5 WHERE id = $6`,
      [msUserId, msEmail, tokenData.access_token, tokenData.refresh_token || null, expiresAt, user.id]
    );
    const userData = {
      id: user.id, name: user.name, email: user.email, avatar: user.avatar,
      globalRole: user.global_role, department: user.department, gender: user.gender,
      birthday: user.birthday, skills: user.skills, isActive: user.is_active !== false,
    };
    return res.redirect(`${clientOrigin}/login-success?user=${encodeURIComponent(JSON.stringify(userData))}`);
  } catch (err) {
    const msg = encodeURIComponent(err.message);
    return res.redirect(decoded.userId ? `${clientOrigin}${returnPath}?outlook_error=${msg}` : `${clientOrigin}/?error=${msg}`);
  }
});

router.get('/api/outlook/status', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const userRes = await pool.query('SELECT ms_user_id, ms_email, ms_refresh_token, ms_access_token FROM users WHERE id = $1', [userId]);
    const u = userRes.rows[0];
    res.json({ connected: Boolean(u && (u.ms_refresh_token || u.ms_access_token)), msEmail: u?.ms_email || null, configured: Boolean(process.env.MS_CLIENT_ID) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/api/outlook/disconnect', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  try {
    await pool.query(`UPDATE users SET ms_access_token = NULL, ms_refresh_token = NULL, ms_token_expires_at = NULL WHERE id = $1`, [userId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/api/outlook/events', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { startDate, endDate } = req.query;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate are required' });

  try {
    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];
    if (!user || (!user.ms_access_token && !user.ms_refresh_token)) return res.status(400).json({ error: 'Outlook account not connected' });

    const accessToken = await ensureValidAccessToken(user, getMsConfig(req));
    const events = await fetchCalendarView(accessToken, String(startDate), String(endDate));
    const eventIds = events.map(e => e.outlookEventId).filter(Boolean);
    const existingMap = new Map();
    if (eventIds.length > 0) {
      const tasksRes = await pool.query(`SELECT id, project_id, outlook_event_id FROM tasks WHERE outlook_event_id = ANY($1::text[])`, [eventIds]);
      tasksRes.rows.forEach(t => existingMap.set(t.outlook_event_id, t));
    }
    res.json({
      events: events.map(evt => ({
        ...evt,
        existingTaskId: existingMap.get(evt.outlookEventId)?.id || null,
        existingProjectId: existingMap.get(evt.outlookEventId)?.project_id || null,
      })),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/api/outlook/import-tasks', async (req, res) => {
  const userId = String(req.headers['x-user-id'] || '');
  const { items } = req.body;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'No items provided' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let createdCount = 0, syncedCount = 0;
    const nowIso = new Date().toISOString();

    for (const item of items) {
      const existingRes = await client.query('SELECT * FROM tasks WHERE outlook_event_id = $1 LIMIT 1', [item.outlookEventId]);
      const existingTask = existingRes.rows[0];
      if (existingTask) {
        if (!(await checkPermission(userId, existingTask.project_id, 'edit_task', existingTask))) {
          throw new Error('Permission denied to update existing imported task');
        }
        await client.query(
          `UPDATE tasks SET title = $1, description = $2, estimated_hours = $3, start_date = $4, end_date = $5, updated_at = $6 WHERE id = $7`,
          [item.title, item.description || '', Number(item.estimatedHours) || 0, item.startDate, item.endDate, nowIso, existingTask.id]
        );
        syncedCount++;
      } else {
        if (!(await checkPermission(userId, item.projectId, 'create_task'))) {
          throw new Error('Permission denied to create task in target project');
        }
        const newId = `t_ms_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await client.query(
          `INSERT INTO tasks (id, project_id, assignee_id, title, description, status, priority, estimated_hours, created_at, start_date, end_date, issue_type, updated_at, outlook_event_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [newId, item.projectId, item.assigneeId || userId, item.title, item.description || '', item.status || 'To Do', item.priority || 'Medium', Number(item.estimatedHours) || 0, nowIso, item.startDate || null, item.endDate || null, item.issueType || 'Task', nowIso, item.outlookEventId]
        );
        createdCount++;
      }
    }
    await client.query('COMMIT');
    res.json({ success: true, createdCount, syncedCount });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally { client.release(); }
});

export default router;
