import type { Project, ProjectStatus, User } from '../types';

const LOGGABLE_STATUSES: ReadonlySet<ProjectStatus> = new Set(['Active', 'Planning']);

export function canLogTimesheetForStatus(status: ProjectStatus): boolean {
  return LOGGABLE_STATUSES.has(status);
}

export function isProjectVisibleToUser(
  project: Project,
  currentUser: User | null | undefined
): boolean {
  if (!currentUser) return false;
  if (currentUser.globalRole === 'Admin' || currentUser.globalRole === 'Manager') return true;
  return Boolean(project.members?.some((m) => m.userId === currentUser.id));
}

export type ProjectTimesheetGuardResult =
  | { allowed: true; project: Project }
  | { allowed: false; reason: 'not_found' | 'inactive_status'; message: string };

export function validateProjectTimesheetNavigation(
  project: Project | undefined,
  currentUser: User | null | undefined
): ProjectTimesheetGuardResult {
  if (!project || !isProjectVisibleToUser(project, currentUser)) {
    return {
      allowed: false,
      reason: 'not_found',
      message: 'ไม่พบโปรเจกต์ที่ระบุ หรือคุณไม่มีสิทธิ์เข้าถึงโปรเจกต์นี้',
    };
  }
  if (!canLogTimesheetForStatus(project.status)) {
    return {
      allowed: false,
      reason: 'inactive_status',
      message: `ไม่สามารถลงเวลาในโปรเจกต์ "${project.name}" ได้ เนื่องจากมีสถานะเป็น ${project.status} (อนุญาตเฉพาะ Active และ Planning)`,
    };
  }
  return { allowed: true, project };
}

export function getLoggableProjects(
  projects: Project[],
  currentUser: User | null | undefined,
  editingProjectId?: string
): Project[] {
  return projects.filter((project) => {
    if (!isProjectVisibleToUser(project, currentUser)) return false;
    if (editingProjectId && project.id === editingProjectId) return true;
    return canLogTimesheetForStatus(project.status);
  });
}

export function buildProjectTimesheetLogUrl(projectId: string): string {
  const params = new URLSearchParams({ projectId, action: 'log' });
  return `/timesheet?${params.toString()}`;
}

export function isInteractiveDescendant(
  target: EventTarget | null,
  container: HTMLElement
): boolean {
  if (!(target instanceof Element)) return false;
  const interactive = target.closest(
    'button, a, input, select, textarea, label, summary, details, [data-no-row-nav="true"]'
  );
  return Boolean(interactive && interactive !== container && container.contains(interactive));
}
