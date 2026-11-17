import { describe, it, expect } from 'vitest';
import { parseTimesheetAutoOpenIntent } from '../../schemas/timesheetNavigationSchema';
import {
  buildProjectTimesheetLogUrl,
  canLogTimesheetForStatus,
  getLoggableProjects,
  isInteractiveDescendant,
  validateProjectTimesheetNavigation,
} from '../projectTimesheetNavigation';
import type { Project, User } from '../../types';

const adminUser: User = {
  id: 'u_admin',
  name: 'Admin',
  email: 'admin@test.com',
  avatar: '',
  globalRole: 'Admin',
  department: 'IT',
};

const employeeMember: User = {
  id: 'u_emp_1',
  name: 'Dev One',
  email: 'dev1@test.com',
  avatar: '',
  globalRole: 'Employee',
  department: 'Dev',
};

const employeeOutsider: User = {
  id: 'u_emp_2',
  name: 'Outsider',
  email: 'out@test.com',
  avatar: '',
  globalRole: 'Employee',
  department: 'Sales',
};

const makeProject = (overrides: Partial<Project>): Project => ({
  id: 'p_default',
  name: 'Sample Project',
  description: 'Desc',
  status: 'Active',
  startDate: '2026-01-01',
  members: [{ userId: 'u_emp_1', role: 'Frontend dev' }],
  ...overrides,
});

describe('timesheetNavigationSchema - parseTimesheetAutoOpenIntent', () => {
  it('parses valid URL query parameters (?projectId=...&action=log)', () => {
    const intent = parseTimesheetAutoOpenIntent('?projectId=p_123&action=log', null);
    expect(intent).toEqual({ source: 'query', projectId: 'p_123' });
  });

  it('rejects malformed or incomplete URL query parameters', () => {
    expect(parseTimesheetAutoOpenIntent('?projectId=p_123', null)).toBeNull();
    expect(parseTimesheetAutoOpenIntent('?action=log', null)).toBeNull();
    expect(parseTimesheetAutoOpenIntent('?projectId=%20%20&action=log', null)).toBeNull();
    expect(parseTimesheetAutoOpenIntent('?projectId=p_123&action=view', null)).toBeNull();
  });

  it('parses valid router location.state payload', () => {
    const intent = parseTimesheetAutoOpenIntent('', {
      autoOpenLog: true,
      projectId: 'p_55',
      taskId: 't_9',
      taskTitle: 'API integration',
      workResults: 'Completed endpoint',
      date: '2026-11-17',
      noteId: 'n_1',
    });
    expect(intent).toEqual({
      source: 'state',
      projectId: 'p_55',
      taskId: 't_9',
      taskTitle: 'API integration',
      workResults: 'Completed endpoint',
      date: '2026-11-17',
      noteId: 'n_1',
    });
  });

  it('returns null when both query and state are invalid', () => {
    expect(parseTimesheetAutoOpenIntent('', { autoOpenLog: false })).toBeNull();
    expect(parseTimesheetAutoOpenIntent('', undefined)).toBeNull();
  });
});

describe('projectTimesheetNavigation domain helpers', () => {
  it('allows only Active and Planning project statuses', () => {
    expect(canLogTimesheetForStatus('Active')).toBe(true);
    expect(canLogTimesheetForStatus('Planning')).toBe(true);
    expect(canLogTimesheetForStatus('Completed')).toBe(false);
    expect(canLogTimesheetForStatus('On Hold')).toBe(false);
  });

  it('validates Active/Planning projects for members and Admins (even outside members)', () => {
    const activeProj = makeProject({ id: 'p_act', status: 'Active', members: [] });
    const planningProj = makeProject({ id: 'p_plan', status: 'Planning' });

    expect(validateProjectTimesheetNavigation(activeProj, adminUser)).toEqual({
      allowed: true,
      project: activeProj,
    });
    expect(validateProjectTimesheetNavigation(planningProj, employeeMember)).toEqual({
      allowed: true,
      project: planningProj,
    });
  });

  it('blocks Completed and On Hold projects with inactive_status reason', () => {
    const completedProj = makeProject({ id: 'p_done', name: 'Legacy ERP', status: 'Completed' });
    const holdProj = makeProject({ id: 'p_hold', name: 'Paused App', status: 'On Hold' });

    const r1 = validateProjectTimesheetNavigation(completedProj, adminUser);
    expect(r1.allowed).toBe(false);
    if (!r1.allowed) {
      expect(r1.reason).toBe('inactive_status');
      expect(r1.message).toContain('Legacy ERP');
      expect(r1.message).toContain('Completed');
    }

    const r2 = validateProjectTimesheetNavigation(holdProj, employeeMember);
    expect(r2.allowed).toBe(false);
    if (!r2.allowed) {
      expect(r2.reason).toBe('inactive_status');
      expect(r2.message).toContain('On Hold');
    }
  });

  it('blocks missing projects or non-member employees with not_found reason', () => {
    const activeProj = makeProject({ id: 'p_act', status: 'Active' });
    expect(validateProjectTimesheetNavigation(undefined, adminUser)).toMatchObject({
      allowed: false,
      reason: 'not_found',
    });
    expect(validateProjectTimesheetNavigation(activeProj, employeeOutsider)).toMatchObject({
      allowed: false,
      reason: 'not_found',
    });
  });

  it('filters loggable projects for new entries while preserving editingProjectId on edit', () => {
    const projects: Project[] = [
      makeProject({ id: 'p_active', status: 'Active' }),
      makeProject({ id: 'p_plan', status: 'Planning' }),
      makeProject({ id: 'p_done', status: 'Completed' }),
      makeProject({ id: 'p_hold', status: 'On Hold' }),
      makeProject({ id: 'p_other_team', status: 'Active', members: [] }),
    ];

    expect(getLoggableProjects(projects, employeeMember).map((p) => p.id)).toEqual([
      'p_active',
      'p_plan',
    ]);
    expect(getLoggableProjects(projects, employeeMember, 'p_done').map((p) => p.id)).toEqual([
      'p_active',
      'p_plan',
      'p_done',
    ]);
  });

  it('builds URL query deep-link and detects interactive descendants accurately', () => {
    expect(buildProjectTimesheetLogUrl('p_new_svc')).toBe('/timesheet?projectId=p_new_svc&action=log');

    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    const actionBtn = document.createElement('button');
    nameCell.appendChild(document.createElement('span'));
    row.appendChild(nameCell);
    row.appendChild(actionBtn);

    expect(isInteractiveDescendant(nameCell.firstChild, row)).toBe(false);
    expect(isInteractiveDescendant(actionBtn, row)).toBe(true);
  });
});
