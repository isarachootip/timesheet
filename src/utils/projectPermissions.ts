import type { PermissionScheme, Project, Task, User } from '../types';

export const hasProjectPermission = (
  currentUser: User | null | undefined,
  projects: Project[],
  permissionSchemes: PermissionScheme[],
  projectId: string,
  permissionKey: string,
  taskObj?: Task
): boolean => {
  if (!currentUser) return false;
  if (currentUser.globalRole === 'Admin' || currentUser.globalRole === 'Manager') return true;

  const project = projects.find((p) => p.id === projectId);
  if (!project) return false;

  let projectRole: string | null = null;
  const member = (project.members || []).find((m) => m.userId === currentUser.id);
  if (member) {
    projectRole = member.role;
    if (projectRole === 'Team Lead' || projectRole === 'Leader') {
      projectRole = 'PM';
    }
  }

  const schemeId = project.permissionSchemeId || 'scheme_default';
  const scheme = permissionSchemes.find((s) => s.id === schemeId);
  if (!scheme) return false;

  const allowed = scheme.permissions?.[permissionKey];
  if (!Array.isArray(allowed)) return false;

  if (allowed.includes(currentUser.globalRole)) return true;
  if (projectRole && allowed.includes(projectRole)) return true;
  if (allowed.includes('Member') && projectRole) return true;
  if (allowed.includes('Assignee') && taskObj && taskObj.assigneeId === currentUser.id) return true;

  return false;
};
