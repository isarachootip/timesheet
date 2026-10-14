import * as XLSX from 'xlsx';
import type { Project, Task, TimesheetEntry } from '../types';
import type { YearlyPersonalSummary } from './personalYearlyMetrics';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

interface MonthlyExportParams {
  userName: string;
  selectedMonth: string;
  entries: TimesheetEntry[];
  projects: Project[];
  tasks: Task[];
}

interface YearlyExportParams {
  userName: string;
  selectedYear: string;
  summary: YearlyPersonalSummary;
  entries: TimesheetEntry[];
  projects: Project[];
  tasks: Task[];
}

const getProjectLabel = (ts: TimesheetEntry, projects: Project[]): string => {
  if (ts.isPersonal) return 'Personal Work / Self-Task';
  if (!ts.projectId) return 'General / Unassigned';
  return projects.find(p => p.id === ts.projectId)?.name || ts.projectId;
};

export const exportPersonalMonthlyExcel = ({
  userName,
  selectedMonth,
  entries,
  projects,
  tasks,
}: MonthlyExportParams): void => {
  const sortedEntries = [...entries].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.startTime || '').localeCompare(b.startTime || '');
  });

  const totalHours = sortedEntries.reduce((sum, e) => sum + e.hours, 0);
  const uniqueDaysCount = new Set(sortedEntries.map(e => e.date.slice(0, 10))).size;

  const detailHeaders = [
    'Date', 'Day of Week', 'Employee Name', 'Project', 'Task / Activity',
    'Start Time', 'End Time', 'Hours Logged', 'Work Description', 'Work Results', 'WFH', 'Status',
  ];

  const detailRows: (string | number)[][] = sortedEntries.map(ts => {
    const tsk = tasks.find(t => t.id === ts.taskId);
    const d = new Date(ts.date);
    const dayOfWeek = isNaN(d.getTime()) ? '' : DAY_NAMES[d.getDay()];
    return [
      ts.date, dayOfWeek, userName, getProjectLabel(ts, projects), tsk?.title || ts.taskId || '-',
      ts.startTime || '-', ts.endTime || '-', ts.hours, ts.description || '', ts.workResults || '',
      ts.isWfh ? 'Yes' : 'No', ts.status,
    ];
  });

  if (detailRows.length > 0) {
    detailRows.push(['TOTAL', '', '', '', '', '', '', totalHours, `${detailRows.length} entry(ies)`, '', '', '']);
  }

  const [yearNum, monthNum] = selectedMonth.split('-').map(Number);
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
  const summaryHeaders = ['Date', 'Day of Week', 'Total Hours Logged', 'Projects Worked On', 'Entries Count', 'Status Summary'];
  const summaryRows: (string | number)[][] = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
    const d = new Date(dateStr);
    const dayOfWeek = isNaN(d.getTime()) ? '' : DAY_NAMES[d.getDay()];
    const dayEntries = sortedEntries.filter(ts => ts.date.startsWith(dateStr));
    const dayHours = dayEntries.reduce((s, ts) => s + ts.hours, 0);
    const dayProjects = Array.from(new Set(dayEntries.map(ts => getProjectLabel(ts, projects)))).join(', ');
    const statuses = Array.from(new Set(dayEntries.map(ts => ts.status))).join(', ');
    return [dateStr, dayOfWeek, dayHours, dayProjects || '-', dayEntries.length, statuses || (dayHours > 0 ? '-' : 'No Log')];
  });

  summaryRows.push(['MONTH TOTAL', '', totalHours, `${uniqueDaysCount} active days`, sortedEntries.length, '']);

  const wb = XLSX.utils.book_new();
  const wsDetails = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailRows]);
  const wsSummary = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);
  XLSX.utils.book_append_sheet(wb, wsDetails, 'Daily Entries Detail');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Daily Month Summary');

  const cleanUserName = userName.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(wb, `Daily_Timesheet_${cleanUserName}_${selectedMonth}.xlsx`);
};

export const exportPersonalYearlyExcel = ({
  userName,
  selectedYear,
  summary,
  entries,
  projects,
  tasks,
}: YearlyExportParams): void => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Project x 12-Month Matrix
  const matrixHeaders = ['Project / Category', ...MONTH_LABELS, 'Total Hours', 'Approved', 'Pending', '% Share'];
  const matrixRows: (string | number)[][] = summary.projectMatrixRows.map(row => [
    row.projectName,
    ...row.monthlyHours,
    row.totalHours,
    row.approvedHours,
    row.pendingHours,
    `${row.percentage}%`,
  ]);

  const monthlyTotals = MONTH_LABELS.map((_, idx) => summary.monthlyBreakdown[idx]?.totalHours || 0);
  matrixRows.push([
    'YEAR TOTAL',
    ...monthlyTotals,
    summary.totalHours,
    summary.approvedHours,
    summary.pendingHours,
    '100%',
  ]);

  const wsMatrix = XLSX.utils.aoa_to_sheet([matrixHeaders, ...matrixRows]);
  XLSX.utils.book_append_sheet(wb, wsMatrix, 'Project Matrix (12M)');

  // Sheet 2: 12-Month Summary
  const monthHeaders = ['Month', 'Total Hours', 'Approved Hours', 'Pending Hours', 'Active Days', 'WFH Days', 'Projects Worked On'];
  const monthRows: (string | number)[][] = summary.monthlyBreakdown.map(m => [
    `${m.monthLabel} (${m.monthKey})`,
    m.totalHours,
    m.approvedHours,
    m.pendingHours,
    m.activeDays,
    m.wfhDays,
    m.projectNames.join(', ') || '-',
  ]);
  monthRows.push([
    `TOTAL ${selectedYear}`,
    summary.totalHours,
    summary.approvedHours,
    summary.pendingHours,
    summary.activeDaysCount,
    summary.wfhDaysCount,
    `${summary.projectMatrixRows.length} project(s)`,
  ]);

  const wsMonthly = XLSX.utils.aoa_to_sheet([monthHeaders, ...monthRows]);
  XLSX.utils.book_append_sheet(wb, wsMonthly, '12-Month Summary');

  // Sheet 3: Yearly Entries Detail
  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const detailHeaders = ['Date', 'Employee Name', 'Project', 'Task', 'Start', 'End', 'Hours', 'Description', 'WFH', 'Status'];
  const detailRows: (string | number)[][] = sortedEntries.map(ts => [
    ts.date,
    userName,
    getProjectLabel(ts, projects),
    tasks.find(t => t.id === ts.taskId)?.title || '-',
    ts.startTime || '-',
    ts.endTime || '-',
    ts.hours,
    ts.description || '',
    ts.isWfh ? 'Yes' : 'No',
    ts.status,
  ]);
  const wsDetails = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailRows]);
  XLSX.utils.book_append_sheet(wb, wsDetails, 'Yearly Entries Detail');

  const cleanUserName = userName.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(wb, `Annual_Timesheet_${cleanUserName}_${selectedYear}.xlsx`);
};
