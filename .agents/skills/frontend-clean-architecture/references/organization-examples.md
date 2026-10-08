# Proportionate Frontend Organization Examples

Choose frontend structure from user-facing behavior, change patterns,
ownership, and dependencies. Never force one of these shapes onto a repository
that already expresses the same boundaries with different names.

## Discovery Before Design

Inspect:

- Frontend application type: web, mobile, desktop, embedded UI, browser
  extension, component library, or frontend monorepo.
- Installed framework, renderer, routing model, and server/client or native
  execution boundaries.
- Existing feature, package, component, and import boundaries.
- State, data-fetching, form, styling, localization, and test conventions.
- How frontend code is built, generated, bundled, tested, and released.
- Which files and components change together in the requested user flow.

Do not propose a new top-level frontend architecture until the existing one is
understood.

## Level 1: Keep a Small UI Capability Local

For one owner and one cohesive interaction:

```text
current screen or component
  local rendering
  local interaction state
  focused test, if justified by local convention
```

Do not create a feature package, controller, hook, service, model, constants
folder, and public barrel around a small component with no independent owner.

## Level 2: Group a Recognizable Frontend Feature

When several pieces implement one user-facing capability:

```text
catalog feature/
  catalog view
  product card
  filter interaction state
  products data adapter              only because external data exists
  public entry point                 only if external consumers need one
  tests                              placed by repository convention
```

This is organization by frontend capability. Replace all labels and paths with
the repository's naming.

## Level 3: Add Internal Boundaries for a Complex Frontend Feature

When UI, interaction workflow, policy, and multiple integrations evolve
independently:

```text
checkout feature/
  model-or-policy/
    checkout state
    display and validation policy
  interaction/
    checkout flow
  data/
    checkout API adapter
    checkout response mapper
  presentation/
    checkout screen
    payment form
    order summary
  public entry point
```

Names such as `components`, `hooks`, `state`, `model`, `queries`, `api`, or
`view` may be more idiomatic. Add an internal boundary only when it owns a real
reason to change; do not reproduce this example mechanically.

## Level 4: Frontend Package or Workspace Boundary

Create a separate frontend package only when there is a real ownership,
release, runtime, dependency, or cross-application reuse boundary:

```text
frontend applications/
  customer UI
  operations UI

frontend packages/
  design system
  shared accessibility utilities
```

Do not create packages solely to shorten imports. Package boundaries add build,
test, versioning, dependency, and release costs.

## Variations Across Frontend Projects

### Client-Rendered Web UI

```text
feature/
  route or screen
  components
  interaction state
  API or query adapter, when needed
```

### Server-Rendered or Hybrid Frontend

```text
feature/
  frontend route entry
  server-rendered data boundary, if the framework owns one
  serializable view model
  interactive client components, only where needed
```

Keep secrets and server-only modules outside client bundles. This does not
authorize designing a standalone backend inside the frontend skill.

### Mobile or Desktop UI

```text
feature/
  screen
  feature components
  interaction state
  device or native adapter, when needed
```

### Component Library or Design System

```text
UI primitive
  behavior and accessibility
  semantic variants
  styling tokens
  focused tests and examples by repository convention
```

These examples express frontend responsibilities, not mandatory filenames,
extensions, or directories.

## Split Decision

Extract a frontend module or component when at least one is true:

- It has an independent user-facing or product reason to change.
- It isolates feature policy from rendering, network, or platform APIs.
- It defines a stable capability used by real frontend consumers.
- It removes a dependency cycle or private cross-feature import.
- It creates a valuable interaction, accessibility, or state test seam.
- It owns a distinct lifecycle, request, subscription, error, or permission
  boundary.
- A precise feature name communicates an important concept hidden inline.

Keep code together when the proposed split only reduces line count, renames one
operation, creates pass-through props, or makes one interaction harder to
follow.

## Example: Reject Mechanical Frontend Layering

Avoid a pass-through chain with no independent responsibility:

```text
Page -> Container -> Hook -> Service -> Client
```

If each layer only forwards identical values, collapse it to the smallest shape
that keeps real boundaries visible:

```text
Feature UI -> interaction owner -> API adapter
```

For a simple request with no custom coordination, the project's established
query mechanism may connect directly to the feature UI without another wrapper.
