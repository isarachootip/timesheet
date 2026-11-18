import React from 'react';
import { Check, Clock } from 'lucide-react';
import type { PersonalNote } from '../../types';
import { COLOR_THEMES, getDueStatus, isProjectNote } from './noteUtils';
import { PostItCardActions } from './PostItCardActions';
import { PostItDueBadge } from './PostItDueBadge';
import { PostItProjectBadge } from './PostItProjectBadge';
import { formatToDDMMYYYY } from '../../utils';

interface PostItCardProps {
  note: PersonalNote;
  projectName?: string;
  taskTitle?: string;
  canConvertToTask?: boolean;
  onToggle: (id: string) => void;
  onEdit: (note: PersonalNote) => void;
  onDelete: (id: string) => void;
  onImportToTimesheet?: (note: PersonalNote) => void;
  onConvertToTask?: (note: PersonalNote) => void;
}

export const PostItCard: React.FC<PostItCardProps> = ({
  note,
  projectName,
  taskTitle,
  canConvertToTask = false,
  onToggle,
  onEdit,
  onDelete,
  onImportToTimesheet,
  onConvertToTask,
}) => {
  const theme = COLOR_THEMES[note.color || 'yellow'];
  const dueStatus = getDueStatus(note.dueDate, note.isCompleted);
  const isProject = isProjectNote(note);
  const canImportTimesheet = isProject && !note.timesheetId;

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
      <div
        style={{
          position: 'absolute',
          top: '-8px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '70px',
          height: '16px',
          background: 'rgba(255, 255, 255, 0.45)',
          borderRadius: '2px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      />

      <PostItCardActions
        note={note}
        textColor={theme.textColor}
        canConvertToTask={canConvertToTask}
        canImportTimesheet={canImportTimesheet}
        onConvertToTask={onConvertToTask}
        onImportToTimesheet={onImportToTimesheet}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      <PostItProjectBadge
        isProject={isProject}
        projectName={projectName}
        taskTitle={taskTitle}
        isLogged={Boolean(note.timesheetId)}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <button
          type="button"
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

      {note.content && (
        <p style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.45, opacity: 0.9, whiteSpace: 'pre-wrap', wordBreak: 'break-word', flex: 1 }}>
          {note.content}
        </p>
      )}

      <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: `1px dashed ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem', fontWeight: 600 }}>
          <Clock size={13} />
          <span>กำหนด: {note.dueDate ? formatToDDMMYYYY(note.dueDate) : 'ไม่ระบุ'}</span>
        </div>
        <PostItDueBadge dueStatus={dueStatus} isCompleted={note.isCompleted} />
      </div>
    </div>
  );
};
