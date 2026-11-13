import { useEffect, useMemo, useState } from 'react';
import type { PermissionScheme, Project, Task, TaskStatus, TaskTemplate, User } from '../../types';
import { hasProjectPermission } from '../../utils/projectPermissions';
import { toast } from '../ui/ToastProvider';
import type { PlanTaskFormState } from './PlanTaskModal';
import {
  buildTasksFromTemplates,
  calculateMilestoneProgress,
  computePlanTimelineRange,
  filterTemplatesToGenerate,
  getMilestonesForSelection,
  getVisibleProjectsForPlan,
} from './planUtils';
import { useProjectBaselines } from './useProjectBaselines';

interface UseProjectPlanControllerArgs {
  projects: Project[];
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  users: User[];
  taskTemplates: TaskTemplate[];
  permissionSchemes: PermissionScheme[];
  currentUser: User | null;
  fetchInitialData?: () => void;
}

const emptyForm = (projectId: string): PlanTaskFormState => ({
  projectId, title: '', description: '', status: 'To Do', priority: 'Medium',
  estimatedHours: '8', assigneeId: '', startDate: '', endDate: '', isMain: true, parentId: '',
});

export const useProjectPlanController = ({
  projects,
  tasks,
  setTasks,
  users,
  taskTemplates,
  permissionSchemes,
  currentUser,
  fetchInitialData,
}: UseProjectPlanControllerArgs) => {
  const visibleProjects = useMemo(
    () => getVisibleProjectsForPlan(projects, currentUser, permissionSchemes),
    [projects, currentUser, permissionSchemes]
  );
  const projectMap = useMemo(() => new Map(visibleProjects.map((p) => [p.id, p])), [visibleProjects]);
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const [selectedProjectId, setSelectedProjectId] = useState(() => visibleProjects[0]?.id || 'all');
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState<PlanTaskFormState>(() => emptyForm(visibleProjects[0]?.id || ''));
  const [isBaselineModalOpen, setIsBaselineModalOpen] = useState(false);
  const [baselineName, setBaselineName] = useState('');
  const [baselineDesc, setBaselineDesc] = useState('');
  const [pendingDelete, setPendingDelete] = useState<{ taskId: string; isMain: boolean; subCount: number } | null>(null);
  const [pendingTemplates, setPendingTemplates] = useState<{ toCreate: TaskTemplate[]; skippedCount: number } | null>(null);

  useEffect(() => {
    if (visibleProjects.length === 0) return;
    if (selectedProjectId !== 'all' && !visibleProjects.some((p) => p.id === selectedProjectId)) {
      setSelectedProjectId(visibleProjects[0].id);
    }
  }, [visibleProjects, selectedProjectId]);

  const baselineState = useProjectBaselines(selectedProjectId, fetchInitialData);
  const selectedProject = selectedProjectId === 'all' ? undefined : projectMap.get(selectedProjectId);
  const milestones = useMemo(
    () => getMilestonesForSelection(tasks, visibleProjects, selectedProjectId),
    [tasks, visibleProjects, selectedProjectId]
  );
  const timelineRange = useMemo(
    () => computePlanTimelineRange(selectedProject, milestones, visibleProjects),
    [selectedProject, milestones, visibleProjects]
  );
  const overallProgress = milestones.length === 0
    ? 0
    : Math.round(milestones.reduce((sum, m) => sum + calculateMilestoneProgress(tasks, m.id, m.status), 0) / milestones.length);
  const completedCount = milestones.filter((m) => calculateMilestoneProgress(tasks, m.id, m.status) === 100).length;

  const canCreateInProject = (projId: string) =>
    hasProjectPermission(currentUser, projects, permissionSchemes, projId, 'create_task');
  const canEditTask = (t: Task) =>
    hasProjectPermission(currentUser, projects, permissionSchemes, t.projectId, 'edit_task', t);
  const canDeleteTask = (t: Task) =>
    hasProjectPermission(currentUser, projects, permissionSchemes, t.projectId, 'delete_task', t);

  const defaultCreateProjectId = selectedProject && selectedProject.projectType !== 'support'
    ? selectedProject.id
    : visibleProjects.find((p) => p.projectType !== 'support')?.id || '';

  const openAddMilestone = () => {
    if (!defaultCreateProjectId || !canCreateInProject(defaultCreateProjectId)) {
      return toast.error('You do not have permission to create milestones.');
    }
    setEditingTask(null);
    setForm({ ...emptyForm(defaultCreateProjectId), startDate: selectedProject?.startDate || '', endDate: selectedProject?.endDate || '' });
    setIsTaskModalOpen(true);
  };

  const openAddSubtask = (milestone: Task) => {
    setEditingTask(null);
    setForm({ ...emptyForm(milestone.projectId), isMain: false, parentId: milestone.id, startDate: milestone.startDate || '', endDate: milestone.endDate || '' });
    setIsTaskModalOpen(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setForm({
      projectId: task.projectId, title: task.title, description: task.description || '',
      status: task.status, priority: task.priority, estimatedHours: String(task.estimatedHours ?? 0),
      assigneeId: task.assigneeId || '', startDate: task.startDate || '', endDate: task.endDate || '',
      isMain: !task.parentId, parentId: task.parentId || '',
    });
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) return toast.error('Title is required.');
    const est = Number(form.estimatedHours) || 0;
    const targetProjectId = editingTask ? editingTask.projectId : form.projectId;
    if (!targetProjectId) return toast.error('Please select a project.');

    if (editingTask) {
      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? {
        ...t, title, description: form.description, status: form.status, priority: form.priority,
        estimatedHours: est, assigneeId: form.assigneeId || undefined,
        startDate: form.startDate || undefined, endDate: form.endDate || undefined,
      } : t)));
      toast.success('Updated plan task.');
    } else {
      const newTask: Task = {
        id: `t_${Math.random().toString(36).slice(2, 11)}`,
        projectId: targetProjectId,
        parentId: form.isMain ? undefined : form.parentId || undefined,
        title,
        description: form.description,
        status: form.status,
        priority: form.priority,
        estimatedHours: est,
        assigneeId: form.assigneeId || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => [...prev, newTask]);
      toast.success(form.isMain ? 'Created milestone.' : 'Created subtask.');
    }
    setIsTaskModalOpen(false);
  };

  const requestGenerateTemplates = () => {
    if (!selectedProject || !selectedProject.startDate || !selectedProject.endDate) {
      return toast.error('Selected project requires both Start Date and End Date to generate templates.');
    }
    if (taskTemplates.length === 0) return toast.info('No milestone templates found in Settings.');
    const plan = filterTemplatesToGenerate(taskTemplates, tasks, selectedProject.id);
    if (plan.toCreate.length === 0) return toast.info('All milestone templates already exist in this project.');
    setPendingTemplates(plan);
  };

  const confirmGenerateTemplates = () => {
    if (!pendingTemplates || !selectedProject) return;
    setIsGenerating(true);
    const created = buildTasksFromTemplates(pendingTemplates.toCreate, selectedProject);
    setTasks((prev) => [...prev, ...created]);
    toast.success(`Generated ${created.length} milestone(s)${pendingTemplates.skippedCount > 0 ? ` (${pendingTemplates.skippedCount} existing skipped)` : ''}.`);
    setPendingTemplates(null);
    setIsGenerating(false);
  };

  const handleStatusChange = (task: Task, status: TaskStatus) =>
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));

  return {
    visibleProjects, projectMap, userMap, selectedProjectId, setSelectedProjectId, selectedProject,
    expandedMilestones, setExpandedMilestones, searchQuery, setSearchQuery, isGenerating,
    isTaskModalOpen, setIsTaskModalOpen, editingTask, form, setForm,
    isBaselineModalOpen, setIsBaselineModalOpen, baselineName, setBaselineName, baselineDesc, setBaselineDesc,
    pendingDelete, setPendingDelete, pendingTemplates, setPendingTemplates,
    milestones, timelineRange, overallProgress, completedCount,
    canCreateInProject, canEditTask, canDeleteTask,
    canCreateCurrent: selectedProject ? canCreateInProject(selectedProject.id) : !!defaultCreateProjectId && canCreateInProject(defaultCreateProjectId),
    canEditCurrent: selectedProject ? hasProjectPermission(currentUser, projects, permissionSchemes, selectedProject.id, 'edit_task') : false,
    openAddMilestone, openAddSubtask, openEditTask, handleSaveTask,
    requestGenerateTemplates, confirmGenerateTemplates, handleStatusChange,
    ...baselineState,
  };
};
