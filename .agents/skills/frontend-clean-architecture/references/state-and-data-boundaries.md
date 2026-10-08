# State, Form, and Data Boundaries

Read this reference when defining state ownership, form validation, client/server boundaries (React Server Components), custom hooks, TanStack Query integration, data fetching adapters, or resilience/error handling within a frontend application.

---

## 1. State Classification & Ownership Hierarchy

To prevent state fragmentation and memory leaks, classify state into one of five distinct tiers. Always choose the narrowest appropriate tier:

```text
URL State > Server State > Form State > Local UI State > Global Client State
```

| State Tier | Recommended Tools | Best For | Must NOT be used for |
| :--- | :--- | :--- | :--- |
| **1. URL State** | `searchParams`, `useSearchParams`, `nuqs` | Search queries, filters, active tabs, pagination page numbers, deep-linkable modal IDs | Unsensitive temporary form inputs, security tokens |
| **2. Server State** | TanStack Query, SWR, RSC | API responses, remote data caches, background revalidation, optimistic mutations | Client-only UI toggles, temporary input values |
| **3. Form State** | React Hook Form + Zod / Valibot | Multi-input forms, validation errors, field touch states, draft inputs | Persistent global user preferences, server caches |
| **4. Local UI State** | `useState`, `useReducer` | Component-specific toggles (dropdown open, hover tooltip, local tab index) | Shared data across unrelated screens |
| **5. Global Client State** | Zustand, Jotai, React Context | Application-wide UI preferences (dark mode, sidebar expanded, active auth session) | Duplicate server API responses, huge data tables, form inputs |

### Anti-Pattern Checklist
- ❌ **Storing Server Data in Global State**: Storing fetched API lists inside Zustand/Redux instead of a Server State manager (TanStack Query/SWR) or RSC props.
- ❌ **Ignoring URL State**: Keeping page filters or tab indexes only in `useState`, preventing users from bookmarking or sharing the exact page state via URL.
- ❌ **Over-using Global State**: Placing local form inputs or component visibility flags inside global stores.

---

---

## 2. Modern Data Architecture Decision Matrix

Before implementing data fetching, determine the repository's framework and the feature's data lifecycle:

```text
                               ┌─ Static Mock / Demo ────────────> Mode C: Simple useState / Props
                               │
[ Discover Data Architecture ] ┼─ Next.js App Router / RSC ──────> Mode A: RSC Direct Fetch + Server Actions
                               │  (SEO, CRUD, Standard Forms)
                               │
                               └─ Realtime / Continuous Polling ─> Mode B: TanStack Query 3-Layer Pattern
                                  (Dynamic Widgets, SPAs, Dashboards)
```

| Mode | Technology | Primary Use Case | Architectural Boundary |
| :--- | :--- | :--- | :--- |
| **Mode A: Server Components (RSC) + Server Actions** | Next.js App Router, React 19 `useActionState`, `useOptimistic` | Standard web routes, SEO pages, content catalogs, CRUD forms | Server Component fetches data directly; Server Action mutates; Leaf Client Components handle optimistic UI |
| **Mode B: Client-side Server State** | TanStack Query, SWR | Realtime dashboards, continuous client polling, complex infinite scroll, React SPAs | 3-Layer separation: Query Keys & Zod DTO -> Domain Hook -> Pure UI |
| **Mode C: Static / Prototype** | Local `mockData.ts`, `useState` | UI prototypes, static landing pages, demo features | Direct props or local state. **NEVER over-engineer with TanStack Query or network retry logic.** |

---

### Mode A: Server Components (RSC) & Server Action Flow

When using the Next.js App Router:
1. **Fetch Directly in Server Components**: Fetch data in async Server Components (`page.tsx` or layout sections). Pass typed data down to client leaf components.
2. **Mutations via Server Actions**: Colocate server actions (`actions.ts`) with Zod validation.
3. **Form Coordination**: Use React 19 / Next.js 15 `useActionState` and `useOptimistic` in interactive client leaf components.

```tsx
// 1. Server Action (src/features/todo/actions.ts)
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

const createTodoSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

export async function createTodoAction(prevState: any, formData: FormData) {
  const parsed = createTodoSchema.safeParse({
    title: formData.get("title"),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors, success: false };
  }

  // Perform server mutation (DB or API)
  await db.todo.create({ data: { title: parsed.data.title } });
  revalidatePath("/todos");
  return { success: true };
}
```

```tsx
// 2. Client Leaf Form Component (src/features/todo/components/todo-form.tsx)
"use client";

import { useActionState } from "react";
import { createTodoAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TodoForm() {
  const [state, formAction, isPending] = useActionState(createTodoAction, null);

  return (
    <form action={formAction} className="flex gap-2">
      <Input name="title" placeholder="Add new task..." disabled={isPending} />
      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding..." : "Add"}
      </Button>
      {state?.error?.title && <p className="text-destructive text-sm">{state.error.title[0]}</p>}
    </form>
  );
}
```

---

### Mode B: Custom Hooks & TanStack Query 3-Layer Integration Architecture

When a feature requires client-side caching, background polling, or runs in a client-side SPA (Vite/CRA/Expo):

To eliminate repeated refactoring between Server Data and UI Presentation in Backend-connected applications, enforce a strict **3-Layer Separation**:

```text
[ Backend API / Endpoint ]
          │ (Raw DTO)
          ▼
[ Layer 1: Query Keys & Data Transformer ] ──> Query Key Factory, Zod Response Schema, `select` Data Mapping
          │
          ▼
[ Layer 2: Feature Domain Custom Hook ] ────> Encapsulates Queries, Mutations, Invalidation, Optimistic UI Flags
          │ (View Model & Action Handlers)
          ▼
[ Layer 3: Pure UI Component ] ────────────> Renders Shared Primitives (<Badge>, <Card>, <Button>)
```

#### Layer 1: Query Keys Factory & Data Transformer (`api/todo-queries.ts`)
- **Query Keys Factory**: Define a single `queryKeys` object to prevent string typo bugs across the application.
- **Zod Response Validation**: Parse raw API payloads through a Zod schema in `queryFn` to prevent silent UI crashes caused by unexpected API schema changes.
- **Select Transformer**: Use the `select` option in `useQuery` to transform raw server DTOs directly into UI View Models (e.g. formatted dates, semantic color variants).

```tsx
// src/features/todo/api/todo-queries.ts
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { todoApi } from "./todo-api";

// 1. Query Key Factory
export const todoKeys = {
  all: ["todos"] as const,
  lists: () => [...todoKeys.all, "list"] as const,
  list: (filters: TodoFilters) => [...todoKeys.lists(), filters] as const,
};

// 2. Strict Zod DTO Schema
const todoDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
  priority: z.enum(["High", "Medium", "Low"]),
  createdAt: z.string(),
});
const todoListDtoSchema = z.array(todoDtoSchema);

// 3. Custom Query Hook
export function useTodoListQuery(filters: TodoFilters) {
  return useQuery({
    queryKey: todoKeys.list(filters),
    queryFn: async ({ signal }) => {
      const raw = await todoApi.fetchTodos(filters, { signal });
      return todoListDtoSchema.parse(raw); // Prevents UI crashes from broken API payloads
    },
    select: (todos) =>
      todos.map((item) => ({
        id: item.id,
        title: item.title,
        isCompleted: item.completed,
        formattedDate: new Date(item.createdAt).toLocaleDateString("vi-VN"),
        // Direct mapping to semantic primitive color variants
        priorityVariant: item.priority === "High" ? "danger" : item.priority === "Medium" ? "warning" : "muted",
      })),
    staleTime: 1000 * 60 * 5,
  });
}
```

### Layer 2: Feature Domain Custom Hook (`hooks/use-todo-feature.ts`)
- **Query & Mutation Encapsulation**: Wrap TanStack `useQuery` and `useMutation`.
- **Automatic Cache Invalidation & Optimistic Updates**: Handle `queryClient.invalidateQueries` and optimistic rollbacks inside the hook.
- **Unified UI Flags**: Return clean, computed flags (`isLoading`, `isEmpty`, `isError`, `isSubmitting`).

```tsx
// src/features/todo/hooks/use-todo-feature.ts
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useTodoListQuery, todoKeys } from "../api/todo-queries";
import { todoApi } from "../api/todo-api";

export function useTodoFeature(filters: TodoFilters) {
  const queryClient = useQueryClient();
  const { data: todos = [], isLoading, isError, refetch } = useTodoListQuery(filters);

  // Optimistic Mutation Pattern
  const toggleMutation = useMutation({
    mutationFn: todoApi.toggleTodo,
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.lists() });
      const previous = queryClient.getQueryData(todoKeys.list(filters));
      queryClient.setQueryData(todoKeys.list(filters), (old: any) =>
        old?.map((t: any) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))
      );
      return { previous };
    },
    onError: (_err, _var, context) => {
      if (context?.previous) {
        queryClient.setQueryData(todoKeys.list(filters), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });

  return {
    todos,
    isLoading,
    isEmpty: !isLoading && !isError && todos.length === 0,
    isError,
    isSubmitting: toggleMutation.isPending,
    refetch,
    toggleTodo: (id: string) => toggleMutation.mutate({ id }),
  };
}
```

### Layer 3: Pure UI Presentation Component (`components/todo-feature.tsx`)
- **Zero Query Logic Leak**: UI components call `useTodoFeature()` and pass data to Shared UI Primitives (`<Card>`, `<Badge>`, `<Button>`).

```tsx
export function TodoFeature() {
  const [filters, setFilters] = useState<TodoFilters>({ priority: "ALL" });
  const { todos, isLoading, isEmpty, isError, isSubmitting, toggleTodo } = useTodoFeature(filters);

  if (isLoading) return <TodoSkeleton />;
  if (isError) return <ErrorMessage title="Không thể tải dữ liệu" />;
  if (isEmpty) return <Empty title="Chưa có công việc nào" />;

  return (
    <Stack gap="md">
      {todos.map((todo) => (
        <Card key={todo.id}>
          <Flex align="center" justify="between">
            <Text>{todo.title}</Text>
            <Badge variant={todo.priorityVariant}>{todo.formattedDate}</Badge>
            <Button disabled={isSubmitting} onClick={() => toggleTodo(todo.id)}>
              Hoàn thành
            </Button>
          </Flex>
        </Card>
      ))}
    </Stack>
  );
}
```

---

## 3. Custom Hook Architecture Invariants

Follow these strict rules for all custom hooks across the application:

1. **Single Responsibility**: Each custom hook must do ONE thing well (`useTodoFilters`, `useTodoForm`, `useTodoQuery`). Do NOT create monolithic "junk drawer" hooks.
2. **NO JSX Returns**: Custom hooks manage logic, state, side-effects, and handlers. They MUST NEVER return JSX elements or render functions (`renderModal: () => <Modal />`).
3. **Object Return Contracts**: Always return typed objects (`return { data, isLoading, actions }`) instead of positional tuples/arrays for domain hooks.
4. **Infinite Query Encapsulation**: When using `useInfiniteQuery`, wrap `fetchNextPage` and `hasNextPage` inside the hook and expose simple `hasMore` and `loadMore()` contracts to the UI.
5. **Abort Signal Forwarding**: Always pass the `signal` parameter from `queryFn` to API client HTTP calls to enable automatic request cancellation when inputs change rapidly.

---

## 4. React Server Component (RSC) & Client Boundary Rules

When working in Next.js App Router or RSC-enabled frameworks, adhere strictly to the **Leaf-Node `"use client"` Boundary Rule**:

1. **Server Components by Default**: Keep pages (`page.tsx`), section containers, and static layout wrappers as Server Components. Do not add `"use client"` at the top of a page file merely because a child component needs interactivity.
2. **Push `"use client"` to Leaf Nodes**: Wrap only the specific interactive elements (e.g. `<TodoFilterButtons>`, `<AddTodoModal>`, `<ThemeToggle>`) with `"use client"`.
3. **Data Pre-fetching & Passing**: Fetch data directly in Server Components (or via server-side queries) and pass typed, serializable props down to interactive client leaf components.

---

## 5. Form Management & Schema Validation Standard

Every form handling business data must enforce strict schema boundaries:

1. **Mandatory Validation Schema**: Define a Zod (or equivalent) schema for form data. Types should be inferred directly from the schema (`type TodoFormValues = z.infer<typeof todoSchema>`).
2. **Integration with Custom Form Primitives**: Bind React Hook Form schema validation cleanly with project-tailored `<Form>`, `<FormItem>`, `<FormLabel>`, `<Input>`, `<Select>`, `<Option>` primitives.
3. **No Unvalidated Form Payloads**: Never submit raw form event target values (`e.target.value`) directly to API adapters without passing schema validation first.

---

## 6. Resilience, Skeletons & Error Boundaries

Every feature interacting with async data must handle loading, error, and empty states gracefully:

1. **Skeleton Loading Fallbacks**: Provide custom `<Skeleton>` or `<Spin>` loading UI matching the structural layout of the feature content.
2. **Feature-Level Error Boundaries**: Wrap asynchronous features in `<ErrorBoundary>` to isolate failures. A single feature API failure must never crash the entire page layout.
3. **Explicit Empty States**: Display a dedicated `<Empty>` component with clear user guidance when no data is returned.

---

## 7. Review Checklist for State & Data

- [ ] Was the data architecture mode chosen appropriately (Mode A: RSC/Server Actions, Mode B: TanStack Query, Mode C: Local Static)?
- [ ] For Next.js App Router (Mode A): Is data fetched directly in Server Components without leaking `"use client"` to page roots?
- [ ] For Next.js App Router (Mode A): Are mutations handled via Server Actions with server-side Zod validation and `useActionState`?
- [ ] For Client State (Mode B): Is server data structured into 3 layers (Query Key Factory & Zod DTO -> Domain Hook -> Pure UI)?
- [ ] For Client State (Mode B): Does the query hook use `select` to transform server DTOs to UI View Models?
- [ ] For Static/Mock (Mode C): Did you avoid over-engineering with unnecessary query libraries or async caching layers?
- [ ] Do custom hooks avoid returning JSX elements or render functions?
- [ ] Are search, filter, and pagination states accessible via URL search params where appropriate?
- [ ] Is `"use client"` placed strictly at interactive leaf components rather than whole page entries?
- [ ] Do forms enforce a type-safe Zod validation schema before mutations?
- [ ] Does the feature include skeleton loading, error fallback, and empty state visuals?
