import { useState } from 'react';
import type { Project, Task, User, TaskPriority } from '../types';
import { Calendar, CheckCircle2, Clock, ArrowRight } from 'lucide-react';

interface ProjectPlanProps {
  projects: Project[];
  tasks: Task[];
  users: User[];
}

export const ProjectPlan = ({ projects, tasks, users }: ProjectPlanProps) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');

  const project = projects.find(p => p.id === selectedProjectId);

  // Filter main tasks (milestones) for the selected project
  const projectMilestones = tasks
    .filter(t => t.projectId === selectedProjectId && !t.parentId)
    .sort((a, b) => {
      const aTime = a.startDate ? new Date(a.startDate).getTime() : 0;
      const bTime = b.startDate ? new Date(b.startDate).getTime() : 0;
      return aTime - bTime;
    });

  const getAssigneeName = (id?: string) => {
    if (!id) return 'Unassigned';
    return users.find(u => u.id === id)?.name || 'Unknown User';
  };

  const getAssigneeAvatar = (id?: string) => {
    if (!id) return 'https://i.pravatar.cc/150?u=unassigned';
    return users.find(u => u.id === id)?.avatar || 'https://i.pravatar.cc/150?u=unassigned';
  };

  // Helper to calculate progress of a milestone based on subtasks
  const calculateMilestoneProgress = (milestoneId: string, milestoneStatus: string) => {
    const subtasks = tasks.filter(t => t.parentId === milestoneId);
    if (subtasks.length === 0) {
      return milestoneStatus === 'Done' ? 100 : 0;
    }
    const completed = subtasks.filter(t => t.status === 'Done').length;
    return Math.round((completed / subtasks.length) * 100);
  };

  const getPriorityColor = (prio: TaskPriority) => {
    switch (prio) {
      case 'Urgent': return 'var(--accent-danger)';
      case 'High': return 'var(--accent-warning)';
      case 'Medium': return 'var(--accent-info)';
      default: return 'var(--text-muted)';
    }
  };

  // Timeline geometry calculations
  const projStart = project && project.startDate ? new Date(project.startDate).getTime() : 0;
  const projEnd = project && project.endDate ? new Date(project.endDate).getTime() : projStart + 30 * 24 * 60 * 60 * 1000; // fallback 30 days
  const projDuration = projEnd - projStart;

  const ticks: string[] = [];
  if (projDuration > 0) {
    for (let i = 0; i <= 4; i++) {
      const tickTime = projStart + (projDuration * i) / 4;
      ticks.push(
        new Date(tickTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })
      );
    }
  }

  // Calculate project overall progress (average of milestones progress)
  const calculateOverallProgress = () => {
    if (projectMilestones.length === 0) return 0;
    const totalProgress = projectMilestones.reduce((sum, m) => sum + calculateMilestoneProgress(m.id, m.status), 0);
    return Math.round(totalProgress / projectMilestones.length);
  };

  const overallProgress = calculateOverallProgress();
  const totalDays = projDuration > 0 ? Math.round(projDuration / (24 * 60 * 60 * 1000)) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
      {/* Top Bar */}
      <div className="flex-between">
        <div>
          <h1 className="text-gradient" style={{ marginBottom: '0.5rem' }}>Project Plan & Timeline</h1>
          <p style={{ color: 'var(--text-secondary)' }}>View milestones, timeline schedules, and task development progress.</p>
        </div>

        {/* Project Selector */}
        <div className="glass-panel" style={{ padding: '0.25rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Project:</span>
          <select 
            value={selectedProjectId} 
            onChange={(e) => setSelectedProjectId(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id} style={{ background: 'var(--bg-secondary)' }}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {project ? (
        <>
          {/* Project Details Panel */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                <Calendar size={22} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Project Duration</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.15rem' }}>{totalDays} Days</h3>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                  {new Date(project.startDate).toLocaleDateString()} to {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing'}
                </p>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-secondary)' }}>
                <CheckCircle2 size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Milestones Progress</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.15rem' }}>{overallProgress}% Done</h3>
                <div style={{ width: '100%', height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', marginTop: '0.4rem', overflow: 'hidden' }}>
                  <div style={{ width: `${overallProgress}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(14, 165, 233, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-info)' }}>
                <Clock size={22} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Milestones</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.15rem' }}>{projectMilestones.length} Main Tasks</h3>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                  Calculated dynamically from template plan.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Gantt Chart */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowX: 'auto' }}>
            <div style={{ minWidth: '700px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>📅 Proportional Gantt Timeline</h3>
              
              {/* Timeline Header Date Ticks */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ width: '220px', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Milestone Title</div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '1rem' }}>
                  {ticks.map((t, idx) => (
                    <span key={idx} style={{ position: 'relative', textAlign: 'center', transform: 'translateX(-50%)' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Gantt Timeline Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {projectMilestones.length === 0 ? (
                  <div className="flex-center" style={{ minHeight: '120px', color: 'var(--text-muted)' }}>
                    No main tasks / milestones generated for this project yet. Open Tasks to add main tasks.
                  </div>
                ) : (
                  projectMilestones.map(m => {
                    const taskStart = m.startDate ? new Date(m.startDate).getTime() : projStart;
                    const taskEnd = m.endDate ? new Date(m.endDate).getTime() : projEnd;
                    
                    const leftOffset = projDuration > 0 
                      ? Math.max(0, Math.min(100, ((taskStart - projStart) / projDuration) * 100)) 
                      : 0;
                    const widthVal = projDuration > 0 
                      ? Math.max(1, Math.min(100 - leftOffset, ((taskEnd - taskStart) / projDuration) * 100)) 
                      : 100;
                    
                    const progress = calculateMilestoneProgress(m.id, m.status);
                    const subtasks = tasks.filter(t => t.parentId === m.id);

                    return (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '0.5rem' }}>
                        {/* Title Label */}
                        <div style={{ width: '220px', display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={m.title}>
                            {m.title}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                            {subtasks.length} subtasks • {m.estimatedHours} hrs
                          </span>
                        </div>

                        {/* Timeline Bar */}
                        <div style={{ flex: 1, position: 'relative', height: '32px', marginLeft: '1rem', background: 'rgba(255,255,255,0.01)', borderRadius: '4px' }}>
                          <div style={{
                            position: 'absolute',
                            left: `${leftOffset}%`,
                            width: `${widthVal}%`,
                            height: '24px',
                            top: '4px',
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-color)',
                            borderLeft: `3px solid ${getPriorityColor(m.priority)}`,
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0 8px',
                            overflow: 'hidden',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }} title={`${m.title}: ${m.startDate || 'Start'} to ${m.endDate || 'End'}`}>
                            {/* Inner progress fill bar */}
                            <div style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: `${progress}%`,
                              background: 'var(--accent-primary)',
                              opacity: 0.15,
                              transition: 'width 0.4s ease'
                            }} />

                            <span style={{ fontSize: '0.7rem', color: 'var(--text-primary)', fontWeight: 600, zIndex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {progress}% Done
                            </span>
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', zIndex: 1 }}>
                              {m.startDate ? new Date(m.startDate).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Detailed milestones table */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>📋 Milestones & Status Checklist</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Milestone / Main Task</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Estimated Period</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Est. Hours</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Owner</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Priority</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {projectMilestones.map(m => {
                    const progress = calculateMilestoneProgress(m.id, m.status);
                    return (
                      <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', color: 'var(--text-primary)' }} className="hover-lift">
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600 }}>{m.title}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{m.description}</span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {m.startDate && m.endDate ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
                              <span>{new Date(m.startDate).toLocaleDateString()}</span>
                              <ArrowRight size={12} color="var(--text-muted)" />
                              <span>{new Date(m.endDate).toLocaleDateString()}</span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Not scheduled</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>{m.estimatedHours}h</td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <img src={getAssigneeAvatar(m.assigneeId)} alt="Avatar" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                            <span>{getAssigneeName(m.assigneeId)}</span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: getPriorityColor(m.priority), color: 'white' }}>
                            {m.priority}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 600, color: progress === 100 ? 'var(--accent-secondary)' : 'var(--text-primary)' }}>
                              {progress}%
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              ({m.status})
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="glass-panel flex-center" style={{ minHeight: '300px', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No active projects found. Please create a project first.</p>
        </div>
      )}
    </div>
  );
};
