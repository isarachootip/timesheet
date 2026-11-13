import { describe, it, expect } from 'vitest';
import { getRouteMeta, NAV_ROUTES } from '../routeMeta';

describe('routeMeta', () => {
  it('returns distinct route-specific titles and never falls back to System Overview', () => {
    const routes = [
      '/',
      '/projects',
      '/project-plan',
      '/tasks',
      '/timesheet',
      '/notes',
      '/chat',
      '/team',
      '/reports',
      '/settings',
      '/help',
    ];

    const titles = routes.map((path) => getRouteMeta(path).title);
    for (const title of titles) {
      expect(title).not.toBe('System Overview');
      expect(title.trim().length).toBeGreaterThan(0);
    }
    expect(new Set(titles).size).toBe(routes.length);
  });

  it('maps /tasks and /project-plan to Tasks and Project Plan explicitly', () => {
    expect(getRouteMeta('/tasks').title).toBe('Tasks');
    expect(getRouteMeta('/project-plan').title).toBe('Project Plan');
    expect(getRouteMeta('/').title).toBe('Dashboard');
    expect(NAV_ROUTES.length).toBeGreaterThanOrEqual(10);
  });
});
