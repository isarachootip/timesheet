import { describe, it, expect } from 'vitest';
import type { PersonalNote } from '../../types';
import {
  convertNoteToTimesheetDraft,
  validateTimesheetDraft,
  filterCandidateNotesForImport,
} from './importNoteUtils';

describe('importNoteUtils', () => {
  const mockNote: PersonalNote = {
    id: 'note_123',
    userId: 'user_1',
    title: 'test svc',
    content: 'test หน้าจอแรก SVC',
    noteDate: '2026-10-05',
    dueDate: '2026-10-05',
    color: 'green',
    isCompleted: false,
  };

  describe('convertNoteToTimesheetDraft', () => {
    it('correctly maps PersonalNote into a TimesheetEntry draft', () => {
      const draft = convertNoteToTimesheetDraft({
        note: mockNote,
        userId: 'user_1',
        projectId: 'proj_alpha',
        taskId: 'task_99',
        hours: 4,
      });

      expect(draft.id).toMatch(/^ts_/);
      expect(draft.userId).toBe('user_1');
      expect(draft.projectId).toBe('proj_alpha');
      expect(draft.taskId).toBe('task_99');
      expect(draft.date).toBe('2026-10-05');
      expect(draft.hours).toBe(4);
      expect(draft.description).toBe('test svc');
      expect(draft.workResults).toBe('test หน้าจอแรก SVC');
      expect(draft.status).toBe('Pending');
      expect(draft.isWfh).toBe(false);
    });

    it('allows overriding date and setting isWfh', () => {
      const draft = convertNoteToTimesheetDraft({
        note: mockNote,
        userId: 'user_1',
        projectId: 'proj_alpha',
        hours: 2.5,
        date: '2026-10-13',
        isWfh: true,
      });

      expect(draft.date).toBe('2026-10-13');
      expect(draft.hours).toBe(2.5);
      expect(draft.isWfh).toBe(true);
      expect(draft.taskId).toBeUndefined();
    });

    it('creates personal entry with Approved status and without project', () => {
      const draft = convertNoteToTimesheetDraft({
        note: mockNote,
        userId: 'user_1',
        projectId: '',
        hours: 1,
        isPersonal: true,
      });

      expect(draft.isPersonal).toBe(true);
      expect(draft.projectId).toBeUndefined();
      expect(draft.status).toBe('Approved');
    });
  });

  describe('validateTimesheetDraft', () => {
    it('validates required fields successfully for project work', () => {
      const res = validateTimesheetDraft({
        projectId: 'proj_alpha',
        hours: 3,
        description: 'Completed feature',
        date: '2026-10-13',
      });
      expect(res.isValid).toBe(true);
      expect(res.error).toBeUndefined();
    });

    it('validates successfully when isPersonal is true even if projectId is empty', () => {
      const res = validateTimesheetDraft({
        projectId: '',
        hours: 2,
        description: 'Personal learning',
        date: '2026-10-13',
        isPersonal: true,
      });
      expect(res.isValid).toBe(true);
      expect(res.error).toBeUndefined();
    });

    it('fails if projectId is missing for non-personal entry', () => {
      const res = validateTimesheetDraft({
        projectId: '',
        hours: 3,
        description: 'Completed feature',
        date: '2026-10-13',
        isPersonal: false,
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/project/i);
    });

    it('fails if hours is zero or negative', () => {
      const res = validateTimesheetDraft({
        projectId: 'proj_alpha',
        hours: 0,
        description: 'Completed feature',
        date: '2026-10-13',
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/hour/i);
    });

    it('fails if description is empty', () => {
      const res = validateTimesheetDraft({
        projectId: 'proj_alpha',
        hours: 2,
        description: '   ',
        date: '2026-10-13',
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/description/i);
    });
  });

  describe('filterCandidateNotesForImport', () => {
    const notes: PersonalNote[] = [
      { id: '1', userId: 'u1', title: 'Project Task 1', content: '', color: 'yellow', noteDate: '2026-10-13', isCompleted: false, workType: 'project', projectId: 'proj_1' },
      { id: '2', userId: 'u1', title: 'Project Task 2', content: '', color: 'blue', noteDate: '2026-10-10', isCompleted: false, workType: 'project', projectId: 'proj_1' },
      { id: '3', userId: 'u1', title: 'Done Project Task', content: '', color: 'green', noteDate: '2026-10-13', isCompleted: true, workType: 'project', projectId: 'proj_1' },
      { id: '4', userId: 'u1', title: 'Personal Task', content: '', color: 'yellow', noteDate: '2026-10-13', isCompleted: false, workType: 'personal' },
      { id: '5', userId: 'u1', title: 'Already Logged Task', content: '', color: 'yellow', noteDate: '2026-10-13', isCompleted: true, workType: 'project', projectId: 'proj_1', timesheetId: 'ts_001' },
    ];

    it('filters out personal notes and already logged notes', () => {
      const candidates = filterCandidateNotesForImport(notes, '2026-10-13');
      expect(candidates.map((c) => c.id)).not.toContain('4'); // personal
      expect(candidates.map((c) => c.id)).not.toContain('5'); // logged
      expect(candidates.length).toBe(3);
    });

    it('prioritizes notes matching selected date and uncompleted ones', () => {
      const candidates = filterCandidateNotesForImport(notes, '2026-10-13');
      expect(candidates.length).toBe(3);
      // Active note on same date should be first
      expect(candidates[0].id).toBe('1');
    });
  });
});
