import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Wrench } from 'lucide-react';
import type { PermissionScheme, Project, Task, TaskTemplate, User } from '../types';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { EmptyState } from './ui/EmptyState';
import { toast } from './ui/ToastProvider';
import { PlanGantt } from './ProjectPlan/PlanGantt';
import { PlanMilestonesList } from './ProjectPlan/PlanMilestonesList';
import { PlanSummaryStrip } from './ProjectPlan/PlanSummaryStrip';
import { PlanTaskModal } from './ProjectPlan/PlanTaskModal';
import { PlanToolbar } from './ProjectPlan/PlanToolbar';
import { SaveBaselineModal } from './ProjectPlan/SaveBaselineModal';
import { useProjectPlanController } from './ProjectPlan/useProjectPlanController';

interface ProjectPlanProps {
  projects: Project[];
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  users: User[];
  taskTemplates: TaskTemplate[];
  permissionSchemes: PermissionScheme[];
  currentUser: User | null;
  fetchInitialData?: () => void;
}

export function ProjectPlan(props: ProjectPlanProps) {
  const navigate = useNavigate();
  const ctrl = useProjectPlanController(props);

  if (ctrl.visibleProjects.length === 0) {
    return (
      <div className="surface-card" style={{ padding: '24px' }}>
        <EmptyState
          icon={FolderKanban}
          title="No accessible projects"
          description="You do not currently belong to any projects with plan visibility. Create or join a project first."
          actions={[{ label: 'Go to Projects', onClick: () => navigate('/projects') }]}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <PlanToolbar
        visibleProjects={ctrl.visibleProjects}
        selectedProjectId={ctrl.selectedProjectId}
        selectedProject={ctrl.selectedProject}
        onSelectProject={ctrl.setSelectedProjectId}
        searchQuery={ctrl.searchQuery}
        onSearchChange={ctrl.setSearchQuery}
        baselines={ctrl.baselines}
        activeBaselineId={ctrl.activeBaselineId}
        compareBaselineId={ctrl.compareBaselineId}
        activatingBaseline={ctrl.activatingBaseline}
        isGenerating={ctrl.isGenerating}
        canCreate={ctrl.canCreateCurrent}
        canEdit={ctrl.canEditCurrent}
        onActivateBaseline={ctrl.activateBaseline}
        onChangeCompareBaseline={ctrl.setCompareBaselineId}
        onOpenSaveBaseline={() => ctrl.setIsBaselineModalOpen(true)}
        onGenerateFromTemplates={ctrl.requestGenerateTemplates}
        onOpenAddMilestone={ctrl.openAddMilestone}
      />

      {ctrl.selectedProject?.projectType === 'support' ? (
        <div className="surface-card" style={{ padding: '24px' }}>
          <EmptyState
            icon={Wrench}
            title="Support & Maintenance Project"
            description="Ongoing support desks manage tickets continuously rather than phased milestones. Open Tasks to manage support items."
            actions={[{ label: 'Open Task Board', onClick: () => navigate('/tasks') }]}
          />
        </div>
      ) : (
        <>
          <PlanSummaryStrip
            timelineRange={ctrl.timelineRange}
            overallProgress={ctrl.overallProgress}
            milestones={ctrl.milestones}
            completedCount={ctrl.completedCount}
            compareData={ctrl.compareData}
            loadingCompare={ctrl.loadingCompare}
          />
          <PlanGantt
            milestones={ctrl.milestones}
            allTasks={props.tasks}
            projectMap={ctrl.projectMap}
            showProjectBadge={ctrl.selectedProjectId === 'all'}
            timelineRange={ctrl.timelineRange}
            compareData={ctrl.compareData}
          />
          <PlanMilestonesList
            milestones={ctrl.milestones}
            allTasks={props.tasks}
            projectMap={ctrl.projectMap}
            userMap={ctrl.userMap}
            showProjectBadge={ctrl.selectedProjectId === 'all'}
            searchQuery={ctrl.searchQuery}
            expandedMilestones={ctrl.expandedMilestones}
            canCreateInProject={ctrl.canCreateInProject}
            canEditTask={ctrl.canEditTask}
            canDeleteTask={ctrl.canDeleteTask}
            onToggleExpand={(id) =>
              ctrl.setExpandedMilestones((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id); else next.add(id);
                return next;
              })
            }
            onStatusChange={ctrl.handleStatusChange}
            onAddSubtask={ctrl.openAddSubtask}
            onEditTask={ctrl.openEditTask}
            onDeleteTask={(taskId, isMain) =>
              ctrl.setPendingDelete({ taskId, isMain, subCount: props.tasks.filter((t) => t.parentId === taskId).length })
            }
            onClearSearch={() => ctrl.setSearchQuery('')}
            onAddMilestone={ctrl.openAddMilestone}
            onGenerateFromTemplates={ctrl.selectedProject && ctrl.canEditCurrent ? ctrl.requestGenerateTemplates : undefined}
          />
        </>
      )}

      <PlanTaskModal
        open={ctrl.isTaskModalOpen}
        editingTask={ctrl.editingTask}
        form={ctrl.form}
        visibleProjects={ctrl.visibleProjects}
        milestonesInFormProject={props.tasks.filter((t) => t.projectId === ctrl.form.projectId && !t.parentId)}
        users={props.users}
        onChange={(patch) => ctrl.setForm((prev) => ({ ...prev, ...patch }))}
        onSubmit={ctrl.handleSaveTask}
        onClose={() => ctrl.setIsTaskModalOpen(false)}
      />

      <SaveBaselineModal
        open={ctrl.isBaselineModalOpen}
        name={ctrl.baselineName}
        description={ctrl.baselineDesc}
        saving={ctrl.savingBaseline}
        onNameChange={ctrl.setBaselineName}
        onDescriptionChange={ctrl.setBaselineDesc}
        onSubmit={async (e) => {
          e.preventDefault();
          if (!ctrl.baselineName.trim()) return toast.error('Baseline version name is required.');
          const ok = await ctrl.saveBaseline(ctrl.baselineName, ctrl.baselineDesc, props.currentUser?.id);
          if (ok) { ctrl.setBaselineName(''); ctrl.setBaselineDesc(''); ctrl.setIsBaselineModalOpen(false); }
        }}
        onClose={() => ctrl.setIsBaselineModalOpen(false)}
      />

      <ConfirmDialog
        open={!!ctrl.pendingDelete}
        title={ctrl.pendingDelete?.isMain ? 'Delete Milestone' : 'Delete Subtask'}
        message={
          ctrl.pendingDelete?.isMain && ctrl.pendingDelete.subCount > 0
            ? `Delete this milestone and its ${ctrl.pendingDelete.subCount} subtask(s)?`
            : 'Delete this task permanently?'
        }
        confirmLabel="Delete"
        destructive
        onCancel={() => ctrl.setPendingDelete(null)}
        onConfirm={() => {
          if (!ctrl.pendingDelete) return;
          props.setTasks((prev) => prev.filter((t) => t.id !== ctrl.pendingDelete!.taskId && t.parentId !== ctrl.pendingDelete!.taskId));
          toast.success('Deleted plan item.');
          ctrl.setPendingDelete(null);
        }}
      />

      <ConfirmDialog
        open={!!ctrl.pendingTemplates}
        title="Generate Milestones from Templates"
        message={`Create ${ctrl.pendingTemplates?.toCreate.length || 0} milestone(s) for "${ctrl.selectedProject?.name || ''}"?${ctrl.pendingTemplates && ctrl.pendingTemplates.skippedCount > 0 ? ` (${ctrl.pendingTemplates.skippedCount} duplicate title(s) skipped)` : ''}`}
        confirmLabel="Generate"
        onCancel={() => ctrl.setPendingTemplates(null)}
        onConfirm={ctrl.confirmGenerateTemplates}
      />
    </div>
  );
}
export default ProjectPlan;
