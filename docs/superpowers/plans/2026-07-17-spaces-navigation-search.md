# Spaces Navigation Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the unused Spaces header options control and provide local tree search for Spaces, Folders, Lists, and Docs.

**Architecture:** `ContextSidebar` keeps one transient query state next to its existing local `spaces` state. Tree rendering derives visibility from that query without changing local persistence or navigation functions. The existing sidebar test file exercises the user interaction.

**Tech Stack:** Next.js client component, React state, TypeScript, Vitest, Testing Library.

---

### Task 1: Define the search interaction

**Files:**
- Modify: `apps/web/src/components/layout/context-sidebar.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it('filters the Spaces tree and removes the header options button', async () => {
  const user = userEvent.setup();
  window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([/* Space > Folder > Launch list */]));
  render(<ContextSidebar modulePath="/projects" />);

  expect(screen.queryByLabelText('Spaces options')).not.toBeInTheDocument();
  await user.click(screen.getByLabelText('Search Spaces'));
  await user.type(screen.getByLabelText('Search Spaces tree'), 'launch');

  expect(screen.getByRole('button', { name: 'Launch' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Product' })).toBeInTheDocument();
  expect(screen.queryByText('Unrelated')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `pnpm --filter web test -- context-sidebar.test.tsx -t "filters the Spaces tree"`

Expected: FAIL because the query field and filtering behavior do not exist.

### Task 2: Implement local navigation filtering

**Files:**
- Modify: `apps/web/src/components/layout/context-sidebar.tsx`
- Test: `apps/web/src/components/layout/context-sidebar.test.tsx`

- [ ] **Step 1: Add transient query and matching helpers**

```tsx
const [spaceSearch, setSpaceSearch] = useState('');
const normalizedSearch = spaceSearch.trim().toLocaleLowerCase();
const itemMatchesSearch = (name: string) => name.toLocaleLowerCase().includes(normalizedSearch);
```

- [ ] **Step 2: Replace the header options button with a Search toggle**

```tsx
<Button aria-label="Search Spaces" variant="ghost" size="sm" onClick={() => setSearchOpen((open) => !open)}>
  <Search size={17} />
</Button>
```

- [ ] **Step 3: Render the accessible search field and derive visible branches**

```tsx
<input aria-label="Search Spaces tree" value={spaceSearch} onChange={(event) => setSpaceSearch(event.target.value)} />
```

Only render a Space/Folder branch when its own name or a descendant matches; render matching descendants and their ancestors. Do not persist `spaceSearch`.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `pnpm --filter web test -- context-sidebar.test.tsx -t "filters the Spaces tree"`

Expected: PASS.

### Task 3: Verify affected sidebar behavior

**Files:**
- Modify: none
- Test: `apps/web/src/components/layout/context-sidebar.test.tsx`

- [ ] **Step 1: Run the sidebar suite**

Run: `pnpm --filter web test -- context-sidebar.test.tsx`

Expected: PASS.

- [ ] **Step 2: Type-check the web application**

Run: `pnpm --filter web typecheck`

Expected: exit code 0.