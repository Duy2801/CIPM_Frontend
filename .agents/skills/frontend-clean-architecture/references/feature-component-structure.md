# Adaptive Feature and Component Structure

Read this reference only when creating or restructuring a user-interface
feature. It explains how to discover an appropriate structure; it does not
prescribe React, a `features` directory, one component per file, or a fixed set
of folders. Keep all decisions within the frontend scope defined by `SKILL.md`.

## The Structure Is Discovered, Not Predicted

An agent does not need to know the project's ideal structure in advance. It
must derive the smallest compatible structure from repository evidence in this
order:

1. Explicit repository instructions, architecture records, and user choices.
2. Constraints and conventions of the installed framework and its version.
3. Coherent boundaries, names, imports, and test placement already used by the
   closest comparable modules.
4. The feature's actual responsibilities, consumers, change patterns, and
   external boundaries.
5. Examples in this skill, used only when the repository leaves a decision
   open.

When evidence conflicts, follow the higher-priority source. When the repository
is inconsistent, do not average all patterns together. Prefer the nearest
coherent example, preserve behavior, and make the smallest local correction
that solves the requested structural problem.

## Required Discovery Pass

Before proposing files or moving code:

1. Locate the application source roots, route or screen entry points, import
   aliases, component-library source, and existing module boundaries.
2. Inspect the manifest, framework configuration, build and test setup, and any
   generated-code rules that constrain placement.
3. Read one or more comparable features when available. Compare their public
   imports, state ownership, data access, tests, and naming; do not copy an
   obvious local anti-pattern merely for consistency.
4. Inventory the requested feature's real behavior:
   - visible sections and repeated UI concepts;
   - inputs, events, state, derived values, and effects;
   - loading, empty, failure, permission, and success states that are reachable;
   - network, storage, browser, native, or third-party I/O;
   - external payloads, validation, mapping, business rules, and content;
   - current and intended consumers.
5. Identify which responsibilities change together and which require an
   independent owner.
6. Select only the files and boundaries justified by that evidence.

Do not create empty `api`, `hooks`, `services`, `types`, `constants`, `model`,
or `components` folders to make a feature look complete.

## Build a Responsibility Map Before a Folder Tree

Use roles to reason about the feature. Map them onto the repository's existing
names and locations afterward.

| Responsibility | Keep or extract when | Do not extract merely because |
| --- | --- | --- |
| Route or screen entry | The framework needs an entry point that integrates routing, layouts, metadata, or top-level data | Every feature must have a container |
| Visual section | It is a cohesive part of the screen with its own reason to change or substantial markup | The parent file crossed an arbitrary line count |
| Feature-owned component | The same feature concept repeats within its owner, has meaningful variants, or owns coherent behavior | Two unrelated elements share several CSS classes |
| Interaction controller or hook | State, events, effects, cancellation, validation, or synchronization form one reusable/testable responsibility | A component calls one state primitive |
| Policy or calculation | A business decision should be reusable or independent from rendering and I/O | A one-line display expression can be moved |
| Data adapter or service | The feature communicates with a real external boundary or needs a replaceable integration seam | A template says every feature needs a service |
| Schema, mapper, or model | External data must be validated/narrowed, translated, or given stable internal meaning | Type declarations happen to be long |
| Content or configuration | Content is large, reused, localized, generated, or changes independently from rendering | Every visible string must live in a constants file |
| Public entry point | Other modules consume an intentional feature API and the repository uses module boundaries | Barrel exports look cleaner |

One file may own several closely related roles in a small feature. Split them
only when separate ownership makes the feature easier to understand or change.

## Proportionate Feature Shapes

The shapes below are examples of increasing responsibility, not stages every
feature must pass through. Replace all names and locations with those discovered
in the project.

### Small Static Feature

```text
feature owner/
  screen-or-section
  repeated-feature-component
```

Keep static content in the screen or section when it is short and used once.
Do not add a hook, service, model, or content file without another reason.

### Interactive Local Feature

```text
feature owner/
  feature-view
  repeated-feature-components
  interaction-controller-or-hook     only if state/effects form a clear owner
```

Keep simple local state in the component that owns it. Extract the interaction
logic only when it coordinates meaningful behavior such as debouncing, URL
synchronization, validation, cancellation, or multiple UI parts.

### Data-Backed Feature

```text
feature owner/
  feature-entry-or-view
  state-rendering-components
  data-adapter                       because external I/O exists
  external-schema-or-mapper          only when boundary translation is needed
  feature-policy                     only when business decisions exist
```

Do not add pass-through `service`, `manager`, `repository`, and `controller`
layers around one request. Each retained layer must own a distinct policy,
boundary, lifecycle, or substitution point.

## Component Decomposition Rules

Evaluate each candidate component in this order:

1. **Name the concept.** If it cannot be named more precisely than `Wrapper`,
   `Block`, `Item`, or `Section`, its responsibility may not be clear enough.
2. **Identify the owner.** Decide whether it belongs to one screen, one feature,
   several unrelated features, or the shared UI system.
3. **Check semantic repetition.** Repeated instances must represent the same
   concept, not merely look similar.
4. **Check variation.** If instances share structure and differ through a
   finite set of meaningful choices, expose a small variant API using the
   project's existing mechanism.
5. **Check independent behavior.** State, effects, accessibility, performance,
   error handling, or testing may justify extraction even for one instance.
6. **Keep one-off simple UI local.** Do not create a file or wrapper only to
   hide a short class string or a few lines of obvious markup.
7. **Separate non-visual policy when useful.** Rendering may format prepared
   values; it should not duplicate important business decisions.

Component size and line count are signals for inspection, not extraction
rules. A long cohesive component can be cleaner than many pass-through files.

## Example: About Pillars

Assume discovery shows that one About feature renders several pillar cards with
the same semantic role and DOM shape, while only a few visual choices differ.
A proportionate decomposition may be:

```text
About screen or section
  -> AboutPillarCard instances
       variant: default | highlight | infrastructure
  -> shared Card or other primitives, if the project has them
```

`AboutPillarCard` is justified because the same feature concept repeats inside
the About owner. A finite CVA variant definition is appropriate only if CVA is
already the project's variant mechanism and callers need those named choices.
Keep the component with About; do not add `about` variants to a global Card.

Possible placement, only when it matches the repository:

```text
feature owner for About/
  components/
    AboutPillarCard
    AboutPillarsSection              only if the section is independently useful
```

Do not automatically add these files:

```text
hooks/                               no interaction state or effects
api/                                 no external request
services/                            no service responsibility
types/                               no meaningful shared model
constants/                           no independently owned configuration
index                                no established public module boundary
```

If there is only one simple pillar block, keep it in the About section. If the
same class list appears on an unrelated Contact card, do not merge them solely
for visual deduplication.

## Container, View, and Hook Are Conditional Patterns

Do not force a container/view pair for every screen.

Keep one component when rendering, local interaction, and ownership are simple.
Separate a controller, container, presenter, or hook when doing so isolates a
coherent responsibility, for example:

- one interaction model drives several sections;
- effects synchronize with URL, storage, browser, native, or network systems;
- request cancellation, retry, optimistic updates, or validation need one
  authority;
- prepared view data is useful independently from the rendering technology;
- visual states need focused tests without reproducing orchestration.

A hook that only renames one state setter or forwards another hook is not a
useful boundary.

## Imports and Public Surface

- Follow the repository's existing alias and relative-import conventions.
- Keep private feature implementation private. Do not deep-import another
  feature's internals.
- Use a feature public entry point only when the repository has such boundaries
  and real external consumers need one.
- Do not route a feature's internal imports through its own barrel when that
  obscures ownership or creates cycles.
- When two features need apparently similar code, first compare semantics. Move
  it to shared ownership only when both consumers use the same domain-agnostic
  contract.
- Preserve frontend-framework execution boundaries such as server-rendered,
  client, web-worker, or native UI modules according to the installed version.
  Do not expand the task into standalone backend architecture.

## Avoid Mechanical Fragmentation

Reject a proposed split when it creates:

- an empty directory reserved for hypothetical growth;
- a component that only forwards identical props once;
- a hook that only wraps one state call without adding a concept;
- a service that only renames one adapter call;
- a constants file containing self-explanatory one-off literals;
- an `index` that exports every private implementation detail;
- a compound component API for one fixed layout;
- CVA for one fixed class string;
- navigation across several files to understand one small operation.

Prefer colocation first. Promote code from use site to feature-owned component,
then to shared ownership only when real responsibility and consumers justify
each move.

## Project Feature Versus Separate Skill

Do not create a Codex skill for every ordinary project feature. About, Contact,
Catalog, or Profile components normally belong in the project's code and are
structured by this skill after discovery.

Keep project-specific vocabulary, invariants, and decisions in the project's
code, tests, architecture records, or scoped repository instructions. Create a
separate skill only when a specialized workflow is independently triggerable,
contains substantial non-obvious guidance, and is reusable beyond one ordinary
feature or one project's current folder tree.

## Completion Checklist

- Did repository evidence determine the structure instead of an example tree?
- Does every new file have a precise owner and reason to change?
- Were empty or hypothetical folders avoided?
- Are simple one-off components and state still local?
- Were repeated feature concepts extracted without leaking into shared UI?
- Are variants finite, meaningful, and owned by the correct component?
- Are business policy, effects, and external I/O visible at useful boundaries?
- Does state live at the narrowest owner coordinating its consumers?
- Do imports follow existing boundaries without cycles or private deep imports?
- Were framework, accessibility, test, and behavior contracts preserved?
