export const runTrackingSchemaMigration = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS timesheets (
      id VARCHAR(50) PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      project_id VARCHAR(50),
      task_id VARCHAR(50),
      date VARCHAR(50) NOT NULL,
      hours NUMERIC NOT NULL,
      start_time VARCHAR(10),
      end_time VARCHAR(10),
      description TEXT,
      status VARCHAR(50) NOT NULL,
      approved_by VARCHAR(50),
      approved_at VARCHAR(50)
    );
    ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS start_time VARCHAR(10);
    ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS end_time VARCHAR(10);
    ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS image_url TEXT;
    ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS work_results TEXT;
    ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS planned_hours NUMERIC;
    ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS updated_at VARCHAR(50);
    ALTER TABLE timesheets ALTER COLUMN project_id DROP NOT NULL;
    ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS is_personal BOOLEAN DEFAULT FALSE;
    UPDATE timesheets SET updated_at = COALESCE(approved_at::text, date::text) WHERE updated_at IS NULL;

    CREATE TABLE IF NOT EXISTS task_commits (
      id VARCHAR(50) PRIMARY KEY,
      task_id VARCHAR(50) NOT NULL,
      commit_hash VARCHAR(50) NOT NULL,
      message TEXT,
      author VARCHAR(100),
      timestamp VARCHAR(50)
    );

    CREATE TABLE IF NOT EXISTS project_baselines (
      id VARCHAR(50) PRIMARY KEY,
      project_id VARCHAR(50) NOT NULL,
      name VARCHAR(150) NOT NULL,
      description TEXT,
      created_at VARCHAR(50) NOT NULL,
      created_by VARCHAR(50),
      is_active BOOLEAN NOT NULL DEFAULT FALSE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_active_baseline_per_project
      ON project_baselines (project_id) WHERE is_active = TRUE;

    CREATE TABLE IF NOT EXISTS task_snapshots (
      id VARCHAR(50) PRIMARY KEY,
      baseline_id VARCHAR(50) NOT NULL,
      task_id VARCHAR(50) NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      status VARCHAR(50) NOT NULL,
      priority VARCHAR(50) NOT NULL,
      estimated_hours NUMERIC NOT NULL DEFAULT 0,
      start_date VARCHAR(50),
      end_date VARCHAR(50),
      story_points INTEGER DEFAULT 0,
      assignee_id VARCHAR(50),
      parent_id VARCHAR(50),
      sprint_id VARCHAR(50),
      release_id VARCHAR(50)
    );
    CREATE INDEX IF NOT EXISTS idx_task_snapshots_baseline ON task_snapshots(baseline_id);
    CREATE INDEX IF NOT EXISTS idx_task_snapshots_task ON task_snapshots(task_id);

    CREATE TABLE IF NOT EXISTS cost_rates (
      id VARCHAR(50) PRIMARY KEY,
      role_name VARCHAR(150) UNIQUE NOT NULL,
      rate_per_day NUMERIC DEFAULT 0,
      rate_per_hour NUMERIC DEFAULT 0,
      currency VARCHAR(10) DEFAULT 'THB'
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS personal_notes (
      id VARCHAR(50) PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      content TEXT DEFAULT '',
      note_date VARCHAR(50) NOT NULL,
      due_date VARCHAR(50),
      color VARCHAR(50) DEFAULT 'yellow',
      is_completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_personal_notes_user_id ON personal_notes(user_id);
    ALTER TABLE personal_notes ADD COLUMN IF NOT EXISTS work_type VARCHAR(20) DEFAULT 'personal';
    ALTER TABLE personal_notes ADD COLUMN IF NOT EXISTS project_id VARCHAR(50) REFERENCES projects(id) ON DELETE SET NULL;
    ALTER TABLE personal_notes ADD COLUMN IF NOT EXISTS task_id VARCHAR(50) REFERENCES tasks(id) ON DELETE SET NULL;
    ALTER TABLE personal_notes ADD COLUMN IF NOT EXISTS timesheet_id VARCHAR(50) REFERENCES timesheets(id) ON DELETE SET NULL;
  `);
};
