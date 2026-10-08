# Frontend Architecture Boundaries

Use frontend boundaries to isolate reasons to change and keep UI dependencies
controllable. Do not create layers whose only benefit is making the folder tree
look formal.

## Responsibility and Cohesion

A frontend module is cohesive when its contents change for the same user-facing
or product reason and use the same feature vocabulary. Split it when unrelated
rendering, interaction, state, policy, API, platform, or consumer concerns force
it to change independently.

Keep code together when splitting would require readers to jump through several
files to understand one small interaction.

## Frontend Dependency Direction

Classify affected code by role rather than by a mandatory folder name:

| Role | Owns | Should not own |
| --- | --- | --- |
| Feature policy | Frontend-consumed decisions, calculations, validation, and invariants | UI framework, components, browser or device APIs, concrete network clients |
| Interaction workflow | User-flow ordering, commands, state transitions, cancellation, retry, and optimistic coordination | Markup, styling, concrete transport details |
| Data or platform adapter | API calls, query integration, browser or device storage, SDK calls, serialization, and external mapping | Business policy or visual presentation |
| Presentation | Routes, screens, components, accessible interaction, event adaptation, and rendering | Hidden data access or duplicated policy |

The project may use names such as `model`, `controller`, `hook`, `store`,
`client`, `query`, `view`, or no layer names at all. Preserve a smaller shape
when the dependency direction and ownership are already clear.

## External Frontend Data and I/O

- Treat API payloads, route and query parameters, form input, URL state,
  browser or device storage, native bridges, postMessage events, and
  third-party SDK objects as external data.
- Validate or narrow external data at the frontend boundary using the project's
  existing mechanism.
- Map external shapes when their names, units, nullability, nesting, or
  lifecycle differ meaningfully from the frontend model.
- Keep I/O visible in module ownership, function names, injected dependencies,
  query definitions, or return types. Do not hide network or platform access
  inside innocent-looking formatting helpers.
- Convert low-level failures into states meaningful to the UI without removing
  diagnostic context needed by the project's logging or monitoring boundary.
- Do not duplicate server-authoritative security, pricing, permission, or data
  integrity rules as if frontend checks were authoritative. Frontend validation
  may improve interaction but does not replace the owning backend contract.

## Public and Private Frontend APIs

- Export only components, hooks, models, commands, or adapters intended for
  other frontend modules.
- Cross-feature consumers use public entry points when the repository has
  feature boundaries; code within the same feature may import private
  implementation directly according to local conventions.
- Do not route a feature's internal imports through its own barrel if that
  creates cycles or obscures ownership.
- Keep component internals, transport DTOs, and local state shapes private when
  callers need only a stable feature contract.
- Make breaking component props, exported types, and feature API changes
  intentional and update all known frontend consumers.

## State and Lifecycle Ownership

- Place mutable UI state at the narrowest owner that coordinates all legitimate
  consumers.
- Avoid storing values that can be derived cheaply from authoritative state,
  props, navigation, or query data.
- Represent user flows with explicit states when independent flags permit
  impossible combinations.
- Define creation, request, cancellation, retry, cleanup, subscription, and
  disposal ownership for asynchronous or platform resources.
- Do not duplicate the same authoritative state across component state, URL,
  form state, query cache, and global store without a synchronization policy.

## Worked Examples

### Example: Separate a Frontend Feature Without Mechanical Layers

Bad: one screen fetches an API payload, interprets it, filters data, owns request
states, and renders everything inline.

```text
CatalogScreen:
  response = network.get("/products")
  products = response.items.map(convertFieldsInline)
  visible = products.filter(productMatchesCurrentRouteInline)
  if requestFailed then renderErrorInline
  if visible.empty then renderEmptyInline
  renderFiltersAndGrid(visible)
```

Better when each responsibility is substantial:

```text
catalog data adapter:
  request products
  validate or narrow the external response
  map response items to frontend product summaries

catalog interaction owner:
  coordinate route filters, request lifecycle, cancellation, and retry
  expose an explicit view state

catalog filter policy:
  calculate visible product summaries from prepared data and filters

catalog presentation:
  render filters and reachable loading, failure, empty, and success states
```

For a tiny screen, some roles may stay in one file. Do not create an adapter,
controller, and policy when the repository's existing query mechanism already
provides a clear, testable boundary and the remaining logic is trivial.

### Example: Map an API Shape at the Frontend Boundary

External response:

```text
UserResponse {
  user_id: string
  display_name: string | null
  created_at_ms: integer
}
```

Frontend model:

```text
UserSummary {
  id: string
  displayName: string
  createdAt: DateLikeValue
}
```

Boundary mapping:

```text
mapUserResponse(response):
  require non-empty response.user_id
  apply the product's documented display-name fallback
  convert created_at_ms using the project's time convention
  return UserSummary(id, displayName, createdAt)
```

Components no longer depend on transport names, nullability, or time units.

### Example: Make Invalid UI States Unrepresentable

Bad:

```text
isLoading: boolean
isSuccessful: boolean
error: Error | null
data: Data | null
```

This permits loading with success data and success with an error. Prefer an
explicit state model when supported by the project:

```text
ViewState =
  | Idle
  | Loading
  | Failed(reason)
  | Empty
  | Succeeded(data)
```

Do not add states the feature cannot reach. Reuse the query or state library's
established model when it already prevents invalid combinations.

### Example: Avoid a Vague Frontend Utility Module

Bad:

```text
utils/
  helpers
  common
  misc
```

Better ownership:

```text
catalog/
  filter-products
  map-product-response

checkout/
  format-order-summary

navigation/
  parse-search-state
```

Create shared frontend code only after multiple real consumers share the same
semantics, not merely similar lines.
