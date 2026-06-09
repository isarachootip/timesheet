export type GlobalRole = 'Admin' | 'Manager' | 'Employee';
export type ProjectRole = 'PM' | 'SA' | 'Frontend dev' | 'Backend dev' | 'QC' | 'Designer';
export type TaskStatus = 'To Do' | 'In Progress' | 'Review' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TimesheetStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected';
export type ProjectStatus = 'Planning' | 'Active' | 'On Hold' | 'Completed';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  globalRole: GlobalRole;
  department: string;
  gender?: 'Male' | 'Female' | 'Other' | '';
  birthday?: string;
  skills?: string[];
}

export interface ProjectMember {
  userId: string;
  role: ProjectRole;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  endDate?: string;
  budget?: number;
  members: ProjectMember[];
}

export interface Task {
  id: string;
  projectId: string;
  assigneeId?: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedHours: number;
  createdAt: string;
}

export interface TimesheetEntry {
  id: string;
  userId: string;
  projectId: string;
  taskId?: string;
  date: string;
  hours: number;
  description: string;
  status: TimesheetStatus;
  approvedBy?: string;
  approvedAt?: string;
}
