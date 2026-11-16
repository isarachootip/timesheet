import { describe, it, expect, vi } from 'vitest';
import {
  bulkTasksUpdateSchema,
  bulkProjectsUpdateSchema,
} from '../../schemas/bulkUpdateSchemas.js';
import {
  executeBulkTasksUpdate,
  executeBulkProjectsUpdate,
} from '../../services/bulkUpdateService.js';

interface MockRow {
  [key: string]: unknown;
}

const createMockDeps = (options: {
  userRole: string | null;
  projects: MockRow[];
  tasks?: MockRow[];
  checkPermissionImpl?: (userId: string, projectId: string, perm: string, task?: MockRow) => Promise<boolean>;
  validateTransitionImpl?: (userId: string, projectId: string, task: MockRow, status: string) => Promise<{ allowed: boolean; reason?: string }>;
}) => {
  const executedUpdates: Array<{ sql: string; params: unknown[] }> = [];

  const query = vi.fn(async (sql: string, params: unknown[] = []) => {
    if (sql.includes('FROM users WHERE id')) {
      return {
        rows: options.userRole ? [{ id: params[0], global_role: options.userRole }] : [],
      };
    }
    if (sql.includes('FROM tasks WHERE id = ANY')) {
      const ids = params[0] as string[];
      return {
        rows: (options.tasks || []).filter((t) => ids.includes(String(t.id))),
      };
    }
    if (sql.includes('FROM projects WHERE id = ANY')) {
      const ids = params[0] as string[];
      return {
        rows: options.projects.filter((p) => ids.includes(String(p.id))),
      };
    }
    if (sql.startsWith('UPDATE tasks') || sql.startsWith('UPDATE projects')) {
      executedUpdates.push({ sql, params });
      return { rows: [], rowCount: 1 };
    }
    return { rows: [] };
  });

  return {
    pool: { query },
    executedUpdates,
    checkPermission: options.checkPermissionImpl || (async () => true),
    validateTransition: options.validateTransitionImpl || (async () => ({ allowed: true })),
  };
};

describe('bulkUpdateSchemas & bulkUpdateService', () => {
  it('validates payloads with Zod schemas', () => {
    expect(bulkTasksUpdateSchema.safeParse({ taskIds: [], patch: { status: 'Done' } }).success).toBe(false);
    expect(bulkTasksUpdateSchema.safeParse({ taskIds: ['t1'], patch: {} }).success).toBe(false);
    expect(bulkTasksUpdateSchema.safeParse({ taskIds: ['t1'], patch: { endDate: '16/11/2026' } }).success).toBe(false);
    expect(
      bulkTasksUpdateSchema.safeParse({ taskIds: ['t1'], patch: { status: 'Done', endDate: null } }).success
    ).toBe(true);

    expect(
      bulkProjectsUpdateSchema.safeParse({ projectIds: ['p1'], patch: { status: 'Completed', endDate: '2026-12-31' } }).success
    ).toBe(true);
  });

  it('allows PM / Admin to bulk complete tasks bypassing strict workflow steps', async () => {
    const validateSpy = vi.fn(async () => ({ allowed: false, reason: 'Blocked by workflow' }));
    const deps = createMockDeps({
      userRole: 'Employee',
      projects: [{ id: 'p1', members: [{ userId: 'u_pm', role: 'Team Lead' }] }],
      tasks: [
        { id: 't1', project_id: 'p1', assignee_id: 'u_dev', status: 'To Do', end_date: '2026-07-01' },
        { id: 't2', project_id: 'p1', assignee_id: null, status: 'In Progress', end_date: '2026-07-15' },
      ],
      validateTransitionImpl: validateSpy,
    });

    const result = await executeBulkTasksUpdate(deps, 'u_pm', {
      taskIds: ['t1', 't2'],
      patch: { status: 'Done' },
    });

    expect(result.updatedIds).toEqual(['t1', 't2']);
    expect(result.skipped).toEqual([]);
    expect(validateSpy).not.toHaveBeenCalled();
    expect(deps.executedUpdates.length).toBe(2);
  });

  it('skips unauthorized or workflow-blocked tasks for regular employees without failing valid ones', async () => {
    const deps = createMockDeps({
      userRole: 'Employee',
      projects: [{ id: 'p1', members: [{ userId: 'u_emp', role: 'Frontend dev' }] }],
      tasks: [
        { id: 't_own_ok', project_id: 'p1', assignee_id: 'u_emp', status: 'Review', end_date: '2026-07-01' },
        { id: 't_other', project_id: 'p1', assignee_id: 'u_other', status: 'Review', end_date: '2026-07-01' },
        { id: 't_wf_block', project_id: 'p1', assignee_id: 'u_emp', status: 'To Do', end_date: '2026-07-01' },
      ],
      checkPermissionImpl: async () => true,
      validateTransitionImpl: async (_uid, _pid, task) =>
        task.id === 't_wf_block'
          ? { allowed: false, reason: 'Requires Review first' }
          : { allowed: true },
    });

    const result = await executeBulkTasksUpdate(deps, 'u_emp', {
      taskIds: ['t_own_ok', 't_other', 't_wf_block'],
      patch: { status: 'Done' },
    });

    expect(result.updatedIds).toEqual(['t_own_ok']);
    expect(result.skipped).toHaveLength(2);
    expect(result.skipped.map((s) => s.id)).toEqual(['t_other', 't_wf_block']);
  });

  it('enforces PM/Manager/Admin role on executeBulkProjectsUpdate and supports clearing endDate', async () => {
    const deps = createMockDeps({
      userRole: 'Employee',
      projects: [
        { id: 'p_managed', status: 'Active', end_date: '2026-07-31', members: [{ userId: 'u_user', role: 'PM' }] },
        { id: 'p_dev_only', status: 'Active', end_date: '2026-07-31', members: [{ userId: 'u_user', role: 'Backend dev' }] },
      ],
    });

    const result = await executeBulkProjectsUpdate(deps, 'u_user', {
      projectIds: ['p_managed', 'p_dev_only'],
      patch: { status: 'Completed', endDate: null },
    });

    expect(result.updatedIds).toEqual(['p_managed']);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].id).toBe('p_dev_only');
    expect(deps.executedUpdates).toHaveLength(1);
  });
});
