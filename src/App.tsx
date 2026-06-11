import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Clock, Users, Settings as SettingsIcon, LogOut, Briefcase, BarChart3, Menu, X, CalendarRange, Bell, AlertTriangle, AlertCircle, CalendarClock } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { Projects } from './components/Projects';
import { Timesheet } from './components/Timesheet';
import { Tasks } from './components/Tasks';
import { TeamApprovals } from './components/TeamApprovals';
import { Reports } from './components/Reports';
import { Login } from './components/Login';
import { Settings } from './components/Settings';
import { ProjectPlan } from './components/ProjectPlan';
import { mockUsers, mockProjects, mockTasks, mockTimesheets } from './data/mockData';
import type { User, Project, Task, TimesheetEntry, TaskTemplate } from './types';
import './index.css';

// --- Helper to use LocalStorage with fallback ---
const getLocalStorage = <T,>(key: string, fallback: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : fallback;
};

const SidebarItem = ({ icon: Icon, label, path }: { icon: any, label: string, path: string }) => {
  const location = useLocation();
  const isActive = location.pathname === path;
  
  return (
    <Link 
      to={path} 
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1.5rem',
        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
        background: isActive ? 'var(--bg-tertiary)' : 'transparent',
        borderRight: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
        transition: 'all var(--transition-fast)',
        fontWeight: isActive ? 500 : 400
      }}
      className="hover-lift"
    >
      <Icon size={20} color={isActive ? 'var(--accent-primary)' : 'currentColor'} />
      <span>{label}</span>
    </Link>
  );
};

// ─── Notification Bell Component ───
const NotificationBell = ({ tasks, currentUser }: { tasks: Task[], currentUser: User }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in3Days = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
  const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const myTasks = tasks.filter(t => t.assigneeId === currentUser.id && t.status !== 'Done' && t.endDate);
  const overdue = myTasks.filter(t => new Date(t.endDate!) < today);
  const dueSoon = myTasks.filter(t => { const d = new Date(t.endDate!); return d >= today && d <= in3Days; });
  const dueThisWeek = myTasks.filter(t => { const d = new Date(t.endDate!); return d > in3Days && d <= in7Days; });
  const total = overdue.length + dueSoon.length + dueThisWeek.length;

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const NotifRow = ({ icon, color, label, tasks }: { icon: React.ReactNode, color: string, label: string, tasks: Task[] }) => (
    tasks.length > 0 ? <>
      <div style={{ padding: '0.6rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color, background: `${color}15`, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        {icon} {label} ({tasks.length})
      </div>
      {tasks.map(t => (
        <div key={t.id} className="notif-item">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>Due: {new Date(t.endDate!).toLocaleDateString()}</div>
          </div>
        </div>
      ))}
    </> : null
  );

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="notif-bell-btn" onClick={() => setOpen(o => !o)} title="Notifications">
        <Bell size={20} />
        {total > 0 && <span className="notif-badge">{total > 9 ? '9+' : total}</span>}
      </button>
      {open && (
        <div className="notif-dropdown">
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>🔔 My Task Alerts</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{total} items</span>
          </div>
          {total === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>✅ All caught up! No urgent tasks.</div>
          ) : (
            <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
              <NotifRow icon={<AlertTriangle size={12} />} color="#ef4444" label="Overdue" tasks={overdue} />
              <NotifRow icon={<AlertCircle size={12} />} color="#f59e0b" label="Due in 3 days" tasks={dueSoon} />
              <NotifRow icon={<CalendarClock size={12} />} color="#3b82f6" label="Due this week" tasks={dueThisWeek} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Mobile Bottom Nav ───
const MobileBottomNav = () => {
  const location = useLocation();
  const links = [
    { path: '/', icon: LayoutDashboard, label: 'Home' },
    { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { path: '/project-plan', icon: CalendarRange, label: 'Plan' },
    { path: '/timesheet', icon: Clock, label: 'Time' },
    { path: '/team', icon: Users, label: 'Team' },
  ];
  return (
    <nav className="mobile-bottom-nav">
      {links.map(({ path, icon: Icon, label }) => (
        <Link key={path} to={path} className={location.pathname === path ? 'active' : ''}>
          <Icon size={20} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
};

const AppLayout = ({ children, currentUser, tasks, onLogout }: { children: React.ReactNode, currentUser: User, tasks: Task[], onLogout: () => void }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} color="white" />
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }} className="text-gradient">NexTime</h1>
          </div>
          <button 
            className="mobile-close-btn"
            onClick={() => setIsSidebarOpen(false)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={20} />
          </button>
        </div>
        
        <nav style={{ padding: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }} onClick={() => setIsSidebarOpen(false)}>
          <SidebarItem icon={LayoutDashboard} label="Dashboard" path="/" />
          <SidebarItem icon={Briefcase} label="Projects" path="/projects" />
          <SidebarItem icon={CalendarRange} label="Project Plan" path="/project-plan" />
          <SidebarItem icon={CheckSquare} label="Tasks" path="/tasks" />
          <SidebarItem icon={Clock} label="Timesheet" path="/timesheet" />
          <SidebarItem icon={Users} label="Team" path="/team" />
          <SidebarItem icon={BarChart3} label="Reports" path="/reports" />
          <SidebarItem icon={SettingsIcon} label="Settings" path="/settings" />
        </nav>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <div onClick={() => { onLogout(); setIsSidebarOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer' }} className="hover-lift" title="Log out">
            <img src={currentUser.avatar} alt="User Profile" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{currentUser.name}</div>
              <div style={{ fontSize: '0.75rem' }}>{currentUser.globalRole}</div>
            </div>
            <LogOut size={18} color="var(--accent-danger)" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              className="mobile-menu-btn"
              onClick={() => setIsSidebarOpen(true)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center', padding: '0.25rem' }}
            >
              <Menu size={24} />
            </button>
            <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 500 }}>System Overview</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <NotificationBell tasks={tasks} currentUser={currentUser} />
            <Link to="/settings" className="glass-panel hover-lift" style={{ padding: '0.5rem 1rem', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', outline: 'none', textDecoration: 'none' }}>
              <SettingsIcon size={18} />
              <span className="hide-mobile" style={{ fontSize: '0.875rem' }}>Settings</span>
            </Link>
          </div>
        </header>
        
        <div className="content-area">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([]);
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(() => getLocalStorage<User | null>('nt_current_user', null));
  const [loading, setLoading] = useState(true);

  // Check if we just redirected from successful LINE login
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userParam = params.get('user');
    if (userParam) {
      try {
        const userObj = JSON.parse(decodeURIComponent(userParam));
        setCurrentUser(userObj);
        // Clear query parameters from URL address bar
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (err) {
        console.error('Error parsing login user:', err);
      }
    }
  }, []);

  // Fetch initial data from PostgreSQL
  useEffect(() => {
    fetch('/api/initial-data')
      .then(res => res.json())
      .then(data => {
        setUsers(data.users || []);
        setProjects(data.projects || []);
        setTasks(data.tasks || []);
        setTimesheets(data.timesheets || []);
        setTaskTemplates(data.taskTemplates || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching backend data, falling back to mocks:', err);
        setUsers(mockUsers);
        setProjects(mockProjects);
        setTasks(mockTasks);
        setTimesheets(mockTimesheets);
        setTaskTemplates([]);
        setLoading(false);
      });
  }, []);

  // Sync current logged-in user in localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('nt_current_user', JSON.stringify(currentUser));
      // Auto-add current user if not in database
      if (users.length > 0 && !users.some(u => u.id === currentUser.id)) {
        handleSetUsers(prev => [...prev, currentUser]);
      }
    } else {
      localStorage.removeItem('nt_current_user');
    }
  }, [currentUser, users]);

  // REST synchronizing hooks
  const handleSetUsers: React.Dispatch<React.SetStateAction<User[]>> = (value) => {
    setUsers(prev => {
      const nextUsers = typeof value === 'function' ? value(prev) : value;
      if (nextUsers.length < prev.length) {
        const deletedUser = prev.find(pUser => !nextUsers.some(nUser => nUser.id === pUser.id));
        if (deletedUser) {
          fetch(`/api/users/${deletedUser.id}`, { method: 'DELETE' });
        }
      } else {
        nextUsers.forEach(nUser => {
          const prevUser = prev.find(pUser => pUser.id === nUser.id);
          if (JSON.stringify(prevUser) !== JSON.stringify(nUser)) {
            fetch('/api/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(nUser)
            });
          }
        });
      }
      return nextUsers;
    });
  };

  const handleSetProjects: React.Dispatch<React.SetStateAction<Project[]>> = (value) => {
    setProjects(prev => {
      const nextProjects = typeof value === 'function' ? value(prev) : value;
      nextProjects.forEach(nProj => {
        const prevProj = prev.find(pProj => pProj.id === nProj.id);
        if (JSON.stringify(prevProj) !== JSON.stringify(nProj)) {
          fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nProj)
          });
        }
      });
      return nextProjects;
    });
  };

  const handleSetTasks: React.Dispatch<React.SetStateAction<Task[]>> = (value) => {
    setTasks(prev => {
      const nextTasks = typeof value === 'function' ? value(prev) : value;
      if (nextTasks.length < prev.length) {
        const deletedTask = prev.find(pTask => !nextTasks.some(nTask => nTask.id === pTask.id));
        if (deletedTask) {
          fetch(`/api/tasks/${deletedTask.id}`, { method: 'DELETE' });
        }
      } else {
        nextTasks.forEach(nTask => {
          const prevTask = prev.find(pTask => pTask.id === nTask.id);
          if (JSON.stringify(prevTask) !== JSON.stringify(nTask)) {
            fetch('/api/tasks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(nTask)
            });
          }
        });
      }
      return nextTasks;
    });
  };

  const handleSetTimesheets: React.Dispatch<React.SetStateAction<TimesheetEntry[]>> = (value) => {
    setTimesheets(prev => {
      const nextTimesheets = typeof value === 'function' ? value(prev) : value;
      if (nextTimesheets.length < prev.length) {
        const deletedTs = prev.find(pTs => !nextTimesheets.some(nTs => nTs.id === pTs.id));
        if (deletedTs) {
          fetch(`/api/timesheets/${deletedTs.id}`, { method: 'DELETE' });
        }
      } else {
        nextTimesheets.forEach(nTs => {
          const prevTs = prev.find(pTs => pTs.id === nTs.id);
          if (JSON.stringify(prevTs) !== JSON.stringify(nTs)) {
            fetch('/api/timesheets', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(nTs)
            });
          }
        });
      }
      return nextTimesheets;
    });
  };

  const handleSetTaskTemplates: React.Dispatch<React.SetStateAction<TaskTemplate[]>> = (value) => {
    setTaskTemplates(prev => {
      const nextTpl = typeof value === 'function' ? value(prev) : value;
      if (nextTpl.length < prev.length) {
        const deletedTpl = prev.find(p => !nextTpl.some(n => n.id === p.id));
        if (deletedTpl) {
          fetch(`/api/task-templates/${deletedTpl.id}`, { method: 'DELETE' });
        }
      } else {
        nextTpl.forEach(nTpl => {
          const prevTpl = prev.find(p => p.id === nTpl.id);
          if (JSON.stringify(prevTpl) !== JSON.stringify(nTpl)) {
            fetch('/api/task-templates', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(nTpl)
            });
          }
        });
      }
      return nextTpl;
    });
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} availableUsers={users.length > 0 ? users : mockUsers} />;
  }

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 600 }}>Loading system...</div>
        <p style={{ color: 'var(--text-secondary)' }}>Connecting to database...</p>
      </div>
    );
  }

  return (
    <Router>
      <AppLayout currentUser={currentUser} tasks={tasks} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard projects={projects} tasks={tasks} timesheets={timesheets} currentUser={currentUser} />} />
          <Route path="/projects" element={<Projects projects={projects} setProjects={handleSetProjects} users={users} tasks={tasks} />} />
          <Route path="/project-plan" element={<ProjectPlan projects={projects} tasks={tasks} setTasks={handleSetTasks} users={users} taskTemplates={taskTemplates} />} />
          <Route path="/tasks" element={<Tasks tasks={tasks} setTasks={handleSetTasks} projects={projects} users={users} />} />
          <Route path="/timesheet" element={<Timesheet timesheets={timesheets} setTimesheets={handleSetTimesheets} projects={projects} tasks={tasks} currentUser={currentUser} />} />
          <Route path="/team" element={<TeamApprovals users={users} setUsers={handleSetUsers} timesheets={timesheets} setTimesheets={handleSetTimesheets} projects={projects} setProjects={handleSetProjects} tasks={tasks} />} />
          <Route path="/reports" element={<Reports timesheets={timesheets} projects={projects} users={users} />} />
          <Route path="/settings" element={<Settings taskTemplates={taskTemplates} setTaskTemplates={handleSetTaskTemplates} />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;
