# M4 Finance & Settlement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive mock-backed M4 finance and settlement screen whose data boundary can later be replaced by a backend API.

**Architecture:** Keep the App Router page as a thin server entry and place interactive state in a client feature controller. Domain types, pure business rules, mock fixtures, and a repository contract remain separate from presentational components so an API repository can replace the mock without changing the UI.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Ant Design primitives wrapped by `@/components/ui`, Tailwind CSS 4, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-16-finance-settlement-design.md`

## Global Constraints

- Use the existing `src/components/ui` primitives instead of importing Ant Design directly in feature components.
- Keep all displayed monetary values in billions of VND with up to three decimal places.
- Enforce the approval order Accountant → Chief Accountant → Director.
- Keep mock fixtures outside presentation components and access them through the finance repository contract.
- Preserve the existing `/finance-settlement` route and thin Server Component page.
- Do not add backend persistence or real file upload in this iteration.

---

### Task 1: Domain model and business rules

**Files:**
- Create: `src/features/finance-settlement/types/finance.types.ts`
- Create: `src/features/finance-settlement/utils/finance-rules.ts`
- Create: `tests/finance-rules.test.mjs`

**Interfaces:**
- Produces: finance entities, status unions, `formatVndBillions`, `getContractUsagePercent`, `getWorkingDaysUntil`, `validateDisbursement`, and `canCompleteSettlementStep`.

- [ ] Write Node tests covering currency formatting, the 95% warning threshold, contract/project limits, mandatory evidence, working-day due dates, and sequential settlement steps.
- [ ] Run `node --test tests/finance-rules.test.mjs` and confirm it fails because the implementation is absent.
- [ ] Implement the minimum pure types and rule functions required by the tests.
- [ ] Run `node --test tests/finance-rules.test.mjs` and confirm all tests pass.

### Task 2: Mock repository boundary

**Files:**
- Create: `src/features/finance-settlement/constants/finance-mock-data.ts`
- Create: `src/features/finance-settlement/services/finance.repository.ts`
- Create: `src/features/finance-settlement/services/mock-finance.repository.ts`
- Create: `src/features/finance-settlement/hooks/useFinanceSettlement.ts`

**Interfaces:**
- Consumes: domain entities and validators from Task 1.
- Produces: `FinanceRepository` query/mutation contract, `mockFinanceRepository`, and `useFinanceSettlement()` controller state/actions.

- [ ] Define realistic linked mock projects, contracts, treasury accounts, capital plans, disbursements, and settlements.
- [ ] Implement an asynchronous in-memory repository with list/create/adjust/approve/advance methods.
- [ ] Implement the controller hook with global year/project filters, derived KPIs, alerts, loading state, and mutation feedback.
- [ ] Run `npx tsc --noEmit` and resolve type errors introduced by the data layer.

### Task 3: Finance dashboard shell and capital-plan flow

**Files:**
- Create: `src/features/finance-settlement/components/FinanceHeader.tsx`
- Create: `src/features/finance-settlement/components/FinanceKpiSection.tsx`
- Create: `src/features/finance-settlement/components/CapitalPlanTab.tsx`
- Create: `src/features/finance-settlement/components/CapitalPlanModal.tsx`
- Modify: `src/features/finance-settlement/components/FinanceSettlementScreen.tsx`

**Interfaces:**
- Consumes: controller values/actions from `useFinanceSettlement()`.
- Produces: global filters, KPI cards, due-date alert, capital-plan table, create modal, and adjustment modal.

- [ ] Build the header/filter bar, responsive KPI cards, and alert banner using existing UI primitives.
- [ ] Build the capital-plan table with totals, progress, remaining capital, and contextual adjustment actions.
- [ ] Build create/adjust forms; require an approval-document reference and mock attachment for adjustments.
- [ ] Wire actions to repository mutations and verify immediate KPI/table refresh.

### Task 4: Disbursement entry and approval flow

**Files:**
- Create: `src/features/finance-settlement/components/DisbursementTab.tsx`
- Create: `src/features/finance-settlement/components/DisbursementModal.tsx`
- Create: `src/features/finance-settlement/components/ApprovalFlow.tsx`

**Interfaces:**
- Consumes: projects, contracts, treasury accounts, validation rules, and controller mutations.
- Produces: searchable/filterable disbursement table, entry modal, threshold warnings, and ordered approval actions.

- [ ] Build the table and status filters with contract usage and payment-due indicators.
- [ ] Build the entry modal with all required fields, three-decimal validation, linked-contract limits, project limits, and mock file evidence.
- [ ] Build the three-stage approval display and allow only the next legal approval action.
- [ ] Verify invalid entries are blocked and successful mutations update rows, alerts, and KPIs.

### Task 5: Treasury settlement workflow

**Files:**
- Create: `src/features/finance-settlement/components/TreasurySettlementTab.tsx`
- Create: `src/features/finance-settlement/components/SettlementWorkflowModal.tsx`

**Interfaces:**
- Consumes: settlement records and sequential-step guard from Tasks 1–2.
- Produces: settlement overview cards/table and the five-step KBNN completion workflow.

- [ ] Build the settlement overview with current step, reconciliation values, and project status.
- [ ] Build the modal checklist for approval decision, reconciliation, KBNN closing date, M8 warranty return, and final project closure.
- [ ] Disable later steps until prior steps and their required evidence are valid.
- [ ] Confirm the final action sets the settlement and project display state to `Đã tất toán`.

### Task 6: Integration and verification

**Files:**
- Modify: `src/features/finance-settlement/components/FinanceSettlementScreen.tsx`
- Modify: `src/features/finance-settlement/index.ts`
- Modify when required for generic variants only: `src/components/ui/*`

**Interfaces:**
- Consumes: all completed feature components.
- Produces: finished `/finance-settlement` experience.

- [ ] Compose the three tabs under one controller and ensure responsive overflow behavior.
- [ ] Run `node --test tests/finance-rules.test.mjs` and confirm all domain tests pass.
- [ ] Run `npx tsc --noEmit` and resolve all errors.
- [ ] Run `npm run lint` and resolve all feature-related findings.
- [ ] Run `node .agents/skills/frontend-clean-architecture/scripts/verify-architecture.mjs src` and resolve new feature violations.
- [ ] Run `npm run build` and confirm the production route builds successfully.

