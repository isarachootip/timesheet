import { useMemo, useState } from 'react';
import { Calendar } from 'lucide-react';
import type { PermissionScheme, Project, ProjectWorkflow, Task, TimesheetEntry, User } from '../types';
import type { ProjectHealthSummaryItem } from '../types/projectHealth';
import { formatToDDMMYYYY } from '../utils';
import { computeProjectHealthSchedule, isTaskDone, isTaskOverdue } from '../utils/overdueUtils';
import { hasProjectPermission } from '../utils/projectPermissions';
import { DashboardStatsBar } from './Dashboard/DashboardStatsBar';
import { MyTasksPanel } from './Dashboard/MyTasksPanel';
import { ProjectHealthTable } from './Dashboard/ProjectHealthTable';
import { canUserTriggerHealthAi, deriveFallbackHealthSummary } from './ProjectHealth/healthUiUtils';

interface DashboardProps {
  projects: Project[];
  tasks: Task[];
  timesheets: TimesheetEntry[];
  currentUser: User;
  permissionSchemes?: PermissionScheme[];
  projectWorkflows?: ProjectWorkflow[];
  projectHealthSummaries?: ProjectHealthSummaryItem[];
  onQuickCreateTask?: () => void;
}

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
};

export const Dashboard = ({
  projects,
  tasks,
  timesheets,
  currentUser,
  permissionSchemes = [],
  projectWorkflows = [],
  projectHealthSummaries = [],
  onQuickCreateTask,
}: DashboardProps) => {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [projectFilter, setProjectFilter] = useState<string>('All');
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const workflowMap = useMemo(
    () => new Map(projectWorkflows.map((w) => [w.projectId, w])),
    [projectWorkflows]
  );

  const getTaskContext = (t: Task) => ({
    project: projectMap.get(t.projectId),
    workflow: workflowMap.get(t.projectId),
  });

  const activeProjects = projects.filter(
    (p) => p.status === 'Active' && p.members.some((m) => m.userId === currentUser.id)
  );

  const myTasksAll = tasks.filter((t) => t.assigneeId === currentUser.id);
  const myActiveTasks = myTasksAll.filter((t) => {
    const ctx = getTaskContext(t);
    return !isTaskDone(t, ctx.project, ctx.workflow);
  });
  const overdueTasks = myTasksAll.filter((t) => isTaskOverdue(t, today, getTaskContext(t)));

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  const hoursThisWeek = timesheets
    .filter((ts) => {
      if (ts.userId !== currentUser.id) return false;
      const d = new Date(ts.date);
      return d >= sevenDaysAgo && d <= today;
    })
    .reduce((sum, ts) => sum + ts.hours, 0);

  const myProjects = projects.filter((p) => myTasksAll.some((t) => t.projectId === p.id));

  const filteredForStatusList = myTasksAll.filter(
    (t) => projectFilter === 'All' || t.projectId === projectFilter
  );
  const taskStatuses = filteredForStatusList.map((t) => t.status);
  const standardStatuses = ['To Do', 'In Progress', 'Review', 'Done'];
  const statusOrder: Record<string, number> = { 'To Do': 1, 'In Progress': 2, Review: 3, Done: 4 };
  const uniqueStatuses = Array.from(new Set([...standardStatuses, ...taskStatuses]))
    .filter((status) => standardStatuses.includes(status) || taskStatuses.includes(status))
    .sort((a, b) => (statusOrder[a] || 99) - (statusOrder[b] || 99) || a.localeCompare(b));

  const myTasks = myTasksAll
    .filter((t) => projectFilter === 'All' || t.projectId === projectFilter)
    .filter((t) => statusFilter === 'All' || t.status === statusFilter)
    .filter((t) => !onlyOverdue || isTaskOverdue(t, today, getTaskContext(t)))
    .sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

  const healthSummaryMap = useMemo(
    () => new Map(projectHealthSummaries.map((h) => [h.projectId, h])),
    [projectHealthSummaries]
  );

  const projectHealth = projects.map((proj) => {
    const wf = workflowMap.get(proj.id);
    const projTasks = tasks.filter((t) => t.projectId === proj.id);
    const doneCount = projTasks.filter((t) => isTaskDone(t, proj, wf)).length;
    const progress = projTasks.length > 0 ? Math.round((doneCount / projTasks.length) * 100) : 0;
    const schedule = computeProjectHealthSchedule(proj, progress, today);
    const apiHealth = healthSummaryMap.get(proj.id);
    const fallback = deriveFallbackHealthSummary(
      proj.status,
      progress,
      schedule.kind === 'overdue',
      projTasks.length > 0
    );
    const canSeeAi = canUserTriggerHealthAi(currentUser, proj);

    return {
      ...proj,
      progress,
      schedule,
      healthStatus: apiHealth ? apiHealth.status : fallback.status,
      healthScore: apiHealth ? apiHealth.healthScore : fallback.healthScore,
      healthTrend: apiHealth ? apiHealth.trend : 'NONE',
      healthScoreDelta: apiHealth ? apiHealth.scoreDelta : null,
      aiSummary: canSeeAi ? apiHealth?.aiSummary ?? null : null,
      aiTopAction: canSeeAi ? apiHealth?.aiTopAction ?? null : null,
      aiAnalyzedAt: canSeeAi ? apiHealth?.aiAnalyzedAt ?? null : null,
    };
  });

  const canCreateTask = projects.some((p) =>
    hasProjectPermission(currentUser, projects, permissionSchemes, p.id, 'create_task')
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h1 style={{ fontSize: 'var(--fs-28)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
          Good {getGreeting()}, {currentUser.name}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-13)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
          <Calendar size={14} />
          {formatToDDMMYYYY(new Date())}
        </p>
      </div>

      <DashboardStatsBar
        activeProjectsCount={activeProjects.length}
        myActiveTasksCount={myActiveTasks.length}
        overdueCount={overdueTasks.length}
        hoursThisWeek={hoursThisWeek}
        overdueFilterActive={onlyOverdue}
        onToggleOverdueFilter={() => setOnlyOverdue((prev) => !prev)}
      />

      <MyTasksPanel
        tasks={myTasks}
        myAllTasksCount={myTasksAll.length}
        projects={projects}
        projectWorkflows={projectWorkflows}
        myProjects={myProjects}
        uniqueStatuses={uniqueStatuses}
        projectFilter={projectFilter}
        statusFilter={statusFilter}
        onlyOverdue={onlyOverdue}
        canCreateTask={canCreateTask}
        today={today}
        onChangeProjectFilter={(id) => {
          setProjectFilter(id);
          setStatusFilter('All');
        }}
        onChangeStatusFilter={setStatusFilter}
        onClearOverdueFilter={() => setOnlyOverdue(false)}
        onQuickCreateTask={onQuickCreateTask}
      />

      <ProjectHealthTable projects={projectHealth} />
    </div>
  );
};
