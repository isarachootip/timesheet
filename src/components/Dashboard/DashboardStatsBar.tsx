import React from 'react';
import { AlertTriangle, Briefcase, CheckSquare, Clock } from 'lucide-react';

interface DashboardStatsBarProps {
  activeProjectsCount: number;
  myActiveTasksCount: number;
  overdueCount: number;
  hoursThisWeek: number;
  overdueFilterActive: boolean;
  onToggleOverdueFilter: () => void;
}

export const DashboardStatsBar: React.FC<DashboardStatsBarProps> = ({
  activeProjectsCount,
  myActiveTasksCount,
  overdueCount,
  hoursThisWeek,
  overdueFilterActive,
  onToggleOverdueFilter,
}) => {
  const cardBase: React.CSSProperties = {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 16px',
    minHeight: '72px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        gap: '12px',
      }}
    >
      <div style={cardBase}>
        <div>
          <div style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Active Projects
          </div>
          <div className="tabular-nums" style={{ fontSize: 'var(--fs-20)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.25 }}>
            {activeProjectsCount}
          </div>
        </div>
        <Briefcase size={18} color="var(--text-muted)" />
      </div>

      <div style={cardBase}>
        <div>
          <div style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', fontWeight: 500 }}>
            My Active Tasks
          </div>
          <div className="tabular-nums" style={{ fontSize: 'var(--fs-20)', fontWeight: 700, color: 'var(--accent-primary)', lineHeight: 1.25 }}>
            {myActiveTasksCount}
          </div>
        </div>
        <CheckSquare size={18} color="var(--accent-primary)" />
      </div>

      <button
        type="button"
        onClick={onToggleOverdueFilter}
        title="Filter overdue tasks in My Tasks"
        style={{
          ...cardBase,
          textAlign: 'left',
          cursor: 'pointer',
          border: overdueFilterActive ? '1px solid var(--accent-danger)' : '1px solid var(--border-color)',
          transition: 'border-color var(--transition-fast)',
        }}
      >
        <div>
          <div style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Overdue Tasks
          </div>
          <div
            data-testid="dashboard-overdue-total"
            className="tabular-nums"
            style={{
              fontSize: 'var(--fs-20)',
              fontWeight: 700,
              color: overdueCount > 0 ? 'var(--accent-danger)' : 'var(--text-primary)',
              lineHeight: 1.25,
            }}
          >
            {overdueCount}
          </div>
        </div>
        <AlertTriangle size={18} color={overdueCount > 0 ? 'var(--accent-danger)' : 'var(--text-muted)'} />
      </button>

      <div style={cardBase}>
        <div>
          <div style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Hours This Week
          </div>
          <div className="tabular-nums" style={{ fontSize: 'var(--fs-20)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.25 }}>
            {hoursThisWeek}h
          </div>
        </div>
        <Clock size={18} color="var(--text-muted)" />
      </div>
    </div>
  );
};
