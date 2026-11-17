import { clamp, diffCalendarDays, round2, toUtcDayMs } from './dateUtils.js';

const makeIssue = (code, message, factor) => ({ code, message, affectedFactors: [factor] });

export const mergeDataIssues = (issueLists) => {
  const map = new Map();
  for (const list of issueLists) {
    for (const item of list) {
      const existing = map.get(item.code);
      if (!existing) {
        map.set(item.code, { code: item.code, message: item.message, affectedFactors: [...item.affectedFactors] });
      } else {
        for (const f of item.affectedFactors) {
          if (!existing.affectedFactors.includes(f)) existing.affectedFactors.push(f);
        }
      }
    }
  }
  return Array.from(map.values());
};

export const calculateScheduleFactor = ({ project, rollup, todayUtcMs, config }) => {
  const startUtc = toUtcDayMs(project?.start_date ?? project?.startDate);
  const endUtc = toUtcDayMs(project?.end_date ?? project?.endDate);

  if (startUtc === null) {
    return { score: null, details: {}, issues: [makeIssue('MISSING_START_DATE', 'โครงการไม่ได้ระบุวันเริ่มต้น (start_date)', 'schedule')] };
  }
  if (endUtc === null) {
    return { score: null, details: {}, issues: [makeIssue('MISSING_END_DATE', 'โครงการไม่ได้ระบุวันสิ้นสุด (end_date)', 'schedule')] };
  }
  if (startUtc > endUtc) {
    return { score: null, details: {}, issues: [makeIssue('INVERTED_PROJECT_DATES', 'วันเริ่มต้นโครงการอยู่หลังวันสิ้นสุด', 'schedule')] };
  }
  if (rollup.milestones.length === 0) {
    return { score: null, details: {}, issues: [makeIssue('NO_TASKS', 'โครงการยังไม่มีรายการงานสำหรับประเมิน', 'schedule')] };
  }

  const issues = rollup.totalEstimatedHours <= 0
    ? [makeIssue('ZERO_ESTIMATED_HOURS', 'ชั่วโมงประมาณการรวมเป็น 0 (ใช้ค่าเฉลี่ย % ของ Milestone แทนใน Schedule)', 'schedule')]
    : [];

  const totalDays = diffCalendarDays(endUtc, startUtc);
  const elapsedDays = diffCalendarDays(todayUtcMs, startUtc);
  const plannedRatio = totalDays === 0 ? (todayUtcMs < startUtc ? 0 : 1) : clamp(elapsedDays / totalDays, 0, 1);
  const actualRatio = clamp(rollup.overallProgressRatio, 0, 1);

  let score = plannedRatio === 0 ? 100 : Math.min(100, (actualRatio / plannedRatio) * 100);
  const daysOverdue = Math.max(0, diffCalendarDays(todayUtcMs, endUtc));
  let overduePenalty = 0;

  if (daysOverdue > 0 && actualRatio < 1) {
    overduePenalty = Math.floor(daysOverdue / config.schedule.overduePenaltyDaysStep) * config.schedule.overduePenaltyPointsPerStep;
    score = Math.max(0, score - overduePenalty);
  }

  return {
    score: round2(score),
    details: { plannedPercent: round2(plannedRatio * 100), actualPercent: round2(actualRatio * 100), daysOverdue, overduePenalty },
    issues,
  };
};

export const calculateOverdueFactor = ({ rollup, todayUtcMs }) => {
  if (rollup.leafTasks.length === 0) {
    return { score: null, details: {}, issues: [makeIssue('NO_TASKS', 'โครงการยังไม่มีรายการงานสำหรับประเมิน', 'overdue')] };
  }
  const notDone = rollup.leafTasks.filter((t) => !t.isDone);
  if (notDone.length === 0) {
    return { score: 100, details: { overdueCount: 0, openCount: 0 }, issues: [] };
  }
  const overdueCount = notDone.filter((t) => t.endDateUtc !== null && t.endDateUtc < todayUtcMs).length;
  const score = clamp(100 - (overdueCount / notDone.length) * 100, 0, 100);

  return { score: round2(score), details: { overdueCount, openCount: notDone.length }, issues: [] };
};

export const calculateEffortFactor = ({ rollup, timesheets = [], config }) => {
  if (rollup.leafTasks.length === 0) {
    return { score: null, details: {}, issues: [makeIssue('NO_TASKS', 'โครงการยังไม่มีรายการงานสำหรับประเมิน', 'effort')] };
  }
  const issues = [];
  if (rollup.totalEstimatedHours <= 0) {
    issues.push(makeIssue('ZERO_ESTIMATED_HOURS', 'ชั่วโมงประมาณการรวมเป็น 0', 'effort'));
  }

  const validStatuses = new Set(config.timesheetValidStatuses.map((s) => String(s).toLowerCase()));
  const actualHours = timesheets
    .filter((ts) => !(ts.is_personal ?? ts.isPersonal) && validStatuses.has(String(ts.status || '').toLowerCase()))
    .reduce((sum, ts) => sum + (Math.max(0, Number(ts.hours) || 0)), 0);

  if (actualHours <= 0) {
    issues.push(makeIssue('NO_TIMESHEETS', 'ยังไม่มีข้อมูลการลงเวลา (Timesheet ที่อนุมัติแล้วหรือรออนุมัติ)', 'effort'));
  }
  if (issues.length > 0) {
    return { score: null, details: { actualHours: round2(actualHours) }, issues };
  }

  const earnedHours = rollup.leafTasks.reduce((sum, t) => sum + t.effectiveHours * t.progressRatio, 0);
  const score = clamp(Math.min(100, (earnedHours / actualHours) * 100), 0, 100);

  return { score: round2(score), details: { earnedHours: round2(earnedHours), actualHours: round2(actualHours) }, issues: [] };
};

export const calculateMomentumFactor = ({ project, rollup, todayUtcMs, config }) => {
  const startUtc = toUtcDayMs(project?.start_date ?? project?.startDate);
  const endUtc = toUtcDayMs(project?.end_date ?? project?.endDate);

  if (endUtc === null) {
    return { score: null, details: {}, issues: [makeIssue('MISSING_END_DATE', 'โครงการไม่ได้ระบุวันสิ้นสุด (end_date)', 'momentum')] };
  }
  if (startUtc !== null && startUtc > endUtc) {
    return { score: null, details: {}, issues: [makeIssue('INVERTED_PROJECT_DATES', 'วันเริ่มต้นโครงการอยู่หลังวันสิ้นสุด', 'momentum')] };
  }
  if (rollup.leafTasks.length === 0) {
    return { score: null, details: {}, issues: [makeIssue('NO_TASKS', 'โครงการยังไม่มีรายการงานสำหรับประเมิน', 'momentum')] };
  }
  if (rollup.totalEstimatedHours <= 0) {
    return { score: null, details: {}, issues: [makeIssue('ZERO_ESTIMATED_HOURS', 'ชั่วโมงประมาณการรวมเป็น 0', 'momentum')] };
  }

  const lookbackDays = Math.max(1, config.momentum.lookbackDays);
  const closedRecentHours = rollup.leafTasks
    .filter((t) => {
      if (!t.isDone || t.completedDateUtc === null) return false;
      const ageDays = diffCalendarDays(todayUtcMs, t.completedDateUtc);
      return ageDays >= 0 && ageDays <= lookbackDays;
    })
    .reduce((sum, t) => sum + t.effectiveHours, 0);

  const actualRate = closedRecentHours / lookbackDays;
  const remainingHours = rollup.leafTasks.filter((t) => !t.isDone).reduce((sum, t) => sum + t.effectiveHours, 0);
  const daysRemaining = diffCalendarDays(endUtc, todayUtcMs);

  if (remainingHours <= 0) {
    return { score: 100, details: { actualRate: round2(actualRate), requiredRate: 0, daysRemaining }, issues: [] };
  }
  if (daysRemaining <= 0) {
    return { score: 0, details: { actualRate: round2(actualRate), requiredRate: null, daysRemaining }, issues: [] };
  }

  const requiredRate = remainingHours / daysRemaining;
  const score = clamp(Math.min(100, (actualRate / requiredRate) * 100), 0, 100);

  return { score: round2(score), details: { actualRate: round2(actualRate), requiredRate: round2(requiredRate), daysRemaining }, issues: [] };
};

export const calculateFreshnessFactor = ({ tasks = [], timesheets = [], todayUtcMs, config }) => {
  const dateCandidates = [];
  for (const t of tasks) {
    const ms = toUtcDayMs(t.updated_at ?? t.updatedAt ?? t.completed_at ?? t.completedAt ?? t.created_at ?? t.createdAt);
    if (ms !== null) dateCandidates.push(ms);
  }
  for (const ts of timesheets) {
    if (ts.is_personal ?? ts.isPersonal) continue;
    const ms = toUtcDayMs(ts.updated_at ?? ts.updatedAt ?? ts.approved_at ?? ts.approvedAt ?? ts.date);
    if (ms !== null) dateCandidates.push(ms);
  }

  if (dateCandidates.length === 0) {
    return { score: null, details: {}, issues: [makeIssue('NO_ACTIVITY_DATA', 'ยังไม่มีประวัติการอัปเดตงานหรือการลงเวลาในโครงการ', 'freshness')] };
  }

  const latestMs = Math.max(...dateCandidates);
  const daysSinceUpdate = Math.max(0, diffCalendarDays(todayUtcMs, latestMs));
  const sortedTiers = [...config.freshness.tiers].sort((a, b) => a.maxDays - b.maxDays);
  const matchedTier = sortedTiers.find((tier) => daysSinceUpdate <= tier.maxDays);
  const score = matchedTier ? matchedTier.score : config.freshness.staleScore;

  return { score: round2(score), details: { daysSinceUpdate }, issues: [] };
};
