import React from 'react';
import { AlertTriangle, Calendar, LocateFixed } from 'lucide-react';
import type { GanttZoomMode } from './ganttScaleUtils';

interface PlanGanttToolbarProps {
  zoomMode: GanttZoomMode;
  onChangeZoom: (mode: GanttZoomMode) => void;
  onJumpToday: () => void;
  todayInRange: boolean;
  hasInvertedDates: boolean;
  milestoneCount: number;
}

const ZOOM_OPTIONS: Array<{ value: GanttZoomMode; label: string }> = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'fit', label: 'Fit' },
];

export const PlanGanttToolbar: React.FC<PlanGanttToolbarProps> = ({
  zoomMode,
  onChangeZoom,
  onJumpToday,
  todayInRange,
  hasInvertedDates,
  milestoneCount,
}) => (
  <div
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      marginBottom: '12px',
    }}
  >
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Calendar size={16} color="var(--accent-primary)" />
        <h3 style={{ fontSize: 'var(--fs-16)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          Gantt Timeline
        </h3>
        <span
          style={{
            fontSize: 'var(--fs-12)',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '1px 8px',
          }}
        >
          {milestoneCount}
        </span>
      </div>

      {hasInvertedDates && (
        <div
          role="status"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            fontSize: 'var(--fs-12)',
            color: 'var(--text-secondary)',
          }}
        >
          <AlertTriangle size={13} color="var(--accent-warning)" style={{ flexShrink: 0 }} />
          <span>Project start/end dates are inverted — timeline adjusted to milestone dates</span>
        </div>
      )}
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={onJumpToday}
        title={todayInRange ? 'Scroll timeline to Today' : 'Today is outside this plan span — jump to nearest edge'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          height: '30px',
          padding: '0 10px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          fontSize: 'var(--fs-12)',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'background-color var(--transition-fast)',
        }}
      >
        <LocateFixed size={13} color="var(--accent-primary)" />
        <span>Today</span>
      </button>

      <div
        role="group"
        aria-label="Timeline zoom mode"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '2px',
          padding: '2px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
        }}
      >
        {ZOOM_OPTIONS.map((opt) => {
          const active = zoomMode === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChangeZoom(opt.value)}
              style={{
                height: '26px',
                padding: '0 10px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: active ? 'var(--accent-primary)' : 'transparent',
                color: active ? 'var(--accent-contrast)' : 'var(--text-secondary)',
                fontSize: 'var(--fs-12)',
                fontWeight: active ? 600 : 500,
                cursor: 'pointer',
                transition: 'background-color var(--transition-fast), color var(--transition-fast)',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  </div>
);
