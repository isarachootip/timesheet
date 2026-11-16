import type { Project, ProjectWorkflow, Task } from '../types';

export interface OverdueContext {
  project?: Project;
  workflow?: ProjectWorkflow;
}

export type ProjectScheduleState =
  | { kind: 'ongoing' }
  | { kind: 'completed' }
  | { kind: 'days_left'; days: number }
  | { kind: 'overdue'; days: number };

const TERMINAL_STATUS_NAMES = new Set(['done', 'completed', 'closed', 'released']);

const DAY_MS = 1000 * 60 * 60 * 24;

const normalizeLocalMidnight = (date: Date): Date => {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const parseIsoDateLocal = (dateStr?: string): Date | null => {
  if (!dateStr) return null;
  const datePart = dateStr.split('T')[0];
  const [y, m, d] = datePart.split('-').map(Number);
  if (y && m && d) {
    return new Date(y, m - 1, d);
  }
  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime()) ? null : normalizeLocalMidnight(parsed);
};

export const getProjectFinalStatus = (
  project?: Project,
  workflow?: ProjectWorkflow
): string => {
  if (workflow?.statuses && workflow.statuses.length > 0) {
    return workflow.statuses[workflow.statuses.length - 1];
  }
  if (project?.customColumns && project.customColumns.length > 0) {
    return project.customColumns[project.customColumns.length - 1];
  }
  return 'Done';
};

export const isTaskDone = (
  task: Pick<Task, 'status'>,
  project?: Project,
  workflow?: ProjectWorkflow
): boolean => {
  const normalized = (task.status || '').trim().toLowerCase();
  if (!normalized) return false;
  if (TERMINAL_STATUS_NAMES.has(normalized)) return true;

  const finalStatus = getProjectFinalStatus(project, workflow).trim().toLowerCase();
  return normalized === finalStatus;
};

export const isSupportBucketTask = (
  task: Pick<Task, 'parentId'>,
  project?: Pick<Project, 'projectType'>
): boolean => project?.projectType === 'support' && !task.parentId;

export const isTaskOverdue = (
  task: Task,
  referenceDate: Date = new Date(),
  context?: OverdueContext
): boolean => {
  if (!task.endDate) return false;
  if (isTaskDone(task, context?.project, context?.workflow)) return false;
  if (isSupportBucketTask(task, context?.project)) return false;

  const end = parseIsoDateLocal(task.endDate);
  if (!end) return false;
  const today = normalizeLocalMidnight(referenceDate);
  return end.getTime() < today.getTime();
};

export const getOverdueDays = (
  task: Task,
  referenceDate: Date = new Date(),
  context?: OverdueContext
): number => {
  if (!isTaskOverdue(task, referenceDate, context)) return 0;
  const end = parseIsoDateLocal(task.endDate)!;
  const today = normalizeLocalMidnight(referenceDate);
  return Math.max(0, Math.round((today.getTime() - end.getTime()) / DAY_MS));
};

export const isCriticalOverdue = (
  task: Task,
  referenceDate: Date = new Date(),
  context?: OverdueContext
): boolean => {
  if (!isTaskOverdue(task, referenceDate, context)) return false;
  return task.priority === 'Urgent' || getOverdueDays(task, referenceDate, context) > 7;
};

export const isTaskDueSoon = (
  task: Task,
  referenceDate: Date = new Date(),
  context?: OverdueContext
): boolean => {
  if (!task.endDate) return false;
  if (isTaskDone(task, context?.project, context?.workflow)) return false;
  if (isSupportBucketTask(task, context?.project)) return false;

  const end = parseIsoDateLocal(task.endDate);
  if (!end) return false;
  const today = normalizeLocalMidnight(referenceDate);
  const diffDays = Math.round((end.getTime() - today.getTime()) / DAY_MS);
  return diffDays >= 0 && diffDays <= 3;
};

export const computeProjectHealthSchedule = (
  project: Pick<Project, 'status' | 'endDate' | 'projectType'>,
  progress: number,
  referenceDate: Date = new Date()
): ProjectScheduleState => {
  if (project.projectType === 'support') {
    return { kind: 'ongoing' };
  }
  if (project.status === 'Completed' || progress >= 100) {
    return { kind: 'completed' };
  }
  const end = parseIsoDateLocal(project.endDate);
  if (!end) {
    return { kind: 'ongoing' };
  }
  const today = normalizeLocalMidnight(referenceDate);
  const diffDays = Math.round((end.getTime() - today.getTime()) / DAY_MS);
  if (diffDays < 0) {
    return { kind: 'overdue', days: Math.abs(diffDays) };
  }
  return { kind: 'days_left', days: diffDays };
};
