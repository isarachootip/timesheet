import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import {
  useCostRates,
  usePermissionSchemes,
  useProjects,
  useProjectWorkflows,
  useReleases,
  useSprints,
  useSystemSettings,
  useTaskTemplates,
  useTasks,
  useTimesheets,
  useUsers,
} from './hooks/useAppQueries';
import { useAppMutations } from './hooks/useAppMutations';
import { usePersonalNotes } from './hooks/usePersonalNotes';
import { Login } from './components/Login';
import ChatWidget from './components/ChatWidget';
import { ChatDrawer } from './components/ChatDrawer';
import { CommandPalette } from './components/CommandPalette/CommandPalette';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { ActualHoursModal } from './components/layout/ActualHoursModal';
import { ToastProvider } from './components/ui/ToastProvider';
import { DashboardSkeleton, PageSkeleton } from './components/ui/Skeleton';
import { mockUsers } from './data/mockData';
import type { Task, TimesheetEntry, User } from './types';
import './index.css';

const Dashboard = lazy(() => import('./components/Dashboard').then((m) => ({ default: m.Dashboard })));
const Projects = lazy(() => import('./components/Projects').then((m) => ({ default: m.Projects })));
const Timesheet = lazy(() => import('./components/Timesheet').then((m) => ({ default: m.Timesheet })));
const Tasks = lazy(() => import('./components/Tasks').then((m) => ({ default: m.Tasks })));
const TeamApprovals = lazy(() => import('./components/TeamApprovals').then((m) => ({ default: m.TeamApprovals })));
const Reports = lazy(() => import('./components/Reports').then((m) => ({ default: m.Reports })));
const Settings = lazy(() => import('./components/Settings').then((m) => ({ default: m.Settings })));
const ProjectPlan = lazy(() => import('./components/ProjectPlan').then((m) => ({ default: m.ProjectPlan })));
const ProjectChat = lazy(() => import('./components/ProjectChat').then((m) => ({ default: m.ProjectChat })));
const KnowledgeBase = lazy(() => import('./components/KnowledgeBase'));
const PersonalNotes = lazy(() => import('./components/PersonalNotes/PersonalNotes').then((m) => ({ default: m.PersonalNotes })));
const FloatingPostIt = lazy(() => import('./components/PersonalNotes/FloatingPostIt').then((m) => ({ default: m.FloatingPostIt })));

const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem('nt_current_user');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
};

function AppContent() {
  const { data: users = [], isLoading: l1 } = useUsers();
  const { data: projects = [], isLoading: l2 } = useProjects();
  const { data: tasks = [], isLoading: l3 } = useTasks();
  const { data: timesheets = [], isLoading: l4 } = useTimesheets();
  const { data: taskTemplates = [] } = useTaskTemplates();
  const { data: sprints = [] } = useSprints();
  const { data: releases = [] } = useReleases();
  const { data: permissionSchemes = [] } = usePermissionSchemes();
  const { data: projectWorkflows = [] } = useProjectWorkflows();
  const { data: costRates = [] } = useCostRates();
  const { data: systemSettings = {} } = useSystemSettings();

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('nt_theme');
    return saved === 'dark' || saved === 'light' ? saved : 'light';
  });
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser);
  const [pendingTsTask, setPendingTsTask] = useState<Task | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const { notes } = usePersonalNotes(currentUser?.id);

  const {
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
  } = useAppMutations({
    currentUser,
    onTaskMovedToInProgress: (task) => setPendingTsTask(task),
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nt_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.removeItem('nt_technicians_data');
    const params = new URLSearchParams(window.location.search);
    const userParam = params.get('user');
    if (!userParam) return;
    try {
      const userObj = JSON.parse(decodeURIComponent(userParam)) as User;
      setCurrentUser(userObj);
      if (window.location.pathname === '/login-success') {
        window.location.href = '/';
      } else {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch {
      // Ignore malformed login redirect payload
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      localStorage.removeItem('nt_current_user');
      return;
    }
    localStorage.setItem('nt_current_user', JSON.stringify(currentUser));
    if (users.length > 0 && !users.some((u) => u.id === currentUser.id)) {
      handleSetUsers((prev) => [...prev, currentUser]);
    }
  }, [currentUser, users]);

  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    const poll = async () => {
      try {
        const res = await fetch(`/api/users/${currentUser.id}/chat-notifications`);
        if (res.ok && active) {
          const data: Array<{ isRead: boolean }> = await res.json();
          setUnreadChatCount(data.filter((n) => !n.isRead).length);
        }
      } catch {
        // Ignore poll failure
      }
    };
    poll();
    const id = window.setInterval(poll, 5000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [currentUser?.id]);

  if (window.location.pathname === '/widget-iframe') {
    return (
      <Routes>
        <Route path="/widget-iframe" element={<ChatWidget />} />
      </Routes>
    );
  }

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} availableUsers={users.length > 0 ? users : mockUsers} />;
  }

  const loading = l1 || l2 || l3 || l4;

  const handleActualHoursConfirm = (actualHours: number, startTime?: string, endTime?: string) => {
    if (!pendingTsTask) return;
    const nTask = pendingTsTask;
    const tsDate = nTask.startDate || new Date().toISOString().split('T')[0];
    const plannedHours = nTask.estimatedHours && nTask.estimatedHours > 0 ? nTask.estimatedHours : 8;
    const newTs: TimesheetEntry = {
      id: `ts_${Date.now()}`,
      userId: nTask.assigneeId || currentUser.id,
      projectId: nTask.projectId,
      taskId: nTask.id,
      date: tsDate,
      hours: actualHours,
      plannedHours,
      startTime,
      endTime,
      description: `Started work on: ${nTask.title}`,
      status: 'Pending',
    };
    handleSetTimesheets((prevTs) => {
      if (prevTs.some((t) => t.taskId === newTs.taskId && t.date.startsWith(newTs.date))) return prevTs;
      return [...prevTs, newTs];
    });
    setPendingTsTask(null);
  };

  return (
    <>
      {pendingTsTask && (
        <ActualHoursModal
          task={pendingTsTask}
          onConfirm={handleActualHoursConfirm}
          onCancel={() => setPendingTsTask(null)}
        />
      )}
      <CommandPalette
        isOpen={isPaletteOpen}
        onOpenPalette={() => setIsPaletteOpen(true)}
        onClose={() => setIsPaletteOpen(false)}
        isQuickCreateOpen={isQuickCreateOpen}
        onOpenQuickCreate={() => setIsQuickCreateOpen(true)}
        onCloseQuickCreate={() => setIsQuickCreateOpen(false)}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        projects={projects}
        tasks={tasks}
        users={users}
        notes={notes}
        permissionSchemes={permissionSchemes}
        currentUser={currentUser}
        onCreateTask={(newTask) => handleSetTasks((prev) => [...prev, newTask])}
      />
      <ChatDrawer open={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <div className="app-container">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          currentUser={currentUser}
          unreadChatCount={unreadChatCount}
          onLogout={() => setCurrentUser(null)}
        />
        <main className="main-content">
          <Header
            currentUser={currentUser}
            tasks={tasks}
            theme={theme}
            onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            onOpenPalette={() => setIsPaletteOpen(true)}
            onOpenChat={() => setIsChatOpen(true)}
          />
          <div className="content-area">
            {loading ? (
              <DashboardSkeleton />
            ) : (
              <Suspense fallback={<PageSkeleton />}>
                <Routes>
                  <Route path="/" element={<Dashboard projects={projects} tasks={tasks} timesheets={timesheets} currentUser={currentUser} permissionSchemes={permissionSchemes} onQuickCreateTask={() => setIsQuickCreateOpen(true)} />} />
                  <Route path="/projects" element={<Projects projects={projects} setProjects={handleSetProjects} users={users} tasks={tasks} permissionSchemes={permissionSchemes} currentUser={currentUser} projectWorkflows={projectWorkflows} setProjectWorkflows={handleSetProjectWorkflows} />} />
                  <Route path="/project-plan" element={<ProjectPlan projects={projects} tasks={tasks} setTasks={handleSetTasks} users={users} taskTemplates={taskTemplates} permissionSchemes={permissionSchemes} currentUser={currentUser} fetchInitialData={refreshAll} />} />
                  <Route path="/tasks" element={<Tasks tasks={tasks} setTasks={handleSetTasks} projects={projects} users={users} sprints={sprints} setSprints={handleSetSprints} releases={releases} setReleases={handleSetReleases} projectWorkflows={projectWorkflows} setProjectWorkflows={handleSetProjectWorkflows} permissionSchemes={permissionSchemes} currentUser={currentUser} />} />
                  <Route path="/timesheet" element={<Timesheet timesheets={timesheets} setTimesheets={handleSetTimesheets} projects={projects} tasks={tasks} currentUser={currentUser} users={users} />} />
                  <Route path="/notes" element={<PersonalNotes currentUser={currentUser} />} />
                  <Route path="/chat" element={<ProjectChat projects={projects} users={users} currentUser={currentUser} systemSettings={systemSettings} />} />
                  <Route path="/team" element={<TeamApprovals users={users} setUsers={handleSetUsers} timesheets={timesheets} setTimesheets={handleSetTimesheets} projects={projects} setProjects={handleSetProjects} tasks={tasks} currentUser={currentUser} />} />
                  <Route path="/reports" element={<Reports timesheets={timesheets} projects={projects} users={users} currentUser={currentUser} tasks={tasks} costRates={costRates} sprints={sprints} />} />
                  <Route path="/settings" element={<Settings taskTemplates={taskTemplates} setTaskTemplates={handleSetTaskTemplates} permissionSchemes={permissionSchemes} setPermissionSchemes={handleSetPermissionSchemes} currentUser={currentUser} costRates={costRates} setCostRates={handleSetCostRates} systemSettings={systemSettings} setSystemSettings={setSystemSettings} fetchInitialData={refreshAll} />} />
                  <Route path="/help" element={<KnowledgeBase currentUser={currentUser} />} />
                </Routes>
              </Suspense>
            )}
          </div>
        </main>
        <MobileBottomNav />
        <Suspense fallback={null}>
          <FloatingPostIt currentUser={currentUser} />
        </Suspense>
      </div>
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <AppContent />
      </Router>
    </ToastProvider>
  );
}
