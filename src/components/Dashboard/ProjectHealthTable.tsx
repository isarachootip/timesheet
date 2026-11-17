import React from 'react';
import { Briefcase, TrendingUp, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../../types';
import type { HealthStatus, HealthTrendDirection } from '../../types/projectHealth';
import type { ProjectScheduleState } from '../../utils/overdueUtils';
import { HealthStatusBadge } from '../ProjectHealth/HealthStatusBadge';
import { EmptyState } from '../ui/EmptyState';
import { StatusBadge } from '../ui/StatusBadge';

export interface ProjectHealthRow extends Project {
  progress: number;
  schedule: ProjectScheduleState;
  healthStatus: HealthStatus;
  healthScore: number | null;
  healthTrend: HealthTrendDirection;
  healthScoreDelta: number | null;
}

interface ProjectHealthTableProps {
  projects: ProjectHealthRow[];
}

const renderScheduleCell = (schedule: ProjectScheduleState): React.ReactNode => {
  switch (schedule.kind) {
    case 'ongoing':
      return 'Ongoing';
    case 'completed':
      return (
        <span data-testid="schedule-completed-badge" style={{ display: 'inline-flex', justifyContent: 'flex-end' }}>
          <StatusBadge label="Completed" tone="success" />
        </span>
      );
    case 'overdue':
      return (
        <span className="tabular-nums" style={{ color: 'var(--accent-danger)', fontWeight: 500 }}>
          {schedule.days}d overdue
        </span>
      );
    case 'days_left':
      return <span className="tabular-nums">{schedule.days}d left</span>;
  }
};

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
                  className="table-row-hover"
                  onClick={() => navigate(`/projects/${proj.id}/health`)}
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
                    <HealthStatusBadge
                      status={proj.healthStatus}
                      score={proj.healthScore}
                      trend={proj.healthTrend}
                      scoreDelta={proj.healthScoreDelta}
                    />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${proj.progress}%`,
                            backgroundColor: proj.progress >= 100 ? 'var(--dot-success)' : 'var(--accent-primary)',
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
                    {renderScheduleCell(proj.schedule)}
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
