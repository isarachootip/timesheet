import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectsListView } from '../ProjectsListView';
import { ProjectCardItem } from '../ProjectCardItem';
import { useProjectTimesheetNavigate } from '../useProjectTimesheetNavigate';
import { ToastProvider } from '../../ui/ToastProvider';
import type { Project, Task, User } from '../../../types';

const bulkUpdateProjectsMock = vi.fn();

vi.mock('../../../services/bulkUpdateApi', () => ({
  bulkUpdateProjects: (...args: unknown[]) => bulkUpdateProjectsMock(...args),
}));

afterEach(() => {
  cleanup();
  bulkUpdateProjectsMock.mockReset();
  vi.restoreAllMocks();
});

const adminUser: User = {
  id: 'u_admin', name: 'Admin User', email: 'admin@test.com', avatar: '', globalRole: 'Admin', department: 'IT',
};

const sampleProjects: Project[] = [
  { id: 'p_1', name: '3cx_voicebot', description: 'Voicebot integration', status: 'Active', startDate: '2026-01-01', endDate: '2026-08-29', members: [{ userId: 'u_admin', role: 'PM' }] },
  { id: 'p_2', name: 'kes - vfx', description: 'VFX pipeline', status: 'Planning', startDate: '2026-01-01', endDate: '2026-07-31', members: [] },
  { id: 'p_done', name: 'Legacy Archive', description: 'Old closed project', status: 'Completed', startDate: '2025-01-01', endDate: '2025-12-31', members: [] },
];

const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="current-route">{`${location.pathname}${location.search}`}</div>;
};

const renderProjectsList = (overrides?: {
  onOpenEditModal?: (project: Project) => void;
  onDeleteProject?: (id: string) => void;
}) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/projects']}>
          <LocationDisplay />
          <Routes>
            <Route
              path="/projects"
              element={
                <ProjectsListView
                  projects={sampleProjects}
                  users={[adminUser]}
                  currentUser={adminUser}
                  canManageWorkflow={() => true}
                  onOpenWorkflowModal={() => {}}
                  onOpenEditModal={overrides?.onOpenEditModal ?? (() => {})}
                  onDeleteProject={overrides?.onDeleteProject ?? (() => {})}
                />
              }
            />
            <Route path="/timesheet" element={<div data-testid="timesheet-page">Timesheet Page</div>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
};

describe('ProjectsListView', () => {
  it('supports selecting multiple projects and applying Status or Set Ongoing', async () => {
    bulkUpdateProjectsMock.mockResolvedValue({ updatedIds: ['p_1', 'p_2', 'p_done'], skipped: [] });
    renderProjectsList();

    fireEvent.click(screen.getByLabelText('Select all manageable projects'));
    expect(screen.getByText('3 project(s) selected')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Set Ongoing/i }));
    await waitFor(() => {
      expect(bulkUpdateProjectsMock).toHaveBeenCalledWith('u_admin', ['p_1', 'p_2', 'p_done'], { endDate: null });
    });
  });

  it('navigates to /timesheet?projectId=...&action=log when clicking an Active or Planning project row', () => {
    renderProjectsList();

    fireEvent.click(screen.getByText('3cx_voicebot'));
    expect(screen.getByTestId('current-route').textContent).toBe('/timesheet?projectId=p_1&action=log');
  });

  it('opens a new tab via window.open when Ctrl+Clicking an Active project row', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderProjectsList();

    fireEvent.click(screen.getByText('kes - vfx'), { ctrlKey: true });
    expect(openSpy).toHaveBeenCalledWith(
      '/timesheet?projectId=p_2&action=log',
      '_blank',
      'noopener,noreferrer'
    );
    expect(screen.getByTestId('current-route').textContent).toBe('/projects');
  });

  it('shows toast notification and stays on /projects when clicking a Completed project row', () => {
    renderProjectsList();

    fireEvent.click(screen.getByText('Legacy Archive'));
    expect(screen.getByTestId('current-route').textContent).toBe('/projects');
    expect(screen.getByRole('status').textContent).toContain('Legacy Archive');
    expect(screen.getByRole('status').textContent).toContain('Completed');
  });

  it('does not navigate to /timesheet when clicking checkbox or Edit/Delete buttons', () => {
    const onOpenEditModal = vi.fn();
    renderProjectsList({ onOpenEditModal });

    fireEvent.click(screen.getByLabelText('Select project 3cx_voicebot'));
    expect(screen.getByTestId('current-route').textContent).toBe('/projects');

    const editButtons = screen.getAllByTitle('Edit Project');
    fireEvent.click(editButtons[0]);
    expect(onOpenEditModal).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('current-route').textContent).toBe('/projects');
  });

  it('supports Card View navigation while ignoring milestone <details> summary clicks', () => {
    const CardHarness = () => {
      const nav = useProjectTimesheetNavigate(adminUser);
      const tasks: Task[] = [
        {
          id: 't_1',
          projectId: 'p_1',
          title: 'Phase 1 Kickoff',
          description: '',
          status: 'To Do',
          priority: 'Medium',
          estimatedHours: 8,
          createdAt: '2026-01-01',
        },
      ];
      return (
        <ProjectCardItem
          project={sampleProjects[0]}
          users={[adminUser]}
          tasks={tasks}
          currentUser={adminUser}
          isHighlighted={false}
          manageable={true}
          canDelete={true}
          onCardClick={nav.handleSurfaceClick}
          onCardAuxClick={nav.handleSurfaceAuxClick}
          onCardKeyDown={nav.handleSurfaceKeyDown}
          onOpenWorkflowModal={() => {}}
          onOpenEditModal={() => {}}
          onDeleteProject={() => {}}
        />
      );
    };

    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/projects']}>
          <LocationDisplay />
          <Routes>
            <Route path="/projects" element={<CardHarness />} />
            <Route path="/timesheet" element={<div>Timesheet</div>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    );

    fireEvent.click(screen.getByText(/Auto-Generated Plan/i));
    expect(screen.getByTestId('current-route').textContent).toBe('/projects');

    fireEvent.click(screen.getByText('Voicebot integration'));
    expect(screen.getByTestId('current-route').textContent).toBe('/timesheet?projectId=p_1&action=log');
  });
});
