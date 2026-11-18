import { describe, expect, it, vi } from 'vitest';
import { evaluateProjectHealth } from '../projectHealthEngine.js';
import { buildProjectHealthAiContext } from '../projectHealthContextBuilder.js';
import { getAllVisibleProjectsHealth } from '../projectHealthService.js';
import { runDailyProjectHealthJob } from '../../../jobs/projectHealthJob.js';
import { buildInMemoryHealthDb } from './healthTestDbHelper.js';

const REF_DATE = new Date('2026-07-15T08:00:00Z');

describe('Active Sprint Factor, Auto-AI Daily Job & Dashboard RBAC Summary', () => {
  it('skips sprint factor (null) with zero penalty and HIGH confidence when project has no Active Sprint', () => {
    const res = evaluateProjectHealth({
      referenceDate: REF_DATE,
      project: {
        id: 'p_nosprint',
        name: 'Waterfall Project',
        status: 'Active',
        start_date: '2026-07-01',
        end_date: '2026-07-29',
      },
      sprints: [{ id: 's_planned', project_id: 'p_nosprint', name: 'Sprint 1', status: 'Planned' }],
      tasks: [
        { id: 't1', project_id: 'p_nosprint', title: 'M1', status: 'Done', estimated_hours: 10, end_date: '2026-07-10', updated_at: '2026-07-14', completed_at: '2026-07-10' },
        { id: 't2', project_id: 'p_nosprint', title: 'M2', status: 'To Do', estimated_hours: 10, end_date: '2026-07-28', updated_at: '2026-07-14' },
      ],
      timesheets: [{ id: 'ts1', project_id: 'p_nosprint', hours: 10, status: 'Approved', date: '2026-07-14' }],
    });

    expect(res.factors.sprint).toBeNull();
    expect(res.confidence).toBe('HIGH');
    expect(res.healthScore).toBe(100);
  });

  it('scores Active Sprint accurately (on-track vs overdue Active Sprint) and enriches AI context', async () => {
    const overdueSprintHealth = evaluateProjectHealth({
      referenceDate: REF_DATE,
      project: {
        id: 'p_sprint',
        name: 'Agile Project',
        status: 'Active',
        start_date: '2026-07-01',
        end_date: '2026-08-30',
      },
      sprints: [
        {
          id: 'sp_1',
          project_id: 'p_sprint',
          name: 'Sprint 1',
          status: 'Active',
          start_date: '2026-07-01',
          end_date: '2026-07-10', // 5 days past Sprint end_date with unfinished task!
        },
      ],
      tasks: [
        { id: 't1', project_id: 'p_sprint', sprint_id: 'sp_1', title: 'Auth API', status: 'Done', estimated_hours: 10, end_date: '2026-07-10', updated_at: '2026-07-14', completed_at: '2026-07-10' },
        { id: 't2', project_id: 'p_sprint', sprint_id: 'sp_1', title: 'Payment Hook', status: 'To Do', estimated_hours: 10, end_date: '2026-07-20', updated_at: '2026-07-14' },
      ],
      timesheets: [{ id: 'ts1', project_id: 'p_sprint', hours: 10, status: 'Approved', date: '2026-07-14' }],
    });

    expect(overdueSprintHealth.factors.sprint).not.toBeNull();
    expect(overdueSprintHealth.factors.sprint!).toBeLessThan(50);

    const ctxDb = buildInMemoryHealthDb({
      projects: [{ id: 'p_sprint', name: 'Agile Project', status: 'Active', start_date: '2026-07-01', end_date: '2026-08-30', members: [] }],
      sprints: [{ id: 'sp_1', project_id: 'p_sprint', name: 'Sprint 1', status: 'Active', start_date: '2026-07-01', end_date: '2026-07-10' }],
      tasks: [
        { id: 't1', project_id: 'p_sprint', sprint_id: 'sp_1', title: 'Auth API', status: 'Done', estimated_hours: 10 },
        { id: 't2', project_id: 'p_sprint', sprint_id: 'sp_1', title: 'Payment Hook', status: 'To Do', estimated_hours: 10 },
      ],
    });

    const aiCtx = await buildProjectHealthAiContext('p_sprint', overdueSprintHealth, {
      db: ctxDb.db,
      referenceDate: REF_DATE,
    });
    expect(aiCtx.activeSprints).toHaveLength(1);
    expect(aiCtx.activeSprints[0].name).toBe('Sprint 1');
    expect(aiCtx.activeSprints[0].openTaskTitles).toContain('Payment Hook');
  });

  it('auto-triggers AI in daily job only for risk/color-change projects and strips aiSummary for non-PM members on Dashboard', async () => {
    const ctx = buildInMemoryHealthDb({
      users: [
        { id: 'u_pm', name: 'Nida PM', global_role: 'Employee' },
        { id: 'u_dev', name: 'Somchai Dev', global_role: 'Employee' },
      ],
      projects: [
        {
          id: 'p_red',
          name: 'At-Risk Project',
          status: 'Active',
          start_date: '2026-07-01',
          end_date: '2026-07-10',
          members: [
            { userId: 'u_pm', role: 'PM' },
            { userId: 'u_dev', role: 'Frontend dev' },
          ],
        },
        {
          id: 'p_green',
          name: 'Healthy Project',
          status: 'Active',
          start_date: '2026-07-01',
          end_date: '2026-07-29',
          members: [{ userId: 'u_pm', role: 'PM' }],
        },
      ],
      tasks: [
        { id: 't_late', project_id: 'p_red', title: 'Blocked API', status: 'To Do', estimated_hours: 16, end_date: '2026-07-05', updated_at: '2026-07-02' },
        { id: 't_ok1', project_id: 'p_green', title: 'Done M1', status: 'Done', estimated_hours: 10, end_date: '2026-07-10', updated_at: '2026-07-14', completed_at: '2026-07-10' },
        { id: 't_ok2', project_id: 'p_green', title: 'Open M2', status: 'To Do', estimated_hours: 10, end_date: '2026-07-28', updated_at: '2026-07-14' },
      ],
      timesheets: [
        { id: 'ts_g', project_id: 'p_green', hours: 10, status: 'Approved', date: '2026-07-14' },
      ],
      snapshots: [
        {
          id: 'snap_g_prev',
          project_id: 'p_green',
          snapshot_date: '2026-07-14',
          calculated_at: '2026-07-14T08:00:00.000Z',
          health_score: 100,
          factor_scores: {},
          status: 'GREEN',
          confidence: 'HIGH',
          data_issues: [],
          ai_analysis: null,
          trigger_source: 'scheduled',
        },
      ],
    });

    const aiAnalyzer = vi.fn(async (projectId: string) => ({
      summary: `AI สรุปความเสี่ยงของ ${projectId}`,
      root_causes: ['งานล่าช้า'],
      recommendations: [{ priority: 'HIGH', action: 'เร่งเคลียร์งานค้าง', expected_impact: 'กลับมาทันแผน' }],
    }));

    const jobRes = await runDailyProjectHealthJob({
      db: ctx.db,
      referenceDate: REF_DATE,
      aiAnalyzer,
    });

    expect(jobRes.processedCount).toBe(2);
    // Only p_red should trigger AI (p_green stayed GREEN -> GREEN)
    expect(aiAnalyzer).toHaveBeenCalledTimes(1);
    expect(aiAnalyzer.mock.calls[0][0]).toBe('p_red');

    const pmView = await getAllVisibleProjectsHealth({ db: ctx.db, referenceDate: REF_DATE }, 'u_pm');
    const pmRed = pmView.find((p) => p.projectId === 'p_red')!;
    expect(pmRed.aiSummary).toBe('AI สรุปความเสี่ยงของ p_red');
    expect(pmRed.aiTopAction).toBe('เร่งเคลียร์งานค้าง');

    const devView = await getAllVisibleProjectsHealth({ db: ctx.db, referenceDate: REF_DATE }, 'u_dev');
    const devRed = devView.find((p) => p.projectId === 'p_red')!;
    expect(devRed.aiSummary).toBeNull();
    expect(devRed.aiTopAction).toBeNull();
  });
});
