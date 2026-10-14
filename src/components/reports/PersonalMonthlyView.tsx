import { Clock, TrendingUp, Activity, Calendar as CalendarIcon, FileSpreadsheet, ArrowLeft } from 'lucide-react';
import type { Project, Task, TimesheetEntry } from '../../types';
import { formatToDDMMYYYY } from '../../utils';
import { calculateTimePattern } from '../../utils/personalYearlyMetrics';

interface PersonalMonthlyViewProps {
  selectedMonth: string;
  userName: string;
  entries: TimesheetEntry[];
  projects: Project[];
  tasks: Task[];
  onBackToYearly: () => void;
  onExportMonthlyExcel: () => void;
}

const STATUS_COLOR: Record<string, string> = {
  Draft: 'rgba(107,114,128,0.7)',
  Pending: 'rgba(245,158,11,0.8)',
  Approved: 'rgba(16,185,129,0.8)',
  Rejected: 'rgba(239,68,68,0.8)',
};

export const PersonalMonthlyView = ({
  selectedMonth,
  userName,
  entries,
  projects,
  tasks,
  onBackToYearly,
  onExportMonthlyExcel,
}: PersonalMonthlyViewProps) => {
  const [yearStr, monthStr] = selectedMonth.split('-');
  const daysCount = new Date(Number(yearStr), Number(monthStr), 0).getDate();
  const daysArray = Array.from({ length: daysCount }, (_, i) => i + 1);
  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  const uniqueDays = Array.from(new Set(entries.map(e => e.date.slice(0, 10))));
  const timePattern = calculateTimePattern(entries);

  const projectDistribution = (() => {
    const map = new Map<string, { name: string; hours: number }>();
    entries.forEach(ts => {
      const key = ts.isPersonal ? 'personal' : ts.projectId || 'unassigned';
      const name = ts.isPersonal ? 'Personal Work / Self-Task' : projects.find(p => p.id === ts.projectId)?.name || ts.projectId || 'General';
      const cur = map.get(key) || { name, hours: 0 };
      cur.hours += ts.hours;
      map.set(key, cur);
    });
    return Array.from(map.values())
      .map(p => ({ ...p, percentage: totalHours > 0 ? Math.round((p.hours / totalHours) * 100) : 0 }))
      .sort((a, b) => b.hours - a.hours);
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Daily Hours Visual Bar Chart */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Clock size={18} color="var(--accent-primary)" /> Daily Logged Time Allocation ({selectedMonth})
          </h3>
          <button
            type="button"
            onClick={onBackToYearly}
            className="no-print"
            style={{ background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-primary)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <ArrowLeft size={14} /> Back to Yearly Overview ({yearStr})
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', height: '180px', gap: '0.25rem', background: 'var(--bg-tertiary)', padding: '1.5rem 1rem 0.5rem 1rem', borderRadius: 'var(--radius-md)', overflowX: 'auto', border: '1px solid var(--border-color)' }}>
          {daysArray.map(day => {
            const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
            const dayOfWeek = new Date(Number(yearStr), Number(monthStr) - 1, day).getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const dayHours = entries.filter(ts => ts.date.startsWith(dateStr)).reduce((s, ts) => s + ts.hours, 0);
            const barHeight = Math.min(100, Math.round((dayHours / 12) * 100));

            return (
              <div key={day} className="chart-bar-hover" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', height: '100%', justifyContent: 'flex-end', position: 'relative', minWidth: '22px' }}>
                <div
                  title={dayHours > 0 ? `${dayHours} hrs (${dateStr})` : dateStr}
                  style={{ height: `${barHeight}%`, width: '100%', background: dayHours > 0 ? (isWeekend ? '#ef4444' : 'var(--accent-primary)') : isWeekend ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.02)', borderRadius: '3px 3px 0 0' }}
                />
                <span style={{ fontSize: '0.65rem', color: isWeekend ? '#ef4444' : dayHours > 0 ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: isWeekend ? 700 : 400 }}>
                  {day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Allocation & Work Habit Pattern */}
      <div className="reports-row" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} /> Projects Duration Allocation ({selectedMonth})
          </h3>
          {projectDistribution.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No hours logged in this month.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {projectDistribution.map(proj => (
                <div key={proj.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
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

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} /> Work Habit Pattern ({selectedMonth})
          </h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.25rem', background: 'var(--bg-tertiary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Average Active Shift</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-info)' }}>{timePattern}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Unique Active Days</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>{uniqueDays.length} Days / {daysCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Timesheet Detail Table */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <CalendarIcon size={18} color="var(--accent-primary)" /> Daily Timesheet Log ({selectedMonth})
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem', marginBottom: 0 }}>Detailed daily work entries for {userName}.</p>
          </div>
          <button type="button" onClick={onExportMonthlyExcel} className="hover-lift no-print" style={{ background: '#10B981', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}>
            <FileSpreadsheet size={15} /> Export Month (.xlsx)
          </button>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: '450px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 10 }}>
                {['Date', 'Project', 'Task', 'Time', 'Hours', 'Work Description', 'Status'].map(h => (
                  <th key={h} style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No timesheet entries recorded in {selectedMonth}.</td>
                </tr>
              ) : (
                [...entries].sort((a, b) => b.date.localeCompare(a.date)).map((ts, idx) => {
                  const projName = ts.isPersonal ? 'Personal Work' : projects.find(p => p.id === ts.projectId)?.name || ts.projectId || 'General';
                  const taskTitle = tasks.find(t => t.id === ts.taskId)?.title || '-';
                  return (
                    <tr key={ts.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                      <td style={{ padding: '0.5rem 0.75rem', whiteSpace: 'nowrap', fontWeight: 500 }}>{formatToDDMMYYYY(ts.date)}</td>
                      <td style={{ padding: '0.5rem 0.75rem', whiteSpace: 'nowrap' }}>
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(99,102,241,0.1)', color: 'var(--accent-primary)', fontSize: '0.78rem', fontWeight: 500 }}>{projName}</span>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{taskTitle}</td>
                      <td style={{ padding: '0.5rem 0.75rem', whiteSpace: 'nowrap', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{ts.startTime && ts.endTime ? `${ts.startTime} - ${ts.endTime}` : '-'}</td>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: 'var(--accent-info)' }}>{ts.hours}h</td>
                      <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ts.description}>{ts.description || '—'}</td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '0.15rem 0.45rem', borderRadius: '999px', background: STATUS_COLOR[ts.status] || 'rgba(107,114,128,0.7)', color: 'white' }}>{ts.status}</span>
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
  );
};
