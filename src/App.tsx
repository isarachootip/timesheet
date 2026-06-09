import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Clock, Users, Settings, LogOut, Briefcase, BarChart3 } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { Projects } from './components/Projects';
import { Timesheet } from './components/Timesheet';
import { Tasks } from './components/Tasks';
import { TeamApprovals } from './components/TeamApprovals';
import { Reports } from './components/Reports';
import { Login } from './components/Login';
import { mockUsers, mockProjects, mockTasks, mockTimesheets } from './data/mockData';
import type { User, Project, Task, TimesheetEntry } from './types';
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

const AppLayout = ({ children, currentUser, onLogout }: { children: React.ReactNode, currentUser: User, onLogout: () => void }) => {
  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} color="white" />
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }} className="text-gradient">NexTime</h1>
        </div>
        
        <nav style={{ padding: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
          <SidebarItem icon={LayoutDashboard} label="Dashboard" path="/" />
          <SidebarItem icon={Briefcase} label="Projects" path="/projects" />
          <SidebarItem icon={CheckSquare} label="Tasks" path="/tasks" />
          <SidebarItem icon={Clock} label="Timesheet" path="/timesheet" />
          <SidebarItem icon={Users} label="Team" path="/team" />
          <SidebarItem icon={BarChart3} label="Reports" path="/reports" />
        </nav>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <div onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer' }} className="hover-lift" title="Log out">
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 500 }}>System Overview</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="glass-panel hover-lift" style={{ padding: '0.5rem 1rem', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', outline: 'none' }}>
              <Settings size={18} />
              <span style={{ fontSize: '0.875rem' }}>Settings</span>
            </button>
          </div>
        </header>
        
        <div className="content-area">
          {children}
        </div>
      </main>
    </div>
  );
};

function App() {
  // --- States initialized from LocalStorage ---
  const [users, setUsers] = useState<User[]>(() => getLocalStorage('nt_users', mockUsers));
  const [projects, setProjects] = useState<Project[]>(() => getLocalStorage('nt_projects', mockProjects));
  const [tasks, setTasks] = useState<Task[]>(() => getLocalStorage('nt_tasks', mockTasks));
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>(() => getLocalStorage('nt_timesheets', mockTimesheets));
  const [currentUser, setCurrentUser] = useState<User | null>(() => getLocalStorage<User | null>('nt_current_user', null));

  // --- Sync with LocalStorage on State Change ---
  useEffect(() => {
    localStorage.setItem('nt_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('nt_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('nt_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('nt_timesheets', JSON.stringify(timesheets));
  }, [timesheets]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('nt_current_user', JSON.stringify(currentUser));
      // Auto-add line mock user to available users list if they don't exist
      if (!users.some(u => u.id === currentUser.id)) {
        setUsers(prev => [...prev, currentUser]);
      }
    } else {
      localStorage.removeItem('nt_current_user');
    }
  }, [currentUser, users]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} availableUsers={users} />;
  }

  return (
    <Router>
      <AppLayout currentUser={currentUser} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard projects={projects} tasks={tasks} timesheets={timesheets} currentUser={currentUser} />} />
          <Route path="/projects" element={<Projects projects={projects} setProjects={setProjects} users={users} />} />
          <Route path="/tasks" element={<Tasks tasks={tasks} setTasks={setTasks} projects={projects} users={users} />} />
          <Route path="/timesheet" element={<Timesheet timesheets={timesheets} setTimesheets={setTimesheets} projects={projects} tasks={tasks} currentUser={currentUser} />} />
          <Route path="/team" element={<TeamApprovals users={users} setUsers={setUsers} timesheets={timesheets} setTimesheets={setTimesheets} projects={projects} setProjects={setProjects} tasks={tasks} />} />
          <Route path="/reports" element={<Reports timesheets={timesheets} projects={projects} users={users} />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;
