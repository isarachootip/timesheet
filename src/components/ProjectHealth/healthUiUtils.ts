import type { Project, User } from '../../types';
import type {
  HealthConfidence,
  HealthFactorKey,
  HealthStatus,
} from '../../types/projectHealth';

export interface FactorDisplayMeta {
  key: HealthFactorKey;
  label: string;
  weightLabel: string;
  description: string;
  optionalWhenNull?: boolean;
}

export const HEALTH_FACTOR_META: FactorDisplayMeta[] = [
  {
    key: 'schedule',
    label: 'Schedule',
    weightLabel: '30%',
    description: 'ความคืบหน้าจริงเทียบกับแผนเวลา และหักคะแนนเมื่อเลยวันสิ้นสุด',
  },
  {
    key: 'overdue',
    label: 'Overdue Tasks',
    weightLabel: '20%',
    description: 'สัดส่วนงานที่ไม่เลยกำหนดส่งในกลุ่มงานที่ยังไม่เสร็จสิ้น',
  },
  {
    key: 'effort',
    label: 'Effort',
    weightLabel: '20%',
    description: 'ชั่วโมงงานที่ทำได้ตามประมาณการ (Earned) เทียบชั่วโมง Timesheet จริง',
  },
  {
    key: 'momentum',
    label: 'Momentum',
    weightLabel: '15%',
    description: 'อัตราการปิดงานใน 14 วันล่าสุด เทียบอัตราที่ต้องทำเพื่อทันวันสิ้นสุด',
  },
  {
    key: 'freshness',
    label: 'Data Freshness',
    weightLabel: '15%',
    description: 'ความสดใหม่ของการอัปเดตสถานะงานหรือบันทึก Timesheet ล่าสุด',
  },
  {
    key: 'sprint',
    label: 'Sprint Health',
    weightLabel: '15%',
    description: 'ความคืบหน้าของงานใน Active Sprint เทียบกรอบเวลาของ Sprint',
    optionalWhenNull: true,
  },
];

export interface HealthStatusStyle {
  label: string;
  dotColor: string;
  textColor: string;
  borderColor: string;
  bgColor: string;
}

export const getHealthStatusStyle = (status: HealthStatus): HealthStatusStyle => {
  switch (status) {
    case 'GREEN':
      return {
        label: 'GREEN',
        dotColor: 'var(--dot-success)',
        textColor: 'var(--accent-success)',
        borderColor: 'var(--dot-success)',
        bgColor: 'var(--bg-tertiary)',
      };
    case 'YELLOW':
      return {
        label: 'YELLOW',
        dotColor: 'var(--dot-warning)',
        textColor: 'var(--accent-warning)',
        borderColor: 'var(--dot-warning)',
        bgColor: 'var(--bg-tertiary)',
      };
    case 'RED':
      return {
        label: 'RED',
        dotColor: 'var(--dot-danger)',
        textColor: 'var(--accent-danger)',
        borderColor: 'var(--accent-danger)',
        bgColor: 'var(--accent-danger-subtle)',
      };
    case 'COMPLETED':
      return {
        label: 'COMPLETED',
        dotColor: 'var(--dot-success)',
        textColor: 'var(--accent-success)',
        borderColor: 'var(--border-color)',
        bgColor: 'var(--bg-tertiary)',
      };
  }
};

export const getScoreBarColor = (score: number | null): string => {
  if (score === null) return 'var(--border-strong)';
  if (score >= 80) return 'var(--dot-success)';
  if (score >= 60) return 'var(--dot-warning)';
  return 'var(--dot-danger)';
};

export const getConfidenceLabel = (confidence: HealthConfidence): string => {
  if (confidence === 'HIGH') return 'Confidence: สูง (HIGH)';
  if (confidence === 'MEDIUM') return 'Confidence: ปานกลาง (MEDIUM)';
  return 'Confidence: ต่ำ (LOW)';
};

const PRIVILEGED_ROLES = new Set(['PM', 'Team Lead', 'Leader']);

export const canUserTriggerHealthAi = (
  user: User | null | undefined,
  project: Project | undefined
): boolean => {
  if (!user) return false;
  if (user.globalRole === 'Admin' || user.globalRole === 'Manager') return true;
  if (!project) return false;
  return project.members.some((m) => m.userId === user.id && PRIVILEGED_ROLES.has(m.role));
};

export const formatHealthTimestamp = (iso: string | null | undefined): string => {
  if (!iso) return '-';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  const dd = String(parsed.getDate()).padStart(2, '0');
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const yyyy = parsed.getFullYear();
  const hh = String(parsed.getHours()).padStart(2, '0');
  const min = String(parsed.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};

export const formatFactorDetailHint = (
  key: string,
  details: Record<string, unknown> | undefined
): string => {
  if (!details) return '';
  if (key === 'schedule' && typeof details.actualPercent === 'number' && typeof details.plannedPercent === 'number') {
    const overdueTxt = Number(details.daysOverdue) > 0 ? ` · เลยกำหนด ${details.daysOverdue} วัน` : '';
    return `จริง ${details.actualPercent}% vs แผน ${details.plannedPercent}%${overdueTxt}`;
  }
  if (key === 'overdue' && typeof details.overdueCount === 'number') {
    return `เลยกำหนด ${details.overdueCount} จาก ${details.openCount ?? 0} งานที่ยังไม่เสร็จ`;
  }
  if (key === 'effort' && typeof details.actualHours === 'number') {
    const earned = typeof details.earnedHours === 'number' ? `${details.earnedHours}h earned / ` : '';
    return `${earned}${details.actualHours}h logged`;
  }
  if (key === 'momentum' && typeof details.actualRate === 'number') {
    const req = typeof details.requiredRate === 'number' ? `${details.requiredRate}h/วัน` : 'เลยวันสิ้นสุด';
    return `อัตราปิดงาน ${details.actualRate}h/วัน vs ต้องทำ ${req}`;
  }
  if (key === 'freshness' && typeof details.daysSinceUpdate === 'number') {
    return `อัปเดตล่าสุดเมื่อ ${details.daysSinceUpdate} วันที่แล้ว`;
  }
  if (key === 'sprint' && typeof details.totalTasks === 'number') {
    const name = typeof details.sprintName === 'string' ? `${details.sprintName} · ` : '';
    const days = typeof details.daysRemaining === 'number'
      ? (details.daysRemaining < 0 ? ` · เลยกำหนด ${Math.abs(details.daysRemaining)} วัน` : ` · เหลือ ${details.daysRemaining} วัน`)
      : '';
  return `${name}เสร็จ ${details.doneTasks ?? 0}/${details.totalTasks} งาน${days}`;
  }
  return '';
};

export const deriveFallbackHealthSummary = (
  projectStatus: string,
  progress: number,
  isOverdueSchedule: boolean,
  hasTasks: boolean
): { status: HealthStatus; healthScore: number | null } => {
  if (projectStatus === 'Completed' || (hasTasks && progress >= 100)) {
    return { status: 'COMPLETED', healthScore: null };
  }
  if (isOverdueSchedule) {
    return { status: 'RED', healthScore: Math.min(55, Math.max(20, progress)) };
  }
  if (progress >= 80) {
    return { status: 'GREEN', healthScore: progress };
  }
  return { status: 'YELLOW', healthScore: Math.max(60, progress || 70) };
};

