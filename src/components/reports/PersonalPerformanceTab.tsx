import { useState, useMemo } from 'react';
import { FileSpreadsheet, Calendar, CalendarDays, CheckCircle2 } from 'lucide-react';
import type { User, Project, TimesheetEntry, Task } from '../../types';
import {
  getViewablePersonalUsers,
  filterPersonalTimesheets,
  calculateYearlyPersonalSummary,
  calculateLongestStreak,
} from '../../utils/personalYearlyMetrics';
import { exportPersonalMonthlyExcel, exportPersonalYearlyExcel } from '../../utils/personalReportExport';
import { PersonalYearlyCharts } from './PersonalYearlyCharts';
import { PersonalYearlyTables } from './PersonalYearlyTables';
import { PersonalMonthlyView } from './PersonalMonthlyView';

interface PersonalPerformanceTabProps {
  timesheets: TimesheetEntry[];
  projects: Project[];
  users: User[];
  currentUser: User | null;
  tasks: Task[];
  selectedUser: string;
  onSelectUser: (userId: string) => void;
}

export const PersonalPerformanceTab = ({
  timesheets,
  projects,
  users,
  currentUser,
  tasks,
  selectedUser,
  onSelectUser,
}: PersonalPerformanceTabProps) => {
  const today = new Date();
  const defaultYear = String(today.getFullYear());
  const defaultMonth = `${defaultYear}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const [viewMode, setViewMode] = useState<'yearly' | 'monthly'>('yearly');
  const [selectedYear, setSelectedYear] = useState<string>(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth);
  const [includePersonal, setIncludePersonal] = useState<boolean>(true);

  const viewableUsers = useMemo(
    () => getViewablePersonalUsers(currentUser, users, projects),
    [currentUser, users, projects]
  );

  const activeUserId = useMemo(() => {
    if (selectedUser !== 'all' && viewableUsers.some(u => u.id === selectedUser)) {
      return selectedUser;
    }
    return currentUser?.id || viewableUsers[0]?.id || '';
  }, [selectedUser, viewableUsers, currentUser]);

  const activeUserObj = users.find(u => u.id === activeUserId) || currentUser;
  const userName = activeUserObj?.name || 'Employee';

  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>(['2025', '2026', '2027', defaultYear]);
    timesheets.forEach(ts => {
      if (ts.date && ts.date.length >= 4) yearsSet.add(ts.date.slice(0, 4));
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [timesheets, defaultYear]);

  const yearlySummary = useMemo(
    () => calculateYearlyPersonalSummary(timesheets, tasks, projects, activeUserId, selectedYear, includePersonal),
    [timesheets, tasks, projects, activeUserId, selectedYear, includePersonal]
  );

  const yearlyEntries = useMemo(
    () => filterPersonalTimesheets(timesheets, activeUserId, selectedYear, includePersonal),
    [timesheets, activeUserId, selectedYear, includePersonal]
  );

  const monthlyEntries = useMemo(
    () => filterPersonalTimesheets(timesheets, activeUserId, selectedMonth, includePersonal),
    [timesheets, activeUserId, selectedMonth, includePersonal]
  );

  const monthlyTotalHours = monthlyEntries.reduce((s, e) => s + e.hours, 0);
  const monthlyApprovedHours = monthlyEntries.filter(e => e.status === 'Approved').reduce((s, e) => s + e.hours, 0);
  const monthlyPendingHours = monthlyEntries.filter(e => e.status === 'Pending').reduce((s, e) => s + e.hours, 0);
  const monthlyUniqueDates = Array.from(new Set(monthlyEntries.map(e => e.date.slice(0, 10))));
  const monthlyAvgHours = monthlyUniqueDates.length > 0 ? (monthlyTotalHours / monthlyUniqueDates.length).toFixed(1) : '0.0';
  const monthlyStreak = calculateLongestStreak(monthlyUniqueDates);

  const handleDrillDownMonth = (monthKey: string) => {
    setSelectedMonth(monthKey);
    setViewMode('monthly');
  };

  const handleExportExcel = () => {
    if (viewMode === 'yearly') {
      exportPersonalYearlyExcel({ userName, selectedYear, summary: yearlySummary, entries: yearlyEntries, projects, tasks });
    } else {
      exportPersonalMonthlyExcel({ userName, selectedMonth, entries: monthlyEntries, projects, tasks });
    }
  };

  const selectStyle: React.CSSProperties = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    borderRadius: '0.375rem',
    padding: '0.35rem 0.6rem',
    fontSize: '0.82rem',
    outline: 'none',
    cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Filter Bar */}
      <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        {viewableUsers.length > 1 && (
          <div className="glass-panel" style={{ padding: '0.25rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Employee:</span>
            <select value={activeUserId} onChange={e => onSelectUser(e.target.value)} style={{ ...selectStyle, border: 'none', background: 'transparent' }}>
              {viewableUsers.map(u => (
                <option key={u.id} value={u.id} style={{ background: 'var(--bg-secondary)' }}>
                  {u.name} ({u.department || u.globalRole})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Yearly / Monthly Switch */}
        <div className="glass-panel" style={{ padding: '0.25rem', display: 'flex', gap: '0.25rem' }}>
          <button
            type="button"
            onClick={() => setViewMode('yearly')}
            style={{ background: viewMode === 'yearly' ? 'var(--bg-tertiary)' : 'transparent', color: viewMode === 'yearly' ? 'var(--text-primary)' : 'var(--text-secondary)', border: 'none', padding: '0.45rem 0.9rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Calendar size={15} /> Yearly Overview
          </button>
          <button
            type="button"
            onClick={() => setViewMode('monthly')}
            style={{ background: viewMode === 'monthly' ? 'var(--bg-tertiary)' : 'transparent', color: viewMode === 'monthly' ? 'var(--text-primary)' : 'var(--text-secondary)', border: 'none', padding: '0.45rem 0.9rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <CalendarDays size={15} /> Monthly Detail
          </button>
        </div>

        {/* Period Selector */}
        {viewMode === 'yearly' ? (
          <div className="glass-panel" style={{ padding: '0.3rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Year:</span>
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={{ ...selectStyle, border: 'none', background: 'transparent', fontWeight: 600 }}>
              {availableYears.map(yr => (
                <option key={yr} value={yr} style={{ background: 'var(--bg-secondary)' }}>{yr}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Month:</span>
            <input type="month" value={selectedMonth} onChange={e => { setSelectedMonth(e.target.value); if (e.target.value.length >= 4) setSelectedYear(e.target.value.slice(0, 4)); }} style={selectStyle} />
          </div>
        )}

        {/* Include Personal Logs Toggle */}
        <button
          type="button"
          onClick={() => setIncludePersonal(prev => !prev)}
          style={{ background: includePersonal ? 'rgba(16, 185, 129, 0.14)' : 'var(--bg-secondary)', color: includePersonal ? '#10b981' : 'var(--text-secondary)', border: `1px solid ${includePersonal ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-color)'}`, padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <CheckCircle2 size={15} /> {includePersonal ? 'Personal Logs: Included' : 'Personal Logs: Excluded'}
        </button>

        {/* Excel Export */}
        <button
          type="button"
          onClick={handleExportExcel}
          className="hover-lift"
          style={{ background: '#10B981', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', marginLeft: 'auto' }}
        >
          <FileSpreadsheet size={16} /> {viewMode === 'yearly' ? `Export Annual (${selectedYear}) .xlsx` : `Export Month (${selectedMonth}) .xlsx`}
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>{viewMode === 'yearly' ? `Total Yearly Hours (${selectedYear})` : `Month Hours (${selectedMonth})`}</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{viewMode === 'yearly' ? yearlySummary.totalHours : monthlyTotalHours} hrs</span>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            <span style={{ color: '#10b981', fontWeight: 600 }}>{viewMode === 'yearly' ? yearlySummary.approvedHours : monthlyApprovedHours}h Approved</span> • <span style={{ color: '#f59e0b', fontWeight: 600 }}>{viewMode === 'yearly' ? yearlySummary.pendingHours : monthlyPendingHours}h Pending</span>
          </span>
        </div>
        <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>Tasks Completed</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>{yearlySummary.completedTasksCount}</span>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Assigned done tasks in {selectedYear}</span>
        </div>
        <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>Avg Hours / Workday</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-info)' }}>{viewMode === 'yearly' ? yearlySummary.avgHoursPerActiveDay : monthlyAvgHours} hrs</span>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Over {viewMode === 'yearly' ? yearlySummary.activeDaysCount : monthlyUniqueDates.length} active days</span>
        </div>
        <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>Longest Work Streak</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-warning)' }}>{viewMode === 'yearly' ? yearlySummary.longestStreakDays : monthlyStreak} Days</span>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Consecutive logged days</span>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'yearly' ? (
        <>
          <PersonalYearlyCharts selectedYear={selectedYear} summary={yearlySummary} onDrillDownMonth={handleDrillDownMonth} />
          <PersonalYearlyTables selectedYear={selectedYear} userName={userName} summary={yearlySummary} onDrillDownMonth={handleDrillDownMonth} />
        </>
      ) : (
        <PersonalMonthlyView
          selectedMonth={selectedMonth}
          userName={userName}
          entries={monthlyEntries}
          projects={projects}
          tasks={tasks}
          onBackToYearly={() => setViewMode('yearly')}
          onExportMonthlyExcel={handleExportExcel}
        />
      )}
    </div>
  );
};
