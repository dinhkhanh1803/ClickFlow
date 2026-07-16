# Space → Project → Task Workspace Design

## Goal

Turn the Projects area into a ClickFlow-native frontend workspace. It uses a single in-memory source of truth rather than independent mock screens or a visual clone of ClickUp.

## Domain model

- A **Space** owns its identity, members, projects, and progress summary.
- A **Project** belongs to one Space and owns its description, status, task collection, and selected presentation view.
- A **Task** belongs to one Project and includes title, workflow status, priority, assignee, due date, description, checklist, activity, and comments.

No server API is introduced in this phase. The state is intentionally defined through typed frontend contracts so it can later move behind repository/API adapters without changing view components.

## State and data flow

`WorkspaceProvider` owns the complete Space graph and exposes intent-based actions:

- create, edit, archive, and select a project;
- create, update, and select a task;
- update a task status, checklist, description, and comments;
- select the active project and its active view.

Space overview, project navigation, Board, List, Calendar, Gantt, Table, and Task detail all derive from that one graph. An action in one view updates every other view immediately.

## Experience

The Space overview is a focused command surface: progress, people, active projects, and next actions. A project workspace emphasizes work execution, with compact view controls and a purpose-built task inspector. The inspector provides practical editing and activity feedback rather than duplicating a reference product screenshot.

## Scope

Phase 2 frontend interactions include local state only. There is no authentication integration, persistence, server mutation, real-time collaboration, drag-and-drop synchronization, file uploads, or backend API in this increment.

## Acceptance criteria

1. A Space overview renders its identity, members, project list, progress, and next actions from typed state.
2. Users can create, edit, and archive a Project in the current Space.
3. Users can create and edit tasks, including status, priority, assignee, due date, description, checklist, and comments.
4. Board, List, Calendar, Gantt, and Table reflect the same state after a task update.
5. Project selection and active view remain consistent while navigating the workspace.
6. Tests cover the central state-changing workflows.