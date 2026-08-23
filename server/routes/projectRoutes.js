import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// Project Baselines & Versioning API
// ==========================================

const generateId = (prefix) => prefix + '_' + Math.random().toString(36).substr(2, 9);

// 1. Get all baselines for a project
router.get('/api/projects/:projectId/baselines', async (req, res) => {
  const { projectId } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, project_id as "projectId", name, description, created_at as "createdAt", created_by as "createdBy", is_active as "isActive" 
       FROM project_baselines 
       WHERE project_id = $1 
       ORDER BY created_at DESC`,
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching project baselines:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Create a project plan baseline (Snapshot current tasks)
router.post('/api/projects/:projectId/baselines', async (req, res) => {
  const { projectId } = req.params;
  const { name, description } = req.body;
  const userId = req.headers['x-user-id'];
  const baselineId = generateId('b');
  const createdAt = new Date().toISOString();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO project_baselines (id, project_id, name, description, created_at, created_by, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE)`,
      [baselineId, projectId, name, description || '', createdAt, userId || null]
    );

    const tasksRes = await client.query(
      `SELECT id, title, description, status, priority, estimated_hours, start_date, end_date, story_points, assignee_id, parent_id, sprint_id, release_id 
       FROM tasks WHERE project_id = $1`,
      [projectId]
    );

    for (const task of tasksRes.rows) {
      const snapshotId = generateId('snap');
      await client.query(
        `INSERT INTO task_snapshots (id, baseline_id, task_id, title, description, status, priority, estimated_hours, start_date, end_date, story_points, assignee_id, parent_id, sprint_id, release_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          snapshotId,
          baselineId,
          task.id,
          task.title,
          task.description || '',
          task.status,
          task.priority,
          task.estimated_hours || 0,
          task.start_date,
          task.end_date,
          task.story_points || 0,
          task.assignee_id,
          task.parent_id,
          task.sprint_id,
          task.release_id
        ]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, baselineId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating plan baseline:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// 3. Activate a project baseline (Workspace Swapping)
router.put('/api/projects/:projectId/baselines/:baselineId/activate', async (req, res) => {
  const { projectId, baselineId } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const baselineCheck = await client.query(
      'SELECT id, name FROM project_baselines WHERE id = $1 AND project_id = $2',
      [baselineId, projectId]
    );
    if (baselineCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Target baseline not found' });
    }

    const currentActiveRes = await client.query(
      'SELECT id FROM project_baselines WHERE project_id = $1 AND is_active = TRUE',
      [projectId]
    );
    
    if (currentActiveRes.rows.length > 0) {
      const activeId = currentActiveRes.rows[0].id;
      await client.query('DELETE FROM task_snapshots WHERE baseline_id = $1', [activeId]);
      
      const liveTasksRes = await client.query(
        `SELECT id, title, description, status, priority, estimated_hours, start_date, end_date, story_points, assignee_id, parent_id, sprint_id, release_id 
         FROM tasks WHERE project_id = $1`,
        [projectId]
      );
      
      for (const t of liveTasksRes.rows) {
        await client.query(
          `INSERT INTO task_snapshots (id, baseline_id, task_id, title, description, status, priority, estimated_hours, start_date, end_date, story_points, assignee_id, parent_id, sprint_id, release_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [generateId('snap'), activeId, t.id, t.title, t.description || '', t.status, t.priority, t.estimated_hours || 0, t.start_date, t.end_date, t.story_points || 0, t.assignee_id, t.parent_id, t.sprint_id, t.release_id]
        );
      }
    }

    const snapshotsRes = await client.query(
      `SELECT task_id, title, description, status, priority, estimated_hours, start_date, end_date, story_points, assignee_id, parent_id, sprint_id, release_id 
       FROM task_snapshots WHERE baseline_id = $1`,
      [baselineId]
    );

    if (snapshotsRes.rows.length > 0) {
      const targetTaskIds = snapshotsRes.rows.map(s => s.task_id);
      
      await client.query(
        'DELETE FROM tasks WHERE project_id = $1 AND id NOT IN (SELECT unnest($2::varchar[]))',
        [projectId, targetTaskIds]
      );

      const createdAt = new Date().toISOString();
      for (const snap of snapshotsRes.rows) {
        await client.query(
          `INSERT INTO tasks (id, project_id, assignee_id, title, description, status, priority, estimated_hours, created_at, start_date, end_date, story_points, parent_id, sprint_id, release_id, issue_type)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'Task')
           ON CONFLICT (id) DO UPDATE SET
             assignee_id = EXCLUDED.assignee_id,
             title = EXCLUDED.title,
             description = EXCLUDED.description,
             status = EXCLUDED.status,
             priority = EXCLUDED.priority,
             estimated_hours = EXCLUDED.estimated_hours,
             start_date = EXCLUDED.start_date,
             end_date = EXCLUDED.end_date,
             story_points = EXCLUDED.story_points,
             parent_id = EXCLUDED.parent_id,
             sprint_id = EXCLUDED.sprint_id,
             release_id = EXCLUDED.release_id`,
          [
            snap.task_id,
            projectId,
            snap.assignee_id,
            snap.title,
            snap.description || '',
            snap.status,
            snap.priority,
            snap.estimated_hours || 0,
            createdAt,
            snap.start_date,
            snap.end_date,
            snap.story_points || 0,
            snap.parent_id,
            snap.sprint_id,
            snap.release_id
          ]
        );
      }
    }

    await client.query('UPDATE project_baselines SET is_active = FALSE WHERE project_id = $1', [projectId]);
    await client.query('UPDATE project_baselines SET is_active = TRUE WHERE id = $1', [baselineId]);

    await client.query('COMMIT');
    res.json({ success: true, message: `Baseline "${baselineCheck.rows[0].name}" activated.` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error activating baseline:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// 4. Fetch comparison between two baselines (or baseline vs live)
router.get('/api/projects/:projectId/baselines/compare', async (req, res) => {
  const { projectId } = req.params;
  const { baseId, compareId } = req.query;

  if (!baseId || !compareId) {
    return res.status(400).json({ error: 'Missing baseId or compareId query parameters' });
  }

  try {
    const baseMetaRes = await pool.query('SELECT name FROM project_baselines WHERE id = $1', [baseId]);
    if (baseMetaRes.rows.length === 0) return res.status(404).json({ error: 'Base baseline not found' });
    
    let compareName = 'Current Live Plan';
    if (compareId !== 'live') {
      const compMetaRes = await pool.query('SELECT name FROM project_baselines WHERE id = $1', [compareId]);
      if (compMetaRes.rows.length === 0) return res.status(404).json({ error: 'Comparison baseline not found' });
      compareName = compMetaRes.rows[0].name;
    }

    const baseTasksRes = await pool.query(
      `SELECT task_id, title, status, start_date, end_date, estimated_hours, story_points 
       FROM task_snapshots WHERE baseline_id = $1`,
      [baseId]
    );

    let compareTasks = [];
    if (compareId === 'live') {
      const liveTasksRes = await pool.query(
        `SELECT id as task_id, title, status, start_date, end_date, estimated_hours, story_points 
         FROM tasks WHERE project_id = $1`,
        [projectId]
      );
      compareTasks = liveTasksRes.rows;
    } else {
      const compSnapRes = await pool.query(
        `SELECT task_id, title, status, start_date, end_date, estimated_hours, story_points 
         FROM task_snapshots WHERE baseline_id = $1`,
        [compareId]
      );
      compareTasks = compSnapRes.rows;
    }

    const baseMap = new Map(baseTasksRes.rows.map(t => [t.task_id, t]));
    const compareMap = new Map(compareTasks.map(t => [t.task_id, t]));
    
    const allTaskIds = new Set([...baseMap.keys(), ...compareMap.keys()]);
    const taskComparisons = [];
    
    let totalBaseHours = 0;
    let totalCompareHours = 0;
    let totalBasePoints = 0;
    let totalComparePoints = 0;
    let totalDaysDrift = 0;

    for (const taskId of allTaskIds) {
      const baseTask = baseMap.get(taskId);
      const compTask = compareMap.get(taskId);
      const title = baseTask?.title || compTask?.title;
      
      const bHours = parseFloat(baseTask?.estimated_hours || 0);
      const cHours = parseFloat(compTask?.estimated_hours || 0);
      const bPoints = parseInt(baseTask?.story_points || 0);
      const cPoints = parseInt(compTask?.story_points || 0);

      totalBaseHours += bHours;
      totalCompareHours += cHours;
      totalBasePoints += bPoints;
      totalComparePoints += cPoints;

      let startDelayDays = 0;
      let endDelayDays = 0;

      if (baseTask?.start_date && compTask?.start_date) {
        const diffMs = new Date(compTask.start_date).getTime() - new Date(baseTask.start_date).getTime();
        startDelayDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      }
      if (baseTask?.end_date && compTask?.end_date) {
        const diffMs = new Date(compTask.end_date).getTime() - new Date(baseTask.end_date).getTime();
        endDelayDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        totalDaysDrift += endDelayDays;
      }

      taskComparisons.push({
        taskId,
        title,
        base: baseTask ? {
          startDate: baseTask.start_date,
          endDate: baseTask.end_date,
          estimatedHours: bHours,
          storyPoints: bPoints,
          status: baseTask.status
        } : null,
        compare: compTask ? {
          startDate: compTask.start_date,
          endDate: compTask.end_date,
          estimatedHours: cHours,
          storyPoints: cPoints,
          status: compTask.status
        } : null,
        variance: {
          startDelayDays,
          endDelayDays,
          hoursDrift: cHours - bHours,
          pointsDrift: cPoints - bPoints
        }
      });
    }

    const actualsRes = await pool.query(
      `SELECT SUM(hours) as total FROM timesheets WHERE project_id = $1 AND status = 'Approved'`,
      [projectId]
    );
    const actualHoursLogged = parseFloat(actualsRes.rows[0]?.total || 0);

    res.json({
      projectId,
      baseBaseline: { id: baseId, name: baseMetaRes.rows[0].name },
      compareBaseline: { id: compareId, name: compareName },
      varianceSummary: {
        daysDrift: totalDaysDrift,
        storyPointsDrift: totalComparePoints - totalBasePoints,
        estimatedHoursDrift: totalCompareHours - totalBaseHours,
        actualHoursLogged
      },
      tasks: taskComparisons
    });
  } catch (err) {
    console.error('Error comparing baselines:', err);
    res.status(500).json({ error: err.message });
  }
});


// Projects REST API
router.post('/api/projects', async (req, res) => {
  const { id, name, description, status, startDate, endDate, budget, members, customColumns, permissionSchemeId, projectType, supportTaskStyle } = req.body;
  try {
    const checkExist = await pool.query('SELECT 1 FROM projects WHERE id = $1', [id]);
    const isNew = checkExist.rows.length === 0;
    const cols = customColumns || ["To Do", "In Progress", "Review", "Done"];

    await pool.query(
      `INSERT INTO projects (id, name, description, status, start_date, end_date, budget, members, custom_columns, permission_scheme_id, project_type, support_task_style)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         status = EXCLUDED.status,
         start_date = EXCLUDED.start_date,
         end_date = EXCLUDED.end_date,
         budget = EXCLUDED.budget,
         members = EXCLUDED.members,
         custom_columns = EXCLUDED.custom_columns,
         permission_scheme_id = EXCLUDED.permission_scheme_id,
         project_type = EXCLUDED.project_type,
         support_task_style = EXCLUDED.support_task_style`,
      [
        id, 
        name, 
        description, 
        status, 
        startDate, 
        endDate || null, 
        budget || null, 
        JSON.stringify(members), 
        JSON.stringify(cols), 
        permissionSchemeId || null, 
        projectType || 'dev', 
        supportTaskStyle || 'categories'
      ]
    );

    // Auto-generate main tasks for new projects
    if (isNew && startDate) {
      if (projectType === 'support') {
        if (supportTaskStyle === 'monthly') {
          const startD = new Date(startDate);
          // If no end date, default to 12 months from start date
          const endD = endDate ? new Date(endDate) : new Date(startD.getFullYear(), startD.getMonth() + 12, 1);
          
          let current = new Date(startD.getFullYear(), startD.getMonth(), 1);
          const final = new Date(endD.getFullYear(), endD.getMonth(), 1);
          
          while (current <= final) {
            const year = current.getFullYear();
            const month = String(current.getMonth() + 1).padStart(2, '0');
            const taskTitle = `[${year}-${month}] Support & Maintenance`;
            
            const tStart = (current.getFullYear() === startD.getFullYear() && current.getMonth() === startD.getMonth()) 
              ? startDate 
              : `${year}-${month}-01`;
              
            let lastDay = new Date(year, current.getMonth() + 1, 0).getDate();
            const tEnd = (current.getFullYear() === endD.getFullYear() && current.getMonth() === endD.getMonth() && endDate)
              ? endDate
              : `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
              
            const taskId = 't_' + Math.random().toString(36).substr(2, 9);
            await pool.query(
              `INSERT INTO tasks (id, project_id, assignee_id, title, description, status, priority, estimated_hours, created_at, start_date, end_date, sprint_id, release_id, story_points, issue_type)
               VALUES ($1, $2, NULL, $3, $4, $5, $6, 0, $7, $8, $9, NULL, NULL, 0, 'Task')`,
              [
                taskId,
                id,
                taskTitle,
                `Support work for ${year}-${month}`,
                'To Do',
                'Medium',
                new Date().toISOString(),
                tStart,
                tEnd
              ]
            );
            
            current.setMonth(current.getMonth() + 1);
          }
        } else {
          // Category-based Support tasks
          const categories = [
            { title: 'User Support & Helpdesk', desc: 'Handling user queries, access issues, and general assistance.' },
            { title: 'System Maintenance & Operations', desc: 'Routine checks, database backup, server updates, and monitoring.' },
            { title: 'Bug Fixing & Enhancement Support', desc: 'Investigating errors, deploying patches, and resolving reported system issues.' }
          ];
          
          for (const cat of categories) {
            const taskId = 't_' + Math.random().toString(36).substr(2, 9);
            await pool.query(
              `INSERT INTO tasks (id, project_id, assignee_id, title, description, status, priority, estimated_hours, created_at, start_date, end_date, sprint_id, release_id, story_points, issue_type)
               VALUES ($1, $2, NULL, $3, $4, $5, $6, 0, $7, $8, $9, NULL, NULL, 0, 'Task')`,
              [
                taskId,
                id,
                cat.title,
                cat.desc,
                'To Do',
                'Medium',
                new Date().toISOString(),
                startDate,
                endDate || null
              ]
            );
          }
        }
      } else {
        // Normal template tasks for Dev Projects
        if (endDate) {
          const templates = await pool.query('SELECT * FROM task_templates');
          const startD = new Date(startDate);
          const endD = new Date(endDate);
          const totalMs = endD.getTime() - startD.getTime();
          
          for (const tpl of templates.rows) {
            const taskStartMs = startD.getTime() + (totalMs * parseFloat(tpl.start_percent) / 100);
            const taskEndMs = startD.getTime() + (totalMs * parseFloat(tpl.end_percent) / 100);
            
            const taskStartStr = new Date(taskStartMs).toISOString().split('T')[0];
            const taskEndStr = new Date(taskEndMs).toISOString().split('T')[0];
            
            const taskId = 't_' + Math.random().toString(36).substr(2, 9);
            await pool.query(
              `INSERT INTO tasks (id, project_id, assignee_id, title, description, status, priority, estimated_hours, created_at, start_date, end_date, sprint_id, release_id, story_points, issue_type)
               VALUES ($1, $2, NULL, $3, $4, $5, $6, $7, $8, $9, $10, NULL, NULL, 0, 'Task')`,
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
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error saving project:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete Project (cascade)
router.delete('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.headers['x-user-id'];
  try {
    // Permission check: only Admin or Manager can delete projects
    if (userId) {
      const userRes = await pool.query('SELECT global_role FROM users WHERE id = $1', [userId]);
      if (userRes.rows.length > 0) {
        const role = userRes.rows[0].global_role;
        if (role !== 'Admin' && role !== 'Manager') {
          return res.status(403).json({ error: 'Only Admin or Manager can delete projects' });
        }
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Delete task_snapshots via project_baselines
      await client.query(
        `DELETE FROM task_snapshots WHERE baseline_id IN (SELECT id FROM project_baselines WHERE project_id = $1)`,
        [id]
      );
      // 2. Delete project_baselines
      await client.query('DELETE FROM project_baselines WHERE project_id = $1', [id]);
      // 3. Delete timesheets linked to this project
      await client.query('DELETE FROM timesheets WHERE project_id = $1', [id]);
      // 4. Delete tasks
      await client.query('DELETE FROM tasks WHERE project_id = $1', [id]);
      // 5. Delete sprints
      await client.query('DELETE FROM sprints WHERE project_id = $1', [id]);
      // 6. Delete releases
      await client.query('DELETE FROM releases WHERE project_id = $1', [id]);
      // 7. Delete project_workflows
      await client.query('DELETE FROM project_workflows WHERE project_id = $1', [id]);
      // 8. Delete the project itself
      await client.query('DELETE FROM projects WHERE id = $1', [id]);

      await client.query('COMMIT');
      res.json({ success: true });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ error: err.message });
  }
});


// --- Permission and Workflow Validation Helpers ---
async function checkPermission(userId, projectId, permissionKey, taskObject = null) {
  if (!userId) return true; // Bypass validation if header X-User-Id is missing (local scripts, fallback compatibility)
  try {
    // 1. Get user global role
    const userRes = await pool.query('SELECT global_role FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) return false;
    const globalRole = userRes.rows[0].global_role;
    
    // Admin has superuser permissions
    if (globalRole === 'Admin') return true;

    // 2. Get project details and user's project role
    const projectRes = await pool.query('SELECT permission_scheme_id, members FROM projects WHERE id = $1', [projectId]);
    if (projectRes.rows.length === 0) return false;
    const project = projectRes.rows[0];
    
    let projectRole = null;
    const members = typeof project.members === 'string' ? JSON.parse(project.members) : project.members;
    if (Array.isArray(members)) {
      const member = members.find(m => m.userId === userId);
      if (member) {
        projectRole = member.role;
        if (projectRole === 'Team Lead' || projectRole === 'Leader') {
          projectRole = 'PM';
        }
      }
    }

    // If global role is Manager/Owner, they might act as Owner/PM by default
    if (globalRole === 'Manager' && !projectRole) {
      projectRole = 'PM'; // Managers default to PM on projects they manage
    }

    // 3. Load permission scheme
    const schemeId = project.permission_scheme_id || 'scheme_default';
    const schemeRes = await pool.query('SELECT permissions FROM permission_schemes WHERE id = $1', [schemeId]);
    if (schemeRes.rows.length === 0) return false;
    
    const permissions = schemeRes.rows[0].permissions;
    const allowedEntities = permissions[permissionKey];
    if (!Array.isArray(allowedEntities)) return false;

    // Check matches
    if (allowedEntities.includes(globalRole)) return true;
    if (projectRole && allowedEntities.includes(projectRole)) return true;
    if (allowedEntities.includes('Member') && projectRole) return true; // Any member role
    if (allowedEntities.includes('Assignee') && taskObject && taskObject.assignee_id === userId) return true;

    return false;
  } catch (err) {
    console.error('Error in checkPermission:', err);
    return false;
  }
}

async function validateTransition(userId, projectId, taskObject, newStatus) {
  if (!taskObject) return { allowed: true };
  if (taskObject.status === newStatus) return { allowed: true };

  try {
    // Load project workflow
    const wfRes = await pool.query('SELECT statuses, transitions FROM project_workflows WHERE project_id = $1', [projectId]);
    if (wfRes.rows.length === 0) return { allowed: true }; // No workflow -> allow all
    
    const workflow = wfRes.rows[0];
    const statuses = Array.isArray(workflow.statuses) ? workflow.statuses : JSON.parse(workflow.statuses || '[]');
    const transitions = Array.isArray(workflow.transitions) ? workflow.transitions : JSON.parse(workflow.transitions || '[]');

    // 1. Verify new status is a valid column
    if (!statuses.includes(newStatus)) {
      return { allowed: false, reason: `Status column "${newStatus}" does not exist in this project.` };
    }

    // 2. If no transitions are specified, default to allowing all transitions
    if (transitions.length === 0) {
      return { allowed: true };
    }

    // 3. Find transition rule
    const transition = transitions.find(t => (t.from === taskObject.status || t.from === '*') && t.to === newStatus);
    if (!transition) {
      return { allowed: false, reason: `Transition from "${taskObject.status}" to "${newStatus}" is not allowed by this project's workflow.` };
    }

    // 4. Validate conditions
    const conditions = transition.conditions || [];
    for (const cond of conditions) {
      if (cond.type === 'pm_or_admin_only') {
        const userRes = await pool.query('SELECT global_role FROM users WHERE id = $1', [userId]);
        const globalRole = userRes.rows[0]?.global_role;
        const projectRes = await pool.query('SELECT members FROM projects WHERE id = $1', [projectId]);
        const members = projectRes.rows[0]?.members || [];
        const memberRole = members.find(m => m.userId === userId)?.role;
        if (globalRole !== 'Admin' && memberRole !== 'PM' && memberRole !== 'Team Lead' && memberRole !== 'Leader' && globalRole !== 'Manager') {
          return { allowed: false, reason: `Only a Project Manager or Admin can perform this transition.` };
        }
      }
      if (cond.type === 'assignee_only') {
        if (taskObject.assignee_id !== userId) {
          return { allowed: false, reason: `Only the assignee of this task can perform this transition.` };
        }
      }
      if (cond.type === 'min_story_points') {
        if (!taskObject.story_points || taskObject.story_points <= 0) {
          return { allowed: false, reason: `This transition requires the task to have story points set.` };
        }
      }
      if (cond.type === 'has_description') {
        if (!taskObject.description || taskObject.description.trim() === '') {
          return { allowed: false, reason: `This transition requires the task to have a description.` };
        }
      }
      if (cond.type === 'has_estimated_hours') {
        if (!taskObject.estimated_hours || parseFloat(taskObject.estimated_hours) <= 0) {
          return { allowed: false, reason: `This transition requires the task to have estimated hours set.` };
        }
      }
    }

    return { allowed: true };
  } catch (err) {
    console.error('Error in validateTransition:', err);
    return { allowed: false, reason: `Server error validating transition: ${err.message}` };
  }
}


// Project Workflows API
router.get('/api/projects/:projectId/workflow', async (req, res) => {
  const { projectId } = req.params;
  try {
    const wfRes = await pool.query('SELECT * FROM project_workflows WHERE project_id = $1', [projectId]);
    if (wfRes.rows.length === 0) {
      return res.json({ projectId, statuses: ["To Do", "In Progress", "Review", "Done"], transitions: [] });
    }
    const pw = wfRes.rows[0];
    res.json({
      projectId: pw.project_id,
      statuses: pw.statuses,
      transitions: pw.transitions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/projects/:projectId/workflow', async (req, res) => {
  const { projectId } = req.params;
  const { statuses, transitions } = req.body;
  const userId = req.headers['x-user-id'];
  try {
    if (userId) {
      const hasPermission = await checkPermission(userId, projectId, 'manage_members');
      if (!hasPermission) {
        return res.status(403).json({ error: 'Permission denied: You do not have permission to manage workflows for this project.' });
      }
    }

    await pool.query(
      `INSERT INTO project_workflows (project_id, statuses, transitions)
       VALUES ($1, $2, $3)
       ON CONFLICT (project_id) DO UPDATE SET
         statuses = EXCLUDED.statuses,
         transitions = EXCLUDED.transitions`,
      [projectId, JSON.stringify(statuses), JSON.stringify(transitions)]
    );

    // Keep custom_columns in projects in sync
    await pool.query(
      'UPDATE projects SET custom_columns = $1 WHERE id = $2',
      [JSON.stringify(statuses), projectId]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




export default router;
export { checkPermission, validateTransition };
