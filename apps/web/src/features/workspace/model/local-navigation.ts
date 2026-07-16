export type LocalSpaceItemKind = 'folder' | 'list' | 'doc' | 'dashboard' | 'whiteboard' | 'form';

export type LocalSpaceItem = {
  id: string;
  name: string;
  kind: LocalSpaceItemKind;
  parentId?: string;
};

export type LocalSpace = {
  id: string;
  name: string;
  tone: string;
  private?: boolean;
  items: LocalSpaceItem[];
};

export const LOCAL_SPACES_STORAGE_KEY = 'clickflow.local-spaces.v1';

export const defaultLocalSpaces: LocalSpace[] = [
  { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [{ id: 'folder-projects', name: 'Projects', kind: 'folder' }] },
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

export function saveLocalSpaces(spaces: LocalSpace[]) {
  window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify(spaces));
  window.dispatchEvent(new Event('clickflow:local-spaces-changed'));
}