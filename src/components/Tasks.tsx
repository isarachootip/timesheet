import { useState, useEffect } from 'react';
import type { Task, TaskStatus, TaskPriority, Project, User, Sprint, Release, TaskCommit } from '../types';
import { Plus, Filter, Clock, X, Edit, Trash2, GripVertical, Calendar, Bug, FileText, CheckSquare, Layers, GitBranch, GitCommit, ChevronRight, ChevronDown } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const taskTemplates = [
  {
    title: 'Requirement Analysis & Specs Drafting',
    description: 'Gather, analyze, and detail project requirements. Deliverable: PRD / specification document.',
    estimatedHours: '12',
    priority: 'Medium'
  },
  {
    title: 'Database & System Architecture Design',
    description: 'Design database tables, indexes, entity relationships, and backend API endpoints structure.',
    estimatedHours: '16',
    priority: 'High'
  },
  {
    title: 'Database Setup & Initial Schema Migration',
    description: 'Create PostgreSQL database tables, define indexes, foreign keys, and seed initial values.',
    estimatedHours: '6',
    priority: 'High'
  },
  {
    title: 'Backend API Development: Auth & CRUD Operations',
    description: 'Implement API controllers, models, JWT authorization, and validation rules for core resources.',
    estimatedHours: '24',
    priority: 'High'
  },
  {
    title: 'Frontend Page Layouts & Core UI Components',
    description: 'Build responsive views, layouts, navigation, and reusable buttons, modals, cards.',
    estimatedHours: '16',
    priority: 'Medium'
  },
  {
    title: 'Frontend State Management & Backend API Integration',
    description: 'Connect frontend views to API endpoints using fetch/axios, handle loading states and local caching.',
    estimatedHours: '20',
    priority: 'High'
  },
  {
    title: 'Comprehensive QA Testing & Bug Resolution',
    description: 'Execute unit and integration tests, verify responsive display on mobile, fix discovered edge cases.',
    estimatedHours: '16',
    priority: 'High'
  },
  {
    title: 'CI/CD Pipeline Setup & Production Deployment',
    description: 'Configure build scripts, dockerize application, set environment variables, deploy to staging/production server.',
    estimatedHours: '8',
    priority: 'Urgent'
  }
];

interface TasksProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  projects: Project[];
  users: User[];
  sprints: Sprint[];
  setSprints: React.Dispatch<React.SetStateAction<Sprint[]>>;
  releases: Release[];
  setReleases: React.Dispatch<React.SetStateAction<Release[]>>;
}

// ── Draggable Task Card ────────────────────────────────────────────────────────
interface DraggableCardProps {
  task: Task;
  isDragging?: boolean;
  getProjectName: (id: string) => string;
  getParentTaskTitle: (id?: string) => string;
  getUserAvatar: (id?: string) => string;
  getUserName: (id?: string) => string;
  getPriorityColor: (p: TaskPriority) => string;
  statuses: TaskStatus[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, status: TaskStatus) => void;
}

function DraggableCard({
  task,
  isDragging = false,
  getProjectName,
  getParentTaskTitle,
  getUserAvatar,
  getUserName,
  getPriorityColor,
  statuses,
  onEdit,
  onDelete,
  onMove,
}: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.3 : 1,
    transition: isDragging ? 'none' : 'opacity 0.2s ease',
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <TaskCardContent
        task={task}
        getProjectName={getProjectName}
        getParentTaskTitle={getParentTaskTitle}
        getUserAvatar={getUserAvatar}
        getUserName={getUserName}
        getPriorityColor={getPriorityColor}
        statuses={statuses}
        onEdit={onEdit}
        onDelete={onDelete}
        onMove={onMove}
      />
    </div>
  );
}

// ── Task Card Content (reused in DragOverlay too) ─────────────────────────────
interface TaskCardContentProps {
  task: Task;
  isOverlay?: boolean;
  getProjectName: (id: string) => string;
  getParentTaskTitle: (id?: string) => string;
  getUserAvatar: (id?: string) => string;
  getUserName: (id?: string) => string;
  getPriorityColor: (p: TaskPriority) => string;
  statuses: TaskStatus[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, status: TaskStatus) => void;
}

function TaskCardContent({
  task,
  isOverlay = false,
  getProjectName,
  getParentTaskTitle,
  getUserAvatar,
  getUserName,
  getPriorityColor,
  statuses,
  onEdit,
  onDelete,
  onMove,
}: TaskCardContentProps) {
  const getIssueTypeIcon = (type?: string) => {
    switch (type) {
      case 'Bug':
        return <Bug size={14} color="#ef4444" />;
      case 'Story':
        return <FileText size={14} color="#10b981" />;
      case 'Sub-task':
        return <GitBranch size={14} color="#a855f7" />;
      default:
        return <CheckSquare size={14} color="#3b82f6" />;
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1rem',
        background: 'var(--bg-secondary)',
        borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
        borderRadius: '10px',
        boxShadow: isOverlay
          ? '0 20px 60px rgba(0,0,0,0.5), 0 0 0 2px rgba(139,92,246,0.4)'
          : undefined,
        cursor: isOverlay ? 'grabbing' : 'default',
        userSelect: 'none',
      }}
    >
      {/* Card top row: project name + drag handle + actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.5rem',
        }}
      >
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
          {getProjectName(task.projectId)}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-muted)',
              padding: '2px',
              pointerEvents: 'none',
            }}
          >
            <GripVertical size={14} />
          </span>
          <button
            onClick={() => onEdit(task)}
            onPointerDown={(e) => e.stopPropagation()}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}
          >
            <Edit size={12} />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            onPointerDown={(e) => e.stopPropagation()}
            style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: 0 }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Parent badge */}
      {task.parentId && (
        <div
          style={{
            fontSize: '0.7rem',
            color: 'var(--accent-info)',
            marginBottom: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          <span>📁 Under: {getParentTaskTitle(task.parentId)}</span>
        </div>
      )}

      {/* Title */}
      <h4
        style={{
          fontSize: '0.925rem',
          fontWeight: 600,
          marginBottom: '0.5rem',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          flexWrap: 'wrap',
        }}
      >
        {!task.parentId && (
          <span
            style={{
              fontSize: '0.7rem',
              background: 'var(--bg-tertiary)',
              padding: '0.1rem 0.35rem',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              flexShrink: 0,
            }}
          >
            Main
          </span>
        )}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          {getIssueTypeIcon(task.issueType)}
        </span>
        {task.title}
      </h4>

      {/* Description */}
      <p
        style={{
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          marginBottom: '1rem',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {task.description}
      </p>

      {/* Footer: hours, SP, status select, avatar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={12} /> {task.estimatedHours}h
          </span>
          {task.storyPoints !== undefined && task.storyPoints > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-primary)',
                fontWeight: 600,
                fontSize: '0.7rem',
                padding: '0.1rem 0.4rem',
                borderRadius: '50px',
                border: '1px solid rgba(99, 102, 241, 0.3)'
              }}
              title="Story Points"
            >
              {task.storyPoints} SP
            </span>
          )}
          {task.startDate && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              📅 {task.startDate}{task.endDate ? ` → ${task.endDate}` : ''}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <select
            value={task.status}
            onChange={(e) => onMove(task.id, e.target.value as TaskStatus)}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              fontSize: '0.7rem',
              padding: '0.1rem 0.25rem',
              borderRadius: 'var(--radius-sm)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {statuses.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
          <img
            src={getUserAvatar(task.assigneeId)}
            alt={getUserName(task.assigneeId)}
            title={getUserName(task.assigneeId)}
            style={{ width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0 }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Droppable Column ───────────────────────────────────────────────────────────
interface DroppableColumnProps {
  colStatus: TaskStatus;
  tasks: Task[];
  activeId: string | null;
  overColumnId: string | null;
  getProjectName: (id: string) => string;
  getParentTaskTitle: (id?: string) => string;
  getUserAvatar: (id?: string) => string;
  getUserName: (id?: string) => string;
  getPriorityColor: (p: TaskPriority) => string;
  statuses: TaskStatus[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, status: TaskStatus) => void;
}

function DroppableColumn({
  colStatus,
  tasks,
  activeId,
  overColumnId,
  getProjectName,
  getParentTaskTitle,
  getUserAvatar,
  getUserName,
  getPriorityColor,
  statuses,
  onEdit,
  onDelete,
  onMove,
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: colStatus });

  const isHighlighted = isOver || overColumnId === colStatus;

  const colHeaderColors: Record<string, string> = {
    'To Do': '#6366f1',
    'In Progress': '#f59e0b',
    'Review': '#3b82f6',
    'Done': '#10b981',
  };

  return (
    <div
      ref={setNodeRef}
      className="glass-panel kanban-column"
      style={{
        padding: '1.25rem',
        background: isHighlighted
          ? 'rgba(139, 92, 246, 0.08)'
          : 'rgba(22, 26, 34, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        maxHeight: 'calc(100vh - 280px)',
        overflowY: 'auto',
        border: isHighlighted
          ? '2px solid rgba(139, 92, 246, 0.7)'
          : '2px solid transparent',
        borderRadius: '12px',
        transition: 'border-color 0.15s ease, background 0.15s ease',
      }}
    >
      {/* Column Header */}
      <div
        style={{
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: colHeaderColors[colStatus] || 'var(--accent-primary)',
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          <span style={{ fontWeight: 600 }}>{colStatus}</span>
          <span
            style={{
              fontSize: '0.75rem',
              padding: '0.1rem 0.5rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
            }}
          >
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Task Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '60px' }}>
        {tasks.map((task) => (
          <DraggableCard
            key={task.id}
            task={task}
            isDragging={activeId === task.id}
            getProjectName={getProjectName}
            getParentTaskTitle={getParentTaskTitle}
            getUserAvatar={getUserAvatar}
            getUserName={getUserName}
            getPriorityColor={getPriorityColor}
            statuses={statuses}
            onEdit={onEdit}
            onDelete={onDelete}
            onMove={onMove}
          />
        ))}
        {tasks.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '2rem 1rem',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              border: '2px dashed var(--border-color)',
              borderRadius: '8px',
              opacity: isHighlighted ? 0.8 : 0.4,
              transition: 'opacity 0.15s ease',
            }}
          >
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

const getIssueTypeIconGlobal = (type?: string) => {
  switch (type) {
    case 'Bug':
      return <Bug size={14} color="#ef4444" />;
    case 'Story':
      return <FileText size={14} color="#10b981" />;
    case 'Sub-task':
      return <GitBranch size={14} color="#a855f7" />;
    default:
      return <CheckSquare size={14} color="#3b82f6" />;
  }
};

const getTaskKeyGlobal = (task: Task, projects: Project[]) => {
  const proj = projects.find((p) => p.id === task.projectId);
  const prefix = proj
    ? proj.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 3)
    : 'TS';
  const suffix = task.id.includes('_') ? task.id.split('_')[1].slice(-4) : task.id.slice(-4);
  return `${prefix}-${suffix}`;
};

const getJiraStatusStyle = (status: TaskStatus) => {
  const s = status.toUpperCase();
  if (s.includes('TO DO') || s.includes('BACKLOG') || s.includes('PLANNED')) {
    return { bg: '#2d3748', color: '#cbd5e1' }; // dark gray/blue, light text
  }
  if (s.includes('PROGRESS') || s.includes('DEVELOP') || s.includes('ACTIVE')) {
    return { bg: '#1e3a8a', color: '#bfdbfe' }; // deep blue
  }
  if (s.includes('DONE') || s.includes('COMPLETED') || s.includes('FINISHED')) {
    return { bg: '#064e3b', color: '#a7f3d0' }; // dark green
  }
  return { bg: '#581c87', color: '#f3e8ff' }; // dark purple
};

const formatDueDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

interface BacklogTaskRowProps {
  task: Task;
  projects: Project[];
  openEditModal: (t: Task) => void;
  activeColumns: TaskStatus[];
  onMoveStatus: (id: string, status: TaskStatus) => void;
  onMoveSprint: (id: string, sprintId: string | undefined) => void;
  projectSprints: Sprint[];
  getUserAvatar: (id?: string) => string;
  getUserName: (id?: string) => string;
}

function BacklogTaskRow({
  task,
  projects,
  openEditModal,
  activeColumns,
  onMoveStatus,
  onMoveSprint,
  projectSprints,
  getUserAvatar,
  getUserName,
}: BacklogTaskRowProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? {
        transform: CSS.Transform.toString(transform),
        opacity: 0.5,
        zIndex: 1000,
      }
    : undefined;

  const statusStyle = getJiraStatusStyle(task.status);

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.6rem 1rem',
        background: isDragging ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        fontSize: '0.85rem',
        transition: 'background-color 0.2s',
        gap: '1rem',
      }}
      {...attributes}
    >
      {/* Left section: drag handle, issue type, key, title */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          overflow: 'hidden',
          flex: 1,
        }}
      >
        <span
          {...listeners}
          style={{
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            cursor: 'grab',
            padding: '2px',
          }}
          title="Drag to reorder/move to sprint"
        >
          <GripVertical size={14} />
        </span>
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {getIssueTypeIconGlobal(task.issueType)}
        </span>
        <span
          style={{
            color: 'var(--text-muted)',
            fontWeight: 500,
            fontSize: '0.8rem',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {getTaskKeyGlobal(task, projects)}
        </span>
        <span
          onClick={() => openEditModal(task)}
          style={{
            fontWeight: 500,
            color: 'var(--text-primary)',
            cursor: 'pointer',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={task.title}
        >
          {task.title}
        </span>
      </div>

      {/* Right section: status, sprint, due date, story points, assignee, edit */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexShrink: 0,
        }}
      >
        {/* Inline Status Select (Jira status badge styled) */}
        <select
          value={task.status}
          onChange={(e) => onMoveStatus(task.id, e.target.value as TaskStatus)}
          style={{
            background: statusStyle.bg,
            color: statusStyle.color,
            border: 'none',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '0.25rem 0.5rem',
            cursor: 'pointer',
            outline: 'none',
            textTransform: 'uppercase',
          }}
        >
          {activeColumns.map((col) => (
            <option
              key={col}
              value={col}
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
            >
              {col}
            </option>
          ))}
        </select>

        {/* Quick Sprint Move Dropdown */}
        <select
          value={task.sprintId || ''}
          onChange={(e) => onMoveSprint(task.id, e.target.value || undefined)}
          style={{
            background: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            fontSize: '0.75rem',
            padding: '0.2rem 0.4rem',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="">Backlog</option>
          {projectSprints
            .filter((s) => s.status !== 'Completed')
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
        </select>

        {/* Due Date Badge */}
        {task.endDate && (
          <span
            style={{
              fontSize: '0.75rem',
              color:
                new Date(task.endDate) < new Date() && task.status !== 'Done'
                  ? 'var(--accent-danger)'
                  : 'var(--text-secondary)',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '0.2rem 0.4rem',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
            }}
            title={`Due date: ${task.endDate}`}
          >
            {formatDueDate(task.endDate)}
          </span>
        )}

        {/* Story Points Pill */}
        {task.storyPoints !== undefined && task.storyPoints > 0 ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--border-color)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '0.75rem',
              width: '22px',
              height: '22px',
              borderRadius: '50%',
            }}
            title={`${task.storyPoints} Story Points`}
          >
            {task.storyPoints}
          </span>
        ) : (
          <span style={{ width: '22px', height: '22px', display: 'inline-block' }} />
        )}

        {/* Assignee Avatar */}
        <img
          src={getUserAvatar(task.assigneeId)}
          alt={getUserName(task.assigneeId)}
          title={getUserName(task.assigneeId)}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: '1px solid var(--border-color)',
          }}
        />

        {/* Edit Button */}
        <button
          onClick={() => openEditModal(task)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
          }}
          title="Edit Task"
        >
          <Edit size={14} />
        </button>
      </div>
    </div>
  );
}

interface DroppableSprintSectionProps {
  sprintId: string;
  sprintName: string;
  sprintDates?: string;
  sprintStatus: 'Active' | 'Planned' | 'Completed';
  tasks: Task[];
  children: React.ReactNode;
  onComplete?: () => void;
  onStart?: () => void;
  onDelete?: () => void;
  storyPoints: { completed: number; total: number };
  isExpanded: boolean;
  onToggleExpand: () => void;
  onQuickCreate: () => void;
  onEditDates: () => void;
}

function DroppableSprintSection({
  sprintId,
  sprintName,
  sprintDates,
  sprintStatus,
  tasks,
  children,
  onComplete,
  onStart,
  onDelete,
  storyPoints,
  isExpanded,
  onToggleExpand,
  onQuickCreate,
  onEditDates,
}: DroppableSprintSectionProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: sprintId,
  });

  return (
    <div
      ref={setNodeRef}
      className="glass-panel"
      style={{
        padding: '1.25rem',
        background: isOver ? 'rgba(99, 102, 241, 0.08)' : 'rgba(22, 26, 34, 0.4)',
        border: isOver ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        transition: 'all 0.15s ease',
      }}
    >
      {/* Header Panel */}
      <div
        className="flex-between"
        style={{ cursor: 'pointer', userSelect: 'none' }}
        onClick={onToggleExpand}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          {isExpanded ? (
            <ChevronDown size={16} color="var(--text-secondary)" />
          ) : (
            <ChevronRight size={16} color="var(--text-secondary)" />
          )}
          <span style={{ fontWeight: 600, fontSize: '1rem' }}>{sprintName}</span>

          {sprintStatus === 'Active' && (
            <span
              style={{
                fontSize: '0.7rem',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--accent-secondary)',
                padding: '0.1rem 0.45rem',
                borderRadius: '4px',
                fontWeight: 700,
              }}
            >
              ACTIVE
            </span>
          )}

          <span
            onClick={(e) => {
              e.stopPropagation();
              onEditDates();
            }}
            style={{
              fontSize: '0.8rem',
              color: sprintDates ? 'var(--text-secondary)' : 'var(--text-muted)',
              cursor: 'pointer',
              textDecoration: 'underline',
              textDecorationStyle: 'dashed',
            }}
            title="Click to edit sprint dates"
          >
            {sprintDates || 'Add dates'}
          </span>

          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            • {tasks.length} work items
          </span>
        </div>

        {/* Right Info and Actions */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
          onClick={(e) => e.stopPropagation()}
        >
          <span
            style={{
              fontSize: '0.8rem',
              background: 'var(--bg-tertiary)',
              padding: '0.2rem 0.6rem',
              borderRadius: '50px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            Story Points: {storyPoints.completed} / {storyPoints.total}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {sprintStatus === 'Active' && onComplete && (
              <button
                onClick={onComplete}
                style={{
                  background: 'var(--accent-secondary)',
                  color: 'white',
                  border: 'none',
                  padding: '0.3rem 0.8rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              >
                Complete Sprint
              </button>
            )}

            {sprintStatus === 'Planned' && onStart && (
              <button
                onClick={onStart}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--accent-secondary)',
                  color: 'var(--accent-secondary)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                Start Sprint
              </button>
            )}

            {onDelete && (
              <button
                onClick={onDelete}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent-danger)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Accordion Content */}
      {isExpanded && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            marginTop: '0.5rem',
          }}
        >
          {children}

          <div
            onClick={onQuickCreate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.75rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              borderRadius: '4px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Plus size={14} /> Create task
          </div>
        </div>
      )}
    </div>
  );
}

interface DroppableBacklogSectionProps {
  tasks: Task[];
  children: React.ReactNode;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onQuickCreate: () => void;
  onCreateSprint: () => void;
}

function DroppableBacklogSection({
  tasks,
  children,
  isExpanded,
  onToggleExpand,
  onQuickCreate,
  onCreateSprint,
}: DroppableBacklogSectionProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'backlog',
  });

  return (
    <div
      ref={setNodeRef}
      className="glass-panel"
      style={{
        padding: '1.25rem',
        background: isOver ? 'rgba(99, 102, 241, 0.08)' : 'rgba(22, 26, 34, 0.4)',
        border: isOver ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        transition: 'all 0.15s ease',
      }}
    >
      {/* Header Panel */}
      <div
        className="flex-between"
        style={{ cursor: 'pointer', userSelect: 'none' }}
        onClick={onToggleExpand}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isExpanded ? (
            <ChevronDown size={16} color="var(--text-secondary)" />
          ) : (
            <ChevronRight size={16} color="var(--text-secondary)" />
          )}
          <span style={{ fontWeight: 600, fontSize: '1rem' }}>Project Backlog</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            ({tasks.length} tasks)
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onCreateSprint();
          }}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            padding: '0.4rem 1rem',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '0.8rem',
          }}
        >
          Create Sprint
        </button>
      </div>

      {/* Accordion Content */}
      {isExpanded && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            marginTop: '0.5rem',
          }}
        >
          {children}

          <div
            onClick={onQuickCreate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.75rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              borderRadius: '4px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Plus size={14} /> Create task
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Tasks Component ───────────────────────────────────────────────────────
export const Tasks = ({ tasks, setTasks, projects, users, sprints, setSprints, releases, setReleases }: TasksProps) => {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState<'board' | 'backlog' | 'releases'>('board');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [commits, setCommits] = useState<TaskCommit[]>([]);

  // DnD state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('To Do');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [taskCategory, setTaskCategory] = useState<'Main' | 'Sub'>('Main');
  const [parentId, setParentId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Agile additional states
  const [sprintId, setSprintId] = useState('');
  const [releaseId, setReleaseId] = useState('');
  const [storyPoints, setStoryPoints] = useState('');
  const [issueType, setIssueType] = useState<'Bug' | 'Story' | 'Task' | 'Sub-task'>('Task');

  // Expanded sprints toggle state (expanded by default)
  const [expandedSprints, setExpandedSprints] = useState<Record<string, boolean>>({ backlog: true });
  // Quick task creation states
  const [quickCreateSprintId, setQuickCreateSprintId] = useState<string | null>(null);
  const [quickCreateTitle, setQuickCreateTitle] = useState('');

  const toggleSprintExpanded = (sId: string) => {
    setExpandedSprints((prev) => ({ ...prev, [sId]: prev[sId] === false }));
  };

  const handleQuickCreate = (sId: string | undefined, qTitle: string) => {
    if (!qTitle.trim()) {
      setQuickCreateSprintId(null);
      return;
    }
    const taskData: Task = {
      id: 't_' + Date.now(),
      projectId: selectedProject,
      title: qTitle.trim(),
      description: '',
      status: activeColumns[0] || 'To Do',
      priority: 'Medium',
      estimatedHours: 0,
      createdAt: new Date().toISOString(),
      sprintId: sId || undefined,
      issueType: 'Task',
    };
    setTasks((prev) => [...prev, taskData]);
    setQuickCreateTitle('');
    setQuickCreateSprintId(null);
  };

  const handleBacklogDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const taskId = String(active.id);
    const destinationId = String(over.id);

    let targetSprintId: string | undefined = undefined;

    if (destinationId === 'backlog') {
      targetSprintId = undefined;
    } else if (destinationId.startsWith('s_')) {
      targetSprintId = destinationId;
    } else {
      const targetTask = tasks.find((t) => t.id === destinationId);
      if (targetTask) {
        targetSprintId = targetTask.sprintId;
      } else {
        return;
      }
    }

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, sprintId: targetSprintId } : t))
    );
  };

  const editSprintDates = (sId: string) => {
    const sprint = sprints.find((s) => s.id === sId);
    if (!sprint) return;
    const datesStr = prompt(
      `Enter dates for ${sprint.name} (e.g. 15 Jun - 29 Jun):`,
      sprint.startDate && sprint.endDate ? `${sprint.startDate} - ${sprint.endDate}` : ''
    );
    if (datesStr === null) return;

    if (!datesStr.trim()) {
      setSprints((prev) =>
        prev.map((s) => (s.id === sId ? { ...s, startDate: undefined, endDate: undefined } : s))
      );
      return;
    }

    const parts = datesStr.split(/[-—–to]/);
    if (parts.length >= 2) {
      setSprints((prev) =>
        prev.map((s) =>
          s.id === sId ? { ...s, startDate: parts[0].trim(), endDate: parts[1].trim() } : s
        )
      );
    } else {
      setSprints((prev) =>
        prev.map((s) => (s.id === sId ? { ...s, startDate: datesStr.trim(), endDate: undefined } : s))
      );
    }
  };

  // Load project-specific columns
  const getProjectColumns = () => {
    if (selectedProject === 'all') {
      return ['To Do', 'In Progress', 'Review', 'Done'];
    }
    const proj = projects.find((p) => p.id === selectedProject);
    return proj?.customColumns && proj.customColumns.length > 0
      ? proj.customColumns
      : ['To Do', 'In Progress', 'Review', 'Done'];
  };

  const activeColumns = getProjectColumns();

  // Fetch commits when editing task
  useEffect(() => {
    if (editingTask) {
      fetch(`/api/tasks/${editingTask.id}/commits`)
        .then((res) => res.json())
        .then((data) => setCommits(data || []))
        .catch((err) => console.error('Error fetching commits:', err));
    } else {
      setCommits([]);
    }
  }, [editingTask]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const filteredTasks =
    selectedProject === 'all'
      ? tasks
      : tasks.filter((t) => t.projectId === selectedProject);

  const getProjectName = (id: string) =>
    projects.find((p) => p.id === id)?.name || 'Unknown Project';

  const getUserAvatar = (id?: string) => {
    if (!id) return 'https://i.pravatar.cc/150?u=unassigned';
    return users.find((u) => u.id === id)?.avatar || 'https://i.pravatar.cc/150?u=unassigned';
  };

  const getUserName = (id?: string) => {
    if (!id) return 'Unassigned';
    return users.find((u) => u.id === id)?.name || 'Unknown User';
  };

  const getPriorityColor = (prio: TaskPriority) => {
    switch (prio) {
      case 'Urgent': return 'var(--accent-danger)';
      case 'High': return 'var(--accent-warning)';
      case 'Medium': return 'var(--accent-info)';
      default: return 'var(--text-muted)';
    }
  };

  const getParentTaskTitle = (pId?: string) => {
    if (!pId) return '';
    return tasks.find((t) => t.id === pId)?.title || '';
  };

  const openAddModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setStatus(activeColumns[0] || 'To Do');
    setPriority('Medium');
    setEstimatedHours('');
    setAssigneeId('');
    setProjectId(selectedProject !== 'all' ? selectedProject : projects[0]?.id || '');
    setTaskCategory('Main');
    setParentId('');
    setStartDate('');
    setEndDate('');
    setSprintId('');
    setReleaseId('');
    setStoryPoints('');
    setIssueType('Task');
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setStatus(task.status);
    setPriority(task.priority);
    setEstimatedHours(String(task.estimatedHours));
    setAssigneeId(task.assigneeId || '');
    setProjectId(task.projectId);
    setTaskCategory(task.parentId ? 'Sub' : 'Main');
    setParentId(task.parentId || '');
    setStartDate(task.startDate || '');
    setEndDate(task.endDate || '');
    setSprintId(task.sprintId || '');
    setReleaseId(task.releaseId || '');
    setStoryPoints(task.storyPoints ? String(task.storyPoints) : '');
    setIssueType(task.issueType || 'Task');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !projectId) return alert('Title and Project are required');

    const est = estimatedHours ? Number(estimatedHours) : 0;
    const spVal = storyPoints ? Number(storyPoints) : 0;
    const parentVal = taskCategory === 'Sub' ? parentId : undefined;

    if (taskCategory === 'Sub') {
      if (!parentId) return alert('Please select a Main Task for this Subtask');
      const parentTask = tasks.find((t) => t.id === parentId);
      if (parentTask) {
        const parentLimit = parentTask.estimatedHours;
        const otherSubtasksHours = tasks
          .filter((t) => t.parentId === parentId && t.id !== (editingTask?.id || ''))
          .reduce((sum, t) => sum + t.estimatedHours, 0);

        if (otherSubtasksHours + est > parentLimit) {
          return alert(
            `Cannot save. Total subtask hours (${otherSubtasksHours + est}h) would exceed the Main Task's budgeted limit of ${parentLimit}h. (Already used: ${otherSubtasksHours}h)`
          );
        }
      }
    }

    const taskData: Task = {
      id: editingTask ? editingTask.id : 't_' + Date.now(),
      projectId,
      title,
      description,
      status,
      priority,
      estimatedHours: est,
      assigneeId: assigneeId || undefined,
      createdAt: editingTask ? editingTask.createdAt : new Date().toISOString(),
      parentId: parentVal,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      sprintId: sprintId || undefined,
      releaseId: releaseId || undefined,
      storyPoints: spVal || undefined,
      issueType: taskCategory === 'Sub' ? 'Sub-task' : issueType,
    };

    if (editingTask) {
      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? taskData : t)));
    } else {
      setTasks((prev) => [...prev, taskData]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const moveTask = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
  };

  // ── DnD Handlers ────────────────────────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    setOverColumnId(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id;
    if (overId && activeColumns.includes(overId as TaskStatus)) {
      setOverColumnId(String(overId));
    } else {
      setOverColumnId(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverColumnId(null);

    if (!over) return;

    const draggedTaskId = String(active.id);
    const overId = String(over.id);

    // If dropped over a column status
    if (activeColumns.includes(overId as TaskStatus)) {
      moveTask(draggedTaskId, overId as TaskStatus);
      return;
    }

    // If dropped over another card - find which column the card belongs to
    const targetTask = tasks.find((t) => t.id === overId);
    if (targetTask) {
      moveTask(draggedTaskId, targetTask.status);
    }
  };

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  // ── Agile View Helpers ──────────────────────────────────────────────────────
  const projectSprints = sprints.filter((s) => s.projectId === selectedProject);
  const projectReleases = releases.filter((r) => r.projectId === selectedProject);
  const activeSprint = projectSprints.find((s) => s.status === 'Active');
  const plannedSprints = projectSprints.filter((s) => s.status === 'Planned');
  const backlogTasks = filteredTasks.filter((t) => !t.sprintId);

  const createSprint = () => {
    if (selectedProject === 'all') return alert('Please select a project first');
    const newSprint: Sprint = {
      id: 's_' + Date.now(),
      projectId: selectedProject,
      name: `Sprint ${projectSprints.length + 1}`,
      status: 'Planned',
    };
    setSprints((prev) => [...prev, newSprint]);
  };

  const startSprint = (sId: string) => {
    if (activeSprint) return alert('Only one sprint can be active at a time.');
    const today = new Date().toISOString().split('T')[0];
    setSprints((prev) =>
      prev.map((s) => (s.id === sId ? { ...s, status: 'Active', startDate: today } : s))
    );
  };

  const completeSprint = (sId: string) => {
    if (!confirm('Are you sure you want to complete this Sprint?')) return;
    
    const activeCols = getProjectColumns();
    const doneCol = activeCols[activeCols.length - 1];

    const incompleteTasks = filteredTasks.filter((t) => t.sprintId === sId && t.status !== doneCol);
    if (incompleteTasks.length > 0) {
      const option = confirm(
        `There are ${incompleteTasks.length} incomplete tasks. Press OK to move them back to the Backlog, or CANCEL to keep them in this sprint (will be archived).`
      );
      if (option) {
        setTasks((prev) =>
          prev.map((t) =>
            t.sprintId === sId && t.status !== doneCol ? { ...t, sprintId: undefined } : t
          )
        );
      }
    }

    setSprints((prev) =>
      prev.map((s) =>
        s.id === sId
          ? {
              ...s,
              status: 'Completed',
              endDate: new Date().toISOString().split('T')[0],
            }
          : s
      )
    );
  };

  const createRelease = () => {
    if (selectedProject === 'all') return alert('Please select a project first');
    const name = prompt('Enter release version (e.g. v1.0.0):');
    if (!name) return;
    const newRelease: Release = {
      id: 'r_' + Date.now(),
      projectId: selectedProject,
      name,
      status: 'Unreleased',
    };
    setReleases((prev) => [...prev, newRelease]);
  };

  const toggleReleaseStatus = (rId: string) => {
    setReleases((prev) =>
      prev.map((r) =>
        r.id === rId
          ? {
              ...r,
              status: r.status === 'Released' ? 'Unreleased' : 'Released',
              releaseDate: r.status === 'Unreleased' ? new Date().toISOString().split('T')[0] : undefined,
            }
          : r
      )
    );
  };

  const deleteRelease = (rId: string) => {
    if (confirm('Are you sure you want to delete this Release?')) {
      setReleases((prev) => prev.filter((r) => r.id !== rId));
    }
  };

  const deleteSprint = (sId: string) => {
    if (confirm('Are you sure you want to delete this Sprint? Tasks will be returned to Backlog.')) {
      setTasks((prev) =>
        prev.map((t) => (t.sprintId === sId ? { ...t, sprintId: undefined } : t))
      );
      setSprints((prev) => prev.filter((s) => s.id !== sId));
    }
  };

  const getSprintStoryPoints = (sId: string) => {
    const sprintTasks = filteredTasks.filter((t) => t.sprintId === sId);
    const total = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    
    const activeCols = getProjectColumns();
    const doneCol = activeCols[activeCols.length - 1];
    const completed = sprintTasks
      .filter((t) => t.status === doneCol)
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
      
    return { total, completed };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
      {/* Top Bar */}
      <div className="flex-between" style={{ gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 className="text-gradient" style={{ marginBottom: '0.5rem' }}>
            Tasks & Agile Planner
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Track and manage project tasks across Agile boards, sprints, and releases.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div
            className="glass-panel"
            style={{
              padding: '0.25rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Filter size={16} color="var(--text-secondary)" />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              <option value="all" style={{ background: 'var(--bg-secondary)' }}>
                All Projects
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} style={{ background: 'var(--bg-secondary)' }}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={openAddModal}
            style={{
              background: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            className="hover-lift"
          >
            <Plus size={18} /> Add Task
          </button>
        </div>
      </div>

      {/* Sub-navbar */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveSubTab('board')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeSubTab === 'board' ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: activeSubTab === 'board' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontWeight: activeSubTab === 'board' ? 600 : 400,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <Layers size={16} /> Kanban Board
        </button>
        <button
          onClick={() => setActiveSubTab('backlog')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeSubTab === 'backlog' ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: activeSubTab === 'backlog' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontWeight: activeSubTab === 'backlog' ? 600 : 400,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <Layers size={16} /> Sprints & Backlog Planner
        </button>
        <button
          onClick={() => setActiveSubTab('releases')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeSubTab === 'releases' ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: activeSubTab === 'releases' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontWeight: activeSubTab === 'releases' ? 600 : 400,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <Calendar size={16} /> Releases / Versions
        </button>
      </div>

      {/* CONDITIONAL SUBTAB RENDERING */}
      {activeSubTab === 'board' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div
            className="kanban-board"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${activeColumns.length}, minmax(250px, 1fr))`,
              gap: '1.25rem',
              flex: 1,
              overflowX: 'auto',
              alignItems: 'start',
            }}
          >
            {activeColumns.map((colStatus) => {
              const statusTasks = filteredTasks.filter((t) => t.status === colStatus);
              return (
                <DroppableColumn
                  key={colStatus}
                  colStatus={colStatus}
                  tasks={statusTasks}
                  activeId={activeId}
                  overColumnId={overColumnId}
                  getProjectName={getProjectName}
                  getParentTaskTitle={getParentTaskTitle}
                  getUserAvatar={getUserAvatar}
                  getUserName={getUserName}
                  getPriorityColor={getPriorityColor}
                  statuses={activeColumns}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  onMove={moveTask}
                />
              );
            })}
          </div>

          <DragOverlay>
            {activeTask ? (
              <TaskCardContent
                task={activeTask}
                isOverlay
                getProjectName={getProjectName}
                getParentTaskTitle={getParentTaskTitle}
                getUserAvatar={getUserAvatar}
                getUserName={getUserName}
                getPriorityColor={getPriorityColor}
                statuses={activeColumns}
                onEdit={openEditModal}
                onDelete={handleDelete}
                onMove={moveTask}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {activeSubTab === 'backlog' && (
        selectedProject === 'all' ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <h3>Please Select a Project</h3>
            <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
              Backlog and Sprint planning require filtering by a specific project. Use the filter dropdown above.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={(event) => setActiveId(String(event.active.id))}
            onDragEnd={handleBacklogDragEnd}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Active Sprint Section */}
              {activeSprint && (
                <DroppableSprintSection
                  sprintId={activeSprint.id}
                  sprintName={activeSprint.name}
                  sprintDates={
                    activeSprint.startDate && activeSprint.endDate
                      ? `${activeSprint.startDate} - ${activeSprint.endDate}`
                      : undefined
                  }
                  sprintStatus="Active"
                  tasks={filteredTasks.filter((t) => t.sprintId === activeSprint.id)}
                  storyPoints={getSprintStoryPoints(activeSprint.id)}
                  isExpanded={expandedSprints[activeSprint.id] !== false}
                  onToggleExpand={() => toggleSprintExpanded(activeSprint.id)}
                  onComplete={() => completeSprint(activeSprint.id)}
                  onQuickCreate={() => {
                    setQuickCreateSprintId(activeSprint.id);
                    setQuickCreateTitle('');
                  }}
                  onEditDates={() => editSprintDates(activeSprint.id)}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {quickCreateSprintId === activeSprint.id && (
                      <div style={{ padding: '0.25rem 0.75rem' }}>
                        <input
                          autoFocus
                          type="text"
                          placeholder="What needs to be done? Press Enter to save, Esc to cancel"
                          value={quickCreateTitle}
                          onChange={(e) => setQuickCreateTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleQuickCreate(activeSprint.id, quickCreateTitle);
                            } else if (e.key === 'Escape') {
                              setQuickCreateSprintId(null);
                              setQuickCreateTitle('');
                            }
                          }}
                          onBlur={() => {
                            setTimeout(() => {
                              handleQuickCreate(activeSprint.id, quickCreateTitle);
                              setQuickCreateSprintId(null);
                            }, 200);
                          }}
                          style={{
                            width: '100%',
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--accent-primary)',
                            borderRadius: '4px',
                            padding: '0.5rem 0.75rem',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            fontSize: '0.85rem',
                          }}
                        />
                      </div>
                    )}
                    {filteredTasks
                      .filter((t) => t.sprintId === activeSprint.id)
                      .map((task) => (
                        <BacklogTaskRow
                          key={task.id}
                          task={task}
                          projects={projects}
                          openEditModal={openEditModal}
                          activeColumns={activeColumns}
                          onMoveStatus={moveTask}
                          onMoveSprint={(id, sId) => {
                            setTasks((prev) =>
                              prev.map((t) => (t.id === id ? { ...t, sprintId: sId } : t))
                            );
                          }}
                          projectSprints={projectSprints}
                          getUserAvatar={getUserAvatar}
                          getUserName={getUserName}
                        />
                      ))}
                    {filteredTasks.filter((t) => t.sprintId === activeSprint.id).length === 0 && (
                      <p
                        style={{
                          color: 'var(--text-muted)',
                          fontSize: '0.85rem',
                          textAlign: 'center',
                          padding: '1.5rem',
                          border: '1px dashed var(--border-color)',
                          borderRadius: '6px',
                        }}
                      >
                        Drag tasks here or click 'Create task' below to start.
                      </p>
                    )}
                  </div>
                </DroppableSprintSection>
              )}

              {/* Planned Sprints */}
              {plannedSprints.map((sprint) => (
                <DroppableSprintSection
                  key={sprint.id}
                  sprintId={sprint.id}
                  sprintName={sprint.name}
                  sprintDates={
                    sprint.startDate && sprint.endDate
                      ? `${sprint.startDate} - ${sprint.endDate}`
                      : undefined
                  }
                  sprintStatus="Planned"
                  tasks={filteredTasks.filter((t) => t.sprintId === sprint.id)}
                  storyPoints={getSprintStoryPoints(sprint.id)}
                  isExpanded={expandedSprints[sprint.id] !== false}
                  onToggleExpand={() => toggleSprintExpanded(sprint.id)}
                  onStart={() => startSprint(sprint.id)}
                  onDelete={() => deleteSprint(sprint.id)}
                  onQuickCreate={() => {
                    setQuickCreateSprintId(sprint.id);
                    setQuickCreateTitle('');
                  }}
                  onEditDates={() => editSprintDates(sprint.id)}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {quickCreateSprintId === sprint.id && (
                      <div style={{ padding: '0.25rem 0.75rem' }}>
                        <input
                          autoFocus
                          type="text"
                          placeholder="What needs to be done? Press Enter to save, Esc to cancel"
                          value={quickCreateTitle}
                          onChange={(e) => setQuickCreateTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleQuickCreate(sprint.id, quickCreateTitle);
                            } else if (e.key === 'Escape') {
                              setQuickCreateSprintId(null);
                              setQuickCreateTitle('');
                            }
                          }}
                          onBlur={() => {
                            setTimeout(() => {
                              handleQuickCreate(sprint.id, quickCreateTitle);
                              setQuickCreateSprintId(null);
                            }, 200);
                          }}
                          style={{
                            width: '100%',
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--accent-primary)',
                            borderRadius: '4px',
                            padding: '0.5rem 0.75rem',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            fontSize: '0.85rem',
                          }}
                        />
                      </div>
                    )}
                    {filteredTasks
                      .filter((t) => t.sprintId === sprint.id)
                      .map((task) => (
                        <BacklogTaskRow
                          key={task.id}
                          task={task}
                          projects={projects}
                          openEditModal={openEditModal}
                          activeColumns={activeColumns}
                          onMoveStatus={moveTask}
                          onMoveSprint={(id, sId) => {
                            setTasks((prev) =>
                              prev.map((t) => (t.id === id ? { ...t, sprintId: sId } : t))
                            );
                          }}
                          projectSprints={projectSprints}
                          getUserAvatar={getUserAvatar}
                          getUserName={getUserName}
                        />
                      ))}
                    {filteredTasks.filter((t) => t.sprintId === sprint.id).length === 0 && (
                      <p
                        style={{
                          color: 'var(--text-muted)',
                          fontSize: '0.85rem',
                          textAlign: 'center',
                          padding: '1.5rem',
                          border: '1px dashed var(--border-color)',
                          borderRadius: '6px',
                        }}
                      >
                        Drag tasks here or click 'Create task' below to start.
                      </p>
                    )}
                  </div>
                </DroppableSprintSection>
              ))}

              {/* Project Backlog Section */}
              <DroppableBacklogSection
                tasks={backlogTasks}
                isExpanded={expandedSprints['backlog'] !== false}
                onToggleExpand={() => toggleSprintExpanded('backlog')}
                onCreateSprint={createSprint}
                onQuickCreate={() => {
                  setQuickCreateSprintId('backlog');
                  setQuickCreateTitle('');
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {quickCreateSprintId === 'backlog' && (
                    <div style={{ padding: '0.25rem 0.75rem' }}>
                      <input
                        autoFocus
                        type="text"
                        placeholder="What needs to be done? Press Enter to save, Esc to cancel"
                        value={quickCreateTitle}
                        onChange={(e) => setQuickCreateTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleQuickCreate(undefined, quickCreateTitle);
                          } else if (e.key === 'Escape') {
                            setQuickCreateSprintId(null);
                            setQuickCreateTitle('');
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            handleQuickCreate(undefined, quickCreateTitle);
                            setQuickCreateSprintId(null);
                          }, 200);
                        }}
                        style={{
                          width: '100%',
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--accent-primary)',
                          borderRadius: '4px',
                          padding: '0.5rem 0.75rem',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          fontSize: '0.85rem',
                        }}
                      />
                    </div>
                  )}
                  {backlogTasks.map((task) => (
                    <BacklogTaskRow
                      key={task.id}
                      task={task}
                      projects={projects}
                      openEditModal={openEditModal}
                      activeColumns={activeColumns}
                      onMoveStatus={moveTask}
                      onMoveSprint={(id, sId) => {
                        setTasks((prev) =>
                          prev.map((t) => (t.id === id ? { ...t, sprintId: sId } : t))
                        );
                      }}
                      projectSprints={projectSprints}
                      getUserAvatar={getUserAvatar}
                      getUserName={getUserName}
                    />
                  ))}
                  {backlogTasks.length === 0 && (
                    <p
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: '0.85rem',
                        textAlign: 'center',
                        padding: '2rem',
                      }}
                    >
                      All tasks are currently assigned to Sprints.
                    </p>
                  )}
                </div>
              </DroppableBacklogSection>
            </div>
            <DragOverlay>
              {activeId ? (
                (() => {
                  const task = tasks.find((t) => t.id === activeId);
                  if (!task) return null;
                  return (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.6rem 1rem',
                        background: 'var(--bg-secondary)',
                        border: '2px solid var(--accent-primary)',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        boxShadow: 'var(--shadow-lg)',
                        opacity: 0.9,
                        gap: '1rem',
                        width: '100%',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          overflow: 'hidden',
                        }}
                      >
                        <span style={{ color: 'var(--text-muted)' }}>
                          <GripVertical size={14} />
                        </span>
                        {getIssueTypeIconGlobal(task.issueType)}
                        <span
                          style={{
                            color: 'var(--text-muted)',
                            fontWeight: 500,
                            fontSize: '0.8rem',
                          }}
                        >
                          {getTaskKeyGlobal(task, projects)}
                        </span>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                          {task.title}
                        </span>
                      </div>
                    </div>
                  );
                })()
              ) : null}
            </DragOverlay>
          </DndContext>
        )
      )}

      {activeSubTab === 'releases' && (
        selectedProject === 'all' ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <h3>Please Select a Project</h3>
            <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
              Releases and versioning require filtering by a specific project. Use the filter dropdown above.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="flex-between">
              <h3>Releases & Versions</h3>
              <button
                onClick={createRelease}
                style={{
                  background: 'var(--accent-primary)',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Create Release
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {projectReleases.map((release) => {
                const releaseTasks = filteredTasks.filter((t) => t.releaseId === release.id);
                return (
                  <div key={release.id} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="flex-between">
                      <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{release.name}</h4>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '0.1rem 0.5rem',
                            borderRadius: '50px',
                            background: release.status === 'Released' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                            color: release.status === 'Released' ? 'var(--accent-secondary)' : 'var(--accent-primary)',
                          }}
                        >
                          {release.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => toggleReleaseStatus(release.id)}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-secondary)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          {release.status === 'Released' ? 'Revert to Unreleased' : 'Release'}
                        </button>
                        <button
                          onClick={() => deleteRelease(release.id)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {release.releaseDate && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Released on: {release.releaseDate}</p>
                    )}

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Included Tasks ({releaseTasks.length})</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem' }}>
                        {releaseTasks.map((t) => (
                          <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', background: 'var(--bg-tertiary)', padding: '0.35rem 0.5rem', borderRadius: '4px' }}>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{t.title}</span>
                            <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{t.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
              {projectReleases.length === 0 && (
                <p style={{ gridColumn: '1/-1', color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>No releases configured for this project.</p>
              )}
            </div>
          </div>
        )
      )}

      {/* Task Add/Edit Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
          }}
        >
          <div
            className="glass-panel"
            style={{
              padding: '2rem',
              width: '700px',
              maxWidth: '95%',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div className="flex-between">
              <h2 className="text-gradient" style={{ fontSize: '1.5rem' }}>
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {!editingTask && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Load from Template (Helps break down tasks under 3 days)
                  </label>
                  <select
                    onChange={(e) => {
                      const idx = Number(e.target.value);
                      if (!isNaN(idx) && taskTemplates[idx]) {
                        const tpl = taskTemplates[idx];
                        setTitle(tpl.title);
                        setDescription(tpl.description);
                        setEstimatedHours(tpl.estimatedHours);
                        setPriority(tpl.priority as TaskPriority);
                      }
                    }}
                    defaultValue=""
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.5rem',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  >
                    <option value="">-- Select a Template --</option>
                    {taskTemplates.map((t, idx) => (
                      <option key={idx} value={idx}>
                        {t.title} ({t.estimatedHours}h)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Issue Type
                  </label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value as any)}
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.5rem',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  >
                    <option value="Task">Task (Blue)</option>
                    <option value="Story">Story (Green)</option>
                    <option value="Bug">Bug (Red)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Story Points (SP)
                  </label>
                  <select
                    value={storyPoints}
                    onChange={(e) => setStoryPoints(e.target.value)}
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.5rem',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  >
                    <option value="">No Estimate (0 SP)</option>
                    <option value="1">1 SP</option>
                    <option value="2">2 SP</option>
                    <option value="3">3 SP</option>
                    <option value="5">5 SP</option>
                    <option value="8">8 SP</option>
                    <option value="13">13 SP</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Task Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.5rem 1rem',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.5rem 1rem',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    minHeight: '60px',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Project *
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.5rem',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                    required
                  >
                    <option value="">Select Project...</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Task Category
                  </label>
                  <select
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value as 'Main' | 'Sub')}
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.5rem',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  >
                    <option value="Main">Main Task (Milestone / Parent)</option>
                    <option value="Sub">Subtask (To Do under Main Task)</option>
                  </select>
                </div>
              </div>

              {taskCategory === 'Sub' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Under Main Task *
                  </label>
                  <select
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.5rem',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                    required={taskCategory === 'Sub'}
                  >
                    <option value="">Select Main Task...</option>
                    {tasks
                      .filter(
                        (t) =>
                          t.projectId === projectId &&
                          !t.parentId &&
                          t.id !== (editingTask?.id || '')
                      )
                      .map((mt) => (
                        <option key={mt.id} value={mt.id}>
                          {mt.title} ({mt.estimatedHours}h)
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Sprint
                  </label>
                  <select
                    value={sprintId}
                    onChange={(e) => setSprintId(e.target.value)}
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.5rem',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  >
                    <option value="">No Sprint (Backlog)</option>
                    {sprints.filter(s => s.projectId === projectId && s.status !== 'Completed').map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Release / Version
                  </label>
                  <select
                    value={releaseId}
                    onChange={(e) => setReleaseId(e.target.value)}
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.5rem',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  >
                    <option value="">No Release</option>
                    {releases.filter(r => r.projectId === projectId).map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.5rem',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  >
                    {activeColumns.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.5rem',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Assignee
                  </label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.5rem',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Est. Hours
                  </label>
                  <input
                    type="number"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.5rem 1rem',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.5rem 1rem',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.5rem 1rem',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Commit History Panel */}
              {editingTask && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem' }}>
                    <GitCommit size={16} /> Git Commits & Updates ({commits.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                    {commits.map((c) => (
                      <div key={c.id} style={{ background: 'var(--bg-tertiary)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--border-color)' }}>
                        <div className="flex-between" style={{ marginBottom: '0.25rem' }}>
                          <span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>{c.commitHash}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{new Date(c.timestamp).toLocaleString()}</span>
                        </div>
                        <p style={{ color: 'var(--text-primary)', margin: '0.1rem 0' }}>{c.message}</p>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>By: {c.author}</span>
                      </div>
                    ))}
                    {commits.length === 0 && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '0.5rem' }}>
                        No commits logged yet. Hook up GitHub/GitLab and commit with <code>[{editingTask.id}]</code> to see updates.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <button
                type="submit"
                style={{
                  background: 'var(--accent-primary)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '1rem',
                }}
                className="hover-lift"
              >
                Save Task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
