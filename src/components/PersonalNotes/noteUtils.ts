import type { PersonalNote, PostItColor } from '../../types';

export interface ColorTheme {
  bg: string;
  border: string;
  headerBg: string;
  accent: string;
  badgeBg: string;
  textColor: string;
}

export const COLOR_THEMES: Record<PostItColor, ColorTheme> = {
  yellow: {
    bg: '#fef9c3',
    border: '#fde047',
    headerBg: '#fef08a',
    accent: '#ca8a04',
    badgeBg: '#fef08a',
    textColor: '#713f12',
  },
  blue: {
    bg: '#e0f2fe',
    border: '#7dd3fc',
    headerBg: '#bae6fd',
    accent: '#0284c7',
    badgeBg: '#bae6fd',
    textColor: '#0c4a6e',
  },
  green: {
    bg: '#dcfce7',
    border: '#86efac',
    headerBg: '#bbf7d0',
    accent: '#16a34a',
    badgeBg: '#bbf7d0',
    textColor: '#14532d',
  },
  pink: {
    bg: '#fce7f3',
    border: '#f472b6',
    headerBg: '#fbcfe8',
    accent: '#db2777',
    badgeBg: '#fbcfe8',
    textColor: '#831843',
  },
  orange: {
    bg: '#ffedd5',
    border: '#fdba74',
    headerBg: '#fed7aa',
    accent: '#ea580c',
    badgeBg: '#fed7aa',
    textColor: '#7c2d12',
  },
  purple: {
    bg: '#f3e8ff',
    border: '#d8b4fe',
    headerBg: '#e9d5ff',
    accent: '#9333ea',
    badgeBg: '#e9d5ff',
    textColor: '#581c87',
  },
};

export type DueStatus = 'completed' | 'none' | 'overdue' | 'due-today' | 'due-soon' | 'upcoming';

export function getDueStatus(
  dueDate?: string,
  isCompleted?: boolean,
  currentDateStr?: string
): DueStatus {
  if (isCompleted) return 'completed';
  if (!dueDate) return 'none';

  const todayStr = currentDateStr || new Date().toISOString().split('T')[0];
  if (dueDate < todayStr) return 'overdue';
  if (dueDate === todayStr) return 'due-today';

  const today = new Date(todayStr);
  const due = new Date(dueDate);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 3) return 'due-soon';
  return 'upcoming';
}

export function filterAndSortNotes(
  notes: PersonalNote[],
  filter: 'all' | 'active' | 'completed',
  searchQuery = ''
): PersonalNote[] {
  const query = searchQuery.trim().toLowerCase();

  return notes
    .filter((note) => {
      if (filter === 'active' && note.isCompleted) return false;
      if (filter === 'completed' && !note.isCompleted) return false;
      if (query) {
        const titleMatch = note.title.toLowerCase().includes(query);
        const contentMatch = note.content.toLowerCase().includes(query);
        return titleMatch || contentMatch;
      }
      return true;
    })
    .sort((a, b) => {
      // Incomplete notes first
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      // If both have due date, earlier due date first
      if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      // Fallback: newer noteDate or createdAt first
      return (b.noteDate || '').localeCompare(a.noteDate || '');
    });
}
