import { describe, expect, it } from 'vitest';
import type { Project, Task } from '../../types';
import {
  buildGanttAxis,
  computeBarPlacement,
  computeSmartTimelineBounds,
  hasInvertedProjectDates,
  parsePlanDateMs,
} from './ganttScaleUtils';

const makeTask = (overrides: Partial<Task> & { id: string; title: string }): Task => ({
  projectId: 'p_twd',
  description: '',
  status: 'Done',
  priority: 'Medium',
  estimatedHours: 8,
  createdAt: '2026-05-01T00:00:00.000Z',
  ...overrides,
});

describe('ganttScaleUtils', () => {
  it('detects inverted project dates and derives smart bounds from milestones and subtasks', () => {
    const invertedProject: Project = {
      id: 'p_twd',
      name: 'TWD_LON',
      description: '',
      status: 'Active',
      startDate: '2026-06-10',
      endDate: '2026-05-29',
      members: [],
      projectType: 'dev',
    };

    expect(hasInvertedProjectDates(invertedProject)).toBe(true);

    const milestones: Task[] = [
      makeTask({ id: 'm1', title: 'Kickoff', startDate: '2026-05-29', endDate: '2026-05-29' }),
      makeTask({ id: 'm2', title: 'Release', startDate: '2026-08-20', endDate: '2026-08-26' }),
      makeTask({ id: 'm3', title: 'Undated', startDate: undefined, endDate: undefined }),
    ];
    const allTasks: Task[] = [
      ...milestones,
      makeTask({ id: 's1', parentId: 'm2', title: 'Post-release check', startDate: '2026-08-26', endDate: '2026-08-28' }),
    ];

    const bounds = computeSmartTimelineBounds(invertedProject, milestones, allTasks, [invertedProject]);
    expect(bounds.hasInvertedDates).toBe(true);
    expect(bounds.totalDays).toBe(91); // 2026-05-29 -> 2026-08-28
  });

  it('builds calendar-aligned axes for week, month, quarter, and fit modes with Today offset', () => {
    const startMs = parsePlanDateMs('2026-05-29')!;
    const endMs = parsePlanDateMs('2026-08-26')!;
    const bounds = { startMs, endMs, totalDays: 89, hasInvertedDates: false };
    const midJuneMs = parsePlanDateMs('2026-06-15')!;

    const monthAxis = buildGanttAxis(bounds, 'month', midJuneMs);
    expect(monthAxis.topGroups.map((g) => g.label)).toEqual([
      'May 2026',
      'Jun 2026',
      'Jul 2026',
      'Aug 2026',
    ]);
    expect(monthAxis.columns).toHaveLength(16); // 4 months * W1..W4
    expect(monthAxis.totalWidthPx).toBe((31 + 30 + 31 + 31) * 12);
    expect(monthAxis.todayOffsetPct).not.toBeNull();
    expect(monthAxis.todayOffsetPct!).toBeGreaterThan(30);
    expect(monthAxis.todayOffsetPct!).toBeLessThan(45);

    const quarterAxis = buildGanttAxis(bounds, 'quarter', parsePlanDateMs('2026-11-13')!);
    expect(quarterAxis.topGroups.map((g) => g.label)).toEqual(['Q2 2026', 'Q3 2026']);
    expect(quarterAxis.columns.map((c) => c.label)).toEqual(['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']);
    expect(quarterAxis.todayOffsetPct).toBeNull(); // Nov 2026 outside Q2-Q3 2026

    const weekAxis = buildGanttAxis(bounds, 'week', midJuneMs);
    expect(weekAxis.totalWidthPx).toBeGreaterThan(3000);
    expect(weekAxis.columns.length).toBeGreaterThanOrEqual(91);

    const fitAxis = buildGanttAxis(bounds, 'fit', midJuneMs);
    expect(fitAxis.totalWidthPx).toBeNull();
    expect(fitAxis.topGroups.length).toBeGreaterThanOrEqual(2);
  });

  it('computes unscheduled flag, single-day inclusive width, and non-clipping label placement', () => {
    const axisStart = parsePlanDateMs('2026-05-01')!;
    const axisEnd = parsePlanDateMs('2026-09-01')!;
    const totalWidthPx = 123 * 12;

    const unscheduled = computeBarPlacement(undefined, undefined, axisStart, axisEnd, totalWidthPx);
    expect(unscheduled.isUnscheduled).toBe(true);

    const singleDayEarly = computeBarPlacement('2026-05-29', '2026-05-29', axisStart, axisEnd, totalWidthPx);
    expect(singleDayEarly.isUnscheduled).toBe(false);
    expect(singleDayEarly.widthPct).toBeGreaterThan(0.5);
    expect(singleDayEarly.labelPosition).toBe('right');

    const singleDayRightEdge = computeBarPlacement('2026-08-30', '2026-08-31', axisStart, axisEnd, totalWidthPx);
    expect(singleDayRightEdge.labelPosition).toBe('left');

    const multiWeek = computeBarPlacement('2026-06-01', '2026-06-20', axisStart, axisEnd, totalWidthPx);
    expect(multiWeek.labelPosition).toBe('inside');
  });
});
