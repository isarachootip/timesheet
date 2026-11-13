import React from 'react';
import { ChevronDown, ChevronRight, Edit, Plus, Trash2 } from 'lucide-react';
import type { Project, Task, TaskStatus, User } from '../../types';
import { formatToDDMMYYYY } from '../../utils';
import { isCriticalOverdue } from '../../utils/overdueUtils';
import { StatusBadge, getPriorityTone, getStatusTone } from '../ui/StatusBadge';
import { MilestoneSubtaskRow } from './MilestoneSubtaskRow';
import { planActionBtnStyle, planSelectCompactStyle } from './planStyles';
import { calculateMilestoneProgress } from './planUtils';

interface MilestoneCardProps {
  milestone: Task;
  allTasks: Task[];
  projectMap: Map<string, Project>;
  userMap: Map<string, User>;
  showProjectBadge: boolean;
  searchQuery: string;
  isExpanded: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canEditTask: (task: Task) => boolean;
  canDeleteTask: (task: Task) => boolean;
  onToggleExpand: (id: string) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onAddSubtask: (milestone: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string, isMain: boolean) => void;
}

const STATUSES: TaskStatus[] = ['To Do', 'In Progress', 'Review', 'Done'];

export const MilestoneCard: React.FC<MilestoneCardProps> = ({
  milestone: m,
  allTasks,
  projectMap,
  userMap,
  showProjectBadge,
  searchQuery,
  isExpanded,
  canCreate,
  canEdit,
  canDelete,
  canEditTask,
  canDeleteTask,
  onToggleExpand,
  onStatusChange,
  onAddSubtask,
  onEditTask,
  onDeleteTask,
}) => {
  const q = searchQuery.trim().toLowerCase();
  const subtasks = allTasks.filter((t) => t.parentId === m.id);
  const visibleSubtasks = q
    ? subtasks.filter((s) => s.title.toLowerCase().includes(q) || m.title.toLowerCase().includes(q))
    : subtasks;
  const open = isExpanded || (!!q && visibleSubtasks.length > 0);
  const progress = calculateMilestoneProgress(allTasks, m.id, m.status);
  const criticalOverdue = isCriticalOverdue(m);
  const projName = projectMap.get(m.projectId)?.name;

  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 280px', minWidth: 0 }}>
          <button
            type="button"
            onClick={() => onToggleExpand(m.id)}
            aria-label={open ? 'Collapse milestone' : 'Expand milestone'}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'inline-flex' }}
          >
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          <StatusBadge label={m.priority} tone={getPriorityTone(m.priority, criticalOverdue)} emphasizeDanger={criticalOverdue} />

          <span style={{ fontSize: 'var(--fs-14)', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {m.title}
          </span>

          {showProjectBadge && projName && (
            <span style={{ fontSize: 'var(--fs-12)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              {projName}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-muted)' }}>
            {progress}% · {subtasks.length} subtasks · {m.estimatedHours}h
          </span>

          <span style={{ fontSize: 'var(--fs-12)', color: criticalOverdue ? 'var(--accent-danger)' : 'var(--text-secondary)', fontWeight: criticalOverdue ? 600 : 400 }}>
            {m.startDate ? formatToDDMMYYYY(m.startDate) : '-'} {' -> '} {m.endDate ? formatToDDMMYYYY(m.endDate) : '-'}
          </span>

          {canEdit ? (
            <select
              aria-label={`Status for ${m.title}`}
              value={m.status}
              onChange={(e) => onStatusChange(m, e.target.value as TaskStatus)}
              style={planSelectCompactStyle}
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <StatusBadge label={m.status} tone={getStatusTone(m.status)} />
          )}

          <div style={{ display: 'flex', gap: '4px' }}>
            {canCreate && (
              <button type="button" onClick={() => onAddSubtask(m)} title="Add subtask" style={{ ...planActionBtnStyle, color: 'var(--accent-primary)' }}>
                <Plus size={14} />
              </button>
            )}
            {canEdit && (
              <button type="button" onClick={() => onEditTask(m)} title="Edit milestone" style={{ ...planActionBtnStyle, color: 'var(--text-secondary)' }}>
                <Edit size={14} />
              </button>
            )}
            {canDelete && (
              <button type="button" onClick={() => onDeleteTask(m.id, true)} title="Delete milestone" style={{ ...planActionBtnStyle, color: 'var(--accent-danger)' }}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {open && (
        <div>
          {visibleSubtasks.length === 0 ? (
            <div style={{ padding: '10px 16px 10px 44px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', fontSize: 'var(--fs-13)', color: 'var(--text-muted)' }}>
              No subtasks yet.
            </div>
          ) : (
            visibleSubtasks.map((sub) => (
              <MilestoneSubtaskRow
                key={sub.id}
                subtask={sub}
                assignee={sub.assigneeId ? userMap.get(sub.assigneeId) : undefined}
                canEdit={canEditTask(sub)}
                canDelete={canDeleteTask(sub)}
                onStatusChange={onStatusChange}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
