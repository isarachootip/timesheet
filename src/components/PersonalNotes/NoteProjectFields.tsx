import React, { useMemo } from 'react';
import { Briefcase, UserCheck } from 'lucide-react';
import type { NoteWorkType, Project, Task, User } from '../../types';

interface NoteProjectFieldsProps {
  workType: NoteWorkType;
  setWorkType: (wt: NoteWorkType) => void;
  projectId: string;
  setProjectId: (id: string) => void;
  taskId: string;
  setTaskId: (id: string) => void;
  projects: Project[];
  tasks: Task[];
  currentUser?: User;
}

export const NoteProjectFields: React.FC<NoteProjectFieldsProps> = ({
  workType,
  setWorkType,
  projectId,
  setProjectId,
  taskId,
  setTaskId,
  projects,
  tasks,
  currentUser,
}) => {
  const availableProjects = useMemo(() => {
    if (!currentUser || currentUser.globalRole === 'Admin' || currentUser.globalRole === 'Manager') {
      return projects;
    }
    return projects.filter((p) => p.members?.some((m) => m.userId === currentUser.id));
  }, [projects, currentUser]);

  const availableTasks = useMemo(() => {
    if (!projectId) return [];
    return tasks.filter((t) => {
      if (t.projectId !== projectId) return false;
      if (!currentUser || currentUser.globalRole === 'Admin' || currentUser.globalRole === 'Manager') return true;
      return !t.assigneeId || t.assigneeId === currentUser.id;
    });
  }, [tasks, projectId, currentUser]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
        ประเภทงาน (Work Type) *
      </label>

      {/* Segmented Control */}
      <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-tertiary)', padding: '3px', borderRadius: '8px' }}>
        <button
          type="button"
          onClick={() => { setWorkType('personal'); setProjectId(''); setTaskId(''); }}
          style={{
            flex: 1, padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem',
            fontWeight: workType === 'personal' ? 700 : 500,
            background: workType === 'personal' ? '#eab308' : 'transparent',
            color: workType === 'personal' ? '#713f12' : 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
          }}
        >
          <UserCheck size={14} /> งานส่วนตัว / ทั่วไป
        </button>

        <button
          type="button"
          onClick={() => {
            setWorkType('project');
            if (!projectId && availableProjects.length > 0) setProjectId(availableProjects[0].id);
          }}
          style={{
            flex: 1, padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem',
            fontWeight: workType === 'project' ? 700 : 500,
            background: workType === 'project' ? 'var(--accent-primary)' : 'transparent',
            color: workType === 'project' ? '#fff' : 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
          }}
        >
          <Briefcase size={14} /> งานโครงการ (Project)
        </button>
      </div>

      {/* Project & Task Dropdowns */}
      {workType === 'project' && (
        <div style={{ display: 'grid', gridTemplateColumns: availableTasks.length > 0 ? '1fr 1fr' : '1fr', gap: '0.65rem' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
              <Briefcase size={13} /> โครงการ (Project) *
            </label>
            <select
              value={projectId}
              onChange={(e) => { setProjectId(e.target.value); setTaskId(''); }}
              required
              style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem' }}
            >
              <option value="">-- เลือกโครงการ --</option>
              {availableProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {availableTasks.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                งานย่อย (Task - ตัวเลือกเสริม)
              </label>
              <select
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem' }}
              >
                <option value="">-- ไม่ระบุงานย่อย --</option>
                {availableTasks.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default NoteProjectFields;
