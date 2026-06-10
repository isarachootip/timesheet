import { useState } from 'react';
import { BarChart3, TrendingUp, Download, Printer } from 'lucide-react';
import type { User, Project, TimesheetEntry } from '../types';

interface ReportsProps {
  timesheets: TimesheetEntry[];
  projects: Project[];
  users: User[];
}

export const Reports = ({ timesheets, projects, users }: ReportsProps) => {
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // ── Filtering ──
  const filteredTimesheets = timesheets.filter(ts => {
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

  // Project stats (uses all timesheets for percentage reference, filtered for display)
  const totalAllHours = timesheets.reduce((s, t) => s + t.hours, 0);
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
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .glass-panel { background: white !important; border: 1px solid #ccc !important; box-shadow: none !important; }
          .reports-row { grid-template-columns: 1fr !important; }
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Logged Hours</span>
            <div style={{ fontSize: '1.875rem', fontWeight: 700 }}>{totalHours} hrs</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{filteredTimesheets.length} entries</div>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Approved Hours</span>
            <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>{approvedHours} hrs</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>out of {totalHours} total</div>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Approval Rate ({reportType})</span>
            <div style={{ fontSize: '1.875rem', fontWeight: 700 }}>{utilizationPct}%</div>
            <div style={{ width: '100%', height: '4px', background: 'var(--bg-tertiary)', borderRadius: '999px', overflow: 'hidden', marginTop: '0.25rem' }}>
              <div style={{ height: '100%', width: `${utilizationPct}%`, background: 'var(--accent-primary)', borderRadius: '999px', transition: 'width 0.4s' }} />
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

        {/* ── Timesheet Detail Table ── */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.125rem', margin: 0 }}>Timesheet Details</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Showing {displayedRows.length} of {filteredTimesheets.length} entries
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Date', 'User', 'Project', 'Hours', 'Description', 'Status'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
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
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                        }}
                      >
                        <td style={{ padding: '0.65rem 1rem', whiteSpace: 'nowrap' }}>{ts.date}</td>
                        <td style={{ padding: '0.65rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {user?.avatar && (
                              <img src={user.avatar} alt={user.name} style={{ width: '22px', height: '22px', borderRadius: '50%' }} />
                            )}
                            <span>{user?.name || ts.userId}</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.65rem 1rem' }}>{project?.name || ts.projectId}</td>
                        <td style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>{ts.hours}h</td>
                        <td style={{ padding: '0.65rem 1rem', color: 'var(--text-secondary)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ts.description || '—'}
                        </td>
                        <td style={{ padding: '0.65rem 1rem' }}>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.55rem',
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
    </>
  );
};
