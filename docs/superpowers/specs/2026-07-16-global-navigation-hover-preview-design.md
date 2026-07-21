# Global navigation hover preview

## Goal

Let users inspect the contextual navigation for any global module before navigating away from their current page.

## Interaction

- Hovering or keyboard-focusing a desktop global-rail module temporarily displays that module's contextual panel.
- Moving the pointer away from the module restores the panel for the route currently open.
- Activating a module navigates to its route; the route's contextual panel then becomes the persistent view.
- The seven modules use their existing contextual configurations: Home, Spaces, My Tasks, Planner, Time, Reports, and Settings.
- Mobile keeps its existing sheet navigation and does not attempt hover previews.

## Architecture

- `AppShell` owns the optional preview module state and derives the default module from the current pathname.
- `AppSidebar` reports hover, focus, blur, and pointer-leave events through an optional callback; it does not own contextual-panel state.
- `ContextSidebar` receives the effective module key as a prop and renders the existing configuration for that module.
- A shared module key type prevents the global rail and panel configuration from drifting apart.

## Accessibility and resilience

- Keyboard focus provides the same preview as pointer hover.
- Focus leaving the global rail restores the route-derived panel.
- Click navigation remains normal link behavior, so opening links in a new tab is unaffected.
- The context panel retains an accessible navigation label based on the effective module.

## Verification

- Unit test: hovering/focusing a rail module reports the expected preview key and clearing hover reports no preview.
- Unit test: the contextual panel renders the supplied preview module rather than the pathname-derived module.
- Run lint, unit tests, typecheck, build, and Playwright accessibility/smoke/visual tests after implementation.
