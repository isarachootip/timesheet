import React from 'react';
import { ArrowLeft, FolderKanban } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useAnalyzeProjectHealthMutation,
  useProjectHealthDetail,
  useProjectHealthHistory,
} from '../../hooks/useProjectHealth';
import type { Project, User } from '../../types';
import { formatToDDMMYYYY } from '../../utils';
import { EmptyState } from '../ui/EmptyState';
import { PageSkeleton } from '../ui/Skeleton';
import { toast } from '../ui/ToastProvider';
import { HealthAiAnalysisCard } from './HealthAiAnalysisCard';
import { HealthFactorsGrid } from './HealthFactorsGrid';
import { HealthStatusBadge } from './HealthStatusBadge';
import { HealthTrendChart } from './HealthTrendChart';
import { canUserTriggerHealthAi, formatHealthTimestamp } from './healthUiUtils';

interface ProjectHealthDetailPageProps {
  projects: Project[];
  currentUser: User;
}

export const ProjectHealthDetailPage: React.FC<ProjectHealthDetailPageProps> = ({
  projects,
  currentUser,
}) => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const project = projects.find((p) => p.id === projectId);

  const detailQuery = useProjectHealthDetail(currentUser.id, projectId);
  const historyQuery = useProjectHealthHistory(currentUser.id, projectId, 30);
  const analyzeMutation = useAnalyzeProjectHealthMutation(currentUser.id, projectId);

  const canAnalyze = canUserTriggerHealthAi(currentUser, project);

  const handleAnalyze = () => {
    analyzeMutation.mutate(undefined, {
      onSuccess: (res) => {
        if (res.aiError) {
          toast.info('อัปเดตคะแนน Health Engine แล้ว แต่ระบบ AI ยังไม่พร้อมใช้งาน');
        } else {
          toast.success('วิเคราะห์สุขภาพโครงการด้วย AI สำเร็จ');
        }
      },
      onError: (err) => {
        toast.error(err.message);
      },
    });
  };

  if (detailQuery.isLoading) {
    return <PageSkeleton />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="surface-card" style={{ padding: '24px' }}>
        <EmptyState
          icon={FolderKanban}
          title="ไม่สามารถเปิดข้อมูลสุขภาพโครงการได้"
          description={detailQuery.error?.message || 'ไม่พบโครงการหรือคุณไม่มีสิทธิ์เข้าถึง'}
          actions={[{ label: 'กลับไปหน้า Dashboard', onClick: () => navigate('/') }]}
        />
      </div>
    );
  }

  const health = detailQuery.data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <button
          type="button"
          onClick={() => navigate('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            fontSize: 'var(--fs-13)',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={14} />
          กลับหน้า Dashboard
        </button>

        <button
          type="button"
          onClick={() => navigate(`/projects#${health.projectId}`)}
          style={{
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--accent-primary)',
            fontSize: 'var(--fs-13)',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          ดูข้อมูลโครงการ
        </button>
      </div>

      <section
        className="surface-card"
        style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h1 style={{ fontSize: 'var(--fs-20)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            {project?.name || health.projectId}
          </h1>
          <span style={{ fontSize: 'var(--fs-13)', color: 'var(--text-muted)' }}>
            ระยะเวลา: {project?.startDate ? formatToDDMMYYYY(project.startDate) : '-'} ถึง{' '}
            {project?.endDate ? formatToDDMMYYYY(project.endDate) : 'ไม่กำหนด'} · คำนวณล่าสุด{' '}
            {formatHealthTimestamp(health.calculatedAt)}
          </span>
        </div>

        <HealthStatusBadge
          status={health.status}
          score={health.healthScore}
          trend={health.trend}
          scoreDelta={health.scoreDelta}
          size="md"
        />
      </section>

      <HealthFactorsGrid
        status={health.status}
        confidence={health.confidence}
        factors={health.factors}
        factorDetails={health.factorDetails}
        dataIssues={health.dataIssues}
      />

      <HealthTrendChart history={historyQuery.data || []} />

      <HealthAiAnalysisCard
        aiAnalysis={health.aiAnalysis}
        aiAnalyzedAt={health.aiAnalyzedAt}
        aiError={health.aiError}
        isAnalyzing={analyzeMutation.isPending}
        canAnalyze={canAnalyze}
        onAnalyze={handleAnalyze}
      />
    </div>
  );
};
