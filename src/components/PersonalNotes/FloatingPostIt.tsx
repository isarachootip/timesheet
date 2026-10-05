import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { StickyNote, X, Minus, ChevronLeft, ChevronRight, Check, Calendar, Clock, AlertCircle } from 'lucide-react';
import type { User } from '../../types';
import { usePersonalNotes } from '../../hooks/usePersonalNotes';
import { useFloatingNotes } from '../../hooks/useFloatingNotes';
import { COLOR_THEMES, getDueStatus } from './noteUtils';
import { formatToDDMMYYYY } from '../../utils';

interface FloatingPostItProps {
  currentUser: User;
}

export const FloatingPostIt: React.FC<FloatingPostItProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { notes, toggleNote } = usePersonalNotes(currentUser.id);

  const displayNotes = useMemo(() => {
    const active = notes.filter((n) => !n.isCompleted);
    return active.length > 0 ? active : notes;
  }, [notes]);

  const noteIds = useMemo(() => displayNotes.map((n) => n.id), [displayNotes]);

  const {
    isOpen, isMinimized, activeNoteId, setActiveNoteId, closeNote, toggleOpen, toggleMinimize
  } = useFloatingNotes(noteIds);

  const activeIndex = displayNotes.findIndex((n) => n.id === activeNoteId);
  const currentNote = activeIndex >= 0 ? displayNotes[activeIndex] : displayNotes[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIndex > 0) setActiveNoteId(displayNotes[activeIndex - 1].id);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIndex < displayNotes.length - 1) setActiveNoteId(displayNotes[activeIndex + 1].id);
  };

  const theme = COLOR_THEMES[currentNote?.color || 'yellow'];
  const dueStatus = currentNote ? getDueStatus(currentNote.dueDate, currentNote.isCompleted) : 'none';

  return (
    <>
      {/* 1. Floating Post-it Card */}
      {isOpen && currentNote && !isMinimized && (
        <div
          style={{
            position: 'fixed', bottom: '95px', right: '24px', width: '320px', maxWidth: 'calc(100vw - 36px)',
            background: theme.bg, border: `1.5px solid ${theme.border}`, borderRadius: '12px',
            padding: '1rem', boxShadow: '0 16px 36px rgba(0,0,0,0.28)', zIndex: 9990,
            display: 'flex', flexDirection: 'column', gap: '0.65rem', color: theme.textColor,
          }}
        >
          <div style={{ position: 'absolute', top: '-9px', left: '50%', transform: 'translateX(-50%)', width: '75px', height: '18px', background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(3px)', borderRadius: '3px' }} />

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px dashed ${theme.border}`, paddingBottom: '0.45rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 700 }}>
              <StickyNote size={14} color={theme.accent} />
              <span>Post-it ช่วยจำ</span>
              {displayNotes.length > 1 && <span style={{ opacity: 0.7, fontWeight: 500 }}>({activeIndex + 1}/{displayNotes.length})</span>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              {displayNotes.length > 1 && (
                <>
                  <button onClick={handlePrev} disabled={activeIndex <= 0} style={{ background: 'transparent', border: 'none', cursor: activeIndex <= 0 ? 'default' : 'pointer', opacity: activeIndex <= 0 ? 0.3 : 0.8, padding: '2px', color: theme.textColor }}><ChevronLeft size={16} /></button>
                  <button onClick={handleNext} disabled={activeIndex >= displayNotes.length - 1} style={{ background: 'transparent', border: 'none', cursor: activeIndex >= displayNotes.length - 1 ? 'default' : 'pointer', opacity: activeIndex >= displayNotes.length - 1 ? 0.3 : 0.8, padding: '2px', color: theme.textColor }}><ChevronRight size={16} /></button>
                </>
              )}
              <button onClick={toggleMinimize} title="ย่อขนาด" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '3px', color: theme.textColor, opacity: 0.75 }}><Minus size={15} /></button>
              <button onClick={closeNote} title="ปิด Post-it ลอย" style={{ background: 'rgba(0,0,0,0.08)', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '3px 5px', color: theme.textColor, fontWeight: 700 }}><X size={15} /></button>
            </div>
          </div>

          {/* Date info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', opacity: 0.8 }}>
            <Calendar size={12} />
            <span>วันที่: {formatToDDMMYYYY(currentNote.noteDate)}</span>
          </div>

          {/* Title & Checkbox */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <button
              onClick={() => toggleNote(currentNote.id)}
              style={{
                marginTop: '2px', width: '18px', height: '18px', borderRadius: '4px',
                border: `2px solid ${currentNote.isCompleted ? '#16a34a' : theme.accent}`,
                background: currentNote.isCompleted ? '#16a34a' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0
              }}
            >
              {currentNote.isCompleted && <Check size={12} color="#fff" strokeWidth={3} />}
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.35, textDecoration: currentNote.isCompleted ? 'line-through' : 'none', color: currentNote.isCompleted ? '#6b7280' : theme.textColor }}>
                {currentNote.title}
              </div>
              {currentNote.content && (
                <div style={{ fontSize: '0.82rem', marginTop: '4px', lineHeight: 1.4, opacity: 0.9, whiteSpace: 'pre-wrap', maxHeight: '100px', overflowY: 'auto' }}>
                  {currentNote.content}
                </div>
              )}
            </div>
          </div>

          {/* Footer: Due date */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px dashed ${theme.border}`, paddingTop: '0.45rem', marginTop: '0.2rem', fontSize: '0.74rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              <Clock size={12} />
              <span>กำหนด: {currentNote.dueDate ? formatToDDMMYYYY(currentNote.dueDate) : 'ไม่ระบุ'}</span>
              {dueStatus === 'overdue' && <span style={{ color: '#dc2626', marginLeft: '3px' }}><AlertCircle size={12} /> เลยกำหนด</span>}
              {dueStatus === 'due-today' && <span style={{ color: '#d97706', marginLeft: '3px' }}>⚡ วันนี้</span>}
            </div>

            {location.pathname !== '/notes' && (
              <button onClick={() => navigate('/notes')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.accent, fontWeight: 700, fontSize: '0.74rem', textDecoration: 'underline' }}>
                ดูทั้งหมด
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Floating Action Button (FAB) */}
      {(!isOpen || isMinimized) && (
        <button
          onClick={toggleOpen}
          title={isOpen ? 'ขยาย Post-it ช่วยจำ' : 'เปิด Post-it ช่วยจำ'}
          className="hover-lift"
          style={{
            position: 'fixed', bottom: '95px', right: '24px', width: '46px', height: '46px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #fef08a, #facc15)', border: '2px solid #ca8a04',
            boxShadow: '0 8px 24px rgba(202, 138, 4, 0.45), 0 3px 8px rgba(0,0,0,0.2)',
            zIndex: 9989, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0
          }}
        >
          <StickyNote size={22} color="#713f12" />
          {displayNotes.filter((n) => !n.isCompleted).length > 0 && (
            <span
              style={{
                position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: 'white',
                fontSize: '0.68rem', fontWeight: 800, width: '18px', height: '18px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fff',
              }}
            >
              {displayNotes.filter((n) => !n.isCompleted).length}
            </span>
          )}
        </button>
      )}
    </>
  );
};
export default FloatingPostIt;
