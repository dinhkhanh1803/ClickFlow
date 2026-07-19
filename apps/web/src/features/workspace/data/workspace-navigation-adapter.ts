import type { ProjectResponse, SectionResponse, WorkspaceResponse } from '@clickflow/contracts';
import type { LocalSpace } from '../model/local-navigation';

const fallbackTones = ['bg-indigo-500', 'bg-orange-500', 'bg-pink-500', 'bg-emerald-500', 'bg-violet-500', 'bg-cyan-500'];

function safeTone(tone: string | null, index: number): string {
  return tone?.startsWith('bg-') ? tone : fallbackTones[index % fallbackTones.length];
}

export function mapWorkspaceTree(
  workspaces: WorkspaceResponse[],
  projects: ProjectResponse[],
  sections: SectionResponse[]
): LocalSpace[] {
  return workspaces.map((workspace, index) => {
    const workspaceProjects = projects
      .filter((project) => project.workspaceId === workspace.id && project.archivedAt === null)
      .sort((left, right) => left.position - right.position);
    const projectIds = new Set(workspaceProjects.map((project) => project.id));
    return {
      id: workspace.id,
      name: workspace.name,
      tone: safeTone(workspace.tone, index),
      private: workspace.private,
      items: [
        ...workspaceProjects.map((project) => ({ id: project.id, name: project.name, kind: 'folder' as const })),
        ...sections
          .filter((section) => projectIds.has(section.projectId))
          .sort((left, right) => left.position - right.position)
          .map((section) => ({ id: section.id, name: section.name, kind: 'list' as const, parentId: section.projectId }))
      ]
    };
  });
}
