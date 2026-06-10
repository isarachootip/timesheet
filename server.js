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
        created_at VARCHAR(50) NOT NULL
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
      createdAt: t.created_at
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

    res.json({ users, projects, tasks, timesheets });
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
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving project:', err);
    res.status(500).json({ error: err.message });
  }
});

// Tasks REST API
app.post('/api/tasks', async (req, res) => {
  const { id, projectId, assigneeId, title, description, status, priority, estimatedHours, createdAt } = req.body;
  try {
    await pool.query(
      `INSERT INTO tasks (id, project_id, assignee_id, title, description, status, priority, estimated_hours, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         project_id = EXCLUDED.project_id,
         assignee_id = EXCLUDED.assignee_id,
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         status = EXCLUDED.status,
         priority = EXCLUDED.priority,
         estimated_hours = EXCLUDED.estimated_hours,
         created_at = EXCLUDED.created_at`,
      [id, projectId, assigneeId, title, description, status, priority, estimatedHours, createdAt]
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

// Wildcard routing to serve React index.html for UI routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
