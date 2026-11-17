import { describe, it, expect, vi } from 'vitest';
import { buildProjectHealthAiContext } from '../projectHealthContextBuilder.js';
import {
  analyzeProjectHealth,
  generateValidatedAiInsights,
} from '../projectHealthAiService.js';
import { evaluateProjectHealth } from '../projectHealthEngine.js';

const REF_DATE = new Date('2026-07-20T00:00:00Z');

describe('Step 3: Project Health AI Context Builder & Gemini Service', () => {
  it('builds complete read-only JSON context (max 10 overdue, active tasks, milestone hours rollup, last 4 snapshots)', async () => {
    const executedSql: string[] = [];
    const overdueTasks = Array.from({ length: 12 }, (_, idx) => ({
      id: `to_${idx + 1}`,
      project_id: 'p1',
      parent_id: 'm1',
      assignee_id: 'u1',
      title: `Overdue Subtask ${idx + 1}`,
      status: 'To Do',
      priority: 'High',
      estimated_hours: 2,
      end_date: `2026-07-${String(idx + 1).padStart(2, '0')}`, // July 01..12 -> all < July 20
      created_at: '2026-06-20',
      updated_at: '2026-07-18',
    }));

    const tasks = [
      { id: 'm1', project_id: 'p1', title: 'Milestone Alpha', status: 'In Progress', priority: 'High', estimated_hours: 30, created_at: '2026-06-20', updated_at: '2026-07-18' },
      ...overdueTasks,
      { id: 's_prog', project_id: 'p1', parent_id: 'm1', assignee_id: 'u1', title: 'Active API Work', status: 'In Progress', priority: 'Urgent', estimated_hours: 6, end_date: '2026-07-25', created_at: '2026-07-01', updated_at: '2026-07-19' },
      { id: 'm2', project_id: 'p1', title: 'Milestone Beta', status: 'Done', priority: 'Medium', estimated_hours: 10, end_date: '2026-07-10', created_at: '2026-06-20', updated_at: '2026-07-10', completed_at: '2026-07-10' },
    ];

    const timesheets = [
      { id: 'ts1', project_id: 'p1', task_id: 's_prog', hours: 8, status: 'Approved', date: '2026-07-18', is_personal: false },
      { id: 'ts2', project_id: 'p1', task_id: 'm1', hours: 4, status: 'Pending', date: '2026-07-19', is_personal: false },
      { id: 'ts3', project_id: 'p1', task_id: 'm2', hours: 9, status: 'Approved', date: '2026-07-10', is_personal: false },
      { id: 'ts_draft', project_id: 'p1', task_id: 'm2', hours: 99, status: 'Draft', date: '2026-07-10', is_personal: false },
    ];

    const snapshots = [1, 2, 3, 4, 5].map((n) => ({
      id: `snap_${n}`,
      project_id: 'p1',
      snapshot_date: `2026-07-1${n}`,
      calculated_at: `2026-07-1${n}T08:00:00Z`,
      health_score: 60 + n,
      factor_scores: { schedule: 70 },
      status: 'YELLOW',
      confidence: 'HIGH',
      data_issues: [],
    }));

    const project = { id: 'p1', name: 'Core Banking', description: 'V2', status: 'Active', start_date: '2026-06-20', end_date: '2026-08-20', members: [{ userId: 'u1', role: 'PM' }] };
    const liveHealth = evaluateProjectHealth({ project, tasks, timesheets, referenceDate: REF_DATE });

    const db = {
      query: vi.fn(async (sql: string) => {
        executedSql.push(sql);
        if (sql.includes('FROM projects WHERE id')) return { rows: [project] };
        if (sql.includes('FROM project_workflows')) return { rows: [] };
        if (sql.includes('FROM tasks WHERE project_id')) return { rows: tasks };
        if (sql.includes('FROM timesheets WHERE project_id')) return { rows: timesheets };
        if (sql.includes('FROM users')) return { rows: [{ id: 'u1', name: 'Somchai PM' }] };
        if (sql.includes('FROM project_health_snapshots')) return { rows: [...snapshots].reverse().slice(0, 4) };
        return { rows: [] };
      }),
    };

    const ctx = await buildProjectHealthAiContext('p1', liveHealth, { db, referenceDate: REF_DATE });

    expect(ctx.overdueTasks).toHaveLength(10); // capped at 10!
    expect(ctx.overdueTasks[0].id).toBe('to_1'); // oldest due date -> most days overdue first
    expect(ctx.overdueTasks[0].assigneeName).toBe('Somchai PM');
    expect(ctx.inProgressTasks.map((t) => t.id)).toEqual(['s_prog']);

    // m1 actual hours = 8 (from subtask s_prog) + 4 (direct on m1) = 12; m1 effective est = 12*2 + 6 = 30
    const m1Comp = ctx.milestoneHoursComparison.find((m) => m.milestoneId === 'm1');
    expect(m1Comp).toMatchObject({ estimatedHours: 30, actualHours: 12, varianceHours: -18 });

    expect(ctx.recentSnapshots).toHaveLength(4);
    expect(executedSql.every((s) => !/\b(INSERT|UPDATE|DELETE|ALTER|DROP)\b/i.test(s))).toBe(true);
  });

  it('retries once when LLM JSON fails schema validation and succeeds on second try', async () => {
    const validPayload = {
      summary: 'โครงการมีความเสี่ยงด้านงานค้าง',
      root_causes: ['มี Subtask เลยกำหนดหลายรายการ'],
      recommendations: [{ priority: 'HIGH', action: 'จัดลำดับงานใหม่', expected_impact: 'ลดงานค้างใน 1 สัปดาห์' }],
    };

    const generateText = vi
      .fn<[(prompt: { systemPrompt: string; userMessage: string }) => Promise<string>][0]>()
      .mockResolvedValueOnce('{"summary": "", "bad": true}') // invalid on 1st try
      .mockResolvedValueOnce('```json\n' + JSON.stringify(validPayload) + '\n```'); // valid on 2nd try

    const parsed = await generateValidatedAiInsights(
      { project: { id: 'p1', name: 'Demo' } },
      { env: { GEMINI_API_KEY: 'env-test-key' }, generateText }
    );

    expect(generateText).toHaveBeenCalledTimes(2);
    expect(generateText.mock.calls[0][0].systemPrompt.length).toBeGreaterThan(50);
    expect(parsed).toEqual(validPayload);
  });

  it('reads API key strictly from env and still returns Health Engine scores when AI fails', async () => {
    const executedSql: string[] = [];
    const db = {
      query: vi.fn(async (sql: string) => {
        executedSql.push(sql);
        if (sql.includes('FROM projects WHERE id')) {
          return { rows: [{ id: 'p1', name: 'Safe Fallback', status: 'Active', start_date: '2026-07-01', end_date: '2026-07-29' }] };
        }
        if (sql.includes('FROM tasks')) {
          return { rows: [{ id: 't1', project_id: 'p1', title: 'T1', status: 'In Progress', estimated_hours: 10, end_date: '2026-07-25', updated_at: '2026-07-19' }] };
        }
        return { rows: [] };
      }),
    };

    const res = await analyzeProjectHealth('p1', {
      db,
      referenceDate: REF_DATE,
      env: { GEMINI_API_KEY: '' }, // Missing env key!
      persistSnapshot: false,
    });

    expect(executedSql.some((s) => s.includes('system_settings'))).toBe(false);
    expect(res.status).toBeDefined();
    expect(res.factors.overdue).toBe(100);
    expect(res.aiAnalysis).toBeNull();
    expect(res.aiError).toMatch(/GEMINI_API_KEY/i);
  });
});
