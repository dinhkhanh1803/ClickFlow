# Login UI and Google mock sign-in design

## Goal
Refresh the ClickFlow login screen into a responsive two-column authentication surface and add a clearly labelled Google sign-in mock.

## Scope
- Keep email/password validation and the existing mock success notification.
- Add a Google action with a standard Google mark, progress state, success notification, and client-side redirect to `/dashboard`.
- Do not add OAuth SDKs, credentials, tokens, sessions, or backend routes.

## UI
The left panel prioritizes readable inputs and provides the Google action after a visual divider. The right panel communicates the product value through a restrained indigo/violet gradient and three concise capability points. On mobile the marketing panel is omitted and the form fills the viewport.

## Accessibility and testing
The Google action has an explicit name and exposes a progress status while the mock connection runs. A component test verifies the action exists before the new UI behavior is implemented.