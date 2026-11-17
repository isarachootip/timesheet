import { describe, it, expect } from 'vitest';
import { evaluateProjectHealth } from '../projectHealthEngine.js';

const REF_DATE = new Date('2026-07-15T00:00:00Z');

describe('evaluateProjectHealth — Core Factors & Edge Cases', () => {
  it('calculates all 5 factors accurately for a normal active project', () => {
    const result = evaluateProjectHealth({
      referenceDate: REF_DATE,
      project: {
        id: 'p_normal',
        name: 'Normal Project',
        status: 'Active',
        start_date: '2026-07-01',
        end_date: '2026-07-29', // 28 days total; on July 15 -> planned = 14/28 = 0.5
        project_type: 'dev',
      },
      tasks: [
        {
          id: 'm1',
          project_id: 'p_normal',
          title: 'Milestone 1',
          status: 'Done',
          estimated_hours: 20,
          end_date: '2026-07-10',
          created_at: '2026-07-01T00:00:00Z',
          updated_at: '2026-07-10T00:00:00Z',
          completed_at: '2026-07-10T00:00:00Z',
        },
        {
          id: 'm2',
          project_id: 'p_normal',
          title: 'Milestone 2',
          status: 'To Do',
          estimated_hours: 20,
          end_date: '2026-07-28',
          created_at: '2026-07-01T00:00:00Z',
          updated_at: '2026-07-12T00:00:00Z',
        },
      ],
      timesheets: [
        { id: 'ts1', project_id: 'p_normal', hours: 16, status: 'Approved', date: '2026-07-09', updated_at: '2026-07-10T00:00:00Z' },
        { id: 'ts2', project_id: 'p_normal', hours: 4, status: 'Pending', date: '2026-07-13', updated_at: '2026-07-13T00:00:00Z' },
        { id: 'ts_draft', project_id: 'p_normal', hours: 50, status: 'Draft', date: '2026-07-14' },
        { id: 'ts_rej', project_id: 'p_normal', hours: 50, status: 'Rejected', date: '2026-07-14' },
      ],
    });

    expect(result.status).toBe('GREEN');
    expect(result.confidence).toBe('HIGH');
    expect(result.dataIssues).toEqual([]);
    expect(result.factors.schedule).toBe(100); // actual 0.5 / planned 0.5 = 100
    expect(result.factors.overdue).toBe(100); // 0 overdue out of 1 not-done
    expect(result.factors.effort).toBe(100); // earned 20h / actual 20h = 100
    expect(result.factors.momentum).toBe(100); // actualRate (20/14) / requiredRate (20/14) = 100
    expect(result.factors.freshness).toBe(100); // updated 2 days ago <= 7d
    expect(result.healthScore).toBe(100);
  });

  it('applies overdue schedule penalty (-1 pt per 2 days past end_date) and sets momentum to 0', () => {
    const result = evaluateProjectHealth({
      referenceDate: new Date('2026-07-25T00:00:00Z'), // 10 days past 2026-07-15 -> -5 penalty
      project: {
        id: 'p_late',
        name: 'Late Project',
        status: 'Active',
        start_date: '2026-07-01',
        end_date: '2026-07-15',
      },
      tasks: [
        {
          id: 't1',
          project_id: 'p_late',
          title: 'Done Task',
          status: 'Done',
          estimated_hours: 10,
          end_date: '2026-07-10',
          created_at: '2026-07-01T00:00:00Z',
          updated_at: '2026-07-10T00:00:00Z',
          completed_at: '2026-07-10T00:00:00Z',
        },
        {
          id: 't2',
          project_id: 'p_late',
          title: 'Late Task',
          status: 'In Progress', // 40%
          estimated_hours: 10,
          end_date: '2026-07-15',
          created_at: '2026-07-01T00:00:00Z',
          updated_at: '2026-07-16T00:00:00Z', // 9 days ago -> freshness 70
        },
      ],
      timesheets: [
        { id: 'ts1', project_id: 'p_late', hours: 28, status: 'Approved', date: '2026-07-15', updated_at: '2026-07-15T00:00:00Z' },
      ],
    });

    // actual% = (10*1 + 10*0.4)/20 = 0.7 -> base 70, minus floor(10/2)=5 -> 65
    expect(result.factors.schedule).toBe(65);
    expect(result.factors.overdue).toBe(0); // 1 overdue / 1 not-done -> 0
    expect(result.factors.effort).toBe(50); // earned 14 / actual 28 -> 50
    expect(result.factors.momentum).toBe(0); // past end_date and work remaining -> 0
    expect(result.factors.freshness).toBe(70); // 9 days since update -> 70
    // score = 65*0.3 + 0*0.2 + 50*0.2 + 0*0.15 + 70*0.15 = 19.5 + 0 + 10 + 0 + 10.5 = 40
    expect(result.healthScore).toBe(40);
    expect(result.status).toBe('RED');
  });

  it('falls back to milestone average % when all estimated_hours are 0 and re-normalizes weights', () => {
    const result = evaluateProjectHealth({
      referenceDate: REF_DATE,
      project: {
        id: 'p_no_est',
        name: 'Zero Estimate Project',
        status: 'Active',
        start_date: '2026-07-01',
        end_date: '2026-07-29', // planned = 0.5
      },
      tasks: [
        { id: 'm1', project_id: 'p_no_est', title: 'M1', status: 'Done', estimated_hours: 0, end_date: '2026-07-20', created_at: '2026-07-01', updated_at: '2026-07-14' },
        { id: 'm2', project_id: 'p_no_est', title: 'M2', status: 'To Do', estimated_hours: 0, end_date: '2026-07-25', created_at: '2026-07-01', updated_at: '2026-07-14' },
      ],
      timesheets: [
        { id: 'ts1', project_id: 'p_no_est', hours: 10, status: 'Approved', date: '2026-07-14' },
      ],
    });

    expect(result.factors.schedule).toBe(100); // avg progress (100% + 0%)/2 = 50% vs planned 50% -> 100
    expect(result.factors.effort).toBeNull();
    expect(result.factors.momentum).toBeNull();
    expect(result.confidence).toBe('MEDIUM');
    expect(result.dataIssues.map((i) => i.code)).toContain('ZERO_ESTIMATED_HOURS');
  });

  it('handles inverted dates and missing timesheets by lowering confidence to LOW', () => {
    const result = evaluateProjectHealth({
      referenceDate: REF_DATE,
      project: {
        id: 'p_inv',
        name: 'Inverted Project',
        status: 'Active',
        start_date: '2026-08-10',
        end_date: '2026-07-01', // inverted!
      },
      tasks: [
        { id: 't1', project_id: 'p_inv', title: 'Task 1', status: 'In Progress', estimated_hours: 10, end_date: '2026-07-20', created_at: '2026-07-01', updated_at: '2026-07-14' },
      ],
      timesheets: [],
    });

    expect(result.factors.schedule).toBeNull();
    expect(result.factors.effort).toBeNull();
    expect(result.factors.momentum).toBeNull();
    expect(result.factors.overdue).toBe(100);
    expect(result.factors.freshness).toBe(100);
    expect(result.confidence).toBe('LOW');
    expect(result.dataIssues.map((i) => i.code)).toEqual(
      expect.arrayContaining(['INVERTED_PROJECT_DATES', 'NO_TIMESHEETS'])
    );
  });

  it('returns COMPLETED immediately without factor calculations when status is Completed or tasks are 100%', () => {
    const byStatus = evaluateProjectHealth({
      referenceDate: REF_DATE,
      project: { id: 'p_comp1', name: 'Done By Status', status: 'Completed', start_date: '2026-01-01', end_date: '2026-02-01' },
      tasks: [{ id: 't1', project_id: 'p_comp1', title: 'Open Task', status: 'To Do', estimated_hours: 8, created_at: '2026-01-01' }],
      timesheets: [],
    });
    expect(byStatus.status).toBe('COMPLETED');
    expect(byStatus.factors.schedule).toBeNull();

    const by100Pct = evaluateProjectHealth({
      referenceDate: REF_DATE,
      project: { id: 'p_comp2', name: 'Done By Tasks', status: 'Active', start_date: '2026-01-01', end_date: '2026-02-01' },
      tasks: [{ id: 't1', project_id: 'p_comp2', title: 'All Done', status: 'Done', estimated_hours: 8, created_at: '2026-01-01' }],
      timesheets: [],
    });
    expect(by100Pct.status).toBe('COMPLETED');
    expect(by100Pct.factors.overdue).toBeNull();
  });
});
