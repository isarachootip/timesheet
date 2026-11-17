import { describe, it, expect } from 'vitest';
import { evaluateProjectHealth } from '../projectHealthEngine.js';

const REF_DATE = new Date('2026-08-01T00:00:00Z');

describe('Step 5: Comprehensive Health Engine Boundary & Edge Cases', () => {
  it('never marks an Active project with 0 tasks as COMPLETED and reports LOW confidence', () => {
    const emptyProj = evaluateProjectHealth({
      referenceDate: REF_DATE,
      project: {
        id: 'p_empty',
        name: 'Brand New Empty Project',
        status: 'Active',
        start_date: '2026-07-01',
        end_date: '2026-09-01',
      },
      tasks: [],
      timesheets: [],
    });

    expect(emptyProj.status).not.toBe('COMPLETED');
    expect(emptyProj.confidence).toBe('LOW');
    expect(emptyProj.dataIssues.map((d) => d.code)).toEqual(
      expect.arrayContaining(['NO_TASKS', 'NO_ACTIVITY_DATA'])
    );
  });

  it('clamps extreme overdue schedule penalty at 0 and handles odd/even overdue days', () => {
    const oddOverdue = evaluateProjectHealth({
      referenceDate: new Date('2026-07-18T00:00:00Z'), // 3 days past end_date -> floor(3/2) = 1 pt penalty
      project: { id: 'p_odd', status: 'Active', start_date: '2026-07-01', end_date: '2026-07-15' },
      tasks: [
        { id: 't1', project_id: 'p_odd', title: 'T1', status: 'In Progress', estimated_hours: 10, end_date: '2026-07-20', updated_at: '2026-07-18' },
      ],
      timesheets: [{ id: 'ts1', project_id: 'p_odd', hours: 4, status: 'Approved', date: '2026-07-18' }],
    });
    // actual 40%, planned 100% -> base 40 - 1 = 39
    expect(oddOverdue.factors.schedule).toBe(39);

    const extremeOverdue = evaluateProjectHealth({
      referenceDate: new Date('2028-07-15T00:00:00Z'), // >700 days overdue -> clamped to 0
      project: { id: 'p_ext', status: 'Active', start_date: '2026-07-01', end_date: '2026-07-15' },
      tasks: [
        { id: 't1', project_id: 'p_ext', title: 'T1', status: 'Review', estimated_hours: 10, end_date: '2026-07-15', updated_at: '2026-07-15' },
      ],
      timesheets: [{ id: 'ts1', project_id: 'p_ext', hours: 8, status: 'Approved', date: '2026-07-15' }],
    });
    expect(extremeOverdue.factors.schedule).toBe(0);
  });

  it('treats personal/Draft/Rejected-only timesheets as NO_TIMESHEETS and caps fast effort at 100', () => {
    const ignoredTs = evaluateProjectHealth({
      referenceDate: REF_DATE,
      project: { id: 'p_ts', status: 'Active', start_date: '2026-07-01', end_date: '2026-09-01' },
      tasks: [{ id: 't1', project_id: 'p_ts', title: 'T1', status: 'Review', estimated_hours: 10, updated_at: '2026-07-31' }],
      timesheets: [
        { id: 'ts_pers', project_id: 'p_ts', hours: 8, status: 'Approved', is_personal: true, date: '2026-07-31' },
        { id: 'ts_draft', project_id: 'p_ts', hours: 8, status: 'Draft', is_personal: false, date: '2026-07-31' },
        { id: 'ts_rej', project_id: 'p_ts', hours: 8, status: 'Rejected', is_personal: false, date: '2026-07-31' },
      ],
    });
    expect(ignoredTs.factors.effort).toBeNull();
    expect(ignoredTs.dataIssues.map((d) => d.code)).toContain('NO_TIMESHEETS');
    expect(ignoredTs.confidence).toBe('MEDIUM');

    const superEfficient = evaluateProjectHealth({
      referenceDate: REF_DATE,
      project: { id: 'p_fast', status: 'Active', start_date: '2026-07-01', end_date: '2026-09-01' },
      tasks: [{ id: 't1', project_id: 'p_fast', title: 'T1', status: 'Review', estimated_hours: 20, updated_at: '2026-07-31' }], // earned = 16h
      timesheets: [{ id: 'ts_ok', project_id: 'p_fast', hours: 4, status: 'Approved', date: '2026-07-31' }], // 16 / 4 = 400% -> clamped 100
    });
    expect(superEfficient.factors.effort).toBe(100);
  });

  it('handles future start_date, missing end_date, and exact deadline day (daysRemaining = 0)', () => {
    const futureProj = evaluateProjectHealth({
      referenceDate: new Date('2026-06-15T00:00:00Z'), // before start_date 2026-07-01 -> planned = 0
      project: { id: 'p_fut', status: 'Planning', start_date: '2026-07-01', end_date: '2026-08-01' },
      tasks: [{ id: 't1', project_id: 'p_fut', title: 'Prep', status: 'To Do', estimated_hours: 8, updated_at: '2026-06-15' }],
      timesheets: [],
    });
    expect(futureProj.factors.schedule).toBe(100);

    const noEndDate = evaluateProjectHealth({
      referenceDate: REF_DATE,
      project: { id: 'p_noend', status: 'Active', start_date: '2026-07-01' },
      tasks: [{ id: 't1', project_id: 'p_noend', title: 'T1', status: 'In Progress', estimated_hours: 10, updated_at: '2026-07-30' }],
      timesheets: [{ id: 'ts1', project_id: 'p_noend', hours: 4, status: 'Pending', date: '2026-07-30' }],
    });
    expect(noEndDate.factors.schedule).toBeNull();
    expect(noEndDate.factors.momentum).toBeNull();
    expect(noEndDate.dataIssues.map((d) => d.code)).toEqual(['MISSING_END_DATE']);
    expect(noEndDate.confidence).toBe('MEDIUM');

    const onDeadlineDay = evaluateProjectHealth({
      referenceDate: new Date('2026-08-01T00:00:00Z'), // exact end_date -> daysRemaining = 0
      project: { id: 'p_end0', status: 'Active', start_date: '2026-07-01', end_date: '2026-08-01' },
      tasks: [{ id: 't1', project_id: 'p_end0', title: 'Unfinished', status: 'In Progress', estimated_hours: 10, updated_at: '2026-08-01' }],
      timesheets: [{ id: 'ts1', project_id: 'p_end0', hours: 4, status: 'Approved', date: '2026-08-01' }],
    });
    expect(onDeadlineDay.factors.momentum).toBe(0);
  });

  it('evaluates exact Data Freshness boundary days (7, 8, 14, 15, 30, 31) and status thresholds (59, 60, 79, 80)', () => {
    const checkFreshness = (daysAgo: number) => {
      const updated = new Date(REF_DATE.getTime() - daysAgo * 86_400_000).toISOString().slice(0, 10);
      return evaluateProjectHealth({
        referenceDate: REF_DATE,
        project: { id: `pf_${daysAgo}`, status: 'Active', start_date: '2026-01-01' },
        tasks: [{ id: 't1', project_id: `pf_${daysAgo}`, title: 'T1', status: 'In Progress', estimated_hours: 8, updated_at: updated }],
      }).factors.freshness;
    };

    expect(checkFreshness(7)).toBe(100);
    expect(checkFreshness(8)).toBe(70);
    expect(checkFreshness(14)).toBe(70);
    expect(checkFreshness(15)).toBe(40);
    expect(checkFreshness(30)).toBe(40);
    expect(checkFreshness(31)).toBe(0);

    // Status boundaries via single-factor active weight (overdue + freshness)
    const yellow60 = evaluateProjectHealth({
      referenceDate: REF_DATE,
      project: { id: 'p_y60', status: 'Active', start_date: '2026-01-01' },
      tasks: [
        { id: 't1', project_id: 'p_y60', title: 'Overdue', status: 'To Do', estimated_hours: 0, end_date: '2026-07-01', updated_at: '2026-08-01' },
        { id: 't2', project_id: 'p_y60', title: 'Open', status: 'To Do', estimated_hours: 0, end_date: '2026-09-01', updated_at: '2026-08-01' },
      ],
    });
    // overdue = 50 (w 0.2), freshness = 100 (w 0.15) -> (10 + 15) / 0.35 = 71 -> YELLOW
    expect(yellow60.status).toBe('YELLOW');
  });
});
