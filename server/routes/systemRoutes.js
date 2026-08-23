import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// Permission Schemes API
router.get('/api/permission-schemes', async (req, res) => {
  try {
    const schemesRes = await pool.query('SELECT * FROM permission_schemes');
    const schemes = schemesRes.rows.map(ps => ({
      id: ps.id,
      name: ps.name,
      description: ps.description,
      permissions: ps.permissions
    }));
    res.json(schemes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/permission-schemes', async (req, res) => {
  const { id, name, description, permissions } = req.body;
  const userId = req.headers['x-user-id'];
  try {
    if (userId) {
      const userRes = await pool.query('SELECT global_role FROM users WHERE id = $1', [userId]);
      if (userRes.rows[0]?.global_role !== 'Admin') {
        return res.status(403).json({ error: 'Permission denied: Only global Admins can manage permission schemes.' });
      }
    }
    
    await pool.query(
      `INSERT INTO permission_schemes (id, name, description, permissions)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         permissions = EXCLUDED.permissions`,
      [id, name, description, JSON.stringify(permissions)]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/api/permission-schemes/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.headers['x-user-id'];
  try {
    if (userId) {
      const userRes = await pool.query('SELECT global_role FROM users WHERE id = $1', [userId]);
      if (userRes.rows[0]?.global_role !== 'Admin') {
        return res.status(403).json({ error: 'Permission denied: Only global Admins can manage permission schemes.' });
      }
    }
    if (id === 'scheme_default') {
      return res.status(400).json({ error: 'Cannot delete the default permission scheme.' });
    }
    await pool.query('DELETE FROM permission_schemes WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Task Templates REST API
router.post('/api/task-templates', async (req, res) => {
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

router.delete('/api/task-templates/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM task_templates WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting task template:', err);
    res.status(500).json({ error: err.message });
  }
});


// Cost Rates REST API
router.post('/api/cost-rates', async (req, res) => {
  const { id, roleName, ratePerDay, ratePerHour, currency } = req.body;
  try {
    await pool.query(
      `INSERT INTO cost_rates (id, role_name, rate_per_day, rate_per_hour, currency)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         role_name = EXCLUDED.role_name,
         rate_per_day = EXCLUDED.rate_per_day,
         rate_per_hour = EXCLUDED.rate_per_hour,
         currency = EXCLUDED.currency`,
      [id, roleName, ratePerDay, ratePerHour, currency || 'THB']
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving cost rate:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/api/cost-rates/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM cost_rates WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting cost rate:', err);
    res.status(500).json({ error: err.message });
  }
});


// --- System Settings API ---
router.get('/api/system-settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT setting_key, setting_value FROM system_settings');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    res.json(settings);
  } catch (err) {
    console.error('Error fetching system settings:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/system-settings', async (req, res) => {
  const settings = req.body; // e.g. { openai_api_key: 'sk-...' }
  try {
    // We can iterate and upsert each key
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(`
        INSERT INTO system_settings (setting_key, setting_value)
        VALUES ($1, $2)
        ON CONFLICT (setting_key) DO UPDATE
        SET setting_value = EXCLUDED.setting_value
      `, [key, value]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving system settings:', err);
    res.status(500).json({ error: err.message });
  }
});


// DB Connection Diagnostics API
router.get('/api/db-status', async (req, res) => {
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

// ==========================================

// Clean / Reset Tasks Data API (Admin Only)
// Deletes: tasks, sprints, releases, timesheets, milestones, baselines, task_snapshots, task_commits
// Keeps: projects, users, settings, workflows, permission_schemes, cost_rates, task_templates
// ==========================================
router.post('/api/clean-tasks', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is Admin
    const userRes = await pool.query('SELECT global_role FROM users WHERE id = $1', [userId]);
    if (!userRes.rows[0] || userRes.rows[0].global_role !== 'Admin') {
      return res.status(403).json({ error: 'Only Admin can perform this action' });
    }

    // Count existing records before deletion (for summary)
    const counts = {};
    const tables = ['tasks', 'sprints', 'releases', 'timesheets', 'project_baselines', 'task_snapshots', 'task_commits'];
    for (const table of tables) {
      const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      counts[table] = parseInt(result.rows[0].count);
    }

    // Delete in correct order (respecting potential FK relationships)
    await pool.query('DELETE FROM task_snapshots');
    await pool.query('DELETE FROM project_baselines');
    await pool.query('DELETE FROM task_commits');
    await pool.query('DELETE FROM timesheets');
    await pool.query('DELETE FROM tasks');
    await pool.query('DELETE FROM sprints');
    await pool.query('DELETE FROM releases');

    console.log('🧹 Clean-tasks executed by user:', userId);
    console.log('   Deleted:', counts);

    res.json({
      success: true,
      message: 'All task-related data has been cleaned successfully',
      deleted: counts
    });
  } catch (err) {
    console.error('Error cleaning tasks:', err);
    res.status(500).json({ error: 'Failed to clean tasks', details: err.message });
  }
});




export default router;
