import express from 'express';
import { pool, dbReady } from '../config/db.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Health check — visit /api/health in browser to see DB status
router.get('/api/health', async (req, res) => {
  const status = { server: 'ok', db: 'unknown', dbHost: '', time: new Date().toISOString() };
  const connStr = process.env.DATABASE_URL || '';
  const match = connStr.match(/@([^/:]+)/);
  status.dbHost = match ? match[1] : (process.env.DB_HOST || 'localhost');
  try {
    await pool.query('SELECT 1');
    status.db = 'connected';
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    const taskCount = await pool.query('SELECT COUNT(*) FROM tasks');
    status.userCount = parseInt(userCount.rows[0].count);
    status.taskCount = parseInt(taskCount.rows[0].count);
    res.json(status);
  } catch (err) {
    status.db = 'error';
    status.error = err.message;
    status.dbReady = dbReady;
    res.status(503).json(status);
  }
});


// Individual GET routes for React Query
router.get('/api/users', async (req, res) => {
  try {
    const usersRes = await pool.query('SELECT * FROM users');
    const users = usersRes.rows.map(u => ({
      id: u.id, name: u.name, email: u.email, avatar: u.avatar,
      globalRole: u.global_role, department: u.department, gender: u.gender,
      birthday: u.birthday, skills: u.skills, wfhDays: u.wfh_days || []
    }));
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/api/projects', async (req, res) => {
  try {
    const projectsRes = await pool.query('SELECT * FROM projects');
    const projects = projectsRes.rows.map(p => ({
      id: p.id, name: p.name, description: p.description, status: p.status,
      startDate: p.start_date, endDate: p.end_date, budget: parseFloat(p.budget || '0'),
      members: p.members, customColumns: p.custom_columns, permissionSchemeId: p.permission_scheme_id,
      projectType: p.project_type || 'dev', supportTaskStyle: p.support_task_style || 'categories'
    }));
    res.json(projects);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/api/tasks', async (req, res) => {
  try {
    const tasksRes = await pool.query('SELECT * FROM tasks');
    const tasks = tasksRes.rows.map(t => ({
      id: t.id, projectId: t.project_id, assigneeId: t.assignee_id, title: t.title,
      description: t.description, status: t.status, priority: t.priority,
      estimatedHours: parseFloat(t.estimated_hours || '0'), createdAt: t.created_at,
      parentId: t.parent_id, startDate: t.start_date, endDate: t.end_date,
      sprintId: t.sprint_id, releaseId: t.release_id, storyPoints: t.story_points || 0,
      issueType: t.issue_type || 'Task', updatedAt: t.updated_at || t.created_at
    }));
    res.json(tasks);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/api/timesheets', async (req, res) => {
  try {
    const timesheetsRes = await pool.query('SELECT * FROM timesheets');
    const timesheets = timesheetsRes.rows.map(ts => ({
      id: ts.id, userId: ts.user_id, projectId: ts.project_id, taskId: ts.task_id,
      date: ts.date, hours: parseFloat(ts.hours || '0'),
      plannedHours: ts.planned_hours != null ? parseFloat(ts.planned_hours) : undefined,
      startTime: ts.start_time || undefined, endTime: ts.end_time || undefined,
      description: ts.description, status: ts.status, approvedBy: ts.approved_by,
      approvedAt: ts.approved_at, imageUrl: ts.image_url || undefined,
      workResults: ts.work_results || undefined, updatedAt: ts.updated_at || undefined
    }));
    res.json(timesheets);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/api/task-templates', async (req, res) => {
  try {
    const templatesRes = await pool.query('SELECT * FROM task_templates');
    const taskTemplates = templatesRes.rows.map(tpl => ({
      id: tpl.id, title: tpl.title, description: tpl.description, priority: tpl.priority,
      startPercent: parseFloat(tpl.start_percent || '0'),
      endPercent: parseFloat(tpl.end_percent || '100'),
      estimatedHours: parseFloat(tpl.estimated_hours || '0')
    }));
    res.json(taskTemplates);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/api/sprints', async (req, res) => {
  try {
    const sprintsRes = await pool.query('SELECT * FROM sprints');
    const sprints = sprintsRes.rows.map(s => ({
      id: s.id, projectId: s.project_id, name: s.name, status: s.status,
      startDate: s.start_date, endDate: s.end_date
    }));
    res.json(sprints);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/api/releases', async (req, res) => {
  try {
    const releasesRes = await pool.query('SELECT * FROM releases');
    const releases = releasesRes.rows.map(r => ({
      id: r.id, projectId: r.project_id, name: r.name, status: r.status, releaseDate: r.release_date
    }));
    res.json(releases);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/api/permission-schemes', async (req, res) => {
  try {
    const permissionSchemesRes = await pool.query('SELECT * FROM permission_schemes');
    const permissionSchemes = permissionSchemesRes.rows.map(ps => ({
      id: ps.id, name: ps.name, description: ps.description, permissions: ps.permissions
    }));
    res.json(permissionSchemes);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/api/project-workflows', async (req, res) => {
  try {
    const projectWorkflowsRes = await pool.query('SELECT * FROM project_workflows');
    const projectWorkflows = projectWorkflowsRes.rows.map(pw => ({
      projectId: pw.project_id, statuses: pw.statuses, transitions: pw.transitions
    }));
    res.json(projectWorkflows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/api/cost-rates', async (req, res) => {
  try {
    const costRatesRes = await pool.query('SELECT * FROM cost_rates');
    const costRates = costRatesRes.rows.map(cr => ({
      id: cr.id, roleName: cr.role_name, ratePerDay: parseFloat(cr.rate_per_day || '0'),
      ratePerHour: parseFloat(cr.rate_per_hour || '0'), currency: cr.currency || 'THB'
    }));
    res.json(costRates);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/api/system-settings', async (req, res) => {
  try {
    const settingsRes = await pool.query('SELECT * FROM system_settings');
    const systemSettings = {};
    settingsRes.rows.forEach(row => {
      systemSettings[row.setting_key] = row.setting_value;
    });
    res.json(systemSettings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Also keep the old initial-data route in case it's used elsewhere for now
router.get('/api/initial-data', async (req, res) => {
  try {
    const [
      usersRes, projectsRes, tasksRes, timesheetsRes, templatesRes,
      sprintsRes, releasesRes, permissionSchemesRes, projectWorkflowsRes,
      costRatesRes, settingsRes
    ] = await Promise.all([
      pool.query('SELECT * FROM users'),
      pool.query('SELECT * FROM projects'),
      pool.query('SELECT * FROM tasks'),
      pool.query('SELECT * FROM timesheets'),
      pool.query('SELECT * FROM task_templates'),
      pool.query('SELECT * FROM sprints'),
      pool.query('SELECT * FROM releases'),
      pool.query('SELECT * FROM permission_schemes'),
      pool.query('SELECT * FROM project_workflows'),
      pool.query('SELECT * FROM cost_rates'),
      pool.query('SELECT * FROM system_settings')
    ]);

    const systemSettings = {};
    settingsRes.rows.forEach(row => {
      systemSettings[row.setting_key] = row.setting_value;
    });

    const users = usersRes.rows.map(u => ({
      id: u.id, name: u.name, email: u.email, avatar: u.avatar,
      globalRole: u.global_role, department: u.department, gender: u.gender,
      birthday: u.birthday, skills: u.skills, wfhDays: u.wfh_days || []
    }));

    const projects = projectsRes.rows.map(p => ({
      id: p.id, name: p.name, description: p.description, status: p.status,
      startDate: p.start_date, endDate: p.end_date, budget: parseFloat(p.budget || '0'),
      members: p.members, customColumns: p.custom_columns, permissionSchemeId: p.permission_scheme_id,
      projectType: p.project_type || 'dev', supportTaskStyle: p.support_task_style || 'categories'
    }));

    const tasks = tasksRes.rows.map(t => ({
      id: t.id, projectId: t.project_id, assigneeId: t.assignee_id, title: t.title,
      description: t.description, status: t.status, priority: t.priority,
      estimatedHours: parseFloat(t.estimated_hours || '0'), createdAt: t.created_at,
      parentId: t.parent_id, startDate: t.start_date, endDate: t.end_date,
      sprintId: t.sprint_id, releaseId: t.release_id, storyPoints: t.story_points || 0,
      issueType: t.issue_type || 'Task', updatedAt: t.updated_at || t.created_at
    }));

    const timesheets = timesheetsRes.rows.map(ts => ({
      id: ts.id, userId: ts.user_id, projectId: ts.project_id, taskId: ts.task_id,
      date: ts.date, hours: parseFloat(ts.hours || '0'),
      plannedHours: ts.planned_hours != null ? parseFloat(ts.planned_hours) : undefined,
      startTime: ts.start_time || undefined, endTime: ts.end_time || undefined,
      description: ts.description, status: ts.status, approvedBy: ts.approved_by,
      approvedAt: ts.approved_at, imageUrl: ts.image_url || undefined,
      workResults: ts.work_results || undefined, updatedAt: ts.updated_at || undefined
    }));

    const taskTemplates = templatesRes.rows.map(tpl => ({
      id: tpl.id, title: tpl.title, description: tpl.description, priority: tpl.priority,
      startPercent: parseFloat(tpl.start_percent || '0'),
      endPercent: parseFloat(tpl.end_percent || '100'),
      estimatedHours: parseFloat(tpl.estimated_hours || '0')
    }));

    const sprints = sprintsRes.rows.map(s => ({
      id: s.id, projectId: s.project_id, name: s.name, status: s.status,
      startDate: s.start_date, endDate: s.end_date
    }));

    const releases = releasesRes.rows.map(r => ({
      id: r.id, projectId: r.project_id, name: r.name, status: r.status, releaseDate: r.release_date
    }));

    const permissionSchemes = permissionSchemesRes.rows.map(ps => ({
      id: ps.id, name: ps.name, description: ps.description, permissions: ps.permissions
    }));

    const projectWorkflows = projectWorkflowsRes.rows.map(pw => ({
      projectId: pw.project_id, statuses: pw.statuses, transitions: pw.transitions
    }));

    const costRates = costRatesRes.rows.map(cr => ({
      id: cr.id, roleName: cr.role_name, ratePerDay: parseFloat(cr.rate_per_day || '0'),
      ratePerHour: parseFloat(cr.rate_per_hour || '0'), currency: cr.currency || 'THB'
    }));

    res.json({
      users, projects, tasks, timesheets, taskTemplates,
      sprints, releases, permissionSchemes, projectWorkflows,
      costRates, systemSettings
    });
  } catch (err) {
    console.error('Error fetching initial data:', err);
    res.status(500).json({ error: err.message });
  }
});

// File Upload API
router.post('/api/upload', async (req, res) => {
  try {
    const { file, fileName, type } = req.body; // file is a base64 string
    if (!file || !fileName) {
      return res.status(400).json({ error: 'Missing file data' });
    }

    // Decode base64
    const matches = file.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 format' });
    }

    const buffer = Buffer.from(matches[2], 'base64');
    
    // Create unique filename to avoid collision
    const ext = path.extname(fileName) || '';
    const nameWithoutExt = path.basename(fileName, ext);
    const uniqueFileName = `${nameWithoutExt}-${Date.now()}${ext}`;
    
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)){
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, uniqueFileName);
    fs.writeFileSync(filePath, buffer);

    // Return the base64 file data URL directly to persist it in the database.
    // This prevents uploaded files from disappearing when ephemeral containers (Nixpacks/Render/Railway) restart or rebuild.
    res.json({ url: file, name: fileName, type });
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({ error: err.message });
  }
});


// Helper for Processing Webhook Commits
async function processCommit(hash, message, author) {
  const taskRegex = /(?:\[|#)(t_?[a-zA-Z0-9]+)(?:\]|\b)/gi;
  let match;
  const taskIds = new Set();
  while ((match = taskRegex.exec(message)) !== null) {
    taskIds.add(match[1]);
  }

  for (const taskId of taskIds) {
    const taskRes = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    const task = taskRes.rows[0];
    if (task) {
      const lowerMsg = message.toLowerCase();
      let newStatus = task.status;
      
      const doneKeywords = ['fix', 'close', 'resolve', 'complete', 'done', 'แก้', 'ปิด'];
      const inProgressKeywords = ['work', 'progress', 'develop', 'start', 'ทำ', 'เริ่ม'];
      
      const projRes = await pool.query('SELECT custom_columns FROM projects WHERE id = $1', [task.project_id]);
      const columns = projRes.rows[0]?.custom_columns || ['To Do', 'In Progress', 'Review', 'Done'];
      
      if (doneKeywords.some(k => lowerMsg.includes(k))) {
        newStatus = columns[columns.length - 1];
      } else if (inProgressKeywords.some(k => lowerMsg.includes(k))) {
        newStatus = columns[1] || 'In Progress';
      }

      await pool.query('UPDATE tasks SET status = $1 WHERE id = $2', [newStatus, taskId]);

      const commitId = 'c_' + Math.random().toString(36).substr(2, 9);
      await pool.query(
        `INSERT INTO task_commits (id, task_id, commit_hash, message, author, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [commitId, taskId, hash.substring(0, 8), message, author, new Date().toISOString()]
      );
    }
  }
}

// GitHub Webhook API
router.post('/api/webhooks/github', async (req, res) => {
  const payload = req.body;
  if (!payload || !payload.commits) {
    return res.status(400).send('Invalid GitHub Webhook Payload');
  }

  try {
    for (const commit of payload.commits) {
      await processCommit(commit.id, commit.message, commit.author.name || commit.author.email);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error processing GitHub Webhook:', err);
    res.status(500).json({ error: err.message });
  }
});

// GitLab Webhook API
router.post('/api/webhooks/gitlab', async (req, res) => {
  const payload = req.body;
  if (!payload || !payload.commits) {
    return res.status(400).send('Invalid GitLab Webhook Payload');
  }

  try {
    for (const commit of payload.commits) {
      await processCommit(commit.id, commit.message, commit.author.name || commit.author.email);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error processing GitLab Webhook:', err);
    res.status(500).json({ error: err.message });
  }
});


router.get('/api/user-manual', async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../../user_manual.md');
    const content = await fs.promises.readFile(filePath, 'utf8');
    res.json({ success: true, content });
  } catch (err) {
    console.error('Error reading user manual:', err);
    res.status(500).json({ error: 'Failed to read user manual' });
  }
});



export default router;
