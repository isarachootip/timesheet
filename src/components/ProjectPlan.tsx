import { useState } from 'react';
import type { Project, Task, User, TaskPriority, TaskStatus, TaskTemplate, PermissionScheme } from '../types';
import { Calendar, CheckCircle2, Clock, ArrowRight, Plus, Edit, Trash2, X, Save, Zap, ChevronDown, ChevronRight } from 'lucide-react';

interface ProjectPlanProps {
  projects: Project[];
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  users: User[];
  taskTemplates: TaskTemplate[];
  permissionSchemes: PermissionScheme[];
  currentUser: User | null;
}

export const ProjectPlan = ({ projects, tasks, setTasks, users, taskTemplates, permissionSchemes, currentUser }: ProjectPlanProps) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);

  // Task form states
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<TaskStatus>('To Do');
  const [formPriority, setFormPriority] = useState<TaskPriority>('Medium');
  const [formEstHours, setFormEstHours] = useState('');
  const [formAssigneeId, setFormAssigneeId] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formIsMain, setFormIsMain] = useState(true);
  const [formParentId, setFormParentId] = useState('');

  const project = projects.find(p => p.id === selectedProjectId);
  const statuses: TaskStatus[] = ['To Do', 'In Progress', 'Review', 'Done'];

  // Filter main tasks (milestones) for the selected project
  const projectMilestones = tasks
    .filter(t => t.projectId === selectedProjectId && !t.parentId)
    .sort((a, b) => {
      const aTime = a.startDate ? new Date(a.startDate).getTime() : 0;
      const bTime = b.startDate ? new Date(b.startDate).getTime() : 0;
      return aTime - bTime;
    });

  const getSubtasks = (milestoneId: string) =>
    tasks.filter(t => t.parentId === milestoneId);

  const getAssigneeName = (id?: string) => {
    if (!id) return 'Unassigned';
    return users.find(u => u.id === id)?.name || 'Unknown';
  };

  const getAssigneeAvatar = (id?: string) => {
    if (!id) return 'https://i.pravatar.cc/150?u=unassigned';
    return users.find(u => u.id === id)?.avatar || 'https://i.pravatar.cc/150?u=unassigned';
  };

  const calculateMilestoneProgress = (milestoneId: string, milestoneStatus: string) => {
    const subtasks = tasks.filter(t => t.parentId === milestoneId);
    if (subtasks.length === 0) return milestoneStatus === 'Done' ? 100 : 0;
    const completed = subtasks.filter(t => t.status === 'Done').length;
    return Math.round((completed / subtasks.length) * 100);
  };

  const getPriorityColor = (prio: TaskPriority) => {
    switch (prio) {
      case 'Urgent': return '#ef4444';
      case 'High': return '#f59e0b';
      case 'Medium': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'Done': return { bg: 'rgba(16,185,129,0.15)', text: '#10b981', border: '#10b981' };
      case 'In Progress': return { bg: 'rgba(99,102,241,0.15)', text: '#818cf8', border: '#818cf8' };
      case 'Review': return { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', border: '#f59e0b' };
      default: return { bg: 'rgba(107,114,128,0.1)', text: '#9ca3af', border: '#4b5563' };
    }
  };

  // Timeline geometry
  const projStart = project?.startDate ? new Date(project.startDate).getTime() : 0;
  const projEnd = project?.endDate ? new Date(project.endDate).getTime() : projStart + 30 * 24 * 60 * 60 * 1000;
  const projDuration = projEnd - projStart;
  const totalDays = projDuration > 0 ? Math.round(projDuration / (24 * 60 * 60 * 1000)) : 0;

  const ticks: string[] = [];
  if (projDuration > 0) {
    for (let i = 0; i <= 4; i++) {
      const tickTime = projStart + (projDuration * i) / 4;
      ticks.push(new Date(tickTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }));
    }
  }

  const overallProgress = projectMilestones.length === 0 ? 0
    : Math.round(projectMilestones.reduce((sum, m) => sum + calculateMilestoneProgress(m.id, m.status), 0) / projectMilestones.length);

  // Toggle milestone expansion
  const toggleMilestone = (id: string) => {
    setExpandedMilestones(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const hasProjectPermission = (projId: string, permissionKey: string, taskObj?: Task) => {
    if (!currentUser) return false;
    if (currentUser.globalRole === 'Admin') return true;

    const project = projects.find(p => p.id === projId);
    if (!project) return false;

    let projectRole: string | null = null;
    const members = project.members || [];
    const member = members.find(m => m.userId === currentUser.id);
    if (member) projectRole = member.role;

    if (currentUser.globalRole === 'Manager' && !projectRole) {
      projectRole = 'PM';
    }

    const schemeId = project.permissionSchemeId || 'scheme_default';
    const scheme = permissionSchemes.find(s => s.id === schemeId);
    if (!scheme) return false;

    const allowed = scheme.permissions?.[permissionKey] || [];
    if (!Array.isArray(allowed)) return false;

    if (allowed.includes(currentUser.globalRole)) return true;
    if (projectRole && allowed.includes(projectRole)) return true;
    if (allowed.includes('Member') && projectRole) return true;
    if (allowed.includes('Assignee') && taskObj && taskObj.assigneeId === currentUser.id) return true;

    return false;
  };

  // Generate milestones from templates
  const handleGenerateFromTemplates = async () => {
    if (!hasProjectPermission(selectedProjectId, 'create_task')) {
      alert('Permission denied: You do not have permission to create tasks in this project.');
      return;
    }
    if (!project || !project.startDate || !project.endDate) {
      alert('This project must have both a Start Date and End Date to auto-generate milestones.');
      return;
    }
    if (taskTemplates.length === 0) {
      alert('No milestone templates found. Please add templates in Settings first.');
      return;
    }
    if (!confirm(`Generate ${taskTemplates.length} milestone tasks for "${project.name}" from templates? Existing milestones will remain.`)) return;

    setIsGenerating(true);
    const startD = new Date(project.startDate);
    const endD = new Date(project.endDate);
    const totalMs = endD.getTime() - startD.getTime();

    const sorted = [...taskTemplates].sort((a, b) => a.startPercent - b.startPercent);
    const newTasks: Task[] = sorted.map(tpl => {
      const taskStartMs = startD.getTime() + (totalMs * tpl.startPercent / 100);
      const taskEndMs = startD.getTime() + (totalMs * tpl.endPercent / 100);
      return {
        id: 't_' + Math.random().toString(36).substr(2, 9),
        projectId: selectedProjectId,
        title: tpl.title,
        description: tpl.description,
        status: 'To Do' as TaskStatus,
        priority: tpl.priority,
        estimatedHours: tpl.estimatedHours,
        createdAt: new Date().toISOString(),
        startDate: new Date(taskStartMs).toISOString().split('T')[0],
        endDate: new Date(taskEndMs).toISOString().split('T')[0],
      };
    });

    setTasks(prev => [...prev, ...newTasks]);
    setIsGenerating(false);
  };

  // Open modal helpers
  const openAddMainTask = () => {
    setEditingTask(null);
    setDefaultParentId(undefined);
    setFormTitle(''); setFormDescription(''); setFormStatus('To Do'); setFormPriority('Medium');
    setFormEstHours(''); setFormAssigneeId(''); setFormStartDate(''); setFormEndDate('');
    setFormIsMain(true); setFormParentId('');
    setIsModalOpen(true);
  };

  const openAddSubtask = (milestoneId: string) => {
    setEditingTask(null);
    setDefaultParentId(milestoneId);
    setFormTitle(''); setFormDescription(''); setFormStatus('To Do'); setFormPriority('Medium');
    setFormEstHours(''); setFormAssigneeId(''); setFormStartDate(''); setFormEndDate('');
    setFormIsMain(false); setFormParentId(milestoneId);
    setIsModalOpen(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setDefaultParentId(task.parentId);
    setFormTitle(task.title); setFormDescription(task.description);
    setFormStatus(task.status); setFormPriority(task.priority);
    setFormEstHours(String(task.estimatedHours)); setFormAssigneeId(task.assigneeId || '');
    setFormStartDate(task.startDate || ''); setFormEndDate(task.endDate || '');
    setFormIsMain(!task.parentId); setFormParentId(task.parentId || '');
    setIsModalOpen(true);
  };

  const handleDeleteTask = (taskId: string, isMain: boolean) => {
    const taskObj = tasks.find(t => t.id === taskId);
    if (!hasProjectPermission(selectedProjectId, 'delete_task', taskObj)) {
      alert('Permission denied: You do not have permission to delete tasks in this project.');
      return;
    }
    const subtaskCount = tasks.filter(t => t.parentId === taskId).length;
    const msg = isMain && subtaskCount > 0
      ? `Delete this milestone AND its ${subtaskCount} subtask(s)?`
      : 'Delete this task?';
    if (!confirm(msg)) return;
    setTasks(prev => {
      const idsToRemove = new Set<string>([taskId]);
      if (isMain) prev.filter(t => t.parentId === taskId).forEach(t => idsToRemove.add(t.id));
      return prev.filter(t => !idsToRemove.has(t.id));
    });
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    const isEditing = !!editingTask;
    const permKey = isEditing ? 'edit_task' : 'create_task';
    if (!hasProjectPermission(selectedProjectId, permKey, editingTask || undefined)) {
      alert(`Permission denied: You do not have permission to ${isEditing ? 'edit' : 'create'} tasks in this project.`);
      return;
    }
    if (!formTitle) return alert('Title is required');

    const est = Number(formEstHours) || 0;
    const parentVal = formIsMain ? undefined : (formParentId || undefined);

    // Validate hour budget for subtasks
    if (!formIsMain && parentVal) {
      const parentTask = tasks.find(t => t.id === parentVal);
      if (parentTask) {
        const used = tasks.filter(t => t.parentId === parentVal && t.id !== (editingTask?.id || '')).reduce((s, t) => s + t.estimatedHours, 0);
        if (used + est > parentTask.estimatedHours) {
          return alert(`Subtask hours (${used + est}h) would exceed the milestone budget of ${parentTask.estimatedHours}h. (Used: ${used}h)`);
        }
      }
    }

    const taskData: Task = {
      id: editingTask ? editingTask.id : 't_' + Date.now(),
      projectId: selectedProjectId,
      title: formTitle,
      description: formDescription,
      status: formStatus,
      priority: formPriority,
      estimatedHours: est,
      assigneeId: formAssigneeId || undefined,
      createdAt: editingTask ? editingTask.createdAt : new Date().toISOString(),
      parentId: parentVal,
      startDate: formStartDate || undefined,
      endDate: formEndDate || undefined,
    };

    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? taskData : t));
    } else {
      setTasks(prev => [...prev, taskData]);
    }
    setIsModalOpen(false);
  };

  const labelStyle = { fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' };
  const inputStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '0.6rem 0.9rem', color: 'var(--text-primary)', outline: 'none', width: '100%', fontSize: '0.9rem' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* ─── Top Bar ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>Project Plan & Timeline</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Manage milestones, Gantt timeline and task progress.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Project selector */}
          <div className="glass-panel" style={{ padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Project:</span>
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600 }}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id} style={{ background: 'var(--bg-secondary)' }}>{p.name}</option>
              ))}
            </select>
          </div>
          {/* Add Main Task button */}
          <button onClick={openAddMainTask} className="hover-lift" style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <Plus size={16} /> Add Milestone
          </button>
        </div>
      </div>

      {project ? (
        <>
          {/* ─── Summary Cards ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {/* Duration */}
            <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(99,102,241,0.08) 100%)', border: '1px solid rgba(99,102,241,0.35)', borderRadius: '14px', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={22} color="#818cf8" />
              </div>
              <div>
                <p style={{ fontSize: '0.8rem', color: '#a5b4fc', marginBottom: '0.2rem' }}>Project Duration</p>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white' }}>{totalDays} Days</h3>
                <p style={{ fontSize: '0.75rem', color: '#c7d2fe', marginTop: '0.1rem' }}>
                  {new Date(project.startDate).toLocaleDateString()} → {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing'}
                </p>
              </div>
            </div>

            {/* Progress */}
            <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.25) 0%, rgba(16,185,129,0.08) 100%)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: '14px', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={22} color="#10b981" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.8rem', color: '#6ee7b7', marginBottom: '0.2rem' }}>Milestones Progress</p>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white' }}>{overallProgress}% Done</h3>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '0.4rem', overflow: 'hidden' }}>
                  <div style={{ width: `${overallProgress}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #6ee7b7)', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                </div>
              </div>
            </div>

            {/* Total milestones */}
            <div style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.25) 0%, rgba(14,165,233,0.08) 100%)', border: '1px solid rgba(14,165,233,0.35)', borderRadius: '14px', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(14,165,233,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={22} color="#38bdf8" />
              </div>
              <div>
                <p style={{ fontSize: '0.8rem', color: '#7dd3fc', marginBottom: '0.2rem' }}>Total Milestones</p>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white' }}>{projectMilestones.length} Main Tasks</h3>
                <p style={{ fontSize: '0.75rem', color: '#bae6fd', marginTop: '0.1rem' }}>
                  {tasks.filter(t => t.projectId === selectedProjectId && !!t.parentId).length} subtasks total
                </p>
              </div>
            </div>
          </div>

          {/* ─── No Milestones: Generate button ─── */}
          {projectMilestones.length === 0 && (
            <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: '14px', padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <Zap size={40} color="#f59e0b" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>No milestones yet for this project</h3>
              <p style={{ color: '#fcd34d', fontSize: '0.95rem', maxWidth: '500px' }}>
                Auto-generate {taskTemplates.length} milestone tasks from the default templates (proportional dates based on project timeline), or add manually using the "Add Milestone" button.
              </p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  onClick={handleGenerateFromTemplates}
                  disabled={isGenerating || taskTemplates.length === 0}
                  className="hover-lift"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none', padding: '0.75rem 1.75rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', opacity: isGenerating ? 0.7 : 1 }}
                >
                  <Zap size={18} /> {isGenerating ? 'Generating...' : `🚀 Generate ${taskTemplates.length} Milestones from Templates`}
                </button>
                <button onClick={openAddMainTask} className="hover-lift" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '0.75rem 1.75rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                  <Plus size={18} /> Add Manually
                </button>
              </div>
            </div>
          )}

          {/* ─── Gantt Chart ─── */}
          {projectMilestones.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.5rem', overflowX: 'auto' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'white' }}>📅 Proportional Gantt Timeline</h3>
              <div style={{ minWidth: '700px' }}>
                {/* Date header */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ width: '240px', fontSize: '0.85rem', color: '#9ca3af', fontWeight: 600 }}>Milestone</div>
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#6b7280', paddingLeft: '1rem' }}>
                    {ticks.map((t, i) => <span key={i}>{t}</span>)}
                  </div>
                </div>
                {/* Gantt rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {projectMilestones.map(m => {
                    const taskStart = m.startDate ? new Date(m.startDate).getTime() : projStart;
                    const taskEnd = m.endDate ? new Date(m.endDate).getTime() : projEnd;
                    const leftOffset = projDuration > 0 ? Math.max(0, Math.min(100, ((taskStart - projStart) / projDuration) * 100)) : 0;
                    const widthVal = projDuration > 0 ? Math.max(2, Math.min(100 - leftOffset, ((taskEnd - taskStart) / projDuration) * 100)) : 100;
                    const progress = calculateMilestoneProgress(m.id, m.status);
                    const subtasks = getSubtasks(m.id);

                    return (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.65rem' }}>
                        <div style={{ width: '240px', display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={m.title}>{m.title}</span>
                          <span style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '0.1rem' }}>{subtasks.length} subtasks · {m.estimatedHours}h</span>
                        </div>
                        <div style={{ flex: 1, position: 'relative', height: '34px', marginLeft: '1rem' }}>
                          <div style={{
                            position: 'absolute', left: `${leftOffset}%`, width: `${widthVal}%`, height: '28px', top: '3px',
                            background: 'rgba(99,102,241,0.15)', border: `2px solid ${getPriorityColor(m.priority)}`,
                            borderRadius: '6px', overflow: 'hidden', display: 'flex', alignItems: 'center', padding: '0 8px',
                          }} title={`${m.title}: ${m.startDate || 'TBD'} → ${m.endDate || 'TBD'}`}>
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${progress}%`, background: getPriorityColor(m.priority), opacity: 0.2 }} />
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'white', zIndex: 1 }}>{progress}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─── Milestones Detail Table with CRUD ─── */}
          {projectMilestones.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>📋 Milestones & Subtasks</h3>
                <button onClick={handleGenerateFromTemplates} disabled={isGenerating} className="hover-lift" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', padding: '0.4rem 1rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                  <Zap size={14} /> Re-generate Templates
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {projectMilestones.map(m => {
                  const progress = calculateMilestoneProgress(m.id, m.status);
                  const subtasks = getSubtasks(m.id);
                  const isExpanded = expandedMilestones.has(m.id);
                  const statusColors = getStatusColor(m.status);

                  return (
                    <div key={m.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
                      {/* Milestone row */}
                      <div style={{ padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: '28px 2fr 1fr 1fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'center', cursor: 'pointer' }} onClick={() => toggleMilestone(m.id)}>
                        {/* Expand icon */}
                        <span style={{ color: '#6b7280' }}>
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </span>
                        {/* Title */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.6rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', fontWeight: 700 }}>MAIN</span>
                            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white' }}>{m.title}</span>
                          </div>
                          <p style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px' }}>{m.description}</p>
                        </div>
                        {/* Dates */}
                        <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                          {m.startDate && m.endDate ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <span>{new Date(m.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                              <ArrowRight size={10} />
                              <span>{new Date(m.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            </div>
                          ) : <span style={{ color: '#4b5563' }}>Not scheduled</span>}
                        </div>
                        {/* Hours */}
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>{m.estimatedHours}h</span>
                        {/* Owner */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <img src={getAssigneeAvatar(m.assigneeId)} alt="" style={{ width: '26px', height: '26px', borderRadius: '50%' }} />
                          <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{getAssigneeName(m.assigneeId)}</span>
                        </div>
                        {/* Status + Progress */}
                        <div>
                          <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '6px', background: statusColors.bg, color: statusColors.text, border: `1px solid ${statusColors.border}33`, fontWeight: 600 }}>{m.status}</span>
                          <div style={{ marginTop: '0.35rem', width: '80px', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${progress}%`, height: '100%', background: getPriorityColor(m.priority), borderRadius: '2px' }} />
                          </div>
                        </div>
                        {/* Actions */}
                        <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '0.35rem' }}>
                          <button onClick={() => openAddSubtask(m.id)} title="Add subtask" style={{ background: 'rgba(99,102,241,0.15)', border: 'none', color: '#818cf8', cursor: 'pointer', borderRadius: '6px', padding: '0.35rem 0.5rem', display: 'flex' }}><Plus size={13} /></button>
                          <button onClick={() => openEditTask(m)} title="Edit" style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#9ca3af', cursor: 'pointer', borderRadius: '6px', padding: '0.35rem 0.5rem', display: 'flex' }}><Edit size={13} /></button>
                          <button onClick={() => handleDeleteTask(m.id, true)} title="Delete" style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', borderRadius: '6px', padding: '0.35rem 0.5rem', display: 'flex' }}><Trash2 size={13} /></button>
                        </div>
                      </div>

                      {/* Subtasks (expanded) */}
                      {isExpanded && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}>
                          {subtasks.length === 0 ? (
                            <div style={{ padding: '0.75rem 1.5rem', fontSize: '0.85rem', color: '#4b5563', fontStyle: 'italic' }}>No subtasks yet — click ➕ to add one.</div>
                          ) : (
                            subtasks.map(sub => {
                              const subColors = getStatusColor(sub.status);
                              return (
                                <div key={sub.id} style={{ padding: '0.65rem 1.25rem 0.65rem 3rem', display: 'grid', gridTemplateColumns: '28px 2fr 1fr 1fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                  <span style={{ color: '#374151', fontSize: '0.85rem' }}>↳</span>
                                  <div>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#d1d5db' }}>{sub.title}</span>
                                    <p style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '260px' }}>{sub.description}</p>
                                  </div>
                                  <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                                    {sub.startDate ? new Date(sub.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
                                  </div>
                                  <span style={{ fontSize: '0.85rem', color: '#d1d5db' }}>{sub.estimatedHours}h</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <img src={getAssigneeAvatar(sub.assigneeId)} alt="" style={{ width: '22px', height: '22px', borderRadius: '50%' }} />
                                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{getAssigneeName(sub.assigneeId)}</span>
                                  </div>
                                  <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '5px', background: subColors.bg, color: subColors.text, fontWeight: 600 }}>{sub.status}</span>
                                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                                    <button onClick={() => openEditTask(sub)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#9ca3af', cursor: 'pointer', borderRadius: '6px', padding: '0.3rem 0.45rem', display: 'flex' }}><Edit size={12} /></button>
                                    <button onClick={() => handleDeleteTask(sub.id, false)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', borderRadius: '6px', padding: '0.3rem 0.45rem', display: 'flex' }}><Trash2 size={12} /></button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                          <div style={{ padding: '0.5rem 1.25rem 0.5rem 3rem' }}>
                            <button onClick={() => openAddSubtask(m.id)} style={{ background: 'transparent', border: '1px dashed rgba(99,102,241,0.4)', color: '#818cf8', cursor: 'pointer', borderRadius: '6px', padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Plus size={13} /> Add Subtask
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="glass-panel flex-center" style={{ minHeight: '300px', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>No active projects found. Please create a project first.</p>
        </div>
      )}

      {/* ─── CRUD Modal ─── */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '2rem', width: '640px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 700 }}>{editingTask ? 'Edit Task' : (formIsMain ? 'Add New Milestone' : 'Add Subtask')}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer' }}><X size={22} /></button>
            </div>

            <form onSubmit={handleSaveTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Task type toggle (only when adding new) */}
              {!editingTask && (
                <div>
                  <label style={labelStyle}>Task Type</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {(['Main', 'Sub'] as const).map(type => (
                      <button key={type} type="button" onClick={() => { setFormIsMain(type === 'Main'); if (type === 'Main') setFormParentId(''); else setFormParentId(defaultParentId || ''); }}
                        style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: `1px solid ${(type === 'Main') === formIsMain ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)'}`, background: (type === 'Main') === formIsMain ? 'rgba(99,102,241,0.2)' : 'transparent', color: (type === 'Main') === formIsMain ? '#a5b4fc' : '#6b7280', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                        {type === 'Main' ? '🎯 Main Milestone' : '📝 Subtask'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Parent task selector (for subtasks) */}
              {!formIsMain && (
                <div>
                  <label style={labelStyle}>Under Milestone *</label>
                  <select value={formParentId} onChange={e => setFormParentId(e.target.value)} style={inputStyle} required>
                    <option value="">Select Main Task...</option>
                    {projectMilestones.filter(m => m.id !== editingTask?.id).map(m => (
                      <option key={m.id} value={m.id}>{m.title} ({m.estimatedHours}h)</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title */}
              <div>
                <label style={labelStyle}>Title *</label>
                <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} style={inputStyle} placeholder="Enter task title..." required />
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Description</label>
                <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }} placeholder="Brief summary of this task..." />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Status */}
                <div>
                  <label style={labelStyle}>Status</label>
                  <select value={formStatus} onChange={e => setFormStatus(e.target.value as TaskStatus)} style={inputStyle}>
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {/* Priority */}
                <div>
                  <label style={labelStyle}>Priority</label>
                  <select value={formPriority} onChange={e => setFormPriority(e.target.value as TaskPriority)} style={inputStyle}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Assignee */}
                <div>
                  <label style={labelStyle}>Assignee</label>
                  <select value={formAssigneeId} onChange={e => setFormAssigneeId(e.target.value)} style={inputStyle}>
                    <option value="">Unassigned</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                {/* Est Hours */}
                <div>
                  <label style={labelStyle}>Est. Hours</label>
                  <input type="number" value={formEstHours} onChange={e => setFormEstHours(e.target.value)} style={inputStyle} min="0" placeholder="0" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Start Date */}
                <div>
                  <label style={labelStyle}>Start Date</label>
                  <input type="date" value={formStartDate} onChange={e => setFormStartDate(e.target.value)} style={inputStyle} />
                </div>
                {/* End Date */}
                <div>
                  <label style={labelStyle}>End Date</label>
                  <input type="date" value={formEndDate} onChange={e => setFormEndDate(e.target.value)} style={inputStyle} />
                </div>
              </div>

              <button type="submit" className="hover-lift" style={{ background: 'linear-gradient(135deg, var(--accent-primary), #7c3aed)', color: 'white', border: 'none', padding: '0.85rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                <Save size={18} /> {editingTask ? 'Update Task' : 'Save Task'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
