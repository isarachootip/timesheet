import React from 'react';
import { Calendar, CheckCircle2, Clock, Flag } from 'lucide-react';
import type { Task } from '../../types';
import type { CompareData, TimelineRange } from './planUtils';

interface PlanSummaryStripProps {
  timelineRange: TimelineRange;
  overallProgress: number;
  milestones: Task[];
  completedCount: number;
  compareData: CompareData | null;
  loadingCompare: boolean;
}

const cardStyle: React.CSSProperties = {
  padding: '12px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  minHeight: '72px',
};

export const PlanSummaryStrip: React.FC<PlanSummaryStripProps> = ({
  timelineRange,
  overallProgress,
  milestones,
  completedCount,
  compareData,
  loadingCompare,
}) => {
  const variance = compareData?.varianceSummary;
  const daysDrift = variance?.daysDrift ?? 0;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '12px',
      }}
    >
      <div className="surface-card" style={cardStyle}>
        <div>
          <div style={{ fontSize: 'var(--fs-12)', color: 'var(--text-muted)', fontWeight: 500 }}>Timeline Span</div>
          <div style={{ fontSize: 'var(--fs-20)', fontWeight: 700, color: 'var(--text-primary)' }}>
            {timelineRange.totalDays} days
          </div>
          <div style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>
            {timelineRange.displayStart} - {timelineRange.displayEnd}
          </div>
        </div>
        <Calendar size={18} color="var(--text-muted)" />
      </div>

      <div className="surface-card" style={cardStyle}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 'var(--fs-12)', color: 'var(--text-muted)', fontWeight: 500 }}>Overall Progress</div>
          <div style={{ fontSize: 'var(--fs-20)', fontWeight: 700, color: 'var(--text-primary)' }}>
            {overallProgress}%
          </div>
          <div
            style={{
              marginTop: '6px',
              width: '100%',
              height: '6px',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${overallProgress}%`,
                height: '100%',
                backgroundColor: overallProgress === 100 ? 'var(--dot-success)' : 'var(--accent-primary)',
                transition: 'width var(--transition-normal)',
              }}
            />
          </div>
        </div>
        <CheckCircle2 size={18} color={overallProgress === 100 ? 'var(--dot-success)' : 'var(--accent-primary)'} />
      </div>

      <div className="surface-card" style={cardStyle}>
        <div>
          <div style={{ fontSize: 'var(--fs-12)', color: 'var(--text-muted)', fontWeight: 500 }}>Milestones</div>
          <div style={{ fontSize: 'var(--fs-20)', fontWeight: 700, color: 'var(--text-primary)' }}>
            {completedCount} / {milestones.length}
          </div>
          <div style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>Completed milestones</div>
        </div>
        <Flag size={18} color="var(--text-muted)" />
      </div>

      <div className="surface-card" style={cardStyle}>
        <div>
          <div style={{ fontSize: 'var(--fs-12)', color: 'var(--text-muted)', fontWeight: 500 }}>
            {variance ? 'Baseline Drift' : 'Estimated Effort'}
          </div>
          <div style={{ fontSize: 'var(--fs-20)', fontWeight: 700, color: 'var(--text-primary)' }}>
            {loadingCompare
              ? '...'
              : variance
                ? `${daysDrift > 0 ? '+' : ''}${daysDrift}d`
                : `${milestones.reduce((sum, m) => sum + (m.estimatedHours || 0), 0)}h`}
          </div>
          <div style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>
            {variance
              ? `${variance.actualHoursLogged}h logged · ${variance.estimatedHoursDrift > 0 ? '+' : ''}${variance.estimatedHoursDrift}h est`
              : 'Across visible milestones'}
          </div>
        </div>
        <Clock size={18} color="var(--text-muted)" />
      </div>
    </div>
  );
};
