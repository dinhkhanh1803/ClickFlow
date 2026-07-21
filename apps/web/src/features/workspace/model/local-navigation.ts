export type LocalSpaceItemKind = 'folder' | 'list' | 'doc' | 'dashboard' | 'whiteboard' | 'form';
export type LocalDocumentBlockStyle = 'normal' | 'heading-1' | 'heading-2' | 'heading-3' | 'checklist' | 'bulleted' | 'numbered' | 'toggle' | 'banner' | 'code' | 'quote';

export type LocalTaskStatus = string;
export type LocalStatusScope = 'list' | 'folder' | 'space';
export type LocalStatusColor = 'slate' | 'blue' | 'indigo' | 'violet' | 'teal' | 'emerald' | 'amber' | 'orange' | 'rose' | 'pink';
export type LocalStatusGroup = { id: string; name: string; scope: LocalStatusScope; color?: LocalStatusColor; taskStatus?: LocalTaskStatus; source?: 'api'; isSystem?: boolean; };
export type LocalStatusOverride = { status: LocalTaskStatus; name: string; color: LocalStatusColor; };
export type LocalTaskPriority = 'Urgent' | 'High' | 'Normal' | 'Low';
export type LocalWorkspaceMember = { id: string; userId: string; displayName: string; initials: string; avatarUrl: string | null; role: 'OWNER' | 'MEMBER'; };

export type LocalTaskComment = {
  id: string;
  body: string;
  createdAt: string;
  attachments?: LocalTaskAttachment[];
  links?: string[];
  authorName?: string;
};

export type LocalTaskActivity = {
  id: string;
  eventType: string;
  actorName: string;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type LocalTaskAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  createdAt: string;
};

export type LocalListTask = {
  id: string;
  title: string;
  version?: number;
  assigneeId?: string | null;
  assigneeIds?: string[];
  assignees?: Array<{ id: string; displayName: string; initials: string; avatarUrl: string | null }>;
  status: LocalTaskStatus;
  statusGroupId?: string;
  priority: LocalTaskPriority;
  assignee: string;
  startDate: string;
  dueDate: string;
  timeEstimate: string;
  trackingStartedAt: string | null;
  trackedSeconds: number;
  tags: string[];
  description: string;
  comments: LocalTaskComment[];
  activity?: LocalTaskActivity[];
  attachments: LocalTaskAttachment[];
  createdAt: string;
};

export type LocalSpaceItem = {
  id: string;
  name: string;
  apiProjectId?: string;
  kind: LocalSpaceItemKind;
  parentId?: string;
  tasks?: LocalListTask[];
  statusGroups?: LocalStatusGroup[];
  statusOverrides?: LocalStatusOverride[];
  document?: { content: string; contentVersion?: number; updatedAt: string; style?: LocalDocumentBlockStyle; };
};

export type LocalSpace = {
  id: string;
  name: string;
  tone: string;
  icon?: string;
  role?: 'OWNER' | 'MEMBER' | 'PUBLIC';
  description?: string | null;
  publicAccess?: 'VIEW' | 'EDIT';
  createdBy?: { id: string; displayName: string; avatarUrl: string | null };
  private?: boolean;
  members?: LocalWorkspaceMember[];
  items: LocalSpaceItem[];
  statusGroups?: LocalStatusGroup[];
  statusOverrides?: LocalStatusOverride[];
};

export const LOCAL_SPACES_STORAGE_KEY = 'clickflow.local-spaces.v1';

export const defaultLocalSpaces: LocalSpace[] = [
  {
    id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
      { id: 'folder-projects', name: 'Projects', kind: 'folder' },
      {
        id: 'list-product-launch', name: 'Product launch', kind: 'list', parentId: 'folder-projects', tasks: [
          { id: 'task-architecture', title: 'Define information architecture', status: 'In progress', priority: 'High', assignee: 'KD', startDate: '', dueDate: '2026-07-18', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: 'Establish the navigation model and the first execution loop for product teams.', comments: [], activity: [], attachments: [], createdAt: '2026-07-17T00:00:00.000Z' },
          { id: 'task-workspace', title: 'Design the Space command surface', status: 'Backlog', priority: 'Normal', assignee: 'LM', startDate: '', dueDate: '2026-07-21', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: 'Make the Space useful before a team opens a project.', comments: [], activity: [], attachments: [], createdAt: '2026-07-17T00:00:00.000Z' },
          { id: 'task-review', title: 'Validate delivery flow', status: 'Done', priority: 'Normal', assignee: 'TN', startDate: '', dueDate: '2026-07-15', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: 'Review the flow with the founding team.', comments: [], activity: [], attachments: [], createdAt: '2026-07-17T00:00:00.000Z' },
        ]
      }
    ]
  },
  { id: 'space-2', name: 'Space 2', tone: 'bg-orange-500', private: true, items: [] },
  { id: 'space-3', name: 'Space 3', tone: 'bg-pink-500', private: true, items: [] },
];

const tones = ['bg-indigo-500', 'bg-orange-500', 'bg-pink-500', 'bg-emerald-500', 'bg-violet-500', 'bg-cyan-500'];

export const localId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
export const nextSpaceTone = (position: number) => tones[position % tones.length];

export function loadLocalSpaces() {
  try {
    const saved = window.localStorage.getItem(LOCAL_SPACES_STORAGE_KEY);
    if (!saved) return defaultLocalSpaces;
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return defaultLocalSpaces;
    return parsed.filter((space): space is LocalSpace => Boolean(space && typeof space === 'object' && typeof (space as LocalSpace).id === 'string' && typeof (space as LocalSpace).name === 'string' && Array.isArray((space as LocalSpace).items)));
  } catch {
    return defaultLocalSpaces;
  }
}

export function saveLocalSpaces(spaces: LocalSpace[], announce = true) {
  window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify(spaces));
  if (announce) window.dispatchEvent(new Event('clickflow:local-spaces-changed'));
}

