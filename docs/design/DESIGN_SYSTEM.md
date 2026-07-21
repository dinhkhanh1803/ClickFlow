# ClickFlow Design System

## Foundations

The interface is light-first with an equivalent dark theme. Semantic variables in `apps/web/src/app/globals.css` are the source of truth for background, foreground, card, muted, border, primary, secondary, tertiary, destructive, and focus states.

Typography uses Hanken Grotesk for headings, Inter for body content, and JetBrains Mono for code. Use the documented text and spacing tokens instead of one-off visual values when adding shared UI.

## Component policy

- Use `components/ui` primitives for buttons, inputs, cards, dialogs, and sheets.
- Keep variants semantic: default, outline, ghost, destructive, and size variants where the primitive provides them.
- Feature components may compose primitives but must not become reusable primitives themselves.
- Loading, empty, error, keyboard focus, labels, and contrast are part of a component's definition of done.

## Accessibility baseline

Every interactive control needs an accessible name. Keyboard focus must remain visible through `--focus-ring`. Dialogs, sheets, navigation, alerts, and status content use semantic roles. The Playwright axe check guards the dashboard baseline; new feature flows require equivalent coverage.

## Change control

Add a token or primitive only when it is reusable across at least two feature contexts. Document the change here and add a focused test for behavior-sensitive primitives.