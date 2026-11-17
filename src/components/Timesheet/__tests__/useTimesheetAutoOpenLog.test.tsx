import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Timesheet } from '../../Timesheet';
import { ToastProvider } from '../../ui/ToastProvider';
import type { Project, Task, TimesheetEntry, User } from '../../../types';

afterEach(() => {
  cleanup();
});

const adminUser: User = {
  id: 'u_admin',
  name: 'Admin User',
  email: 'admin@test.com',
  avatar: '',
  globalRole: 'Admin',
  department: 'IT',
};

const sampleProjects: Project[] = [
  { id: 'p_active', name: 'New_svc', description: 'Active service', status: 'Active', startDate: '2026-07-16', members: [{ userId: 'u_admin', role: 'PM' }] },
  { id: 'p_plan', name: 'OCR System', description: 'Planning OCR', status: 'Planning', startDate: '2026-07-01', members: [{ userId: 'u_admin', role: 'PM' }] },
  { id: 'p_done', name: 'Closed Legacy', description: 'Done', status: 'Completed', startDate: '2025-01-01', members: [{ userId: 'u_admin', role: 'PM' }] },
  { id: 'p_hold', name: 'Paused Billing', description: 'Paused', status: 'On Hold', startDate: '2025-06-01', members: [{ userId: 'u_admin', role: 'PM' }] },
];

const sampleTasks: Task[] = [
  {
    id: 't_svc_1',
    projectId: 'p_active',
    assigneeId: 'u_admin',
    title: 'Implement auth endpoint',
    description: '',
    status: 'In Progress',
    priority: 'High',
    estimatedHours: 8,
    createdAt: '2026-07-16',
  },
];

const RouteProbe = () => {
  const loc = useLocation();
  return <div data-testid="timesheet-url">{`${loc.pathname}${loc.search}`}</div>;
};

const renderTimesheet = (initialEntry: string, entries: TimesheetEntry[] = []) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <RouteProbe />
          <Timesheet
            timesheets={entries}
            setTimesheets={() => {}}
            projects={sampleProjects}
            tasks={sampleTasks}
            currentUser={adminUser}
            users={[adminUser]}
          />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
};

describe('Timesheet deep-link & Active/Planning project dropdown guard', () => {
  it('opens Log Work Time modal with pre-selected project, empty task, filtered dropdown, and cleans query URL', async () => {
    renderTimesheet('/timesheet?projectId=p_plan&action=log');

    expect(await screen.findByText('Log Work Time')).toBeTruthy();

    const projectSelect = screen.getByLabelText('Project') as HTMLSelectElement;
    const taskSelect = screen.getByLabelText('Task') as HTMLSelectElement;

    expect(projectSelect.value).toBe('p_plan');
    expect(taskSelect.value).toBe('');

    const optionValues = Array.from(projectSelect.options).map((o) => o.value).filter(Boolean);
    expect(optionValues).toEqual(['p_active', 'p_plan']);

    await waitFor(() => {
      expect(screen.getByTestId('timesheet-url').textContent).toBe('/timesheet');
    });
  });

  it('blocks Completed or On Hold deep-link with a toast error, does not open modal, and cleans query URL', async () => {
    renderTimesheet('/timesheet?projectId=p_done&action=log');

    const statusAlert = await screen.findByRole('status');
    expect(statusAlert.textContent).toContain('Closed Legacy');
    expect(statusAlert.textContent).toContain('Completed');
    expect(screen.queryByText('Log Work Time')).toBeNull();

    await waitFor(() => {
      expect(screen.getByTestId('timesheet-url').textContent).toBe('/timesheet');
    });
  });

  it('still allows editing an existing timesheet entry tied to a Completed project', async () => {
    const todayIso = format(new Date(), 'yyyy-MM-dd');
    const legacyEntry: TimesheetEntry = {
      id: 'ts_legacy',
      userId: 'u_admin',
      projectId: 'p_done',
      date: todayIso,
      hours: 4,
      description: 'Final handover',
      status: 'Pending',
    };

    renderTimesheet('/timesheet', [legacyEntry]);

    fireEvent.click(screen.getByTitle('Edit log entry'));
    expect(await screen.findByText('Edit Work Time')).toBeTruthy();

    const projectSelect = screen.getByLabelText('Project') as HTMLSelectElement;
    expect(projectSelect.value).toBe('p_done');
    const optionValues = Array.from(projectSelect.options).map((o) => o.value).filter(Boolean);
    expect(optionValues).toContain('p_done');
  });
});
