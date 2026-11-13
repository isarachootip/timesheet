import type { Task } from '../types';

const normalizeLocalMidnight = (date: Date): Date => {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const parseTaskDate = (dateStr?: string): Date | null => {
  if (!dateStr) return null;
  const datePart = dateStr.split('T')[0];
  const [y, m, d] = datePart.split('-').map(Number);
  if (y && m && d) {
    return new Date(y, m - 1, d);
  }
  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime()) ? null : normalizeLocalMidnight(parsed);
};

export const isTaskOverdue = (task: Task, referenceDate: Date = new Date()): boolean => {
  if (!task.endDate || task.status === 'Done') return false;
  const end = parseTaskDate(task.endDate);
  if (!end) return false;
  const today = normalizeLocalMidnight(referenceDate);
  return end.getTime() < today.getTime();
};

export const getOverdueDays = (task: Task, referenceDate: Date = new Date()): number => {
  if (!isTaskOverdue(task, referenceDate)) return 0;
  const end = parseTaskDate(task.endDate)!;
  const today = normalizeLocalMidnight(referenceDate);
  return Math.max(0, Math.round((today.getTime() - end.getTime()) / (1000 * 60 * 60 * 24)));
};

export const isCriticalOverdue = (task: Task, referenceDate: Date = new Date()): boolean => {
  if (!isTaskOverdue(task, referenceDate)) return false;
  return task.priority === 'Urgent' || getOverdueDays(task, referenceDate) > 7;
};

export const isTaskDueSoon = (task: Task, referenceDate: Date = new Date()): boolean => {
  if (!task.endDate || task.status === 'Done') return false;
  const end = parseTaskDate(task.endDate);
  if (!end) return false;
  const today = normalizeLocalMidnight(referenceDate);
  const diffDays = Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 3;
};
