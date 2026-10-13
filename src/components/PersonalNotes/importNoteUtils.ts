import type { PersonalNote, TimesheetEntry } from '../../types';
import { isProjectNote } from './noteUtils';

export interface ConvertNoteOptions {
  note: PersonalNote;
  userId: string;
  projectId?: string;
  taskId?: string;
  hours: number;
  date?: string;
  isWfh?: boolean;
  isPersonal?: boolean;
}

/**
 * Converts a Personal Note into a complete TimesheetEntry draft.
 */
export function convertNoteToTimesheetDraft({
  note,
  userId,
  projectId,
  taskId,
  hours,
  date,
  isWfh = false,
  isPersonal = false,
}: ConvertNoteOptions): TimesheetEntry {
  const targetDate = date || note.noteDate || new Date().toISOString().split('T')[0];

  return {
    id: `ts_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    projectId: isPersonal ? undefined : (projectId && projectId.trim() ? projectId : undefined),
    taskId: isPersonal ? undefined : (taskId && taskId.trim() ? taskId : undefined),
    date: targetDate,
    hours,
    description: note.title.trim(),
    workResults: note.content ? note.content.trim() : undefined,
    status: isPersonal ? 'Approved' : 'Pending',
    isWfh,
    isPersonal,
  };
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates whether the draft entry satisfies all required timesheet constraints.
 */
export function validateTimesheetDraft(draft: {
  projectId?: string;
  hours?: number;
  description?: string;
  date?: string;
  isPersonal?: boolean;
}): ValidationResult {
  if (!draft.isPersonal && (!draft.projectId || !draft.projectId.trim())) {
    return { isValid: false, error: 'Project is required' };
  }

  if (typeof draft.hours !== 'number' || isNaN(draft.hours) || draft.hours <= 0) {
    return { isValid: false, error: 'Hours must be greater than 0' };
  }

  if (!draft.description || !draft.description.trim()) {
    return { isValid: false, error: 'Description is required' };
  }

  if (!draft.date || !draft.date.trim()) {
    return { isValid: false, error: 'Date is required' };
  }

  return { isValid: true };
}

/**
 * Filters and orders candidate notes for Timesheet import.
 * Strictly includes ONLY notes marked as project work (with a project attached)
 * and excludes notes that have already been logged to a timesheet.
 *
 * Prioritizes:
 * 1. Uncompleted notes on the given selectedDate
 * 2. Other uncompleted notes
 * 3. Completed notes on the selectedDate
 * 4. Other completed notes
 */
export function filterCandidateNotesForImport(
  notes: PersonalNote[],
  selectedDate?: string
): PersonalNote[] {
  const eligibleNotes = notes.filter((n) => isProjectNote(n) && !n.timesheetId);

  return eligibleNotes.sort((a, b) => {
    const aIsToday = selectedDate && a.noteDate === selectedDate;
    const bIsToday = selectedDate && b.noteDate === selectedDate;

    // Both active vs completed
    if (!a.isCompleted && b.isCompleted) return -1;
    if (a.isCompleted && !b.isCompleted) return 1;

    // Within same completion status, date match comes first
    if (aIsToday && !bIsToday) return -1;
    if (!aIsToday && bIsToday) return 1;

    // Newer note date first
    return (b.noteDate || '').localeCompare(a.noteDate || '');
  });
}
