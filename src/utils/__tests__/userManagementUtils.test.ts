import { describe, it, expect } from 'vitest';
import type { User, Project } from '../../types';
import {
  canManageUsers,
  canAdministerUserStatus,
  canEditUserProfile,
  isUserInAnyProject,
  getUsersToDeactivateOnProjectDelete,
  updateProjectMembershipsOnUserSave,
  filterUsersByStatus,
} from '../userManagementUtils';

const mockAdmin: User = {
  id: 'u_admin',
  name: 'Admin User',
  email: 'admin@test.com',
  avatar: '',
  globalRole: 'Admin',
  department: 'Management',
  isActive: true,
};

const mockManager: User = {
  id: 'u_mgr',
  name: 'Manager User',
  email: 'mgr@test.com',
  avatar: '',
  globalRole: 'Manager',
  department: 'Engineering',
  isActive: true,
};

const mockEmp1: User = {
  id: 'u_emp1',
  name: 'Employee One',
  email: 'emp1@test.com',
  avatar: '',
  globalRole: 'Employee',
  department: 'Dev',
  isActive: true,
};

const mockEmp2Inactive: User = {
  id: 'u_emp2',
  name: 'Employee Two',
  email: 'emp2@test.com',
  avatar: '',
  globalRole: 'Employee',
  department: 'Dev',
  isActive: false,
};

const mockProjects: Project[] = [
  {
    id: 'p1',
    name: 'Project Alpha',
    description: '',
    status: 'Active',
    startDate: '2026-01-01',
    members: [
      { userId: 'u_emp1', role: 'Frontend dev' },
      { userId: 'u_mgr', role: 'PM' },
    ],
  },
  {
    id: 'p2',
    name: 'Project Beta',
    description: '',
    status: 'Active',
    startDate: '2026-02-01',
    members: [{ userId: 'u_mgr', role: 'PM' }],
  },
];

describe('userManagementUtils', () => {
  it('checks permissions for managing and editing users', () => {
    expect(canManageUsers(mockAdmin)).toBe(true);
    expect(canManageUsers(mockManager)).toBe(true);
    expect(canManageUsers(mockEmp1)).toBe(false);

    // Only Admin can toggle active/inactive or delete other users (not self)
    expect(canAdministerUserStatus(mockAdmin, mockEmp1)).toBe(true);
    expect(canAdministerUserStatus(mockAdmin, mockAdmin)).toBe(false);
    expect(canAdministerUserStatus(mockManager, mockEmp1)).toBe(false);

    // Employee can only edit own profile
    expect(canEditUserProfile(mockEmp1, mockEmp1)).toBe(true);
    expect(canEditUserProfile(mockEmp1, mockEmp2Inactive)).toBe(false);
    expect(canEditUserProfile(mockAdmin, mockEmp1)).toBe(true);
  });

  it('identifies whether a user is in any project', () => {
    expect(isUserInAnyProject('u_emp1', mockProjects)).toBe(true);
    expect(isUserInAnyProject('u_emp2', mockProjects)).toBe(false);
  });

  it('finds users to set inactive when a project is deleted', () => {
    // Deleting p1 should deactivate u_emp1 (only in p1), but NOT u_mgr (still in p2)
    const toDeactivate = getUsersToDeactivateOnProjectDelete(
      'p1',
      mockProjects,
      [mockAdmin, mockManager, mockEmp1, mockEmp2Inactive]
    );
    expect(toDeactivate).toEqual(['u_emp1']);
  });

  it('preserves existing project memberships when saving a user', () => {
    // u_emp1 is already in p1; assigning them to p2 must NOT remove them from p1
    const updated = updateProjectMembershipsOnUserSave(
      mockProjects,
      'u_emp1',
      'p2',
      'Backend dev'
    );
    expect(updated[0].members.some(m => m.userId === 'u_emp1')).toBe(true);
    expect(updated[1].members.find(m => m.userId === 'u_emp1')?.role).toBe('Backend dev');
  });

  it('filters users by active/inactive status', () => {
    const allUsers = [mockAdmin, mockEmp1, mockEmp2Inactive];
    expect(filterUsersByStatus(allUsers, 'all')).toHaveLength(3);
    expect(filterUsersByStatus(allUsers, 'active')).toHaveLength(2);
    expect(filterUsersByStatus(allUsers, 'inactive')).toEqual([mockEmp2Inactive]);
  });
});
