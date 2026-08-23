import { describe, it, expect } from 'vitest';
import { formatToDDMMYYYY, sortTimesheetsByLastUpdate } from './utils';
import type { TimesheetEntry } from './types';

describe('formatToDDMMYYYY', () => {
  it('formats YYYY-MM-DD string correctly', () => {
    expect(formatToDDMMYYYY('2023-05-15')).toBe('15/05/2023');
  });

  it('formats Date object correctly', () => {
    const d = new Date('2023-05-15T12:00:00Z');
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    expect(formatToDDMMYYYY(d)).toBe(`${dd}/${mm}/${yyyy}`);
  });

  it('handles empty input', () => {
    expect(formatToDDMMYYYY('')).toBe('');
    expect(formatToDDMMYYYY(null)).toBe('');
    expect(formatToDDMMYYYY(undefined)).toBe('');
  });

  it('returns original string on invalid date parsing fallback', () => {
    expect(formatToDDMMYYYY('invalid-date')).toBe('invalid-date');
  });
});

describe('sortTimesheetsByLastUpdate', () => {
  it('sorts by updatedAt descending', () => {
    const ts1 = { updatedAt: '2023-01-01T00:00:00Z' } as TimesheetEntry;
    const ts2 = { updatedAt: '2023-01-02T00:00:00Z' } as TimesheetEntry;
    const sorted = sortTimesheetsByLastUpdate([ts1, ts2]);
    expect(sorted).toEqual([ts2, ts1]);
  });
  
  it('falls back to id if no updatedAt', () => {
    const ts1 = { id: 'ts_1000' } as TimesheetEntry;
    const ts2 = { id: 'ts_2000' } as TimesheetEntry;
    const sorted = sortTimesheetsByLastUpdate([ts1, ts2]);
    expect(sorted).toEqual([ts2, ts1]);
  });
});
