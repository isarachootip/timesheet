import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../ui/ToastProvider';
import { buildTaskPayloadFromNote, getCreatableProjectsForNote } from '../convertNoteToTaskUtils';
import { ConvertNoteToTaskModal } from '../ConvertNoteToTaskModal';
import { PostItCard } from '../PostItCard';
import { executeLinkNoteToTask } from '../../../../server/routes/noteLinkRoutes.js';
import type { PermissionScheme, PersonalNote, Project, Sprint, User } from '../../../types';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const devUser: User = {
  id: 'u_dev',
  name: 'Somchai Dev',
  email: 'somchai@company.com',
  avatar: '',
  globalRole: 'Employee',
  department: 'Engineering',
};

const sampleProjects: Project[] = [
  {
    id: 'p_member',
    name: 'Core Platform',
    description: '',
    status: 'Active',
    startDate: '2026-07-01',
    members: [{ userId: 'u_dev', role: 'Frontend dev' }],
    permissionSchemeId: 'scheme_default',
  },
  {
    id: 'p_locked',
    name: 'PM Only Project',
    description: '',
    status: 'Active',
    startDate: '2026-07-01',
    members: [{ userId: 'u_dev', role: 'Frontend dev' }],
    permissionSchemeId: 'scheme_pm_only',
  },
];

const schemes: PermissionScheme[] = [
  {
    id: 'scheme_default',
    name: 'Default',
    description: '',
    permissions: { create_task: ['Admin', 'PM', 'Team Lead', 'Member'] },
  },
  {
    id: 'scheme_pm_only',
    name: 'PM Only',
    description: '',
    permissions: { create_task: ['Admin', 'PM'] },
  },
];

const sampleNote: PersonalNote = {
  id: 'note_1',
  userId: 'u_dev',
  title: 'แก้บั๊กหน้า Checkout',
  content: 'ตรวจพบตอนเทสบัตรเครดิต',
  noteDate: '2026-07-15',
  dueDate: '2026-07-20',
  color: 'yellow',
  isCompleted: false,
  workType: 'personal',
};

describe('QuickNote (Post-it) -> Task Conversion & Non-Destructive Linking', () => {
  it('filters projects strictly by create_task permission and builds validated Task payload', () => {
    const allowed = getCreatableProjectsForNote(devUser, sampleProjects, schemes);
    expect(allowed.map((p) => p.id)).toEqual(['p_member']);

    const payload = buildTaskPayloadFromNote({
      note: sampleNote,
      projectId: 'p_member',
      assigneeId: 'u_dev',
      title: sampleNote.title,
      description: sampleNote.content,
      priority: 'High',
      estimatedHours: 4,
      endDate: '2026-07-20',
      sprintId: 'sp_1',
    });

    expect(payload.projectId).toBe('p_member');
    expect(payload.sprintId).toBe('sp_1');
    expect(payload.endDate).toBe('2026-07-20');
    expect(payload.status).toBe('To Do');
  });

  it('links task_id on personal_notes in backend without marking is_completed = true', async () => {
    const mockDb = {
      query: vi.fn(async (_sql: string, params: unknown[]) => ({
        rowCount: 1,
        rows: [
          {
            id: params[2],
            user_id: params[3],
            title: 'แก้บั๊กหน้า Checkout',
            content: '',
            note_date: '2026-07-15',
            color: 'yellow',
            is_completed: false,
            work_type: 'project',
            project_id: params[0],
            task_id: params[1],
            timesheet_id: null,
          },
        ],
      })),
    };

    const updated = await executeLinkNoteToTask(mockDb, {
      noteId: 'note_1',
      userId: 'u_dev',
      body: { projectId: 'p_member', taskId: 't_new_1' },
    });

    expect(updated.projectId).toBe('p_member');
    expect(updated.taskId).toBe('t_new_1');
    expect(updated.isCompleted).toBe(false);
  });

  it('shows Convert to Task button on PostItCard and submits POST /api/tasks + PATCH /api/notes/:id/link-task', async () => {
    const onConvertClick = vi.fn();
    render(
      <PostItCard
        note={sampleNote}
        canConvertToTask={true}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onConvertToTask={onConvertClick}
      />
    );

    fireEvent.click(screen.getByTestId('btn-convert-note-task'));
    expect(onConvertClick).toHaveBeenCalledWith(sampleNote);
    cleanup();

    const apiCalls: Array<{ url: string; method: string; body: Record<string, unknown> }> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method || 'GET';
        const body = init?.body ? JSON.parse(String(init.body)) : {};
        apiCalls.push({ url, method, body });
        return { ok: true, json: async () => ({ success: true }) } as Response;
      })
    );

    const sprints: Sprint[] = [{ id: 'sp_1', projectId: 'p_member', name: 'Sprint 5', status: 'Active' }];
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const onClose = vi.fn();

    render(
      <QueryClientProvider client={qc}>
        <ToastProvider>
          <ConvertNoteToTaskModal isOpen={true} note={sampleNote} onClose={onClose} currentUser={devUser} projects={sampleProjects} permissionSchemes={schemes} tasks={[]} sprints={sprints} />
        </ToastProvider>
      </QueryClientProvider>
    );

    fireEvent.change(screen.getByTestId('convert-task-sprint-select'), {
      target: { value: 'sp_1' },
    });
    fireEvent.click(screen.getByTestId('btn-submit-convert-task'));

    await waitFor(() => expect(apiCalls).toHaveLength(2));
    expect(apiCalls[0].url).toBe('/api/tasks');
    expect(apiCalls[0].method).toBe('POST');
    expect(apiCalls[0].body.projectId).toBe('p_member');
    expect(apiCalls[0].body.sprintId).toBe('sp_1');

    expect(apiCalls[1].url).toBe('/api/notes/note_1/link-task');
    expect(apiCalls[1].method).toBe('PATCH');
    expect(apiCalls[1].body.taskId).toBe(apiCalls[0].body.id);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
