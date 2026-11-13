import React from 'react';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import type { Task } from '../../types';
import { formatToDDMMYYYY } from '../../utils';
import type { GanttAxis } from './ganttScaleUtils';
import type { TaskSnapshotMetrics } from './planUtils';
import { PlanGanttTrack } from './PlanGanttTrack';

interface PlanGanttRowProps {
  task: Task;
  isSubtask?: boolean;
  subtaskCount?: number;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  progress: number;
  projectName?: string;
  showProjectBadge: boolean;
  axis: GanttAxis;
  baselineSnapshot?: TaskSnapshotMetrics | null;
  canEdit: boolean;
  onEditTask: (task: Task) => void;
}

export const GANTT_LEFT_COL_PX = 280;

export const PlanGanttRow: React.FC<PlanGanttRowProps> = ({
  task,
  isSubtask = false,
  subtaskCount = 0,
  isExpanded = false,
  onToggleExpand,
  progress,
  projectName,
  showProjectBadge,
  axis,
  baselineSnapshot,
  canEdit,
  onEditTask,
}) => {
  const hasBaseline = Boolean(baselineSnapshot && (baselineSnapshot.startDate || baselineSnapshot.endDate));
  const rowHeight = hasBaseline ? 44 : isSubtask ? 36 : 42;
  const startLabel = task.startDate ? formatToDDMMYYYY(task.startDate) : 'TBD';
  const endLabel = task.endDate ? formatToDDMMYYYY(task.endDate) : 'TBD';
  const tooltipText = `${task.title} • ${startLabel} → ${endLabel} • ${task.estimatedHours || 0}h • ${progress}%${canEdit ? ' (Click to edit)' : ''}`;
  const rowBg = isSubtask ? 'var(--bg-primary)' : 'var(--bg-secondary)';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: rowBg,
        minHeight: `${rowHeight}px`,
      }}
    >
      <div
        style={{
          width: `${GANTT_LEFT_COL_PX}px`,
          minWidth: `${GANTT_LEFT_COL_PX}px`,
          maxWidth: `${GANTT_LEFT_COL_PX}px`,
          position: 'sticky',
          left: 0,
          zIndex: 3,
          backgroundColor: rowBg,
          borderRight: '1px solid var(--border-color)',
          padding: isSubtask ? '6px 10px 6px 32px' : '6px 10px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          {!isSubtask && (
            subtaskCount > 0 ? (
              <button
                type="button"
                aria-label={isExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
                onClick={onToggleExpand}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '18px',
                  height: '18px',
                  padding: 0,
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span style={{ width: '18px', flexShrink: 0 }} />
            )
          )}
          {progress === 100 && <Check size={isSubtask ? 12 : 14} color="var(--dot-success)" style={{ flexShrink: 0 }} />}
          <span
            title={tooltipText}
            onClick={() => canEdit && onEditTask(task)}
            style={{
              fontSize: isSubtask ? 'var(--fs-12)' : 'var(--fs-13)',
              fontWeight: isSubtask ? 500 : 600,
              color: isSubtask ? 'var(--text-secondary)' : 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              cursor: canEdit ? 'pointer' : 'default',
            }}
          >
            {task.title}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', paddingLeft: isSubtask ? 0 : '24px' }}>
          {!isSubtask && showProjectBadge && projectName && (
            <span
              style={{
                fontSize: 'var(--fs-12)',
                padding: '0 6px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                maxWidth: '110px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {projectName}
            </span>
          )}
          <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {isSubtask ? `${task.status} · ${task.estimatedHours || 0}h` : `${subtaskCount} subtasks · ${task.estimatedHours || 0}h`}
          </span>
        </div>
      </div>

      <PlanGanttTrack
        task={task}
        isSubtask={isSubtask}
        progress={progress}
        axis={axis}
        baselineSnapshot={baselineSnapshot}
        canEdit={canEdit}
        tooltipText={tooltipText}
        onEditTask={onEditTask}
      />
    </div>
  );
};
