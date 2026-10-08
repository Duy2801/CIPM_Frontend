# Layout, Typography, and Media Primitives

Read this reference when a frontend project needs recurring layout,
typography, or content-image primitives that its component library does not
provide. Also read `shared-ui-components.md`; for Next.js images, read
`nextjs-framework-primitives.md` and the installed `next/image` documentation.

## Mandatory Catalog Gap Rule

shadcn/ui intentionally does not ship every low-level layout, typography, and
media tag that a product codebase uses every day. When a project repeatedly
needs Ant Design-like JSX primitives such as `Container`, `Flex`, `Stack`,
`Grid`, `Box`, `Title`, `Text`, `Span`, `Image`, or `AspectImage`, create or
extend them in the repository's shared UI directory. Do this before placing
raw `<div>`, `<h*>`, `<p>`, `<span>`, or framework image primitives throughout
features.

Treat these custom primitives as first-class design-system source, not
temporary wrappers. They should give future agents and developers an obvious
shared vocabulary, similar to Ant Design's convenient component tags, while
preserving the lighter DOM, semantics, and project ownership expected from
shadcn/Radix-style code.

**Crucial Adaptation Mandate**: Do not treat layout/typography primitives as plain pass-through wrappers or accept them "as-is". Actively extend their `cva` definitions to encapsulate recurring Tailwind layout, typography, and spacing setups (e.g., `Flex align="center" justify="between"`, `Title variant="gradient"`, `Text variant="muted"`). When a Tailwind class combination repeats across multiple sections, promote it into a type-safe variant prop on the appropriate primitive.

## Selection Order

Choose the smallest semantic primitive that expresses the intent:

| Intent | Preferred primitive |
| --- | --- |
| Page-width boundary and horizontal gutters | `Container` |
| One-dimensional alignment | `Flex` |
| Repeated vertical or horizontal spacing | `Stack` |
| Two-dimensional responsive layout | `Grid` |
| Neutral polymorphic styling surface | `Box` |
| Document heading | `Title` with the correct heading level |
| Paragraph or prose | `Text` |
| Inline emphasis or metadata | `Span` |
| Optimized content image in Next.js | shared `Image` over `next/image` |
| Cropped media with a stable ratio | `AspectImage` |
| Interactive or compound UI | Existing shadcn/ui primitive |

Do not replace meaningful `main`, `section`, `article`, `nav`, `ul`, `li`, or
other native semantics with a generic primitive. Render layout primitives with
an `as` prop when the project establishes that contract, for example
`<Container as="main">` or `<Flex as="nav">`.

## Recommended Contracts

- `Box`: accept `as`, native attributes, `className`, and `ref`; add no visual
  defaults. Use it as the explicit escape hatch for layout that has no more
  specific primitive.
- `Container`: own maximum content width and responsive horizontal gutters.
  Expose only stable width and gutter scales.
- `Flex`: own direction, alignment, distribution, wrapping, and gap. Keep
  responsive feature-specific behavior in `className` unless it repeats as a
  system-wide contract.
- `Stack`: specialize `Flex` for repeated one-dimensional spacing. Default to
  a vertical direction and stretched children.
- `Grid`: own a small, statically detectable column and gap scale. Do not add
  variants named after pages or features.
- `Title`: separate semantic heading level from visual variants. Default the
  rendered element to `h{level}`; allow `as` only for an intentional document
  outline exception.
- `Text`: default to `p`; allow semantic rendering such as `label`, `small`, or
  `figcaption` through the established polymorphic API.
- `Span`: remain inline by default. Do not attach click behavior or navigation
  to it.
- `Image`: wrap the framework primitive without hiding required accessibility
  and sizing props. In Next.js require `alt`, preserve `width`/`height` or
  `fill`, pass `sizes` for responsive `fill` images, and use semantic variants
  only for fit and radius.
- `AspectImage`: own the positioned aspect-ratio wrapper and render the shared
  optimized `Image` with `fill`; allow callers to provide accurate `sizes`.

Each primitive must merge its base/variant classes before caller `className`,
forward refs when the repository does so, stay usable in Server Components,
and avoid feature imports, business copy, analytics, state, and effects.

## Composition Example

```tsx
<Container as="section" size="lg">
  <Stack gap="lg">
    <Stack gap="sm">
      <Title level={2}>Section title</Title>
      <Text variant="muted">
        Supporting copy with <Span variant="strong">inline emphasis</Span>.
      </Text>
    </Stack>
    <Flex as="ul" wrap="wrap" gap="md">
      {items.map((item) => (
        <Box as="li" key={item.id}>{item.label}</Box>
      ))}
    </Flex>
    <AspectImage
      src="/example.jpg"
      alt="Describe the meaningful image content"
      ratio="video"
      sizes="(min-width: 1280px) 1200px, 100vw"
    />
  </Stack>
</Container>
```

Treat the classes, sizes, and content as project-specific. Preserve the
selection logic and semantic structure.

## Creation Workflow

1. Inspect the configured shared UI directory and existing primitives.
2. Check whether shadcn/ui already provides the interaction primitive. If yes,
   import/install/adapt it instead of creating a duplicate.
3. If shadcn/ui does not provide the recurring layout, typography, or media
   primitive, create the missing project-owned primitive in shared UI.
4. Reuse and extend compatible existing local primitives instead of creating
   duplicates.
5. Add only primitives justified by repeated, domain-neutral use.
6. Use the repository's class merge and finite-variant helper when present.
7. Prefer semantic tokens over feature colors or page-specific gradients.
8. Keep primitives server-compatible unless interaction truly requires a
   client boundary.
9. Verify types, lint, build, responsive behavior, rendered semantics, image
   sizing, and accessible alternative text.

## Avoid

- A `Container` that includes hero backgrounds or section-specific spacing.
- A `Flex` variant such as `pricingHeader` or `homeActions`.
- A `Title` whose `level` changes only font size but renders the wrong heading.
- A block-level `Span` used as a generic `div` replacement.
- An `Image` wrapper that silently supplies empty alternative text, discards
  Next.js sizing requirements, or makes every consumer a Client Component.
- Dozens of spacing or color props that duplicate the utility system.
