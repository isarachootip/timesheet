import express from 'express';
import cors from 'cors';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support base64 image uploads

// Serve React build static assets
app.use(express.static(path.join(__dirname, 'dist')));

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

    // Create Timesheets Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS timesheets (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        project_id VARCHAR(50) NOT NULL,
        task_id VARCHAR(50),
        date VARCHAR(50) NOT NULL,
        hours NUMERIC NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL,
        approved_by VARCHAR(50),
        approved_at VARCHAR(50)
      );
    `);

    // Check if seeding is needed
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) === 0) {
      console.log('Seeding initial data...');
      
      // Seed users
      const mockUsers = [
        { id: 'u1', name: 'John Doe', email: 'john.doe@company.com', avatar: 'https://i.pravatar.cc/150?u=u1', globalRole: 'Manager', department: 'Engineering' },
        { id: 'u2', name: 'Jane Smith', email: 'jane.smith@company.com', avatar: 'https://i.pravatar.cc/150?u=u2', globalRole: 'Employee', department: 'Engineering' },
        { id: 'u3', name: 'Mike Johnson', email: 'mike.j@company.com', avatar: 'https://i.pravatar.cc/150?u=u3', globalRole: 'Employee', department: 'Design' },
        { id: 'u4', name: 'Sarah Williams', email: 'sarah.w@company.com', avatar: 'https://i.pravatar.cc/150?u=u4', globalRole: 'Admin', department: 'HR' }
      ];
      for (const u of mockUsers) {
        await client.query(
          'INSERT INTO users (id, name, email, avatar, global_role, department) VALUES ($1, $2, $3, $4, $5, $6)',
          [u.id, u.name, u.email, u.avatar, u.globalRole, u.department]
        );
      }

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
          ])
        },
        {
          id: 'p2',
          name: 'E-Commerce Platform Redesign',
          description: 'Overhauling the client e-commerce portal with modern tech stack.',
          status: 'Planning',
          startDate: '2026-07-15',
          members: JSON.stringify([
            { userId: 'u1', role: 'PM' },
            { userId: 'u2', role: 'SA' },
            { userId: 'u3', role: 'Designer' }
          ])
        }
      ];
      for (const p of mockProjects) {
        await client.query(
          'INSERT INTO projects (id, name, description, status, start_date, end_date, budget, members) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [p.id, p.name, p.description, p.status, p.startDate, p.endDate, p.budget, p.members]
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

    client.release();
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

// Start initialization
initDB();

// --- API Endpoints ---

// Initial load
app.get('/api/initial-data', async (req, res) => {
  try {
    const usersRes = await pool.query('SELECT * FROM users');
    const projectsRes = await pool.query('SELECT * FROM projects');
    const tasksRes = await pool.query('SELECT * FROM tasks');
    const timesheetsRes = await pool.query('SELECT * FROM timesheets');
    const templatesRes = await pool.query('SELECT * FROM task_templates');

    // Map DB column casing to JS camelCase
    const users = usersRes.rows.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      globalRole: u.global_role,
      department: u.department,
      gender: u.gender,
      birthday: u.birthday,
      skills: u.skills
    }));

    const projects = projectsRes.rows.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      startDate: p.start_date,
      endDate: p.end_date,
      budget: parseFloat(p.budget || '0'),
      members: p.members
    }));

    const tasks = tasksRes.rows.map(t => ({
      id: t.id,
      projectId: t.project_id,
      assigneeId: t.assignee_id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      estimatedHours: parseFloat(t.estimated_hours || '0'),
      createdAt: t.created_at,
      parentId: t.parent_id,
      startDate: t.start_date,
      endDate: t.end_date
    }));

    const timesheets = timesheetsRes.rows.map(ts => ({
      id: ts.id,
      userId: ts.user_id,
      projectId: ts.project_id,
      taskId: ts.task_id,
      date: ts.date,
      hours: parseFloat(ts.hours || '0'),
      description: ts.description,
      status: ts.status,
      approvedBy: ts.approved_by,
      approvedAt: ts.approved_at
    }));

    const taskTemplates = templatesRes.rows.map(tpl => ({
      id: tpl.id,
      title: tpl.title,
      description: tpl.description,
      priority: tpl.priority,
      startPercent: parseFloat(tpl.start_percent || '0'),
      endPercent: parseFloat(tpl.end_percent || '100'),
      estimatedHours: parseFloat(tpl.estimated_hours || '0')
    }));

    res.json({ users, projects, tasks, timesheets, taskTemplates });
  } catch (err) {
    console.error('Error fetching initial data:', err);
    res.status(500).json({ error: err.message });
  }
});

// Users REST API
app.post('/api/users', async (req, res) => {
  const { id, name, email, avatar, globalRole, department, gender, birthday, skills } = req.body;
  try {
    await pool.query(
      `INSERT INTO users (id, name, email, avatar, global_role, department, gender, birthday, skills)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         email = EXCLUDED.email,
         avatar = EXCLUDED.avatar,
         global_role = EXCLUDED.global_role,
         department = EXCLUDED.department,
         gender = EXCLUDED.gender,
         birthday = EXCLUDED.birthday,
         skills = EXCLUDED.skills`,
      [id, name, email, avatar, globalRole, department, gender, birthday, skills]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving user:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: err.message });
  }
});

// Projects REST API
app.post('/api/projects', async (req, res) => {
  const { id, name, description, status, startDate, endDate, budget, members } = req.body;
  try {
    const checkExist = await pool.query('SELECT 1 FROM projects WHERE id = $1', [id]);
    const isNew = checkExist.rows.length === 0;

    await pool.query(
      `INSERT INTO projects (id, name, description, status, start_date, end_date, budget, members)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         status = EXCLUDED.status,
         start_date = EXCLUDED.start_date,
         end_date = EXCLUDED.end_date,
         budget = EXCLUDED.budget,
         members = EXCLUDED.members`,
      [id, name, description, status, startDate, endDate, budget, JSON.stringify(members)]
    );

    // Auto-generate main tasks from templates for new projects
    if (isNew && startDate && endDate) {
      const templates = await pool.query('SELECT * FROM task_templates');
      const startD = new Date(startDate);
      const endD = new Date(endDate);
      const totalMs = endD.getTime() - startD.getTime();
      
      for (const tpl of templates.rows) {
        // Calculate proportional start and end dates
        const taskStartMs = startD.getTime() + (totalMs * parseFloat(tpl.start_percent) / 100);
        const taskEndMs = startD.getTime() + (totalMs * parseFloat(tpl.end_percent) / 100);
        
        // Format as YYYY-MM-DD
        const taskStartStr = new Date(taskStartMs).toISOString().split('T')[0];
        const taskEndStr = new Date(taskEndMs).toISOString().split('T')[0];
        
        const taskId = 't_' + Math.random().toString(36).substr(2, 9);
        await pool.query(
          `INSERT INTO tasks (id, project_id, assignee_id, title, description, status, priority, estimated_hours, created_at, start_date, end_date)
           VALUES ($1, $2, NULL, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            taskId,
            id,
            tpl.title,
            tpl.description || '',
            'To Do',
            tpl.priority || 'Medium',
            parseFloat(tpl.estimated_hours || '0'),
            new Date().toISOString(),
            taskStartStr,
            taskEndStr
          ]
        );
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error saving project:', err);
    res.status(500).json({ error: err.message });
  }
});

// Tasks REST API
app.post('/api/tasks', async (req, res) => {
  const { id, projectId, assigneeId, title, description, status, priority, estimatedHours, createdAt, parentId, startDate, endDate } = req.body;
  try {
    await pool.query(
      `INSERT INTO tasks (id, project_id, assignee_id, title, description, status, priority, estimated_hours, created_at, parent_id, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET
         project_id = EXCLUDED.project_id,
         assignee_id = EXCLUDED.assignee_id,
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         status = EXCLUDED.status,
         priority = EXCLUDED.priority,
         estimated_hours = EXCLUDED.estimated_hours,
         created_at = EXCLUDED.created_at,
         parent_id = EXCLUDED.parent_id,
         start_date = EXCLUDED.start_date,
         end_date = EXCLUDED.end_date`,
      [id, projectId, assigneeId, title, description, status, priority, estimatedHours, createdAt, parentId || null, startDate || null, endDate || null]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving task:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: err.message });
  }
});

// Timesheets REST API
app.post('/api/timesheets', async (req, res) => {
  const { id, userId, projectId, taskId, date, hours, description, status, approvedBy, approvedAt } = req.body;
  try {
    await pool.query(
      `INSERT INTO timesheets (id, user_id, project_id, task_id, date, hours, description, status, approved_by, approved_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         project_id = EXCLUDED.project_id,
         task_id = EXCLUDED.task_id,
         date = EXCLUDED.date,
         hours = EXCLUDED.hours,
         description = EXCLUDED.description,
         status = EXCLUDED.status,
         approved_by = EXCLUDED.approved_by,
         approved_at = EXCLUDED.approved_at`,
      [id, userId, projectId, taskId, date, hours, description, status, approvedBy, approvedAt]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving timesheet:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/timesheets/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM timesheets WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting timesheet:', err);
    res.status(500).json({ error: err.message });
  }
});

// Task Templates REST API
app.post('/api/task-templates', async (req, res) => {
  const { id, title, description, priority, startPercent, endPercent, estimatedHours } = req.body;
  try {
    await pool.query(
      `INSERT INTO task_templates (id, title, description, priority, start_percent, end_percent, estimated_hours)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         priority = EXCLUDED.priority,
         start_percent = EXCLUDED.start_percent,
         end_percent = EXCLUDED.end_percent,
         estimated_hours = EXCLUDED.estimated_hours`,
      [id, title, description, priority, startPercent, endPercent, estimatedHours]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving task template:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/task-templates/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM task_templates WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting task template:', err);
    res.status(500).json({ error: err.message });
  }
});

// DB Connection Diagnostics API
app.get('/api/db-status', async (req, res) => {
  try {
    const host = connectionString 
      ? (connectionString.match(/@([^/:]+)/) ? connectionString.match(/@([^/:]+)/)[1] : 'DATABASE_URL')
      : (process.env.DB_HOST || 'localhost');
    
    const testRes = await pool.query('SELECT NOW()');
    res.json({
      connected: true,
      host: host,
      time: testRes.rows[0].now,
      usingConnectionString: !!connectionString
    });
  } catch (err) {
    res.json({
      connected: false,
      error: err.message
    });
  }
});

// Fallback: serve React index.html for all non-API routes (SPA routing)
// Using app.use instead of app.get('/(.*)', ...) to avoid path-to-regexp v6 incompatibility
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
