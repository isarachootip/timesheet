import React from 'react';
import { CheckSquare, X } from 'lucide-react';
import type { PermissionScheme, PersonalNote, Project, Sprint, Task, TaskPriority, User } from '../../types';
import { useConvertNoteToTaskForm } from './useConvertNoteToTaskForm';

interface ConvertNoteToTaskModalProps {
  isOpen: boolean;
  note: PersonalNote | null;
  onClose: () => void;
  currentUser: User;
  projects: Project[];
  permissionSchemes: PermissionScheme[];
  tasks: Task[];
  sprints: Sprint[];
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.55rem 0.75rem',
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  fontSize: '0.85rem',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: '0.3rem',
};

export const ConvertNoteToTaskModal: React.FC<ConvertNoteToTaskModalProps> = (props) => {
  const { isOpen, note, onClose } = props;
  const form = useConvertNoteToTaskForm(props);

  if (!isOpen || !note) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay-backdrop)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
      <div className="surface-card" style={{ width: '100%', maxWidth: '520px', borderRadius: 'var(--radius-md)', padding: '22px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckSquare size={18} color="var(--accent-primary)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>แปลง Post-it เป็น Task โครงการ</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ผูกงานเข้ากับโครงการและ Sprint (โน้ตจะยังเปิดไว้เพื่อกดลงเวลาต่อได้)</span>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={18} />
          </button>
        </div>

        {form.errorMsg && (
          <div style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '0.9rem' }}>
            {form.errorMsg}
          </div>
        )}

        <form onSubmit={form.handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <label style={labelStyle}>โครงการ (Project) *</label>
            <select
              data-testid="convert-task-project-select"
              value={form.projectId}
              onChange={(e) => form.setProjectId(e.target.value)}
              style={fieldStyle}
              required
            >
              {form.availableProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Milestone หลัก (ถ้ามี)</label>
              <select value={form.parentId} onChange={(e) => form.setParentId(e.target.value)} style={fieldStyle}>
                <option value="">-- งานระดับหลัก --</option>
                {form.projectMilestones.map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Sprint (ถ้ามี)</label>
              <select
                data-testid="convert-task-sprint-select"
                value={form.sprintId}
                onChange={(e) => form.setSprintId(e.target.value)}
                style={fieldStyle}
              >
                <option value="">-- Backlog (ไม่ระบุ) --</option>
                {form.projectSprints.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>ชื่องาน (Task Title) *</label>
            <input type="text" value={form.title} onChange={(e) => form.setTitle(e.target.value)} style={fieldStyle} required />
          </div>

          <div>
            <label style={labelStyle}>รายละเอียด</label>
            <textarea rows={2} value={form.description} onChange={(e) => form.setDescription(e.target.value)} style={{ ...fieldStyle, resize: 'vertical' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>ความสำคัญ</label>
              <select value={form.priority} onChange={(e) => form.setPriority(e.target.value as TaskPriority)} style={fieldStyle}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>ชม. ประเมิน</label>
              <input type="number" min="0" step="0.5" value={form.estimatedHours} onChange={(e) => form.setEstimatedHours(e.target.value)} style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>กำหนดส่ง</label>
              <input type="date" value={form.endDate} onChange={(e) => form.setEndDate(e.target.value)} style={fieldStyle} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.4rem' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.55rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}>
              ยกเลิก
            </button>
            <button
              type="submit"
              data-testid="btn-submit-convert-task"
              disabled={form.isSubmitting || form.availableProjects.length === 0}
              className="btn-primary"
              style={{ padding: '0.55rem 1.15rem', borderRadius: 'var(--radius-sm)', cursor: form.isSubmitting ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
            >
              {form.isSubmitting ? 'กำลังสร้าง...' : 'สร้าง Task และผูกโน้ต'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
