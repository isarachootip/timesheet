import { useState } from 'react';
import { BarChart3, TrendingUp, Download, Printer, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import type { User, Project, TimesheetEntry } from '../types';

interface ReportsProps {
  timesheets: TimesheetEntry[];
  projects: Project[];
  users: User[];
  currentUser: User | null;
}

export const Reports = ({ timesheets, projects, users, currentUser }: ReportsProps) => {
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const isAdmin = currentUser?.globalRole === 'Admin';
  
  // Filter timesheets to only show the user's own if they are not Admin
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

  // ── Filtering ──
  const filteredTimesheets = visibleTimesheets.filter(ts => {
    if (selectedProject !== 'all' && ts.projectId !== selectedProject) return false;
    if (selectedUser !== 'all' && ts.userId !== selectedUser) return false;
    if (startDate && ts.date < startDate) return false;
    if (endDate && ts.date > endDate) return false;
    return true;
  });

  // ── Calculations ──
  const totalHours = filteredTimesheets.reduce((sum, entry) => sum + entry.hours, 0);
  const approvedHours = filteredTimesheets
    .filter(ts => ts.status === 'Approved')
    .reduce((sum, ts) => sum + ts.hours, 0);

  const utilizationPct = totalHours > 0 ? Math.round((approvedHours / totalHours) * 100) : 0;

  // Project stats (uses all visible timesheets for percentage reference, filtered for display)
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

  // Employee stats
  const employeeStats = users.map(user => {
    const hours = filteredTimesheets
      .filter(ts => ts.userId === user.id)
      .reduce((sum, ts) => sum + ts.hours, 0);
    return { ...user, hours };
  }).filter(e => e.hours > 0);

  // ── Export CSV ──
  const exportCSV = () => {
    const headers = ['Date', 'User', 'Project', 'Hours', 'Description', 'Status'];
    const rows = filteredTimesheets.map(ts => [
      ts.date,
      users.find(u => u.id === ts.userId)?.name || '',
      projects.find(p => p.id === ts.projectId)?.name || '',
      ts.hours,
      `"${(ts.description || '').replace(/"/g, '""')}"`,
      ts.status,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheet-${new Date().toISOString().split('T')[0]}.csv`;
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

  const displayedRows = filteredTimesheets.slice(0, 50);

  return (
    <>
      {/* Print and responsive styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .glass-panel { background: white !important; border: 1px solid #ccc !important; box-shadow: none !important; }
          .reports-row { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 1024px) {
          .reports-lower-grid { grid-template-columns: 1fr !important; }
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
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* ── Header ── */}
        <div className="flex-between">
          <div>
            <h1 className="text-gradient" style={{ marginBottom: '0.5rem' }}>HR &amp; Project Reports</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Analytical reports on time distribution, utilization, and project progress.</p>
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

        {/* ── Filters ── */}
        <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          {/* Period toggle */}
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

          {/* Project filter */}
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

          {/* User filter */}
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

          {/* Date range */}
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

        {/* ── KPI Row ── */}
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

        {/* ── Graphical Breakdown ── */}
        <div className="reports-row" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>

          {/* Project Breakdown */}
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

          {/* Employee Hours Summary */}
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

        {/* ── Lower Row: Calendar and Detail Table stacked vertically ── */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1.5rem'
        }}>
          {/* Monthly Timesheet Calendar */}
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

            {/* Calendar Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {/* Day Headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', textAlign: 'center', marginBottom: '0.25rem' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <span key={d} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{d}</span>
                ))}
              </div>

              {/* Day Grid Cells */}
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

          {/* Compact Timesheet Details Table */}
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.125rem', margin: 0 }}>Timesheet Details</h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                {displayedRows.length} of {filteredTimesheets.length} entries
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
                  {displayedRows.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No timesheet entries match the current filters.
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((ts, idx) => {
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
    </>
  );
};
