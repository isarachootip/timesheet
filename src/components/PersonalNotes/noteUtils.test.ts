import { describe, it, expect } from 'vitest';
import { getDueStatus, filterAndSortNotes, COLOR_THEMES } from './noteUtils';
import type { PersonalNote } from '../../types';

describe('noteUtils', () => {
  describe('COLOR_THEMES', () => {
    it('defines colors with matching text and background contrast', () => {
      expect(COLOR_THEMES.yellow).toBeDefined();
      expect(COLOR_THEMES.blue).toBeDefined();
      expect(COLOR_THEMES.green).toBeDefined();
      expect(COLOR_THEMES.pink).toBeDefined();
      expect(COLOR_THEMES.orange).toBeDefined();
      expect(COLOR_THEMES.purple).toBeDefined();
    });
  });

  describe('getDueStatus', () => {
    const today = '2026-10-05';

    it('returns completed when isCompleted is true', () => {
      expect(getDueStatus('2026-10-01', true, today)).toBe('completed');
    });

    it('returns none when no due date', () => {
      expect(getDueStatus(undefined, false, today)).toBe('none');
    });

    it('identifies overdue dates', () => {
      expect(getDueStatus('2026-10-04', false, today)).toBe('overdue');
    });

    it('identifies due today', () => {
      expect(getDueStatus('2026-10-05', false, today)).toBe('due-today');
    });

    it('identifies due soon (within 3 days)', () => {
      expect(getDueStatus('2026-10-07', false, today)).toBe('due-soon');
    });

    it('identifies upcoming dates', () => {
      expect(getDueStatus('2026-10-20', false, today)).toBe('upcoming');
    });
  });

  describe('filterAndSortNotes', () => {
    const sampleNotes: PersonalNote[] = [
      {
        id: '1',
        userId: 'u1',
        title: 'Complete report',
        content: 'Draft project report',
        noteDate: '2026-10-01',
        dueDate: '2026-10-10',
        color: 'yellow',
        isCompleted: true,
      },
      {
        id: '2',
        userId: 'u1',
        title: 'Review PR',
        content: 'Check backend changes',
        noteDate: '2026-10-02',
        dueDate: '2026-10-06',
        color: 'blue',
        isCompleted: false,
      },
      {
        id: '3',
        userId: 'u1',
        title: 'Buy snacks',
        content: 'Coffee and snacks',
        noteDate: '2026-10-03',
        color: 'pink',
        isCompleted: false,
      },
    ];

    it('filters active notes correctly', () => {
      const active = filterAndSortNotes(sampleNotes, 'active');
      expect(active).toHaveLength(2);
      expect(active.every((n) => !n.isCompleted)).toBe(true);
    });

    it('filters completed notes correctly', () => {
      const completed = filterAndSortNotes(sampleNotes, 'completed');
      expect(completed).toHaveLength(1);
      expect(completed[0].id).toBe('1');
    });

    it('filters by search keyword', () => {
      const searched = filterAndSortNotes(sampleNotes, 'all', 'snacks');
      expect(searched).toHaveLength(1);
      expect(searched[0].id).toBe('3');
    });

    it('sorts uncompleted notes first and prioritizes earlier due dates', () => {
      const sorted = filterAndSortNotes(sampleNotes, 'all');
      expect(sorted[0].id).toBe('2'); // due 2026-10-06 (incomplete)
      expect(sorted[1].id).toBe('3'); // no due date (incomplete)
      expect(sorted[2].id).toBe('1'); // completed
    });
  });
});
