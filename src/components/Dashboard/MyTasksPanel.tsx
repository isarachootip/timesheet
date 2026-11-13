import React, { useState } from 'react';
import { Briefcase, Calendar, CheckSquare, Clock, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Project, Task } from '../../types';
import { formatToDDMMYYYY } from '../../utils';
import { getOverdueDays, isCriticalOverdue, isTaskOverdue } from '../../utils/overdueUtils';
import { EmptyState } from '../ui/EmptyState';
import { StatusBadge, getPriorityTone, getStatusTone } from '../ui/StatusBadge';

interface MyTasksPanelProps {
  tasks: Task[];
  myAllTasksCount: number;
  projects: Project[];
  myProjects: Project[];
  uniqueStatuses: string[];
  projectFilter: string;
  statusFilter: string;
  onlyOverdue: boolean;
  canCreateTask: boolean;
  today: Date;
  onChangeProjectFilter: (id: string) => void;
  onChangeStatusFilter: (status: string) => void;
  onClearOverdueFilter: () => void;
  onQuickCreateTask?: () => void;
}

const shouldShowLogTime = (task: Task, projects: Project[]): boolean => {
  const proj = projects.find((p) => p.id === task.projectId);
  const columns = proj?.customColumns && proj.customColumns.length > 0
    ? proj.customColumns
    : ['To Do', 'In Progress', 'Review', 'Done'];
  const statusIndex = columns.findIndex((col) => col.toLowerCase() === task.status.toLowerCase());
  const inProgressIndex = columns.findIndex((col) => col.toLowerCase().includes('progress'));
  if (statusIndex !== -1 && inProgressIndex !== -1) return statusIndex <= inProgressIndex;
  const s = task.status.toLowerCase();
  return !(s === 'review' || s === 'done' || s === 'pending' || s === 'completed' || s === 'approved');
};

export const MyTasksPanel: React.FC<MyTasksPanelProps> = ({
  tasks,
  myAllTasksCount,
  projects,
  myProjects,
  uniqueStatuses,
  projectFilter,
  statusFilter,
  onlyOverdue,
  canCreateTask,
  today,
  onChangeProjectFilter,
  onChangeStatusFilter,
  onClearOverdueFilter,
  onQuickCreateTask,
}) => {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const visibleTasks = showAll ? tasks : tasks.slice(0, 10);
  const hasFilters = projectFilter !== 'All' || statusFilter !== 'All' || onlyOverdue;

  return (
    <section className="surface-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckSquare size={18} color="var(--accent-primary)" />
          <h3 style={{ fontSize: 'var(--fs-16)', fontWeight: 600 }}>My Tasks</h3>
          <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-muted)' }}>({tasks.length})</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {onlyOverdue && (
            <button
              type="button"
              onClick={onClearOverdueFilter}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--accent-danger)',
                backgroundColor: 'var(--accent-danger-subtle)',
                color: 'var(--accent-danger)',
                fontSize: 'var(--fs-12)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Filter size={12} /> Overdue only (clear)
            </button>
          )}
          <select
            value={projectFilter}
            onChange={(e) => onChangeProjectFilter(e.target.value)}
            aria-label="Filter tasks by project"
            style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              fontSize: 'var(--fs-13)',
              color: 'var(--text-primary)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="All">All Projects</option>
            {myProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {['All', ...uniqueStatuses].map((status) => {
          const active = statusFilter === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => onChangeStatusFilter(status)}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--fs-12)',
                fontWeight: 600,
                backgroundColor: active ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                color: active ? 'var(--accent-contrast)' : 'var(--text-secondary)',
                border: active ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'background-color var(--transition-fast)',
              }}
            >
              {status}
            </button>
          );
        })}
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={hasFilters ? 'No tasks match your filters' : myAllTasksCount === 0 ? 'No tasks assigned to you yet' : 'No tasks in this view'}
          description={
            hasFilters
              ? 'Reset active filters to see all tasks assigned to you.'
              : 'Create a task or review active projects to get started.'
          }
          actions={[
            ...(hasFilters
              ? [
                  {
                    label: 'Reset filters',
                    onClick: () => {
                      onChangeProjectFilter('All');
                      onChangeStatusFilter('All');
                      onClearOverdueFilter();
                    },
                  },
                ]
              : []),
            ...(canCreateTask && onQuickCreateTask
              ? [{ label: 'Create Task', onClick: onQuickCreateTask, variant: 'primary' as const }]
              : []),
            { label: 'Browse Projects', onClick: () => navigate('/projects'), variant: 'secondary' },
          ]}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {visibleTasks.map((task) => {
            const proj = projects.find((p) => p.id === task.projectId);
            const overdue = isTaskOverdue(task, today);
            const critical = isCriticalOverdue(task, today);
            const overdueDays = getOverdueDays(task, today);

            return (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, flex: '1 1 260px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 500, fontSize: 'var(--fs-14)', color: 'var(--text-primary)' }}>
                      {task.title}
                    </span>
                    {critical && (
                      <StatusBadge
                        label={`Critical (${overdueDays}d overdue)`}
                        tone="danger"
                        emphasizeDanger
                      />
                    )}
                    {!critical && overdue && (
                      <span className="tabular-nums" style={{ fontSize: 'var(--fs-12)', color: 'var(--text-muted)' }}>
                        {overdueDays}d overdue
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>
                    {proj && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Briefcase size={12} />
                        {proj.name}
                      </span>
                    )}
                    {task.endDate && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                        <Calendar size={12} />
                        {formatToDDMMYYYY(task.endDate)}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <StatusBadge label={task.priority} tone={getPriorityTone(task.priority, critical)} emphasizeDanger={critical && task.priority === 'Urgent'} />
                  <StatusBadge label={task.status} tone={getStatusTone(task.status)} />
                  {shouldShowLogTime(task, projects) && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate('/timesheet', {
                          state: { autoOpenLog: true, projectId: task.projectId, taskId: task.id, taskTitle: task.title },
                        })
                      }
                      style={{
                        backgroundColor: 'var(--accent-primary)',
                        color: 'var(--accent-contrast)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        padding: '5px 10px',
                        fontSize: 'var(--fs-12)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Clock size={12} /> Log Time
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {tasks.length > 10 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
              <button
                type="button"
                onClick={() => setShowAll((prev) => !prev)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontSize: 'var(--fs-13)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {showAll ? 'Show fewer tasks' : `Show all ${tasks.length} tasks`}
              </button>
              <button
                type="button"
                onClick={() => navigate('/tasks')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: 'var(--fs-13)',
                  cursor: 'pointer',
                }}
              >
                Open Tasks Board
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
