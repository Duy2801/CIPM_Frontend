---
name: frontend-clean-architecture
description: >-
  Professional frontend architecture skill for designing, building, or refactoring web and mobile user interfaces. Enforces high cohesion, unidirectional dependencies, a 5-tier state hierarchy, proportionate abstraction, and automated quality gates. Automatically discovers target environment for Web (Next.js App Router, Tailwind CSS, CVA, shadcn/ui primitives, TanStack Query) or Mobile (React Native / Expo, React Native Paper MD3 primitives, NativeWind Tailwind styling, React Navigation, Reanimated). Use for routes, screens, features, component libraries, state management, and performance optimization.
---

# Frontend Clean Code Architecture

## Purpose & Core Mandate (Dual-Track: Web & Mobile)

Make frontend code clean, cohesive, and scalable by adopting a tailored primitive component architecture:

### 1. Web Track (shadcn/ui-First Architecture)
- **shadcn/ui Setup**: The web project UI foundation is built upon `shadcn/ui` configured at `@/components/ui`.
- **On-Demand Installation**: When features require UI elements (`Button`, `Card`, `Dialog`, `Sheet`, `Select`, `DropdownMenu`, `Tabs`, `Input`, `Avatar`, `Tooltip`, etc.), **install them via shadcn CLI (`pnpm dlx shadcn@latest add <component> -y`)** or create the primitive in `src/components/ui/` before writing feature code.
- **Active Brand Adaptation ("Không dùng Thô")**: Extend installed primitives with CVA variants and Tailwind tokens to match project brand identity.
- **Semantic HTML5**: Prioritize adapted primitives while leveraging native semantic HTML5 tags (`<section>`, `<article>`, `<p>`, `<nav>`) without unnecessary wrapper bloat ("Box/Span soup").

### 2. Mobile Track (React Native Paper + NativeWind Architecture)
- **React Native Paper as Primitive Foundation (The Mobile "shadcn/ui")**: On mobile (React Native / Expo), instead of shadcn/ui (web-only), use **React Native Paper** (`react-native-paper`). It provides an extensive inventory of ready-to-use, accessible Material Design 3 (MD3) components (`Button`, `Card`, `Dialog`, `TextInput`, `Modal`, `Menu`, `Appbar`, `Chip`, `Snackbar`, `Portal`, `SegmentedButtons`, `HelperText`, `FAB`, `ActivityIndicator`, `Divider`).
- **NativeWind for Tailwind CSS Utility Styling**: Apply all layout, flexbox, spacing, typography, colors, and border radius via `className="..."` using **NativeWind**, eliminating verbose `StyleSheet.create` boilerplate.
- **The Shared Primitive Wrapper Pattern (`src/components/ui/` or `src/components/`)**: Wrap React Native Paper components with NativeWind and semantic variants (`variant="primary" | "secondary" | "outline" | "ghost"`) to present a clean, consistent API for mobile features.
- **Root Theme Configuration**: Ensure `PaperProvider` is initialized at the root (`App.tsx`) with a custom MD3 theme matching project brand colors defined in `tailwind.config.js`.

---

## 1. Discovery & Setup Workflow

Before proposing or writing UI code:

1. **Detect Platform (Web vs Mobile)**:
   - **Web App** (e.g. `apps/frontend-*`): Inspect `components.json` and `@/components/ui`.
   - **Mobile App** (e.g. `apps/mobile`): Inspect `package.json` for `react-native-paper` and `nativewind`, check `PaperProvider` in `App.tsx`, and check `tailwind.config.js`.
2. **Detect Package Manager & Environment**:
   - Use the project's package manager (`pnpm`, `npm`, `yarn`, `bun`) to install dependencies or execute CLI commands non-interactively (`-y`).
3. **Activate Tech Profiles**:
   - **Web (Next.js App Router)**: RSC-first data fetching, leaf `"use client"` boundaries, Server Actions (`useActionState`, `useOptimistic`), `next/link`, `next/image`, Tailwind CSS tokens, CVA variants.
   - **Mobile (React Native / Expo)**: React Native Paper primitives, NativeWind `className` styling, React Navigation with strict TypeScript param lists, UI-thread animations via `react-native-reanimated` v3 & `GestureHandler`, and `react-native-mmkv` / AsyncStorage.
   - **Data Management**: TanStack Query (3-layer data flow), Redux Toolkit (mobile session/global state), or RSC Server Actions.

---

## 2. Golden Architectural Rules for Primitives & Styling (@/component/ui)

> [!IMPORTANT]
> **Mandatory AI Agent Rule (Anti-Amnesia Mandate - Đặc biệt dành cho Gemini/AI)**:
> AI coding assistants frequently forget to use `@/component/ui` and fall back to naked HTML tags (`<button>`, `<input>`) or naked `<div>`s, or import raw third-party libraries (`antd`) directly.
> **RULE #1 OF UI CODING: ALWAYS check and prioritize `@/component/ui` (or `src/component/ui/`) before writing any UI or JSX code.**

### 1. Generality & Maximum Flexibility (Không Dùng Riêng Cho Bất Kỳ Màn Hình Nào)
- Primitives in `@/component/ui` are **system-wide generic primitives**. They must **NEVER** be bound, hardcoded, or scoped exclusively to a specific screen, page, or domain feature.
- Any feature or screen that finds a primitive suitable and reasonable to use **must be able to use it freely**.
- **No Rigid Hardcoding (Tránh Áp Cứng)**: If a primitive is missing a variant, size, layout prop, or slot needed by a new feature:
  - ❌ **DO NOT** hardcode screen-specific logic or one-off styles into the primitive.
  - ❌ **DO NOT** force it with a massive string of ad-hoc override classes at the call site.
  - ✅ **DO proactively extend and upgrade the primitive in `@/component/ui`**: Add a clean, generic CVA variant (e.g. `intent="link"`, `scale="xs"`, `variant="ghost"`) or flexible prop so all existing and future features can reuse it cleanly.

### 2. Strict Ban on Overusing `!` (Important) in Tailwind / Styling
- **Hạn chế tối đa dấu `!` (`!important`)**: Avoid utility classes like `!p-0`, `!h-auto`, `!text-xs`, `hover:!text-blue-700`, `!bg-...`. Overuse of `!` destroys the CSS cascade, breaks component encapsulation, and causes maintenance nightmares.
- **Natural, Accessible Alternatives**:
  1. **CVA Variants**: Define semantic variants in the primitive (`intent="link"`, `scale="xs"`, `variant="unstyled"`).
  2. **Theme & Component Tokens**: Leverage Ant Design's `ConfigProvider` tokens, theme config, or CSS variables.
  3. **Standard Specificity & Merging**: Rely on natural CSS inheritance and `cn(...)` (`clsx` + `twMerge`).
  4. Use `!` **ONLY** as an absolute last resort when fighting intractable third-party CSS specificity clashes.

### 3. Class Accumulation Threshold (Refactoring Trigger)
- When a `<div>` or component accumulates too many ad-hoc Tailwind classes (e.g. 6+ utility classes or long override strings like `className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-100..."`), **this is an architectural code smell**.
- **Required Action**:
  - Propose and execute an upgrade: Upgrade the component in `@/component/ui` with a new CVA variant (e.g. `variant="elevated"`, `size="compact"`), or create/use a dedicated layout primitive (`Flex`, `Surface`, `Container`).
  - Keep feature JSX declarative, readable, and clean.

### 4. Permissible Use of `<div>` (Chỉ Dùng Khi Component Khác Không Làm Được)
- Thẻ `<div>` vẫn được phép sử dụng, **NHƯNG CHỈ TRONG TRƯỜNG HỢP** các layout/structural components (`Flex`, `Card`, `Container`, `Space`, `Grid`, `Box`, etc.) không thể đáp ứng được yêu cầu kỹ thuật đặc thù (như ref container để đo đạc DOM, canvas/SVG mount slot, hoặc DOM wrapper kỹ thuật thuần túy).
- **Tuyệt đối không dùng `<div>` tùy tiện** làm flex container, wrapper hay spacer khi đã có các component chuyên trách.

---

## 3. Component Composition: Custom Primitives First

To eliminate layout bloat while avoiding excessive boilerplate:

### Web Track
1. **Custom Primitives as Primary Building Blocks (`Button`, `Card`, `Badge`, `Flex`, `Stack`, `Container`)**:
   - If missing from `src/components/ui/`, **install via `shadcn add` or create immediately**.
   - Enforce design system tokens, CVA variants (`variant="glass"`, `size="lg"`), and accessible focus states.
2. **Native Semantic HTML5 Integration**:
   - Leverage polymorphic primitives (`asChild` or `as="section"`) to output semantic HTML5 tags without wrapper bloat.
   - Do NOT wrap every paragraph in `<Text>` or division in `<Box>` if a semantic HTML5 tag is cleaner.

### Mobile Track
1. **React Native Paper Primitives as Primary Building Blocks**:
   - Use `Paper.Button`, `Paper.Card`, `Paper.TextInput`, `Paper.Dialog`, `Paper.Chip`, `Paper.Menu`, etc. wrapped in `src/components/ui/` with NativeWind classes.
   - ⚠️ **Strict Mobile Rule**: All text strings MUST be wrapped inside `<Text>` or `Paper.Text`. Placing bare strings inside `<View>` will CRASH the mobile app instantly.
   - ⚠️ **List Performance Rule**: Long lists must use `<FlatList>` or `@shopify/flash-list` (never `.map()` inside `<ScrollView>`).
2. **Semantic Intent Over Physical Colors**:
   - Never name variants or color tokens after physical colors (`red`, `blue`, `slate`). Always use semantic intent: `primary`, `secondary`, `brand`, `destructive`, `warning`, `muted`.

---

## 4. Required Engineering Workflow

1. **Breakdown & Inventory**: Identify all UI elements and interactive primitives required for the feature (e.g. `dialog`, `select`, `tabs`, `avatar`, `card`).
2. **Obtain or Adapt Primitives**:
   - **For Web**: Check `src/components/ui/`. If missing, run:
     ```bash
     pnpm dlx shadcn@latest add <component-name> -y
     ```
   - **For Mobile**: Check `src/components/ui/` (or `src/components/`). Wrap the corresponding **React Native Paper** component with **NativeWind** classes and semantic CVA variants (see [references/react-native-boundaries.md](references/react-native-boundaries.md)).
3. **Adapt Visual Tokens & CVA Variants**: Customize newly added primitives with project brand colors, elevation/shadows, and variant options.
4. **Compose Feature Cleanly**: Build feature components using these adapted primitives as primary blocks, keeping domain logic isolated from UI presentation.
5. **Verify**: Run type checks, linters, accessibility reviews, and the automated architecture verification script:
   ```bash
   node .agents/skills/frontend-clean-architecture/scripts/verify-architecture.mjs src
   ```

---

## 5. Reference Routing

> [!IMPORTANT]
> **Token-Efficiency Mandate**: Read ONLY the ONE specific reference file matching the current task scope.

- **React Native & Mobile UI Boundaries (React Native Paper + NativeWind)**: [references/react-native-boundaries.md](references/react-native-boundaries.md)
- **Module Boundaries & Dependency Direction**: [references/architecture-boundaries.md](references/architecture-boundaries.md)
- **State, RSC Server Actions & TanStack Query**: [references/state-and-data-boundaries.md](references/state-and-data-boundaries.md)
- **Shared Primitives, 8-Category Catalog & CVA**: [references/shared-ui-components.md](references/shared-ui-components.md)
- **UI Motion, GPU Animations & Performance**: [references/ui-motion-and-performance.md](references/ui-motion-and-performance.md)
- **Next.js Framework Primitives (`Link`, `Image`, App Router)**: [references/nextjs-framework-primitives.md](references/nextjs-framework-primitives.md)
- **Feature Component Structure & Sizing**: [references/feature-component-structure.md](references/feature-component-structure.md)
- **Styling Tokens & Tailwind Refactoring**: [references/styling-boundaries.md](references/styling-boundaries.md)
- **Layout, Typography & Media Primitives**: [references/layout-typography-media-primitives.md](references/layout-typography-media-primitives.md)
- **Folder Shapes & Proportionate Examples**: [references/organization-examples.md](references/organization-examples.md)
- **Rendering & Interaction Boundaries**: [references/frontend-boundaries.md](references/frontend-boundaries.md)
- **Quality Gates & Architecture Verification**: [references/quality-gates.md](references/quality-gates.md)
