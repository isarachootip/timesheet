const PRIVILEGED_PROJECT_ROLES = new Set(['PM', 'Team Lead', 'Leader']);

const parseMembers = (rawMembers) => {
  if (Array.isArray(rawMembers)) return rawMembers;
  if (typeof rawMembers === 'string') {
    try {
      const parsed = JSON.parse(rawMembers);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const isPrivilegedOnProject = (globalRole, projectRow, userId) => {
  if (globalRole === 'Admin' || globalRole === 'Manager') return true;
  if (!projectRow) return false;
  const members = parseMembers(projectRow.members);
  const member = members.find((m) => m && m.userId === userId);
  return Boolean(member && PRIVILEGED_PROJECT_ROLES.has(member.role));
};

const loadAuthenticatedRole = async (db, userId) => {
  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    const err = new Error('Authentication required: missing X-User-Id header.');
    err.statusCode = 401;
    throw err;
  }
  const userRes = await db.query('SELECT id, global_role FROM users WHERE id = $1', [userId]);
  if (userRes.rows.length === 0) {
    const err = new Error('Authentication failed: user not found.');
    err.statusCode = 401;
    throw err;
  }
  return userRes.rows[0].global_role;
};

const runInTransaction = async (pool, fn) => {
  if (typeof pool.connect !== 'function') {
    return fn(pool);
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const executeBulkTasksUpdate = async (deps, userId, payload) => {
  const { pool, checkPermission, validateTransition } = deps;
  return runInTransaction(pool, async (db) => {
    const globalRole = await loadAuthenticatedRole(db, userId);
    const uniqueTaskIds = Array.from(new Set(payload.taskIds));
    const tasksRes = await db.query('SELECT * FROM tasks WHERE id = ANY($1::varchar[])', [uniqueTaskIds]);
    const taskMap = new Map(tasksRes.rows.map((t) => [t.id, t]));

    const projectIds = Array.from(new Set(tasksRes.rows.map((t) => t.project_id).filter(Boolean)));
    const projectsRes =
      projectIds.length > 0
        ? await db.query('SELECT * FROM projects WHERE id = ANY($1::varchar[])', [projectIds])
        : { rows: [] };
    const projectMap = new Map(projectsRes.rows.map((p) => [p.id, p]));

    const updatedIds = [];
    const skipped = [];
    const nowIso = new Date().toISOString();
    const { patch } = payload;

    for (const taskId of uniqueTaskIds) {
      const task = taskMap.get(taskId);
      if (!task) {
        skipped.push({ id: taskId, reason: 'Task not found.' });
        continue;
      }

      const project = projectMap.get(task.project_id);
      if (!isPrivilegedOnProject(globalRole, project, userId)) {
        if (task.assignee_id && task.assignee_id !== userId) {
          skipped.push({ id: taskId, reason: 'Cannot modify tasks assigned to another member.' });
          continue;
        }
        if (!(await checkPermission(userId, task.project_id, 'edit_task', task))) {
          skipped.push({ id: taskId, reason: 'Missing edit_task permission.' });
          continue;
        }
        if (patch.status !== undefined && patch.status !== task.status) {
          if (!(await checkPermission(userId, task.project_id, 'transition_task', task))) {
            skipped.push({ id: taskId, reason: 'Missing transition_task permission.' });
            continue;
          }
          const wfResult = await validateTransition(userId, task.project_id, task, patch.status);
          if (!wfResult.allowed) {
            skipped.push({ id: taskId, reason: wfResult.reason || 'Blocked by workflow rule.' });
            continue;
          }
        }
      }

      const nextStatus = patch.status !== undefined ? patch.status : task.status;
      const nextEndDate = patch.endDate !== undefined ? patch.endDate : task.end_date;
      await db.query('UPDATE tasks SET status = $1, end_date = $2, updated_at = $3 WHERE id = $4', [
        nextStatus,
        nextEndDate,
        nowIso,
        taskId,
      ]);
      updatedIds.push(taskId);
    }

    return { updatedIds, skipped };
  });
};

export const executeBulkProjectsUpdate = async (deps, userId, payload) => {
  const { pool } = deps;
  return runInTransaction(pool, async (db) => {
    const globalRole = await loadAuthenticatedRole(db, userId);
    const uniqueProjectIds = Array.from(new Set(payload.projectIds));
    const projectsRes = await db.query('SELECT * FROM projects WHERE id = ANY($1::varchar[])', [uniqueProjectIds]);
    const projectMap = new Map(projectsRes.rows.map((p) => [p.id, p]));

    const updatedIds = [];
    const skipped = [];
    const { patch } = payload;

    for (const projectId of uniqueProjectIds) {
      const project = projectMap.get(projectId);
      if (!project) {
        skipped.push({ id: projectId, reason: 'Project not found.' });
        continue;
      }
      if (!isPrivilegedOnProject(globalRole, project, userId)) {
        skipped.push({ id: projectId, reason: 'Permission denied: requires Admin, Manager, or PM role.' });
        continue;
      }
      const nextStatus = patch.status !== undefined ? patch.status : project.status;
      const nextEndDate = patch.endDate !== undefined ? patch.endDate : project.end_date;
      await db.query('UPDATE projects SET status = $1, end_date = $2 WHERE id = $3', [
        nextStatus,
        nextEndDate,
        projectId,
      ]);
      updatedIds.push(projectId);
    }

    return { updatedIds, skipped };
  });
};
