import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Project, Task } from '../../types';
import { PlanGantt } from './PlanGantt';
import { computePlanTimelineRange } from './planUtils';

afterEach(() => cleanup());

const twdProject: Project = {
  id: 'p_twd',
  name: 'TWD_LON',
  description: '',
  status: 'Active',
  startDate: '2026-06-10',
  endDate: '2026-05-29',
  members: [],
  projectType: 'dev',
};

const milestones: Task[] = [
  {
    id: 'm1',
    projectId: 'p_twd',
    title: 'Kick off Meeting',
    description: '',
    status: 'Done',
    priority: 'High',
    estimatedHours: 4,
    createdAt: '2026-05-01T00:00:00.000Z',
    startDate: '2026-05-29',
    endDate: '2026-05-29',
  },
  {
    id: 'm2',
    projectId: 'p_twd',
    title: 'Backlog Grooming',
    description: '',
    status: 'To Do',
    priority: 'Low',
    estimatedHours: 2,
    createdAt: '2026-05-01T00:00:00.000Z',
  },
];

const allTasks: Task[] = [
  ...milestones,
  {
    id: 's1',
    projectId: 'p_twd',
    parentId: 'm1',
    title: 'Prepare slide deck',
    description: '',
    status: 'Done',
    priority: 'Medium',
    estimatedHours: 2,
    createdAt: '2026-05-01T00:00:00.000Z',
    startDate: '2026-05-29',
    endDate: '2026-05-30',
  },
];

describe('PlanGantt', () => {
  it('defaults to Month view on single project, shows inverted date notice, Unscheduled pill, subtask expansion, and click-to-edit', () => {
    const projectMap = new Map([[twdProject.id, twdProject]]);
    const range = computePlanTimelineRange(twdProject, milestones, [twdProject], allTasks);
    const onEditTask = vi.fn();

    render(
      <PlanGantt
        milestones={milestones}
        allTasks={allTasks}
        projectMap={projectMap}
        showProjectBadge={false}
        timelineRange={range}
        compareData={null}
        canEditTask={() => true}
        onEditTask={onEditTask}
      />
    );

    expect(screen.getByRole('button', { name: 'Month' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText(/Project start\/end dates are inverted/i)).toBeTruthy();
    expect(screen.getByText('May 2026')).toBeTruthy();
    expect(screen.getByText('Unscheduled')).toBeTruthy();
    expect(screen.getByText('100%')).toBeTruthy();

    // Expand subtask hierarchy
    expect(screen.queryByText('Prepare slide deck')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Expand subtasks' }));
    expect(screen.getByText('Prepare slide deck')).toBeTruthy();

    // Switch to Quarter and Fit views
    fireEvent.click(screen.getByRole('button', { name: 'Quarter' }));
    expect(screen.getByText('Q2 2026')).toBeTruthy();

    // Click task title/bar to edit
    fireEvent.click(screen.getByText('Kick off Meeting'));
    expect(onEditTask).toHaveBeenCalledWith(milestones[0]);
  });

  it('auto-selects Quarter view when showProjectBadge (All Projects) is active', () => {
    const projectMap = new Map([[twdProject.id, twdProject]]);
    const range = computePlanTimelineRange(undefined, milestones, [twdProject], allTasks);

    render(
      <PlanGantt
        milestones={milestones}
        allTasks={allTasks}
        projectMap={projectMap}
        showProjectBadge={true}
        timelineRange={range}
        compareData={null}
      />
    );

    expect(screen.getByRole('button', { name: 'Quarter' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getAllByText('TWD_LON').length).toBeGreaterThanOrEqual(1);
  });
});
