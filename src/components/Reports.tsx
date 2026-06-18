import { useState } from 'react';
import { BarChart3, TrendingUp, Download, Printer, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Briefcase, Clock, Activity } from 'lucide-react';
import type { User, Project, TimesheetEntry, Task, CostRate } from '../types';

interface ReportsProps {
  timesheets: TimesheetEntry[];
  projects: Project[];
  users: User[];
  currentUser: User | null;
  tasks: Task[];
  costRates: CostRate[];
}

export const Reports = ({ timesheets, projects, users, currentUser, tasks, costRates }: ReportsProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'personal' | 'project_cost'>('overview');
  
  // Common states
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Selected Month (for Personal and Project dashboards)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  const isAdmin = currentUser?.globalRole === 'Admin' || currentUser?.globalRole === 'Manager';
  
  // Filter timesheets to only show the user's own if they are not Admin/Manager
  const visibleTimesheets = isAdmin
    ? timesheets
    : timesheets.filter(ts => ts.userId === currentUser?.id);

  // Default to the month of the latest timesheet entry, or June 2026
  const [calendarDate, setCalendarDate] = useState<Date>(() => {
    if (visibleTimesheets.length > 0) {
      const dates = visibleTimesheets.map(t => new Date(t.date));
      const latestDate = new Date(Math.max(...dates.map(d => d.getTime())));
      if (!isNaN(latestDate.getTime())) {
        return new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
      }
    }
    return new Date(2026, 5, 1);
  });

  const prevMonth = () => setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const nextMonth = () => setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const getCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ dateStr: string | null; dayNum: number | null }> = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push({ dateStr: null, dayNum: null });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ dateStr, dayNum: day });
    }

    while (cells.length % 7 !== 0) {
      cells.push({ dateStr: null, dayNum: null });
    }

    return cells;
  };

  // ── Helper to calculate timesheet entry cost ──
  const getEntryCost = (entry: TimesheetEntry) => {
    const proj = projects.find(p => p.id === entry.projectId);
    if (!proj) return entry.hours * 812.5; // fallback
    const member = proj.members?.find(m => m.userId === entry.userId);
    const role = member ? member.role : '';
    const rate = costRates.find(r => r.roleName.toLowerCase() === role.toLowerCase());
    const ratePerHour = rate ? rate.ratePerHour : 812.5; // Default fallback to 6,500/day = 812.5/hr
    return entry.hours * ratePerHour;
  };

  // ── Calculations for OVERVIEW Tab ──
  const filteredTimesheets = visibleTimesheets.filter(ts => {
    if (selectedProject !== 'all' && ts.projectId !== selectedProject) return false;
    if (selectedUser !== 'all' && ts.userId !== selectedUser) return false;
    if (startDate && ts.date < startDate) return false;
    if (endDate && ts.date > endDate) return false;
    return true;
  });

  const totalHours = filteredTimesheets.reduce((sum, entry) => sum + entry.hours, 0);
  const approvedHours = filteredTimesheets
    .filter(ts => ts.status === 'Approved')
    .reduce((sum, ts) => sum + ts.hours, 0);

  const utilizationPct = totalHours > 0 ? Math.round((approvedHours / totalHours) * 100) : 0;

  const totalAllHours = visibleTimesheets.reduce((s, t) => s + t.hours, 0);
  const projectStats = projects.map(project => {
    const hours = filteredTimesheets
      .filter(ts => ts.projectId === project.id)
      .reduce((sum, ts) => sum + ts.hours, 0);
    return {
      name: project.name,
      hours,
      percentage: totalAllHours > 0 ? Math.round((hours / totalAllHours) * 100) : 0,
    };
  }).filter(p => p.hours > 0);

  const employeeStats = users.map(user => {
    const hours = filteredTimesheets
      .filter(ts => ts.userId === user.id)
      .reduce((sum, ts) => sum + ts.hours, 0);
    return { ...user, hours };
  }).filter(e => e.hours > 0);

  // ── Calculations for PERSONAL Tab ──
  const activePersonalUser = selectedUser === 'all' ? (currentUser?.id || '') : selectedUser;
  const personalTimesheets = timesheets.filter(ts => {
    return ts.userId === activePersonalUser && ts.date.slice(0, 7) === selectedMonth;
  });

  const personalTotalHours = personalTimesheets.reduce((sum, e) => sum + e.hours, 0);
  const personalTasks = tasks.filter(t => t.assigneeId === activePersonalUser);
  const personalCompletedTasksCount = personalTasks.filter(t => t.status.toLowerCase() === 'done' || t.status.toLowerCase() === 'completed').length;
  
  // Avg hours / logged day
  const uniqueLoggedDays = Array.from(new Set(personalTimesheets.map(t => t.date)));
  const personalAvgHours = uniqueLoggedDays.length > 0 ? (personalTotalHours / uniqueLoggedDays.length).toFixed(1) : '0';

  // Longest streak in selected month
  const getPersonalStreak = () => {
    if (uniqueLoggedDays.length === 0) return 0;
    const sortedDates = uniqueLoggedDays.map(d => new Date(d).getTime()).sort((a, b) => a - b);
    let maxStreak = 0;
    let currentStreak = 0;
    let prevTime = 0;

    for (const time of sortedDates) {
      if (prevTime === 0) {
        currentStreak = 1;
      } else {
        const diffDays = (time - prevTime) / (1000 * 60 * 60 * 24);
        if (diffDays <= 1.1) { // consecutive days (allowing slight DST variance)
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
  const personalStreak = getPersonalStreak();

  // Project distribution for Personal user
  const personalProjectDistribution = projects.map(proj => {
    const hours = personalTimesheets.filter(ts => ts.projectId === proj.id).reduce((sum, ts) => sum + ts.hours, 0);
    return {
      name: proj.name,
      hours,
      percentage: personalTotalHours > 0 ? Math.round((hours / personalTotalHours) * 100) : 0
    };
  }).filter(p => p.hours > 0).sort((a, b) => b.hours - a.hours);

  // Time pattern (Avg start / end)
  const getPersonalTimePattern = () => {
    const timedEntries = personalTimesheets.filter(ts => ts.startTime && ts.endTime);
    if (timedEntries.length === 0) return 'No time data';
    let startMinSum = 0;
    let endMinSum = 0;
    timedEntries.forEach(entry => {
      const [sh, sm] = entry.startTime!.split(':').map(Number);
      const [eh, em] = entry.endTime!.split(':').map(Number);
      startMinSum += sh * 60 + sm;
      endMinSum += eh * 60 + em;
    });
    const avgStart = startMinSum / timedEntries.length;
    const avgEnd = endMinSum / timedEntries.length;

    const formatMin = (m: number) => {
      const hStr = String(Math.floor(m / 60)).padStart(2, '0');
      const mStr = String(Math.round(m % 60)).padStart(2, '0');
      return `${hStr}:${mStr}`;
    };
    return `${formatMin(avgStart)} - ${formatMin(avgEnd)}`;
  };
  const personalTimePattern = getPersonalTimePattern();

  // Daily hours bar chart data
  const getDaysInMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  };
  const daysInMonthArray = Array.from({ length: getDaysInMonth(selectedMonth) }, (_, i) => i + 1);

  // ── Calculations for PROJECT COST Tab ──
  const activeProjectId = selectedProject === 'all' ? (projects[0]?.id || '') : selectedProject;
  const activeProject = projects.find(p => p.id === activeProjectId);
  const projectTimesheets = timesheets.filter(ts => {
    return ts.projectId === activeProjectId && ts.date.slice(0, 7) === selectedMonth;
  });

  const projectTotalHours = projectTimesheets.reduce((sum, ts) => sum + ts.hours, 0);
  const projectTotalCost = projectTimesheets.reduce((sum, ts) => sum + getEntryCost(ts), 0);
  const projectBudget = activeProject?.budget || 0;
  const projectBurnRate = projectBudget > 0 ? Math.round((projectTotalCost / projectBudget) * 100) : 0;

  // Sprint breakdown for the project
  const projectSprints = tasks
    .filter(t => t.projectId === activeProjectId && t.sprintId)
    .reduce((acc: Record<string, { name: string; hours: number; cost: number }>, task) => {
      const tsForTask = timesheets.filter(ts => ts.taskId === task.id);
      const hours = tsForTask.reduce((sum, ts) => sum + ts.hours, 0);
      const cost = tsForTask.reduce((sum, ts) => sum + getEntryCost(ts), 0);
      
      if (hours > 0) {
        if (!acc[task.sprintId!]) {
          acc[task.sprintId!] = { name: `Sprint ${task.sprintId}`, hours: 0, cost: 0 };
        }
        acc[task.sprintId!].hours += hours;
        acc[task.sprintId!].cost += cost;
      }
      return acc;
    }, {});

  // ── Export CSV ──
  const exportCSV = () => {
    const headers = ['Date', 'User', 'Project', 'Hours', 'Cost (THB)', 'Description', 'Status'];
    const rows = filteredTimesheets.map(ts => [
      ts.date,
      users.find(u => u.id === ts.userId)?.name || '',
      projects.find(p => p.id === ts.projectId)?.name || '',
      ts.hours,
      getEntryCost(ts).toFixed(2),
      `"${(ts.description || '').replace(/"/g, '""')}"`,
      ts.status,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheet-cost-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Export PDF (print) ──
  const exportPDF = () => {
    window.print();
  };

  const inputStyle: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    borderRadius: '0.375rem',
    padding: '0.35rem 0.6rem',
    fontSize: '0.8rem',
    outline: 'none',
    cursor: 'pointer',
  };

  const selectStyle: React.CSSProperties = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    borderRadius: '0.375rem',
    padding: '0.35rem 0.6rem',
    fontSize: '0.8rem',
    outline: 'none',
    cursor: 'pointer',
  };

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .glass-panel { background: white !important; border: 1px solid #ccc !important; box-shadow: none !important; }
          .reports-row { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 1024px) {
          .reports-lower-grid { grid-template-columns: 1fr !important; }
          .grid-3col { grid-template-columns: 1fr !important; }
        }
        .calendar-cell-active {
          background: rgba(255, 255, 255, 0.015);
          border: 1px solid rgba(255, 255, 255, 0.04);
          transition: all 0.15s ease;
        }
        .calendar-cell-active:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(99, 102, 241, 0.4);
        }
        .chart-bar-hover:hover .chart-tooltip {
          display: block !important;
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* ── Header ── */}
        <div className="flex-between">
          <div>
            <h1 className="text-gradient" style={{ marginBottom: '0.5rem' }}>HR &amp; Cost Reports</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Analytical dashboards detailing work allocation, personal metrics, and project financial effort.</p>
          </div>
          <div className="no-print" style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              style={{
                background: 'var(--accent-secondary)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
              }}
              className="hover-lift"
              onClick={exportCSV}
            >
              <Download size={16} /> Export CSV
            </button>
            <button
              style={{
                background: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
              }}
              className="hover-lift"
              onClick={exportPDF}
            >
              <Printer size={16} /> Export PDF
            </button>
          </div>
        </div>

        {/* ── Tabs Restructure ── */}
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }} className="no-print">
          <button 
            onClick={() => setActiveTab('overview')}
            style={{
              background: 'transparent',
              border: 'none',
              color: activeTab === 'overview' ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'overview' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontWeight: activeTab === 'overview' ? 600 : 400
            }}
          >
            📊 Overview
          </button>
          <button 
            onClick={() => setActiveTab('personal')}
            style={{
              background: 'transparent',
              border: 'none',
              color: activeTab === 'personal' ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'personal' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontWeight: activeTab === 'personal' ? 600 : 400
            }}
          >
            👤 Personal Performance
          </button>
          <button 
            onClick={() => setActiveTab('project_cost')}
            style={{
              background: 'transparent',
              border: 'none',
              color: activeTab === 'project_cost' ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'project_cost' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontWeight: activeTab === 'project_cost' ? 600 : 400
            }}
          >
            📁 Project Cost
          </button>
        </div>

        {/* ── TAB CONTENT: 📊 OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Filters */}
            <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <div className="glass-panel" style={{ padding: '0.25rem', display: 'flex', gap: '0.25rem' }}>
                {(['daily', 'monthly', 'yearly'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setReportType(type)}
                    style={{
                      background: reportType === type ? 'var(--bg-tertiary)' : 'transparent',
                      color: reportType === type ? 'var(--text-primary)' : 'var(--text-secondary)',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontWeight: 500,
                      textTransform: 'capitalize',
                      transition: 'all var(--transition-fast)',
                      fontSize: '0.85rem',
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="glass-panel" style={{ padding: '0.25rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Project:</span>
                <select
                  value={selectedProject}
                  onChange={e => setSelectedProject(e.target.value)}
                  style={{ ...selectStyle, border: 'none', background: 'transparent' }}
                >
                  <option value="all" style={{ background: 'var(--bg-secondary)' }}>All Projects</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id} style={{ background: 'var(--bg-secondary)' }}>{p.name}</option>
                  ))}
                </select>
              </div>

              {isAdmin && (
                <div className="glass-panel" style={{ padding: '0.25rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>User:</span>
                  <select
                    value={selectedUser}
                    onChange={e => setSelectedUser(e.target.value)}
                    style={{ ...selectStyle, border: 'none', background: 'transparent' }}
                  >
                    <option value="all" style={{ background: 'var(--bg-secondary)' }}>All Users</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id} style={{ background: 'var(--bg-secondary)' }}>{u.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="glass-panel" style={{ padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  style={inputStyle}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  style={inputStyle}
                />
                {(startDate || endDate) && (
                  <button
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.8rem', padding: '0 0.25rem' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="glass-panel" style={{ padding: '0.75rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>Total Logged Hours</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{totalHours}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>hrs ({filteredTimesheets.length} entries)</span>
                </div>
              </div>
              <div className="glass-panel" style={{ padding: '0.75rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>Approved Hours</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>{approvedHours}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>hrs / {totalHours} total</span>
                </div>
              </div>
              <div className="glass-panel" style={{ padding: '0.75rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>Approval Rate</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{utilizationPct}%</span>
                  <div style={{ flex: 1, height: '4px', background: 'var(--bg-tertiary)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${utilizationPct}%`, background: 'var(--accent-primary)', borderRadius: '999px', transition: 'width 0.4s' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Graphics */}
            <div className="reports-row" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart3 size={18} /> Time Allocation by Project
                </h3>
                {projectStats.length === 0 ? (
                  <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>No data for current filter</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {projectStats.map(proj => (
                      <div key={proj.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div className="flex-between" style={{ fontSize: '0.875rem' }}>
                          <span style={{ fontWeight: 500 }}>{proj.name}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{proj.hours} hrs ({proj.percentage}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${proj.percentage}%`, background: 'var(--accent-primary)', borderRadius: 'var(--radius-full)', transition: 'width 0.4s' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={18} /> Resource Hours Summary
                </h3>
                {employeeStats.length === 0 ? (
                  <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>No data for current filter</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {employeeStats.map(emp => (
                      <div key={emp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img src={emp.avatar} alt={emp.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                          <div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{emp.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{emp.department}</div>
                          </div>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '0.925rem' }}>{emp.hours} hrs</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Calendar & Details Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '1.125rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CalendarIcon size={18} color="var(--accent-primary)" />
                    Timesheet Calendar
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button type="button" onClick={prevMonth} className="hover-lift" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-primary)', padding: '0.3rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <ChevronLeft size={16} />
                    </button>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, minWidth: '100px', textAlign: 'center' }}>
                      {(() => {
                        const monthNames = [
                          'January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'
                        ];
                        return `${monthNames[calendarDate.getMonth()]} ${calendarDate.getFullYear()}`;
                      })()}
                    </span>
                    <button type="button" onClick={nextMonth} className="hover-lift" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-primary)', padding: '0.3rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', textAlign: 'center', marginBottom: '0.25rem' }}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <span key={d} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{d}</span>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem' }}>
                    {getCalendarDays().map((cell, idx) => {
                      const dayEntries = cell.dateStr ? filteredTimesheets.filter(ts => ts.date === cell.dateStr) : [];
                      const dailyTotal = dayEntries.reduce((sum, e) => sum + e.hours, 0);

                      return (
                        <div 
                          key={idx} 
                          className={cell.dayNum ? "calendar-cell-active" : ""}
                          style={{ 
                            minHeight: '85px', 
                            borderRadius: 'var(--radius-sm)', 
                            padding: '0.35rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-start',
                            background: cell.dayNum ? undefined : 'rgba(255,255,255,0.005)',
                            border: cell.dayNum ? undefined : '1px solid transparent'
                          }}
                        >
                          {cell.dayNum && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: dailyTotal > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                {cell.dayNum}
                              </span>
                              {dailyTotal > 0 && (
                                <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.25rem', background: 'rgba(99, 102, 241, 0.15)', color: 'rgba(129, 140, 248, 1)', borderRadius: '3px', fontWeight: 700 }}>
                                  {dailyTotal}h
                                </span>
                              )}
                            </div>
                          )}
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto', flex: 1, maxHeight: '55px' }}>
                            {dayEntries.map(entry => {
                              const proj = projects.find(p => p.id === entry.projectId);
                              const projName = proj ? proj.name : 'Unknown';
                              const user = users.find(u => u.id === entry.userId);
                              const userName = user ? user.name.split(' ')[0] : 'Unknown';
                              const displayLabel = `${isAdmin && selectedUser === 'all' ? `${userName}: ` : ''}${entry.description || projName}`;

                              const statusBg: Record<string, string> = {
                                Draft: 'rgba(107, 114, 128, 0.1)',
                                Pending: 'rgba(245, 158, 11, 0.1)',
                                Approved: 'rgba(16, 185, 129, 0.1)',
                                Rejected: 'rgba(239, 68, 68, 0.1)',
                              };
                              const statusBorder: Record<string, string> = {
                                Draft: 'rgba(107, 114, 128, 0.3)',
                                Pending: 'rgba(245, 158, 11, 0.4)',
                                Approved: 'rgba(16, 185, 129, 0.4)',
                                Rejected: 'rgba(239, 68, 68, 0.4)',
                              };
                              const statusColor: Record<string, string> = {
                                Draft: 'rgba(156, 163, 175, 1)',
                                Pending: 'rgba(251, 191, 36, 1)',
                                Approved: 'rgba(52, 211, 153, 1)',
                                Rejected: 'rgba(248, 113, 113, 1)',
                              };

                              return (
                                <div 
                                  key={entry.id}
                                  style={{
                                    fontSize: '0.62rem',
                                    padding: '0.15rem 0.25rem',
                                    borderRadius: '3px',
                                    background: statusBg[entry.status],
                                    borderLeft: `2.5px solid ${statusColor[entry.status]}`,
                                    borderRight: `1px solid ${statusBorder[entry.status]}`,
                                    borderTop: `1px solid ${statusBorder[entry.status]}`,
                                    borderBottom: `1px solid ${statusBorder[entry.status]}`,
                                    color: 'var(--text-primary)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    cursor: 'default'
                                  }}
                                  title={`${userName} - ${projName}: ${entry.hours}h - ${entry.description} (${entry.status})`}
                                >
                                  {displayLabel}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '1.125rem', margin: 0 }}>Timesheet Details</h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    {filteredTimesheets.slice(0, 50).length} of {filteredTimesheets.length} entries
                  </span>
                </div>

                <div style={{ overflowX: 'auto', maxHeight: '380px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 10 }}>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Date</th>
                        {isAdmin && (
                          <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>User</th>
                        )}
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Project</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Hours</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Description</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTimesheets.length === 0 ? (
                        <tr>
                          <td colSpan={isAdmin ? 6 : 5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No timesheet entries match the current filters.
                          </td>
                        </tr>
                      ) : (
                        filteredTimesheets.slice(0, 50).map((ts, idx) => {
                          const user = users.find(u => u.id === ts.userId);
                          const project = projects.find(p => p.id === ts.projectId);
                          const statusColor: Record<string, string> = {
                            Draft: 'rgba(107,114,128,0.7)',
                            Pending: 'rgba(245,158,11,0.8)',
                            Approved: 'rgba(16,185,129,0.8)',
                            Rejected: 'rgba(239,68,68,0.8)',
                          };
                          return (
                            <tr
                              key={ts.id}
                              style={{
                                borderBottom: '1px solid rgba(255,255,255,0.03)',
                                background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                              }}
                            >
                              <td style={{ padding: '0.45rem 0.75rem', whiteSpace: 'nowrap' }}>{ts.date}</td>
                              {isAdmin && (
                                <td style={{ padding: '0.45rem 0.75rem', whiteSpace: 'nowrap' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    {user?.avatar && (
                                      <img src={user.avatar} alt={user.name} style={{ width: '18px', height: '18px', borderRadius: '50%' }} />
                                    )}
                                    <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={user?.name}>{user?.name || ts.userId}</span>
                                  </div>
                                </td>
                              )}
                              <td style={{ padding: '0.45rem 0.75rem', whiteSpace: 'nowrap', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={project?.name || ts.projectId}>
                                {project?.name || ts.projectId}
                              </td>
                              <td style={{ padding: '0.45rem 0.75rem', fontWeight: 600 }}>{ts.hours}h</td>
                              <td style={{ padding: '0.45rem 0.75rem', color: 'var(--text-secondary)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ts.description}>
                                {ts.description || '—'}
                              </td>
                              <td style={{ padding: '0.45rem 0.75rem' }}>
                                <span style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 600,
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '999px',
                                  background: statusColor[ts.status] || 'rgba(107,114,128,0.7)',
                                  color: 'white',
                                }}>
                                  {ts.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB CONTENT: 👤 PERSONAL PERFORMANCE ── */}
        {activeTab === 'personal' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Filters */}
            <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              {isAdmin && (
                <div className="glass-panel" style={{ padding: '0.25rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Employee:</span>
                  <select
                    value={selectedUser}
                    onChange={e => setSelectedUser(e.target.value)}
                    style={{ ...selectStyle, border: 'none', background: 'transparent' }}
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id} style={{ background: 'var(--bg-secondary)' }}>{u.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="glass-panel" style={{ padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Month:</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>Month Hours</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{personalTotalHours} hrs</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Logged in {selectedMonth}</span>
              </div>
              <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>Tasks Completed</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>{personalCompletedTasksCount}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total assigned done tasks</span>
              </div>
              <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>Avg Hours / Workday</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-info)' }}>{personalAvgHours} hrs</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Over {uniqueLoggedDays.length} active days</span>
              </div>
              <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>Work Streak</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-warning)' }}>{personalStreak} Days</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Longest consecutive streak</span>
              </div>
            </div>

            {/* Daily Hours Visual Bar Chart */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} color="var(--accent-primary)" /> Daily Logged Time Allocation ({selectedMonth})
              </h3>
              
              <div style={{ display: 'flex', alignItems: 'flex-end', height: '180px', gap: '0.25rem', background: 'var(--bg-tertiary)', padding: '1.5rem 1rem 0.5rem 1rem', borderRadius: 'var(--radius-md)', overflowX: 'auto', border: '1px solid var(--border-color)', position: 'relative' }}>
                {/* Horizontal reference lines */}
                <div style={{ position: 'absolute', left: 0, right: 0, top: '25%', borderBottom: '1px dashed rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', borderBottom: '1px dashed rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', left: 0, right: 0, top: '75%', borderBottom: '1px dashed rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
                
                {daysInMonthArray.map(day => {
                  const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
                  const dayHours = personalTimesheets.filter(ts => ts.date === dateStr).reduce((s, ts) => s + ts.hours, 0);
                  const barHeight = Math.min(100, Math.round((dayHours / 12) * 100)); // reference 12 hours max
                  
                  return (
                    <div 
                      key={day} 
                      className="chart-bar-hover"
                      style={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        height: '100%', 
                        justifyContent: 'flex-end',
                        position: 'relative',
                        minWidth: '22px'
                      }}
                    >
                      {/* Bar */}
                      <div style={{
                        height: `${barHeight}%`,
                        width: '100%',
                        background: dayHours > 0 ? 'var(--accent-primary)' : 'rgba(255,255,255,0.02)',
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.3s ease',
                        cursor: 'pointer',
                        boxShadow: dayHours > 0 ? '0 0 10px rgba(124, 58, 237, 0.2)' : 'none'
                      }} />
                      {/* Day Label */}
                      <span style={{ fontSize: '0.65rem', color: dayHours > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>{day}</span>
                      
                      {/* Tooltip */}
                      {dayHours > 0 && (
                        <div 
                          className="chart-tooltip"
                          style={{
                            display: 'none',
                            position: 'absolute',
                            bottom: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            zIndex: 10,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                          }}
                        >
                          {dayHours} hrs ({dateStr})
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Allocation & Start/End time pattern */}
            <div className="reports-row" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
              {/* Project distribution */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={18} /> Projects Duration Allocation
                </h3>
                
                {personalProjectDistribution.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                    No hours logged on any projects in this month.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {personalProjectDistribution.map(proj => (
                      <div key={proj.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div className="flex-between" style={{ fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 600 }}>{proj.name}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{proj.hours} hrs ({proj.percentage}%)</span>
                        </div>
                        <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${proj.percentage}%`, background: 'var(--accent-primary)', borderRadius: '999px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Time Pattern card */}
              <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={18} /> Work Habit Pattern
                </h3>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyItems: 'center', justifyContent: 'center', gap: '1.5rem', background: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Average Active Shift</span>
                    <span style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--accent-info)' }}>{personalTimePattern}</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Unique Active Days</span>
                    <span style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>{uniqueLoggedDays.length} Days / {daysInMonthArray.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB CONTENT: 📁 PROJECT COST ── */}
        {activeTab === 'project_cost' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Filters */}
            <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              <div className="glass-panel" style={{ padding: '0.25rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Project:</span>
                <select
                  value={selectedProject}
                  onChange={e => setSelectedProject(e.target.value)}
                  style={{ ...selectStyle, border: 'none', background: 'transparent' }}
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id} style={{ background: 'var(--bg-secondary)' }}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="glass-panel" style={{ padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Month:</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>Total Effort</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{projectTotalHours} hrs</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Logged in {selectedMonth}</span>
              </div>
              <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>Total Actual Cost</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>
                  ฿{projectTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Based on configured rates</span>
              </div>
              <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>Project Budget</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {projectBudget > 0 ? `฿${projectBudget.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Initial allocation</span>
              </div>
              <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>Budget Burn Rate</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: projectBurnRate > 90 ? 'var(--accent-danger)' : 'var(--text-primary)' }}>{projectBurnRate}%</span>
                  {projectBudget > 0 && (
                    <div style={{ flex: 1, height: '4px', background: 'var(--bg-tertiary)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, projectBurnRate)}%`, background: projectBurnRate > 90 ? 'var(--accent-danger)' : 'var(--accent-primary)', borderRadius: '999px' }} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Table: Cost Rate Config & Effort Estimation (Matching Screenshot) ── */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Briefcase size={18} color="var(--accent-primary)" /> Project Resource Costs &amp; Effort Configuration
              </h3>
              
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#2F75B5', borderBottom: '1px solid var(--border-color)', color: 'white' }}>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Resource Role</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center' }}>Effort Estimation (Man-day)</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Man-day Rate (THB)</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Cost Estimation (THB)</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center' }}>Actual Effort (Man-day)</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Actual Cost (THB)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let totalEstDays = 0;
                      let totalEstCost = 0;
                      let totalActDays = 0;
                      let totalActCost = 0;
                      let hasEstimates = false;

                      // Group project members by role and calculate
                      const rows = costRates.map(rate => {
                        // Find members in the project who have this project role
                        const membersInRole = activeProject?.members?.filter(m => m.role.toLowerCase() === rate.roleName.toLowerCase()) || [];
                        const memberUserIds = membersInRole.map(m => m.userId);

                        // Effort estimation from project tasks:
                        // Sum estimatedHours of tasks assigned to these members in this project
                        const tasksInRole = tasks.filter(t => t.projectId === activeProjectId && t.assigneeId && memberUserIds.includes(t.assigneeId));
                        const estHours = tasksInRole.reduce((s, t) => s + t.estimatedHours, 0);
                        const estDays = estHours > 0 ? (estHours / 8) : 0;
                        const estCost = estDays * rate.ratePerDay;

                        if (estDays > 0) {
                          totalEstDays += estDays;
                          totalEstCost += estCost;
                          hasEstimates = true;
                        }

                        // Actual logged timesheets effort:
                        const actHours = projectTimesheets.filter(ts => memberUserIds.includes(ts.userId)).reduce((s, ts) => s + ts.hours, 0);
                        const actDays = actHours / 8;
                        const actCost = actHours * rate.ratePerHour;

                        totalActDays += actDays;
                        totalActCost += actCost;

                        return (
                          <tr key={rate.id} style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)' }}>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: 'var(--text-primary)' }}>{rate.roleName}</td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{estDays > 0 ? estDays.toFixed(1) : 'TBD'}</td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{rate.ratePerDay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                              {estCost > 0 ? estCost.toLocaleString(undefined, { minimumFractionDigits: 2 }) : 'TBD'}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{actDays > 0 ? actDays.toFixed(2) : '0.00'}</td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: actCost > 0 ? 'var(--accent-secondary)' : 'inherit' }}>
                              ฿{actCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      });

                      return (
                        <>
                          {rows}
                          {/* Total Row */}
                          <tr style={{ background: 'rgba(47, 117, 181, 0.1)', fontWeight: 700, borderBottom: '2px solid #2F75B5', borderTop: '2px solid #2F75B5' }}>
                            <td style={{ padding: '0.85rem 1rem', textTransform: 'uppercase', color: 'var(--text-primary)' }}>Total</td>
                            <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>{hasEstimates ? totalEstDays.toFixed(1) : 'TBD'}</td>
                            <td style={{ padding: '0.85rem 1rem' }}></td>
                            <td style={{ padding: '0.85rem 1rem', textAlign: 'right', color: 'var(--text-primary)' }}>
                              {hasEstimates ? `฿${totalEstCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'TBD'}
                            </td>
                            <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>{totalActDays.toFixed(2)}</td>
                            <td style={{ padding: '0.85rem 1rem', textAlign: 'right', color: 'var(--accent-secondary)' }}>
                              ฿{totalActCost.toLocaleString(undefined, { minimumFractionDigits: 2 })} THB
                            </td>
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sprints Cost Breakdown & Task Detail Costs Grid */}
            <div className="reports-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem' }}>
              {/* Sprint Cost */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={18} /> Sprint Cost Allocation
                </h3>
                
                <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Sprint</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>Actual Hours</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Actual Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(projectSprints).length === 0 ? (
                        <tr>
                          <td colSpan={3} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No sprint time logged in this month.
                          </td>
                        </tr>
                      ) : (
                        Object.entries(projectSprints).map(([sprintId, sprint]) => (
                          <tr key={sprintId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>{sprint.name}</td>
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>{sprint.hours} hrs</td>
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 600 }}>
                              ฿{sprint.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Task Cost Details */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart3 size={18} /> Task Cost breakdown
                </h3>

                <div style={{ overflowX: 'auto', maxHeight: '280px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1 }}>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Task Title</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Assignee Role</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>Logged Hours</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const projectTasks = tasks.filter(t => t.projectId === activeProjectId);
                        const taskRows = projectTasks.map(task => {
                          const tsForTask = projectTimesheets.filter(ts => ts.taskId === task.id);
                          const hours = tsForTask.reduce((sum, ts) => sum + ts.hours, 0);
                          const cost = tsForTask.reduce((sum, ts) => sum + getEntryCost(ts), 0);

                          if (hours === 0) return null;

                          const assignee = users.find(u => u.id === task.assigneeId);
                          const member = activeProject?.members?.find(m => m.userId === task.assigneeId);
                          const roleName = member?.role || '—';

                          return (
                            <tr key={task.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500, color: 'var(--text-primary)' }} title={task.title}>
                                {task.title.length > 28 ? `${task.title.slice(0, 28)}...` : task.title}
                              </td>
                              <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>
                                {assignee ? `${assignee.name.split(' ')[0]} (${roleName})` : 'Unassigned'}
                              </td>
                              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>{hours} hrs</td>
                              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 600 }}>
                                ฿{cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        }).filter(Boolean);

                        if (taskRows.length === 0) {
                          return (
                            <tr>
                              <td colSpan={4} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No tasks with logged hours in this month.
                              </td>
                            </tr>
                          );
                        }
                        return taskRows;
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
