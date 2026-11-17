import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Project, ProjectStatus, User } from '../../types';
import { bulkUpdateProjects, type BulkProjectsPatch } from '../../services/bulkUpdateApi';
import { toast } from '../ui/ToastProvider';
import { ProjectListRow } from './ProjectListRow';
import { ProjectsBulkActionBar } from './ProjectsBulkActionBar';
import { useProjectTimesheetNavigate } from './useProjectTimesheetNavigate';

interface ProjectsListViewProps {
  projects: Project[];
  users: User[];
  currentUser: User | null;
  canManageWorkflow: (project: Project) => boolean;
  onOpenWorkflowModal: (project: Project) => void;
  onOpenEditModal: (project: Project) => void;
  onDeleteProject: (id: string) => void;
}

export const ProjectsListView: React.FC<ProjectsListViewProps> = ({
  projects,
  users,
  currentUser,
  canManageWorkflow,
  onOpenWorkflowModal,
  onOpenEditModal,
  onDeleteProject,
}) => {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { handleSurfaceClick, handleSurfaceAuxClick, handleSurfaceKeyDown } =
    useProjectTimesheetNavigate(currentUser);

  const visibleProjects = projects.filter(
    (p) =>
      currentUser?.globalRole === 'Admin' ||
      currentUser?.globalRole === 'Manager' ||
      p.members?.some((m) => m.userId === currentUser?.id)
  );
  const manageableIds = visibleProjects.filter((p) => canManageWorkflow(p)).map((p) => p.id);
  const activeSelected = selectedIds.filter((id) => manageableIds.includes(id));
  const allManageableSelected = manageableIds.length > 0 && activeSelected.length === manageableIds.length;
  const canDelete = currentUser?.globalRole === 'Admin' || currentUser?.globalRole === 'Manager';

  const runBulkPatch = async (patch: BulkProjectsPatch) => {
    if (!currentUser || activeSelected.length === 0) return;
    setIsSubmitting(true);
    try {
      const result = await bulkUpdateProjects(currentUser.id, activeSelected, patch);
      const updatedSet = new Set(result.updatedIds);
      queryClient.setQueryData<Project[]>(['projects'], (prev = []) =>
        prev.map((p) => {
          if (!updatedSet.has(p.id)) return p;
          return {
            ...p,
            status: patch.status !== undefined ? patch.status : p.status,
            endDate: patch.endDate !== undefined ? patch.endDate || undefined : p.endDate,
          };
        })
      );
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      const skipMsg = result.skipped.length > 0 ? ` (${result.skipped.length} skipped)` : '';
      toast.success(`Updated ${result.updatedIds.length} project(s)${skipMsg}.`);
      setSelectedIds([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bulk project update failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <ProjectsBulkActionBar
        selectedCount={activeSelected.length}
        isSubmitting={isSubmitting}
        onApplyStatus={(status: ProjectStatus) => runBulkPatch({ status })}
        onApplyEndDate={(endDate: string) => runBulkPatch({ endDate })}
        onClearEndDate={() => runBulkPatch({ endDate: null })}
        onClearSelection={() => setSelectedIds([])}
      />

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
              {manageableIds.length > 0 && (
                <th style={{ padding: '0.875rem 0.75rem', width: '38px' }}>
                  <input
                    type="checkbox"
                    aria-label="Select all manageable projects"
                    checked={allManageableSelected}
                    onChange={(e) => setSelectedIds(e.target.checked ? manageableIds : [])}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
              )}
              <th style={{ padding: '0.875rem 1rem' }}>Project Name</th>
              <th style={{ padding: '0.875rem 1rem' }}>Type & Status</th>
              <th style={{ padding: '0.875rem 1rem' }}>Schedule</th>
              <th style={{ padding: '0.875rem 1rem' }}>Budget</th>
              <th style={{ padding: '0.875rem 1rem' }}>Team Members</th>
              <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleProjects.map((project, idx) => (
              <ProjectListRow
                key={project.id}
                project={project}
                rowIndex={idx}
                showCheckboxColumn={manageableIds.length > 0}
                manageable={canManageWorkflow(project)}
                canDelete={canDelete}
                checked={activeSelected.includes(project.id)}
                users={users}
                onToggleSelect={(next) =>
                  setSelectedIds((prev) => (next ? [...prev, project.id] : prev.filter((id) => id !== project.id)))
                }
                onRowClick={handleSurfaceClick}
                onRowAuxClick={handleSurfaceAuxClick}
                onRowKeyDown={handleSurfaceKeyDown}
                onOpenWorkflowModal={onOpenWorkflowModal}
                onOpenEditModal={onOpenEditModal}
                onDeleteProject={onDeleteProject}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
