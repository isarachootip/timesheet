import React from 'react';
import { Link } from 'react-router-dom';
import { Edit, GitBranch, MessageSquare, Trash2, Users } from 'lucide-react';
import type { Project, Task, User } from '../../types';
import { formatToDDMMYYYY } from '../../utils';

interface ProjectCardItemProps {
  project: Project;
  users: User[];
  tasks?: Task[];
  currentUser: User | null;
  isHighlighted: boolean;
  manageable: boolean;
  canDelete: boolean;
  onCardClick: (e: React.MouseEvent<HTMLElement>, project: Project) => void;
  onCardAuxClick: (e: React.MouseEvent<HTMLElement>, project: Project) => void;
  onCardKeyDown: (e: React.KeyboardEvent<HTMLElement>, project: Project) => void;
  onOpenWorkflowModal: (project: Project) => void;
  onOpenEditModal: (project: Project) => void;
  onDeleteProject: (id: string) => void;
}

const iconBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
};

export const ProjectCardItem: React.FC<ProjectCardItemProps> = ({
  project,
  users,
  tasks,
  currentUser,
  isHighlighted,
  manageable,
  canDelete,
  onCardClick,
  onCardAuxClick,
  onCardKeyDown,
  onOpenWorkflowModal,
  onOpenEditModal,
  onDeleteProject,
}) => {
  const getUserAvatar = (userId: string) => users.find((u) => u.id === userId)?.avatar || '';
  const getUserName = (userId: string) => users.find((u) => u.id === userId)?.name || 'Unknown';
  const canAccessChat =
    currentUser?.globalRole === 'Admin' ||
    currentUser?.globalRole === 'Manager' ||
    Boolean(project.members?.some((m) => m.userId === currentUser?.id));
  const projectTasks = tasks ? tasks.filter((t) => t.projectId === project.id && !t.parentId) : [];

  return (
    <div
      id={project.id}
      tabIndex={0}
      aria-label={`Log timesheet for project ${project.name}`}
      onClick={(e) => onCardClick(e, project)}
      onAuxClick={(e) => onCardAuxClick(e, project)}
      onKeyDown={(e) => onCardKeyDown(e, project)}
      className="glass-panel hover-lift table-row-interactive"
      style={{
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        cursor: 'pointer',
        border: isHighlighted ? '2px solid var(--accent-primary)' : '1px solid transparent',
        boxShadow: isHighlighted ? '0 0 20px rgba(99, 102, 241, 0.4)' : undefined,
        transition: 'all 0.3s ease',
      }}
    >
      <div className="flex-between" style={{ alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{project.name}</h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                background: project.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                color: project.status === 'Active' ? 'var(--accent-secondary)' : 'var(--accent-warning)',
                fontWeight: 500,
              }}
            >
              {project.status}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                background: project.projectType === 'support' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                color: project.projectType === 'support' ? '#3b82f6' : '#8b5cf6',
                fontWeight: 500,
              }}
            >
              {project.projectType === 'support' ? 'Support' : 'Development'}
            </span>
          </div>
        </div>
        <div
          data-no-row-nav="true"
          onClick={(e) => e.stopPropagation()}
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          {canAccessChat && (
            <Link
              to={`/chat?projectId=${project.id}`}
              title="Project Chat"
              style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', padding: '0.25rem' }}
              className="hover-lift"
            >
              <MessageSquare size={16} />
            </Link>
          )}
          {manageable && (
            <>
              <button type="button" onClick={() => onOpenWorkflowModal(project)} title="Configure Workflow" style={{ ...iconBtnStyle, color: 'var(--accent-primary)' }}>
                <GitBranch size={16} />
              </button>
              <button type="button" onClick={() => onOpenEditModal(project)} title="Edit Project" style={{ ...iconBtnStyle, color: 'var(--text-secondary)' }}>
                <Edit size={16} />
              </button>
            </>
          )}
          {canDelete && (
            <button type="button" onClick={() => onDeleteProject(project.id)} title="Delete Project" style={{ ...iconBtnStyle, color: 'var(--accent-danger)' }}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{project.description}</p>

      <div style={{ marginTop: 'auto' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={14} /> Team ({project.members.length})
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {project.members.length === 0 ? (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No members added yet</span>
          ) : (
            project.members.map((member, index) => {
              const avatarUrl = getUserAvatar(member.userId);
              const memberName = getUserName(member.userId);
              return avatarUrl ? (
                <img
                  key={member.userId}
                  src={avatarUrl}
                  alt={memberName}
                  title={`${memberName} (${member.role})`}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--bg-tertiary)', marginLeft: index > 0 ? '-10px' : '0', zIndex: project.members.length - index }}
                />
              ) : (
                <span
                  key={member.userId}
                  title={`${memberName} (${member.role})`}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--bg-tertiary)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginLeft: index > 0 ? '-10px' : '0', zIndex: project.members.length - index }}
                >
                  {memberName.slice(0, 1).toUpperCase()}
                </span>
              );
            })
          )}
        </div>
      </div>

      {projectTasks.length > 0 && (
        <div data-no-row-nav="true" onClick={(e) => e.stopPropagation()} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <details style={{ cursor: 'pointer' }}>
            <summary style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 500, outline: 'none' }}>
              Auto-Generated Plan ({projectTasks.length} Milestones)
            </summary>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', maxHeight: '150px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {projectTasks.map((t) => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', background: 'var(--bg-tertiary)', padding: '0.35rem 0.5rem', borderRadius: '4px' }}>
                  <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }} title={t.title}>
                    {t.title}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {t.startDate ? `${formatToDDMMYYYY(t.startDate)} - ${t.endDate ? formatToDDMMYYYY(t.endDate) : ''}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
};
