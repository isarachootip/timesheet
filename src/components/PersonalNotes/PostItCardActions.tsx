import React from 'react';
import { Calendar, CheckSquare, Clock, Edit3, Pin, Trash2 } from 'lucide-react';
import type { PersonalNote } from '../../types';
import { formatToDDMMYYYY } from '../../utils';

interface PostItCardActionsProps {
  note: PersonalNote;
  textColor: string;
  canConvertToTask?: boolean;
  canImportTimesheet: boolean;
  onConvertToTask?: (note: PersonalNote) => void;
  onImportToTimesheet?: (note: PersonalNote) => void;
  onEdit: (note: PersonalNote) => void;
  onDelete: (id: string) => void;
}

export const PostItCardActions: React.FC<PostItCardActionsProps> = ({
  note,
  textColor,
  canConvertToTask = false,
  canImportTimesheet,
  onConvertToTask,
  onImportToTimesheet,
  onEdit,
  onDelete,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', flexWrap: 'wrap' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', opacity: 0.85, fontWeight: 500 }}>
      <Calendar size={13} />
      <span>วันที่: {formatToDDMMYYYY(note.noteDate)}</span>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      {canConvertToTask && onConvertToTask && (
        <button
          type="button"
          data-testid="btn-convert-note-task"
          onClick={() => onConvertToTask(note)}
          title="แปลง Post-it นี้เป็น Task ในโครงการ"
          style={{
            background: 'rgba(37, 99, 235, 0.14)',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: 'var(--radius-sm)',
            color: '#1d4ed8',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: 'var(--fs-12)',
            fontWeight: 600,
          }}
        >
          <CheckSquare size={12} />
          <span>สร้าง Task</span>
        </button>
      )}

      {canImportTimesheet && onImportToTimesheet && (
        <button
          type="button"
          onClick={() => onImportToTimesheet(note)}
          title="นำเข้าสู่ Timesheet ประจำวัน"
          style={{
            background: 'rgba(6, 199, 85, 0.15)',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: 'var(--radius-sm)',
            color: '#15803d',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: 'var(--fs-12)',
            fontWeight: 600,
          }}
        >
          <Clock size={12} />
          <span>ลงเวลา</span>
        </button>
      )}

      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent('open-floating-note', { detail: { noteId: note.id } }))}
        title="ปักหมุดลอยบนหน้าจอ"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', color: textColor, opacity: 0.75 }}
      >
        <Pin size={15} />
      </button>
      <button
        type="button"
        onClick={() => onEdit(note)}
        title="แก้ไข"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', color: textColor, opacity: 0.7 }}
      >
        <Edit3 size={15} />
      </button>
      <button
        type="button"
        onClick={() => onDelete(note.id)}
        title="ลบ"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', color: '#ef4444', opacity: 0.85 }}
      >
        <Trash2 size={15} />
      </button>
    </div>
  </div>
);
