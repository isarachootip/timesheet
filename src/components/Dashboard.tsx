import { useState } from 'react';
import { Calendar } from 'lucide-react';
import type { PermissionScheme, Project, Task, TimesheetEntry, User } from '../types';
import { formatToDDMMYYYY } from '../utils';
import { isTaskOverdue } from '../utils/overdueUtils';
import { hasProjectPermission } from '../utils/projectPermissions';
import { DashboardStatsBar } from './Dashboard/DashboardStatsBar';
import { MyTasksPanel } from './Dashboard/MyTasksPanel';
import { ProjectHealthTable } from './Dashboard/ProjectHealthTable';

interface DashboardProps {
  projects: Project[];
  tasks: Task[];
  timesheets: TimesheetEntry[];
  currentUser: User;
  permissionSchemes?: PermissionScheme[];
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
  onQuickCreateTask,
}: DashboardProps) => {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [projectFilter, setProjectFilter] = useState<string>('All');
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeProjects = projects.filter(
    (p) => p.status === 'Active' && p.members.some((m) => m.userId === currentUser.id)
  );
  const myActiveTasks = tasks.filter((t) => t.assigneeId === currentUser.id && t.status !== 'Done');
  const overdueTasks = tasks.filter((t) => isTaskOverdue(t, today));

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  const hoursThisWeek = timesheets
    .filter((ts) => {
      if (ts.userId !== currentUser.id) return false;
      const d = new Date(ts.date);
      return d >= sevenDaysAgo && d <= today;
    })
    .reduce((sum, ts) => sum + ts.hours, 0);

  const myTasksAll = tasks.filter((t) => t.assigneeId === currentUser.id);
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
    .filter((t) => !onlyOverdue || isTaskOverdue(t, today))
    .sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

  const projectHealth = projects.map((proj) => {
    const projTasks = tasks.filter((t) => t.projectId === proj.id);
    const done = projTasks.filter((t) => t.status === 'Done').length;
    const progress = projTasks.length > 0 ? Math.round((done / projTasks.length) * 100) : 0;
    const daysRemaining = proj.endDate
      ? Math.ceil((new Date(proj.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    return { ...proj, progress, daysRemaining };
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
