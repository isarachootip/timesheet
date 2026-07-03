import { Clock, CheckSquare, Briefcase, AlertTriangle, TrendingUp, Users, ChevronRight, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { User, Project, Task, TimesheetEntry } from '../types';
import { formatToDDMMYYYY } from '../utils';

interface DashboardProps {
  projects: Project[];
  tasks: Task[];
  timesheets: TimesheetEntry[];
  currentUser: User;
}

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
};

const formatDate = (date: Date): string => {
  return formatToDDMMYYYY(date);
};

const priorityColors: Record<string, string> = {
  Urgent: 'rgba(239,68,68,0.85)',
  High: 'rgba(245,158,11,0.85)',
  Medium: 'rgba(99,102,241,0.85)',
  Low: 'rgba(107,114,128,0.85)',
};

const statusColors: Record<string, string> = {
  'To Do': 'rgba(107,114,128,0.7)',
  'In Progress': 'rgba(99,102,241,0.8)',
  'Review': 'rgba(245,158,11,0.8)',
  'Done': 'rgba(16,185,129,0.8)',
};

const projectStatusColors: Record<string, string> = {
  Planning: 'rgba(107,114,128,0.8)',
  Active: 'rgba(16,185,129,0.8)',
  'On Hold': 'rgba(245,158,11,0.8)',
  Completed: 'rgba(99,102,241,0.8)',
};

const Badge = ({ label, color }: { label: string; color: string }) => (
  <span style={{
    fontSize: '0.7rem',
    fontWeight: 600,
    padding: '0.2rem 0.55rem',
    borderRadius: '999px',
    background: color,
    color: 'white',
    letterSpacing: '0.03em',
    whiteSpace: 'nowrap',
  }}>
    {label}
  </span>
);

export const Dashboard = ({ projects, tasks, timesheets, currentUser }: DashboardProps) => {
  const navigate = useNavigate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // --- Hero stats ---
  const activeProjects = projects.filter(
    p => p.status === 'Active' && p.members.some(m => m.userId === currentUser.id)
  );

  const myActiveTasks = tasks.filter(
    t => t.assigneeId === currentUser.id && t.status !== 'Done'
  );

  const overdueTasks = tasks.filter(t => {
    if (!t.endDate || t.status === 'Done') return false;
    const end = new Date(t.endDate);
    end.setHours(0, 0, 0, 0);
    return end < today;
  });

  // Group overdue tasks by project
  const overdueByProject = projects.map(proj => {
    const count = overdueTasks.filter(t => t.projectId === proj.id).length;
    return { id: proj.id, name: proj.name, count };
  }).filter(p => p.count > 0);

  // Group overdue tasks by priority
  const priorities = ['Urgent', 'High', 'Medium', 'Low'];
  const overdueByPriority = priorities.map(prio => {
    const count = overdueTasks.filter(t => t.priority === prio).length;
    return { priority: prio, count };
  }).filter(p => p.count > 0);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  const hoursThisWeek = timesheets
    .filter(ts => {
      if (ts.userId !== currentUser.id) return false;
      const d = new Date(ts.date);
      return d >= sevenDaysAgo && d <= today;
    })
    .reduce((sum, ts) => sum + ts.hours, 0);

  // --- My tasks (sorted by endDate asc) ---
  const myTasks = tasks
    .filter(t => t.assigneeId === currentUser.id)
    .sort((a, b) => {
      if (!a.endDate && !b.endDate) return 0;
      if (!a.endDate) return 1;
      if (!b.endDate) return -1;
      return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    });

  const isDueSoon = (endDate?: string): boolean => {
    if (!endDate) return false;
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const diff = (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 3;
  };

  // --- Project health ---
  const projectHealth = projects.map(proj => {
    const projTasks = tasks.filter(t => t.projectId === proj.id);
    const done = projTasks.filter(t => t.status === 'Done').length;
    const progress = projTasks.length > 0 ? Math.round((done / projTasks.length) * 100) : 0;
    const daysRemaining = proj.endDate
      ? Math.ceil((new Date(proj.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    return { ...proj, progress, daysRemaining };
  });

  // --- Card style helpers ---
  const heroCardStyle = (bg: string, border: string): React.CSSProperties => ({
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: '1rem',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    transition: 'transform 0.2s, box-shadow 0.2s',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>
          Good {getGreeting()}, {currentUser.name} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <Calendar size={14} />
          {formatDate(new Date())}
        </p>
      </div>

      {/* ── Hero Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        {/* Active Projects */}
        <div className="hover-lift" style={heroCardStyle('rgba(16,185,129,0.08)', 'rgba(16,185,129,0.35)')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Active Projects</span>
            <div style={{ padding: '0.5rem', background: 'rgba(16,185,129,0.15)', borderRadius: '0.5rem' }}>
              <Briefcase size={18} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>
            {activeProjects.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>projects you're a member of</div>
        </div>

        {/* My Active Tasks */}
        <div className="hover-lift" style={heroCardStyle('rgba(99,102,241,0.08)', 'rgba(99,102,241,0.35)')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>My Active Tasks</span>
            <div style={{ padding: '0.5rem', background: 'rgba(99,102,241,0.15)', borderRadius: '0.5rem' }}>
              <CheckSquare size={18} color="#6366f1" />
            </div>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#6366f1', lineHeight: 1 }}>
            {myActiveTasks.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>tasks not yet Done</div>
        </div>

        {/* Overdue Tasks */}
        <div className="hover-lift" style={heroCardStyle('rgba(239,68,68,0.08)', 'rgba(239,68,68,0.35)')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Overdue Tasks</span>
            <div style={{ padding: '0.5rem', background: 'rgba(239,68,68,0.15)', borderRadius: '0.5rem' }}>
              <AlertTriangle size={18} color="#ef4444" />
            </div>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: overdueTasks.length > 0 ? '#ef4444' : 'var(--text-primary)', lineHeight: 1 }}>
            {overdueTasks.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {overdueTasks.length === 0 ? 'all tasks on track ✓' : 'tasks past their due date'}
          </div>
        </div>

        {/* Hours This Week */}
        <div className="hover-lift" style={heroCardStyle('rgba(14,165,233,0.08)', 'rgba(14,165,233,0.35)')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Hours This Week</span>
            <div style={{ padding: '0.5rem', background: 'rgba(14,165,233,0.15)', borderRadius: '0.5rem' }}>
              <Clock size={18} color="#0ea5e9" />
            </div>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0ea5e9', lineHeight: 1 }}>
            {hoursThisWeek}h
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>logged in last 7 days</div>
        </div>
      </div>

      {/* ── Overdue Alert Banner (Graph Version) ── */}
      {overdueTasks.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(23, 17, 21, 0.85) 0%, rgba(22, 26, 34, 0.95) 100%)',
          border: '1px solid rgba(239,68,68,0.35)',
          borderRadius: '1rem',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          boxShadow: '0 8px 32px rgba(239, 68, 68, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(239,68,68,0.15)', paddingBottom: '0.75rem' }}>
            <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ef4444', margin: 0 }}>
              ⚠️ {overdueTasks.length} Overdue Tasks Need Attention
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="dashboard-row">
            {/* Left Column: Overdue by Project */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>
                Overdue Tasks by Project
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {overdueByProject.map(p => {
                  const percent = Math.max(8, (p.count / overdueTasks.length) * 100);
                  return (
                    <div 
                      key={p.id} 
                      onClick={() => navigate(`/projects#${p.id}`)}
                      style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', cursor: 'pointer' }}
                      className="hover-lift"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }} title={p.name}>
                          {p.name}
                        </span>
                        <span style={{ color: '#ef4444', fontWeight: 700 }}>{p.count}</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${percent}%`,
                          background: 'linear-gradient(90deg, #ef4444, #f59e0b)',
                          borderRadius: '999px'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Overdue by Priority */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>
                Overdue Tasks by Priority
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {overdueByPriority.map(p => {
                  const percent = Math.max(8, (p.count / overdueTasks.length) * 100);
                  const barColors: Record<string, string> = {
                    Urgent: 'linear-gradient(90deg, #ef4444, #ff6b6b)',
                    High: 'linear-gradient(90deg, #f59e0b, #facc15)',
                    Medium: 'linear-gradient(90deg, #6366f1, #818cf8)',
                    Low: 'linear-gradient(90deg, #64748b, #94a3b8)',
                  };
                  return (
                    <div key={p.priority} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{p.priority}</span>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{p.count}</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${percent}%`,
                          background: barColors[p.priority] || 'var(--text-muted)',
                          borderRadius: '999px'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Two-Column Layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>

        {/* LEFT — My Tasks */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckSquare size={16} color="var(--accent-primary)" />
              My Tasks
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>sorted by due date</span>
          </div>

          {myTasks.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              🎉 No tasks assigned to you
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', overflowY: 'auto', maxHeight: '520px' }}>
              {myTasks.map(task => {
                const proj = projects.find(p => p.id === task.projectId);
                const dueSoon = isDueSoon(task.endDate);
                const isOverdue = overdueTasks.some(o => o.id === task.id);
                return (
                  <div key={task.id} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: '0.75rem',
                    alignItems: 'center',
                    padding: '0.85rem 1rem',
                    background: isOverdue
                      ? 'rgba(239,68,68,0.06)'
                      : dueSoon
                        ? 'rgba(245,158,11,0.06)'
                        : 'var(--bg-tertiary)',
                    borderRadius: '0.65rem',
                    border: isOverdue
                      ? '1px solid rgba(239,68,68,0.25)'
                      : dueSoon
                        ? '1px solid rgba(245,158,11,0.25)'
                        : '1px solid transparent',
                    transition: 'background 0.15s',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 500, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.title}
                        </span>
                        {isOverdue && (
                          <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600 }}>OVERDUE</span>
                        )}
                        {!isOverdue && dueSoon && (
                          <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 600 }}>DUE SOON</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {proj && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <Briefcase size={11} style={{ display: 'inline', marginRight: '0.2rem', verticalAlign: 'middle' }} />
                            {proj.name}
                          </span>
                        )}
                        {task.endDate && (
                           <span style={{ fontSize: '0.75rem', color: isOverdue ? '#ef4444' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                             <Calendar size={11} />
                             {formatToDDMMYYYY(task.endDate)}
                           </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                      <Badge label={task.priority} color={priorityColors[task.priority] || 'rgba(107,114,128,0.8)'} />
                      <Badge label={task.status} color={statusColors[task.status] || 'rgba(107,114,128,0.8)'} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT — Project Health */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <TrendingUp size={16} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>Project Health</h3>
          </div>

          {projectHealth.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No projects found
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', overflowY: 'auto', maxHeight: '520px' }}>
              {projectHealth.map(proj => (
                <div 
                  key={proj.id} 
                  onClick={() => navigate(`/projects#${proj.id}`)}
                  style={{
                    padding: '1rem',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '0.65rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                  className="hover-lift"
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.3 }}>{proj.name}</span>
                    <Badge label={proj.status} color={projectStatusColors[proj.status] || 'rgba(107,114,128,0.8)'} />
                  </div>

                  {/* Progress bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      <span>Progress</span>
                      <span>{proj.progress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${proj.progress}%`,
                        background: proj.progress >= 80
                          ? 'linear-gradient(90deg, #10b981, #34d399)'
                          : proj.progress >= 40
                            ? 'linear-gradient(90deg, #6366f1, #818cf8)'
                            : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                        borderRadius: '999px',
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Users size={12} />
                      {proj.members.length} member{proj.members.length !== 1 ? 's' : ''}
                    </span>
                    {proj.daysRemaining !== null && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: proj.daysRemaining < 0 ? '#ef4444' : proj.daysRemaining <= 7 ? '#f59e0b' : 'var(--text-muted)' }}>
                        <ChevronRight size={12} />
                        {proj.daysRemaining < 0
                          ? `${Math.abs(proj.daysRemaining)}d overdue`
                          : `${proj.daysRemaining}d left`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
