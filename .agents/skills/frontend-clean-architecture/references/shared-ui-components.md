# Shared UI and Feature-Owned Components

Read this reference only when the discovered project has shared UI primitives,
a design system, a component library, or shadcn/ui. The React, Tailwind CSS,
shadcn/ui, and CVA examples are conditional examples, not required dependencies
or a mandatory folder tree.

> **MANDATORY FIRST STEP — Detect Installed UI Library Before Writing Any Component**
> Before writing a single line of JSX, inspect `package.json` (or `package-lock.json`) to
> determine which UI library is present:
> - `antd` → **use Ant Design exclusively** for all components in that project.
> - `@shadcn/ui` / `components.json` present → **use shadcn/ui exclusively** for all components.
> - Both present → follow the **Dual-Library Coexistence Rules** section below.
> Never mix libraries unless explicitly directed. Never fall back to raw HTML
> `<div>` / `<span>` wrappers when a suitable component exists in the detected library.

## Primitive Foundations: Web (shadcn/ui) vs Mobile (React Native Paper + NativeWind)

This architecture establishes clear primitive foundations depending on the target platform:

### 1. Web Applications (shadcn/ui + Tailwind CSS)
This architecture relies on **`shadcn/ui`** as the repository-owned primitive foundation located in `@/components/ui`:

1. **Verify & Maintain shadcn/ui Setup**:
   - Inspect `components.json`, import aliases (e.g. `@/components/ui`, `@/lib/utils`), and Tailwind setup.
   - If `components.json` is missing in a supported project, initialize it immediately.
2. **On-Demand Component Installation Rule**:
   - Before building any feature, review the components required by the UI design (e.g. `button`, `card`, `dialog`, `sheet`, `select`, `dropdown-menu`, `tabs`, `input`, `avatar`, `accordion`, `tooltip`, `table`, etc.).
   - If a required component primitive is missing from `src/components/ui/`, **proactively install it using the project's package manager**:
     ```bash
     pnpm dlx shadcn@latest add <component-name> -y
     # or: npx shadcn@latest add <component-name> -y
     ```
   - For primitives not covered by shadcn CLI (such as layout containers: `Container`, `Flex`, `Stack`, `Grid`, `Box`, `Title`, `Text`), create or adapt them in `src/components/ui/` with CVA variants.
3. **Mandatory Brand Adaptation ("Không dùng Thô")**:
   - Never use components passively with plain un-adapted defaults. Customize installed primitives to reflect the project's brand design tokens, rounded corners, border colors, and CVA variant states.
4. **Preserve Public Contracts**:
   - Preserve component accessibility, keyboard navigation, slot/ref behavior (`asChild`), and class merging (`cn(...)`).

### 2. Mobile Applications (React Native Paper + NativeWind)
On Mobile (React Native / Expo), `shadcn/ui` cannot be used directly because React Native does not use web DOM elements. Instead:
- **React Native Paper** serves as the ready-to-use primitive library providing accessible MD3 equivalents (`Button`, `Card`, `Dialog`, `TextInput`, `Modal`, `Menu`, `Appbar`, `Chip`, `Snackbar`, `Portal`, `FAB`, `ActivityIndicator`, `Divider`).
- **NativeWind** provides Tailwind CSS utility styling (`className="..."`) for responsive layout, spacing, and variant styling.
- Primitives are wrapped into `src/components/ui/` to expose a clean, consistent API across features.
- See the complete mobile architecture and code examples in [react-native-boundaries.md](react-native-boundaries.md).

---

## UI Library Detection & Mandatory Usage Rule

This project **requires** one of the following two UI libraries to be installed and used.
Run detection at the start of every session:

```bash
# Detection command
node -e "const p=require('./package.json'); const d={...p.dependencies,...p.devDependencies}; console.log('antd:', !!d['antd'], '| shadcn:', !!(d['@shadcn/ui'] || require('fs').existsSync('./components.json')))"
```

### Rule A — Ant Design Project (`antd` detected)

When `antd` is present in `package.json`:

1. **Use Ant Design components as the primary source of truth** for every UI need:
   - Layout → `<Row>`, `<Col>`, `<Flex>`, `<Space>`, `<Divider>`
   - Typography → `<Typography.Title>`, `<Typography.Text>`, `<Typography.Paragraph>`
   - Inputs → `<Input>`, `<Select>`, `<Form>`, `<DatePicker>`, `<Checkbox>`, `<Switch>`, etc.
   - Feedback → `<Modal>`, `<Drawer>`, `<Alert>`, `<message>`, `<notification>`, `<Spin>`, `<Skeleton>`
   - Data display → `<Table>`, `<Card>`, `<List>`, `<Tag>`, `<Badge>`, `<Avatar>`, `<Tooltip>`
   - Navigation → `<Menu>`, `<Breadcrumb>`, `<Pagination>`, `<Steps>`, `<Tabs>`
2. **Never create a `components/ui/` folder** with hand-rolled primitives that duplicate Ant Design.
   If a wrapper is needed, wrap the Ant Design component (not a plain `<div>`).
3. **Theming**: Customize via `<ConfigProvider theme={{ token: {...} }}>` — never override Ant Design styles with inline `style={{}}` hacks or `!important` CSS.
4. **`antd` Pro Components** (`@ant-design/pro-components`) may be used for `ProTable`, `ProForm`, `ProLayout` when installed.

```tsx
// ✅ CORRECT — Ant Design project
import { Card, Flex, Typography, Button, Tag } from 'antd';

export function ProductCard({ product, onSelect }: ProductCardProps) {
  return (
    <Card
      hoverable
      actions={[
        <Button type="primary" onClick={() => onSelect(product.id)}>View</Button>
      ]}
    >
      <Flex vertical gap={8}>
        <Typography.Title level={4}>{product.name}</Typography.Title>
        <Typography.Text type="secondary">{product.formattedPrice}</Typography.Text>
        <Tag color="green">{product.status}</Tag>
      </Flex>
    </Card>
  );
}

// ❌ WRONG — raw div wrapper instead of Ant Design Flex
<div className="flex flex-col gap-2">...</div>
```

### Rule B — shadcn/ui Project (`components.json` or `@shadcn/ui` detected)

When `components.json` is present or `@shadcn/ui` appears in `package.json`:

1. **Use shadcn/ui components** installed in `src/components/ui/` (or the alias configured in `components.json`).
2. **On-demand installation**: Before writing a feature, map UI needs to shadcn primitives and install missing ones:
   ```bash
   npx shadcn@latest add <component-name> -y
   # Examples: button card dialog select tabs input avatar badge table
   ```
3. **Never bypass shadcn** by creating plain `<div>` wrappers for layout. Use or create layout primitives:
   - `<Flex>`, `<Stack>`, `<Grid>`, `<Container>` in `src/components/ui/` with CVA.
4. **Mandatory Brand Adaptation**: Always extend CVA variants with project design tokens. Never use plain defaults.

### Rule C — Dual-Library Coexistence (Both Installed)

When both `antd` AND `shadcn/ui` are present:

| Responsibility | Library to use |
|---|---|
| Complex data display: `Table`, `ProTable`, `ProForm`, `Tree`, `Transfer`, `Cascader` | Ant Design |
| Typography: `Title`, `Text`, `Paragraph` | Ant Design `Typography` |
| Forms with auto-validation & schema | Ant Design `Form` / `ProForm` |
| Feedback overlays: `Modal`, `Drawer`, `Message`, `Notification` | Ant Design (for consistency with `App` context) |
| Simple atomic primitives: `Button`, `Input`, `Badge`, `Card`, `Tabs`, `Avatar` | shadcn/ui (lighter DOM output) |
| Layout containers: `Flex`, `Grid`, `Stack`, `Container` | shadcn/ui (or Ant Design `Flex`/`Row`/`Col`) |

> **Tie-breaking rule**: If both libraries offer the same primitive, prefer **Ant Design** for
> data-heavy admin screens and prefer **shadcn/ui** for marketing/landing/lightweight pages.

---

## Zero Naked `<div>` / `<span>` Policy

This is a **hard rule** enforced on every component, feature screen, and layout.

### What Is a "Naked Div"?

A naked `<div>` (or `<span>`) is any element whose **sole purpose** is:
- wrapping children for layout (flexbox, grid, spacing)
- providing a visual container (background, border, padding)
- grouping siblings without semantic meaning

…when an appropriate component from the detected library already handles that purpose.

### Forbidden Patterns

```tsx
// ❌ FORBIDDEN — naked div for flex layout (use <Flex> or Ant Design <Flex>)
<div className="flex items-center gap-4">
  <Avatar />
  <Typography.Text>Name</Typography.Text>
</div>

// ❌ FORBIDDEN — naked div as visual card (use <Card>)
<div className="bg-white rounded-xl shadow p-6">
  <h3>Title</h3>
  <p>Content</p>
</div>

// ❌ FORBIDDEN — naked div as spacing wrapper (use <Space> or gap on parent)
<div className="mt-4 mb-8">
  <Button>Submit</Button>
</div>

// ❌ FORBIDDEN — creating components/ui/MyCard.tsx that just wraps <div> 
// when Card already exists in antd or shadcn
export function MyCard({ children }) {
  return <div className="card-wrapper">{children}</div>; // NO
}
```

### Required Replacements by Library

| Intent | ❌ Naked Div | ✅ Ant Design | ✅ shadcn/ui |
|---|---|---|---|
| Flex row | `<div className="flex gap-2">` | `<Flex gap={8}>` | `<Flex>` (CVA primitive) |
| Vertical stack | `<div className="flex flex-col gap-4">` | `<Flex vertical gap={16}>` | `<Stack gap="md">` |
| Grid | `<div className="grid grid-cols-3">` | `<Row gutter={16}><Col span={8}>` | `<Grid cols={3}>` |
| Card container | `<div className="bg-white p-6 rounded">` | `<Card>` | `<Card>` |
| Page spacing | `<div className="p-8">` | `<App>` / layout padding | `<Container>` |
| Inline text | `<span className="text-red-500">` | `<Typography.Text type="danger">` | `<Text variant="destructive">` |
| Section heading | `<h2 className="text-xl font-bold">` | `<Typography.Title level={2}>` | `<Title level={2}>` |
| Separator | `<div className="h-px bg-gray-200">` | `<Divider>` | `<Separator>` |
| Badge/tag | `<span className="badge">` | `<Tag>` / `<Badge>` | `<Badge>` |

### When a `<div>` IS Allowed

A plain `<div>` (or other HTML element) is **only** acceptable when:

1. **Semantic HTML5** is the right choice: `<section>`, `<article>`, `<main>`, `<header>`,
   `<footer>`, `<nav>`, `<aside>`, `<ul>/<li>` — use these directly for content semantics.
2. **No layout primitive exists or can solve the specific technical need** (e.g., a raw DOM ref container for a measurement observer/resize sensor, canvas/SVG mount slot, portal target, or unique CSS `position: sticky` scroll container with no semantic meaning).
3. **Polymorphic rendering** via `asChild` or `as` prop on an existing primitive:
   ```tsx
   // ✅ OK — Button renders as <a> via asChild, no extra div
   <Button asChild><Link href="/">Home</Link></Button>
   ```
4. **Strict Rule**: Never use `<div>` simply as a convenient flexbox wrapper or spacing container when `<Flex>`, `<Space>`, `<Card>`, or `<Container>` already exists.

---

## The Unified Design System Foundation Layer (`@/component/ui`)

> [!IMPORTANT]
> **MANDATORY PRIORITY FOR AI AGENTS (Gemini / AI Coding Assistants)**:
> AI agents frequently forget to use `@/component/ui` and default to raw HTML tags (`<button>`, `<input>`) or naked `<div>`s, or import raw third-party libraries (`antd`) directly.
> **RULE #1 OF UI CODING: ALWAYS inspect and prioritize `@/component/ui` (or `src/component/ui/`) before writing any UI or JSX code.**

### 1. Generality & Maximum Flexibility (Không Dùng Riêng Cho Bất Kỳ Màn Hình Nào)
- Primitives inside `@/component/ui` are **universal, screen-agnostic design system primitives**.
- They must **NEVER** be bound, hardcoded, or scoped exclusively to a single screen, page, or feature.
- Any screen or feature that finds a primitive suitable and reasonable to use **must be able to use it freely**.
- **No Rigid Hardcoding (Tránh Áp Cứng)**:
  - If a primitive is missing a variant, size, layout prop, or slot required by a new screen:
    - ❌ **DO NOT** hardcode screen-specific logic or one-off styles into the primitive.
    - ❌ **DO NOT** force it with a massive chain of inline override classes at the call site.
    - ✅ **DO proactively extend and upgrade the primitive in `@/component/ui`**: Add a clean, generic CVA variant (e.g. `intent="link"`, `scale="xs"`, `variant="ghost"`) or flexible prop so all existing and future features can reuse it cleanly.

### 2. Strict Ban on Overusing `!` (Important) in Tailwind / Styling
- **Hạn chế tối đa dấu `!` (`!important`)**: Avoid utility classes like `!p-0`, `!h-auto`, `!text-xs`, `hover:!text-blue-700`, `!bg-...`. Overuse of `!` destroys the CSS cascade, breaks component encapsulation, and causes maintenance nightmares.
- **Natural, Accessible Alternatives**:
  1. **CVA Variants**: Define semantic variants in the primitive (`intent="link"`, `scale="xs"`, `variant="unstyled"`).
  2. **Theme & Component Tokens**: Leverage Ant Design's `ConfigProvider` tokens, theme config, or CSS variables.
  3. **Standard Specificity & Merging**: Rely on natural CSS inheritance and `cn(...)` (`clsx` + `twMerge`).
  4. Use `!` **ONLY** as an absolute last resort when fighting intractable third-party CSS specificity clashes.

### 3. Class Accumulation Threshold (Refactoring Trigger)
- When a `<div>` or component accumulates too many ad-hoc Tailwind classes (e.g. 5-8+ utility classes or long override strings like `className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-100..."`), **this is an architectural code smell**.
- **Required Action**:
  - Propose and execute an upgrade: Upgrade the component in `@/component/ui` with a new CVA variant (e.g. `variant="elevated"`, `size="compact"`), or create/use a dedicated layout primitive (`Flex`, `Surface`, `Container`).
  - Keep feature JSX declarative, readable, and clean.

---

## Three Ownership Levels

| Level | Owns | May know about | Must not know about |
| --- | --- | --- | --- |
| Shared primitive | Basic interaction and visual contract, such as Button, Input, Dialog, Card | Generic intent, emphasis, size, state, accessibility, design tokens | A page, campaign, customer, product workflow, feature data, or business rule |
| Shared composite | A domain-neutral composition reused by multiple unrelated features | Shared primitives and generic application concepts | One feature's copy, data model, or workflow rule |
| Feature-owned component | A screen, workflow, or business-specific composition | Its feature model, copy, rules, and shared UI | Private internals of another feature |

The default dependency direction is:

```text
feature component -> shared composite -> shared primitive
```

Never reverse it. A primitive may expose a general capability that a feature
needs, but it must not import the feature to obtain that capability.

## What Belongs in a Shared Primitive

A shared primitive may own:

- accessible interaction behavior and focus handling;
- general visual variants such as `default`, `secondary`, `outline`, `ghost`,
  or `destructive`;
- general sizes and states such as `sm`, `md`, `lg`, disabled, loading, invalid,
  selected, or expanded when those states are meaningful for that primitive;
- semantic design-token usage;
- ref, slot, polymorphic, or composition support already established by the
  project;
- fixes and improvements that benefit every consumer of the primitive.

A shared primitive must not own:

- variants named after pages, routes, campaigns, customers, products, or
  workflows;
- business copy, analytics events, navigation destinations, permissions, data
  fetching, or feature state;
- layout assumptions that only make sense in one surrounding section;
- imports from a feature module.

Do not make a primitive "more reusable" by adding every consumer exception as
a prop. A small general API plus composition is usually a cleaner boundary.

## shadcn/ui Is Source, Not a Business Layer

When the discovered project uses shadcn/ui:

- Keep generated or adapted primitives in the directory configured for shared
  UI. Treat that code as owned by the repository and review it like any other
  source code.
- It is valid to modify a primitive for a general design-system rule,
  accessibility fix, or generic variant needed by several consumers.
- Do not place feature-specific variants in the shared shadcn primitive merely
  because editing that file is convenient.
- Compose or wrap the primitive inside the owning feature for business-specific
  appearance or behavior.
- Preserve the primitive's established public contract, including class-name
  merging, refs, slot behavior, keyboard behavior, and accessibility semantics.

The directory name is not the boundary by itself. Ownership and dependency
direction determine the boundary. Use the aliases and folders discovered in the
project instead of forcing `components/ui` or `features` onto every repository.

## Visual / Figma / Screenshot Analysis Protocol

Before designing any feature, writing code, or rendering UI from **Figma links, images, or visual mockups**:

1. **Perform Element Breakdown**: Inspect the design visually and break down regions into distinct UI roles (Header, Navigation, Form Input, Dropdown Select, Filter Chip, Metric Card, Modal, Timeline, etc.).
2. **Catalog Primitive Mapping**: Map identified interactive and recurrent elements to their corresponding primitive from the **8-Category Component Catalog** below.
3. **Check & Adapt with "Custom Primitives First" Priority**:
   - **Priority 1 (Custom Primitives First)**: Always prioritize project-tailored custom primitives (`Button`, `Card`, `Badge`, `Flex`, `Stack`, `Grid`, `Container`, `Select`, `Modal`) as the primary building blocks. If a primitive is missing, adapt or create it in `src/components/ui/` with project design tokens and CVA variants to enforce UI consistency and centralized styling.
   - **Priority 2 (Semantic HTML5 Integration & Anti-Wrapper-Soup)**: Combine primitives with native semantic HTML5 tags (`<section>`, `<article>`, `<main>`, `<p>`, `<nav>`, `<ul>`, `<li>`), ideally via polymorphic rendering (`asChild` or `as="..."`). Use semantic tags directly for simple layouts and content prose instead of artificially wrapping every text in `<Span>` or every division in `<Box>` ("Box/Span soup").
4. **Compose Screen Cleanly**:
   - Assemble features using adapted primitives as the primary structural frame.
   - Maintain clean DOM output by avoiding nested unnecessary wrappers.

---

## Complete 8-Category Component Catalog (Ant Design & shadcn/ui Mapping)

To maximize component reusability and eliminate generic `<div>` soup, every UI element must map to one of these 8 standardized component categories:

### 1. General — Basic Components
- **`Button`**: Main action buttons (Variants: `default`, `glass`, `gradient`, `destructive`, `ghost`).
- **`FloatButton`**: Floating action buttons (Back-to-top, quick action triggers).
- **`Icon`**: Standardized Lucide or project SVG icon wrappers.
- **`Typography`**:
  - `Typography.Title` (`Title`): H1-H5 document headings with gradient and typographic variants.
  - `Typography.Text` (`Text`): Standardized span/text with muted, bold, or accent variants.
  - `Typography.Paragraph` (`Paragraph`): Multi-line paragraph prose.
  - `Typography.Link` (`Link`): Styled inline links with hover effects.

### 2. Layout — Structural & Grid Boundaries
- **`Divider`** (`Separator`): Horizontal/vertical line dividers (`orientation="vertical"`).
- **`Flex`**: 1-dimensional flexbox container owning alignment, distribution, and gap.
- **`Grid`**: 2-dimensional responsive grid layout.
- **`Layout`** (`Header`, `Footer`, `Sider`, `Content`): Top-level application layout shell.
- **`Masonry`**: Staggered grid layout for cards and media items.
- **`Space`**: Standardized spacing wrapper between inline/block components.
- **`Splitter`** (`ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle`): Resizable multi-pane panels.

### 3. Navigation — Page & Workflow Routing
- **`Anchor`**: In-page anchor navigation links.
- **`Breadcrumb`** (`BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`): Navigation hierarchy paths.
- **`Dropdown`** (`DropdownMenu`): Contextual action dropdowns.
- **`Menu`** (`NavigationMenu`): Main header/sidebar menu system.
- **`Pagination`**: Page navigation controls for lists and tables.
- **`Steps`**: Multi-step process indicators and step wizard headers.
- **`Tabs`** (`TabsList`, `TabsTrigger`, `TabsContent`): Tabbed content switcher.

### 4. Data Entry — Inputs, Selects & Forms
- **`AutoComplete`**: Input with dynamic autocomplete suggestions.
- **`Cascader`**: Multi-level cascading select dropdown.
- **`Checkbox`**: Boolean checkbox toggle.
- **`ColorPicker`**: Color selection palette input.
- **`DatePicker`**: Date selection grid and popover.
- **`Form`** (`FormField`, `FormItem`, `FormLabel`, `FormControl`): Form state and validation wrapper.
- **`Input`**: Single-line text input with icon slot and focus ring.
- **`InputNumber`**: Formatted numeric stepper input.
- **`Mentions`**: Input supporting `@user` or `#tag` mentions.
- **`Radio`** (`RadioGroup`, `RadioGroupItem`): Single-choice option group.
- **`Rate`**: Star rating input component.
- **`Select`** (`SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`): Custom dropdown select with option styling.
- **`Slider`**: Range slider input.
- **`Switch`**: Toggle switch.
- **`TimePicker`**: Time picker input.
- **`Transfer`**: Dual-list transfer selector.
- **`TreeSelect`**: Tree-structured select dropdown.
- **`Upload`**: File drag-and-drop upload zone.

### 5. Data Display — Cards, Lists & Information Visuals
- **`Avatar`** (`AvatarImage`, `AvatarFallback`): User avatar and circular image badge.
- **`Badge`**: Status badge, counter pill, and tag label.
- **`Calendar`**: Full-page calendar view.
- **`Card`** (`CardHeader`, `CardTitle`, `CardContent`, `CardFooter`): Glassmorphism and glow cards.
- **`Carousel`** (`CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext`): Sliders and image carousels.
- **`Collapse`** (`Accordion`, `AccordionItem`, `AccordionTrigger`): Accordion expandable panels.
- **`Descriptions`**: Key-value metadata display grid.
- **`Empty`**: Empty state placeholder graphic and copy.
- **`Image`**: Framework-optimized content image with preview overlay.
- **`List` / `Listy`**: Standardized item list container.
- **`Popover`** (`PopoverTrigger`, `PopoverContent`): Interactive floating popover panel.
- **`QRCode`**: QR Code generator component.
- **`Segmented`** (`ToggleGroup`): Segmented control button group.
- **`Statistic`**: Metric card displaying big numbers and KPI trends.
- **`Table`** (`TableHeader`, `TableBody`, `TableRow`, `TableCell`): Data grid table.
- **`Tag`**: Category and filter tag chip.
- **`Timeline`**: Vertical/horizontal event timeline.
- **`Tooltip`**: Floating hover tooltip.
- **`Tour`**: Step-by-step user onboarding tour.
- **`Tree`**: Hierarchical tree viewer.

### 6. Feedback — Overlays, Alerts & Status
- **`Alert`**: Inline alert banner (Info, Success, Warning, Error).
- **`Drawer`** (`Sheet`): Slide-over side panel or bottom drawer.
- **`Message`**: Lightweight floating status message.
- **`Modal`** (`Dialog`, `DialogContent`, `DialogHeader`): Center modal dialog popup.
- **`Notification`** (`Sonner` / `Toast`): Toast push notification.
- **`Popconfirm`** (`AlertDialog`): Destructive action confirmation popup.
- **`Progress`**: Linear/circular progress loading bar.
- **`Result`**: Full-page operation result status (Success, 404, 500).
- **`Skeleton`**: Skeleton shimmer loading placeholder.
- **`Spin`**: Loading spinner indicator.
- **`Watermark`**: Background watermark overlay.

### 7. Other & Utilities
- **`Affix`**: Sticky container fixed to scroll position.
- **`App`**: App-level context provider shell.
- **`BorderBeam`**: Animated glowing border effect component.
- **`ConfigProvider`**: Global theme configuration provider.
- **`Util`**: Helper utilities.

### 8. Pro Components — ERP / Admin / Dashboard Level
- **`ProLayout`**: Advanced admin dashboard shell with collapsible navigation.
- **`ProForm`**: Schema-driven multi-step form builder.
- **`ProTable`**: Advanced data grid with built-in search, column filters, and export.
- **`ProDescriptions`**: Auto-generated detailed key-value inspector.
- **`ProList`**: Advanced item list with batch selection.
- **`EditableProTable`**: Inline editable data grid table.

---

### Core Guidance: Adapt Before Passive Use & Prioritize Custom Primitives Pragmatically

1. **Priority 1: Custom Primitives as Primary Building Blocks**:
   - Always prioritize project-tailored custom primitives (`Button`, `Card`, `Badge`, `Flex`, `Stack`, `Grid`, `Container`, `Title`, `Text`, `FormItem`, etc.) over generic raw markup.
   - Custom primitives guarantee design-token alignment, CVA variant scalability, accessible focus rings, and single-point styling updates across the entire application.
   - Never use external libraries passively out-of-the-box ("Cài vô là sài"); always adapt visual tokens, radius, and variants to the project's brand design system.
2. **Priority 2: Semantic HTML5 Support Without "Box/Span Soup"**:
   - Leverage polymorphic rendering (`as="section"`, `as="nav"`, `as="ul"` or `asChild`) on custom primitives so the final DOM output remains 100% semantic HTML5.
   - For simple prose paragraphs or straightforward one-off content where design variants are unnecessary, use standard HTML5 tags (`<p>`, `<ul>/<li>`) directly with utility classes rather than artificially wrapping everything in a custom `<Box>` or `<Span>`.

## Tailwind Abstraction & Primitive Adaptation Policy ("Không dùng Thô - Phải Biến đổi & Tái sử dụng")

A core strength of this architecture skill is that **UI primitives are never treated as rigid, static "out-of-the-box" components**. Installing shadcn/ui or creating Ant Design-like primitives (`Container`, `Flex`, `Stack`, `Grid`, `Box`, `Title`, `Text`, `Span`, `Image`, `AspectImage`) is only the starting point.

When building features or scaling a project, developers and AI agents must actively **identify, transform, and refactor repetitive Tailwind class clusters into project-tailored reusable abstractions**.

### Why "Out-of-the-Box" Component Usage Fails

| Passiveness (Anti-Pattern) | Active Adaptation (Pro-Pattern) |
| :--- | :--- |
| Installing shadcn/ui and using plain default styles without project brand alignment ("Cài vô là sài"). | Extending primitive `cva` definitions with project design system variants (`glass`, `gradient`, `hero`, `glow`). |
| Copy-pasting long 20-class Tailwind strings across 10 feature screens (`bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl hover:border-primary/50...`). | Extracting repetitive Tailwind clusters into centralized design system tokens or CVA variant keys. |
| Fragmented, unmaintainable visual updates (changing a border color requires editing 50 feature files). | Single-point design updates (changing a variant key in `components/ui/` updates the entire application cleanly). |
| Hand-rolling inline Tailwind styles on `<div>` wrappers instead of expanding primitive props. | Adding explicit, type-safe props and CVA variants to shared primitives (`Flex`, `Container`, `Card`, `Badge`, `Box`, `Title`, `Text`). |

### 3-Tier Tailwind Refactoring Hierarchy

When repetitive Tailwind classes appear across multiple files or within a feature, refactor them according to this hierarchy:

#### Tier 1: Project Design Tokens (`globals.css` / Tailwind Config)
Extract recurring foundational visual rules (e.g. brand gradients, glass shadows, custom color spaces, focus outlines) into CSS variables or Tailwind theme utilities.

#### Tier 2: Shared Primitive CVA Variant Extension (`src/components/ui/`)
Extend base primitive CVA definitions (`button.tsx`, `card.tsx`, `badge.tsx`, `container.tsx`, `flex.tsx`, `box.tsx`, `title.tsx`, `text.tsx`) with project-specific variant keys:

```tsx
// Example: Extending Card primitive with project-tailored visual variants
export const cardVariants = cva(
  "rounded-2xl transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground border border-border shadow-sm",
        glass: "bg-background/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20 hover:border-primary/40",
        gradient: "bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-white/10 shadow-xl",
        glow: "bg-card border border-primary/30 shadow-[0_0_30px_rgba(225,29,72,0.15)] hover:shadow-[0_0_40px_rgba(225,29,72,0.3)] hover:border-primary/60",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      }
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    }
  }
);
```

#### Tier 3: Feature-Level Primitive Composition & Variants (`src/features/...`)
When visual choices belong specifically to a business domain or single feature (e.g. `EcosystemCard`, `AdvisoryTierBadge`), wrap or compose shared primitives with feature-scoped CVA variants rather than cluttering shared UI or scattering inline Tailwind classes.

---

### Step-by-Step Tailwind Refactoring Workflow

1. **Detect Duplication**: Spot 2+ occurrences of identical or near-identical Tailwind utility strings (e.g., matching flex alignments, typography scales, glass card backgrounds, or interactive hover animations).
2. **Determine Abstraction Level**:
   - If it's a domain-agnostic visual style -> add to Tier 2 Shared Primitive CVA (`components/ui/`).
   - If it's a layout/flex pattern -> extend Tier 2 Layout Primitive (`Flex`, `Container`, `Stack`, `Box`).
   - If it's feature-specific visual choice -> create Tier 3 Feature Variant wrapper.
3. **Refactor Call Sites**: Replace long inline `className` strings with concise, type-safe variant invocation:

```tsx
// BEFORE (Tailwind Duplication & Raw Div Soup Anti-Pattern):
<div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl hover:border-rose-500/50 hover:shadow-rose-500/20 transition-all duration-300">
  <div className="flex items-center justify-between gap-4 mb-4">
    <h3 className="text-xl font-extrabold text-white">Title</h3>
    <span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold rounded-full">Active</span>
  </div>
  <p className="text-sm text-slate-400">Description content...</p>
</div>

// AFTER (Clean Architecture with Refactored Tailwind Primitives & Variants):
<Card variant="glass" glow="rose" padding="md">
  <Flex align="center" justify="between" gap="md" className="mb-4">
    <Title level={3} variant="heading">Title</Title>
    <Badge variant="glow">Active</Badge>
  </Flex>
  <Text variant="muted">Description content...</Text>
</Card>
```

---

## Best Practices for Customizing & Extending shadcn/ui Components

To use shared components effectively without breaking design consistency or re-introducing `<div>` wrappers, follow these 4 customization patterns:

### Pattern 1: Extending Variants using CVA (`class-variance-authority`)
When a primitive needs a new recurring visual style (e.g., a "glassmorphism" or "gradient" card/button), extend its `cva` definition inside `components/ui/`:

```tsx
// Inside src/components/ui/button.tsx
export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all focus-visible:outline-none disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent",
        // CUSTOM DESIGN SYSTEM VARIANTS:
        glass: "glass-panel hover:bg-white/10 text-white border-white/10",
        gradient: "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg shadow-rose-600/30 hover:scale-105",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

### Pattern 2: Override Styling at Use-Site via `cn()` Utility
Primitives use `cn()` to merge base styles with caller overrides safely. Callers pass Tailwind classes via `className` without breaking internal styles:

```tsx
// Example: Customizing Card background and border for a specific feature
<Card className="bg-slate-900/90 border-rose-500/30 shadow-xl shadow-rose-950/40">
  <CardHeader>
    <CardTitle className="text-2xl font-extrabold text-white">Custom Header</CardTitle>
    <CardDescription className="text-rose-300">Feature specific description</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Body Content */}
  </CardContent>
</Card>
```

### Pattern 3: Polymorphic Composition via `asChild` (Radix `Slot`)
Avoid wrapping primitives inside extra `<div>`s or `<a>` tags. Use `asChild` to pass styles and accessibility directly to child components:

```tsx
// RIGHT: Clean, zero-div-wrapper button link using Next.js Link
<Button asChild variant="gradient" size="lg">
  <Link href="/ecosystem">
    <span>Khám phá hệ sinh thái</span>
    <ArrowRight className="w-4 h-4 ml-2" />
  </Link>
</Button>

// WRONG (Div Soup Anti-Pattern):
<div className="btn-wrapper">
  <Link href="/ecosystem">
    <Button>Khám phá</Button>
  </Link>
</div>
```

### Pattern 4: Customizing Tab Systems (`Tabs`, `TabsList`, `TabsTrigger`)
Instead of hand-rolling custom button tabs with `<div>` states, customize shadcn/ui's `<Tabs>` compound components:

```tsx
<Tabs defaultValue="network-1" className="w-full">
  <TabsList className="bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 flex justify-center gap-2">
    <TabsTrigger 
      value="network-1" 
      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-600 data-[state=active]:to-red-600 data-[state=active]:text-white rounded-xl px-6 py-3 font-bold transition-all"
    >
      Publisher Network
    </TabsTrigger>
    <TabsTrigger 
      value="network-2" 
      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-600 data-[state=active]:to-red-600 data-[state=active]:text-white rounded-xl px-6 py-3 font-bold transition-all"
    >
      Advisory Network
    </TabsTrigger>
  </TabsList>

  <TabsContent value="network-1" className="mt-8">
    <Card>
      <CardContent className="p-6">Publisher content here...</CardContent>
    </Card>
  </TabsContent>
  <TabsContent value="network-2" className="mt-8">
    <Card>
      <CardContent className="p-6">Advisory content here...</CardContent>
    </Card>
  </TabsContent>
</Tabs>
```

---

### Customization Quick Reference Matrix

| Goal | Best Customization Technique | Example |
| :--- | :--- | :--- |
| **Thêm kiểu dáng mới dùng chung cả dự án** | Sửa `cva` definition trong `components/ui/<component>.tsx` | `variant: { glass: "glass-panel text-white" }` |
| **Ghi đè style cho 1 màn hình cụ thể** | Truyền class qua prop `className` (nhờ helper `cn()`) | `<Card className="border-rose-500/40">` |
| **Gắn style vào thẻ `Link` hoặc thẻ Semantic** | Dùng prop `asChild` | `<Button asChild><Link href="...">...</Link></Button>` |
| **Tùy biến trạng thái Active/Focus/State** | Dùng Data-Attribute Selectors Tailwind | `data-[state=active]:bg-rose-600` |

## DOM Semantics & Polymorphic Slot Pattern (`asChild` vs. `div` Soup)

A clean JSX source structure does not guarantee clean runtime HTML. Evaluate UI libraries and shared primitives by their final DOM output:

- **Ant Design vs. Radix / shadcn/ui DOM Output**:
  - Heavy UI libraries like Ant Design hide HTML tags in clean React JSX (`<Card>`, `<Table>`), but internally inject deep nested `<div>` wrappers (`div` soup) into the browser DOM. This degrades SEO, DOM tree depth, and screen-reader accessibility.
  - Headless UI libraries (such as Radix UI and shadcn/ui) leverage the `asChild` (Radix `Slot`) pattern or polymorphic `as` prop. This attaches styles and interactive logic directly to custom semantic HTML elements without creating redundant wrapper tags.

- **Mandatory Rules for DOM Efficiency**:
  1. **Mandate Semantic HTML**: Prefer `<header>`, `<footer>`, `<main>`, `<section>`, `<article>`, `<nav>`, `<aside>`, `<ol>`, `<ul>`, and `<li>` over generic `<div>` tags whenever content carries semantic meaning.
  2. **Enforce Polymorphic / Slot Support in Primitives**: Shared UI primitives (such as `Button`, `Card`, `Badge`) must support polymorphic rendering (`as="section"` or `asChild`) so parent features can define semantic tags without introducing wrapper `<div>` tags.
  3. **Forbid Styling-Only Wrapper `<div>`s**: Never create a component or wrapper `<div>` whose sole purpose is hiding a few CSS utility classes or positioning a single child.


## Reuse Threshold: Local, Feature-Owned, or Shared

Do not extract a component merely because JSX or a class string can be moved to
another file. Use this decision matrix:

| Situation | Decision |
| --- | --- |
| Feature-specific and used once, with simple markup and styling | Keep it at the use site |
| Feature-specific and repeated within the same feature or business function | Create a feature-owned component |
| Feature-specific and used once, but it owns coherent behavior, state, accessibility, or a valuable test boundary | A local feature-owned component may be justified |
| Domain-agnostic and reused by multiple independent features | Consider a shared primitive or shared composite |
| Visually similar but semantically different between features | Keep separate; visual coincidence alone is not shared ownership |

"Repeated within a feature" means the same stable feature concept appears in
multiple screens, sections, or flows owned by that feature. It does not mean
that two unrelated elements happen to share the same Tailwind classes today.

Example:

```text
CheckoutPromoBadge appears in CheckoutSummary, PaymentStep, and Confirmation
  -> create features/checkout/components/CheckoutPromoBadge

One decorated button appears only in CheckoutHero and has no special behavior
  -> compose the shared Button directly inside CheckoutHero

The same accessible Button interaction is used by many unrelated features
  -> keep that general behavior in the shared Button primitive
```

When extracting within one feature, keep the result in that feature. Do not
promote it to global shared UI until independent consumers demonstrate that its
API is genuinely domain-agnostic.

## CVA Decision Rules

Use Class Variance Authority (CVA), or the project's equivalent, only when all
of these are true:

1. The project already uses it or adding it is explicitly justified.
2. The component exposes a finite set of meaningful visual choices.
3. Callers should select those choices through a stable, type-safe public API.
4. The variants describe concepts owned by that component.

Do not use CVA merely to store one fixed class string. A one-off layout can keep
classes at the use site. A fixed component with behavior or repeated markup can
use a simple wrapper. Promote it to a variant API only after real consumers
need distinct, stable choices.

Custom component and CVA are separate decisions:

- repeated fixed feature markup may justify a component without CVA;
- one feature component with several meaningful visual choices may justify
  CVA;
- one use with one fixed style normally justifies neither a wrapper nor CVA.

## Tailwind CSS with Shared UI

Only apply these rules when the project already uses Tailwind CSS:

- Follow the installed Tailwind version and the repository's token strategy;
  do not assume configuration or syntax from another version.
- Prefer semantic token utilities such as `bg-primary` or
  `text-destructive-foreground` in primitives. Keep page-specific gradients,
  positioning, and decoration with the owning feature.
- Store complete, statically detectable class strings in a CVA definition or
  typed lookup. Do not construct utility names from fragments such as
  `` `bg-${color}-500` ``.
- Use the repository's class merge helper at a deliberate override boundary.
  Put the component's base and variant classes first and the caller's
  `className` last when the public API intentionally allows consumer overrides.
- Avoid contradictory utilities, repeated arbitrary values, and broad global
  selectors. Promote a repeated design decision into the project's token
  mechanism; keep a genuine one-off value local.
- Keep responsive layout with the component that owns that layout. A primitive
  should not know that a particular hero, checkout panel, or campaign becomes
  full width at a specific breakpoint.

Example of statically detectable choices:

```tsx
const statusClasses = {
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  error: "bg-destructive text-destructive-foreground",
} as const;
```

The semantic names and utilities above are illustrative. Reuse the tokens found
in the project instead of inventing a parallel palette.

## Example 1: Do Not Pollute the Shared Button

Bad: business and page concepts leak into a global primitive.

```tsx
// shared UI source -- avoid
const buttonVariants = cva("...", {
  variants: {
    variant: {
      default: "...",
      outline: "...",
      heroPrimary: "...",
      redCampaignBanner: "...",
      pricingCta: "...",
    },
  },
});
```

Every new page can now change the Button API. Removing a campaign also requires
editing shared UI, and unrelated consumers must understand irrelevant names.

Good: the primitive exposes only general semantics.

```tsx
// Example path only: components/ui/button.tsx
const buttonVariants = cva("...", {
  variants: {
    variant: {
      default: "bg-action text-action-foreground",
      secondary: "bg-secondary text-secondary-foreground",
      outline: "border bg-background",
      ghost: "bg-transparent",
      destructive: "bg-destructive text-destructive-foreground",
    },
    size: {
      sm: "h-8 px-3",
      md: "h-10 px-4",
      lg: "h-12 px-6",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});
```

The home feature then owns its hero-specific contract:

```tsx
// Example path only: features/home/components/hero-action-button.tsx
import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const heroActionVariants = cva(
  "rounded-full font-bold transition-transform motion-reduce:transition-none",
  {
    variants: {
      tone: {
        primary: "bg-brand text-brand-foreground hover:bg-brand/90",
        secondary: "border border-brand bg-background text-brand",
      },
      layout: {
        content: "w-auto",
        responsive: "w-full sm:w-auto",
      },
    },
    defaultVariants: {
      tone: "primary",
      layout: "content",
    },
  },
);

type HeroActionButtonProps = React.ComponentProps<typeof Button> &
  VariantProps<typeof heroActionVariants>;

export function HeroActionButton({
  className,
  tone,
  layout,
  ...props
}: HeroActionButtonProps) {
  return (
    <Button
      className={cn(heroActionVariants({ tone, layout }), className)}
      {...props}
    />
  );
}
```

This feature wrapper is appropriate when `HeroActionButton` is a stable concept
repeated within the home feature, exposes multiple feature-owned variants, or
owns coherent behavior. Repetition inside the home feature justifies a
feature-owned wrapper, not a global Button variant. If it is one button with no
behavior and no reuse, compose `Button` directly at the use site and keep the
feature classes there.

## Example 2: Compose a Business Card from Generic Parts

Keep generic structure and accessibility in the shared Card primitive. Keep
product fields, formatting, and actions in the catalog feature.

```tsx
// Example path only: features/catalog/components/product-card.tsx
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import type { ProductSummary } from "../model/product-summary";

interface ProductCardProps {
  product: ProductSummary;
  onSelect: (productId: string) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
      </CardHeader>
      <CardContent>{product.formattedPrice}</CardContent>
      <CardFooter>
        <Button type="button" onClick={() => onSelect(product.id)}>
          View product
        </Button>
      </CardFooter>
    </Card>
  );
}
```

`Card` does not gain `product`, `price`, `campaign`, or `onAddToCart` props. The
feature composes it. In a real project, use the discovered localization
mechanism instead of copying the illustrative text above.

## Example 3: Enforce One-Way Imports

Allowed:

```text
features/checkout/components/SubmitOrder
  -> shared/ui/Button
```

Forbidden:

```text
shared/ui/Button
  -> features/checkout/constants
  -> features/checkout/types
  -> features/checkout/styles
```

If the primitive needs a value, first ask whether it is truly generic. If yes,
express it as a general primitive contract or semantic token. If no, keep it in
the feature and pass ordinary children, event handlers, or composition at the
feature boundary.

## Placement Decision

For each component or variant, ask in order:

1. Does it represent basic UI behavior usable without knowing the product
   domain? Keep it in the shared primitive layer.
2. Is it a domain-neutral composition genuinely reused by unrelated features?
   Place it in the repository's shared-composite area.
3. Does its name, copy, layout, data, behavior, or styling refer to one feature,
   page, campaign, or workflow? If repeated within that owner, create a
   feature-owned component; otherwise continue to the next question.
4. Is it used once and simple? Keep it at the use site instead of creating a
   premature wrapper or shared abstraction.
5. Is it used once but responsible for coherent behavior, state, accessibility,
   or testing? A local feature-owned component may still be the smallest clean
   boundary.

## Review Checklist

### Library Detection & Usage
- [ ] Was `package.json` inspected to detect the installed UI library before writing code?
- [ ] Are all UI elements sourced from the detected library (Ant Design or shadcn/ui)?
- [ ] In dual-library projects, is each component assigned to the correct library per the coexistence table?
- [ ] Are new `components/ui/` wrappers documented with a justification comment?

### Zero Naked Div Policy
- [ ] Are there **zero** naked `<div>` or `<span>` wrappers whose sole purpose is layout or visual styling?
- [ ] Are semantic HTML5 tags (`<section>`, `<article>`, `<nav>`, `<ul>/<li>`) used where appropriate?
- [ ] Are `asChild` / polymorphic `as` props used to avoid wrapper divs around library components?
- [ ] Are no hand-rolled `components/ui/` wrappers created that duplicate existing library primitives?

### Architecture
- [ ] Can the shared component be understood and tested without importing a feature?
- [ ] Are primitive variants general semantics rather than consumer names?
- [ ] Does the dependency direction flow from feature to shared UI?
- [ ] Is feature behavior, copy, analytics, and data outside the primitive?
- [ ] Does each wrapper represent a stable concept rather than hiding one class string?
- [ ] Is a feature-specific component repeated within its feature, or otherwise justified by coherent behavior rather than extraction by habit?
- [ ] Was a one-off simple composition kept local?
- [ ] Is CVA used for a real finite variant matrix rather than by habit?
- [ ] Are semantic tokens preferred over repeated arbitrary values?
- [ ] Are accessibility, ref, slot, and class-merge contracts preserved?
- [ ] Were the actual repository aliases and conventions followed?
