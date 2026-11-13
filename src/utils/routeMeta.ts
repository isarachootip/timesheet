export interface RouteMeta {
  path: string;
  title: string;
  subtitle: string;
  shortcut?: string;
}

export const NAV_ROUTES: RouteMeta[] = [
  { path: '/', title: 'Dashboard', subtitle: 'My tasks and project health overview', shortcut: 'G D' },
  { path: '/projects', title: 'Projects', subtitle: 'Workspace projects and team assignments', shortcut: 'G P' },
  { path: '/project-plan', title: 'Project Plan', subtitle: 'Milestones, Gantt timeline, and baselines', shortcut: 'G L' },
  { path: '/tasks', title: 'Tasks', subtitle: 'Kanban board, sprints, and releases', shortcut: 'G T' },
  { path: '/timesheet', title: 'Timesheet', subtitle: 'Daily work logs and submissions', shortcut: 'G I' },
  { path: '/notes', title: 'Post-it Notes', subtitle: 'Personal reminders and quick timesheet import' },
  { path: '/chat', title: 'Team Chat', subtitle: 'Project discussions and mentions' },
  { path: '/team', title: 'Team & Users', subtitle: 'Directory and timesheet approvals' },
  { path: '/reports', title: 'Reports', subtitle: 'Utilization, cost analytics, and yearly summary' },
  { path: '/settings', title: 'Settings', subtitle: 'Templates, permissions, cost rates, and system config' },
  { path: '/help', title: 'Help / FAQ', subtitle: 'Guides and workspace documentation' },
];

export const getRouteMeta = (pathname: string): RouteMeta => {
  const exact = NAV_ROUTES.find((route) => route.path === pathname);
  if (exact) return exact;
  const prefix = NAV_ROUTES.find((route) => route.path !== '/' && pathname.startsWith(route.path));
  return prefix ?? NAV_ROUTES[0];
};
