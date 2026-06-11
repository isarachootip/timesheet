import { useState } from 'react';
import type { Task, TaskStatus, TaskPriority, Project, User } from '../types';
import { Plus, Filter, Clock, X, Edit, Trash2, GripVertical } from 'lucide-react';
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

interface TasksProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  projects: Project[];
  users: User[];
}

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
          {/* Grip icon — visual indicator only; entire card is draggable */}
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

      {/* Footer: hours, dates, status select, avatar */}
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
        maxHeight: 'calc(100vh - 240px)',
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

// ── Main Tasks Component ───────────────────────────────────────────────────────
export const Tasks = ({ tasks, setTasks, projects, users }: TasksProps) => {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

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

  const statuses: TaskStatus[] = ['To Do', 'In Progress', 'Review', 'Done'];

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
    setStatus('To Do');
    setPriority('Medium');
    setEstimatedHours('');
    setAssigneeId('');
    setProjectId(projects[0]?.id || '');
    setTaskCategory('Main');
    setParentId('');
    setStartDate('');
    setEndDate('');
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
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !projectId) return alert('Title and Project are required');

    const est = estimatedHours ? Number(estimatedHours) : 0;
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
    if (overId && statuses.includes(overId as TaskStatus)) {
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
    if (statuses.includes(overId as TaskStatus)) {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
      {/* Top Bar */}
      <div className="flex-between">
        <div>
          <h1 className="text-gradient" style={{ marginBottom: '0.5rem' }}>
            Tasks
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Track and manage project tasks across different stages.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
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

      {/* Kanban Board */}
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
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1.25rem',
            flex: 1,
            overflowX: 'auto',
            alignItems: 'start',
          }}
        >
          {statuses.map((colStatus) => {
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
                statuses={statuses}
                onEdit={openEditModal}
                onDelete={handleDelete}
                onMove={moveTask}
              />
            );
          })}
        </div>

        {/* DragOverlay — renders the floating card while dragging */}
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
              statuses={statuses}
              onEdit={openEditModal}
              onDelete={handleDelete}
              onMove={moveTask}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

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
              width: '650px',
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                    {statuses.map((st) => (
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
