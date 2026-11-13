import React from 'react';
import type { Task } from '../../types';
import { formatToDDMMYYYY } from '../../utils';
import { computeBarPlacement, type GanttAxis } from './ganttScaleUtils';
import type { TaskSnapshotMetrics } from './planUtils';

interface PlanGanttTrackProps {
  task: Task;
  isSubtask: boolean;
  progress: number;
  axis: GanttAxis;
  baselineSnapshot?: TaskSnapshotMetrics | null;
  canEdit: boolean;
  tooltipText: string;
  onEditTask: (task: Task) => void;
}

export const PlanGanttTrack: React.FC<PlanGanttTrackProps> = ({
  task,
  isSubtask,
  progress,
  axis,
  baselineSnapshot,
  canEdit,
  tooltipText,
  onEditTask,
}) => {
  const placement = computeBarPlacement(task.startDate, task.endDate, axis.startMs, axis.endMs, axis.totalWidthPx);
  const basePlacement =
    baselineSnapshot && (baselineSnapshot.startDate || baselineSnapshot.endDate)
      ? computeBarPlacement(baselineSnapshot.startDate, baselineSnapshot.endDate, axis.startMs, axis.endMs, axis.totalWidthPx)
      : null;

  const barTone = progress === 100 ? 'var(--dot-success)' : 'var(--accent-primary)';
  const barHeight = isSubtask ? 16 : 22;

  return (
    <div
      style={{
        flex: 1,
        minWidth: axis.totalWidthPx ? `${axis.totalWidthPx}px` : 0,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {axis.columns.map((col, idx) =>
        idx === 0 ? null : (
          <div
            key={col.key}
            style={{
              position: 'absolute',
              left: `${col.leftPct}%`,
              top: 0,
              bottom: 0,
              borderLeft: '1px solid var(--border-color)',
              opacity: 0.45,
              pointerEvents: 'none',
            }}
          />
        )
      )}

      {axis.todayOffsetPct !== null && (
        <div
          style={{
            position: 'absolute',
            left: `${axis.todayOffsetPct}%`,
            top: 0,
            bottom: 0,
            borderLeft: '1px dashed var(--accent-primary)',
            opacity: 0.65,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}

      {placement.isUnscheduled ? (
        <button
          type="button"
          title={tooltipText}
          onClick={() => canEdit && onEditTask(task)}
          style={{
            marginLeft: '10px',
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            border: '1px dashed var(--border-strong)',
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-muted)',
            fontSize: 'var(--fs-12)',
            cursor: canEdit ? 'pointer' : 'default',
            zIndex: 2,
          }}
        >
          Unscheduled
        </button>
      ) : (
        <>
          <div
            role={canEdit ? 'button' : undefined}
            tabIndex={canEdit ? 0 : undefined}
            title={tooltipText}
            onClick={() => canEdit && onEditTask(task)}
            onKeyDown={(e) => {
              if (canEdit && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onEditTask(task);
              }
            }}
            style={{
              position: 'absolute',
              left: `${placement.leftPct}%`,
              width: `${placement.widthPct}%`,
              top: basePlacement ? '7px' : '50%',
              transform: basePlacement ? undefined : 'translateY(-50%)',
              height: `${barHeight}px`,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-tertiary)',
              border: `1px solid ${barTone}`,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              padding: placement.labelPosition === 'inside' ? '0 8px' : 0,
              cursor: canEdit ? 'pointer' : 'default',
              zIndex: 2,
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${progress}%`,
                backgroundColor: barTone,
                opacity: isSubtask ? 0.28 : 0.22,
              }}
            />
            {placement.labelPosition === 'inside' && (
              <span style={{ position: 'relative', zIndex: 1, fontSize: 'var(--fs-12)', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                {progress}%
              </span>
            )}
          </div>

          {placement.labelPosition !== 'inside' && (
            <span
              style={{
                position: 'absolute',
                ...(placement.labelPosition === 'right'
                  ? { left: `calc(${placement.leftPct + placement.widthPct}% + 6px)` }
                  : { right: `calc(${100 - placement.leftPct}% + 6px)` }),
                top: basePlacement ? '9px' : '50%',
                transform: basePlacement ? undefined : 'translateY(-50%)',
                fontSize: 'var(--fs-12)',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                zIndex: 2,
              }}
            >
              {progress}%
            </span>
          )}
        </>
      )}

      {basePlacement && !basePlacement.isUnscheduled && (
        <div
          title={`Baseline: ${baselineSnapshot?.startDate ? formatToDDMMYYYY(baselineSnapshot.startDate) : 'TBD'} → ${baselineSnapshot?.endDate ? formatToDDMMYYYY(baselineSnapshot.endDate) : 'TBD'}`}
          style={{
            position: 'absolute',
            left: `${basePlacement.leftPct}%`,
            width: `${basePlacement.widthPct}%`,
            bottom: '5px',
            height: '4px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--border-strong)',
            zIndex: 2,
          }}
        />
      )}
    </div>
  );
};
