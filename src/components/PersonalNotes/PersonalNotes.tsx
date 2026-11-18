import React, { useMemo, useState } from 'react';
import { Plus, StickyNote } from 'lucide-react';
import type { PermissionScheme, PersonalNote, Sprint, User } from '../../types';
import { usePersonalNotes } from '../../hooks/usePersonalNotes';
import { usePermissionSchemes, useProjects, useSprints, useTasks } from '../../hooks/useAppQueries';
import { filterAndSortNotes, type NoteCategoryFilter } from './noteUtils';
import { canConvertNoteToTask } from './convertNoteToTaskUtils';
import { ConvertNoteToTaskModal } from './ConvertNoteToTaskModal';
import { ImportNoteToTimesheetModal } from './ImportNoteToTimesheetModal';
import { NoteModal } from './NoteModal';
import { NotesControlBar } from './NotesControlBar';
import { PostItCard } from './PostItCard';

interface PersonalNotesProps {
  currentUser: User;
  permissionSchemes?: PermissionScheme[];
  sprints?: Sprint[];
}

export const PersonalNotes: React.FC<PersonalNotesProps> = ({
  currentUser,
  permissionSchemes: propSchemes,
  sprints: propSprints,
}) => {
  const { notes, isLoading, saveNote, toggleNote, deleteNote } = usePersonalNotes(currentUser.id);
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useTasks();
  const { data: queriedSchemes = [] } = usePermissionSchemes({ enabled: !propSchemes });
  const { data: queriedSprints = [] } = useSprints({ enabled: !propSprints });

  const permissionSchemes = propSchemes ?? queriedSchemes;
  const sprints = propSprints ?? queriedSprints;

  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<NoteCategoryFilter>('all');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<PersonalNote | null>(null);
  const [importingNote, setImportingNote] = useState<PersonalNote | null>(null);
  const [convertingNote, setConvertingNote] = useState<PersonalNote | null>(null);

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects]);
  const taskMap = useMemo(() => new Map(tasks.map((t) => [t.id, t.title])), [tasks]);

  const filteredNotes = useMemo(
    () => filterAndSortNotes(notes, filter, search, categoryFilter),
    [notes, filter, search, categoryFilter]
  );

  const stats = useMemo(() => {
    const total = notes.length;
    const completed = notes.filter((n) => n.isCompleted).length;
    return { total, active: total - completed, completed };
  }, [notes]);

  const handleDelete = async (id: string) => {
    if (window.confirm('คุณต้องการลบ Post-it นี้ใช่หรือไม่?')) {
      await deleteNote(id);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(234,179,8,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <StickyNote size={22} color="#eab308" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 'var(--fs-20)', fontWeight: 700, color: 'var(--text-primary)' }}>
              Personal Post-it
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              บันทึกช่วยจำส่วนตัวสำหรับ {currentUser.name}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => { setEditingNote(null); setIsModalOpen(true); }}
          className="btn-primary hover-lift"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
        >
          <Plus size={18} />
          <span>เขียน Post-it ใหม่</span>
        </button>
      </div>

      <NotesControlBar
        filter={filter}
        onChangeFilter={setFilter}
        categoryFilter={categoryFilter}
        onChangeCategoryFilter={setCategoryFilter}
        search={search}
        onChangeSearch={setSearch}
        stats={stats}
      />

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
          <button type="button" onClick={() => { setEditingNote(null); setIsModalOpen(true); }} className="btn-primary" style={{ marginTop: '0.5rem', padding: '0.55rem 1.1rem', borderRadius: 'var(--radius-md)' }}>
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
              canConvertToTask={canConvertNoteToTask(note, currentUser, projects, permissionSchemes)}
              onToggle={toggleNote}
              onEdit={(n) => { setEditingNote(n); setIsModalOpen(true); }}
              onDelete={handleDelete}
              onImportToTimesheet={setImportingNote}
              onConvertToTask={setConvertingNote}
            />
          ))}
        </div>
      )}

      <NoteModal
        isOpen={isModalOpen}
        noteToEdit={editingNote}
        onClose={() => { setIsModalOpen(false); setEditingNote(null); }}
        onSave={async (data) => { await saveNote(data); }}
        projects={projects}
        tasks={tasks}
        currentUser={currentUser}
      />

      <ImportNoteToTimesheetModal
        isOpen={Boolean(importingNote)}
        note={importingNote}
        onClose={() => setImportingNote(null)}
        currentUser={currentUser}
        projects={projects}
        tasks={tasks}
        onCompleteNote={toggleNote}
      />

      <ConvertNoteToTaskModal
        isOpen={Boolean(convertingNote)}
        note={convertingNote}
        onClose={() => setConvertingNote(null)}
        currentUser={currentUser}
        projects={projects}
        permissionSchemes={permissionSchemes}
        tasks={tasks}
        sprints={sprints}
      />
    </div>
  );
};
export default PersonalNotes;
