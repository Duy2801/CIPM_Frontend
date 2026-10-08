# Frontend Quality Gates

Verification must match the frontend project, scope, and risk. Discover commands
and tooling from the repository; do not assume a package manager, compiler,
linter, UI framework, test runner, browser runner, or build system.

## Required Checks

1. Review the final frontend change set for unrelated cleanup, generated
   artifacts, accidental component or feature API changes, cycles, client/server
   boundary violations, and moved-file import breakage.
2. Run the repository's formatter or formatting check for touched frontend file
   types.
3. Run applicable lint, static-analysis, and type checks.
4. Run focused tests for changed components, interaction policy, state, mapping,
   and data or platform adapters.
5. Run accessibility checks supported by the project when semantics, focus,
   keyboard interaction, forms, dialogs, or navigation change.
6. Run the relevant frontend build, bundle, component preview, integration, or
   end-to-end check when changing routes, entry points, execution boundaries,
   shared UI, styling configuration, or build configuration.
7. Report checks that were unavailable or could not run. Never claim validation
   that did not happen.

Do not rewrite unrelated files merely to make a broad tool pass. Distinguish
pre-existing failures from regressions introduced by the change.

## Frontend Test Strategy

- Test pure frontend policy and transformations without rendering or network
  dependencies when the architecture permits it.
- Test components through visible output, accessible roles, and user
  interaction rather than private implementation details.
- Test API and platform adapters against their frontend contracts and important
  error mappings.
- Use integration or browser tests where mocks would hide routing, focus,
  serialization, hydration, storage, network, or framework wiring errors.
- Cover reachable loading, empty, failure, retry, cancellation, cleanup,
  permission, validation, and success states in proportion to risk.
- Avoid snapshots so large that meaningful UI changes are hidden.

## Frontend Architecture Completion Checklist

- Can a maintainer locate the user-facing behavior by project vocabulary?
- Does each changed component or module have one coherent primary reason to
  change?
- Do reusable policies avoid depending on UI-framework, browser, device, or
  concrete network details?
- Are external data and frontend I/O validated, mapped, and visible at useful
  boundaries?
- Are exported components, hooks, types, and feature APIs intentional while
  private internals remain private?
- Are frontend dependencies acyclic and free of private cross-feature imports?
- Is UI state owned once with a clear lifecycle and synchronization policy?
- Are reachable view states explicit without impossible flag combinations?
- Are shared UI modules genuinely domain-agnostic?
- Were primitive variants named after semantic domain intent (`brand`, `danger`, `warning`, `muted`) rather than physical color names (`red`, `blue`, `slate`)?
- In RSC / Next.js projects: Is `"use client"` pushed down to interactive leaf nodes, keeping pages and layout shells as Server Components?
- Was the data fetching strategy aligned with the architecture (Mode A: RSC + Server Actions, Mode B: TanStack Query 3-Layer, Mode C: Static Mock)?
- Are heavy client libraries (charts, rich text editors, maps) dynamically imported with loading skeletons?
- Are animations constrained to composite properties (`transform`, `opacity`) and do they respect `prefers-reduced-motion`?
- Are accessibility and existing interaction contracts preserved?
- Can important behavior be tested without unrelated systems?
- Is the new frontend structure no more elaborate than the feature requires?
- Does the result follow the discovered framework and repository conventions?

If desirable cleanup is outside the requested frontend scope, report it as
follow-up work instead of expanding the change without permission.

## Example Verification Report

Use actual commands from the project:

```text
Verification
- formatting check: passed
- lint and static analysis: passed
- frontend type check: passed
- focused component and state tests: 12 passed
- accessibility check: passed
- frontend build: passed

Not run
- browser end-to-end tests: no project command was found
```

When a check fails before the change, identify the command, failing location,
and evidence that the failure is pre-existing.
