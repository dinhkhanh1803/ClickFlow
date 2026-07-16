export type TaskStatus = 'Backlog' | 'In progress' | 'Done';
export type TaskPriority = 'Low' | 'Normal' | 'High';

export type ChecklistItem = { id: string; label: string; completed: boolean };
export type TaskComment = { id: string; author: string; body: string; createdAt: string };
export type TaskActivity = { id: string; message: string; createdAt: string };

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  dueDate: string;
  description: string;
  checklist: ChecklistItem[];
  comments: TaskComment[];
  activity: TaskActivity[];
};

export type Project = {
  id: string;
  name: string;
  description: string;
  color: string;
  archived: boolean;
  tasks: Task[];
};

export type Space = {
  id: string;
  name: string;
  emoji: string;
  members: Array<{ id: string; name: string; initials: string; color: string }>;
  projects: Project[];
};