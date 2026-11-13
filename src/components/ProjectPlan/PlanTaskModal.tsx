import React from 'react';
import { X } from 'lucide-react';
import type { Project, Task, TaskPriority, TaskStatus, User } from '../../types';
import { CustomDateInput } from '../CustomDateInput';
import {
  planFieldStyle,
  planLabelStyle,
  planModalOverlayStyle,
  planPrimaryBtnStyle,
  planSecondaryBtnStyle,
} from './planStyles';

export interface PlanTaskFormState {
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedHours: string;
  assigneeId: string;
  startDate: string;
  endDate: string;
  isMain: boolean;
  parentId: string;
}

interface PlanTaskModalProps {
  open: boolean;
  editingTask: Task | null;
  form: PlanTaskFormState;
  visibleProjects: Project[];
  milestonesInFormProject: Task[];
  users: User[];
  onChange: (patch: Partial<PlanTaskFormState>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const PlanTaskModal: React.FC<PlanTaskModalProps> = ({
  open,
  editingTask,
  form,
  visibleProjects,
  milestonesInFormProject,
  users,
  onChange,
  onSubmit,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label={editingTask ? 'Edit Plan Task' : 'New Plan Task'} onClick={onClose} style={planModalOverlayStyle}>
      <div
        className="surface-card"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', padding: '20px', boxShadow: 'var(--shadow-lg)' }}
      >
        <div className="flex-between" style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: 'var(--fs-16)', fontWeight: 600, color: 'var(--text-primary)' }}>
            {editingTask ? 'Edit Plan Task' : form.isMain ? 'New Milestone' : 'New Subtask'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {!editingTask && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {([true, false] as const).map((isMainOption) => {
                const active = form.isMain === isMainOption;
                return (
                  <button
                    key={String(isMainOption)}
                    type="button"
                    onClick={() => onChange({ isMain: isMainOption, parentId: isMainOption ? '' : milestonesInFormProject[0]?.id || '' })}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                      backgroundColor: active ? 'var(--accent-subtle)' : 'var(--bg-primary)',
                      color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontSize: 'var(--fs-13)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {isMainOption ? 'Main Milestone' : 'Subtask'}
                  </button>
                );
              })}
            </div>
          )}

          {!editingTask && visibleProjects.length > 0 && (
            <div>
              <label style={planLabelStyle}>Project</label>
              <select
                value={form.projectId}
                onChange={(e) => onChange({ projectId: e.target.value, parentId: '' })}
                style={planFieldStyle}
                required
              >
                {visibleProjects.filter((p) => p.projectType !== 'support').map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {!form.isMain && (
            <div>
              <label style={planLabelStyle}>Parent Milestone</label>
              <select value={form.parentId} onChange={(e) => onChange({ parentId: e.target.value })} style={planFieldStyle} required>
                <option value="">Select milestone...</option>
                {milestonesInFormProject.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </div>
          )}

          <div>
            <label style={planLabelStyle}>Title *</label>
            <input type="text" value={form.title} onChange={(e) => onChange({ title: e.target.value })} style={planFieldStyle} required />
          </div>

          <div>
            <label style={planLabelStyle}>Description</label>
            <textarea value={form.description} onChange={(e) => onChange({ description: e.target.value })} rows={2} style={{ ...planFieldStyle, resize: 'vertical' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={planLabelStyle}>Status</label>
              <select value={form.status} onChange={(e) => onChange({ status: e.target.value as TaskStatus })} style={planFieldStyle}>
                {(['To Do', 'In Progress', 'Review', 'Done'] as TaskStatus[]).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={planLabelStyle}>Priority</label>
              <select value={form.priority} onChange={(e) => onChange({ priority: e.target.value as TaskPriority })} style={planFieldStyle}>
                {(['Low', 'Medium', 'High', 'Urgent'] as TaskPriority[]).map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={planLabelStyle}>Estimated Hours</label>
              <input type="number" min="0" step="0.5" value={form.estimatedHours} onChange={(e) => onChange({ estimatedHours: e.target.value })} style={planFieldStyle} />
            </div>
            <div>
              <label style={planLabelStyle}>Assignee</label>
              <select value={form.assigneeId} onChange={(e) => onChange({ assigneeId: e.target.value })} style={planFieldStyle}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={planLabelStyle}>Start Date</label>
              <CustomDateInput value={form.startDate} onChange={(e) => onChange({ startDate: e.target.value })} style={planFieldStyle} />
            </div>
            <div>
              <label style={planLabelStyle}>End Date</label>
              <CustomDateInput value={form.endDate} onChange={(e) => onChange({ endDate: e.target.value })} style={planFieldStyle} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={planSecondaryBtnStyle}>Cancel</button>
            <button type="submit" style={planPrimaryBtnStyle}>{editingTask ? 'Save Changes' : 'Create Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
