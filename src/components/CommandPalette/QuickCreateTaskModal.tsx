import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Project, Task, TaskPriority, User } from '../../types';
import { toast } from '../ui/ToastProvider';

interface QuickCreateTaskModalProps {
  open: boolean;
  projects: Project[];
  users: User[];
  currentUser: User | null;
  onCreateTask: (task: Task) => void;
  onClose: () => void;
}

export const QuickCreateTaskModal: React.FC<QuickCreateTaskModalProps> = ({
  open,
  projects,
  users,
  currentUser,
  onCreateTask,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState(() => projects[0]?.id || '');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [assigneeId, setAssigneeId] = useState(() => currentUser?.id || '');
  const [estimatedHours, setEstimatedHours] = useState('4');
  const [endDate, setEndDate] = useState('');

  if (!open) return null;

  const activeProjectId = projects.some((p) => p.id === projectId) ? projectId : projects[0]?.id || '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a task title.');
      return;
    }
    if (!activeProjectId) {
      toast.error('No permitted project selected.');
      return;
    }
    const newTask: Task = {
      id: `t_${Date.now()}`,
      projectId: activeProjectId,
      assigneeId: assigneeId || undefined,
      title: title.trim(),
      description: '',
      status: 'To Do',
      priority,
      estimatedHours: Number(estimatedHours) || 4,
      createdAt: new Date().toISOString(),
      endDate: endDate || undefined,
      issueType: 'Task',
    };
    onCreateTask(newTask);
    toast.success(`Task "${newTask.title}" created`);
    setTitle('');
    setEndDate('');
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 'var(--fs-14)',
    outline: 'none',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Quick create task"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--overlay-backdrop)',
        zIndex: 1150,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="surface-card"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '480px', padding: '20px', boxShadow: 'var(--shadow-lg)' }}
      >
        <div className="flex-between" style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: 'var(--fs-16)', fontWeight: 600 }}>Create Task</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close create task modal"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--fs-13)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Task Title
            </label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fix login validation edge case"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--fs-13)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Project
              </label>
              <select value={activeProjectId} onChange={(e) => setProjectId(e.target.value)} style={inputStyle}>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--fs-13)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Priority
              </label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} style={inputStyle}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--fs-13)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Assignee
              </label>
              <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} style={inputStyle}>
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--fs-13)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Est. Hours
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--fs-13)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Due Date
              </label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: 'var(--fs-13)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--accent-contrast)',
                fontSize: 'var(--fs-13)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
