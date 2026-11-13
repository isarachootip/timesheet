import React from 'react';
import { ListChecks } from 'lucide-react';
import type { Project, Task, TaskStatus, User } from '../../types';
import { EmptyState } from '../ui/EmptyState';
import { MilestoneCard } from './MilestoneCard';

interface PlanMilestonesListProps {
  milestones: Task[];
  allTasks: Task[];
  projectMap: Map<string, Project>;
  userMap: Map<string, User>;
  showProjectBadge: boolean;
  searchQuery: string;
  expandedMilestones: Set<string>;
  canCreateInProject: (projectId: string) => boolean;
  canEditTask: (task: Task) => boolean;
  canDeleteTask: (task: Task) => boolean;
  onToggleExpand: (id: string) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onAddSubtask: (milestone: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string, isMain: boolean) => void;
  onClearSearch: () => void;
  onAddMilestone: () => void;
  onGenerateFromTemplates?: () => void;
}

export const PlanMilestonesList: React.FC<PlanMilestonesListProps> = ({
  milestones,
  allTasks,
  projectMap,
  userMap,
  showProjectBadge,
  searchQuery,
  expandedMilestones,
  canCreateInProject,
  canEditTask,
  canDeleteTask,
  onToggleExpand,
  onStatusChange,
  onAddSubtask,
  onEditTask,
  onDeleteTask,
  onClearSearch,
  onAddMilestone,
  onGenerateFromTemplates,
}) => {
  const q = searchQuery.trim().toLowerCase();

  const matchingMilestones = milestones.filter((m) => {
    if (!q) return true;
    const subs = allTasks.filter((t) => t.parentId === m.id);
    const projName = projectMap.get(m.projectId)?.name.toLowerCase() || '';
    return (
      m.title.toLowerCase().includes(q) ||
      projName.includes(q) ||
      subs.some((s) => s.title.toLowerCase().includes(q))
    );
  });

  if (matchingMilestones.length === 0) {
    const emptyActions = q
      ? [{ label: 'Clear Search', onClick: onClearSearch }]
      : [
          { label: 'Add Milestone', onClick: onAddMilestone },
          ...(onGenerateFromTemplates
            ? [{ label: 'Generate Templates', onClick: onGenerateFromTemplates, variant: 'secondary' as const }]
            : []),
        ];

    return (
      <div className="surface-card" style={{ padding: '16px' }}>
        <EmptyState
          icon={ListChecks}
          title={q ? 'No matching milestones found' : 'No milestones planned yet'}
          description={
            q
              ? 'Try another keyword or clear your search filter to view all planned milestones.'
              : 'Create your first milestone or generate standard milestones from templates.'
          }
          actions={emptyActions}
        />
      </div>
    );
  }

  return (
    <div className="surface-card" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <ListChecks size={16} color="var(--accent-primary)" />
        <h3 style={{ fontSize: 'var(--fs-16)', fontWeight: 600, color: 'var(--text-primary)' }}>
          Milestones & Subtasks ({matchingMilestones.length})
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {matchingMilestones.map((m) => (
          <MilestoneCard
            key={m.id}
            milestone={m}
            allTasks={allTasks}
            projectMap={projectMap}
            userMap={userMap}
            showProjectBadge={showProjectBadge}
            searchQuery={searchQuery}
            isExpanded={expandedMilestones.has(m.id)}
            canCreate={canCreateInProject(m.projectId)}
            canEdit={canEditTask(m)}
            canDelete={canDeleteTask(m)}
            canEditTask={canEditTask}
            canDeleteTask={canDeleteTask}
            onToggleExpand={onToggleExpand}
            onStatusChange={onStatusChange}
            onAddSubtask={onAddSubtask}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
          />
        ))}
      </div>
    </div>
  );
};
