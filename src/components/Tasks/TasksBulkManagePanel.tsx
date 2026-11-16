import React from 'react';
import { AlertTriangle, CheckCircle2, Search } from 'lucide-react';
import type { PermissionScheme, Project, ProjectWorkflow, Task, User } from '../../types';
import { formatToDDMMYYYY } from '../../utils';
import { getOverdueDays } from '../../utils/overdueUtils';
import { EmptyState } from '../ui/EmptyState';
import { StatusBadge, getStatusTone } from '../ui/StatusBadge';
import { TasksBulkActionBar } from './TasksBulkActionBar';
import { useTasksBulkSelection } from './useTasksBulkSelection';

interface TasksBulkManagePanelProps {
  tasks: Task[];
  projects: Project[];
  users: User[];
  projectWorkflows: ProjectWorkflow[];
  permissionSchemes: PermissionScheme[];
  selectedProjectId: string;
  currentUser: User | null;
}

export const TasksBulkManagePanel: React.FC<TasksBulkManagePanelProps> = (props) => {
  const {
    today,
    scope,
    setScope,
    search,
    setSearch,
    setSelectedIds,
    isSubmitting,
    projectMap,
    workflowMap,
    userMap,
    overdueTotal,
    visibleTasks,
    editableVisibleIds,
    activeSelected,
    allSelected,
    defaultDoneStatus,
    availableStatuses,
    canBulkModify,
    runBulkPatch,
  } = useTasksBulkSelection(props);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="surface-card" style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {([
            { id: 'overdue', label: `Overdue Only (${overdueTotal})` },
            { id: 'incomplete', label: 'All Incomplete' },
            { id: 'all', label: 'All Tasks' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setScope(tab.id)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--fs-12)',
                fontWeight: 600,
                cursor: 'pointer',
                border: scope === tab.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                background: scope === tab.id ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                color: scope === tab.id ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: '220px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search task or project..."
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '6px 10px 6px 30px', fontSize: 'var(--fs-13)', color: 'var(--text-primary)', width: '100%', outline: 'none' }}
          />
        </div>
      </div>

      <TasksBulkActionBar
        selectedCount={activeSelected.length}
        availableStatuses={availableStatuses}
        defaultDoneStatus={defaultDoneStatus}
        isSubmitting={isSubmitting}
        onApplyStatus={(status) => runBulkPatch({ status })}
        onApplyEndDate={(endDate) => runBulkPatch({ endDate })}
        onClearEndDate={() => runBulkPatch({ endDate: null })}
        onClearSelection={() => setSelectedIds([])}
      />

      {visibleTasks.length === 0 ? (
        <div className="surface-card" style={{ padding: '24px' }}>
          <EmptyState icon={CheckCircle2} title="No matching tasks" description="All tasks in this filter are up to date." />
        </div>
      ) : (
        <div className="surface-card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-13)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px', width: '36px' }}>
                  <input type="checkbox" aria-label="Select all visible tasks" checked={allSelected} onChange={(e) => setSelectedIds(e.target.checked ? editableVisibleIds : [])} />
                </th>
                <th style={{ padding: '10px 12px' }}>Task</th>
                <th style={{ padding: '10px 12px' }}>Project</th>
                <th style={{ padding: '10px 12px' }}>Assignee</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {visibleTasks.map((t) => {
                const proj = projectMap.get(t.projectId);
                const wf = workflowMap.get(t.projectId);
                const overdueDays = getOverdueDays(t, today, { project: proj, workflow: wf });
                const editable = canBulkModify(t);
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <input type="checkbox" aria-label={`Select ${t.title}`} disabled={!editable} checked={activeSelected.includes(t.id)} onChange={(e) => setSelectedIds((prev) => (e.target.checked ? [...prev, t.id] : prev.filter((id) => id !== t.id)))} />
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 500, color: 'var(--text-primary)' }}>{t.title}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{proj?.name || '-'}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{t.assigneeId ? userMap.get(t.assigneeId)?.name || 'Unknown' : 'Unassigned'}</td>
                    <td style={{ padding: '10px 12px' }}><StatusBadge label={t.status} tone={getStatusTone(t.status)} /></td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {t.endDate ? formatToDDMMYYYY(t.endDate) : '-'}
                      {overdueDays > 0 && (
                        <span style={{ marginLeft: '8px', color: 'var(--accent-danger)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <AlertTriangle size={12} /> {overdueDays}d overdue
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
