import { useState } from 'react';
import type { Task, TaskStatus, TaskPriority, Project, User } from '../types';
import { Plus, Filter, Clock, X, Edit, Trash2 } from 'lucide-react';

interface TasksProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  projects: Project[];
  users: User[];
}

export const Tasks = ({ tasks, setTasks, projects, users }: TasksProps) => {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('To Do');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [projectId, setProjectId] = useState('');

  const statuses: TaskStatus[] = ['To Do', 'In Progress', 'Review', 'Done'];

  const filteredTasks = selectedProject === 'all' 
    ? tasks 
    : tasks.filter(t => t.projectId === selectedProject);

  const getProjectName = (id: string) => {
    return projects.find(p => p.id === id)?.name || 'Unknown Project';
  };

  const getUserAvatar = (id?: string) => {
    if (!id) return 'https://i.pravatar.cc/150?u=unassigned';
    return users.find(u => u.id === id)?.avatar || 'https://i.pravatar.cc/150?u=unassigned';
  };

  const getUserName = (id?: string) => {
    if (!id) return 'Unassigned';
    return users.find(u => u.id === id)?.name || 'Unknown User';
  };

  const getPriorityColor = (prio: TaskPriority) => {
    switch (prio) {
      case 'Urgent': return 'var(--accent-danger)';
      case 'High': return 'var(--accent-warning)';
      case 'Medium': return 'var(--accent-info)';
      default: return 'var(--text-muted)';
    }
  };

  const openAddModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setStatus('To Do');
    setPriority('Medium');
    setEstimatedHours('');
    setAssigneeId('');
    setProjectId(projects[0]?.id || '');
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setStatus(task.status);
    setPriority(task.priority);
    setEstimatedHours(String(task.estimatedHours));
    setAssigneeId(task.assigneeId || '');
    setProjectId(task.projectId);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !projectId) return alert('Title and Project are required');

    const taskData: Task = {
      id: editingTask ? editingTask.id : 't_' + Date.now(),
      projectId,
      title,
      description,
      status,
      priority,
      estimatedHours: estimatedHours ? Number(estimatedHours) : 0,
      assigneeId: assigneeId || undefined,
      createdAt: editingTask ? editingTask.createdAt : new Date().toISOString()
    };

    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? taskData : t));
    } else {
      setTasks(prev => [...prev, taskData]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

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
              {projects.map(p => (
                <option key={p.id} value={p.id} style={{ background: 'var(--bg-secondary)' }}>{p.name}</option>
              ))}
            </select>
          </div>
          <button onClick={openAddModal} style={{ 
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
      <div className="kanban-board" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '1.25rem', 
        flex: 1, 
        overflowX: 'auto',
        alignItems: 'start'
      }}>
        {statuses.map(colStatus => {
          const statusTasks = filteredTasks.filter(t => t.status === colStatus);
          return (
            <div key={colStatus} className="glass-panel kanban-column" style={{ 
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
                  <span style={{ fontWeight: 600 }}>{colStatus}</span>
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
                    borderLeft: `4px solid ${getPriorityColor(task.priority)}`
                  }}>
                    <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{getProjectName(task.projectId)}</span>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button onClick={() => openEditModal(task)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}>
                          <Edit size={12} />
                        </button>
                        <button onClick={() => handleDelete(task.id)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: 0 }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
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
                      
                      {/* Move Quick Actions & Assignee */}
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

      {/* Task Add/Edit Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99
        }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '550px', maxWidth: '95%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="flex-between">
              <h2 className="text-gradient" style={{ fontSize: '1.5rem' }}>{editingTask ? 'Edit Task' : 'Add New Task'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Task Title *</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', color: 'var(--text-primary)', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Description</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', color: 'var(--text-primary)', outline: 'none', minHeight: '60px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Project *</label>
                <select 
                  value={projectId} 
                  onChange={e => setProjectId(e.target.value)}
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem', color: 'var(--text-primary)', outline: 'none' }}
                  required
                >
                  <option value="">Select Project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Status</label>
                  <select 
                    value={status} 
                    onChange={e => setStatus(e.target.value as TaskStatus)}
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    {statuses.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Priority</label>
                  <select 
                    value={priority} 
                    onChange={e => setPriority(e.target.value as TaskPriority)}
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Assignee</label>
                  <select 
                    value={assigneeId} 
                    onChange={e => setAssigneeId(e.target.value)}
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Est. Hours</label>
                  <input 
                    type="number" 
                    value={estimatedHours} 
                    onChange={e => setEstimatedHours(e.target.value)} 
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <button type="submit" style={{ 
                background: 'var(--accent-primary)', 
                color: 'white', 
                border: 'none', 
                padding: '0.75rem', 
                borderRadius: 'var(--radius-md)', 
                fontWeight: 600, 
                cursor: 'pointer',
                marginTop: '1rem'
              }} className="hover-lift">
                Save Task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
