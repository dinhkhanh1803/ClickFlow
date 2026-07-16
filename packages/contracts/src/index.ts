export type TaskStatus = 'todo' | 'in-progress' | 'done';
export interface TaskSummary { id: string; title: string; status: TaskStatus; priority: 'low' | 'medium' | 'high'; }
export interface ProjectSummary { id: string; name: string; progress: number; health: 'on-track' | 'at-risk'; }
export interface DashboardMetric { label: string; value: string; tone: 'indigo' | 'blue' | 'rose' | 'violet'; }
export const dashboardMetrics: DashboardMetric[] = [{label:'Active Projects',value:'4',tone:'indigo'},{label:'Tasks Due Today',value:'8',tone:'blue'},{label:'Overdue Tasks',value:'3',tone:'rose'},{label:'Total Hours Logged',value:'26.5',tone:'violet'}];
export const todayTasks: TaskSummary[] = [{id:'t1',title:'Complete portfolio hero animation',status:'in-progress',priority:'high'},{id:'t2',title:'Fix checkout validation bug',status:'todo',priority:'high'},{id:'t3',title:'Design level 3 assets',status:'todo',priority:'medium'}];
