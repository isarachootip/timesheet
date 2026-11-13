import React from 'react';
import type { GanttAxis } from './ganttScaleUtils';
import { GANTT_LEFT_COL_PX } from './PlanGanttRow';

interface PlanGanttHeaderProps {
  axis: GanttAxis;
}

export const PlanGanttHeader: React.FC<PlanGanttHeaderProps> = ({ axis }) => (
  <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
    <div
      style={{
        width: `${GANTT_LEFT_COL_PX}px`,
        minWidth: `${GANTT_LEFT_COL_PX}px`,
        position: 'sticky',
        left: 0,
        zIndex: 4,
        backgroundColor: 'var(--bg-tertiary)',
        borderRight: '1px solid var(--border-color)',
        padding: '8px 10px',
        display: 'flex',
        alignItems: 'center',
        fontSize: 'var(--fs-12)',
        fontWeight: 600,
        color: 'var(--text-secondary)',
      }}
    >
      Milestone / Subtask
    </div>

    <div style={{ flex: 1, minWidth: axis.totalWidthPx ? `${axis.totalWidthPx}px` : 0, position: 'relative' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', height: '26px' }}>
        {axis.topGroups.map((grp, idx) => (
          <div
            key={grp.key}
            style={{
              width: `${grp.widthPct}%`,
              borderLeft: idx === 0 ? 'none' : '1px solid var(--border-color)',
              padding: '0 8px',
              display: 'flex',
              alignItems: 'center',
              fontSize: 'var(--fs-12)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            {grp.label}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', height: '24px', position: 'relative' }}>
        {axis.columns.map((col, idx) => (
          <div
            key={col.key}
            style={{
              width: `${col.widthPct}%`,
              borderLeft: idx === 0 ? 'none' : '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--fs-12)',
              color: 'var(--text-muted)',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            {col.label}
          </div>
        ))}
        {axis.todayOffsetPct !== null && (
          <span
            style={{
              position: 'absolute',
              left: `${axis.todayOffsetPct}%`,
              transform: 'translateX(-50%)',
              bottom: '2px',
              padding: '0 5px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--accent-contrast)',
              fontSize: 'var(--fs-12)',
              fontWeight: 600,
              lineHeight: '16px',
              pointerEvents: 'none',
            }}
          >
            Today
          </span>
        )}
      </div>
    </div>
  </div>
);
