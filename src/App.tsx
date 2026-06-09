import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Clock, Users, Settings, LogOut, Briefcase, BarChart3 } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { Projects } from './components/Projects';
import { Timesheet } from './components/Timesheet';
import { Tasks } from './components/Tasks';
import { TeamApprovals } from './components/TeamApprovals';
import { Reports } from './components/Reports';
import './index.css';

// --- Mock Components for Routes ---


// --- Layout Component ---
const SidebarItem = ({ icon: Icon, label, path }: { icon: React.ElementType, label: string, path: string }) => {
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

const AppLayout = ({ children }: { children: React.ReactNode }) => {
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer' }} className="hover-lift">
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>John Doe</div>
              <div style={{ fontSize: '0.75rem' }}>Project Manager</div>
            </div>
            <LogOut size={18} />
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
            <button className="glass-panel hover-lift" style={{ padding: '0.5rem 1rem', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/tasks" element={<Tasks />} />
           <Route path="/timesheet" element={<Timesheet />} />
          <Route path="/team" element={<TeamApprovals />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;
