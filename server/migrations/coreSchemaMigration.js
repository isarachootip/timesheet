import { runTrackingSchemaMigration } from './trackingSchemaMigration.js';

export const runCoreSchemaMigration = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id VARCHAR(100) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      avatar TEXT,
      global_role VARCHAR(50) NOT NULL,
      department VARCHAR(100),
      gender VARCHAR(50),
      birthday VARCHAR(50),
      skills TEXT[] DEFAULT '{}'
    );
    ALTER TABLE users ADD COLUMN IF NOT EXISTS line_user_id VARCHAR(100) UNIQUE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS wfh_days TEXT[] DEFAULT '{}';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS ms_user_id VARCHAR(150) UNIQUE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS ms_email VARCHAR(150);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS ms_access_token TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS ms_refresh_token TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS ms_token_expires_at BIGINT;
    UPDATE users SET is_active = TRUE WHERE is_active IS NULL;

    CREATE TABLE IF NOT EXISTS permission_schemes (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT,
      permissions JSONB NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT,
      status VARCHAR(50) NOT NULL,
      start_date VARCHAR(50) NOT NULL,
      end_date VARCHAR(50),
      budget NUMERIC,
      members JSONB DEFAULT '[]'::jsonb
    );
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS custom_columns JSONB DEFAULT '["To Do", "In Progress", "Review", "Done"]'::jsonb;
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS permission_scheme_id VARCHAR(50);
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type VARCHAR(50) DEFAULT 'dev';
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS support_task_style VARCHAR(50) DEFAULT 'categories';

    CREATE TABLE IF NOT EXISTS project_workflows (
      project_id VARCHAR(50) PRIMARY KEY,
      statuses JSONB DEFAULT '["To Do", "In Progress", "Review", "Done"]'::jsonb,
      transitions JSONB DEFAULT '[]'::jsonb
    );

    CREATE TABLE IF NOT EXISTS sprints (
      id VARCHAR(50) PRIMARY KEY,
      project_id VARCHAR(50) NOT NULL,
      name VARCHAR(150) NOT NULL,
      status VARCHAR(50) NOT NULL,
      start_date VARCHAR(50),
      end_date VARCHAR(50)
    );

    CREATE TABLE IF NOT EXISTS releases (
      id VARCHAR(50) PRIMARY KEY,
      project_id VARCHAR(50) NOT NULL,
      name VARCHAR(150) NOT NULL,
      status VARCHAR(50) NOT NULL,
      release_date VARCHAR(50)
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id VARCHAR(50) PRIMARY KEY,
      project_id VARCHAR(50) NOT NULL,
      assignee_id VARCHAR(50),
      title VARCHAR(200) NOT NULL,
      description TEXT,
      status VARCHAR(50) NOT NULL,
      priority VARCHAR(50) NOT NULL,
      estimated_hours NUMERIC NOT NULL DEFAULT 0,
      created_at VARCHAR(50) NOT NULL,
      parent_id VARCHAR(50)
    );
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_id VARCHAR(50);
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date VARCHAR(50);
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS end_date VARCHAR(50);
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sprint_id VARCHAR(50);
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS release_id VARCHAR(50);
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS story_points INTEGER DEFAULT 0;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS issue_type VARCHAR(50) DEFAULT 'Task';
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at VARCHAR(50);
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS outlook_event_id VARCHAR(255);
    CREATE INDEX IF NOT EXISTS idx_tasks_outlook_event_id ON tasks(outlook_event_id);
    UPDATE tasks SET updated_at = created_at WHERE updated_at IS NULL;

    CREATE TABLE IF NOT EXISTS task_templates (
      id VARCHAR(50) PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      priority VARCHAR(50) NOT NULL DEFAULT 'Medium',
      start_percent NUMERIC NOT NULL DEFAULT 0,
      end_percent NUMERIC NOT NULL DEFAULT 100,
      estimated_hours NUMERIC NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS project_messages (
      id VARCHAR(50) PRIMARY KEY,
      project_id VARCHAR(50) NOT NULL,
      user_id VARCHAR(50) NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
    ALTER TABLE project_messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

    CREATE TABLE IF NOT EXISTS chat_notifications (
      id VARCHAR(50) PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      project_id VARCHAR(50) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      message_id VARCHAR(50) NOT NULL REFERENCES project_messages(id) ON DELETE CASCADE,
      sender_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      type VARCHAR(50) DEFAULT 'chat'
    );
    ALTER TABLE chat_notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'chat';
  `);

  await runTrackingSchemaMigration(client);
};
