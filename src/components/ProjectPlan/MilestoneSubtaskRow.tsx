import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import type { Task, TaskStatus, User } from '../../types';
import { formatToDDMMYYYY } from '../../utils';
import { isCriticalOverdue } from '../../utils/overdueUtils';
import { StatusBadge, getPriorityTone, getStatusTone } from '../ui/StatusBadge';

interface MilestoneSubtaskRowProps {
  subtask: Task;
  assignee?: User;
  canEdit: boolean;
  canDelete: boolean;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string, isMain: boolean) => void;
}

const STATUSES: TaskStatus[] = ['To Do', 'In Progress', 'Review', 'Done'];

export const MilestoneSubtaskRow: React.FC<MilestoneSubtaskRowProps> = ({
  subtask,
  assignee,
  canEdit,
  canDelete,
  onStatusChange,
  onEdit,
  onDelete,
}) => {
  const criticalOverdue = isCriticalOverdue(subtask);

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '10px 16px 10px 44px',
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 220px', minWidth: 0 }}>
        <StatusBadge
          label={subtask.priority}
          tone={getPriorityTone(subtask.priority, criticalOverdue)}
          emphasizeDanger={criticalOverdue}
        />
        <span
          style={{
            fontSize: 'var(--fs-13)',
            fontWeight: 500,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {subtask.title}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-muted)' }}>
          {assignee?.name || 'Unassigned'}
        </span>
        <span
          style={{
            fontSize: 'var(--fs-12)',
            color: criticalOverdue ? 'var(--accent-danger)' : 'var(--text-secondary)',
            fontWeight: criticalOverdue ? 600 : 400,
          }}
        >
          {subtask.startDate ? formatToDDMMYYYY(subtask.startDate) : '-'}
          {' -> '}
          {subtask.endDate ? formatToDDMMYYYY(subtask.endDate) : '-'}
        </span>

        {canEdit ? (
          <select
            aria-label={`Status for ${subtask.title}`}
            value={subtask.status}
            onChange={(e) => onStatusChange(subtask, e.target.value as TaskStatus)}
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 'var(--fs-12)',
              padding: '4px 8px',
            }}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        ) : (
          <StatusBadge label={subtask.status} tone={getStatusTone(subtask.status)} />
        )}

        <div style={{ display: 'flex', gap: '4px' }}>
          {canEdit && (
            <button
              type="button"
              onClick={() => onEdit(subtask)}
              title="Edit subtask"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px',
                cursor: 'pointer',
                display: 'inline-flex',
              }}
            >
              <Edit size={13} />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(subtask.id, false)}
              title="Delete subtask"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--accent-danger)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px',
                cursor: 'pointer',
                display: 'inline-flex',
              }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
