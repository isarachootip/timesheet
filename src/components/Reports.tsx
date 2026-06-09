import { useState } from 'react';
import { BarChart3, TrendingUp, Download } from 'lucide-react';
import type { User, Project, TimesheetEntry } from '../types';

interface ReportsProps {
  timesheets: TimesheetEntry[];
  projects: Project[];
  users: User[];
}

export const Reports = ({ timesheets, projects, users }: ReportsProps) => {
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [selectedProject, setSelectedProject] = useState<string>('all');

  const filteredTimesheets = selectedProject === 'all'
    ? timesheets
    : timesheets.filter(ts => ts.projectId === selectedProject);

  // Calculations
  const totalHours = filteredTimesheets.reduce((sum, entry) => sum + entry.hours, 0);
  const approvedHours = filteredTimesheets.filter(ts => ts.status === 'Approved').reduce((sum, ts) => sum + ts.hours, 0);
  
  // Calculate hours by project
  const projectStats = projects.map(project => {
    const hours = timesheets
      .filter(ts => ts.projectId === project.id)
      .reduce((sum, ts) => sum + ts.hours, 0);
    return {
      name: project.name,
      hours,
      percentage: totalHours > 0 ? Math.round((hours / totalHours) * 100) : 0
    };
  });

  // Calculate hours by employee
  const employeeStats = users.map(user => {
    const hours = filteredTimesheets
      .filter(ts => ts.userId === user.id)
      .reduce((sum, ts) => sum + ts.hours, 0);
    return {
      ...user,
      hours
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div className="flex-between">
        <div>
          <h1 className="text-gradient" style={{ marginBottom: '0.5rem' }}>HR & Project Reports</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Analytical reports on time distribution, utilization, and project progress.</p>
        </div>
        <button style={{ 
          background: 'var(--accent-primary)', 
          color: 'white', 
          border: 'none', 
          padding: '0.75rem 1.5rem', 
          borderRadius: 'var(--radius-md)', 
          fontWeight: 500, 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }} className="hover-lift" onClick={() => alert('Exporting report as CSV/Excel...')}>
          <Download size={18} /> Export Data
        </button>
      </div>

      {/* Toggle filters */}
      <div style={{ display: 'flex', gap: '1rem' }}>
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
                transition: 'all var(--transition-fast)'
              }}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="glass-panel" style={{ padding: '0.25rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Project:</span>
          <select 
            value={selectedProject} 
            onChange={(e) => setSelectedProject(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            <option value="all" style={{ background: 'var(--bg-secondary)' }}>All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id} style={{ background: 'var(--bg-secondary)' }}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Logged Hours</span>
          <div style={{ fontSize: '1.875rem', fontWeight: 700 }}>{totalHours} hrs</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Approved Hours</span>
          <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>{approvedHours} hrs</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Utilization Rate ({reportType})</span>
          <div style={{ fontSize: '1.875rem', fontWeight: 700 }}>82.5%</div>
        </div>
      </div>

      {/* Graphical Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
        
        {/* Project Breakdown Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={18} /> Time Allocation by Project
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {projectStats.map(proj => (
              <div key={proj.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="flex-between" style={{ fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: 500 }}>{proj.name}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{proj.hours} hrs ({proj.percentage}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${proj.percentage}%`, background: 'var(--accent-primary)', borderRadius: 'var(--radius-full)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Employee Performance/Contribution */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} /> Resource Hours Summary
          </h3>
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
                <div style={{ fontWeight: 600, fontSize: '0.925rem' }}>
                  {emp.hours} hrs
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
