# Space → Project → Task Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive, frontend-only ClickFlow workspace where all project views share one Space → Project → Task source of truth.

**Architecture:** Typed domain entities and an intent-based React context hold the current Space graph. Focused Space overview, Project workspace, and Task inspector components read that context, while every mutation flows through named actions. Views receive selected project data and callbacks rather than owning mock arrays.

**Tech Stack:** Next.js 16, React, TypeScript strict mode, Tailwind CSS, Vitest, Testing Library, lucide-react.

---

## File structure

- Create `apps/web/src/features/workspace/model/workspace-types.ts`: typed Space, Project, Task, checklist, comment, and task status contracts.
- Create `apps/web/src/features/workspace/model/workspace-store.tsx`: seed graph plus context actions for projects and tasks.
- Create `apps/web/src/features/workspace/components/space-overview.tsx`: Space command surface.
- Create `apps/web/src/features/workspace/components/project-workspace.tsx`: project views and task detail inspector.
- Create `apps/web/src/features/workspace/components/workspace-root.tsx`: switches overview and active project.
- Create `apps/web/src/features/workspace/components/workspace-root.test.tsx`: regression coverage for state-changing workflows.
- Modify `apps/web/src/app/(workspace)/projects/page.tsx`: render the new workspace root.
- Retire `apps/web/src/features/projects/components/projects-workspace.tsx` and its test once its behavior is superseded.

### Task 1: Define workspace contracts and store

**Files:**
- Create: `apps/web/src/features/workspace/model/workspace-types.ts`
- Create: `apps/web/src/features/workspace/model/workspace-store.tsx`
- Test: `apps/web/src/features/workspace/components/workspace-root.test.tsx`

- [ ] **Step 1: Write the failing store workflow test**

```tsx
it('creates a project and selects it from the Space overview', async () => {
  const user = userEvent.setup();
  render(<WorkspaceRoot />);

  await user.click(screen.getByRole('button', { name: 'New project' }));
  await user.type(screen.getByLabelText('Project name'), 'Marketing launch');
  await user.click(screen.getByRole('button', { name: 'Create project' }));

  expect(screen.getByRole('heading', { name: 'Marketing launch' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test and verify it fails because `WorkspaceRoot` does not exist**

Run: `pnpm --filter web test -- workspace-root.test.tsx`
Expected: FAIL with a missing module or missing export error.

- [ ] **Step 3: Implement the typed store**

```tsx
export type WorkspaceActions = {
  createProject(input: Pick<Project, 'name' | 'description'>): void;
  updateTask(projectId: string, taskId: string, patch: Partial<Task>): void;
  addComment(projectId: string, taskId: string, body: string): void;
  toggleChecklistItem(projectId: string, taskId: string, itemId: string): void;
};
```

Provide a `WorkspaceProvider` and `useWorkspace` hook. Seed one Space containing multiple projects and tasks.

- [ ] **Step 4: Run the focused test after the minimal root/provider scaffold**

Run: `pnpm --filter web test -- workspace-root.test.tsx`
Expected: PASS for the create/select project scenario.

### Task 2: Build the Space overview

**Files:**
- Create: `apps/web/src/features/workspace/components/space-overview.tsx`
- Modify: `apps/web/src/features/workspace/components/workspace-root.tsx`
- Test: `apps/web/src/features/workspace/components/workspace-root.test.tsx`

- [ ] **Step 1: Write the failing overview test**

```tsx
it('shows Space progress and selects a project from its project list', async () => {
  const user = userEvent.setup();
  render(<WorkspaceRoot />);

  expect(screen.getByText('Space progress')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Product launch/i }));

  expect(screen.getByRole('heading', { name: 'Product launch' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run it and verify it fails for the missing Space overview behavior**

Run: `pnpm --filter web test -- workspace-root.test.tsx`
Expected: FAIL because `Space progress` and project selection are absent.

- [ ] **Step 3: Implement Space overview**

Render Space identity, member avatars, computed completion progress, an active project list, and next actions. Use an accessible `New project` dialog and route a selected project through context state.

- [ ] **Step 4: Run the focused test**

Run: `pnpm --filter web test -- workspace-root.test.tsx`
Expected: PASS.

### Task 3: Build the project workspace and shared views

**Files:**
- Create: `apps/web/src/features/workspace/components/project-workspace.tsx`
- Modify: `apps/web/src/features/workspace/components/workspace-root.tsx`
- Test: `apps/web/src/features/workspace/components/workspace-root.test.tsx`

- [ ] **Step 1: Write the failing cross-view update test**

```tsx
it('updates a task status in its inspector and reflects it in the board', async () => {
  const user = userEvent.setup();
  render(<WorkspaceRoot initialProjectId="project-product-launch" />);

  await user.click(screen.getByRole('button', { name: 'Define information architecture' }));
  await user.selectOptions(screen.getByLabelText('Status'), 'Complete');
  await user.click(screen.getByRole('tab', { name: 'Board' }));

  expect(screen.getByLabelText('Complete tasks')).toHaveTextContent('Define information architecture');
});
```

- [ ] **Step 2: Run it and verify it fails because the current views own static arrays**

Run: `pnpm --filter web test -- workspace-root.test.tsx`
Expected: FAIL because the task cannot be updated across views.

- [ ] **Step 3: Implement project workspace views**

Render Board, List, Calendar, Gantt, and Table from `activeProject.tasks`. Add a compact project selector, view switcher, task creation control, and task selection callback. Each view must use the same context task collection.

- [ ] **Step 4: Run the focused test**

Run: `pnpm --filter web test -- workspace-root.test.tsx`
Expected: PASS.

### Task 4: Implement task inspector actions

**Files:**
- Modify: `apps/web/src/features/workspace/components/project-workspace.tsx`
- Test: `apps/web/src/features/workspace/components/workspace-root.test.tsx`

- [ ] **Step 1: Write failing tests for a checklist and comment**

```tsx
it('persists a checklist change and a comment in the task inspector', async () => {
  const user = userEvent.setup();
  render(<WorkspaceRoot initialProjectId="project-product-launch" />);

  await user.click(screen.getByRole('button', { name: 'Define information architecture' }));
  await user.click(screen.getByRole('checkbox', { name: 'Map navigation hierarchy' }));
  await user.type(screen.getByLabelText('Comment'), 'Navigation structure approved.');
  await user.click(screen.getByRole('button', { name: 'Post comment' }));

  expect(screen.getByRole('checkbox', { name: 'Map navigation hierarchy' })).toBeChecked();
  expect(screen.getByText('Navigation structure approved.')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run it and verify it fails**

Run: `pnpm --filter web test -- workspace-root.test.tsx`
Expected: FAIL because the current task inspector has no editable checklist or comment state.

- [ ] **Step 3: Implement inspector controls**

Implement editable task title, status, priority, assignee, due date, description, checklist, and comment form. Call the store actions, add activity messages for every action, and retain the existing full-screen task inspector affordance.

- [ ] **Step 4: Run focused and full verification**

Run: `pnpm --filter web test -- workspace-root.test.tsx; pnpm lint; pnpm test; pnpm build`
Expected: all commands exit 0.

### Task 5: Remove superseded mock workspace

**Files:**
- Delete: `apps/web/src/features/projects/components/projects-workspace.tsx`
- Delete: `apps/web/src/features/projects/components/projects-workspace.test.tsx`
- Modify: `apps/web/src/app/(workspace)/projects/page.tsx`

- [ ] **Step 1: Replace the route import with `WorkspaceRoot`**

```tsx
import { WorkspaceRoot } from '@/features/workspace/components/workspace-root';

export default function ProjectsPage() {
  return <WorkspaceRoot />;
}
```

- [ ] **Step 2: Delete old mock-only workspace files and run checks**

Run: `pnpm lint; pnpm test; pnpm build`
Expected: all commands exit 0 and no import references remain.

- [ ] **Step 3: Leave the work uncommitted for user visual review**

The user explicitly requested review before the next commit. Do not commit or push this increment.