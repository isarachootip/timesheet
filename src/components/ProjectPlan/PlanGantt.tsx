import React from 'react';
import { Calendar, Check } from 'lucide-react';
import type { Project, Task } from '../../types';
import { formatToDDMMYYYY } from '../../utils';
import {
  calculateMilestoneProgress,
  getGanttBarGeometry,
  type CompareData,
  type TimelineRange,
} from './planUtils';

interface PlanGanttProps {
  milestones: Task[];
  allTasks: Task[];
  projectMap: Map<string, Project>;
  showProjectBadge: boolean;
  timelineRange: TimelineRange;
  compareData: CompareData | null;
}

const projectPillStyle: React.CSSProperties = {
  fontSize: 'var(--fs-12)',
  padding: '1px 6px',
  borderRadius: 'var(--radius-sm)',
  backgroundColor: 'var(--bg-tertiary)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-secondary)',
};

export const PlanGantt: React.FC<PlanGanttProps> = ({
  milestones,
  allTasks,
  projectMap,
  showProjectBadge,
  timelineRange,
  compareData,
}) => {
  if (milestones.length === 0) return null;

  const { projStart, projEnd, projDuration, ticks } = timelineRange;
  const compareByTaskId = new Map((compareData?.tasks || []).map((item) => [item.taskId, item]));

  return (
    <div className="surface-card" style={{ padding: '16px', overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <Calendar size={16} color="var(--accent-primary)" />
        <h3 style={{ fontSize: 'var(--fs-16)', fontWeight: 600, color: 'var(--text-primary)' }}>
          Proportional Gantt Timeline
        </h3>
      </div>

      <div style={{ minWidth: '680px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '8px',
          }}
        >
          <div style={{ width: '260px', fontSize: 'var(--fs-12)', fontWeight: 600, color: 'var(--text-muted)' }}>
            Milestone
          </div>
          <div style={{ flex: 1, marginLeft: '16px', display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-12)', color: 'var(--text-muted)' }}>
            {ticks.map((tick, idx) => <span key={`${tick}_${idx}`}>{tick}</span>)}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {milestones.map((m) => {
            const subtasks = allTasks.filter((t) => t.parentId === m.id);
            const progress = calculateMilestoneProgress(allTasks, m.id, m.status);
            const { leftOffset, widthVal } = getGanttBarGeometry(m.startDate, m.endDate, projStart, projEnd, projDuration);
            const comp = compareByTaskId.get(m.id);
            const baseGeom = comp?.base
              ? getGanttBarGeometry(comp.base.startDate, comp.base.endDate, projStart, projEnd, projDuration)
              : null;
            const projName = projectMap.get(m.projectId)?.name;

            return (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <div style={{ width: '260px', paddingRight: '8px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {progress === 100 && <Check size={14} color="var(--dot-success)" style={{ flexShrink: 0 }} />}
                    <span title={m.title} style={{ fontSize: 'var(--fs-13)', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.title}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                    {showProjectBadge && projName && <span style={projectPillStyle}>{projName}</span>}
                    <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-muted)' }}>
                      {subtasks.length} subtasks · {m.estimatedHours}h
                    </span>
                  </div>
                </div>

                <div style={{ flex: 1, marginLeft: '16px', position: 'relative', height: baseGeom ? '38px' : '28px' }}>
                  <div
                    title={`${m.title}: ${m.startDate ? formatToDDMMYYYY(m.startDate) : 'TBD'} -> ${m.endDate ? formatToDDMMYYYY(m.endDate) : 'TBD'}`}
                    style={{
                      position: 'absolute',
                      left: `${leftOffset}%`,
                      width: `${widthVal}%`,
                      top: '2px',
                      height: '24px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: `1px solid ${progress === 100 ? 'var(--dot-success)' : 'var(--accent-primary)'}`,
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 8px',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${progress}%`,
                        backgroundColor: progress === 100 ? 'var(--dot-success)' : 'var(--accent-primary)',
                        opacity: 0.2,
                      }}
                    />
                    <span style={{ position: 'relative', zIndex: 1, fontSize: 'var(--fs-12)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {progress}%
                    </span>
                  </div>

                  {baseGeom && (
                    <div
                      title={`Baseline: ${comp?.base?.startDate ? formatToDDMMYYYY(comp.base.startDate) : 'TBD'} -> ${comp?.base?.endDate ? formatToDDMMYYYY(comp.base.endDate) : 'TBD'}`}
                      style={{
                        position: 'absolute',
                        left: `${baseGeom.leftOffset}%`,
                        width: `${baseGeom.widthVal}%`,
                        bottom: '2px',
                        height: '4px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--border-strong)',
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
