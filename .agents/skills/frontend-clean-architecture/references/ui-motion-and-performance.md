# UI Motion, Animations, and Performance Boundaries

Read this reference when implementing interactive animations, micro-interactions, heavy media components, or optimizing frontend performance (Core Web Vitals).

---

## 1. Animation Performance Boundaries (GPU Acceleration)

Modern web animations must remain smooth (60-120fps) without causing CPU layout thrashing.

### The Composite-Only Rule
- **Safe to Animate (Composite Layer)**:
  - `transform` (`translateX`, `translateY`, `scale`, `rotate`)
  - `opacity`
- **Avoid Animating Directly (Layout & Paint Triggering)**:
  - `height`, `width`, `top`, `left`, `margin`, `padding`, `border-width`
  - *Why*: Animating these forces the browser engine to recalculate layout on every frame, causing noticeable dropped frames (jank), particularly on mobile devices.

### Animating Collapsible / Accordion Panels
When an expandable container must animate its height:
1. Prefer CSS Grid transition technique:
   ```css
   .accordion-content {
     display: grid;
     grid-template-rows: 0fr;
     transition: grid-template-rows 250ms ease-out;
   }
   .accordion-content[data-state="open"] {
     grid-template-rows: 1fr;
   }
   .accordion-inner {
     overflow: hidden;
   }
   ```
2. Or use Radix / shadcn/ui built-in collapsible primitives that leverage CSS variables (`var(--radix-accordion-content-height)`).

### Micro-Interaction Timing
- Hover & active feedback: `150ms` - `200ms`
- Drawer / modal transitions: `200ms` - `300ms`
- Easing: Prefer `cubic-bezier(0.16, 1, 0.3, 1)` (snappy ease-out) over linear.

---

## 2. Framework Motion Isolation (`motion` / Framer Motion)

When using animation libraries such as Framer Motion or `@motionone`:

1. **Leaf Boundary Rule**: Motion components require client-side execution. Push motion wrappers into dedicated client leaf components:
   ```tsx
   // RIGHT: Dedicated client leaf animation wrapper
   // src/components/ui/fade-in.tsx
   "use client";
   import { motion } from "framer-motion";

   export function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
     return (
       <motion.div
         initial={{ opacity: 0, y: 16 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.4, delay, ease: "easeOut" }}
       >
         {children}
       </motion.div>
     );
   }
   ```
   *Never* put `"use client"` on the parent `page.tsx` or layout merely to wrap children in `<motion.div>`.

2. **Accessibility & Reduced Motion**:
   Always respect user accessibility preferences:
   - Tailwind utility: `motion-reduce:transition-none motion-reduce:transform-none`
   - Framer Motion: Wrap animations with `useReducedMotion()` or conditionally disable transforms.

---

## 3. Code Splitting & Dynamic Imports for Heavy Components

Do not bundle large, infrequently used dependencies into the initial page bundle.

### When to Use Dynamic Imports
Apply `next/dynamic` (or `React.lazy`) for:
- Data visualization charts (Recharts, Chart.js, D3)
- Rich text or markdown editors (TipTap, Monaco, Quill)
- Heavy modal dialogs or slide-over drawers not visible on initial render
- Map widgets (Mapbox, Leaflet)
- QR code generators, PDF viewers, Lottie canvas players

### Standard Pattern
```tsx
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load heavy chart without SSR
export const AnalyticsChart = dynamic(
  () => import("./analytics-chart").then((mod) => mod.AnalyticsChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[320px] w-full rounded-2xl" />,
  }
);
```

---

## 4. Media & Core Web Vitals Optimization

### Next.js Image Optimization (`next/image`)
1. **Always specify `sizes`**: When using `fill`, provide a descriptive `sizes` attribute to ensure mobile devices do not download 4K desktop images:
   ```tsx
   <Image
     src={feature.image}
     alt={feature.title}
     fill
     sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
     className="object-cover rounded-xl"
   />
   ```
2. **Prioritize the LCP Hero**:
   - Add `priority` attribute **only** to the single primary banner or hero image above the fold.
   - Do **not** add `priority` to images below the fold.

### Cumulative Layout Shift (CLS) Prevention
- Always reserve aspect ratios for media using Tailwind's `aspect-video`, `aspect-square`, or explicit width/height dimensions.
- Use `<Skeleton>` components that closely mirror the rendered dimensions of async content cards and lists.

---

## 5. Performance Review Checklist

- [ ] Are animations restricted to composite properties (`transform`, `opacity`)?
- [ ] Are heavy interactive libraries (charts, editors, maps) dynamically imported via `next/dynamic`?
- [ ] Is `"use client"` isolated to leaf animation wrappers rather than page-level components?
- [ ] Does the UI respect `prefers-reduced-motion` for accessibility?
- [ ] Is `priority` added strictly to the primary above-the-fold hero image?
- [ ] Do async components and images reserve aspect ratios/skeleton sizes to prevent CLS?
