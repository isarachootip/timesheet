import type { User, Project, TimesheetEntry, Task } from '../types';

export interface MonthlyPersonalSummary {
  monthIndex: number; // 1..12
  monthKey: string; // 'YYYY-MM'
  monthLabel: string; // 'Jan'..'Dec'
  totalHours: number;
  approvedHours: number;
  pendingHours: number;
  activeDays: number;
  wfhDays: number;
  projectNames: string[];
  byProject: Record<string, number>;
}

export interface ProjectMatrixRow {
  projectId: string;
  projectName: string;
  monthlyHours: number[]; // length 12 (Jan..Dec)
  totalHours: number;
  approvedHours: number;
  pendingHours: number;
  percentage: number;
}

export interface YearlyPersonalSummary {
  totalHours: number;
  approvedHours: number;
  pendingHours: number;
  personalHours: number;
  activeDaysCount: number;
  wfhDaysCount: number;
  avgHoursPerActiveDay: string;
  longestStreakDays: number;
  completedTasksCount: number;
  timePattern: string;
  monthlyBreakdown: MonthlyPersonalSummary[];
  projectMatrixRows: ProjectMatrixRow[];
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export const getViewablePersonalUsers = (
  currentUser: User | null,
  users: User[],
  projects: Project[]
): User[] => {
  if (!currentUser) return [];
  if (currentUser.globalRole === 'Admin' || currentUser.globalRole === 'Manager') {
    return users;
  }

  const managedProjects = projects.filter(p =>
    p.members?.some(
      m => m.userId === currentUser.id && (m.role === 'PM' || m.role === 'Team Lead' || m.role === 'Leader')
    )
  );

  if (managedProjects.length > 0) {
    const allowedIds = new Set<string>([currentUser.id]);
    managedProjects.forEach(p => {
      p.members?.forEach(m => allowedIds.add(m.userId));
    });
    return users.filter(u => allowedIds.has(u.id));
  }

  return users.filter(u => u.id === currentUser.id);
};

export const filterPersonalTimesheets = (
  timesheets: TimesheetEntry[],
  userId: string,
  periodPrefix: string,
  includePersonal: boolean
): TimesheetEntry[] => {
  return timesheets.filter(ts => {
    if (ts.userId !== userId) return false;
    if (!ts.date || !ts.date.startsWith(periodPrefix)) return false;
    if (ts.status !== 'Approved' && ts.status !== 'Pending') return false;
    if (!includePersonal && Boolean(ts.isPersonal)) return false;
    return true;
  });
};

export const calculateLongestStreak = (uniqueDates: string[]): number => {
  if (uniqueDates.length === 0) return 0;
  const sortedTimes = uniqueDates
    .map(d => new Date(d).getTime())
    .filter(t => !isNaN(t))
    .sort((a, b) => a - b);

  let maxStreak = 0;
  let currentStreak = 0;
  let prevTime = 0;

  for (const time of sortedTimes) {
    if (prevTime === 0) {
      currentStreak = 1;
    } else {
      const diffDays = (time - prevTime) / (1000 * 60 * 60 * 24);
      if (diffDays <= 1.1) {
        currentStreak++;
      } else {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 1;
      }
    }
    prevTime = time;
  }
  return Math.max(maxStreak, currentStreak);
};

export const calculateTimePattern = (entries: TimesheetEntry[]): string => {
  const timedEntries = entries.filter(ts => Boolean(ts.startTime && ts.endTime));
  if (timedEntries.length === 0) return 'No time data';

  let startMinSum = 0;
  let endMinSum = 0;
  timedEntries.forEach(entry => {
    const [sh, sm] = (entry.startTime || '00:00').split(':').map(Number);
    const [eh, em] = (entry.endTime || '00:00').split(':').map(Number);
    startMinSum += sh * 60 + sm;
    endMinSum += eh * 60 + em;
  });

  const formatMin = (m: number) => {
    const hStr = String(Math.floor(m / 60)).padStart(2, '0');
    const mStr = String(Math.round(m % 60)).padStart(2, '0');
    return `${hStr}:${mStr}`;
  };

  return `${formatMin(startMinSum / timedEntries.length)} - ${formatMin(endMinSum / timedEntries.length)}`;
};

const resolveProjectInfo = (ts: TimesheetEntry, projects: Project[]): { id: string; name: string } => {
  if (ts.isPersonal) return { id: 'personal_work', name: 'Personal Work / Self-Task' };
  if (!ts.projectId) return { id: 'unassigned_work', name: 'General / Unassigned' };
  const proj = projects.find(p => p.id === ts.projectId);
  return { id: ts.projectId, name: proj ? proj.name : ts.projectId };
};

export const calculateYearlyPersonalSummary = (
  timesheets: TimesheetEntry[],
  tasks: Task[],
  projects: Project[],
  userId: string,
  year: string,
  includePersonal: boolean
): YearlyPersonalSummary => {
  const entries = filterPersonalTimesheets(timesheets, userId, year, includePersonal);

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  const approvedHours = entries.filter(e => e.status === 'Approved').reduce((sum, e) => sum + e.hours, 0);
  const pendingHours = entries.filter(e => e.status === 'Pending').reduce((sum, e) => sum + e.hours, 0);
  const personalHours = entries.filter(e => Boolean(e.isPersonal)).reduce((sum, e) => sum + e.hours, 0);

  const uniqueDates = Array.from(new Set(entries.map(e => e.date.slice(0, 10))));
  const wfhDates = Array.from(new Set(entries.filter(e => Boolean(e.isWfh)).map(e => e.date.slice(0, 10))));
  const activeDaysCount = uniqueDates.length;
  const wfhDaysCount = wfhDates.length;
  const avgHoursPerActiveDay = activeDaysCount > 0 ? (totalHours / activeDaysCount).toFixed(1) : '0.0';
  const longestStreakDays = calculateLongestStreak(uniqueDates);
  const timePattern = calculateTimePattern(entries);

  const completedTasksCount = tasks.filter(t => {
    if (t.assigneeId !== userId) return false;
    const isDone = t.status.toLowerCase() === 'done' || t.status.toLowerCase() === 'completed';
    if (!isDone) return false;
    const refDate = t.endDate || t.updatedAt || t.createdAt || '';
    return refDate ? refDate.startsWith(year) : true;
  }).length;

  const projectMap = new Map<string, ProjectMatrixRow>();

  const monthlyBreakdown: MonthlyPersonalSummary[] = MONTH_LABELS.map((label, idx) => {
    const monthKey = `${year}-${String(idx + 1).padStart(2, '0')}`;
    const mEntries = entries.filter(e => e.date.startsWith(monthKey));
    const mTotal = mEntries.reduce((s, e) => s + e.hours, 0);
    const mApproved = mEntries.filter(e => e.status === 'Approved').reduce((s, e) => s + e.hours, 0);
    const mPending = mEntries.filter(e => e.status === 'Pending').reduce((s, e) => s + e.hours, 0);
    const mDates = new Set(mEntries.map(e => e.date.slice(0, 10)));
    const mWfhDates = new Set(mEntries.filter(e => Boolean(e.isWfh)).map(e => e.date.slice(0, 10)));
    const byProject: Record<string, number> = {};
    const pNames = new Set<string>();

    mEntries.forEach(e => {
      const pInfo = resolveProjectInfo(e, projects);
      pNames.add(pInfo.name);
      byProject[pInfo.name] = (byProject[pInfo.name] || 0) + e.hours;

      if (!projectMap.has(pInfo.id)) {
        projectMap.set(pInfo.id, {
          projectId: pInfo.id,
          projectName: pInfo.name,
          monthlyHours: Array(12).fill(0),
          totalHours: 0,
          approvedHours: 0,
          pendingHours: 0,
          percentage: 0,
        });
      }
      const row = projectMap.get(pInfo.id)!;
      row.monthlyHours[idx] += e.hours;
      row.totalHours += e.hours;
      if (e.status === 'Approved') row.approvedHours += e.hours;
      if (e.status === 'Pending') row.pendingHours += e.hours;
    });

    return {
      monthIndex: idx + 1,
      monthKey,
      monthLabel: label,
      totalHours: mTotal,
      approvedHours: mApproved,
      pendingHours: mPending,
      activeDays: mDates.size,
      wfhDays: mWfhDates.size,
      projectNames: Array.from(pNames),
      byProject,
    };
  });

  const projectMatrixRows = Array.from(projectMap.values())
    .map(r => ({
      ...r,
      percentage: totalHours > 0 ? Math.round((r.totalHours / totalHours) * 100) : 0,
    }))
    .sort((a, b) => b.totalHours - a.totalHours);

  return {
    totalHours,
    approvedHours,
    pendingHours,
    personalHours,
    activeDaysCount,
    wfhDaysCount,
    avgHoursPerActiveDay,
    longestStreakDays,
    completedTasksCount,
    timePattern,
    monthlyBreakdown,
    projectMatrixRows,
  };
};
