# Login UI and Google Mock Sign-in Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Present a polished responsive ClickFlow login screen and a non-OAuth Google mock sign-in action.

**Architecture:** Keep validation in `LoginForm`; add a local pending state for the Google action. Keep visual composition in the `/login` page and do not alter server routes or persistence.

**Tech Stack:** Next.js, React Hook Form, Zod, Tailwind CSS, Vitest, Testing Library.

---

### Task 1: Define Google mock sign-in behavior

**Files:**
- Modify: `apps/web/src/features/auth/components/login-form.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it('offers a Google mock sign-in action', () => {
  render(<LoginForm />);
  expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Verify the test is red**

Run: `pnpm --filter web test -- login-form.test.tsx -t "Google mock"`

Expected: FAIL because the form has no Google action.

### Task 2: Implement the form and page surface

**Files:**
- Modify: `apps/web/src/features/auth/components/login-form.tsx`
- Modify: `apps/web/src/app/(auth)/login/page.tsx`
- Test: `apps/web/src/features/auth/components/login-form.test.tsx`

- [ ] **Step 1: Add Google action and local pending state**

```tsx
<Button type="button" aria-label="Continue with Google" onClick={startGoogleMock}>
  Continue with Google
</Button>
```

`startGoogleMock` shows a short connecting state, calls the existing success notification, and redirects to `/dashboard`; it does not call an OAuth API.

- [ ] **Step 2: Refactor layout to form panel plus responsive product panel**

Use the existing dark/light tokens, visible labels, 44px minimum controls, and a mobile single-column layout.

- [ ] **Step 3: Verify test passes**

Run: `pnpm --filter web test -- login-form.test.tsx`

Expected: PASS.

### Task 3: Verify compilation

**Files:**
- Modify: none

- [ ] **Step 1: Type-check**

Run: `pnpm --filter web typecheck`

Expected: exit code 0.

- [ ] **Step 2: Build**

Run: `pnpm --filter web build`

Expected: exit code 0.