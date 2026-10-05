import pg from 'pg';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Database Connection
const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool(
  connectionString 
    ? { connectionString, ssl: connectionString.includes('neon') ? { rejectUnauthorized: false } : false }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'timesheet',
      }
);

const dbHost = connectionString 
  ? (connectionString.match(/@([^/:]+)/) ? connectionString.match(/@([^/:]+)/)[1] : 'DATABASE_URL (parsed)')
  : (process.env.DB_HOST || 'localhost');
console.log(`Connecting to PostgreSQL database host: ${dbHost}`);

// Initialize DB schema & seed if empty
const initDB = async () => {
  try {
    const client = await pool.connect();

    // Create Migrations Table (for one-time migrations)
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR(100) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create Users Table
    await client.query(`
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
    `);
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS line_user_id VARCHAR(100) UNIQUE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS wfh_days TEXT[] DEFAULT '{}';
    `);

    // Create Permission Schemes Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS permission_schemes (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        permissions JSONB NOT NULL
      );
    `);

    // Create Projects Table
    await client.query(`
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
    `);
    await client.query(`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS custom_columns JSONB DEFAULT '["To Do", "In Progress", "Review", "Done"]'::jsonb;
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS permission_scheme_id VARCHAR(50);
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type VARCHAR(50) DEFAULT 'dev';
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS support_task_style VARCHAR(50) DEFAULT 'categories';
    `);

    // Create Project Workflows Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_workflows (
        project_id VARCHAR(50) PRIMARY KEY,
        statuses JSONB DEFAULT '["To Do", "In Progress", "Review", "Done"]'::jsonb,
        transitions JSONB DEFAULT '[]'::jsonb
      );
    `);

    // Create Sprints Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sprints (
        id VARCHAR(50) PRIMARY KEY,
        project_id VARCHAR(50) NOT NULL,
        name VARCHAR(150) NOT NULL,
        status VARCHAR(50) NOT NULL,
        start_date VARCHAR(50),
        end_date VARCHAR(50)
      );
    `);

    // Create Releases Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS releases (
        id VARCHAR(50) PRIMARY KEY,
        project_id VARCHAR(50) NOT NULL,
        name VARCHAR(150) NOT NULL,
        status VARCHAR(50) NOT NULL,
        release_date VARCHAR(50)
      );
    `);

    // Create Tasks Table
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
    `);
    await client.query(`
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_id VARCHAR(50);
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date VARCHAR(50);
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS end_date VARCHAR(50);
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sprint_id VARCHAR(50);
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS release_id VARCHAR(50);
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS story_points INTEGER DEFAULT 0;
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS issue_type VARCHAR(50) DEFAULT 'Task';
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at VARCHAR(50);
    `);
    await client.query(`
      UPDATE tasks SET updated_at = created_at WHERE updated_at IS NULL;
    `);

    // Create Task Templates Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS task_templates (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        priority VARCHAR(50) NOT NULL DEFAULT 'Medium',
        start_percent NUMERIC NOT NULL DEFAULT 0,
        end_percent NUMERIC NOT NULL DEFAULT 100,
        estimated_hours NUMERIC NOT NULL DEFAULT 0
      );
    `);

    // Create Project Messages Table (for internal chat)
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_messages (
        id VARCHAR(50) PRIMARY KEY,
        project_id VARCHAR(50) NOT NULL,
        user_id VARCHAR(50) NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`
      ALTER TABLE project_messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
    `);

    // Create Chat Notifications Table (for mentions)
    await client.query(`
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
    `);
    await client.query(`
      ALTER TABLE chat_notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'chat';
    `);

    // Create Timesheets Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS timesheets (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        project_id VARCHAR(50) NOT NULL,
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
    `);
    await client.query(`
      ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS start_time VARCHAR(10);
      ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS end_time VARCHAR(10);
      ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS image_url TEXT;
      ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS work_results TEXT;
      ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS planned_hours NUMERIC;
      ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS updated_at VARCHAR(50);
    `);
    await client.query(`
      UPDATE timesheets SET updated_at = COALESCE(approved_at, date) WHERE updated_at IS NULL;
    `);

    // Create Task Commits Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS task_commits (
        id VARCHAR(50) PRIMARY KEY,
        task_id VARCHAR(50) NOT NULL,
        commit_hash VARCHAR(50) NOT NULL,
        message TEXT,
        author VARCHAR(100),
        timestamp VARCHAR(50)
      );
    `);

    // Create Project Baselines Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_baselines (
        id VARCHAR(50) PRIMARY KEY,
        project_id VARCHAR(50) NOT NULL,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        created_at VARCHAR(50) NOT NULL,
        created_by VARCHAR(50),
        is_active BOOLEAN NOT NULL DEFAULT FALSE
      );
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_active_baseline_per_project 
      ON project_baselines (project_id) 
      WHERE is_active = TRUE;
    `);

    // Create Task Snapshots Table
    await client.query(`
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
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_task_snapshots_baseline ON task_snapshots(baseline_id);
      CREATE INDEX IF NOT EXISTS idx_task_snapshots_task ON task_snapshots(task_id);
    `);

    // Create Cost Rates Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cost_rates (
        id VARCHAR(50) PRIMARY KEY,
        role_name VARCHAR(150) UNIQUE NOT NULL,
        rate_per_day NUMERIC DEFAULT 0,
        rate_per_hour NUMERIC DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'THB'
      );
    `);

    // Create System Settings Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT NOT NULL
      );
    `);

    // Create Personal Notes (Post-it) Table
    await client.query(`
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
    `);

    // Seed default cost rates if table is empty
    const costRatesCount = await client.query('SELECT COUNT(*) FROM cost_rates');
    if (parseInt(costRatesCount.rows[0].count) === 0) {
      console.log('Seeding default cost rates...');
      const defaultRates = [
        { id: 'cr_1', role_name: 'Business Solution Analyst', rate_per_day: 6500, rate_per_hour: 812.5 },
        { id: 'cr_2', role_name: 'Tech Lead / Architecture', rate_per_day: 6500, rate_per_hour: 812.5 },
        { id: 'cr_3', role_name: 'Backend Developer', rate_per_day: 6500, rate_per_hour: 812.5 },
        { id: 'cr_4', role_name: 'Frontend Developer', rate_per_day: 6500, rate_per_hour: 812.5 },
        { id: 'cr_5', role_name: 'Integration Engineer', rate_per_day: 6500, rate_per_hour: 812.5 },
        { id: 'cr_6', role_name: 'Quality Assurance', rate_per_day: 6500, rate_per_hour: 812.5 },
        { id: 'cr_7', role_name: 'Scrum Master / Project', rate_per_day: 6500, rate_per_hour: 812.5 },
        { id: 'cr_8', role_name: 'DevOps / Release Mgmt', rate_per_day: 6500, rate_per_hour: 812.5 },
        { id: 'cr_9', role_name: 'Application Support', rate_per_day: 6500, rate_per_hour: 812.5 },
      ];
      for (const r of defaultRates) {
        await client.query(
          `INSERT INTO cost_rates (id, role_name, rate_per_day, rate_per_hour, currency) VALUES ($1, $2, $3, $4, $5)`,
          [r.id, r.role_name, r.rate_per_day, r.rate_per_hour, 'THB']
        );
      }
    }

    // Seed permission schemes if empty (independent of user count)
    const schemeCount = await client.query('SELECT COUNT(*) FROM permission_schemes');
    if (parseInt(schemeCount.rows[0].count) === 0) {
      console.log('Seeding default permission scheme...');
      const defaultScheme = {
        id: 'scheme_default',
        name: 'Default Permission Scheme',
        description: 'Standard permissions for project members, managers, and admins.',
        permissions: JSON.stringify({
          browse_project: ["Admin", "Manager", "PM", "Team Lead", "Member"],
          create_task: ["Admin", "PM", "Team Lead", "Member"],
          edit_task: ["Admin", "PM", "Team Lead", "Assignee"],
          assign_task: ["Admin", "Manager", "PM", "Team Lead"],
          delete_task: ["Admin", "PM", "Team Lead"],
          transition_task: ["Admin", "PM", "Team Lead", "Assignee", "Member"],
          manage_sprints: ["Admin", "PM", "Team Lead"],
          manage_releases: ["Admin", "PM", "Team Lead"],
          manage_members: ["Admin", "PM", "Team Lead"]
        })
      };
      await client.query(
        'INSERT INTO permission_schemes (id, name, description, permissions) VALUES ($1, $2, $3, $4)',
        [defaultScheme.id, defaultScheme.name, defaultScheme.description, defaultScheme.permissions]
      );
      
      // Update existing projects to link to default scheme if null
      await client.query("UPDATE projects SET permission_scheme_id = 'scheme_default' WHERE permission_scheme_id IS NULL");
    }

    // Seed project workflows if empty (independent of user count)
    const workflowCount = await client.query('SELECT COUNT(*) FROM project_workflows');
    if (parseInt(workflowCount.rows[0].count) === 0) {
      console.log('Seeding default project workflows...');
      const projectsRes = await client.query('SELECT id FROM projects');
      for (const p of projectsRes.rows) {
        const defaultWorkflow = {
          projectId: p.id,
          statuses: JSON.stringify(["To Do", "In Progress", "Review", "Done"]),
          transitions: JSON.stringify([
            { from: "To Do", to: "In Progress", conditions: [] },
            { from: "In Progress", to: "Review", conditions: [] },
            { from: "In Progress", to: "To Do", conditions: [] },
            { from: "Review", to: "Done", conditions: [] },
            { from: "Review", to: "In Progress", conditions: [] },
            { from: "Done", to: "In Progress", conditions: [{ type: "pm_or_admin_only" }] }
          ])
        };
        await client.query(
          'INSERT INTO project_workflows (project_id, statuses, transitions) VALUES ($1, $2, $3) ON CONFLICT (project_id) DO NOTHING',
          [defaultWorkflow.projectId, defaultWorkflow.statuses, defaultWorkflow.transitions]
        );
      }
    }

    // Check if seeding is needed
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) === 0) {
      console.log('Seeding initial data...');
      
      // Seed users
      const mockUsers = [
        { id: 'u1', name: 'John Doe', email: 'john.doe@company.com', avatar: 'https://i.pravatar.cc/150?u=u1', globalRole: 'Manager', department: 'Engineering' },
        { id: 'u2', name: 'Jane Smith', email: 'jane.smith@company.com', avatar: 'https://i.pravatar.cc/150?u=u2', globalRole: 'Employee', department: 'Engineering' },
        { id: 'u3', name: 'Mike Johnson', email: 'mike.j@company.com', avatar: 'https://i.pravatar.cc/150?u=u3', globalRole: 'Employee', department: 'Design' },
        { id: 'u4', name: 'isarachootip', email: 'isarachootip@gmail.com', avatar: 'https://i.pravatar.cc/150?u=u4', globalRole: 'Admin', department: 'Management' }
      ];
      const defaultPwHash = crypto.createHash('sha256').update('password123').digest('hex');
      for (const u of mockUsers) {
        await client.query(
          'INSERT INTO users (id, name, email, avatar, global_role, department, password_hash) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [u.id, u.name, u.email, u.avatar, u.globalRole, u.department, defaultPwHash]
        );
      }

      // Seed permission schemes
      const defaultScheme = {
        id: 'scheme_default',
        name: 'Default Permission Scheme',
        description: 'Standard permissions for project members, managers, and admins.',
        permissions: JSON.stringify({
          browse_project: ["Admin", "Manager", "PM", "Team Lead", "Member"],
          create_task: ["Admin", "PM", "Team Lead", "Member"],
          edit_task: ["Admin", "PM", "Team Lead", "Assignee"],
          assign_task: ["Admin", "Manager", "PM", "Team Lead"],
          delete_task: ["Admin", "PM", "Team Lead"],
          transition_task: ["Admin", "PM", "Team Lead", "Assignee", "Member"],
          manage_sprints: ["Admin", "PM", "Team Lead"],
          manage_releases: ["Admin", "PM", "Team Lead"],
          manage_members: ["Admin", "PM", "Team Lead"]
        })
      };
      await client.query(
        'INSERT INTO permission_schemes (id, name, description, permissions) VALUES ($1, $2, $3, $4)',
        [defaultScheme.id, defaultScheme.name, defaultScheme.description, defaultScheme.permissions]
      );

      // Seed projects
      const mockProjects = [
        {
          id: 'p1',
          name: 'NexTime Internal Tool',
          description: 'Developing the internal project and time management system.',
          status: 'Active',
          startDate: '2026-06-01',
          endDate: '2026-08-30',
          budget: 50000,
          members: JSON.stringify([
            { userId: 'u1', role: 'PM' },
            { userId: 'u2', role: 'Frontend dev' },
            { userId: 'u3', role: 'Designer' }
          ]),
          permissionSchemeId: 'scheme_default'
        },
        {
          id: 'p2',
          name: 'E-Commerce Platform Redesign',
          description: 'Overhauling the client e-commerce portal with modern tech stack.',
          status: 'Planning',
          startDate: '2026-07-15',
          endDate: '2026-10-30',
          budget: 120000,
          members: JSON.stringify([
            { userId: 'u1', role: 'PM' },
            { userId: 'u2', role: 'SA' },
            { userId: 'u3', role: 'Designer' }
          ]),
          permissionSchemeId: 'scheme_default'
        }
      ];
      for (const p of mockProjects) {
        await client.query(
          'INSERT INTO projects (id, name, description, status, start_date, end_date, budget, members, permission_scheme_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [p.id, p.name, p.description, p.status, p.startDate, p.endDate, p.budget, p.members, p.permissionSchemeId]
        );

        // Seed project workflows
        const defaultWorkflow = {
          projectId: p.id,
          statuses: JSON.stringify(["To Do", "In Progress", "Review", "Done"]),
          transitions: JSON.stringify([
            { from: "To Do", to: "In Progress", conditions: [] },
            { from: "In Progress", to: "Review", conditions: [] },
            { from: "In Progress", to: "To Do", conditions: [] },
            { from: "Review", to: "Done", conditions: [] },
            { from: "Review", to: "In Progress", conditions: [] },
            { from: "Done", to: "In Progress", conditions: [{ type: "pm_or_admin_only" }] }
          ])
        };
        await client.query(
          'INSERT INTO project_workflows (project_id, statuses, transitions) VALUES ($1, $2, $3)',
          [defaultWorkflow.projectId, defaultWorkflow.statuses, defaultWorkflow.transitions]
        );
      }

      // Seed tasks
      const mockTasks = [
        { id: 't1', projectId: 'p1', assigneeId: 'u3', title: 'Design UI Mockups', description: 'Create high-fidelity mockups for the dashboard.', status: 'Done', priority: 'High', estimatedHours: 16, createdAt: '2026-06-02T10:00:00Z' },
        { id: 't2', projectId: 'p1', assigneeId: 'u2', title: 'Setup React + Vite Foundation', description: 'Initialize the frontend project and set up routing.', status: 'Done', priority: 'Urgent', estimatedHours: 8, createdAt: '2026-06-03T09:00:00Z' },
        { id: 't3', projectId: 'p1', assigneeId: 'u2', title: 'Implement Task Board', description: 'Create the Kanban board for task management.', status: 'In Progress', priority: 'High', estimatedHours: 24, createdAt: '2026-06-05T11:00:00Z' },
        { id: 't4', projectId: 'p1', assigneeId: 'u1', title: 'Review System Architecture', description: 'Review and approve the system architecture document.', status: 'Review', priority: 'Medium', estimatedHours: 4, createdAt: '2026-06-06T14:00:00Z' }
      ];
      for (const t of mockTasks) {
        await client.query(
          'INSERT INTO tasks (id, project_id, assignee_id, title, description, status, priority, estimated_hours, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [t.id, t.projectId, t.assigneeId, t.title, t.description, t.status, t.priority, t.estimatedHours, t.createdAt]
        );
      }

      // Seed timesheets
      const mockTimesheets = [
        { id: 'ts1', userId: 'u2', projectId: 'p1', taskId: 't2', date: '2026-06-03', hours: 8, description: 'Completed setup and initial routing', status: 'Approved', approvedBy: 'u1', approvedAt: '2026-06-04T09:00:00Z' },
        { id: 'ts2', userId: 'u3', projectId: 'p1', taskId: 't1', date: '2026-06-04', hours: 6, description: 'Worked on dashboard mockups', status: 'Approved', approvedBy: 'u1', approvedAt: '2026-06-05T09:00:00Z' },
        { id: 'ts3', userId: 'u2', projectId: 'p1', taskId: 't3', date: '2026-06-08', hours: 7, description: 'Implemented the base layout for Kanban board', status: 'Pending' },
        { id: 'ts4', userId: 'u2', projectId: 'p1', taskId: 't3', date: '2026-06-09', hours: 5, description: 'Added drag and drop functionality', status: 'Pending' }
      ];
      for (const ts of mockTimesheets) {
        await client.query(
          'INSERT INTO timesheets (id, user_id, project_id, task_id, date, hours, description, status, approved_by, approved_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
          [ts.id, ts.userId, ts.projectId, ts.taskId, ts.date, ts.hours, ts.description, ts.status, ts.approvedBy, ts.approvedAt]
        );
      }
      console.log('Seeding finished successfully.');
    }

    // Seed task templates if empty
    const templateCount = await client.query('SELECT COUNT(*) FROM task_templates');
    if (parseInt(templateCount.rows[0].count) === 0) {
      console.log('Seeding default task templates...');
      const defaultTemplates = [
        { id: 'tpl_1', title: 'Kick off Meeting', description: 'Align project stakeholders, clarify roles, objectives, and communication guidelines.', priority: 'High', start_percent: 0, end_percent: 2, estimated_hours: 4 },
        { id: 'tpl_2', title: 'SOW & Contract Sign off', description: 'Review, negotiate, and execute formal Statement of Work and contract agreements.', priority: 'High', start_percent: 2, end_percent: 6, estimated_hours: 8 },
        { id: 'tpl_3', title: 'Get Requirements & User Stories', description: 'Conduct requirement gathering sessions, detail user stories and acceptances.', priority: 'Medium', start_percent: 6, end_percent: 20, estimated_hours: 16 },
        { id: 'tpl_4', title: 'UX/UI Design & Prototyping', description: 'Design wireframes, mockups, design systems, and clickable prototypes.', priority: 'Medium', start_percent: 20, end_percent: 35, estimated_hours: 24 },
        { id: 'tpl_5', title: 'Setup Cloud Infrastructure & Environments', description: 'Provision servers, networks, PostgreSQL database clusters, SSL certificates, staging environment.', priority: 'Medium', start_percent: 25, end_percent: 32, estimated_hours: 12 },
        { id: 'tpl_6', title: 'API Contract & Backend Architecture Setup', description: 'Structure code repository, setup Express/Database config, write boilerplate APIs.', priority: 'High', start_percent: 32, end_percent: 40, estimated_hours: 16 },
        { id: 'tpl_7', title: 'Core Backend & Frontend Development', description: 'Code the core logic, business logic controllers, database integration, UI state management.', priority: 'High', start_percent: 40, end_percent: 75, estimated_hours: 40 },
        { id: 'tpl_8', title: 'Data Migration & Seeding', description: 'Develop ETL scripts, clean production dataset, perform dry-run imports.', priority: 'Medium', start_percent: 70, end_percent: 75, estimated_hours: 16 },
        { id: 'tpl_9', title: 'SIT (System Integration Testing)', description: 'Conduct end-to-end integration tests, trace network logs, and resolve edge cases.', priority: 'High', start_percent: 75, end_percent: 85, estimated_hours: 16 },
        { id: 'tpl_10', title: 'UAT (User Acceptance Testing)', description: 'User-facing validation testing, gather customer feedback, patch blocking bugs.', priority: 'Urgent', start_percent: 85, end_percent: 95, estimated_hours: 24 },
        { id: 'tpl_11', title: 'Production Release & Handover', description: 'Deploy build artifacts to production, verify functionality, transfer credentials and documentation.', priority: 'Urgent', start_percent: 95, end_percent: 100, estimated_hours: 8 }
      ];
      for (const tpl of defaultTemplates) {
        await client.query(
          'INSERT INTO task_templates (id, title, description, priority, start_percent, end_percent, estimated_hours) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [tpl.id, tpl.title, tpl.description, tpl.priority, tpl.start_percent, tpl.end_percent, tpl.estimated_hours]
        );
      }
      console.log('Seeded default task templates.');
    }

    // Ensure all existing users have a password hash
    const defaultPwHash = crypto.createHash('sha256').update('password123').digest('hex');
    await client.query('UPDATE users SET password_hash = $1 WHERE password_hash IS NULL', [defaultPwHash]);

    // Ensure admin user (isarachootip) exists in production
    const adminEmail = 'isarachootip@gmail.com';
    const adminExists = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (adminExists.rows.length === 0) {
      const adminPwHash = crypto.createHash('sha256').update('password123').digest('hex');
      await client.query(
        `INSERT INTO users (id, name, email, avatar, global_role, department, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name, email = EXCLUDED.email, global_role = EXCLUDED.global_role,
           department = EXCLUDED.department, password_hash = COALESCE(users.password_hash, EXCLUDED.password_hash)`,
        ['u_admin', 'isarachootip', adminEmail, 'https://i.pravatar.cc/150?u=u_admin', 'Admin', 'Management', adminPwHash]
      );
      console.log('✅ Admin user (isarachootip) created.');
    } else {
      // Ensure existing user has Admin role
      await client.query('UPDATE users SET global_role = $1 WHERE email = $2', ['Admin', adminEmail]);
    }

    // ONE-TIME: Set password for all users except isarachootip to 'test123'
    const migrationId = 'set_non_admin_pw_test123';
    const migrationDone = await client.query('SELECT id FROM migrations WHERE id = $1', [migrationId]);
    if (migrationDone.rows.length === 0) {
      const nonAdminPwHash = crypto.createHash('sha256').update('test123').digest('hex');
      await client.query('UPDATE users SET password_hash = $1 WHERE email != $2', [nonAdminPwHash, adminEmail]);
      await client.query('INSERT INTO migrations (id) VALUES ($1)', [migrationId]);
      console.log('✅ One-time migration: set all non-admin passwords to test123.');
    }

    // ONE-TIME: Add Manager to assign_task in default permission scheme
    const migAssign = 'add_manager_to_assign_task';
    const migAssignDone = await client.query('SELECT id FROM migrations WHERE id = $1', [migAssign]);
    if (migAssignDone.rows.length === 0) {
      await client.query(`
        UPDATE permission_schemes 
        SET permissions = jsonb_set(permissions, '{assign_task}', '["Admin", "Manager", "PM"]'::jsonb)
        WHERE permissions->'assign_task' IS NOT NULL
      `);
      await client.query('INSERT INTO migrations (id) VALUES ($1)', [migAssign]);
      console.log('✅ One-time migration: added Manager to assign_task permission.');
    }

    // ONE-TIME: Add Team Lead to default permission scheme
    const migTeamLead = 'add_team_lead_to_default_permission_scheme_v2';
    const migTeamLeadDone = await client.query('SELECT id FROM migrations WHERE id = $1', [migTeamLead]);
    if (migTeamLeadDone.rows.length === 0) {
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
      await client.query('INSERT INTO migrations (id) VALUES ($1)', [migTeamLead]);
      console.log('✅ One-time migration: updated default scheme to include Team Lead role.');
    }

    // ONE-TIME: Normalize double spaces in usernames and messages
    const migNormalizeSpaces = 'normalize_user_and_message_spaces_v1';
    const migNormalizeSpacesDone = await client.query('SELECT id FROM migrations WHERE id = $1', [migNormalizeSpaces]);
    if (migNormalizeSpacesDone.rows.length === 0) {
      await client.query("UPDATE users SET name = regexp_replace(name, '\\s+', ' ', 'g')");
      await client.query("UPDATE project_messages SET text = regexp_replace(text, 'Isara  chootip', 'Isara chootip', 'g')");
      await client.query("UPDATE project_messages SET text = regexp_replace(text, 'Isara[\\s]{2,8}chootip', 'Isara chootip', 'g')");
      await client.query('INSERT INTO migrations (id) VALUES ($1)', [migNormalizeSpaces]);
      console.log('✅ One-time migration: normalized spaces in usernames and messages.');
    }

    // Auto-create initial plan baseline for existing projects with tasks
    const projectsWithTasksRes = await client.query(`
      SELECT DISTINCT p.id, p.name FROM projects p 
      JOIN tasks t ON t.project_id = p.id
      WHERE NOT EXISTS (SELECT 1 FROM project_baselines WHERE project_id = p.id)
    `);
    for (const p of projectsWithTasksRes.rows) {
      console.log(`Auto-generating initial baseline for existing project: ${p.name}`);
      const baselineId = 'b_' + Math.random().toString(36).substr(2, 9);
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
        const snapId = 'snap_' + Math.random().toString(36).substr(2, 9);
        await client.query(
          `INSERT INTO task_snapshots (id, baseline_id, task_id, title, description, status, priority, estimated_hours, start_date, end_date, story_points, assignee_id, parent_id, sprint_id, release_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [snapId, baselineId, t.id, t.title, t.description || '', t.status, t.priority, t.estimated_hours || 0, t.start_date, t.end_date, t.story_points || 0, t.assignee_id, t.parent_id, t.sprint_id, t.release_id]
        );
      }
    }

    client.release();
  } catch (err) {
    console.error('Error initializing database:', err.message);
    throw err;
  }
};

// Start initialization with retry logic
let dbReady = false;
async function startWithRetry(attempt = 1) {
  try {
    await initDB();
    dbReady = true;
    console.log('✅ Database connected and initialized successfully.');
  } catch (err) {
    console.error(`⚠️  DB init attempt ${attempt} failed: ${err.message}`);
    console.log(`🔄 Retrying in 5 seconds...`);
    setTimeout(() => startWithRetry(attempt + 1), 5000);
  }
}
startWithRetry();



export { pool, initDB, dbReady };
