import { SPACE_ROOT_PROJECT_TONE, type ActivityApiResponse, type CommentApiResponse, type DocumentResponse, type ProjectResponse, type ProjectStatusResponse, type SectionResponse, type TaskApiResponse, type TimeEntryApiResponse, type WorkspaceResponse } from '@clickflow/contracts';
import type { LocalListTask, LocalSpace, LocalStatusColor, LocalTaskPriority } from '../model/local-navigation';

const fallbackTones = ['bg-indigo-500', 'bg-orange-500', 'bg-pink-500', 'bg-emerald-500', 'bg-violet-500', 'bg-cyan-500'];

function safeTone(tone: string | null, index: number): string {
  return tone?.startsWith('bg-') ? tone : fallbackTones[index % fallbackTones.length];
}

const statusColors: Record<string, LocalStatusColor> = {
  '#64748b': 'slate',
  '#3b82f6': 'blue',
  '#6366f1': 'indigo',
  '#8b5cf6': 'violet',
  '#14b8a6': 'teal',
  '#10b981': 'emerald',
  '#f59e0b': 'amber',
  '#f97316': 'orange',
  '#f43f5e': 'rose',
  '#ec4899': 'pink',
};

function statusColor(status: Pick<ProjectStatusResponse, 'category' | 'color'>): LocalStatusColor {
  const savedColor = statusColors[status.color.toLowerCase()];
  if (savedColor) return savedColor;
  if (status.category === 'COMPLETED') return 'emerald';
  if (status.category === 'IN_PROGRESS') return 'blue';
  return 'slate';
}

function taskPriority(priority: TaskApiResponse['priority']): LocalTaskPriority {
  return ({ URGENT: 'Urgent', HIGH: 'High', NORMAL: 'Normal', LOW: 'Low' } as const)[priority];
}

function mapTask(task: TaskApiResponse, statuses: ProjectStatusResponse[], comments: CommentApiResponse[], activities: ActivityApiResponse[], timeEntries: TimeEntryApiResponse[]): LocalListTask {
  const status = statuses.find((item) => item.id === task.statusId);
  const taskTimeEntries = timeEntries.filter((entry) => entry.taskId === task.id && entry.archivedAt === null);
  const runningEntry = taskTimeEntries.find((entry) => entry.endedAt === null);
  return {
    id: task.id,
    version: task.version,
    title: task.title,
    status: status?.name ?? 'Open',
    statusGroupId: task.statusId,
    priority: taskPriority(task.priority),
    assignee: task.assigneeId ? 'Assigned' : '',
    assigneeId: task.assigneeId,
    startDate: '',
    dueDate: task.dueAt?.slice(0, 10) ?? '',
    timeEstimate: '',
    trackingStartedAt: runningEntry?.startedAt ?? null,
    trackedSeconds: taskTimeEntries.reduce((total, entry) => total + (entry.durationSeconds ?? 0), 0),
    tags: [],
    description: task.description ?? '',
    comments: comments.filter((comment) => comment.taskId === task.id).map((comment) => ({
      id: comment.id,
      body: comment.body,
      authorName: comment.author.displayName,
      createdAt: comment.createdAt
    })),
    activity: activities.filter((activity) => activity.subjectId === task.id).map((activity) => ({
      id: activity.id, eventType: activity.eventType, actorName: activity.actor?.displayName ?? 'System',
      metadata: activity.metadata, createdAt: activity.createdAt
    })),
    attachments: [],
    createdAt: task.createdAt
  };
}

export function mapWorkspaceTree(
  workspaces: WorkspaceResponse[],
  projects: ProjectResponse[],
  sections: SectionResponse[],
  statuses: ProjectStatusResponse[] = [],
  tasks: TaskApiResponse[] = [],
  comments: CommentApiResponse[] = [],
  activities: ActivityApiResponse[] = [],
  timeEntries: TimeEntryApiResponse[] = [],
  documents: DocumentResponse[] = []
): LocalSpace[] {
  return workspaces.map((workspace, index) => {
    const workspaceProjects = projects
      .filter((project) => project.workspaceId === workspace.id && project.archivedAt === null)
      .sort((left, right) => left.position - right.position);
    const rootProjectIds = new Set(workspaceProjects.filter((project) => project.tone === SPACE_ROOT_PROJECT_TONE).map((project) => project.id));
    const visibleProjects = workspaceProjects.filter((project) => !rootProjectIds.has(project.id));
    const projectIds = new Set(workspaceProjects.map((project) => project.id));
    return {
      id: workspace.id,
      name: workspace.name,
      tone: safeTone(workspace.tone, index),
      private: workspace.private,
      items: [
        ...visibleProjects.map((project) => ({
          id: project.id,
          name: project.name,
          kind: 'folder' as const,
          statusGroups: statuses
            .filter((status) => status.projectId === project.id)
            .sort((left, right) => left.position - right.position)
            .map((status) => ({ id: status.id, name: status.name, taskStatus: status.name, scope: 'folder' as const, color: statusColor(status), source: 'api' as const }))
        })),
        ...sections
          .filter((section) => projectIds.has(section.projectId))
          .sort((left, right) => left.position - right.position)
          .map((section) => {
            const rootList = rootProjectIds.has(section.projectId);
            return {
              id: section.id,
              name: section.name,
              kind: 'list' as const,
              apiProjectId: section.projectId,
              ...(rootList ? {} : { parentId: section.projectId }),
              ...(rootList ? {
                statusGroups: statuses
                  .filter((status) => status.projectId === section.projectId)
                  .sort((left, right) => left.position - right.position)
                  .map((status) => ({ id: status.id, name: status.name, taskStatus: status.name, scope: 'list' as const, color: statusColor(status), source: 'api' as const }))
              } : {}),
              tasks: tasks.filter((task) => task.sectionId === section.id && task.archivedAt === null).map((task) => mapTask(task, statuses, comments, activities, timeEntries))
            };
          }),
        ...documents
          .filter((document) => document.workspaceId === workspace.id && document.archivedAt === null)
          .map((document) => ({
            id: document.id,
            name: document.title,
            kind: 'doc' as const,
            ...(document.projectId ? { parentId: document.projectId } : {}),
            document: {
              content: document.content,
              contentVersion: document.contentVersion,
              updatedAt: document.updatedAt
            }
          }))

      ]
    };
  });
}
