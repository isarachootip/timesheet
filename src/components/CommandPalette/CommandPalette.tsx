import React from 'react';
import { Briefcase, CheckSquare, FileText, Plus, Search, StickyNote } from 'lucide-react';
import type { PermissionScheme, PersonalNote, Project, Task, User } from '../../types';
import { QuickCreateTaskModal } from './QuickCreateTaskModal';
import { useCommandPalette, type PaletteCategory } from './useCommandPalette';

interface CommandPaletteProps {
  isOpen: boolean;
  onOpenPalette: () => void;
  onClose: () => void;
  isQuickCreateOpen: boolean;
  onOpenQuickCreate: () => void;
  onCloseQuickCreate: () => void;
  onToggleTheme: () => void;
  projects: Project[];
  tasks: Task[];
  users: User[];
  notes: PersonalNote[];
  permissionSchemes: PermissionScheme[];
  currentUser: User | null;
  onCreateTask: (task: Task) => void;
}

const CategoryIcon: React.FC<{ category: PaletteCategory }> = ({ category }) => {
  if (category === 'Action') return <Plus size={15} />;
  if (category === 'Project') return <Briefcase size={15} />;
  if (category === 'Task') return <CheckSquare size={15} />;
  if (category === 'Note') return <StickyNote size={15} />;
  return <FileText size={15} />;
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onOpenPalette,
  onClose,
  isQuickCreateOpen,
  onOpenQuickCreate,
  onCloseQuickCreate,
  onToggleTheme,
  projects,
  tasks,
  users,
  notes,
  permissionSchemes,
  currentUser,
  onCreateTask,
}) => {
  const { query, setQuery, activeIndex, setActiveIndex, items, creatableProjects } = useCommandPalette({
    isOpen,
    onClose,
    onOpenPalette,
    onOpenQuickCreate,
    onToggleTheme,
    projects,
    tasks,
    notes,
    permissionSchemes,
    currentUser,
  });

  return (
    <>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--overlay-backdrop)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '80px 16px 16px',
          }}
        >
          <div
            className="surface-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '580px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <Search size={16} color="var(--text-muted)" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages, tasks, projects, notes, or run an action..."
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--fs-14)',
                }}
              />
              <kbd
                style={{
                  fontSize: 'var(--fs-12)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '2px 6px',
                }}
              >
                ESC
              </kbd>
            </div>

            <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '8px' }}>
              {items.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--fs-13)' }}>
                  No matching commands, pages, or tasks.
                </div>
              ) : (
                items.map((item, idx) => {
                  const active = idx === activeIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={item.onSelect}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        backgroundColor: active ? 'var(--accent-subtle)' : 'transparent',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color var(--transition-fast)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <span style={{ color: active ? 'var(--accent-primary)' : 'var(--text-muted)', display: 'flex' }}>
                          <CategoryIcon category={item.category} />
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 'var(--fs-14)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div style={{ fontSize: 'var(--fs-12)', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.subtitle}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-muted)' }}>{item.category}</span>
                        {item.shortcut && (
                          <kbd
                            style={{
                              fontSize: 'var(--fs-12)',
                              color: 'var(--text-secondary)',
                              backgroundColor: 'var(--bg-tertiary)',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '2px 6px',
                            }}
                          >
                            {item.shortcut}
                          </kbd>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <QuickCreateTaskModal
        open={isQuickCreateOpen}
        projects={creatableProjects}
        users={users}
        currentUser={currentUser}
        onCreateTask={onCreateTask}
        onClose={onCloseQuickCreate}
      />
    </>
  );
};
