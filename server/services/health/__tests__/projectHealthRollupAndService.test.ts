import { describe, it, expect, vi } from 'vitest';
import {
  evaluateProjectHealth,
  calculateProjectHealth,
} from '../projectHealthEngine.js';

const REF_DATE = new Date('2026-07-15T00:00:00Z');

describe('Leaf-task Rollup, Support Buckets, Config & DB Service', () => {
  it('rolls up subtasks into milestone without double-counting hours, inheriting parent hours when subtask hours are 0', () => {
    const result = evaluateProjectHealth({
      referenceDate: REF_DATE,
      project: {
        id: 'p_rollup',
        name: 'Rollup Project',
        status: 'Active',
        start_date: '2026-07-01',
        end_date: '2026-07-29', // planned = 0.5
      },
      tasks: [
        // Milestone 1 has 40h on parent, 2 subtasks with 0h each (1 Done, 1 To Do -> 50% = 20h earned)
        { id: 'm1', project_id: 'p_rollup', title: 'Phase 1', status: 'In Progress', estimated_hours: 40, created_at: '2026-07-01', updated_at: '2026-07-14' },
        { id: 's1', project_id: 'p_rollup', parent_id: 'm1', title: 'Sub 1', status: 'Done', estimated_hours: 0, end_date: '2026-07-10', created_at: '2026-07-01', updated_at: '2026-07-12', completed_at: '2026-07-12' },
        { id: 's2', project_id: 'p_rollup', parent_id: 'm1', title: 'Sub 2', status: 'To Do', estimated_hours: 0, end_date: '2026-07-25', created_at: '2026-07-01', updated_at: '2026-07-12' },
        // Milestone 2 has 20h on parent AND subtasks with explicit hours (10h + 30h = 40h -> uses 40h, not 60h!)
        { id: 'm2', project_id: 'p_rollup', title: 'Phase 2', status: 'In Progress', estimated_hours: 20, created_at: '2026-07-01', updated_at: '2026-07-14' },
        { id: 's3', project_id: 'p_rollup', parent_id: 'm2', title: 'Sub 3', status: 'Done', estimated_hours: 20, end_date: '2026-07-14', created_at: '2026-07-01', updated_at: '2026-07-14', completed_at: '2026-07-14' },
        { id: 's4', project_id: 'p_rollup', parent_id: 'm2', title: 'Sub 4', status: 'To Do', estimated_hours: 20, end_date: '2026-07-28', created_at: '2026-07-01', updated_at: '2026-07-14' },
      ],
      timesheets: [
        { id: 'ts1', project_id: 'p_rollup', hours: 40, status: 'Approved', date: '2026-07-14' },
      ],
    });

    // Total effective hours = 40 (from m1) + 40 (from m2 subtasks) = 80h
    // Earned hours = 20h (s1) + 20h (s3) = 40h -> Effort = 40 / 40 * 100 = 100
    expect(result.factors.effort).toBe(100);
    expect(result.factors.schedule).toBe(100); // actual 40/80 = 0.5 vs planned 0.5
    expect(result.factors.overdue).toBe(100); // only leaf tasks s2, s4 are not done, neither overdue
  });

  it('skips root category buckets in support projects and evaluates child tickets', () => {
    const result = evaluateProjectHealth({
      referenceDate: REF_DATE,
      project: {
        id: 'p_sup',
        name: 'Helpdesk',
        status: 'Active',
        project_type: 'support',
        start_date: '2026-07-01',
      },
      tasks: [
        { id: 'bucket_1', project_id: 'p_sup', title: 'User Support', status: 'To Do', estimated_hours: 0, end_date: '2026-07-02', created_at: '2026-07-01' },
        { id: 'ticket_1', project_id: 'p_sup', parent_id: 'bucket_1', title: 'Fix Login', status: 'In Progress', estimated_hours: 4, end_date: '2026-07-20', created_at: '2026-07-10', updated_at: '2026-07-14' },
      ],
      timesheets: [
        { id: 'ts1', project_id: 'p_sup', hours: 2, status: 'Approved', date: '2026-07-14' },
      ],
    });

    // bucket_1 had end_date 2026-07-02 (< REF_DATE), must be ignored so overdue = 100!
    expect(result.factors.overdue).toBe(100);
    expect(result.factors.effort).toBe(80); // earned (4 * 0.4 = 1.6) / actual 2 = 80
  });

  it('respects configurable thresholds and fetches via calculateProjectHealth(projectId)', async () => {
    const query = vi.fn(async (sql: string) => {
      if (sql.includes('FROM projects WHERE id')) {
        return { rows: [{ id: 'p1', name: 'DB Project', status: 'Active', start_date: '2026-07-01', end_date: '2026-07-29', custom_columns: ['To Do', 'Working', 'Shipped'] }] };
      }
      if (sql.includes('FROM project_workflows')) {
        return { rows: [{ project_id: 'p1', statuses: ['To Do', 'Working', 'Shipped'] }] };
      }
      if (sql.includes('FROM tasks')) {
        return {
          rows: [
            { id: 't1', project_id: 'p1', title: 'T1', status: 'Working', estimated_hours: 10, end_date: '2026-07-20', created_at: '2026-07-01', updated_at: '2026-07-05' },
          ],
        };
      }
      if (sql.includes('FROM timesheets')) {
        return { rows: [{ id: 'ts1', project_id: 'p1', hours: 5, status: 'Approved', date: '2026-07-05', is_personal: false }] };
      }
      return { rows: [] };
    });

    const defaultHealth = await calculateProjectHealth('p1', {
      db: { query },
      referenceDate: REF_DATE,
    });
    expect(defaultHealth.projectId).toBe('p1');
    expect(defaultHealth.factors.freshness).toBe(70); // 10 days old -> 8..14 tier = 70
    expect(defaultHealth.healthScore).toBe(71);
    expect(defaultHealth.status).toBe('YELLOW');

    const strictHealth = await calculateProjectHealth('p1', {
      db: { query },
      referenceDate: REF_DATE,
      config: { statusThresholds: { greenMin: 95, yellowMin: 75 } },
    });
    expect(strictHealth.status).toBe('RED');
  });

  it('throws 404 when project does not exist and evaluates 15-30d / >30d freshness tiers', async () => {
    const emptyDb = { query: vi.fn(async () => ({ rows: [] })) };
    await expect(calculateProjectHealth('missing_id', { db: emptyDb })).rejects.toThrow('not found');

    const stale20d = evaluateProjectHealth({
      referenceDate: REF_DATE,
      project: { id: 'p_s1', status: 'Active', start_date: '2026-06-01' },
      tasks: [{ id: 't1', project_id: 'p_s1', title: 'T1', status: 'In Progress', estimated_hours: 8, updated_at: '2026-06-25' }],
    });
    expect(stale20d.factors.freshness).toBe(40); // 20 days -> 15..30 tier = 40

    const stale40d = evaluateProjectHealth({
      referenceDate: REF_DATE,
      project: { id: 'p_s2', status: 'Active', start_date: '2026-05-01' },
      tasks: [{ id: 't1', project_id: 'p_s2', title: 'T1', status: 'In Progress', estimated_hours: 8, updated_at: '2026-06-01' }],
    });
    expect(stale40d.factors.freshness).toBe(0); // 44 days -> >30 tier = 0
  });
});
