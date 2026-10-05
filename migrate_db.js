import { pool } from './server/config/db.js';

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Starting DB migration...');

    // 1. Cast VARCHAR dates to TIMESTAMP
    const timestampQueries = [
      'ALTER TABLE tasks ALTER COLUMN created_at TYPE TIMESTAMP USING NULLIF(created_at, \'\')::TIMESTAMP',
      'ALTER TABLE tasks ALTER COLUMN updated_at TYPE TIMESTAMP USING NULLIF(updated_at, \'\')::TIMESTAMP',
      'ALTER TABLE timesheets ALTER COLUMN approved_at TYPE TIMESTAMP USING NULLIF(approved_at, \'\')::TIMESTAMP',
      'ALTER TABLE project_baselines ALTER COLUMN created_at TYPE TIMESTAMP USING NULLIF(created_at, \'\')::TIMESTAMP',
    ];
    for (const q of timestampQueries) {
      console.log(`Executing: ${q}`);
      await client.query(q);
    }

    // 2. Cast VARCHAR dates to DATE
    const dateQueries = [
      'ALTER TABLE projects ALTER COLUMN start_date TYPE DATE USING NULLIF(start_date, \'\')::DATE',
      'ALTER TABLE projects ALTER COLUMN end_date TYPE DATE USING NULLIF(end_date, \'\')::DATE',
      'ALTER TABLE sprints ALTER COLUMN start_date TYPE DATE USING NULLIF(start_date, \'\')::DATE',
      'ALTER TABLE sprints ALTER COLUMN end_date TYPE DATE USING NULLIF(end_date, \'\')::DATE',
      'ALTER TABLE releases ALTER COLUMN release_date TYPE DATE USING NULLIF(release_date, \'\')::DATE',
      'ALTER TABLE timesheets ALTER COLUMN date TYPE DATE USING NULLIF(date, \'\')::DATE',
    ];
    for (const q of dateQueries) {
      console.log(`Executing: ${q}`);
      await client.query(q);
    }

    // 3. Add Foreign Keys safely
    // Drop existing if they accidentally exist
    const fkQueries = [
      // Tasks
      'ALTER TABLE tasks DROP CONSTRAINT IF EXISTS fk_tasks_project, ADD CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE',
      'ALTER TABLE tasks DROP CONSTRAINT IF EXISTS fk_tasks_assignee, ADD CONSTRAINT fk_tasks_assignee FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL',
      // Sprints & Releases
      'ALTER TABLE sprints DROP CONSTRAINT IF EXISTS fk_sprints_project, ADD CONSTRAINT fk_sprints_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE',
      'ALTER TABLE releases DROP CONSTRAINT IF EXISTS fk_releases_project, ADD CONSTRAINT fk_releases_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE',
      // Timesheets
      'ALTER TABLE timesheets DROP CONSTRAINT IF EXISTS fk_ts_user, ADD CONSTRAINT fk_ts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE',
      'ALTER TABLE timesheets DROP CONSTRAINT IF EXISTS fk_ts_project, ADD CONSTRAINT fk_ts_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE',
      'ALTER TABLE timesheets DROP CONSTRAINT IF EXISTS fk_ts_task, ADD CONSTRAINT fk_ts_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL',
      'ALTER TABLE timesheets DROP CONSTRAINT IF EXISTS fk_ts_approved_by, ADD CONSTRAINT fk_ts_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL',
    ];
    for (const q of fkQueries) {
      console.log(`Executing: ${q}`);
      await client.query(q);
    }

    await client.query('COMMIT');
    console.log('✅ Database migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

migrate();
