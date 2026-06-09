import { Clock, CheckSquare, Briefcase, Calendar, ChevronRight } from 'lucide-react';
import type { User, Project, Task, TimesheetEntry } from '../types';

interface DashboardProps {
  projects: Project[];
  tasks: Task[];
  timesheets: TimesheetEntry[];
  currentUser: User;
}

export const Dashboard = ({ projects, tasks, timesheets, currentUser }: DashboardProps) => {
  // Quick Stats
  const activeTasksCount = tasks.filter(t => t.status !== 'Done' && t.assigneeId === currentUser.id).length;
  const activeProjectsCount = projects.filter(p => p.status === 'Active' && p.members.some(m => m.userId === currentUser.id)).length;
  const pendingTimesheets = timesheets.filter(ts => ts.status === 'Pending').length;
  
  // Recent Tasks
  const recentTasks = tasks.filter(t => t.assigneeId === currentUser.id).slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Section */}
      <div>
        <h1 className="text-gradient" style={{ marginBottom: '0.5rem' }}>Good Morning, {currentUser.name}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Here's what's happening with your projects today.</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-panel hover-lift" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="flex-between">
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Active Projects</span>
            <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-secondary)', borderRadius: 'var(--radius-md)' }}>
              <Briefcase size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{activeProjectsCount}</div>
        </div>

        <div className="glass-panel hover-lift" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="flex-between">
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>My Tasks</span>
            <div style={{ padding: '0.5rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', borderRadius: 'var(--radius-md)' }}>
              <CheckSquare size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{activeTasksCount}</div>
        </div>

        <div className="glass-panel hover-lift" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="flex-between">
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Pending Approvals</span>
            <div style={{ padding: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-warning)', borderRadius: 'var(--radius-md)' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{pendingTimesheets}</div>
        </div>
      </div>

      {/* Recent Activity / Tasks Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Task List */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem' }}>Current Tasks</h3>
            <button style={{ background: 'transparent', border: 'none', color: 'var(--accent-info)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View All <ChevronRight size={16} />
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recentTasks.length === 0 ? (
              <div style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>No tasks assigned to you.</div>
            ) : (
              recentTasks.map(task => (
                <div key={task.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: task.status === 'Done' ? 'var(--accent-secondary)' : task.status === 'In Progress' ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                    <div>
                      <div style={{ fontWeight: 500 }}>{task.title}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{task.description}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)' }}>
                      {task.priority}
                    </span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{task.estimatedHours}h</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Calendar / Quick Action */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>Log Time</h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text-secondary)' }}>
            <Calendar size={48} opacity={0.5} />
            <p style={{ textAlign: 'center', fontSize: '0.875rem' }}>You haven't logged any time today.</p>
            <button style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', fontWeight: 500, cursor: 'pointer', marginTop: '1rem' }} className="hover-lift">
              Log Time Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
