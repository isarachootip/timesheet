import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from '../../Dashboard';
import { HealthFactorsGrid } from '../HealthFactorsGrid';
import type { Project, User } from '../../../types';
import type { ProjectHealthSummaryItem } from '../../../types/projectHealth';

afterEach(() => {
  cleanup();
});

const pmUser: User = {
  id: 'u_pm',
  name: 'Nida PM',
  email: 'nida@company.com',
  avatar: '',
  globalRole: 'Employee',
  department: 'PMO',
};

const devMember: User = {
  id: 'u_dev',
  name: 'Dev Member',
  email: 'dev@company.com',
  avatar: '',
  globalRole: 'Employee',
  department: 'Eng',
};

const sampleProjects: Project[] = [
  {
    id: 'p_alpha',
    name: 'Alpha Digital Platform',
    description: 'Core modernization',
    status: 'Active',
    startDate: '2026-07-01',
    endDate: '2026-09-30',
    members: [
      { userId: 'u_pm', role: 'PM' },
      { userId: 'u_dev', role: 'Frontend dev' },
    ],
  },
];

describe('Dashboard AI Summary RBAC & Sprint Factor Card', () => {
  it('shows inline AI summary on Dashboard only for PM/Admin/Manager and hides for regular Member', () => {
    const riskSummaries: ProjectHealthSummaryItem[] = [
      {
        projectId: 'p_alpha',
        calculatedAt: '2026-07-20T09:00:00Z',
        healthScore: 52,
        overallProgress: 40,
        status: 'RED',
        confidence: 'HIGH',
        factors: { schedule: 55, overdue: 40, effort: 60, momentum: 50, freshness: 80, sprint: 35 },
        dataIssues: [],
        trend: 'DOWN',
        scoreDelta: -12,
        aiSummary: 'Sprint 3 ล่าช้ากว่ากำหนด 3 วัน แนะนำเกลี่ยงานค้างด่วน',
        aiTopAction: 'เกลี่ยงานค้างใน Sprint 3',
        aiAnalyzedAt: '2026-07-20T08:30:00Z',
      },
    ];

    render(
      <MemoryRouter>
        <Dashboard
          projects={sampleProjects}
          tasks={[]}
          timesheets={[]}
          currentUser={pmUser}
          projectHealthSummaries={riskSummaries}
        />
      </MemoryRouter>
    );
    expect(screen.getByTestId('dashboard-ai-summary-p_alpha').textContent).toContain(
      'Sprint 3 ล่าช้ากว่ากำหนด 3 วัน'
    );
    cleanup();

    render(
      <MemoryRouter>
        <Dashboard
          projects={sampleProjects}
          tasks={[]}
          timesheets={[]}
          currentUser={devMember}
          projectHealthSummaries={riskSummaries}
        />
      </MemoryRouter>
    );
    expect(screen.queryByTestId('dashboard-ai-summary-p_alpha')).toBeNull();
  });

  it('renders Sprint Health factor card with details when Active Sprint score is non-null', () => {
    render(
      <HealthFactorsGrid
        status="YELLOW"
        confidence="HIGH"
        factors={{ schedule: 80, overdue: 75, effort: 70, momentum: 65, freshness: 100, sprint: 42 }}
        factorDetails={{
          sprint: { sprintName: 'Sprint 3', doneTasks: 2, totalTasks: 5, daysRemaining: -3 },
        }}
        dataIssues={[]}
      />
    );

    const card = screen.getByTestId('factor-card-sprint');
    expect(card.textContent).toContain('Sprint Health');
    expect(card.textContent).toContain('42');
    expect(card.textContent).toContain('Sprint 3');
  });
});
