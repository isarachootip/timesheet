import express from 'express';
import { pool } from '../config/db.js';
import { checkPermission, validateTransition } from './projectRoutes.js';

const router = express.Router();

// Tasks REST API
router.post('/api/tasks', async (req, res) => {
  const { id, projectId, assigneeId, title, description, status, priority, estimatedHours, createdAt, parentId, startDate, endDate, sprintId, releaseId, storyPoints, issueType } = req.body;
  const userId = req.headers['x-user-id'];
  try {
    // Check if it is an update
    const oldTaskRes = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    const oldTask = oldTaskRes.rows[0];

    if (userId) {
      if (oldTask) {
        // Edit Validation
        const hasEditPermission = await checkPermission(userId, projectId, 'edit_task', oldTask);
        if (!hasEditPermission) {
          return res.status(403).json({ error: 'Permission denied: You do not have permission to edit tasks in this project.' });
        }

        // Transition Validation if status changes
        if (oldTask.status !== status) {
          const hasTransPermission = await checkPermission(userId, projectId, 'transition_task', oldTask);
          if (!hasTransPermission) {
            return res.status(403).json({ error: 'Permission denied: You do not have permission to transition tasks in this project.' });
          }

          const transResult = await validateTransition(userId, projectId, oldTask, status);
          if (!transResult.allowed) {
            return res.status(400).json({ error: transResult.reason });
          }
        }
      } else {
        // Create Validation
        const hasCreatePermission = await checkPermission(userId, projectId, 'create_task');
        if (!hasCreatePermission) {
          return res.status(403).json({ error: 'Permission denied: You do not have permission to create tasks in this project.' });
        }
      }
    }

    const updatedAt = req.body.updatedAt || new Date().toISOString();

    await pool.query(
      `INSERT INTO tasks (id, project_id, assignee_id, title, description, status, priority, estimated_hours, created_at, parent_id, start_date, end_date, sprint_id, release_id, story_points, issue_type, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
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
         end_date = EXCLUDED.end_date,
         sprint_id = EXCLUDED.sprint_id,
         release_id = EXCLUDED.release_id,
         story_points = EXCLUDED.story_points,
         issue_type = EXCLUDED.issue_type,
         updated_at = EXCLUDED.updated_at`,
      [
        id, 
        projectId, 
        assigneeId, 
        title, 
        description, 
        status, 
        priority, 
        estimatedHours, 
        createdAt, 
        parentId || null, 
        startDate || null, 
        endDate || null,
        sprintId || null,
        releaseId || null,
        storyPoints || 0,
        issueType || 'Task',
        updatedAt
      ]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving task:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.headers['x-user-id'];
  try {
    const taskRes = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    const task = taskRes.rows[0];
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (userId) {
      const hasPermission = await checkPermission(userId, task.project_id, 'delete_task', task);
      if (!hasPermission) {
        return res.status(403).json({ error: 'Permission denied: You do not have permission to delete tasks in this project.' });
      }
    }

    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: err.message });
  }
});


// Sprints REST API
router.post('/api/sprints', async (req, res) => {
  const { id, projectId, name, status, startDate, endDate } = req.body;
  const userId = req.headers['x-user-id'];
  try {
    if (userId) {
      const hasPermission = await checkPermission(userId, projectId, 'manage_sprints');
      if (!hasPermission) {
        return res.status(403).json({ error: 'Permission denied: You do not have permission to manage sprints in this project.' });
      }
    }

    await pool.query(
      `INSERT INTO sprints (id, project_id, name, status, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         project_id = EXCLUDED.project_id,
         name = EXCLUDED.name,
         status = EXCLUDED.status,
         start_date = EXCLUDED.start_date,
         end_date = EXCLUDED.end_date`,
      [id, projectId, name, status, startDate || null, endDate || null]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving sprint:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/api/sprints/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.headers['x-user-id'];
  try {
    const sprintRes = await pool.query('SELECT * FROM sprints WHERE id = $1', [id]);
    const sprint = sprintRes.rows[0];
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    if (userId) {
      const hasPermission = await checkPermission(userId, sprint.project_id, 'manage_sprints');
      if (!hasPermission) {
        return res.status(403).json({ error: 'Permission denied: You do not have permission to manage sprints in this project.' });
      }
    }

    await pool.query('DELETE FROM sprints WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting sprint:', err);
    res.status(500).json({ error: err.message });
  }
});


// Releases REST API
router.post('/api/releases', async (req, res) => {
  const { id, projectId, name, status, releaseDate } = req.body;
  const userId = req.headers['x-user-id'];
  try {
    if (userId) {
      const hasPermission = await checkPermission(userId, projectId, 'manage_releases');
      if (!hasPermission) {
        return res.status(403).json({ error: 'Permission denied: You do not have permission to manage releases in this project.' });
      }
    }

    await pool.query(
      `INSERT INTO releases (id, project_id, name, status, release_date)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         project_id = EXCLUDED.project_id,
         name = EXCLUDED.name,
         status = EXCLUDED.status,
         release_date = EXCLUDED.release_date`,
      [id, projectId, name, status, releaseDate || null]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving release:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/api/releases/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.headers['x-user-id'];
  try {
    const releaseRes = await pool.query('SELECT * FROM releases WHERE id = $1', [id]);
    const release = releaseRes.rows[0];
    if (!release) return res.status(404).json({ error: 'Release not found' });

    if (userId) {
      const hasPermission = await checkPermission(userId, release.project_id, 'manage_releases');
      if (!hasPermission) {
        return res.status(403).json({ error: 'Permission denied: You do not have permission to manage releases in this project.' });
      }
    }

    await pool.query('DELETE FROM releases WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting release:', err);
    res.status(500).json({ error: err.message });
  }
});


// Task Commits API
router.get('/api/tasks/:taskId/commits', async (req, res) => {
  const { taskId } = req.params;
  try {
    const commitsRes = await pool.query('SELECT * FROM task_commits WHERE task_id = $1 ORDER BY timestamp DESC', [taskId]);
    const commits = commitsRes.rows.map(c => ({
      id: c.id,
      taskId: c.task_id,
      commitHash: c.commit_hash,
      message: c.message,
      author: c.author,
      timestamp: c.timestamp
    }));
    res.json(commits);
  } catch (err) {
    console.error('Error fetching commits:', err);
    res.status(500).json({ error: err.message });
  }
});


export default router;
