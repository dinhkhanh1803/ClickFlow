# Global workspace search design

## Goal
Replace the passive header search field with a ClickUp-inspired command palette that only exposes data and navigation already supported by ClickFlow.

## Scope
- Header: compact Search control with `Ctrl K` hint; remove AI Chat affordances.
- Palette: All, Tasks, Docs, Workspace tabs; keyboard and backdrop dismissal.
- Search source: current local Spaces data, including Spaces, Folders, Lists, Docs, and List tasks.
- Navigation: result links lead to the existing `/projects` URL scope. Tasks lead to their containing List because task-detail deep links are not currently routed.

## Exclusions
No AI queries, integrations, channels, messages, agents, filter/sort controls, recent mock results, or external API calls.

## Data flow
A pure `searchLocalWorkspace` function flattens `LocalSpace[]` into typed results with labels, contexts, categories, and hrefs. `GlobalSearchDialog` loads the local data after mounting and filters it with the pure function. `AppHeader` owns open state and opens the dialog through click or Ctrl K.

## Accessibility
The header search control has a label. The palette is a modal dialog with a labelled input, category tabs, result links, and Escape/backdrop dismissal.