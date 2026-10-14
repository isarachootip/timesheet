import { Calendar as CalendarIcon, Briefcase, ArrowRight } from 'lucide-react';
import type { YearlyPersonalSummary } from '../../utils/personalYearlyMetrics';

interface PersonalYearlyTablesProps {
  selectedYear: string;
  userName: string;
  summary: YearlyPersonalSummary;
  onDrillDownMonth: (monthKey: string) => void;
}

export const PersonalYearlyTables = ({
  selectedYear,
  userName,
  summary,
  onDrillDownMonth,
}: PersonalYearlyTablesProps) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Table 1: Project x 12-Month Matrix */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Briefcase size={18} color="var(--accent-primary)" /> Project × 12-Month Matrix ({selectedYear})
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem', marginBottom: 0 }}>
            Monthly hours logged per project by {userName}. Click any month column header to inspect daily entries.
          </p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'right' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  Project / Category
                </th>
                {summary.monthlyBreakdown.map(m => (
                  <th
                    key={m.monthKey}
                    onClick={() => onDrillDownMonth(m.monthKey)}
                    title={`Click to view ${m.monthLabel} ${selectedYear}`}
                    style={{ padding: '0.6rem 0.5rem', fontWeight: 600, color: 'var(--accent-primary)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {m.monthLabel}
                  </th>
                ))}
                <th style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>Total</th>
                <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Share</th>
              </tr>
            </thead>
            <tbody>
              {summary.projectMatrixRows.length === 0 ? (
                <tr>
                  <td colSpan={15} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No project hours recorded in {selectedYear}.
                  </td>
                </tr>
              ) : (
                <>
                  {summary.projectMatrixRows.map((row, idx) => (
                    <tr
                      key={row.projectId}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                      }}
                    >
                      <td style={{ padding: '0.55rem 0.75rem', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {row.projectName}
                      </td>
                      {row.monthlyHours.map((hrs, mIdx) => (
                        <td
                          key={mIdx}
                          style={{
                            padding: '0.55rem 0.5rem',
                            color: hrs > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                            fontWeight: hrs > 0 ? 600 : 400,
                          }}
                        >
                          {hrs > 0 ? `${hrs}h` : '—'}
                        </td>
                      ))}
                      <td style={{ padding: '0.55rem 0.75rem', fontWeight: 700, color: 'var(--accent-info)' }}>{row.totalHours}h</td>
                      <td style={{ padding: '0.55rem 0.75rem', color: 'var(--text-secondary)' }}>{row.percentage}%</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '2px solid var(--border-color)', background: 'rgba(99, 102, 241, 0.08)', fontWeight: 700 }}>
                    <td style={{ padding: '0.65rem 0.75rem', textAlign: 'left' }}>YEAR TOTAL</td>
                    {summary.monthlyBreakdown.map(m => (
                      <td key={m.monthKey} style={{ padding: '0.65rem 0.5rem', color: m.totalHours > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {m.totalHours > 0 ? `${m.totalHours}h` : '0h'}
                      </td>
                    ))}
                    <td style={{ padding: '0.65rem 0.75rem', color: 'var(--accent-primary)' }}>{summary.totalHours}h</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>100%</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 2: 12-Month Breakdown Summary */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <CalendarIcon size={18} color="var(--accent-primary)" /> 12-Month Summary &amp; Drill-down ({selectedYear})
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem', marginBottom: 0 }}>
            Month-by-month breakdown of Approved vs. Pending hours, active days, and WFH days.
          </p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Month</th>
                <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Hours</th>
                <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Approved</th>
                <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Pending</th>
                <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Active Days</th>
                <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>WFH Days</th>
                <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Projects Worked On</th>
                <th className="no-print" style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>
                  Drill-down
                </th>
              </tr>
            </thead>
            <tbody>
              {summary.monthlyBreakdown.map((m, idx) => (
                <tr
                  key={m.monthKey}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    opacity: m.totalHours > 0 ? 1 : 0.6,
                  }}
                >
                  <td style={{ padding: '0.55rem 0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {m.monthLabel} {selectedYear}
                  </td>
                  <td style={{ padding: '0.55rem 0.75rem', fontWeight: 700, color: m.totalHours > 0 ? 'var(--accent-info)' : 'var(--text-muted)' }}>
                    {m.totalHours}h
                  </td>
                  <td style={{ padding: '0.55rem 0.75rem', color: '#10b981', fontWeight: 600 }}>{m.approvedHours}h</td>
                  <td style={{ padding: '0.55rem 0.75rem', color: m.pendingHours > 0 ? '#f59e0b' : 'var(--text-muted)', fontWeight: 600 }}>
                    {m.pendingHours}h
                  </td>
                  <td style={{ padding: '0.55rem 0.75rem' }}>{m.activeDays} days</td>
                  <td style={{ padding: '0.55rem 0.75rem', color: m.wfhDays > 0 ? '#38bdf8' : 'var(--text-muted)' }}>{m.wfhDays} days</td>
                  <td style={{ padding: '0.55rem 0.75rem', color: 'var(--text-secondary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.projectNames.join(', ')}>
                    {m.projectNames.join(', ') || '—'}
                  </td>
                  <td className="no-print" style={{ padding: '0.55rem 0.75rem', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => onDrillDownMonth(m.monthKey)}
                      style={{
                        background: 'rgba(99, 102, 241, 0.12)',
                        color: 'var(--accent-primary)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        padding: '0.25rem 0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      View Daily <ArrowRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
