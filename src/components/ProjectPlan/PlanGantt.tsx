import React, { useMemo, useRef, useState } from 'react';
import type { Project, Task } from '../../types';
import { toast } from '../ui/ToastProvider';
import {
  buildGanttAxis,
  type GanttZoomMode,
  type SmartTimelineBounds,
} from './ganttScaleUtils';
import { PlanGanttHeader } from './PlanGanttHeader';
import { GANTT_LEFT_COL_PX, PlanGanttRow } from './PlanGanttRow';
import { PlanGanttToolbar } from './PlanGanttToolbar';
import {
  calculateMilestoneProgress,
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
  searchQuery?: string;
  expandedMilestones?: Set<string>;
  onToggleExpand?: (milestoneId: string) => void;
  canEditTask?: (task: Task) => boolean;
  onEditTask?: (task: Task) => void;
}

const getSubtaskProgress = (status: string): number => {
  if (status === 'Done') return 100;
  if (status === 'Review') return 80;
  if (status === 'In Progress') return 40;
  return 0;
};

export const PlanGantt: React.FC<PlanGanttProps> = ({
  milestones,
  allTasks,
  projectMap,
  showProjectBadge,
  timelineRange,
  compareData,
  searchQuery = '',
  expandedMilestones,
  onToggleExpand,
  canEditTask = () => false,
  onEditTask = () => {},
}) => {
  const scopeKey = showProjectBadge ? 'all' : 'single';
  const [zoomOverride, setZoomOverride] = useState<{ scopeKey: string; mode: GanttZoomMode } | null>(null);
  const [localExpanded, setLocalExpanded] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const zoomMode: GanttZoomMode =
    zoomOverride?.scopeKey === scopeKey ? zoomOverride.mode : showProjectBadge ? 'quarter' : 'month';
  const activeExpanded = expandedMilestones ?? localExpanded;

  const handleToggle = (id: string) => {
    if (onToggleExpand) return onToggleExpand(id);
    setLocalExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bounds: SmartTimelineBounds = useMemo(
    () => ({
      startMs: timelineRange.projStart,
      endMs: timelineRange.projEnd,
      totalDays: timelineRange.totalDays,
      hasInvertedDates: Boolean(timelineRange.hasInvertedDates),
    }),
    [timelineRange.projStart, timelineRange.projEnd, timelineRange.totalDays, timelineRange.hasInvertedDates]
  );

  const axis = useMemo(() => buildGanttAxis(bounds, zoomMode), [bounds, zoomMode]);
  const compareByTaskId = useMemo(
    () => new Map((compareData?.tasks || []).map((item) => [item.taskId, item])),
    [compareData]
  );

  const q = searchQuery.trim().toLowerCase();
  const visibleMilestones = useMemo(() => {
    if (!q) return milestones;
    return milestones.filter((m) => {
      const subs = allTasks.filter((t) => t.parentId === m.id);
      const projName = projectMap.get(m.projectId)?.name.toLowerCase() || '';
      return m.title.toLowerCase().includes(q) || projName.includes(q) || subs.some((s) => s.title.toLowerCase().includes(q));
    });
  }, [milestones, allTasks, projectMap, q]);

  if (visibleMilestones.length === 0) return null;

  const handleJumpToday = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (axis.todayOffsetPct !== null) {
      const trackWidth = Math.max(0, el.scrollWidth - GANTT_LEFT_COL_PX);
      const viewTrack = Math.max(0, el.clientWidth - GANTT_LEFT_COL_PX);
      const targetLeft = Math.max(0, (axis.todayOffsetPct / 100) * trackWidth - viewTrack / 2);
      el.scrollTo({ left: targetLeft, behavior: 'smooth' });
      return;
    }
    const isBefore = Date.now() < axis.startMs;
    el.scrollTo({ left: isBefore ? 0 : el.scrollWidth, behavior: 'smooth' });
    toast.info(isBefore ? 'Today is before this plan timeline — jumped to start.' : 'Today is after this plan timeline — jumped to end.');
  };

  return (
    <div className="surface-card" style={{ padding: '16px' }}>
      <PlanGanttToolbar
        zoomMode={zoomMode}
        onChangeZoom={(mode) => setZoomOverride({ scopeKey, mode })}
        onJumpToday={handleJumpToday}
        todayInRange={axis.todayOffsetPct !== null}
        hasInvertedDates={bounds.hasInvertedDates}
        milestoneCount={visibleMilestones.length}
      />

      <div
        ref={scrollRef}
        style={{
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          overflowX: 'auto',
          overflowY: 'hidden',
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        <div style={{ minWidth: axis.totalWidthPx ? `${GANTT_LEFT_COL_PX + axis.totalWidthPx}px` : '680px' }}>
          <PlanGanttHeader axis={axis} />

          {visibleMilestones.map((m) => {
            const subtasks = allTasks.filter((t) => t.parentId === m.id);
            const isExpanded = activeExpanded.has(m.id);
            const progress = calculateMilestoneProgress(allTasks, m.id, m.status);

            return (
              <React.Fragment key={m.id}>
                <PlanGanttRow
                  task={m}
                  subtaskCount={subtasks.length}
                  isExpanded={isExpanded}
                  onToggleExpand={() => handleToggle(m.id)}
                  progress={progress}
                  projectName={projectMap.get(m.projectId)?.name}
                  showProjectBadge={showProjectBadge}
                  axis={axis}
                  baselineSnapshot={compareByTaskId.get(m.id)?.base}
                  canEdit={canEditTask(m)}
                  onEditTask={onEditTask}
                />
                {isExpanded &&
                  subtasks.map((sub) => (
                    <PlanGanttRow
                      key={sub.id}
                      task={sub}
                      isSubtask
                      progress={getSubtaskProgress(sub.status)}
                      showProjectBadge={false}
                      axis={axis}
                      baselineSnapshot={compareByTaskId.get(sub.id)?.base}
                      canEdit={canEditTask(sub)}
                      onEditTask={onEditTask}
                    />
                  ))}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
