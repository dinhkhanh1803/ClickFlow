import { ConflictException } from '@nestjs/common';

import { assertValidParent, fractionalPosition, resolveCompletedAt } from './task-rules';

describe('task rules', () => {
  it('sets, preserves, and clears completion timestamps', () => {
    const now = new Date('2026-07-18T10:00:00.000Z');
    const existing = new Date('2026-07-17T10:00:00.000Z');
    expect(resolveCompletedAt(true, null, now)).toEqual(now);
    expect(resolveCompletedAt(true, existing, now)).toEqual(existing);
    expect(resolveCompletedAt(false, existing, now)).toBeNull();
  });

  it('rejects self, cross-project, cycles, and hierarchy deeper than five', () => {
    const chain = new Map([
      ['p1', { id: 'p1', projectId: 'project-a', parentTaskId: null }],
      ['p2', { id: 'p2', projectId: 'project-a', parentTaskId: 'p1' }],
      ['p3', { id: 'p3', projectId: 'project-a', parentTaskId: 'p2' }],
      ['p4', { id: 'p4', projectId: 'project-a', parentTaskId: 'p3' }],
      ['p5', { id: 'p5', projectId: 'project-a', parentTaskId: 'p4' }],
      ['p6', { id: 'p6', projectId: 'project-a', parentTaskId: 'p5' }],
      ['foreign', { id: 'foreign', projectId: 'project-b', parentTaskId: null }],
      ['cycle', { id: 'cycle', projectId: 'project-a', parentTaskId: 'task' }]
    ]);
    expect(() => assertValidParent('task', 'project-a', 'task', chain)).toThrow(ConflictException);
    expect(() => assertValidParent('task', 'project-a', 'foreign', chain)).toThrow(ConflictException);
    expect(() => assertValidParent('task', 'project-a', 'cycle', chain)).toThrow(ConflictException);
    expect(() => assertValidParent('task', 'project-a', 'p6', chain)).toThrow(ConflictException);
    expect(() => assertValidParent('task', 'project-a', 'p5', chain)).not.toThrow();
  });

  it('creates stable fractional positions around an anchor', () => {
    expect(fractionalPosition(null, null)).toBe(1024);
    expect(fractionalPosition(1024, null)).toBe(2048);
    expect(fractionalPosition(null, 1024)).toBe(0);
    expect(fractionalPosition(1024, 2048)).toBe(1536);
  });
});
