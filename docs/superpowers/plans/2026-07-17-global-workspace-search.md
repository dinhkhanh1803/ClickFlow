# Global Workspace Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real local-data command palette to the application header and remove unused ClickUp-like integrations.

**Architecture:** A pure model function builds `WorkspaceSearchResult` records from `LocalSpace[]`. A feature component renders the dialog and tabs. `AppHeader` provides trigger state and the global Ctrl K keyboard shortcut.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Vitest, Testing Library.

---

### Task 1: Model local search results

**Files:**
- Create: `apps/web/src/features/search/model/local-workspace-search.ts`
- Create: `apps/web/src/features/search/model/local-workspace-search.test.ts`

- [ ] **Step 1: Write the failing model test**

```tsx
expect(searchLocalWorkspace(spaces, 'launch')).toEqual(expect.arrayContaining([
  expect.objectContaining({ kind: 'task', label: 'Launch release', href: '/projects?space=space-1&folder=folder-1&list=list-1' }),
]));
```

- [ ] **Step 2: Run the model test**

Run: `pnpm --filter web test -- local-workspace-search.test.ts`

Expected: FAIL because the model module does not exist.

- [ ] **Step 3: Implement typed flattening and query matching**

Create `WorkspaceSearchResult` and `searchLocalWorkspace(spaces, query)` that returns only matching Space, Folder, List, Doc, and Task records with their existing `/projects` href scope.

- [ ] **Step 4: Re-run the model test**

Run: `pnpm --filter web test -- local-workspace-search.test.ts`

Expected: PASS.

### Task 2: Render command palette from local data

**Files:**
- Create: `apps/web/src/features/search/components/global-search-dialog.tsx`
- Create: `apps/web/src/features/search/components/global-search-dialog.test.tsx`

- [ ] **Step 1: Write failing dialog test**

```tsx
render(<GlobalSearchDialog open onOpenChange={vi.fn()} />);
expect(screen.getByRole('dialog', { name: 'Search ClickFlow' })).toBeInTheDocument();
expect(screen.getByRole('tab', { name: 'Tasks' })).toBeInTheDocument();
expect(screen.queryByText('Google Drive')).not.toBeInTheDocument();
```

- [ ] **Step 2: Run the dialog test**

Run: `pnpm --filter web test -- global-search-dialog.test.tsx`

Expected: FAIL because dialog module does not exist.

- [ ] **Step 3: Implement dialog, tabs, local loading, and result links**

Use the project Dialog component; show an empty-state prompt until the user types and a no-results message for unmatched queries. Do not render unsupported integration/action controls.

- [ ] **Step 4: Re-run dialog test**

Run: `pnpm --filter web test -- global-search-dialog.test.tsx`

Expected: PASS.

### Task 3: Wire header trigger

**Files:**
- Modify: `apps/web/src/components/layout/app-shell.tsx`
- Modify: `apps/web/src/components/layout/app-shell.test.tsx`

- [ ] **Step 1: Write failing header test**

```tsx
render(<AppHeader />);
await user.click(screen.getByRole('button', { name: 'Search ClickFlow' }));
expect(screen.getByRole('dialog', { name: 'Search ClickFlow' })).toBeInTheDocument();
```

- [ ] **Step 2: Run header test**

Run: `pnpm --filter web test -- app-shell.test.tsx -t "Search ClickFlow"`

Expected: FAIL because the header contains only a passive input.

- [ ] **Step 3: Add compact trigger plus Ctrl K listener**

Replace the passive input with a button, use a `searchOpen` state, and open on Ctrl K / Meta K without interfering with text entry.

- [ ] **Step 4: Verify feature**

Run: `pnpm --filter web test -- local-workspace-search.test.ts global-search-dialog.test.tsx app-shell.test.tsx`

Expected: PASS.

### Task 4: Verify application compilation

- [ ] **Step 1: Type-check**

Run: `pnpm --filter web typecheck`

Expected: exit code 0.

- [ ] **Step 2: Build**

Run: `pnpm --filter web build`

Expected: exit code 0.