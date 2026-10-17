import type { User, Project, ProjectRole } from '../types';

export type UserStatusFilter = 'all' | 'active' | 'inactive';

export const isUserActive = (user: User): boolean => user.isActive !== false;

export const canManageUsers = (currentUser: User): boolean =>
  currentUser.globalRole === 'Admin' || currentUser.globalRole === 'Manager';

export const canAdministerUserStatus = (currentUser: User, targetUser: User): boolean =>
  currentUser.globalRole === 'Admin' && currentUser.id !== targetUser.id;

export const canEditUserProfile = (currentUser: User, targetUser: User): boolean =>
  canManageUsers(currentUser) || currentUser.id === targetUser.id;

export const isUserInAnyProject = (userId: string, projects: Project[]): boolean =>
  projects.some(p => Array.isArray(p.members) && p.members.some(m => m.userId === userId));

export const getUsersToDeactivateOnProjectDelete = (
  deletedProjectId: string,
  projects: Project[],
  users: User[]
): string[] => {
  const deletedProject = projects.find(p => p.id === deletedProjectId);
  if (!deletedProject || !Array.isArray(deletedProject.members)) return [];

  const remainingProjects = projects.filter(p => p.id !== deletedProjectId);
  const memberIdsInDeleted = deletedProject.members.map(m => m.userId);

  return memberIdsInDeleted.filter(userId => {
    const userObj = users.find(u => u.id === userId);
    if (!userObj || userObj.globalRole === 'Admin') return false;
    return !isUserInAnyProject(userId, remainingProjects);
  });
};

export const updateProjectMembershipsOnUserSave = (
  projects: Project[],
  userId: string,
  selectedProjectId: string,
  roleToAdd: ProjectRole
): Project[] => {
  if (!selectedProjectId) return projects;

  return projects.map(proj => {
    if (proj.id !== selectedProjectId) {
      return proj;
    }

    const membersList = proj.members || [];
    const isAlreadyMember = membersList.some(m => m.userId === userId);

    if (isAlreadyMember) {
      return {
        ...proj,
        members: membersList.map(m => (m.userId === userId ? { ...m, role: roleToAdd } : m)),
      };
    }

    return {
      ...proj,
      members: [...membersList, { userId, role: roleToAdd }],
    };
  });
};

export const filterUsersByStatus = (
  users: User[],
  filter: UserStatusFilter
): User[] => {
  if (filter === 'active') return users.filter(u => isUserActive(u));
  if (filter === 'inactive') return users.filter(u => !isUserActive(u));
  return users;
};
