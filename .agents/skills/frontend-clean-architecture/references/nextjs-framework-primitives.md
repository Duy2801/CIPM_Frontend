# Next.js Framework Primitives

Read this reference only after discovery confirms that the frontend uses
Next.js. Do not apply Next.js imports or conventions to another frontend
framework.

## Version and Router Discovery

Before changing Next.js code:

1. Read the installed `next` package version and repository instructions.
2. Determine whether the affected code uses the App Router, Pages Router, or a
   documented migration boundary. Do not infer the router from memory.
3. Read the relevant installed-version documentation. When bundled docs exist,
   use the matching guides under `node_modules/next/dist/docs/`.
4. Inspect neighboring routes and shared navigation components before adding a
   new wrapper.

Do not mix App Router and Pages Router APIs. Examples in this reference show
common modern syntax, but installed documentation and repository constraints
remain authoritative.

## Mandatory Internal Navigation Rule

For an ordinary link to a route owned by the same Next.js application, use the
`Link` component from `next/link`.

```tsx
import Link from "next/link";

export function ProductLink({ slug }: { slug: string }) {
  return <Link href={`/products/${slug}`}>View product</Link>;
}
```

Do not use these substitutes for an ordinary internal link:

```tsx
// Avoid: bypasses Next.js client navigation and prefetch behavior.
<a href="/products">Products</a>

// Avoid: navigation is declarative, so an imperative router adds client logic.
<button type="button" onClick={() => router.push("/products")}>
  Products
</button>

// Avoid: forces browser-level navigation for an ordinary internal route.
<button type="button" onClick={() => (window.location.href = "/products")}>
  Products
</button>
```

`Link` renders anchor semantics. In current Next.js versions it does not need a
nested `<a>` child. Pass supported anchor props such as `className`, `target`,
or accessible labels to `Link` according to the installed documentation.

## Choose Link, Anchor, Button, or Router by Meaning

| Intent | Required mechanism |
| --- | --- |
| Navigate to a route in the same Next.js application | `Link` from `next/link` |
| Navigate to a dynamic internal route | `Link` with a valid dynamic `href` |
| Navigate to an internal route with query or route hash | `Link` |
| Jump only to a fragment in the current document | Native anchor semantics or the repository's established accessible pattern |
| Open an external origin or a route in another Next.js zone | Native `<a>` with appropriate security and accessibility attributes |
| Open `mailto:`, `tel:`, or a downloadable resource | Native `<a>` |
| Perform an action without navigation | Native or shared `<button>` |
| Navigate only after submit, mutation, permission check, or other event result | Router API for the detected router |
| Redirect during server-rendered control flow | Installed router's documented redirect API |

Do not use a clickable `div` or `span` for either navigation or actions. Preserve
native keyboard, focus, open-in-new-tab, copy-link, and assistive-technology
behavior.

## Imperative Navigation Is an Exception

Prefer `Link` whenever the destination can be expressed declaratively in the
rendered UI. Use an imperative router only when navigation is the result of
logic that must run first, such as a successful form submission or mutation.

Use the router family discovered in the project:

```tsx
// App Router client component
"use client";

import { useRouter } from "next/navigation";
```

```tsx
// Pages Router component
import { useRouter } from "next/router";
```

Do not add a client boundary merely to call `router.push` for a destination that
could be represented by `Link`. Never pass an untrusted or unsanitized URL to an
imperative router. Use browser navigation for external URLs when required by
the installed documentation.

An intentional full-page navigation may be valid for a documented requirement,
such as crossing application zones or clearing client-only session state. Make
that reason explicit; do not use it as the default internal navigation pattern.

## Styling a Link Like a Button

Visual appearance does not change element semantics. A control that navigates
is still a link even when it looks like a button.

Use the project's existing class or variant utility when it can style `Link`
without invalid nesting:

```tsx
import Link from "next/link";

import { actionClasses } from "./action-styles";

export function PricingLink() {
  return (
    <Link className={actionClasses({ emphasis: "primary" })} href="/pricing">
      View pricing
    </Link>
  );
}
```

If a shared Button supports `asChild`, `render`, slots, or another polymorphic
API, use only the composition mechanism actually present in the installed
component. The final DOM must contain one anchor, not a button nested in an
anchor or an anchor nested in a button.

Do not add a global `linkButton` variant named after one feature. Keep
feature-specific navigation styling with its feature, following the shared UI
ownership rules.

## Prefetch and Navigation Options

Keep the installed router's default prefetch, scroll, and history behavior
unless a measured or product-specific requirement justifies changing it.
Defaults and available props can differ by router and Next.js version.

- Do not set `prefetch`, `replace`, `scroll`, or shallow-navigation options by
  habit.
- Do not replace `Link` with a custom router wrapper merely to reproduce
  behavior Next.js already owns.
- Use navigation callbacks only for real navigation concerns such as a
  documented unsaved-change guard.
- Test production navigation behavior when changing prefetch or routing because
  development behavior may differ.

## Other Next.js-Owned UI Concerns

When touched code uses a raw implementation for a concern with a first-class
Next.js primitive, inspect the installed documentation before deciding:

- route navigation: `next/link`;
- optimized content images: `next/image` when the source and rendering use case
  meet its documented requirements;
- script loading strategies: `next/script` for scripts the framework should
  schedule;
- font loading: the installed `next/font` APIs when the project has adopted
  them;
- metadata, redirects, and router hooks: the API belonging to the detected
  router and installed version.

Internal route navigation with `Link` is mandatory. The other primitives are
required when they own the changed concern and their documented constraints are
met; do not replace valid semantic HTML blindly. For example, an external link
remains an anchor, an action remains a button, and a CSS background image is not
automatically an `Image` component.

## Next.js Review Checklist

- Was Next.js and its installed version discovered rather than assumed?
- Was the affected App Router or Pages Router identified?
- Does every ordinary internal route link use `next/link`?
- Are external, cross-zone, download, `mailto:`, and `tel:` links still native
  anchors?
- Is imperative routing limited to event-driven navigation that cannot be a
  declarative link?
- Are router URLs trusted or sanitized?
- Does a link styled as a button still render exactly one anchor?
- Were nested anchors and button-anchor combinations avoided?
- Were prefetch and scroll defaults changed only for a documented reason?
- Were other touched Next.js-owned concerns checked against installed docs?
- Were server/client boundaries and accessibility semantics preserved?
