import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, FileText } from 'lucide-react';
import type { PersonalNote, PostItColor, NoteWorkType, Project, Task, User } from '../../types';
import { NoteProjectFields } from './NoteProjectFields';
import { NoteColorPicker } from './NoteColorPicker';

interface NoteModalProps {
  isOpen: boolean;
  noteToEdit?: PersonalNote | null;
  onClose: () => void;
  onSave: (data: Partial<PersonalNote> & { title: string; noteDate: string }) => Promise<void>;
  projects?: Project[];
  tasks?: Task[];
  currentUser?: User;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  noteToEdit,
  onClose,
  onSave,
  projects = [],
  tasks = [],
  currentUser,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteDate, setNoteDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [color, setColor] = useState<PostItColor>('yellow');
  const [workType, setWorkType] = useState<NoteWorkType>('personal');
  const [projectId, setProjectId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (noteToEdit) {
      setTitle(noteToEdit.title);
      setContent(noteToEdit.content || '');
      setNoteDate(noteToEdit.noteDate);
      setDueDate(noteToEdit.dueDate || '');
      setColor(noteToEdit.color || 'yellow');
      setWorkType(noteToEdit.workType || (noteToEdit.projectId ? 'project' : 'personal'));
      setProjectId(noteToEdit.projectId || '');
      setTaskId(noteToEdit.taskId || '');
    } else {
      setTitle('');
      setContent('');
      setNoteDate(new Date().toISOString().split('T')[0]);
      setDueDate('');
      setColor('yellow');
      setWorkType('personal');
      setProjectId('');
      setTaskId('');
    }
  }, [noteToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !noteDate) return;
    if (workType === 'project' && !projectId) {
      alert('กรุณาเลือกโครงการสำหรับงานประเภท Project');
      return;
    }
    setLoading(true);
    try {
      await onSave({
        id: noteToEdit?.id,
        title: title.trim(),
        content: content.trim(),
        noteDate,
        dueDate: dueDate || undefined,
        color,
        isCompleted: noteToEdit?.isCompleted || false,
        workType,
        projectId: workType === 'project' ? projectId : undefined,
        taskId: workType === 'project' ? (taskId || undefined) : undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', maxWidth: '480px', width: '100%', padding: '1.75rem', border: '1px solid var(--border-color)', boxShadow: '0 20px 60px rgba(0,0,0,0.45)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }} className="text-gradient">
            {noteToEdit ? 'แก้ไข Post-it' : 'เขียน Post-it ใหม่'}
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              เรื่อง (Subject / Task) *
            </label>
            <input
              type="text"
              required
              placeholder="เช่น ส่งเอกสารรายงาน, โทรนัดลูกค้า"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.85rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>

          <NoteProjectFields
            workType={workType}
            setWorkType={setWorkType}
            projectId={projectId}
            setProjectId={setProjectId}
            taskId={taskId}
            setTaskId={setTaskId}
            projects={projects}
            tasks={tasks}
            currentUser={currentUser}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                <Calendar size={14} /> วันที่ *
              </label>
              <input
                type="date"
                required
                value={noteDate}
                onChange={(e) => setNoteDate(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                <Clock size={14} /> กำหนดแล้วเสร็จ
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              <FileText size={14} /> รายละเอียดบันทึกช่วยจำ
            </label>
            <textarea
              rows={3}
              placeholder="เพิ่มรายละเอียดข้อความ หรือสิ่งที่ต้องเตรียม..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.85rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }}
            />
          </div>

          <NoteColorPicker color={color} setColor={setColor} />

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              ยกเลิก
            </button>
            <button type="submit" disabled={loading} style={{ flex: 2, padding: '0.65rem', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--accent-primary)', color: 'white', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'กำลังบันทึก...' : 'บันทึก Post-it'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
