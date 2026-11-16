import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TasksBulkManagePanel } from '../TasksBulkManagePanel';
import type { PermissionScheme, Project, ProjectWorkflow, Task, User } from '../../../types';

const bulkUpdateTasksMock = vi.fn();

vi.mock('../../../services/bulkUpdateApi', () => ({
  bulkUpdateTasks: (...args: unknown[]) => bulkUpdateTasksMock(...args),
}));

afterEach(() => {
  cleanup();
  bulkUpdateTasksMock.mockReset();
});

const adminUser: User = {
  id: 'u_admin',
  name: 'Admin User',
  email: 'admin@test.com',
  avatar: '',
  globalRole: 'Admin',
  department: 'IT',
};

const projects: Project[] = [
  {
    id: 'p1',
    name: 'OCR System',
    description: '',
    status: 'Active',
    startDate: '2026-01-01',
    endDate: '2026-09-28',
    members: [{ userId: 'u_admin', role: 'PM' }],
  },
  {
    id: 'p_sup',
    name: 'helpdesk',
    description: '',
    status: 'Active',
    projectType: 'support',
    startDate: '2026-01-01',
    endDate: '2026-07-31',
    members: [{ userId: 'u_admin', role: 'PM' }],
  },
];

const workflows: ProjectWorkflow[] = [];
const schemes: PermissionScheme[] = [];

const tasks: Task[] = [
  {
    id: 't_overdue_1',
    projectId: 'p1',
    title: 'Overdue Milestone A',
    description: '',
    status: 'To Do',
    priority: 'High',
    estimatedHours: 8,
    createdAt: '2026-06-01T00:00:00Z',
    endDate: '2026-07-15',
  },
  {
    id: 't_future',
    projectId: 'p1',
    title: 'Future Milestone B',
    description: '',
    status: 'In Progress',
    priority: 'Medium',
    estimatedHours: 8,
    createdAt: '2026-06-01T00:00:00Z',
    endDate: '2099-12-31',
  },
  {
    id: 't_sup_bucket',
    projectId: 'p_sup',
    title: 'User Support & Helpdesk',
    description: '',
    status: 'To Do',
    priority: 'Medium',
    estimatedHours: 0,
    createdAt: '2026-06-01T00:00:00Z',
    endDate: '2026-07-31',
  },
];

const renderWithQuery = (ui: React.ReactElement) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

describe('TasksBulkManagePanel', () => {
  it('defaults to showing overdue tasks (excluding support buckets) and performs bulk Mark Done', async () => {
    bulkUpdateTasksMock.mockResolvedValueOnce({ updatedIds: ['t_overdue_1'], skipped: [] });

    renderWithQuery(
      <TasksBulkManagePanel
        tasks={tasks}
        projects={projects}
        users={[adminUser]}
        projectWorkflows={workflows}
        permissionSchemes={schemes}
        selectedProjectId="all"
        currentUser={adminUser}
      />
    );

    expect(screen.getByText('Overdue Milestone A')).toBeTruthy();
    expect(screen.queryByText('Future Milestone B')).toBeNull();
    expect(screen.queryByText('User Support & Helpdesk')).toBeNull();

    const selectAll = screen.getByLabelText('Select all visible tasks');
    fireEvent.click(selectAll);

    const markDoneBtn = screen.getByRole('button', { name: /Mark Done/i });
    fireEvent.click(markDoneBtn);

    await waitFor(() => {
      expect(bulkUpdateTasksMock).toHaveBeenCalledWith('u_admin', ['t_overdue_1'], { status: 'Done' });
    });
  });

  it('can switch filter to All Incomplete to view and bulk shift end dates', async () => {
    bulkUpdateTasksMock.mockResolvedValueOnce({ updatedIds: ['t_overdue_1', 't_future'], skipped: [] });

    renderWithQuery(
      <TasksBulkManagePanel
        tasks={tasks}
        projects={projects}
        users={[adminUser]}
        projectWorkflows={workflows}
        permissionSchemes={schemes}
        selectedProjectId="p1"
        currentUser={adminUser}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /All Incomplete/i }));
    expect(screen.getByText('Overdue Milestone A')).toBeTruthy();
    expect(screen.getByText('Future Milestone B')).toBeTruthy();
  });
});
