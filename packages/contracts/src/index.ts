export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type HealthStatus = 'on-track' | 'at-risk';
export interface NavigationItem { label: string; href: string; }
export interface TaskSummary { id: string; title: string; status: TaskStatus; priority: 'low' | 'medium' | 'high'; }
export interface ProjectSummary { id: string; name: string; progress: number; health: HealthStatus; }
export interface DashboardMetric { label: string; value: string; tone: 'indigo' | 'blue' | 'rose' | 'violet'; }
export interface Deadline { id: string; title: string; due: string; tone: 'urgent' | 'upcoming' | 'planned'; }
export const navigationItems: NavigationItem[] = [{ label: 'Dashboard', href: '/dashboard' }, { label: 'My Tasks', href: '/my-tasks' }, { label: 'Calendar', href: '/calendar' }, { label: 'Time Tracking', href: '/time-tracking' }, { label: 'Projects', href: '/projects' }, { label: 'Templates', href: '/templates' }, { label: 'Reports', href: '/reports' }, { label: 'Archive', href: '/archive' }, { label: 'Settings', href: '/settings' }];
export const dashboardMetrics: DashboardMetric[] = [{label:'Active Projects',value:'4',tone:'indigo'},{label:'Tasks Due Today',value:'8',tone:'blue'},{label:'Overdue Tasks',value:'3',tone:'rose'},{label:'Total Hours Logged',value:'26.5',tone:'violet'}];
export const todayTasks: TaskSummary[] = [{id:'t1',title:'Complete portfolio hero animation',status:'in-progress',priority:'high'},{id:'t2',title:'Fix checkout validation bug',status:'todo',priority:'high'},{id:'t3',title:'Design level 3 assets',status:'todo',priority:'medium'},{id:'t4',title:'Set up API endpoint for scraper',status:'todo',priority:'low'}];
export const weeklyHours = [6, 8, 10, 12, 7, 4, 2];
export const upcomingDeadlines: Deadline[] = [{ id:'d1', title:'Client demo: Portfolio', due:'Today, 6:00 PM', tone:'urgent' }, { id:'d2', title:'Submit E-commerce Wireframes', due:'Tomorrow, 2:00 PM', tone:'upcoming' }, { id:'d3', title:'Publish Game Level Design Review', due:'Oct 28', tone:'planned' }];
export const projectHealth: ProjectSummary[] = [{ id:'p1', name:'Freelancer Portfolio', progress:65, health:'on-track' }, { id:'p2', name:'E-commerce Electronics', progress:82, health:'at-risk' }];
export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: unknown;
  requestId: string;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PageMeta;
}

export interface HealthResponse {
  status: 'ok';
}

export const apiContract = {
  version: 'v1',
  workspaceResource: 'Workspace',
  workspaceUiLabel: 'Space',
  taskStatuses: {
    backlog: 'Backlog',
    inProgress: 'In progress',
    done: 'Done'
  }
} as const;
