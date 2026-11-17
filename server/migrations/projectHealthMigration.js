import { isTaskDoneStatus, resolveWorkflowColumns } from '../services/health/taskRollupUtils.js';
import { toIsoTimestampString } from '../services/health/dateUtils.js';
import { DEFAULT_PROJECT_HEALTH_CONFIG } from '../config/projectHealthConfig.js';

export const runProjectHealthMigration = async (client) => {
  await client.query(`
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at VARCHAR(50);
    ALTER TABLE task_snapshots ADD COLUMN IF NOT EXISTS completed_at VARCHAR(50);
    CREATE INDEX IF NOT EXISTS idx_tasks_project_completed_at ON tasks(project_id, completed_at);
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS project_health_snapshots (
      id VARCHAR(50) PRIMARY KEY,
      project_id VARCHAR(50) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      snapshot_date VARCHAR(20) NOT NULL,
      calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      health_score NUMERIC,
      factor_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
      status VARCHAR(30) NOT NULL,
      confidence VARCHAR(30) NOT NULL,
      data_issues JSONB NOT NULL DEFAULT '[]'::jsonb,
      ai_analysis JSONB,
      ai_analyzed_at TIMESTAMP,
      trigger_source VARCHAR(30) NOT NULL DEFAULT 'auto'
    );
    CREATE INDEX IF NOT EXISTS idx_project_health_snapshots_proj_calc
      ON project_health_snapshots (project_id, calculated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_project_health_snapshots_proj_date
      ON project_health_snapshots (project_id, snapshot_date);
  `);

  await client.query(`
    ALTER TABLE chat_notifications ALTER COLUMN message_id DROP NOT NULL;
    ALTER TABLE chat_notifications ALTER COLUMN sender_id DROP NOT NULL;
  `);

  const migId = 'backfill_tasks_completed_at_v1';
  const migDone = await client.query('SELECT id FROM migrations WHERE id = $1', [migId]);
  if (migDone.rows.length === 0) {
    const projectsRes = await client.query('SELECT id, custom_columns FROM projects');
    const workflowsRes = await client.query('SELECT project_id, statuses FROM project_workflows');
    const tasksRes = await client.query(
      'SELECT id, project_id, status, updated_at, created_at FROM tasks WHERE completed_at IS NULL'
    );

    const projectMap = new Map(projectsRes.rows.map((p) => [p.id, p]));
    const workflowMap = new Map(workflowsRes.rows.map((w) => [w.project_id, w]));
    const nowFallbackIso = new Date().toISOString();

    const taskIds = [];
    const completedTimestamps = [];

    for (const task of tasksRes.rows) {
      const columns = resolveWorkflowColumns(
        projectMap.get(task.project_id),
        workflowMap.get(task.project_id)
      );
      if (isTaskDoneStatus(task.status, columns, DEFAULT_PROJECT_HEALTH_CONFIG.terminalStatuses)) {
        const rawFallback = task.updated_at || task.created_at || nowFallbackIso;
        taskIds.push(String(task.id));
        completedTimestamps.push(toIsoTimestampString(rawFallback, nowFallbackIso));
      }
    }

    if (taskIds.length > 0) {
      await client.query(
        `UPDATE tasks AS t
         SET completed_at = v.completed_at
         FROM UNNEST($1::varchar[], $2::varchar[]) AS v(id, completed_at)
         WHERE t.id = v.id`,
        [taskIds, completedTimestamps]
      );
    }

    await client.query('INSERT INTO migrations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING', [
      migId,
    ]);
    console.log(
      `✅ One-time migration: backfilled tasks.completed_at for ${taskIds.length} existing Done tasks.`
    );
  }
};
