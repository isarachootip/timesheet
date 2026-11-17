import { describe, it, expect } from 'vitest';
import {
  getProjectHealthLatest,
  getProjectHealthHistoryList,
  analyzeAndSaveProjectHealth,
} from '../projectHealthService.js';
import { runDailyProjectHealthJob } from '../../../jobs/projectHealthJob.js';
import { resolveTaskCompletedAt } from '../taskCompletionTracker.js';
import { buildInMemoryHealthDb } from './healthTestDbHelper.js';

const REF_DATE = new Date('2026-07-15T08:00:00Z');

describe('Step 2: Snapshot Storage, Service, Daily Job & completed_at Tracker', () => {
  it('tracks completed_at accurately on transitions, edits, and reopen', () => {
    const now = '2026-07-15T10:00:00.000Z';
    expect(resolveTaskCompletedAt({ oldTask: null, nextStatus: 'To Do', nowIso: now })).toBeNull();
    expect(
      resolveTaskCompletedAt({ oldTask: { status: 'In Progress', completed_at: null }, nextStatus: 'Done', nowIso: now })
    ).toBe(now);
    expect(
      resolveTaskCompletedAt({
        oldTask: { status: 'Done', completed_at: '2026-07-01T00:00:00.000Z' },
        nextStatus: 'Done',
        nowIso: now,
      })
    ).toBe('2026-07-01T00:00:00.000Z');
    expect(
      resolveTaskCompletedAt({
        oldTask: { status: 'Done', completed_at: '2026-07-01T00:00:00.000Z' },
        nextStatus: 'In Progress',
        nowIso: now,
      })
    ).toBeNull();
  });

  it('creates initial snapshot on GET if missing, preserves latest AI analysis, and degrades gracefully if AI fails', async () => {
    const ctx = buildInMemoryHealthDb({
      projects: [
        {
          id: 'p1',
          name: 'Alpha',
          status: 'Active',
          start_date: '2026-07-01',
          end_date: '2026-07-29',
          members: [{ userId: 'u_pm', role: 'PM' }],
        },
      ],
      tasks: [
        { id: 't1', project_id: 'p1', title: 'T1', status: 'Done', estimated_hours: 10, end_date: '2026-07-10', updated_at: '2026-07-14', completed_at: '2026-07-14' },
        { id: 't2', project_id: 'p1', title: 'T2', status: 'To Do', estimated_hours: 10, end_date: '2026-07-25', updated_at: '2026-07-14' },
      ],
      timesheets: [{ id: 'ts1', project_id: 'p1', hours: 10, status: 'Approved', date: '2026-07-14' }],
    });

    const firstGet = await getProjectHealthLatest({ db: ctx.db, referenceDate: REF_DATE }, 'p1');
    expect(ctx.snapshots).toHaveLength(1);
    expect(firstGet.healthScore).toBe(100);
    expect(firstGet.aiAnalysis).toBeNull();

    const failedAi = await analyzeAndSaveProjectHealth(
      {
        db: ctx.db,
        referenceDate: new Date('2026-07-15T09:00:00Z'),
        aiAnalyzer: async () => {
          throw new Error('LLM API down');
        },
      },
      'p1'
    );
    expect(failedAi.healthScore).toBe(100);
    expect(failedAi.aiError).toContain('LLM API down');
    expect(ctx.snapshots).toHaveLength(2);

    const okAi = await analyzeAndSaveProjectHealth(
      {
        db: ctx.db,
        referenceDate: new Date('2026-07-15T10:00:00Z'),
        aiAnalyzer: async () => ({ summary: 'Healthy', root_causes: [], recommendations: ['Keep going'] }),
      },
      'p1'
    );
    expect(okAi.aiAnalysis).toEqual({ summary: 'Healthy', root_causes: [], recommendations: ['Keep going'] });

    const history = await getProjectHealthHistoryList({ db: ctx.db }, 'p1', { limit: 10 });
    expect(history).toHaveLength(3);
  });

  it('runs daily job once per day for Active projects and notifies only PMs when color changes', async () => {
    const ctx = buildInMemoryHealthDb({
      projects: [
        {
          id: 'p_drop',
          name: 'Dropping Project',
          status: 'Active',
          start_date: '2026-07-01',
          end_date: '2026-07-10',
          members: [
            { userId: 'u_pm', role: 'PM' },
            { userId: 'u_lead', role: 'Team Lead' },
            { userId: 'u_dev', role: 'Frontend dev' },
          ],
        },
        { id: 'p_hold', name: 'Paused', status: 'On Hold', start_date: '2026-07-01', end_date: '2026-07-10', members: [{ userId: 'u_pm', role: 'PM' }] },
      ],
      tasks: [{ id: 't1', project_id: 'p_drop', title: 'Late', status: 'To Do', estimated_hours: 20, end_date: '2026-07-05', updated_at: '2026-06-01' }],
      snapshots: [
        {
          id: 'snap_prev',
          project_id: 'p_drop',
          snapshot_date: '2026-07-14',
          calculated_at: '2026-07-14T01:00:00.000Z',
          health_score: 88,
          factor_scores: {},
          status: 'GREEN',
          confidence: 'HIGH',
          data_issues: [],
          ai_analysis: null,
          trigger_source: 'scheduled',
        },
      ],
    });

    const firstRun = await runDailyProjectHealthJob({ db: ctx.db, referenceDate: REF_DATE });
    expect(firstRun.processedCount).toBe(1);
    expect(firstRun.notificationsSent).toBe(2);
    expect(ctx.notifications.map((n) => n.user_id)).toEqual(['u_pm', 'u_lead']);
    expect(ctx.notifications[0].type).toBe('health_alert');

    const secondRun = await runDailyProjectHealthJob({ db: ctx.db, referenceDate: REF_DATE });
    expect(secondRun.processedCount).toBe(0);
    expect(secondRun.skippedCount).toBe(1);
    expect(ctx.notifications).toHaveLength(2);
  });
});
