import React from 'react';
import { Link } from 'react-router-dom';
import { Edit, GitBranch, MessageSquare, Trash2 } from 'lucide-react';
import type { Project, User } from '../../types';
import { formatToDDMMYYYY } from '../../utils';

interface ProjectListRowProps {
  project: Project;
  rowIndex: number;
  showCheckboxColumn: boolean;
  manageable: boolean;
  canDelete: boolean;
  checked: boolean;
  users: User[];
  onToggleSelect: (checked: boolean) => void;
  onRowClick: (e: React.MouseEvent<HTMLElement>, project: Project) => void;
  onRowAuxClick: (e: React.MouseEvent<HTMLElement>, project: Project) => void;
  onRowKeyDown: (e: React.KeyboardEvent<HTMLElement>, project: Project) => void;
  onOpenWorkflowModal: (project: Project) => void;
  onOpenEditModal: (project: Project) => void;
  onDeleteProject: (id: string) => void;
}

export const ProjectListRow: React.FC<ProjectListRowProps> = ({
  project,
  rowIndex,
  showCheckboxColumn,
  manageable,
  canDelete,
  checked,
  users,
  onToggleSelect,
  onRowClick,
  onRowAuxClick,
  onRowKeyDown,
  onOpenWorkflowModal,
  onOpenEditModal,
  onDeleteProject,
}) => {
  const getUserAvatar = (userId: string) => users.find((u) => u.id === userId)?.avatar || '';
  const getUserName = (userId: string) => users.find((u) => u.id === userId)?.name || 'Unknown';

  return (
    <tr
      tabIndex={0}
      aria-label={`Log timesheet for project ${project.name}`}
      onClick={(e) => onRowClick(e, project)}
      onAuxClick={(e) => onRowAuxClick(e, project)}
      onKeyDown={(e) => onRowKeyDown(e, project)}
      style={{
        borderBottom: '1px solid var(--border-color)',
        background: rowIndex % 2 === 0 ? 'transparent' : 'var(--bg-primary)',
        cursor: 'pointer',
      }}
      className="table-row-hover table-row-interactive"
    >
      {showCheckboxColumn && (
        <td
          data-no-row-nav="true"
          onClick={(e) => e.stopPropagation()}
          style={{ padding: '0.875rem 0.75rem' }}
        >
          <input
            type="checkbox"
            aria-label={`Select project ${project.name}`}
            disabled={!manageable}
            checked={checked}
            onChange={(e) => onToggleSelect(e.target.checked)}
            style={{ cursor: manageable ? 'pointer' : 'not-allowed' }}
          />
        </td>
      )}
      <td style={{ padding: '0.875rem 1rem' }}>
        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{project.name}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {project.description}
        </div>
      </td>
      <td style={{ padding: '0.875rem 1rem' }}>
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--fs-12)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', background: project.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: project.status === 'Active' ? 'var(--accent-secondary)' : 'var(--accent-warning)', fontWeight: 500 }}>
            {project.status}
          </span>
          <span style={{ fontSize: 'var(--fs-12)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', background: project.projectType === 'support' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(139, 92, 246, 0.1)', color: project.projectType === 'support' ? '#3b82f6' : '#8b5cf6', fontWeight: 500 }}>
            {project.projectType === 'support' ? 'Support' : 'Dev'}
          </span>
        </div>
      </td>
      <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        {formatToDDMMYYYY(project.startDate)} - {project.endDate && project.projectType !== 'support' ? formatToDDMMYYYY(project.endDate) : 'Ongoing'}
      </td>
      <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
        {project.budget ? `$${project.budget.toLocaleString()}` : '-'}
      </td>
      <td style={{ padding: '0.875rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {project.members.length === 0 ? (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No members</span>
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
                  style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid var(--bg-tertiary)', marginLeft: index > 0 ? '-8px' : '0', zIndex: project.members.length - index }}
                />
              ) : (
                <span
                  key={member.userId}
                  title={`${memberName} (${member.role})`}
                  style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid var(--bg-tertiary)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginLeft: index > 0 ? '-8px' : '0', zIndex: project.members.length - index }}
                >
                  {memberName.slice(0, 1).toUpperCase()}
                </span>
              );
            })
          )}
        </div>
      </td>
      <td
        data-no-row-nav="true"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '0.875rem 1rem', textAlign: 'right' }}
      >
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Link to={`/chat?projectId=${project.id}`} title="Project Chat" style={{ color: 'var(--accent-primary)', padding: '0.25rem' }}>
            <MessageSquare size={16} />
          </Link>
          {manageable && (
            <>
              <button onClick={() => onOpenWorkflowModal(project)} title="Configure Workflow" style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer' }}>
                <GitBranch size={16} />
              </button>
              <button onClick={() => onOpenEditModal(project)} title="Edit Project" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <Edit size={16} />
              </button>
            </>
          )}
          {canDelete && (
            <button onClick={() => onDeleteProject(project.id)} title="Delete Project" style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer' }}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};
