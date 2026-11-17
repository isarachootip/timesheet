const PRIVILEGED_PROJECT_ROLES = new Set(['PM', 'Team Lead', 'Leader']);

const createHttpError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

export const parseProjectMembers = (rawMembers) => {
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

export const authenticateHealthUser = async (db, userId) => {
  const normalized = String(userId || '').trim();
  if (!normalized) {
    throw createHttpError(401, 'Authentication required: missing X-User-Id header.');
  }
  const userRes = await db.query('SELECT id, global_role FROM users WHERE id = $1', [normalized]);
  if (userRes.rows.length === 0) {
    throw createHttpError(401, 'Authentication failed: user not found.');
  }
  return { userId: normalized, globalRole: String(userRes.rows[0].global_role) };
};

export const canUserBrowseProject = (globalRole, projectRow, schemePermissions, userId) => {
  if (globalRole === 'Admin' || globalRole === 'Manager') return true;
  if (!projectRow) return false;

  const members = parseProjectMembers(projectRow.members);
  const member = members.find((m) => m && m.userId === userId);
  let projectRole = member ? String(member.role || '') : null;
  if (projectRole === 'Team Lead' || projectRole === 'Leader') {
    projectRole = 'PM';
  }

  const allowed = schemePermissions?.browse_project || ['Admin', 'Manager', 'PM', 'Team Lead', 'Member'];
  if (!Array.isArray(allowed)) return false;

  if (allowed.includes(globalRole)) return true;
  if (projectRole && allowed.includes(projectRole)) return true;
  if (allowed.includes('Member') && projectRole) return true;
  return false;
};

export const isUserPrivilegedOnProject = (globalRole, projectRow, userId) => {
  if (globalRole === 'Admin' || globalRole === 'Manager') return true;
  if (!projectRow) return false;
  const members = parseProjectMembers(projectRow.members);
  const member = members.find((m) => m && m.userId === userId);
  return Boolean(member && PRIVILEGED_PROJECT_ROLES.has(String(member.role || '')));
};

const loadProjectForAuth = async (db, projectId) => {
  const projRes = await db.query(
    'SELECT id, name, members, permission_scheme_id FROM projects WHERE id = $1',
    [projectId]
  );
  if (projRes.rows.length === 0) {
    throw createHttpError(404, `Project "${projectId}" not found.`);
  }
  return projRes.rows[0];
};

export const assertCanViewProjectHealth = async (db, userId, projectId) => {
  const { userId: uid, globalRole } = await authenticateHealthUser(db, userId);
  const projectRow = await loadProjectForAuth(db, projectId);

  if (globalRole === 'Admin' || globalRole === 'Manager') return;

  const schemeId = projectRow.permission_scheme_id || 'scheme_default';
  const schemeRes = await db.query('SELECT permissions FROM permission_schemes WHERE id = $1', [schemeId]);
  const permissions = schemeRes.rows[0]?.permissions || null;

  if (!canUserBrowseProject(globalRole, projectRow, permissions, uid)) {
    throw createHttpError(403, 'Permission denied: you do not have access to view this project.');
  }
};

export const assertCanAnalyzeProjectHealth = async (db, userId, projectId) => {
  const { userId: uid, globalRole } = await authenticateHealthUser(db, userId);
  const projectRow = await loadProjectForAuth(db, projectId);

  if (!isUserPrivilegedOnProject(globalRole, projectRow, uid)) {
    throw createHttpError(
      403,
      'Permission denied: only Admin, Manager, PM, or Team Lead can run AI health analysis.'
    );
  }
};
