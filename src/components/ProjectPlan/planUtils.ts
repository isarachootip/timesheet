import type { PermissionScheme, Project, Task, TaskStatus, TaskTemplate, User } from '../../types';
import { formatToDDMMYYYY } from '../../utils';
import { hasProjectPermission } from '../../utils/projectPermissions';

export interface Baseline {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  createdAt: string;
  createdBy?: string;
  isActive: boolean;
}

export interface TaskSnapshotMetrics {
  startDate?: string;
  endDate?: string;
  estimatedHours: number;
  storyPoints: number;
  status: string;
}

export interface TaskComparison {
  taskId: string;
  title: string;
  base: TaskSnapshotMetrics | null;
  compare: TaskSnapshotMetrics | null;
}

export interface CompareData {
  projectId: string;
  baseBaseline: { id: string; name: string };
  compareBaseline: { id: string; name: string };
  varianceSummary: {
    daysDrift: number;
    storyPointsDrift: number;
    estimatedHoursDrift: number;
    actualHoursLogged: number;
  };
  tasks: TaskComparison[];
}

export interface TimelineRange {
  projStart: number;
  projEnd: number;
  projDuration: number;
  totalDays: number;
  ticks: string[];
  displayStart: string;
  displayEnd: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export const filterTemplatesToGenerate = (
  templates: TaskTemplate[],
  existingTasks: Task[],
  projectId: string
): { toCreate: TaskTemplate[]; skippedCount: number } => {
  const existingTitles = new Set(
    existingTasks.filter((t) => t.projectId === projectId && !t.parentId).map((t) => t.title.trim().toLowerCase())
  );
  const sorted = [...templates].sort((a, b) => a.startPercent - b.startPercent);
  const seen = new Set<string>();
  const toCreate: TaskTemplate[] = [];
  let skippedCount = 0;

  for (const tpl of sorted) {
    const key = tpl.title.trim().toLowerCase();
    if (!key || existingTitles.has(key) || seen.has(key)) {
      skippedCount += 1;
      continue;
    }
    seen.add(key);
    toCreate.push(tpl);
  }
  return { toCreate, skippedCount };
};

export const buildTasksFromTemplates = (templates: TaskTemplate[], project: Project): Task[] => {
  if (!project.startDate || !project.endDate) return [];
  const startMs = new Date(project.startDate).getTime();
  const totalMs = new Date(project.endDate).getTime() - startMs;
  const nowIso = new Date().toISOString();

  return templates.map((tpl) => ({
    id: `t_${Math.random().toString(36).slice(2, 11)}`,
    projectId: project.id,
    title: tpl.title.trim(),
    description: tpl.description,
    status: 'To Do' as TaskStatus,
    priority: tpl.priority,
    estimatedHours: tpl.estimatedHours,
    createdAt: nowIso,
    startDate: new Date(startMs + (totalMs * tpl.startPercent) / 100).toISOString().split('T')[0],
    endDate: new Date(startMs + (totalMs * tpl.endPercent) / 100).toISOString().split('T')[0],
  }));
};

export const getVisibleProjectsForPlan = (
  projects: Project[],
  currentUser: User | null | undefined,
  permissionSchemes: PermissionScheme[]
): Project[] =>
  projects.filter((p) => hasProjectPermission(currentUser, projects, permissionSchemes, p.id, 'view_project'));

export const getMilestonesForSelection = (
  tasks: Task[],
  visibleProjects: Project[],
  selectedProjectId: string
): Task[] => {
  const nonSupportIds = new Set(visibleProjects.filter((p) => p.projectType !== 'support').map((p) => p.id));
  return tasks
    .filter((t) => !t.parentId && (selectedProjectId === 'all' ? nonSupportIds.has(t.projectId) : t.projectId === selectedProjectId))
    .sort((a, b) => {
      const aDate = a.startDate ? new Date(a.startDate).getTime() : new Date(a.createdAt).getTime();
      const bDate = b.startDate ? new Date(b.startDate).getTime() : new Date(b.createdAt).getTime();
      return aDate - bDate;
    });
};

export const calculateMilestoneProgress = (tasks: Task[], milestoneId: string, fallbackStatus: string): number => {
  const subs = tasks.filter((t) => t.parentId === milestoneId);
  if (subs.length > 0) return Math.round((subs.filter((s) => s.status === 'Done').length / subs.length) * 100);
  if (fallbackStatus === 'Done') return 100;
  if (fallbackStatus === 'Review') return 80;
  if (fallbackStatus === 'In Progress') return 40;
  return 0;
};

export const computePlanTimelineRange = (
  selectedProject: Project | undefined,
  milestones: Task[],
  visibleProjects: Project[]
): TimelineRange => {
  let projStart = selectedProject?.startDate ? new Date(selectedProject.startDate).getTime() : 0;
  let projEnd = selectedProject?.endDate
    ? new Date(selectedProject.endDate).getTime()
    : projStart ? projStart + 30 * DAY_MS : 0;

  if (!selectedProject) {
    const starts: number[] = [];
    const ends: number[] = [];
    for (const p of visibleProjects.filter((item) => item.projectType !== 'support')) {
      if (p.startDate) starts.push(new Date(p.startDate).getTime());
      if (p.endDate) ends.push(new Date(p.endDate).getTime());
    }
    for (const m of milestones) {
      if (m.startDate) starts.push(new Date(m.startDate).getTime());
      if (m.endDate) ends.push(new Date(m.endDate).getTime());
    }
    projStart = starts.length > 0 ? Math.min(...starts) : Date.now();
    projEnd = ends.length > 0 ? Math.max(...ends) : projStart + 30 * DAY_MS;
  }

  const projDuration = Math.max(DAY_MS, projEnd - projStart);
  const ticks = Array.from({ length: 5 }, (_, i) =>
    formatToDDMMYYYY(new Date(projStart + (projDuration * i) / 4))
  );

  return {
    projStart,
    projEnd,
    projDuration,
    totalDays: Math.round(projDuration / DAY_MS),
    ticks,
    displayStart: formatToDDMMYYYY(new Date(projStart)),
    displayEnd: formatToDDMMYYYY(new Date(projEnd)),
  };
};

export const getGanttBarGeometry = (
  startDate: string | undefined,
  endDate: string | undefined,
  projStart: number,
  projEnd: number,
  projDuration: number
): { leftOffset: number; widthVal: number } => {
  if (projDuration <= 0) return { leftOffset: 0, widthVal: 100 };
  const startMs = startDate ? new Date(startDate).getTime() : projStart;
  const endMs = endDate ? new Date(endDate).getTime() : Math.min(projEnd, startMs + 5 * DAY_MS);
  const leftOffset = Math.max(0, Math.min(100, ((startMs - projStart) / projDuration) * 100));
  const rawWidth = ((endMs - startMs) / projDuration) * 100;
  return { leftOffset, widthVal: Math.max(2, Math.min(100 - leftOffset, rawWidth)) };
};
