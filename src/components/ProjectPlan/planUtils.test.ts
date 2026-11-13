import { describe, it, expect } from 'vitest';
import type { PermissionScheme, Project, Task, TaskTemplate, User } from '../../types';
import {
  filterTemplatesToGenerate,
  buildTasksFromTemplates,
  getVisibleProjectsForPlan,
  getMilestonesForSelection,
  calculateMilestoneProgress,
  computePlanTimelineRange,
  getGanttBarGeometry,
} from './planUtils';

const sampleUser: User = {
  id: 'u1',
  name: 'Alice',
  email: 'alice@example.com',
  avatar: '',
  globalRole: 'Member',
};

const defaultScheme: PermissionScheme = {
  id: 'scheme_default',
  name: 'Default',
  permissions: { view_project: ['Member'] },
};

const projects: Project[] = [
  {
    id: 'p1',
    name: 'TWD_LON',
    description: '',
    status: 'Active',
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    members: [{ userId: 'u1', role: 'Member' }],
    projectType: 'project',
  },
  {
    id: 'p2',
    name: 'kex-vfix',
    description: '',
    status: 'Active',
    startDate: '2026-02-01',
    endDate: '2026-03-01',
    members: [{ userId: 'u1', role: 'Member' }],
    projectType: 'project',
  },
  {
    id: 'p3',
    name: 'Helpdesk',
    description: '',
    status: 'Active',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    members: [{ userId: 'u1', role: 'Member' }],
    projectType: 'support',
  },
];

describe('planUtils', () => {
  it('filters out duplicate templates ignoring whitespace and casing', () => {
    const templates: TaskTemplate[] = [
      {
        id: 'tpl1',
        title: 'Kick off Meeting',
        description: 'Start',
        priority: 'High',
        startPercent: 0,
        endPercent: 10,
        estimatedHours: 4,
      },
      {
        id: 'tpl2',
        title: 'UAT',
        description: 'Testing',
        priority: 'Medium',
        startPercent: 70,
        endPercent: 90,
        estimatedHours: 16,
      },
    ];

    const existingTasks: Task[] = [
      {
        id: 't1',
        projectId: 'p1',
        title: '  kick off meeting ',
        status: 'To Do',
        priority: 'High',
        estimatedHours: 4,
        createdAt: '2026-01-01',
      },
      {
        id: 't2',
        projectId: 'p2',
        title: 'UAT',
        status: 'To Do',
        priority: 'Medium',
        estimatedHours: 8,
        createdAt: '2026-01-01',
      },
    ];

    const { toCreate, skippedCount } = filterTemplatesToGenerate(templates, existingTasks, 'p1');
    expect(skippedCount).toBe(1);
    expect(toCreate.map((t) => t.id)).toEqual(['tpl2']);

    const built = buildTasksFromTemplates(toCreate, projects[0]);
    expect(built).toHaveLength(1);
    expect(built[0].projectId).toBe('p1');
    expect(built[0].title).toBe('UAT');
  });

  it('filters visible projects and aggregates non-support milestones in all mode', () => {
    const visible = getVisibleProjectsForPlan(projects, sampleUser, [defaultScheme]);
    expect(visible.map((p) => p.id)).toEqual(['p1', 'p2', 'p3']);

    const tasks: Task[] = [
      { id: 'm1', projectId: 'p1', title: 'Alpha', status: 'Done', priority: 'Medium', estimatedHours: 8, createdAt: '2026-01-02', startDate: '2026-01-05' },
      { id: 'sub1', projectId: 'p1', parentId: 'm1', title: 'Child', status: 'To Do', priority: 'Low', estimatedHours: 2, createdAt: '2026-01-03' },
      { id: 'm2', projectId: 'p2', title: 'Beta', status: 'To Do', priority: 'Urgent', estimatedHours: 8, createdAt: '2026-01-01', startDate: '2026-01-02' },
      { id: 'm3', projectId: 'p3', title: 'Support Ticket', status: 'To Do', priority: 'Low', estimatedHours: 1, createdAt: '2026-01-01' },
    ];

    const allMilestones = getMilestonesForSelection(tasks, visible, 'all');
    expect(allMilestones.map((m) => m.id)).toEqual(['m2', 'm1']);

    const p1Milestones = getMilestonesForSelection(tasks, visible, 'p1');
    expect(p1Milestones.map((m) => m.id)).toEqual(['m1']);
  });

  it('calculates milestone progress, aggregate timeline range, and clamped Gantt geometry', () => {
    const tasks: Task[] = [
      { id: 'm1', projectId: 'p1', title: 'M1', status: 'In Progress', priority: 'High', estimatedHours: 8, createdAt: '2026-01-01', startDate: '2026-01-01', endDate: '2026-01-11' },
      { id: 's1', projectId: 'p1', parentId: 'm1', title: 'S1', status: 'Done', priority: 'Low', estimatedHours: 4, createdAt: '2026-01-01' },
      { id: 's2', projectId: 'p1', parentId: 'm1', title: 'S2', status: 'To Do', priority: 'Low', estimatedHours: 4, createdAt: '2026-01-01' },
    ];

    expect(calculateMilestoneProgress(tasks, 'm1', 'In Progress')).toBe(50);

    const range = computePlanTimelineRange(undefined, [tasks[0]], [projects[0], projects[1]]);
    expect(range.totalDays).toBe(59);
    expect(range.ticks).toHaveLength(5);

    const geom = getGanttBarGeometry(tasks[0].startDate, tasks[0].endDate, range.projStart, range.projEnd, range.projDuration);
    expect(geom.leftOffset).toBe(0);
    expect(geom.widthVal).toBeGreaterThan(15);
    expect(geom.widthVal).toBeLessThan(20);
  });

  it('ignores inverted project dates and spans milestones + subtasks in computePlanTimelineRange', () => {
    const invertedProj: Project = {
      id: 'p_inv',
      name: 'TWD_LON',
      description: '',
      status: 'Active',
      startDate: '2026-06-10',
      endDate: '2026-05-29',
      members: [],
      projectType: 'dev',
    };
    const ms: Task[] = [
      { id: 'm1', projectId: 'p_inv', title: 'Kickoff', description: '', status: 'Done', priority: 'High', estimatedHours: 4, createdAt: '2026-05-01', startDate: '2026-05-29', endDate: '2026-05-29' },
      { id: 'm2', projectId: 'p_inv', title: 'Handover', description: '', status: 'Done', priority: 'High', estimatedHours: 8, createdAt: '2026-05-01', startDate: '2026-08-26', endDate: '2026-08-26' },
    ];
    const range = computePlanTimelineRange(invertedProj, ms, [invertedProj], ms);
    expect(range.hasInvertedDates).toBe(true);
    expect(range.totalDays).toBe(89);
    expect(range.displayStart).toBe('29/05/2026');
    expect(range.displayEnd).toBe('26/08/2026');
  });
});
