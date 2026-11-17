import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Dashboard } from '../../Dashboard';
import { ProjectHealthDetailPage } from '../ProjectHealthDetailPage';
import { ToastProvider } from '../../ui/ToastProvider';
import type { Project, User } from '../../../types';
import type { ProjectHealthDetail, ProjectHealthSummaryItem } from '../../../types/projectHealth';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const pmUser: User = {
  id: 'u_pm',
  name: 'Nida PM',
  email: 'nida@company.com',
  avatar: '',
  globalRole: 'Employee',
  department: 'PMO',
};

const sampleProjects: Project[] = [
  {
    id: 'p_alpha',
    name: 'Alpha Digital Platform',
    description: 'Core modernization',
    status: 'Active',
    startDate: '2026-07-01',
    endDate: '2026-09-30',
    members: [{ userId: 'u_pm', role: 'PM' }],
  },
];

describe('Step 4: Project Health Dashboard Table & Detail Page UI', () => {
  it('renders color badge, numeric score, trend arrow on Dashboard and navigates to /projects/:id/health', () => {
    const summaries: ProjectHealthSummaryItem[] = [
      {
        projectId: 'p_alpha',
        calculatedAt: '2026-07-20T09:00:00Z',
        healthScore: 84,
        overallProgress: 60,
        status: 'GREEN',
        confidence: 'HIGH',
        factors: { schedule: 90, overdue: 80, effort: 85, momentum: 75, freshness: 100 },
        dataIssues: [],
        trend: 'UP',
        scoreDelta: 6,
      },
    ];

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                projects={sampleProjects}
                tasks={[]}
                timesheets={[]}
                currentUser={pmUser}
                projectHealthSummaries={summaries}
              />
            }
          />
          <Route path="/projects/:id/health" element={<div data-testid="navigated-health-page">Detail View</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('health-badge-green')).toBeTruthy();
    expect(screen.getByTestId('health-score-value').textContent).toContain('84');
    expect(screen.getByTestId('health-trend-up')).toBeTruthy();

    fireEvent.click(screen.getByText('Alpha Digital Platform'));
    expect(screen.getByTestId('navigated-health-page')).toBeTruthy();
  });

  it('renders factor breakdown, data_issues, trend section, and triggers AI analysis on detail page', async () => {
    const initialDetail: ProjectHealthDetail = {
      projectId: 'p_alpha',
      snapshotId: 'snap_1',
      calculatedAt: '2026-07-20T09:00:00Z',
      healthScore: 68,
      overallProgress: 45,
      status: 'YELLOW',
      confidence: 'MEDIUM',
      factors: { schedule: 70, overdue: 60, effort: null, momentum: 65, freshness: 100 },
      factorDetails: { overdue: { overdueCount: 2, openCount: 5 } },
      dataIssues: [
        { code: 'NO_TIMESHEETS', message: 'ยังไม่มีข้อมูลการลงเวลา', affectedFactors: ['effort'] },
      ],
      trend: 'DOWN',
      scoreDelta: -5,
      aiAnalysis: null,
      aiAnalyzedAt: null,
    };

    const analyzedDetail: ProjectHealthDetail = {
      ...initialDetail,
      snapshotId: 'snap_2',
      aiAnalyzedAt: '2026-07-20T10:30:00Z',
      aiAnalysis: {
        summary: 'โครงการอยู่ในระดับเฝ้าระวังเนื่องจากมีงานค้าง 2 รายการ',
        root_causes: ['ยังไม่มีการบันทึก Timesheet ของทีมพัฒนา'],
        recommendations: [
          {
            priority: 'HIGH',
            action: 'เร่งติดตามงานที่เลยกำหนด 2 รายการและให้ทีมลงเวลา',
            expected_impact: 'เพิ่มความแม่นยำ Effort และยกระดับคะแนนสู่ GREEN',
          },
        ],
      },
    };

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (init?.method === 'POST' && url.includes('/analyze')) {
          return { ok: true, json: async () => analyzedDetail } as Response;
        }
        if (url.includes('/history')) {
          return { ok: true, json: async () => [] } as Response;
        }
        return { ok: true, json: async () => initialDetail } as Response;
      })
    );

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={qc}>
        <ToastProvider>
          <MemoryRouter initialEntries={['/projects/p_alpha/health']}>
            <Routes>
              <Route
                path="/projects/:id/health"
                element={<ProjectHealthDetailPage projects={sampleProjects} currentUser={pmUser} />}
              />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    );

    await waitFor(() => expect(screen.getByTestId('factor-card-schedule')).toBeTruthy());
    expect(screen.getByTestId('health-data-issues').textContent).toContain('ยังไม่มีข้อมูลการลงเวลา');
    expect(screen.getByTestId('health-trend-section')).toBeTruthy();

    fireEvent.click(screen.getByTestId('btn-analyze-ai'));

    await waitFor(() =>
      expect(screen.getByText('โครงการอยู่ในระดับเฝ้าระวังเนื่องจากมีงานค้าง 2 รายการ')).toBeTruthy()
    );
    expect(screen.getByText('ยังไม่มีการบันทึก Timesheet ของทีมพัฒนา')).toBeTruthy();
    expect(screen.getByText('เร่งติดตามงานที่เลยกำหนด 2 รายการและให้ทีมลงเวลา')).toBeTruthy();
    expect(screen.getByTestId('ai-analyzed-at')).toBeTruthy();
  });
});
