import { Suspense, lazy } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Route, Routes } from 'react-router-dom';
import { PageSkeleton } from '../ui/Skeleton';
import type {
  CostRate,
  PermissionScheme,
  Project,
  ProjectWorkflow,
  Release,
  Sprint,
  Task,
  TaskTemplate,
  TimesheetEntry,
  User,
} from '../../types';
import type { ProjectHealthSummaryItem } from '../../types/projectHealth';

const Dashboard = lazy(() => import('../Dashboard').then((m) => ({ default: m.Dashboard })));
const ProjectHealthDetailPage = lazy(() =>
  import('../ProjectHealth/ProjectHealthDetailPage').then((m) => ({
    default: m.ProjectHealthDetailPage,
  }))
);
const Projects = lazy(() => import('../Projects').then((m) => ({ default: m.Projects })));
const Timesheet = lazy(() => import('../Timesheet').then((m) => ({ default: m.Timesheet })));
const Tasks = lazy(() => import('../Tasks').then((m) => ({ default: m.Tasks })));
const TeamApprovals = lazy(() => import('../TeamApprovals').then((m) => ({ default: m.TeamApprovals })));
const Reports = lazy(() => import('../Reports').then((m) => ({ default: m.Reports })));
const Settings = lazy(() => import('../Settings').then((m) => ({ default: m.Settings })));
const ProjectPlan = lazy(() => import('../ProjectPlan').then((m) => ({ default: m.ProjectPlan })));
const ProjectChat = lazy(() => import('../ProjectChat').then((m) => ({ default: m.ProjectChat })));
const KnowledgeBase = lazy(() => import('../KnowledgeBase'));
const PersonalNotes = lazy(() =>
  import('../PersonalNotes/PersonalNotes').then((m) => ({ default: m.PersonalNotes }))
);

interface WorkspaceRoutesProps {
  currentUser: User;
  users: User[];
  projects: Project[];
  tasks: Task[];
  timesheets: TimesheetEntry[];
  taskTemplates: TaskTemplate[];
  sprints: Sprint[];
  releases: Release[];
  permissionSchemes: PermissionScheme[];
  projectWorkflows: ProjectWorkflow[];
  costRates: CostRate[];
  systemSettings: Record<string, unknown>;
  projectHealthSummaries: ProjectHealthSummaryItem[];
  onQuickCreateTask: () => void;
  refreshAll: () => void;
  handleSetUsers: Dispatch<SetStateAction<User[]>>;
  handleSetProjects: Dispatch<SetStateAction<Project[]>>;
  handleSetTasks: Dispatch<SetStateAction<Task[]>>;
  handleSetTimesheets: Dispatch<SetStateAction<TimesheetEntry[]>>;
  handleSetTaskTemplates: Dispatch<SetStateAction<TaskTemplate[]>>;
  handleSetSprints: Dispatch<SetStateAction<Sprint[]>>;
  handleSetReleases: Dispatch<SetStateAction<Release[]>>;
  handleSetPermissionSchemes: Dispatch<SetStateAction<PermissionScheme[]>>;
  handleSetProjectWorkflows: Dispatch<SetStateAction<ProjectWorkflow[]>>;
  handleSetCostRates: Dispatch<SetStateAction<CostRate[]>>;
  setSystemSettings: Dispatch<SetStateAction<Record<string, unknown>>>;
}

export const WorkspaceRoutes = ({
  currentUser,
  users,
  projects,
  tasks,
  timesheets,
  taskTemplates,
  sprints,
  releases,
  permissionSchemes,
  projectWorkflows,
  costRates,
  systemSettings,
  projectHealthSummaries,
  onQuickCreateTask,
  refreshAll,
  handleSetUsers,
  handleSetProjects,
  handleSetTasks,
  handleSetTimesheets,
  handleSetTaskTemplates,
  handleSetSprints,
  handleSetReleases,
  handleSetPermissionSchemes,
  handleSetProjectWorkflows,
  handleSetCostRates,
  setSystemSettings,
}: WorkspaceRoutesProps) => (
  <Suspense fallback={<PageSkeleton />}>
    <Routes>
      <Route path="/" element={<Dashboard projects={projects} tasks={tasks} timesheets={timesheets} currentUser={currentUser} permissionSchemes={permissionSchemes} projectWorkflows={projectWorkflows} projectHealthSummaries={projectHealthSummaries} onQuickCreateTask={onQuickCreateTask} />} />
      <Route path="/projects/:id/health" element={<ProjectHealthDetailPage projects={projects} currentUser={currentUser} />} />
      <Route path="/projects" element={<Projects projects={projects} setProjects={handleSetProjects} users={users} tasks={tasks} permissionSchemes={permissionSchemes} currentUser={currentUser} projectWorkflows={projectWorkflows} setProjectWorkflows={handleSetProjectWorkflows} />} />
      <Route path="/project-plan" element={<ProjectPlan projects={projects} tasks={tasks} setTasks={handleSetTasks} users={users} taskTemplates={taskTemplates} permissionSchemes={permissionSchemes} currentUser={currentUser} fetchInitialData={refreshAll} />} />
      <Route path="/tasks" element={<Tasks tasks={tasks} setTasks={handleSetTasks} projects={projects} users={users} sprints={sprints} setSprints={handleSetSprints} releases={releases} setReleases={handleSetReleases} projectWorkflows={projectWorkflows} setProjectWorkflows={handleSetProjectWorkflows} permissionSchemes={permissionSchemes} currentUser={currentUser} />} />
      <Route path="/timesheet" element={<Timesheet timesheets={timesheets} setTimesheets={handleSetTimesheets} projects={projects} tasks={tasks} currentUser={currentUser} users={users} />} />
      <Route path="/notes" element={<PersonalNotes currentUser={currentUser} permissionSchemes={permissionSchemes} sprints={sprints} />} />
      <Route path="/chat" element={<ProjectChat projects={projects} users={users} currentUser={currentUser} systemSettings={systemSettings} />} />
      <Route path="/team" element={<TeamApprovals users={users} setUsers={handleSetUsers} timesheets={timesheets} setTimesheets={handleSetTimesheets} projects={projects} setProjects={handleSetProjects} tasks={tasks} currentUser={currentUser} />} />
      <Route path="/reports" element={<Reports timesheets={timesheets} projects={projects} users={users} currentUser={currentUser} tasks={tasks} costRates={costRates} sprints={sprints} />} />
      <Route path="/settings" element={<Settings taskTemplates={taskTemplates} setTaskTemplates={handleSetTaskTemplates} permissionSchemes={permissionSchemes} setPermissionSchemes={handleSetPermissionSchemes} currentUser={currentUser} costRates={costRates} setCostRates={handleSetCostRates} systemSettings={systemSettings} setSystemSettings={setSystemSettings} fetchInitialData={refreshAll} />} />
      <Route path="/help" element={<KnowledgeBase currentUser={currentUser} />} />
    </Routes>
  </Suspense>
);
