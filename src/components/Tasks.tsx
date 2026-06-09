import { useState } from 'react';
import type { Task, TaskStatus, TaskPriority } from '../types';
import { mockTasks, mockProjects, mockUsers } from '../data/mockData';
import { Plus, Filter, Clock } from 'lucide-react';

export const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [selectedProject, setSelectedProject] = useState<string>('all');

  const statuses: TaskStatus[] = ['To Do', 'In Progress', 'Review', 'Done'];

  const filteredTasks = selectedProject === 'all' 
    ? tasks 
    : tasks.filter(t => t.projectId === selectedProject);

  const getProjectName = (id: string) => {
    return mockProjects.find(p => p.id === id)?.name || 'Unknown Project';
  };

  const getUserAvatar = (id?: string) => {
    if (!id) return 'https://i.pravatar.cc/150?u=unassigned';
    return mockUsers.find(u => u.id === id)?.avatar || 'https://i.pravatar.cc/150?u=unassigned';
  };

  const getUserName = (id?: string) => {
    if (!id) return 'Unassigned';
    return mockUsers.find(u => u.id === id)?.name || 'Unknown User';
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'Urgent': return 'var(--accent-danger)';
      case 'High': return 'var(--accent-warning)';
      case 'Medium': return 'var(--accent-info)';
      default: return 'var(--text-muted)';
    }
  };

  // Move task helper for interactivity
  const moveTask = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
      {/* Top Bar */}
      <div className="flex-between">
        <div>
          <h1 className="text-gradient" style={{ marginBottom: '0.5rem' }}>Tasks</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track and manage project tasks across different stages.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="glass-panel" style={{ padding: '0.25rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="var(--text-secondary)" />
            <select 
              value={selectedProject} 
              onChange={(e) => setSelectedProject(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
            >
              <option value="all" style={{ background: 'var(--bg-secondary)' }}>All Projects</option>
              {mockProjects.map(p => (
                <option key={p.id} value={p.id} style={{ background: 'var(--bg-secondary)' }}>{p.name}</option>
              ))}
            </select>
          </div>
          <button style={{ 
            background: 'var(--accent-primary)', 
            color: 'white', 
            border: 'none', 
            padding: '0.75rem 1.5rem', 
            borderRadius: 'var(--radius-md)', 
            fontWeight: 500, 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }} className="hover-lift">
            <Plus size={18} /> Add Task
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '1.25rem', 
        flex: 1, 
        overflowX: 'auto',
        alignItems: 'start'
      }}>
        {statuses.map(status => {
          const statusTasks = filteredTasks.filter(t => t.status === status);
          return (
            <div key={status} className="glass-panel" style={{ 
              padding: '1.25rem', 
              background: 'rgba(22, 26, 34, 0.4)', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem',
              maxHeight: 'calc(100vh - 240px)',
              overflowY: 'auto'
            }}>
              {/* Column Header */}
              <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 600 }}>{status}</span>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    padding: '0.1rem 0.5rem', 
                    borderRadius: 'var(--radius-full)', 
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)'
                  }}>
                    {statusTasks.length}
                  </span>
                </div>
              </div>

              {/* Task Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {statusTasks.map(task => (
                  <div key={task.id} className="glass-panel hover-lift" style={{ 
                    padding: '1rem', 
                    background: 'var(--bg-secondary)', 
                    borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
                    cursor: 'grab'
                  }}>
                    <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{getProjectName(task.projectId)}</span>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 600, 
                        color: getPriorityColor(task.priority),
                        textTransform: 'uppercase'
                      }}>
                        {task.priority}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '0.925rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                      {task.title}
                    </h4>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {task.description}
                    </p>

                    <div className="flex-between" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={12} /> {task.estimatedHours}h
                        </span>
                      </div>
                      
                      {/* User Avatar & Simple Interaction Button */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <select 
                          value={task.status} 
                          onChange={(e) => moveTask(task.id, e.target.value as TaskStatus)}
                          style={{
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-secondary)',
                            fontSize: '0.7rem',
                            padding: '0.1rem 0.25rem',
                            borderRadius: 'var(--radius-sm)',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          {statuses.map(st => <option key={st} value={st}>{st}</option>)}
                        </select>
                        <img 
                          src={getUserAvatar(task.assigneeId)} 
                          alt={getUserName(task.assigneeId)}
                          title={getUserName(task.assigneeId)}
                          style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
