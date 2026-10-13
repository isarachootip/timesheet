import React, { useState, useMemo } from 'react';
import { X, StickyNote, Calendar, ArrowRight, Search, CheckCircle } from 'lucide-react';
import type { PersonalNote, User } from '../../types';
import { usePersonalNotes } from '../../hooks/usePersonalNotes';
import { useProjects } from '../../hooks/useAppQueries';
import { filterCandidateNotesForImport } from '../PersonalNotes/importNoteUtils';
import { COLOR_THEMES } from '../PersonalNotes/noteUtils';
import { PostItProjectBadge } from '../PersonalNotes/PostItProjectBadge';
import { formatToDDMMYYYY } from '../../utils';

interface PostItImportPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  selectedDateStr: string;
  onSelectNote: (note: PersonalNote) => void;
}

export const PostItImportPickerModal: React.FC<PostItImportPickerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  selectedDateStr,
  onSelectNote,
}) => {
  const { notes, isLoading } = usePersonalNotes(currentUser.id);
  const { data: projects = [] } = useProjects();
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'today' | 'active'>('active');

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects]);

  const orderedNotes = useMemo(() => {
    return filterCandidateNotesForImport(notes, selectedDateStr);
  }, [notes, selectedDateStr]);

  const displayedNotes = useMemo(() => {
    return orderedNotes.filter((n) => {
      if (filterMode === 'active' && n.isCompleted) return false;
      if (filterMode === 'today' && n.noteDate !== selectedDateStr) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return n.title.toLowerCase().includes(q) || (n.content && n.content.toLowerCase().includes(q));
    });
  }, [orderedNotes, filterMode, selectedDateStr, search]);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '580px', borderRadius: '14px', padding: '1.4rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', boxShadow: '0 20px 45px rgba(0,0,0,0.3)', maxHeight: '85vh', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(234,179,8,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <StickyNote size={18} color="#eab308" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>เลือก Post-it เพื่อนำเข้าสู่ Timesheet</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>เลือกบันทึกที่ต้องการเพื่อกรอกลงเวลาประจำวัน</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={18} /></button>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['active', 'today', 'all'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  background: filterMode === mode ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: filterMode === mode ? '#fff' : 'var(--text-secondary)',
                  fontWeight: filterMode === mode ? 600 : 400,
                }}
              >
                {mode === 'active' ? 'รอดำเนินการ' : mode === 'today' ? 'ตรงกับวันนี้' : 'ทั้งหมด'}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '200px' }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="ค้นหา Post-it..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.35rem 0.6rem 0.35rem 1.8rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.8rem' }}
            />
          </div>
        </div>

        {/* List of notes */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingRight: '4px', minHeight: '200px', maxHeight: '420px' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>กำลังโหลด Post-it...</div>
          ) : displayedNotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>ไม่พบรายการ Post-it ในเงื่อนไขนี้</div>
          ) : (
            displayedNotes.map((n) => {
              const theme = COLOR_THEMES[n.color || 'yellow'];
              return (
                <div
                  key={n.id}
                  style={{
                    background: theme.bg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '8px',
                    padding: '0.75rem 0.9rem',
                    color: theme.textColor,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', opacity: 0.8, marginBottom: '4px', flexWrap: 'wrap' }}>
                      <Calendar size={12} />
                      <span>วันที่: {formatToDDMMYYYY(n.noteDate)}</span>
                      <PostItProjectBadge
                        isProject={true}
                        projectName={n.projectId ? projectMap.get(n.projectId) : undefined}
                        isLogged={false}
                      />
                      {n.isCompleted && (
                        <span style={{ color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                          <CheckCircle size={11} /> เสร็จแล้ว
                        </span>
                      )}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', wordBreak: 'break-word' }}>{n.title}</div>
                    {n.content && (
                      <div style={{ fontSize: '0.78rem', opacity: 0.85, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {n.content}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => { onSelectNote(n); onClose(); }}
                    className="btn-primary hover-lift"
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      cursor: 'pointer',
                    }}
                  >
                    <span>นำเข้า</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
export default PostItImportPickerModal;
