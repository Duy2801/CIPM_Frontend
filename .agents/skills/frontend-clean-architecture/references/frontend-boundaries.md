# Frontend Rendering and Interaction Boundaries

Use this reference for rendering, interaction, and UI state decisions. Do not
assume React, Next.js, a component model, client rendering, or any specific
state library.

## UI Responsibility

- Keep rendering or view declaration focused on translating prepared state into
  interface output.
- Simple display conditions, formatting, and event adaptation may remain near
  the view.
- Move reusable business decisions and non-visual policy into framework-neutral
  modules when practical.
- Keep direct browser, native platform, or framework lifecycle APIs at an
  explicit UI boundary.
- Follow the installed framework's current documentation for component,
  lifecycle, ref, rendering, and server/client semantics.

## Interaction and State

- Keep transient interaction state close to the interface that owns it.
- Lift or share state only when multiple consumers require one authority.
- Put shareable navigation state in the platform's navigation mechanism when
  product behavior requires links, persistence, or history.
- Use effects or lifecycle hooks to synchronize with external systems, not to
  maintain values already derivable from state.
- Model reachable loading, empty, failure, permission, retry, and success states
  explicitly; do not manufacture states the feature cannot enter.

## Components and Composition

- Shared primitives express general semantics such as intent, emphasis, size,
  state, and accessibility.
- Page, campaign, customer, or business-specific variants belong to the owning
  feature or screen.
- If the project has a shared component library or shadcn/ui, apply the
  ownership rules and examples in
  [shared-ui-components.md](shared-ui-components.md).
- Prefer ordinary composition before a configurable component with many
  unrelated props.
- Use compound, slot, render-prop, polymorphic, controller/view, or custom-hook
  patterns only when the project's UI framework supports them and the pattern
  solves a concrete composition or ownership problem.

## Worked Examples

The syntax below is JSX-like pseudocode. Adapt it to the project's UI framework.

### Example: Keep Policy Out of the View

Bad:

```text
OrderSummaryView(order):
  discount = if order.customer.level == "gold" then 0.15 else 0
  total = sum(order.lines) * (1 - discount)
  render total
```

Good:

```text
core/calculate-order-summary(order, pricingPolicy) -> summary

OrderSummaryView(summary):
  render summary.subtotal
  render summary.discount
  render summary.total
```

Formatting a prepared total for the current locale may remain in presentation;
deciding who receives a discount should not.

### Example: Keep a Small Interaction Local

Clean without extraction:

```text
SearchBox:
  query = localState("")
  onInput(value): query = value
  render input(query)
```

Extract a controller, hook, presenter, or state object only when the interaction
also owns coherent behavior such as URL synchronization, debouncing, request
cancellation, validation, or state shared by several UI parts.

### Example: Use Composition Instead of Prop Explosion

Bad:

```text
Card(
  title,
  description,
  showHeaderDivider,
  bodyPadding,
  footerText,
  footerAction,
  showFooterDivider
)
```

Better when consumers genuinely need multiple layouts:

```text
Card:
  CardHeader:
    Title
    Description
  CardBody:
    FeatureContent
  CardFooter:
    Action
```

If every consumer uses one fixed layout, keep one ordinary component instead of
introducing a compound API.

### Example: Respect Framework Execution Boundaries

When the frontend framework distinguishes client, server-rendered, web-worker,
native, or sandboxed UI modules:

```text
frontend-owned server-rendering boundary:
  load data allowed by the application architecture
  prevent server-only credentials from entering client bundles
  map result to serializable view data

client boundary:
  own interaction state
  handle platform events
  render using serializable view data
```

Use this split only if the actual frontend framework has such an execution
model. Read its installed-version documentation before choosing entry points or
directives. Do not use this example to design a standalone backend.
