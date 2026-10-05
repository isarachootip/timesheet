import React from 'react';
import { Calendar, Clock, Check, Trash2, Edit3, AlertCircle, Pin } from 'lucide-react';
import type { PersonalNote } from '../../types';
import { COLOR_THEMES, getDueStatus } from './noteUtils';
import { formatToDDMMYYYY } from '../../utils';

interface PostItCardProps {
  note: PersonalNote;
  onToggle: (id: string) => void;
  onEdit: (note: PersonalNote) => void;
  onDelete: (id: string) => void;
}

export const PostItCard: React.FC<PostItCardProps> = ({ note, onToggle, onEdit, onDelete }) => {
  const theme = COLOR_THEMES[note.color || 'yellow'];
  const dueStatus = getDueStatus(note.dueDate, note.isCompleted);

  const getDueBadge = () => {
    if (note.isCompleted) {
      return (
        <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          <Check size={12} /> เสร็จสิ้น
        </span>
      );
    }
    if (dueStatus === 'overdue') {
      return (
        <span style={{ fontSize: '0.72rem', color: '#dc2626', background: 'rgba(239,68,68,0.15)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          <AlertCircle size={12} /> เลยกำหนด
        </span>
      );
    }
    if (dueStatus === 'due-today') {
      return (
        <span style={{ fontSize: '0.72rem', color: '#d97706', background: 'rgba(245,158,11,0.18)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
          ⚡ ครบกำหนดวันนี้
        </span>
      );
    }
    if (dueStatus === 'due-soon') {
      return (
        <span style={{ fontSize: '0.72rem', color: '#ea580c', background: 'rgba(234,88,12,0.15)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
          ใกล้ถึงกำหนด
        </span>
      );
    }
    return null;
  };

  return (
    <div
      style={{
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        borderRadius: '10px',
        padding: '1.15rem 1.15rem 0.9rem',
        position: 'relative',
        boxShadow: '0 8px 20px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        minHeight: '190px',
        color: theme.textColor,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        opacity: note.isCompleted ? 0.75 : 1,
      }}
      className="hover-lift"
    >
      {/* Decorative semi-transparent tape strip on top */}
      <div
        style={{
          position: 'absolute',
          top: '-8px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '70px',
          height: '16px',
          background: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(2px)',
          borderRadius: '2px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      />

      {/* Header: Note Date & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', opacity: 0.85, fontWeight: 500 }}>
          <Calendar size={13} />
          <span>วันที่: {formatToDDMMYYYY(note.noteDate)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-floating-note', { detail: { noteId: note.id } }));
            }}
            title="ปักหมุดลอยบนหน้าจอ"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', color: theme.textColor, opacity: 0.75 }}
          >
            <Pin size={15} />
          </button>
          <button
            onClick={() => onEdit(note)}
            title="แก้ไข"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', color: theme.textColor, opacity: 0.7 }}
          >
            <Edit3 size={15} />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            title="ลบ"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', color: '#ef4444', opacity: 0.85 }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Title & Checkbox */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <button
          onClick={() => onToggle(note.id)}
          title={note.isCompleted ? 'ทำเครื่องหมายว่ายังไม่เสร็จ' : 'ทำเครื่องหมายว่าเสร็จแล้ว'}
          style={{
            marginTop: '2px',
            width: '20px',
            height: '20px',
            borderRadius: '5px',
            border: `2px solid ${note.isCompleted ? '#16a34a' : theme.accent}`,
            background: note.isCompleted ? '#16a34a' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            padding: 0,
          }}
        >
          {note.isCompleted && <Check size={14} color="#fff" strokeWidth={3} />}
        </button>
        <h4
          style={{
            margin: 0,
            fontSize: '1rem',
            fontWeight: 700,
            lineHeight: 1.35,
            wordBreak: 'break-word',
            textDecoration: note.isCompleted ? 'line-through' : 'none',
            color: note.isCompleted ? '#6b7280' : theme.textColor,
          }}
        >
          {note.title}
        </h4>
      </div>

      {/* Content / Memo */}
      {note.content && (
        <p
          style={{
            margin: 0,
            fontSize: '0.86rem',
            lineHeight: 1.45,
            opacity: 0.9,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            flex: 1,
          }}
        >
          {note.content}
        </p>
      )}

      {/* Footer: Due date */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: '0.5rem',
          borderTop: `1px dashed ${theme.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem', fontWeight: 600 }}>
          <Clock size={13} />
          <span>กำหนด: {note.dueDate ? formatToDDMMYYYY(note.dueDate) : 'ไม่ระบุ'}</span>
        </div>
        {getDueBadge()}
      </div>
    </div>
  );
};
