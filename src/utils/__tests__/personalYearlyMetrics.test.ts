import { describe, it, expect } from 'vitest';
import type { User, Project, TimesheetEntry, Task } from '../../types';
import {
  getViewablePersonalUsers,
  filterPersonalTimesheets,
  calculateYearlyPersonalSummary,
} from '../personalYearlyMetrics';

const mockUsers: User[] = [
  { id: 'u_admin', name: 'Admin User', email: 'admin@test.com', avatar: '', globalRole: 'Admin', department: 'IT' },
  { id: 'u_pm', name: 'PM User', email: 'pm@test.com', avatar: '', globalRole: 'Employee', department: 'IT' },
  { id: 'u_dev1', name: 'Dev One', email: 'dev1@test.com', avatar: '', globalRole: 'Employee', department: 'IT' },
  { id: 'u_dev2', name: 'Dev Two', email: 'dev2@test.com', avatar: '', globalRole: 'Employee', department: 'HR' },
];

const mockProjects: Project[] = [
  {
    id: 'p_alpha',
    name: 'Project Alpha',
    description: 'Alpha',
    status: 'Active',
    startDate: '2026-01-01',
    members: [
      { userId: 'u_pm', role: 'PM' },
      { userId: 'u_dev1', role: 'Developer' },
    ],
  },
  {
    id: 'p_beta',
    name: 'Project Beta',
    description: 'Beta',
    status: 'Active',
    startDate: '2026-01-01',
    members: [
      { userId: 'u_dev1', role: 'Developer' },
      { userId: 'u_dev2', role: 'Designer' },
    ],
  },
];

const mockTimesheets: TimesheetEntry[] = [
  {
    id: 'ts_1',
    userId: 'u_dev1',
    projectId: 'p_alpha',
    date: '2026-01-10',
    hours: 8,
    startTime: '09:00',
    endTime: '18:00',
    description: 'Alpha work Jan',
    status: 'Approved',
    isWfh: true,
    isPersonal: false,
  },
  {
    id: 'ts_2',
    userId: 'u_dev1',
    projectId: 'p_beta',
    date: '2026-01-11',
    hours: 4,
    startTime: '10:00',
    endTime: '14:00',
    description: 'Beta work Jan',
    status: 'Pending',
    isWfh: false,
    isPersonal: false,
  },
  {
    id: 'ts_3',
    userId: 'u_dev1',
    projectId: undefined,
    date: '2026-05-15',
    hours: 2,
    description: 'Personal study',
    status: 'Approved',
    isWfh: false,
    isPersonal: true,
  },
  {
    id: 'ts_4',
    userId: 'u_dev1',
    projectId: 'p_alpha',
    date: '2026-05-16',
    hours: 6,
    description: 'Draft entry should be excluded',
    status: 'Draft',
  },
  {
    id: 'ts_5',
    userId: 'u_dev1',
    projectId: 'p_alpha',
    date: '2026-05-17',
    hours: 6,
    description: 'Rejected entry should be excluded',
    status: 'Rejected',
  },
];

const mockTasks: Task[] = [
  {
    id: 't_1',
    projectId: 'p_alpha',
    assigneeId: 'u_dev1',
    title: 'Done Task 2026',
    description: '',
    status: 'Done',
    priority: 'High',
    estimatedHours: 8,
    createdAt: '2026-01-05',
    endDate: '2026-01-12',
  },
  {
    id: 't_2',
    projectId: 'p_alpha',
    assigneeId: 'u_dev1',
    title: 'In Progress Task',
    description: '',
    status: 'In Progress',
    priority: 'Medium',
    estimatedHours: 4,
    createdAt: '2026-02-01',
  },
];

describe('personalYearlyMetrics', () => {
  it('returns correct viewable users based on role (Admin, PM, Employee)', () => {
    const adminView = getViewablePersonalUsers(mockUsers[0], mockUsers, mockProjects);
    expect(adminView.map(u => u.id)).toEqual(['u_admin', 'u_pm', 'u_dev1', 'u_dev2']);

    const pmView = getViewablePersonalUsers(mockUsers[1], mockUsers, mockProjects);
    expect(pmView.map(u => u.id)).toEqual(['u_pm', 'u_dev1']);

    const devView = getViewablePersonalUsers(mockUsers[2], mockUsers, mockProjects);
    expect(devView.map(u => u.id)).toEqual(['u_dev1']);
  });

  it('filters timesheets to Approved + Pending and toggles personal logs', () => {
    const withPersonal = filterPersonalTimesheets(mockTimesheets, 'u_dev1', '2026', true);
    expect(withPersonal.map(t => t.id)).toEqual(['ts_1', 'ts_2', 'ts_3']);

    const withoutPersonal = filterPersonalTimesheets(mockTimesheets, 'u_dev1', '2026', false);
    expect(withoutPersonal.map(t => t.id)).toEqual(['ts_1', 'ts_2']);
  });

  it('calculates full 12-month summary and project matrix accurately', () => {
    const summary = calculateYearlyPersonalSummary(
      mockTimesheets,
      mockTasks,
      mockProjects,
      'u_dev1',
      '2026',
      true
    );

    expect(summary.totalHours).toBe(14);
    expect(summary.approvedHours).toBe(10);
    expect(summary.pendingHours).toBe(4);
    expect(summary.personalHours).toBe(2);
    expect(summary.activeDaysCount).toBe(3);
    expect(summary.wfhDaysCount).toBe(1);
    expect(summary.longestStreakDays).toBe(2);
    expect(summary.completedTasksCount).toBe(1);
    expect(summary.timePattern).toBe('09:30 - 16:00');

    expect(summary.monthlyBreakdown).toHaveLength(12);
    expect(summary.monthlyBreakdown[0].monthKey).toBe('2026-01');
    expect(summary.monthlyBreakdown[0].totalHours).toBe(12);
    expect(summary.monthlyBreakdown[0].approvedHours).toBe(8);
    expect(summary.monthlyBreakdown[0].pendingHours).toBe(4);
    expect(summary.monthlyBreakdown[4].monthKey).toBe('2026-05');
    expect(summary.monthlyBreakdown[4].totalHours).toBe(2);

    expect(summary.projectMatrixRows).toHaveLength(3);
    const alphaRow = summary.projectMatrixRows.find(r => r.projectId === 'p_alpha');
    expect(alphaRow?.totalHours).toBe(8);
    expect(alphaRow?.monthlyHours[0]).toBe(8);
  });
});
