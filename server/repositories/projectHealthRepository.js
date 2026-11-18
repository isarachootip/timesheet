import crypto from 'crypto';
import { parseProjectMembers } from '../services/health/projectHealthPermissions.js';

const PM_NOTIFICATION_ROLES = new Set(['PM', 'Team Lead', 'Leader']);

const parseJsonSafe = (val, fallback) => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') return val;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  }
  return fallback;
};

export const mapSnapshotRow = (row) => {
  if (!row) return null;
  const calcAt = row.calculated_at instanceof Date ? row.calculated_at.toISOString() : String(row.calculated_at);
  const aiAt = row.ai_analyzed_at
    ? row.ai_analyzed_at instanceof Date
      ? row.ai_analyzed_at.toISOString()
      : String(row.ai_analyzed_at)
    : null;

  return {
    id: String(row.id),
    projectId: String(row.project_id),
    snapshotDate: String(row.snapshot_date),
    calculatedAt: calcAt,
    healthScore: row.health_score !== null && row.health_score !== undefined ? Number(row.health_score) : null,
    factors: parseJsonSafe(row.factor_scores, {
      schedule: null,
      overdue: null,
      effort: null,
      momentum: null,
      freshness: null,
      sprint: null,
    }),
    status: String(row.status),
    confidence: String(row.confidence),
    dataIssues: parseJsonSafe(row.data_issues, []),
    aiAnalysis: parseJsonSafe(row.ai_analysis, null),
    aiAnalyzedAt: aiAt,
    triggerSource: String(row.trigger_source || 'auto'),
  };
};

export const insertHealthSnapshot = async (db, snapshot) => {
  const id = snapshot.id || `phs_${crypto.randomUUID()}`;
  const calculatedAt = snapshot.calculatedAt || new Date().toISOString();
  const snapshotDate = snapshot.snapshotDate || calculatedAt.slice(0, 10);
  const aiAnalyzedAt = snapshot.aiAnalysis ? snapshot.aiAnalyzedAt || calculatedAt : null;

  const res = await db.query(
    `INSERT INTO project_health_snapshots (
       id, project_id, snapshot_date, calculated_at, health_score,
       factor_scores, status, confidence, data_issues, ai_analysis, ai_analyzed_at, trigger_source
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      id,
      snapshot.projectId,
      snapshotDate,
      calculatedAt,
      snapshot.healthScore,
      JSON.stringify(snapshot.factors || {}),
      snapshot.status,
      snapshot.confidence,
      JSON.stringify(snapshot.dataIssues || []),
      snapshot.aiAnalysis ? JSON.stringify(snapshot.aiAnalysis) : null,
      aiAnalyzedAt,
      snapshot.triggerSource || 'auto',
    ]
  );

  return mapSnapshotRow(res.rows[0]);
};

export const getLatestHealthSnapshot = async (db, projectId) => {
  const res = await db.query(
    `SELECT * FROM project_health_snapshots
     WHERE project_id = $1
     ORDER BY calculated_at DESC
     LIMIT 1`,
    [projectId]
  );
  return mapSnapshotRow(res.rows[0]);
};

export const getLatestAiAnalysisSnapshot = async (db, projectId) => {
  const res = await db.query(
    `SELECT * FROM project_health_snapshots
     WHERE project_id = $1 AND ai_analysis IS NOT NULL
     ORDER BY calculated_at DESC
     LIMIT 1`,
    [projectId]
  );
  return mapSnapshotRow(res.rows[0]);
};

export const getPreviousDistinctSnapshot = async (db, projectId, excludeId) => {
  const res = await db.query(
    `SELECT * FROM project_health_snapshots
     WHERE project_id = $1 AND id != $2
     ORDER BY calculated_at DESC
     LIMIT 1`,
    [projectId, excludeId]
  );
  return mapSnapshotRow(res.rows[0]);
};

export const getHealthHistorySnapshots = async (db, projectId, limit = 30) => {
  const res = await db.query(
    `SELECT * FROM project_health_snapshots
     WHERE project_id = $1
     ORDER BY calculated_at DESC
     LIMIT $2`,
    [projectId, limit]
  );
  return res.rows.map(mapSnapshotRow).reverse();
};

export const hasScheduledSnapshotForDate = async (db, projectId, snapshotDate) => {
  const res = await db.query(
    `SELECT id FROM project_health_snapshots
     WHERE project_id = $1 AND snapshot_date = $2 AND trigger_source = 'scheduled'
     LIMIT 1`,
    [projectId, snapshotDate]
  );
  return res.rows.length > 0;
};

export const hasAiSnapshotForDate = async (db, projectId, snapshotDate) => {
  const res = await db.query(
    `SELECT id FROM project_health_snapshots
     WHERE project_id = $1 AND snapshot_date = $2 AND ai_analysis IS NOT NULL
     LIMIT 1`,
    [projectId, snapshotDate]
  );
  return res.rows.length > 0;
};

export const getLatestAiSnapshotsByProjectIds = async (db, projectIds = []) => {
  if (!Array.isArray(projectIds) || projectIds.length === 0) return new Map();
  const res = await db.query(
    `SELECT * FROM (
       SELECT *, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY calculated_at DESC) AS rn
       FROM project_health_snapshots
       WHERE project_id = ANY($1::varchar[]) AND ai_analysis IS NOT NULL
     ) ranked WHERE rn = 1`,
    [projectIds]
  );
  const map = new Map();
  for (const row of res.rows) {
    const mapped = mapSnapshotRow(row);
    if (mapped) map.set(mapped.projectId, mapped);
  }
  return map;
};

export const insertPmHealthNotifications = async (
  db,
  { project, previousStatus, nextStatus, healthScore }
) => {
  const members = parseProjectMembers(project.members);
  const recipientIds = Array.from(
    new Set(
      members
        .filter((m) => m && m.userId && PM_NOTIFICATION_ROLES.has(String(m.role || '')))
        .map((m) => String(m.userId))
    )
  );

  const scoreLabel = healthScore !== null && healthScore !== undefined ? ` (${healthScore} คะแนน)` : '';
  const text = `สถานะสุขภาพโครงการ "${project.name}" เปลี่ยนจาก ${previousStatus} เป็น ${nextStatus}${scoreLabel}`;

  for (const recipientId of recipientIds) {
    const notifId = `notif_${crypto.randomUUID()}`;
    await db.query(
      `INSERT INTO chat_notifications (id, user_id, project_id, message_id, sender_id, text, type)
       VALUES ($1, $2, $3, NULL, NULL, $4, $5)`,
      [notifId, recipientId, project.id, text, 'health_alert']
    );
  }

  return recipientIds.length;
};
