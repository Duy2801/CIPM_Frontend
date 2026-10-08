# Conditional Styling Boundaries

Read this reference only when the task changes styling architecture. Discover
whether the project uses plain CSS, preprocessors, CSS modules, CSS-in-JS,
utility classes, native styles, design tokens, or another system before acting.
When shared primitives or shadcn/ui are involved, also read
[shared-ui-components.md](shared-ui-components.md).

## Ownership

- Keep global styles limited to global concerns: reset, root tokens, document
  defaults, shared accessibility behavior, and unavoidable integration rules.
- Keep feature- or screen-specific styling with its owner.
- Shared visual primitives must remain free of one consumer's business names and
  layout assumptions.
- Do not migrate styling systems or add a styling dependency unless requested
  or necessary to solve the stated problem.

## Tokens and Variants

- Use semantic tokens for repeated design decisions such as surface, text,
  intent, spacing, radius, typography, shadow, and motion.
- **Semantic Intent Color Tokens Mandate**: Never name primitive CVA variants after physical color names (`red`, `blue`, `green`, `slate`). Always name variants after semantic domain intent (`brand`, `primary`, `secondary`, `success`, `warning`, `danger`, `muted`). Physical color names create theme conflicts and muddle component contracts.
- **Config Map / Dictionary Object Pattern**: For dynamic status fields (e.g. `High`, `Medium`, `Low` or `Pending`, `Done`), define a typed `Config Map` object at the feature boundary mapping domain status keys directly to semantic primitive variants. Never write nested `if/else` or ternary JSX blocks to conditionally set color variants.
- Separate token meaning from theme value so themes change values rather than
  searching for implementation-specific class names.
- Add variants when consumers need a finite, meaningful visual API. Keep a
  one-off style local when an abstraction would have no second consumer or
  stable concept.
- Promote repeated exceptional values into the project's token mechanism; do
  not turn every literal into a token.

## Utility-Class Frameworks

Only if the project already uses a utility-class framework:

- Read the installed version's documentation and source-detection rules.
- Use the repository's class merge and variant helpers.
- Keep generated class names statically detectable when the framework requires
  it; map values to complete classes rather than interpolating fragments.
- Let configured tooling order and deduplicate classes.
- Avoid contradictory utilities and arbitrary values that bypass existing
  semantic tokens.
- **Refactor Repetitive or Bloated Tailwind Utility Clusters (Threshold Rule)**:
  - When a `<div>` or component accumulates 5-8+ ad-hoc Tailwind classes, or when a custom component is overridden at the call site with a long chain of utility classes (e.g. `className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all ..."`), this is a critical architectural code smell.
  - **Do NOT leave bloated class strings at the call site**: Proactively upgrade the primitive in `src/components/ui/` (or `src/component/ui/`) by adding a dedicated CVA variant (e.g. `variant="elevated"`, `size="compact"`), or create a dedicated layout primitive (`<Surface>`, `<Flex>`).
- **Strict Ban on Overusing `!` (Important) in Tailwind Utilities**:
  - **Hạn chế tối đa dấu `!`**: Never write `!p-0`, `!h-auto`, `!text-xs`, `hover:!text-blue-700`, or `!bg-...` unless forced by an unresolvable 3rd-party library conflict.
  - **Natural, Accessible Approach**:
    1. Define semantic CVA variants in the primitive (e.g. `intent="link"`, `scale="xs"`).
    2. Leverage component tokens or theme providers (e.g. Ant Design's `ConfigProvider token`, CSS variables).
    3. Rely on natural CSS cascade and `cn(...)` (`twMerge`).
- **Permissible Use of `<div>`**:
  - The native `<div>` element is permitted **ONLY when standard layout primitives (`Flex`, `Card`, `Container`, `Space`, `Grid`, etc.) cannot technically or semantically fulfill the requirement** (e.g., ref measurement wrapper, canvas mount target, third-party slot wrapper).
  - Never use `<div>` as an unstyled flex or spacing container when semantic primitives exist.
- Apply responsive and container behavior according to the installed
  framework, not assumptions from another major version.

## Selectors and Overrides

- Avoid broad selectors that silently restyle unrelated descendants.
- Do not implement themes by matching fragments of generated class names.
- Avoid `!important`; use it only for a documented platform or third-party
  override that cannot be resolved through ownership, layers, tokens, or
  specificity.
- Scope scrolling, animation, focus, and visibility behavior to the component
  that owns it unless the behavior is truly application-wide.

## Worked Examples

### Example: Semantic Theme Tokens

Bad:

```css
.special-theme [class*="text-purple"] {
  color: #c92030 !important;
}
```

Good, using the project's token mechanism:

```css
:root {
  --color-action: #2457d6;
  --color-action-foreground: #ffffff;
}

[data-theme="special"] {
  --color-action: #c92030;
  --color-action-foreground: #ffffff;
}
```

Components refer to the semantic action token and remain unaware of the active
theme. Adapt the syntax to the project's styling system.

### Example: Static Utility Mapping

Bad when the utility framework scans source as text:

```text
class = "background-" + color + "-500"
```

Good:

```text
statusClasses = {
  success: "background-success text-on-success",
  warning: "background-warning text-on-warning",
  error: "background-error text-on-error"
}

class = statusClasses[status]
```

Use actual utility names and the variant mechanism provided by the discovered
project; the names above are illustrative.

### Example: Keep Consumer Styling Out of a Primitive

Bad shared variants:

```text
Button variants:
  default
  homeHero
  holidayCampaign
  checkoutUpsell
```

Better ownership:

```text
Shared Button variants:
  primary
  secondary
  outline
  destructive

Home feature:
  HeroAction composes Button with home-specific layout and decoration
```

If the home-specific style is used once and has no behavior, keep it at the use
site instead of creating a wrapper.

### Example: Targeted Motion

Prefer transitions for the properties that intentionally change rather than a
catch-all transition. Respect the platform's reduced-motion setting and avoid
global scrollbar or scrolling overrides unless explicitly required.
