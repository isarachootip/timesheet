import React from 'react';
import { Briefcase, TrendingUp, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../../types';
import { EmptyState } from '../ui/EmptyState';
import { StatusBadge, getStatusTone } from '../ui/StatusBadge';

export interface ProjectHealthRow extends Project {
  progress: number;
  daysRemaining: number | null;
}

interface ProjectHealthTableProps {
  projects: ProjectHealthRow[];
}

export const ProjectHealthTable: React.FC<ProjectHealthTableProps> = ({ projects }) => {
  const navigate = useNavigate();

  return (
    <section className="surface-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} color="var(--accent-primary)" />
          <h3 style={{ fontSize: 'var(--fs-16)', fontWeight: 600 }}>Project Health</h3>
          <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-muted)' }}>({projects.length})</span>
        </div>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No projects available"
          description="Create or join a project to monitor progress and timeline health."
          actions={[{ label: 'Go to Projects', onClick: () => navigate('/projects') }]}
        />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '10px 12px', fontSize: 'var(--fs-12)', fontWeight: 600 }}>Project</th>
                <th style={{ padding: '10px 12px', fontSize: 'var(--fs-12)', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '10px 12px', fontSize: 'var(--fs-12)', fontWeight: 600, width: '240px' }}>Progress</th>
                <th style={{ padding: '10px 12px', fontSize: 'var(--fs-12)', fontWeight: 600 }}>Team</th>
                <th style={{ padding: '10px 12px', fontSize: 'var(--fs-12)', fontWeight: 600, textAlign: 'right' }}>Schedule</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((proj) => (
                <tr
                  key={proj.id}
                  onClick={() => navigate(`/projects#${proj.id}`)}
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'background-color var(--transition-fast)',
                  }}
                >
                  <td style={{ padding: '12px', fontSize: 'var(--fs-14)', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {proj.name}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <StatusBadge label={proj.status} tone={getStatusTone(proj.status)} />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${proj.progress}%`,
                            backgroundColor: 'var(--accent-primary)',
                            borderRadius: 'var(--radius-full)',
                            transition: 'width var(--transition-normal)',
                          }}
                        />
                      </div>
                      <span className="tabular-nums" style={{ fontSize: 'var(--fs-13)', color: 'var(--text-secondary)', minWidth: '38px', textAlign: 'right' }}>
                        {proj.progress}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontSize: 'var(--fs-13)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={13} color="var(--text-muted)" />
                      {proj.members.length} member{proj.members.length !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: 'var(--fs-13)', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textAlign: 'right' }}>
                    {proj.daysRemaining === null
                      ? 'Ongoing'
                      : proj.daysRemaining < 0
                        ? `${Math.abs(proj.daysRemaining)}d overdue`
                        : `${proj.daysRemaining}d left`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
