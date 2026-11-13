import { describe, it, expect } from 'vitest';
import {
  isTaskOverdue,
  getOverdueDays,
  isCriticalOverdue,
  isTaskDueSoon,
} from '../overdueUtils';
import type { Task } from '../../types';

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

describe('overdueUtils', () => {
  const today = new Date('2026-11-13T00:00:00');

  it('detects overdue only when endDate is strictly before today and status is not Done', () => {
    expect(isTaskOverdue(makeTask({ endDate: '2026-11-12' }), today)).toBe(true);
    expect(isTaskOverdue(makeTask({ endDate: '2026-11-13' }), today)).toBe(false);
    expect(isTaskOverdue(makeTask({ endDate: '2026-11-10', status: 'Done' }), today)).toBe(false);
    expect(isTaskOverdue(makeTask({ endDate: undefined }), today)).toBe(false);
  });

  it('computes exact overdue days', () => {
    expect(getOverdueDays(makeTask({ endDate: '2026-11-05' }), today)).toBe(8);
    expect(getOverdueDays(makeTask({ endDate: '2026-11-12' }), today)).toBe(1);
    expect(getOverdueDays(makeTask({ endDate: '2026-11-15' }), today)).toBe(0);
  });

  it('marks overdue task as critical only if Urgent or overdue > 7 days', () => {
    expect(
      isCriticalOverdue(makeTask({ endDate: '2026-11-12', priority: 'Urgent' }), today)
    ).toBe(true);
    expect(
      isCriticalOverdue(makeTask({ endDate: '2026-11-05', priority: 'Low' }), today)
    ).toBe(true);
    expect(
      isCriticalOverdue(makeTask({ endDate: '2026-11-06', priority: 'High' }), today)
    ).toBe(false);
    expect(
      isCriticalOverdue(makeTask({ endDate: '2026-11-20', priority: 'Urgent' }), today)
    ).toBe(false);
  });

  it('detects due soon within 0..3 days', () => {
    expect(isTaskDueSoon(makeTask({ endDate: '2026-11-13' }), today)).toBe(true);
    expect(isTaskDueSoon(makeTask({ endDate: '2026-11-16' }), today)).toBe(true);
    expect(isTaskDueSoon(makeTask({ endDate: '2026-11-17' }), today)).toBe(false);
    expect(isTaskDueSoon(makeTask({ endDate: '2026-11-12' }), today)).toBe(false);
  });
});
