import { useState } from 'react';
import { BarChart3, TrendingUp, Activity, MousePointerClick } from 'lucide-react';
import type { YearlyPersonalSummary } from '../../utils/personalYearlyMetrics';

interface PersonalYearlyChartsProps {
  selectedYear: string;
  summary: YearlyPersonalSummary;
  onDrillDownMonth: (monthKey: string) => void;
}

const PROJECT_COLORS = ['#6366f1', '#38bdf8', '#10b981', '#f59e0b', '#f472b6', '#a78bfa', '#fb7185', '#34d399'] as const;

export const PersonalYearlyCharts = ({ selectedYear, summary, onDrillDownMonth }: PersonalYearlyChartsProps) => {
  const [splitMode, setSplitMode] = useState<'status' | 'project'>('status');
  const maxMonthHours = Math.max(160, ...summary.monthlyBreakdown.map(m => m.totalHours));
  const wfhPct = summary.activeDaysCount > 0 ? Math.round((summary.wfhDaysCount / summary.activeDaysCount) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* 12-Month Interactive Bar Chart */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <BarChart3 size={18} color="var(--accent-primary)" /> 12-Month Work Allocation ({selectedYear})
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
              <MousePointerClick size={13} /> Click any month bar to drill down into daily timesheet details
            </span>
          </div>

          <div className="glass-panel no-print" style={{ padding: '0.2rem', display: 'flex', gap: '0.25rem' }}>
            {(['status', 'project'] as const).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setSplitMode(mode)}
                style={{
                  background: splitMode === mode ? 'var(--bg-tertiary)' : 'transparent',
                  color: splitMode === mode ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {mode === 'status' ? 'By Status (Approved / Pending)' : 'By Project'}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
          {splitMode === 'status' ? (
            <>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981', display: 'inline-block' }} />
                Approved ({summary.approvedHours}h)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#f59e0b', display: 'inline-block' }} />
                Pending ({summary.pendingHours}h)
              </span>
            </>
          ) : (
            summary.projectMatrixRows.map((p, idx) => (
              <span key={p.projectId} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: PROJECT_COLORS[idx % PROJECT_COLORS.length], display: 'inline-block' }} />
                {p.projectName} ({p.totalHours}h)
              </span>
            ))
          )}
        </div>

        {/* 12 Month Bars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(42px, 1fr))', alignItems: 'flex-end', height: '210px', gap: '0.6rem', background: 'var(--bg-tertiary)', padding: '1.75rem 1rem 0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
          {summary.monthlyBreakdown.map((m, mIdx) => {
            const totalHeightPct = m.totalHours > 0 ? Math.max(6, Math.min(100, Math.round((m.totalHours / maxMonthHours) * 100))) : 2;
            const approvedPct = m.totalHours > 0 ? (m.approvedHours / m.totalHours) * 100 : 0;
            const pendingPct = m.totalHours > 0 ? (m.pendingHours / m.totalHours) * 100 : 0;

            return (
              <div
                key={m.monthKey}
                onClick={() => onDrillDownMonth(m.monthKey)}
                title={`${m.monthLabel} ${selectedYear}: ${m.totalHours}h (Approved: ${m.approvedHours}h, Pending: ${m.pendingHours}h) — Click to view daily log`}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: '0.4rem', cursor: 'pointer' }}
              >
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: m.totalHours > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {m.totalHours > 0 ? `${m.totalHours}h` : ''}
                </span>
                <div style={{ height: `${totalHeightPct}%`, width: '100%', maxWidth: '44px', borderRadius: '4px 4px 0 0', overflow: 'hidden', display: 'flex', flexDirection: 'column-reverse', background: m.totalHours > 0 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)' }}>
                  {m.totalHours > 0 && splitMode === 'status' && (
                    <>
                      <div style={{ height: `${approvedPct}%`, background: '#10b981', width: '100%' }} />
                      <div style={{ height: `${pendingPct}%`, background: '#f59e0b', width: '100%' }} />
                    </>
                  )}
                  {m.totalHours > 0 && splitMode === 'project' && summary.projectMatrixRows.map((proj, pIdx) => {
                    const pHours = proj.monthlyHours[mIdx] || 0;
                    if (pHours <= 0) return null;
                    return <div key={proj.projectId} style={{ height: `${(pHours / m.totalHours) * 100}%`, background: PROJECT_COLORS[pIdx % PROJECT_COLORS.length], width: '100%' }} />;
                  })}
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: m.totalHours > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>{m.monthLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Annual Project Distribution & Work Habits */}
      <div className="reports-row" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} /> Annual Projects Allocation ({selectedYear})
          </h3>
          {summary.projectMatrixRows.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No hours logged in {selectedYear}.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {summary.projectMatrixRows.map((proj, idx) => (
                <div key={proj.projectId} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div className="flex-between" style={{ fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600 }}>{proj.projectName}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {proj.totalHours} hrs ({proj.percentage}%) • <span style={{ color: '#10b981' }}>{proj.approvedHours}h Approved</span>
                      {proj.pendingHours > 0 ? <span style={{ color: '#f59e0b' }}> / {proj.pendingHours}h Pending</span> : null}
                    </span>
                  </div>
                  <div style={{ height: '7px', background: 'var(--bg-tertiary)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${proj.percentage}%`, background: PROJECT_COLORS[idx % PROJECT_COLORS.length], borderRadius: '999px' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} /> Annual Work Habit &amp; WFH Pattern
          </h3>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--bg-tertiary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Average Active Shift</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-info)' }}>{summary.timePattern}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Active Logged Days</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>{summary.activeDaysCount} Days</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>WFH Days Ratio</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8' }}>{summary.wfhDaysCount} Days ({wfhPct}%)</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Approved / Pending</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>
                {summary.approvedHours}h <span style={{ color: 'var(--text-muted)' }}>/</span> <span style={{ color: '#f59e0b' }}>{summary.pendingHours}h</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
