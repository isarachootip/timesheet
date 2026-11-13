import { describe, it, expect, vi } from 'vitest';
import {
  groupDuplicateMilestones,
  deduplicateMilestones,
} from './deduplicateMilestones.js';

describe('groupDuplicateMilestones', () => {
  it('ignores unique milestones and groups duplicates case/whitespace-insensitively per project', () => {
    const rows = [
      {
        id: 't1',
        project_id: 'p1',
        title: 'Menu แต่ละหน้า',
        status: 'To Do',
        created_at: '2026-01-01T00:00:00Z',
        sub_cnt: 0,
        ts_cnt: 0,
        commit_cnt: 0,
        note_cnt: 0,
      },
      {
        id: 't2',
        project_id: 'p1',
        title: 'Menu แต่ละหน้า ',
        status: 'In Progress',
        created_at: '2026-01-02T00:00:00Z',
        sub_cnt: 0,
        ts_cnt: 1,
        commit_cnt: 0,
        note_cnt: 0,
      },
      {
        id: 't3',
        project_id: 'p2',
        title: 'Menu แต่ละหน้า',
        status: 'To Do',
        created_at: '2026-01-01T00:00:00Z',
        sub_cnt: 0,
        ts_cnt: 0,
        commit_cnt: 0,
        note_cnt: 0,
      },
    ];

    const plans = groupDuplicateMilestones(rows);
    expect(plans).toHaveLength(1);
    expect(plans[0].projectId).toBe('p1');
    expect(plans[0].canonicalId).toBe('t2');
    expect(plans[0].canonicalTitleTrimmed).toBe('Menu แต่ละหน้า');
    expect(plans[0].trimCanonicalTitle).toBe(true);
    expect(plans[0].redundantIds).toEqual(['t1']);
  });

  it('prefers tasks with subtasks/timesheets, then furthest status, then earliest created_at', () => {
    const rows = [
      {
        id: 'a_early',
        project_id: 'p1',
        title: 'UAT',
        status: 'To Do',
        created_at: '2026-01-01T00:00:00Z',
        sub_cnt: 0,
        ts_cnt: 0,
        commit_cnt: 0,
        note_cnt: 0,
      },
      {
        id: 'b_done',
        project_id: 'p1',
        title: 'UAT',
        status: 'Done',
        created_at: '2026-01-05T00:00:00Z',
        sub_cnt: 0,
        ts_cnt: 0,
        commit_cnt: 0,
        note_cnt: 0,
      },
      {
        id: 'c_with_sub',
        project_id: 'p1',
        title: 'UAT',
        status: 'In Progress',
        created_at: '2026-01-10T00:00:00Z',
        sub_cnt: 1,
        ts_cnt: 1,
        commit_cnt: 0,
        note_cnt: 0,
      },
    ];

    const plans = groupDuplicateMilestones(rows);
    expect(plans).toHaveLength(1);
    expect(plans[0].canonicalId).toBe('c_with_sub');
    expect(plans[0].redundantIds).toEqual(['b_done', 'a_early']);

    const withoutRefs = rows.slice(0, 2);
    const statusPlans = groupDuplicateMilestones(withoutRefs);
    expect(statusPlans[0].canonicalId).toBe('b_done');
  });
});

describe('deduplicateMilestones', () => {
  it('re-links subtasks, timesheets, commits, notes, and snapshots before deleting redundant tasks', async () => {
    const queries = [];
    const client = {
      query: vi.fn(async (sql, params) => {
        queries.push({ sql, params });
        if (sql.includes('FROM tasks t')) {
          return {
            rows: [
              {
                id: 'dup1',
                project_id: 'p1',
                title: 'Release',
                status: 'To Do',
                created_at: '2026-01-01T00:00:00Z',
                sub_cnt: 0,
                ts_cnt: 0,
                commit_cnt: 0,
                note_cnt: 0,
              },
              {
                id: 'keep1',
                project_id: 'p1',
                title: 'Release ',
                status: 'Done',
                created_at: '2026-01-02T00:00:00Z',
                sub_cnt: 2,
                ts_cnt: 1,
                commit_cnt: 0,
                note_cnt: 0,
              },
            ],
          };
        }
        return { rows: [], rowCount: 1 };
      }),
    };

    const summary = await deduplicateMilestones(client);
    expect(summary).toEqual({ mergedGroups: 1, deletedTasks: 1 });

    const sqlStatements = queries.map((q) => q.sql);
    expect(sqlStatements).toContain('BEGIN');
    expect(sqlStatements).toContain('COMMIT');
    expect(sqlStatements.some((s) => s.includes('UPDATE tasks SET parent_id'))).toBe(true);
    expect(sqlStatements.some((s) => s.includes('UPDATE timesheets SET task_id'))).toBe(true);
    expect(sqlStatements.some((s) => s.includes('UPDATE task_commits SET task_id'))).toBe(true);
    expect(sqlStatements.some((s) => s.includes('UPDATE personal_notes SET task_id'))).toBe(true);
    expect(sqlStatements.some((s) => s.includes('DELETE FROM task_snapshots'))).toBe(true);
    expect(sqlStatements.some((s) => s.includes('UPDATE task_snapshots SET task_id'))).toBe(true);
    expect(sqlStatements.some((s) => s.includes('UPDATE tasks SET title'))).toBe(true);
    expect(sqlStatements.some((s) => s.includes('DELETE FROM tasks WHERE id = ANY'))).toBe(true);
  });

  it('exits early without opening a transaction when no duplicates exist', async () => {
    const client = {
      query: vi.fn(async () => ({
        rows: [
          {
            id: 'only1',
            project_id: 'p1',
            title: 'Unique',
            status: 'To Do',
            created_at: '2026-01-01T00:00:00Z',
            sub_cnt: 0,
            ts_cnt: 0,
            commit_cnt: 0,
            note_cnt: 0,
          },
        ],
      })),
    };

    const summary = await deduplicateMilestones(client);
    expect(summary).toEqual({ mergedGroups: 0, deletedTasks: 0 });
    expect(client.query).toHaveBeenCalledTimes(1);
  });
});
