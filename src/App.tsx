import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useWorkspaceBootstrap } from './hooks/useWorkspaceBootstrap';
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
import { WorkspaceRoutes } from './components/layout/WorkspaceRoutes';
import { ToastProvider } from './components/ui/ToastProvider';
import { DashboardSkeleton } from './components/ui/Skeleton';
import { mockUsers } from './data/mockData';
import type { Task, TimesheetEntry } from './types';
import './index.css';

const FloatingPostIt = lazy(() => import('./components/PersonalNotes/FloatingPostIt').then((m) => ({ default: m.FloatingPostIt })));

function AppContent() {
  const bootstrap = useWorkspaceBootstrap();
  const { currentUser, setCurrentUser, unreadChatCount, loading, users, projects, tasks, permissionSchemes, projectWorkflows } = bootstrap;

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('nt_theme');
    return saved === 'dark' || saved === 'light' ? saved : 'light';
  });
  const [pendingTsTask, setPendingTsTask] = useState<Task | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const { notes } = usePersonalNotes(currentUser?.id);
  const mutations = useAppMutations({
    currentUser,
    onTaskMovedToInProgress: (task) => setPendingTsTask(task),
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nt_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (currentUser && users.length > 0 && !users.some((u) => u.id === currentUser.id)) {
      mutations.handleSetUsers((prev) => [...prev, currentUser]);
    }
  }, [currentUser, users]);

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
    mutations.handleSetTimesheets((prevTs) => {
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
        onCreateTask={(newTask) => mutations.handleSetTasks((prev) => [...prev, newTask])}
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
            projects={projects}
            projectWorkflows={projectWorkflows}
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
              <WorkspaceRoutes
                currentUser={currentUser}
                users={users}
                projects={projects}
                tasks={tasks}
                timesheets={bootstrap.timesheets}
                taskTemplates={bootstrap.taskTemplates}
                sprints={bootstrap.sprints}
                releases={bootstrap.releases}
                permissionSchemes={permissionSchemes}
                projectWorkflows={projectWorkflows}
                costRates={bootstrap.costRates}
                systemSettings={bootstrap.systemSettings}
                projectHealthSummaries={bootstrap.projectHealthSummaries}
                onQuickCreateTask={() => setIsQuickCreateOpen(true)}
                refreshAll={mutations.refreshAll}
                handleSetUsers={mutations.handleSetUsers}
                handleSetProjects={mutations.handleSetProjects}
                handleSetTasks={mutations.handleSetTasks}
                handleSetTimesheets={mutations.handleSetTimesheets}
                handleSetTaskTemplates={mutations.handleSetTaskTemplates}
                handleSetSprints={mutations.handleSetSprints}
                handleSetReleases={mutations.handleSetReleases}
                handleSetPermissionSchemes={mutations.handleSetPermissionSchemes}
                handleSetProjectWorkflows={mutations.handleSetProjectWorkflows}
                handleSetCostRates={mutations.handleSetCostRates}
                setSystemSettings={mutations.setSystemSettings}
              />
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
