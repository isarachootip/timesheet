import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CommandPalette } from './CommandPalette';
import type { PermissionScheme, Project, Task, User } from '../../types';

afterEach(() => {
  cleanup();
});

const schemes: PermissionScheme[] = [
  {
    id: 'scheme_default',
    name: 'Default',
    description: '',
    permissions: {
      create_task: ['Admin', 'PM'],
    },
  },
];

const projects: Project[] = [
  {
    id: 'p1',
    name: 'ChronoTrack Core',
    description: '',
    status: 'Active',
    startDate: '2026-06-01',
    members: [{ userId: 'u_member', role: 'Member' }],
    permissionSchemeId: 'scheme_default',
  },
];

const tasks: Task[] = [
  {
    id: 't1',
    projectId: 'p1',
    title: 'Design Dashboard Layout',
    description: '',
    status: 'In Progress',
    priority: 'High',
    estimatedHours: 8,
    createdAt: '2026-06-01T00:00:00Z',
  },
];

describe('CommandPalette', () => {
  it('opens on Ctrl+K, searches tasks, and hides Create Task when user lacks create_task permission', () => {
    const memberUser: User = {
      id: 'u_member',
      name: 'Member User',
      email: 'member@test.com',
      avatar: '',
      globalRole: 'Employee',
      department: 'Eng',
    };

    const onOpenPalette = vi.fn();
    render(
      <MemoryRouter>
        <CommandPalette
          isOpen={true}
          onOpenPalette={onOpenPalette}
          onClose={vi.fn()}
          isQuickCreateOpen={false}
          onOpenQuickCreate={vi.fn()}
          onCloseQuickCreate={vi.fn()}
          onToggleTheme={vi.fn()}
          projects={projects}
          tasks={tasks}
          users={[memberUser]}
          notes={[]}
          permissionSchemes={schemes}
          currentUser={memberUser}
          onCreateTask={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.queryByText('Create New Task')).toBeNull();
    expect(screen.getByText('Log Timesheet')).toBeTruthy();

    const input = screen.getByPlaceholderText(/Search pages, tasks/i);
    fireEvent.change(input, { target: { value: 'Design Dashboard' } });
    expect(screen.getByText('Design Dashboard Layout')).toBeTruthy();
  });

  it('allows Admin users to see Create New Task and fires Ctrl+K toggle callback', () => {
    const adminUser: User = {
      id: 'u_admin',
      name: 'Admin User',
      email: 'admin@test.com',
      avatar: '',
      globalRole: 'Admin',
      department: 'Mgmt',
    };

    const onOpenPalette = vi.fn();
    render(
      <MemoryRouter>
        <CommandPalette
          isOpen={false}
          onOpenPalette={onOpenPalette}
          onClose={vi.fn()}
          isQuickCreateOpen={false}
          onOpenQuickCreate={vi.fn()}
          onCloseQuickCreate={vi.fn()}
          onToggleTheme={vi.fn()}
          projects={projects}
          tasks={tasks}
          users={[adminUser]}
          notes={[]}
          permissionSchemes={schemes}
          currentUser={adminUser}
          onCreateTask={vi.fn()}
        />
      </MemoryRouter>
    );

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(onOpenPalette).toHaveBeenCalledTimes(1);
  });
});
