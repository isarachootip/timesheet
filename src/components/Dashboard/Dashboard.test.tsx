import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from '../Dashboard';
import type { Project, Task, User } from '../../types';

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
];

describe('Dashboard', () => {
  it('renders plain greeting without emojis, places My Tasks above Project Health, and shows single red overdue count', () => {
    const { container } = render(
      <MemoryRouter>
        <Dashboard projects={projects} tasks={tasks} timesheets={[]} currentUser={user} />
      </MemoryRouter>
    );

    expect(container.textContent).not.toContain('👋');
    expect(container.textContent).not.toContain('⚠️');
    expect(container.textContent).not.toContain('🎉');

    const myTasksHeading = screen.getByText('My Tasks');
    const projectHealthHeading = screen.getByText('Project Health');
    expect(
      myTasksHeading.compareDocumentPosition(projectHealthHeading) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    const overdueTotal = screen.getByTestId('dashboard-overdue-total');
    expect(overdueTotal.textContent).toBe('1');
    expect(overdueTotal.style.color).toContain('var(--accent-danger)');

    // Clicking Overdue stat toggles filter on My Tasks
    fireEvent.click(overdueTotal);
    expect(screen.getByText('Urgent Production Patch')).toBeTruthy();
    expect(screen.queryByText('Regular Pending Task')).toBeNull();
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
