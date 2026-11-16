import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from '../Dashboard';
import type { Project, ProjectWorkflow, Task, User } from '../../types';

afterEach(() => {
  cleanup();
});

const user: User = {
  id: 'u1',
  name: 'Alice',
  email: 'alice@test.com',
  avatar: '',
  globalRole: 'Admin',
  department: 'Eng',
};

const projects: Project[] = [
  {
    id: 'p1',
    name: 'Alpha Portal',
    description: '',
    status: 'Active',
    startDate: '2026-01-01',
    endDate: '2026-05-01',
    members: [{ userId: 'u1', role: 'PM' }],
  },
  {
    id: 'p_done_100',
    name: '3cx_voicebot',
    description: '',
    status: 'Active',
    startDate: '2026-01-01',
    endDate: '2026-08-29',
    members: [{ userId: 'u1', role: 'PM' }],
    customColumns: ['To Do', 'In Progress', 'Shipped'],
  },
  {
    id: 'p_support',
    name: 'helpdesk',
    description: '',
    status: 'Active',
    projectType: 'support',
    startDate: '2026-01-01',
    endDate: '2026-07-31',
    members: [{ userId: 'u1', role: 'PM' }],
  },
  {
    id: 'p_completed',
    name: 'Legacy Archive',
    description: '',
    status: 'Completed',
    startDate: '2026-01-01',
    endDate: '2026-06-01',
    members: [],
  },
];

const workflows: ProjectWorkflow[] = [
  {
    projectId: 'p_done_100',
    statuses: ['To Do', 'In Progress', 'Shipped'],
    transitions: [],
  },
];

const tasks: Task[] = [
  {
    id: 't1',
    projectId: 'p1',
    assigneeId: 'u1',
    title: 'Urgent Production Patch',
    description: '',
    status: 'In Progress',
    priority: 'Urgent',
    estimatedHours: 4,
    createdAt: '2026-05-01T00:00:00Z',
    endDate: '2026-05-02',
  },
  {
    id: 't2',
    projectId: 'p1',
    assigneeId: 'u1',
    title: 'Regular Pending Task',
    description: '',
    status: 'To Do',
    priority: 'Medium',
    estimatedHours: 4,
    createdAt: '2026-05-02T00:00:00Z',
    endDate: '2099-12-31',
  },
  {
    id: 't_other_user',
    projectId: 'p1',
    assigneeId: 'u_someone_else',
    title: 'Someone Else Overdue Task',
    description: '',
    status: 'To Do',
    priority: 'High',
    estimatedHours: 8,
    createdAt: '2026-05-01T00:00:00Z',
    endDate: '2026-05-01',
  },
  {
    id: 't_unassigned_auto',
    projectId: 'p1',
    assigneeId: undefined,
    title: 'Auto Milestone Template Task',
    description: '',
    status: 'To Do',
    priority: 'Medium',
    estimatedHours: 8,
    createdAt: '2026-05-01T00:00:00Z',
    endDate: '2026-05-01',
  },
  {
    id: 't_support_bucket',
    projectId: 'p_support',
    assigneeId: 'u1',
    title: '[2026-07] Support & Maintenance',
    description: '',
    status: 'To Do',
    priority: 'Medium',
    estimatedHours: 0,
    createdAt: '2026-07-01T00:00:00Z',
    endDate: '2026-07-31',
  },
  {
    id: 't_custom_done',
    projectId: 'p_done_100',
    assigneeId: 'u1',
    title: 'Deploy Voicebot',
    description: '',
    status: 'Shipped',
    priority: 'High',
    estimatedHours: 8,
    createdAt: '2026-07-01T00:00:00Z',
    endDate: '2026-08-29',
  },
];

describe('Dashboard', () => {
  it('counts only currentUser overdue tasks (excluding other users, unassigned, support buckets, and custom done)', () => {
    const { container } = render(
      <MemoryRouter>
        <Dashboard
          projects={projects}
          tasks={tasks}
          timesheets={[]}
          currentUser={user}
          projectWorkflows={workflows}
        />
      </MemoryRouter>
    );

    expect(container.textContent).not.toContain('👋');
    expect(container.textContent).not.toContain('⚠️');
    expect(container.textContent).not.toContain('🎉');

    const overdueTotal = screen.getByTestId('dashboard-overdue-total');
    expect(overdueTotal.textContent).toBe('1');
    expect(overdueTotal.style.color).toContain('var(--accent-danger)');

    fireEvent.click(overdueTotal);
    expect(screen.getByText('Urgent Production Patch')).toBeTruthy();
    expect(screen.queryByText('Regular Pending Task')).toBeNull();
    expect(screen.queryByText('[2026-07] Support & Maintenance')).toBeNull();
  });

  it('shows Completed badge for 100% or Completed projects and Ongoing for support projects in Project Health', () => {
    render(
      <MemoryRouter>
        <Dashboard
          projects={projects}
          tasks={tasks}
          timesheets={[]}
          currentUser={user}
          projectWorkflows={workflows}
        />
      </MemoryRouter>
    );

    const healthTable = screen.getByRole('table');
    const voicebotRow = within(healthTable).getByText('3cx_voicebot').closest('tr')!;
    expect(within(voicebotRow).getByText('100%')).toBeTruthy();
    expect(within(voicebotRow).queryByText(/overdue/i)).toBeNull();
    expect(within(voicebotRow).getByTestId('schedule-completed-badge')).toBeTruthy();

    const helpdeskRow = within(healthTable).getByText('helpdesk').closest('tr')!;
    expect(within(helpdeskRow).queryByText(/overdue/i)).toBeNull();
    expect(within(helpdeskRow).getByText('Ongoing')).toBeTruthy();

    const completedRow = within(healthTable).getByText('Legacy Archive').closest('tr')!;
    expect(within(completedRow).queryByText(/overdue/i)).toBeNull();
    expect(within(completedRow).getByTestId('schedule-completed-badge')).toBeTruthy();
  });

  it('renders actionable empty state when user has no assigned tasks', () => {
    render(
      <MemoryRouter>
        <Dashboard projects={projects} tasks={[]} timesheets={[]} currentUser={user} />
      </MemoryRouter>
    );

    expect(screen.getByText('No tasks assigned to you yet')).toBeTruthy();
    expect(screen.getByText('Browse Projects')).toBeTruthy();
  });
});
