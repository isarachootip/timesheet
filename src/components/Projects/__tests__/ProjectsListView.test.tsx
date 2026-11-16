import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectsListView } from '../ProjectsListView';
import type { Project, User } from '../../../types';

const bulkUpdateProjectsMock = vi.fn();

vi.mock('../../../services/bulkUpdateApi', () => ({
  bulkUpdateProjects: (...args: unknown[]) => bulkUpdateProjectsMock(...args),
}));

afterEach(() => {
  cleanup();
  bulkUpdateProjectsMock.mockReset();
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
  {
    id: 'p_1',
    name: '3cx_voicebot',
    description: 'Voicebot integration',
    status: 'Active',
    startDate: '2026-01-01',
    endDate: '2026-08-29',
    members: [{ userId: 'u_admin', role: 'PM' }],
  },
  {
    id: 'p_2',
    name: 'kes - vfx',
    description: 'VFX pipeline',
    status: 'Active',
    startDate: '2026-01-01',
    endDate: '2026-07-31',
    members: [],
  },
];

describe('ProjectsListView', () => {
  it('supports selecting multiple projects and applying Status or Set Ongoing', async () => {
    bulkUpdateProjectsMock.mockResolvedValue({ updatedIds: ['p_1', 'p_2'], skipped: [] });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ProjectsListView
            projects={sampleProjects}
            users={[adminUser]}
            currentUser={adminUser}
            canManageWorkflow={() => true}
            onOpenWorkflowModal={() => {}}
            onOpenEditModal={() => {}}
            onDeleteProject={() => {}}
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByLabelText('Select all manageable projects'));
    expect(screen.getByText('2 project(s) selected')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Set Ongoing/i }));
    await waitFor(() => {
      expect(bulkUpdateProjectsMock).toHaveBeenCalledWith('u_admin', ['p_1', 'p_2'], { endDate: null });
    });
  });
});
