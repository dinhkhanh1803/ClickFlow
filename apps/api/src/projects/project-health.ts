export type ProjectHealth = 'AT_RISK' | 'COMPLETED' | 'ON_TRACK' | 'OVERDUE';

export interface ProjectHealthInput {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  deadline: Date | null;
}

export interface ProjectHealthResult {
  progressPercent: number;
  health: ProjectHealth;
}

export function calculateProjectHealth(input: ProjectHealthInput, now = new Date()): ProjectHealthResult {
  const progressPercent = input.totalTasks === 0 ? 0 : Math.round((input.completedTasks / input.totalTasks) * 100);
  if (input.totalTasks > 0 && input.completedTasks === input.totalTasks) return { progressPercent, health: 'COMPLETED' };
  if (input.deadline && input.deadline.getTime() < now.getTime()) return { progressPercent, health: 'OVERDUE' };
  if (input.overdueTasks > 0) return { progressPercent, health: 'AT_RISK' };
  return { progressPercent, health: 'ON_TRACK' };
}
