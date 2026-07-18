import { calculateProjectHealth } from './project-health';

describe('calculateProjectHealth', () => {
  const now = new Date('2026-07-18T12:00:00Z');

  it('marks a fully completed project as completed', () => {
    expect(calculateProjectHealth({ totalTasks: 4, completedTasks: 4, overdueTasks: 0, deadline: new Date('2026-07-17T00:00:00Z') }, now))
      .toEqual({ progressPercent: 100, health: 'COMPLETED' });
  });

  it('marks an incomplete project past its deadline as overdue', () => {
    expect(calculateProjectHealth({ totalTasks: 4, completedTasks: 1, overdueTasks: 2, deadline: new Date('2026-07-17T00:00:00Z') }, now))
      .toEqual({ progressPercent: 25, health: 'OVERDUE' });
  });

  it('marks projects with overdue tasks as at risk', () => {
    expect(calculateProjectHealth({ totalTasks: 3, completedTasks: 1, overdueTasks: 1, deadline: new Date('2026-08-01T00:00:00Z') }, now))
      .toEqual({ progressPercent: 33, health: 'AT_RISK' });
  });

  it('keeps projects without warning signals on track', () => {
    expect(calculateProjectHealth({ totalTasks: 0, completedTasks: 0, overdueTasks: 0, deadline: null }, now))
      .toEqual({ progressPercent: 0, health: 'ON_TRACK' });
  });
});
