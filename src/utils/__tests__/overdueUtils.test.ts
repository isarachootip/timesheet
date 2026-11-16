import { describe, it, expect } from 'vitest';
import {
  isTaskDone,
  isSupportBucketTask,
  isTaskOverdue,
  getOverdueDays,
  isCriticalOverdue,
  isTaskDueSoon,
  computeProjectHealthSchedule,
} from '../overdueUtils';
import type { Project, ProjectWorkflow, Task } from '../../types';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 't_1',
  projectId: 'p_1',
  title: 'Sample Task',
  description: '',
  status: 'In Progress',
  priority: 'Medium',
  estimatedHours: 8,
  createdAt: '2026-06-01T00:00:00Z',
  ...overrides,
});

const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'p_1',
  name: 'Core Platform',
  description: '',
  status: 'Active',
  startDate: '2026-01-01',
  endDate: '2026-07-31',
  members: [],
  ...overrides,
});

describe('overdueUtils', () => {
  const today = new Date('2026-11-16T00:00:00');

  it('detects standard and custom final columns in isTaskDone', () => {
    expect(isTaskDone(makeTask({ status: 'Done' }))).toBe(true);
    expect(isTaskDone(makeTask({ status: 'completed' }))).toBe(true);
    expect(isTaskDone(makeTask({ status: 'Closed' }))).toBe(true);
    expect(isTaskDone(makeTask({ status: 'Released' }))).toBe(true);
    expect(isTaskDone(makeTask({ status: 'In Progress' }))).toBe(false);

    const customProject = makeProject({ customColumns: ['Backlog', 'Coding', 'UAT', 'Shipped'] });
    expect(isTaskDone(makeTask({ status: 'Shipped' }), customProject)).toBe(true);
    expect(isTaskDone(makeTask({ status: 'UAT' }), customProject)).toBe(false);

    const workflow: ProjectWorkflow = {
      projectId: 'p_1',
      statuses: ['Open', 'Working', 'Verified'],
      transitions: [],
    };
    expect(isTaskDone(makeTask({ status: 'Verified' }), customProject, workflow)).toBe(true);
  });

  it('excludes support project main buckets from overdue while keeping subtasks eligible', () => {
    const supportProject = makeProject({ projectType: 'support' });
    const mainBucket = makeTask({ endDate: '2026-07-31', status: 'To Do', parentId: undefined });
    const subTicket = makeTask({ endDate: '2026-07-31', status: 'To Do', parentId: 't_bucket' });

    expect(isSupportBucketTask(mainBucket, supportProject)).toBe(true);
    expect(isSupportBucketTask(subTicket, supportProject)).toBe(false);
    expect(isTaskOverdue(mainBucket, today, { project: supportProject })).toBe(false);
    expect(isTaskOverdue(subTicket, today, { project: supportProject })).toBe(true);
  });

  it('detects overdue only when endDate is strictly before today and task is not done', () => {
    expect(isTaskOverdue(makeTask({ endDate: '2026-11-15' }), today)).toBe(true);
    expect(isTaskOverdue(makeTask({ endDate: '2026-11-16' }), today)).toBe(false);
    expect(isTaskOverdue(makeTask({ endDate: '2026-11-10', status: 'Done' }), today)).toBe(false);

    const customProject = makeProject({ customColumns: ['To Do', 'Review', 'Deployed'] });
    expect(
      isTaskOverdue(makeTask({ endDate: '2026-11-01', status: 'Deployed' }), today, {
        project: customProject,
      })
    ).toBe(false);
    expect(isTaskOverdue(makeTask({ endDate: undefined }), today)).toBe(false);
  });

  it('computes exact overdue days and critical overdue status', () => {
    expect(getOverdueDays(makeTask({ endDate: '2026-11-08' }), today)).toBe(8);
    expect(getOverdueDays(makeTask({ endDate: '2026-11-15' }), today)).toBe(1);
    expect(getOverdueDays(makeTask({ endDate: '2026-11-18' }), today)).toBe(0);

    expect(isCriticalOverdue(makeTask({ endDate: '2026-11-15', priority: 'Urgent' }), today)).toBe(true);
    expect(isCriticalOverdue(makeTask({ endDate: '2026-11-08', priority: 'Low' }), today)).toBe(true);
    expect(isCriticalOverdue(makeTask({ endDate: '2026-11-10', priority: 'High' }), today)).toBe(false);
  });

  it('detects due soon within 0..3 days and respects custom done status', () => {
    expect(isTaskDueSoon(makeTask({ endDate: '2026-11-16' }), today)).toBe(true);
    expect(isTaskDueSoon(makeTask({ endDate: '2026-11-19' }), today)).toBe(true);
    expect(isTaskDueSoon(makeTask({ endDate: '2026-11-20' }), today)).toBe(false);
    expect(isTaskDueSoon(makeTask({ endDate: '2026-11-17', status: 'Completed' }), today)).toBe(false);
  });

  it('computes project health schedule state accurately', () => {
    expect(
      computeProjectHealthSchedule(makeProject({ projectType: 'support', endDate: '2026-07-31' }), 18, today)
    ).toEqual({ kind: 'ongoing' });

    expect(
      computeProjectHealthSchedule(makeProject({ status: 'Completed', endDate: '2026-07-31' }), 80, today)
    ).toEqual({ kind: 'completed' });

    expect(
      computeProjectHealthSchedule(makeProject({ status: 'Active', endDate: '2026-07-31' }), 100, today)
    ).toEqual({ kind: 'completed' });

    expect(
      computeProjectHealthSchedule(makeProject({ status: 'Active', endDate: undefined }), 40, today)
    ).toEqual({ kind: 'ongoing' });

    expect(
      computeProjectHealthSchedule(makeProject({ status: 'Active', endDate: '2026-11-06' }), 40, today)
    ).toEqual({ kind: 'overdue', days: 10 });

    expect(
      computeProjectHealthSchedule(makeProject({ status: 'Active', endDate: '2026-11-26' }), 40, today)
    ).toEqual({ kind: 'days_left', days: 10 });
  });
});
