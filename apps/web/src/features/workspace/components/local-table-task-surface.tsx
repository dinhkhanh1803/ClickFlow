'use client';

import { useState } from 'react';
import { CalendarDays, CircleDot, Flag, UserRound } from 'lucide-react';
import type { LocalListTask, LocalStatusGroup, LocalStatusOverride } from '../model/local-navigation';
import { buildLocalTaskStatusOptions, AssigneePicker, DatesPicker, LocalTaskDetailModal, PriorityPicker, StatusPicker, type AssigneeOption } from './local-list-task-surface';

type LocalTableTaskSurfaceProps = {
  tasks: LocalListTask[];
  statusGroups: LocalStatusGroup[];
  statusOverrides: LocalStatusOverride[];
  assignees?: AssigneeOption[];
  onUpdateTask: (taskId: string, patch: Partial<Omit<LocalListTask, 'id' | 'createdAt'>>) => void;
};

type TablePicker = 'status' | 'assignee' | 'dates' | 'priority';
type OpenTablePicker = { taskId: string; type: TablePicker } | null;

export function LocalTableTaskSurface({ tasks, statusGroups, statusOverrides, assignees = [], onUpdateTask }: LocalTableTaskSurfaceProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [openPicker, setOpenPicker] = useState<OpenTablePicker>(null);
  const statusOptions = buildLocalTaskStatusOptions(statusGroups, statusOverrides);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;

  return <section className="p-4">
    <h2 className="sr-only">Task table</h2>
    <div className="overflow-visible rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <table className="w-full min-w-[820px] border-collapse text-sm"><thead><tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900/50"><th className="px-4 py-3">Task</th><th className="px-4 py-3"><span className="inline-flex items-center gap-1"><CircleDot size={14} />Status</span></th><th className="px-4 py-3"><span className="inline-flex items-center gap-1"><UserRound size={14} />Assignee</span></th><th className="px-4 py-3"><span className="inline-flex items-center gap-1"><CalendarDays size={14} />Due date</span></th><th className="px-4 py-3"><span className="inline-flex items-center gap-1"><Flag size={14} />Priority</span></th></tr></thead><tbody>{tasks.map((task) => <tr key={task.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70 dark:border-slate-900 dark:hover:bg-slate-900/40"><td className="px-4 py-2"><button type="button" aria-label={task.title} onClick={() => setSelectedTaskId(task.id)} className="w-full rounded px-1 py-1 text-left font-medium hover:text-indigo-600">{task.title}</button></td><td className="px-4 py-2"><StatusPicker value={task.status} statusGroupId={task.statusGroupId} triggerLabel={`Status for ${task.title}`} options={statusOptions} onChange={(patch) => { onUpdateTask(task.id, patch); setOpenPicker(null); }} open={openPicker?.taskId === task.id && openPicker.type === 'status'} onOpenChange={(open) => setOpenPicker(open ? { taskId: task.id, type: 'status' } : null)} /></td><td className="px-4 py-2"><AssigneePicker value={task.assignee} assigneeId={task.assigneeId ?? null} assignees={assignees} onChange={(assignee) => { onUpdateTask(task.id, assignee); setOpenPicker(null); }} open={openPicker?.taskId === task.id && openPicker.type === 'assignee'} onOpenChange={(open) => setOpenPicker(open ? { taskId: task.id, type: 'assignee' } : null)} /></td><td className="px-4 py-2"><DatesPicker startDate={task.startDate} dueDate={task.dueDate} onChange={(patch) => { onUpdateTask(task.id, patch); setOpenPicker(null); }} open={openPicker?.taskId === task.id && openPicker.type === 'dates'} onOpenChange={(open) => setOpenPicker(open ? { taskId: task.id, type: 'dates' } : null)} /></td><td className="px-4 py-2"><PriorityPicker value={task.priority} onChange={(priority) => { onUpdateTask(task.id, { priority }); setOpenPicker(null); }} open={openPicker?.taskId === task.id && openPicker.type === 'priority'} onOpenChange={(open) => setOpenPicker(open ? { taskId: task.id, type: 'priority' } : null)} /></td></tr>)}{tasks.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">No tasks in this scope yet.</td></tr>}</tbody></table>
    </div>
    {selectedTask && <LocalTaskDetailModal task={selectedTask} statusOptions={statusOptions} assignees={assignees} onClose={() => setSelectedTaskId(null)} onUpdate={(patch) => onUpdateTask(selectedTask.id, patch)} />}
  </section>;
}