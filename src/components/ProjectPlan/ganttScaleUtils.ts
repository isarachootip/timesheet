import type { Project, Task } from '../../types';

export type GanttZoomMode = 'week' | 'month' | 'quarter' | 'fit';
export type BarLabelPosition = 'inside' | 'right' | 'left';

export interface SmartTimelineBounds {
  startMs: number;
  endMs: number;
  totalDays: number;
  hasInvertedDates: boolean;
}

export interface GanttAxisGroup { key: string; label: string; widthPct: number; }
export interface GanttAxisColumn { key: string; label: string; leftPct: number; widthPct: number; }

export interface GanttAxis {
  startMs: number;
  endMs: number;
  durationMs: number;
  totalWidthPx: number | null;
  topGroups: GanttAxisGroup[];
  columns: GanttAxisColumn[];
  todayOffsetPct: number | null;
}

export interface BarPlacement {
  isUnscheduled: boolean;
  leftPct: number;
  widthPct: number;
  labelPosition: BarLabelPosition;
}

export const GANTT_DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const parsePlanDateMs = (dateStr?: string | null): number | null => {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-').map(Number);
    return new Date(y, m - 1, d).getTime();
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime())
    ? null
    : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).getTime();
};

export const hasInvertedProjectDates = (project?: Project): boolean => {
  const s = parsePlanDateMs(project?.startDate);
  const e = parsePlanDateMs(project?.endDate);
  return s !== null && e !== null && e < s;
};

export const computeSmartTimelineBounds = (
  selectedProject: Project | undefined,
  milestones: Task[],
  allTasks: Task[] = [],
  visibleProjects: Project[] = []
): SmartTimelineBounds => {
  const hasInvertedDates = hasInvertedProjectDates(selectedProject);
  const starts: number[] = [];
  const ends: number[] = [];
  const milestoneIds = new Set(milestones.map((m) => m.id));
  const relevantTasks = [...milestones, ...allTasks.filter((t) => t.parentId && milestoneIds.has(t.parentId))];

  for (const item of relevantTasks) {
    const s = parsePlanDateMs(item.startDate);
    const e = parsePlanDateMs(item.endDate);
    if (s !== null) starts.push(s);
    if (e !== null) ends.push(e);
    if (s !== null && e === null) ends.push(s);
    if (e !== null && s === null) starts.push(e);
  }

  const projectsToCheck = selectedProject ? [selectedProject] : visibleProjects.filter((p) => p.projectType !== 'support');
  for (const proj of projectsToCheck) {
    if (hasInvertedProjectDates(proj)) continue;
    const ps = parsePlanDateMs(proj.startDate);
    const pe = parsePlanDateMs(proj.endDate);
    if (ps !== null) starts.push(ps);
    if (pe !== null) ends.push(pe);
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startMs = starts.length > 0 ? Math.min(...starts) : ends.length > 0 ? Math.min(...ends) : todayStart;
  const fallbackEnd = starts.length === 0 && ends.length === 0 ? startMs + 30 * GANTT_DAY_MS : startMs;
  const endMs = Math.max(startMs, ends.length > 0 ? Math.max(...ends) : fallbackEnd);
  return { startMs, endMs, totalDays: Math.max(1, Math.round((endMs - startMs) / GANTT_DAY_MS)), hasInvertedDates };
};

const toColumns = (raw: Array<{ key: string; label: string; startMs: number; endMs: number }>, axisStartMs: number, totalMs: number): GanttAxisColumn[] =>
  raw.map((c) => ({
    key: c.key,
    label: c.label,
    leftPct: ((c.startMs - axisStartMs) / totalMs) * 100,
    widthPct: ((c.endMs - c.startMs) / totalMs) * 100,
  }));

export const buildGanttAxis = (
  bounds: SmartTimelineBounds,
  zoomMode: GanttZoomMode,
  todayMs: number = Date.now()
): GanttAxis => {
  const sDate = new Date(bounds.startMs);
  const eDate = new Date(bounds.endMs);
  let axisStartMs: number;
  let axisEndMs: number;
  const topGroups: GanttAxisGroup[] = [];
  let columns: GanttAxisColumn[];
  let totalWidthPx: number | null;

  if (zoomMode === 'week') {
    const firstMon = new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate() - ((sDate.getDay() + 6) % 7));
    const endMon = new Date(eDate.getFullYear(), eDate.getMonth(), eDate.getDate() + (7 - ((eDate.getDay() + 6) % 7)));
    axisStartMs = firstMon.getTime();
    axisEndMs = Math.max(axisStartMs + 7 * GANTT_DAY_MS, endMon.getTime());
    const totalDays = Math.round((axisEndMs - axisStartMs) / GANTT_DAY_MS);
    totalWidthPx = totalDays * 36;

    for (let d = 0; d < totalDays; d += 7) {
      const ws = new Date(firstMon.getFullYear(), firstMon.getMonth(), firstMon.getDate() + d);
      const we = new Date(firstMon.getFullYear(), firstMon.getMonth(), firstMon.getDate() + d + 6);
      const label = `${String(ws.getDate()).padStart(2, '0')} ${MONTH_SHORT[ws.getMonth()]} – ${String(we.getDate()).padStart(2, '0')} ${MONTH_SHORT[we.getMonth()]}`;
      topGroups.push({ key: `wk_${ws.getTime()}`, label, widthPct: (7 / totalDays) * 100 });
    }
    columns = Array.from({ length: totalDays }, (_, idx) => {
      const dt = new Date(firstMon.getFullYear(), firstMon.getMonth(), firstMon.getDate() + idx);
      return { key: `d_${dt.getTime()}`, label: String(dt.getDate()), leftPct: (idx / totalDays) * 100, widthPct: (1 / totalDays) * 100 };
    });
  } else if (zoomMode === 'month' || (zoomMode === 'fit' && bounds.totalDays <= 62)) {
    let cur = new Date(sDate.getFullYear(), sDate.getMonth(), 1);
    axisStartMs = cur.getTime();
    axisEndMs = new Date(eDate.getFullYear(), eDate.getMonth() + 1, 1).getTime();
    const totalMs = Math.max(GANTT_DAY_MS, axisEndMs - axisStartMs);
    const rawCols: Array<{ key: string; label: string; startMs: number; endMs: number }> = [];
    while (cur.getTime() < axisEndMs) {
      const y = cur.getFullYear();
      const m = cur.getMonth();
      const next = new Date(y, m + 1, 1);
      topGroups.push({ key: `m_${y}_${m}`, label: `${MONTH_SHORT[m]} ${y}`, widthPct: ((next.getTime() - cur.getTime()) / totalMs) * 100 });
      [1, 8, 15, 22].forEach((day, idx, cuts) => {
        rawCols.push({ key: `w_${y}_${m}_${idx}`, label: `W${idx + 1}`, startMs: new Date(y, m, day).getTime(), endMs: idx < 3 ? new Date(y, m, cuts[idx + 1]).getTime() : next.getTime() });
      });
      cur = next;
    }
    columns = toColumns(rawCols, axisStartMs, totalMs);
    totalWidthPx = zoomMode === 'fit' ? null : Math.round(totalMs / GANTT_DAY_MS) * 12;
  } else {
    let cur = new Date(sDate.getFullYear(), Math.floor(sDate.getMonth() / 3) * 3, 1);
    axisStartMs = cur.getTime();
    axisEndMs = new Date(eDate.getFullYear(), Math.floor(eDate.getMonth() / 3) * 3 + 3, 1).getTime();
    const totalMs = Math.max(GANTT_DAY_MS, axisEndMs - axisStartMs);
    const rawCols: Array<{ key: string; label: string; startMs: number; endMs: number }> = [];
    while (cur.getTime() < axisEndMs) {
      const y = cur.getFullYear();
      const qm = cur.getMonth();
      const next = new Date(y, qm + 3, 1);
      topGroups.push({ key: `q_${y}_${qm}`, label: `Q${Math.floor(qm / 3) + 1} ${y}`, widthPct: ((next.getTime() - cur.getTime()) / totalMs) * 100 });
      for (let i = 0; i < 3; i += 1) {
        const ms = new Date(y, qm + i, 1);
        rawCols.push({ key: `qm_${ms.getFullYear()}_${ms.getMonth()}`, label: MONTH_SHORT[ms.getMonth()], startMs: ms.getTime(), endMs: new Date(y, qm + i + 1, 1).getTime() });
      }
      cur = next;
    }
    columns = toColumns(rawCols, axisStartMs, totalMs);
    totalWidthPx = zoomMode === 'fit' ? null : Math.round(totalMs / GANTT_DAY_MS) * 4;
  }

  const durationMs = Math.max(GANTT_DAY_MS, axisEndMs - axisStartMs);
  const todayOffsetPct = todayMs >= axisStartMs && todayMs <= axisEndMs ? ((todayMs - axisStartMs) / durationMs) * 100 : null;
  return { startMs: axisStartMs, endMs: axisEndMs, durationMs, totalWidthPx, topGroups, columns, todayOffsetPct };
};

export const computeBarPlacement = (
  startDate: string | undefined,
  endDate: string | undefined,
  axisStartMs: number,
  axisEndMs: number,
  totalWidthPx: number | null
): BarPlacement => {
  const s = parsePlanDateMs(startDate);
  const e = parsePlanDateMs(endDate);
  if (s === null && e === null) return { isUnscheduled: true, leftPct: 0, widthPct: 0, labelPosition: 'right' };

  const durationMs = Math.max(GANTT_DAY_MS, axisEndMs - axisStartMs);
  const taskStart = s ?? e!;
  const taskEnd = e !== null ? Math.max(taskStart + GANTT_DAY_MS, e + GANTT_DAY_MS) : taskStart + 5 * GANTT_DAY_MS;
  const clampedStart = Math.max(axisStartMs, Math.min(axisEndMs, taskStart));
  const clampedEnd = Math.max(clampedStart, Math.min(axisEndMs, taskEnd));

  const leftPct = ((clampedStart - axisStartMs) / durationMs) * 100;
  const approxTrackPx = totalWidthPx ?? 760;
  const widthPct = Math.min(100 - leftPct, Math.max((8 / approxTrackPx) * 100, ((clampedEnd - clampedStart) / durationMs) * 100));
  const renderedPx = (widthPct / 100) * approxTrackPx;
  const labelPosition: BarLabelPosition = renderedPx >= 48 ? 'inside' : leftPct + widthPct > 90 ? 'left' : 'right';
  return { isUnscheduled: false, leftPct, widthPct, labelPosition };
};
