import type { DbQueryable, ProjectHealthConfigOverrides, ProjectHealthResult } from './projectHealthEngine.js';

export interface OverdueTaskContextItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  daysOverdue: number;
  estimatedHours: number;
  assigneeName: string;
}

export interface InProgressTaskContextItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  estimatedHours: number;
  assigneeName: string;
}

export interface MilestoneHoursComparisonItem {
  milestoneId: string;
  title: string;
  status: string;
  progressPercent: number;
  estimatedHours: number;
  actualHours: number;
  varianceHours: number;
}

export interface ProjectHealthAiContext {
  project: Record<string, unknown>;
  health: Record<string, unknown>;
  dataIssues: ProjectHealthResult['dataIssues'];
  overdueTasks: OverdueTaskContextItem[];
  inProgressTasks: InProgressTaskContextItem[];
  milestoneHoursComparison: MilestoneHoursComparisonItem[];
  recentSnapshots: Array<Record<string, unknown>>;
}

export function buildProjectHealthAiContext(
  projectId: string,
  liveHealth: ProjectHealthResult,
  options?: {
    db?: DbQueryable;
    referenceDate?: Date | string;
    config?: ProjectHealthConfigOverrides;
  }
): Promise<ProjectHealthAiContext>;
