import React, { useState, useMemo } from 'react';
import { Plus, Search, StickyNote } from 'lucide-react';
import type { User, PersonalNote } from '../../types';
import { usePersonalNotes } from '../../hooks/usePersonalNotes';
import { useProjects, useTasks } from '../../hooks/useAppQueries';
import { filterAndSortNotes, type NoteCategoryFilter } from './noteUtils';
import { PostItCard } from './PostItCard';
import { NoteModal } from './NoteModal';
import { ImportNoteToTimesheetModal } from './ImportNoteToTimesheetModal';

interface PersonalNotesProps {
  currentUser: User;
}

export const PersonalNotes: React.FC<PersonalNotesProps> = ({ currentUser }) => {
  const { notes, isLoading, saveNote, toggleNote, deleteNote } = usePersonalNotes(currentUser.id);
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useTasks();

  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<NoteCategoryFilter>('all');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<PersonalNote | null>(null);
  const [importingNote, setImportingNote] = useState<PersonalNote | null>(null);

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects]);
  const taskMap = useMemo(() => new Map(tasks.map((t) => [t.id, t.title])), [tasks]);

  const filteredNotes = useMemo(() => {
    return filterAndSortNotes(notes, filter, search, categoryFilter);
  }, [notes, filter, search, categoryFilter]);

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
      <div className="glass-panel" style={{ padding: '0.75rem 1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '3px', background: 'var(--bg-tertiary)', padding: '2px', borderRadius: '6px' }}>
            {(['all', 'active', 'completed'] as const).map((tab) => {
              const isActive = filter === tab;
              const labels = { all: `ทั้งหมด (${stats.total})`, active: `รอดำเนินการ (${stats.active})`, completed: `เสร็จสิ้น (${stats.completed})` };
              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  style={{
                    padding: '0.35rem 0.75rem', borderRadius: '5px', border: 'none',
                    background: isActive ? 'var(--accent-primary)' : 'transparent',
                    color: isActive ? '#fff' : 'var(--text-secondary)', cursor: 'pointer',
                    fontWeight: isActive ? 600 : 400, fontSize: '0.8rem',
                  }}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          {/* Category Tabs: Project vs Personal */}
          <div style={{ display: 'flex', gap: '3px', background: 'var(--bg-tertiary)', padding: '2px', borderRadius: '6px' }}>
            {(['all', 'project', 'personal'] as const).map((cat) => {
              const isActive = categoryFilter === cat;
              const catLabels = { all: 'ทุกประเภท', project: '💼 งานโครงการ', personal: '🟡 งานส่วนตัว' };
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    padding: '0.35rem 0.75rem', borderRadius: '5px', border: 'none',
                    background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer',
                    fontWeight: isActive ? 600 : 400, fontSize: '0.8rem',
                  }}
                >
                  {catLabels[cat]}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ position: 'relative', width: '220px' }}>
          <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="ค้นหาเรื่อง หรือเนื้อหา..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.4rem 0.7rem 0.4rem 2rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.82rem' }}
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
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>ยังไม่มี Post-it ในหมวดนี้</h3>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '360px' }}>
            กดปุ่มด้านล่างเพื่อจดบันทึกเรื่องสำคัญ วันที่ และกำหนดเวลาแล้วเสร็จ
          </p>
          <button onClick={() => { setEditingNote(null); setIsModalOpen(true); }} className="btn-primary" style={{ marginTop: '0.5rem', padding: '0.55rem 1.1rem', borderRadius: 'var(--radius-md)' }}>
            + บันทึก Post-it แรกของคุณ
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
          {filteredNotes.map((note) => (
            <PostItCard
              key={note.id}
              note={note}
              projectName={note.projectId ? projectMap.get(note.projectId) : undefined}
              taskTitle={note.taskId ? taskMap.get(note.taskId) : undefined}
              onToggle={toggleNote}
              onEdit={handleEdit}
              onDelete={(deleteId) => handleDelete(deleteId)}
              onImportToTimesheet={(n) => setImportingNote(n)}
            />
          ))}
        </div>
      )}

      {/* Note Modal */}
      <NoteModal
        isOpen={isModalOpen}
        noteToEdit={editingNote}
        onClose={() => { setIsModalOpen(false); setEditingNote(null); }}
        onSave={async (data) => { await saveNote(data); }}
        projects={projects}
        tasks={tasks}
        currentUser={currentUser}
      />

      {/* Import to Timesheet Modal */}
      <ImportNoteToTimesheetModal
        isOpen={Boolean(importingNote)}
        note={importingNote}
        onClose={() => setImportingNote(null)}
        currentUser={currentUser}
        projects={projects}
        tasks={tasks}
        onCompleteNote={toggleNote}
      />
    </div>
  );
};
export default PersonalNotes;
