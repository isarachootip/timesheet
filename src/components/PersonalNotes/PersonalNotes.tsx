import React, { useState, useMemo } from 'react';
import { Plus, Search, StickyNote } from 'lucide-react';
import type { User, PersonalNote } from '../../types';
import { usePersonalNotes } from '../../hooks/usePersonalNotes';
import { filterAndSortNotes } from './noteUtils';
import { PostItCard } from './PostItCard';
import { NoteModal } from './NoteModal';

interface PersonalNotesProps {
  currentUser: User;
}

export const PersonalNotes: React.FC<PersonalNotesProps> = ({ currentUser }) => {
  const { notes, isLoading, saveNote, toggleNote, deleteNote } = usePersonalNotes(currentUser.id);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<PersonalNote | null>(null);

  const filteredNotes = useMemo(() => {
    return filterAndSortNotes(notes, filter, search);
  }, [notes, filter, search]);

  const stats = useMemo(() => {
    const total = notes.length;
    const completed = notes.filter((n) => n.isCompleted).length;
    const active = total - completed;
    return { total, active, completed };
  }, [notes]);

  const handleEdit = (note: PersonalNote) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('คุณต้องการลบ Post-it นี้ใช่หรือไม่?')) {
      await deleteNote(id);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(234,179,8,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <StickyNote size={22} color="#eab308" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }} className="text-gradient">
                Personal Post-it
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                บันทึกช่วยจำส่วนตัวสำหรับ {currentUser.name}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => { setEditingNote(null); setIsModalOpen(true); }}
          className="btn-primary hover-lift"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
        >
          <Plus size={18} />
          <span>เขียน Post-it ใหม่</span>
        </button>
      </div>

      {/* Control Bar: Search & Filter Tabs */}
      <div className="glass-panel" style={{ padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {(['all', 'active', 'completed'] as const).map((tab) => {
            const isActive = filter === tab;
            const labels = { all: `ทั้งหมด (${stats.total})`, active: `รอดำเนินการ (${stats.active})`, completed: `เสร็จสิ้น (${stats.completed})` };
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isActive ? 'var(--accent-primary)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.85rem',
                }}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        <div style={{ position: 'relative', width: '240px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="ค้นหาเรื่อง หรือเนื้อหา..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.45rem 0.75rem 0.45rem 2.2rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Grid of Post-it notes */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>กำลังโหลด Post-it...</div>
      ) : filteredNotes.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(234,179,8,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <StickyNote size={28} color="#eab308" />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>ยังไม่มี Post-it ในส่วนนี้</h3>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '360px' }}>
            กดปุ่มด้านล่างเพื่อจดบันทึกเรื่องสำคัญ วันที่ และกำหนดเวลาแล้วเสร็จ
          </p>
          <button
            onClick={() => { setEditingNote(null); setIsModalOpen(true); }}
            className="btn-primary"
            style={{ marginTop: '0.5rem', padding: '0.55rem 1.1rem', borderRadius: 'var(--radius-md)' }}
          >
            + บันทึก Post-it แรกของคุณ
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
          {filteredNotes.map((note) => (
            <PostItCard key={note.id} note={note} onToggle={toggleNote} onEdit={handleEdit} onDelete={deleteDeleteId => handleDelete(deleteDeleteId)} />
          ))}
        </div>
      )}

      {/* Note Modal */}
      <NoteModal
        isOpen={isModalOpen}
        noteToEdit={editingNote}
        onClose={() => { setIsModalOpen(false); setEditingNote(null); }}
        onSave={async (data) => { await saveNote(data); }}
      />
    </div>
  );
};
export default PersonalNotes;
