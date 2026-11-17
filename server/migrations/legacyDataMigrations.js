import crypto from 'crypto';
import { deduplicateMilestones } from '../utils/deduplicateMilestones.js';

export const runLegacyDataMigrations = async (client) => {
  const adminEmail = 'isarachootip@gmail.com';
  const appliedRes = await client.query('SELECT id FROM migrations');
  const appliedSet = new Set(appliedRes.rows.map((r) => r.id));

  if (!appliedSet.has('set_non_admin_pw_test123')) {
    const nonAdminPwHash = crypto.createHash('sha256').update('test123').digest('hex');
    await client.query('UPDATE users SET password_hash = $1 WHERE email != $2', [nonAdminPwHash, adminEmail]);
    await client.query('INSERT INTO migrations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING', ['set_non_admin_pw_test123']);
  }

  if (!appliedSet.has('add_manager_to_assign_task')) {
    await client.query(`
      UPDATE permission_schemes
      SET permissions = jsonb_set(permissions, '{assign_task}', '["Admin", "Manager", "PM"]'::jsonb)
      WHERE permissions->'assign_task' IS NOT NULL
    `);
    await client.query('INSERT INTO migrations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING', ['add_manager_to_assign_task']);
  }

  if (!appliedSet.has('add_team_lead_to_default_permission_scheme_v2')) {
    await client.query(`
      UPDATE permission_schemes
      SET permissions = '{
        "browse_project": ["Admin", "Manager", "PM", "Team Lead", "Member"],
        "create_task": ["Admin", "PM", "Team Lead", "Member"],
        "edit_task": ["Admin", "PM", "Team Lead", "Assignee"],
        "assign_task": ["Admin", "Manager", "PM", "Team Lead"],
        "delete_task": ["Admin", "PM", "Team Lead"],
        "transition_task": ["Admin", "PM", "Team Lead", "Assignee", "Member"],
        "manage_sprints": ["Admin", "PM", "Team Lead"],
        "manage_releases": ["Admin", "PM", "Team Lead"],
        "manage_members": ["Admin", "PM", "Team Lead"]
      }'::jsonb
      WHERE id = 'scheme_default'
    `);
    await client.query('INSERT INTO migrations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING', [
      'add_team_lead_to_default_permission_scheme_v2',
    ]);
  }

  if (!appliedSet.has('normalize_user_and_message_spaces_v1')) {
    await client.query("UPDATE users SET name = regexp_replace(name, '\\s+', ' ', 'g')");
    await client.query(
      "UPDATE project_messages SET text = regexp_replace(text, 'Isara  chootip', 'Isara chootip', 'g')"
    );
    await client.query(
      "UPDATE project_messages SET text = regexp_replace(text, 'Isara[\\s]{2,8}chootip', 'Isara chootip', 'g')"
    );
    await client.query('INSERT INTO migrations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING', ['normalize_user_and_message_spaces_v1']);
  }

  if (!appliedSet.has('deduplicate_plan_milestones_v1')) {
    const dedupResult = await deduplicateMilestones(client);
    await client.query('INSERT INTO migrations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING', ['deduplicate_plan_milestones_v1']);
    console.log(
      `✅ One-time migration: deduplicated ${dedupResult.mergedGroups} milestone groups (${dedupResult.deletedTasks} excess rows removed).`
    );
  }

  const projectsWithTasksRes = await client.query(`
    SELECT DISTINCT p.id, p.name FROM projects p
    JOIN tasks t ON t.project_id = p.id
    WHERE NOT EXISTS (SELECT 1 FROM project_baselines WHERE project_id = p.id)
  `);

  for (const p of projectsWithTasksRes.rows) {
    const baselineId = 'b_' + Math.random().toString(36).slice(2, 11);
    const createdAt = new Date().toISOString();

    await client.query(
      `INSERT INTO project_baselines (id, project_id, name, description, created_at, is_active)
       VALUES ($1, $2, 'Initial Plan', 'Automatically captured initial workspace plan.', $3, TRUE)`,
      [baselineId, p.id, createdAt]
    );

    const tasksRes = await client.query(
      `SELECT id, title, description, status, priority, estimated_hours, start_date, end_date, story_points, assignee_id, parent_id, sprint_id, release_id
       FROM tasks WHERE project_id = $1`,
      [p.id]
    );
    for (const t of tasksRes.rows) {
      const snapId = 'snap_' + Math.random().toString(36).slice(2, 11);
      await client.query(
        `INSERT INTO task_snapshots (id, baseline_id, task_id, title, description, status, priority, estimated_hours, start_date, end_date, story_points, assignee_id, parent_id, sprint_id, release_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          snapId, baselineId, t.id, t.title, t.description || '', t.status, t.priority,
          t.estimated_hours || 0, t.start_date, t.end_date, t.story_points || 0,
          t.assignee_id, t.parent_id, t.sprint_id, t.release_id,
        ]
      );
    }
  }
};
