"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  BankOutlined,
  DollarOutlined,
  FileDoneOutlined,
} from "@ant-design/icons";
import { Spin, Tabs } from "@/components/ui";
import { FeedbackBar, ModuleTabLabel } from "@/components/workspace";
import { FINANCE_TAB_LABELS } from "../constants/finance-labels";
import { useFinanceSettlement } from "../hooks/useFinanceSettlement";
import type {
  Disbursement,
  DisbursementPrefill,
  DisbursementStatusFilter,
  FinanceTabKey,
} from "../types/finance.types";
import CapitalPlanTab from "./CapitalPlanTab";
import DisbursementModal from "./DisbursementModal";
import DisbursementTab from "./DisbursementTab";
import TreasurySettlementTab from "./TreasurySettlementTab";

type DisbursementModalState =
  | { mode: "closed" }
  | { mode: "create"; prefill?: DisbursementPrefill }
  | { mode: "edit"; disbursement: Disbursement };

export default function FinanceSettlementScreen() {
  const controller = useFinanceSettlement();
  const { rolePermissions } = controller;

  const [activeTab, setActiveTab] = useState<FinanceTabKey | null>(null);
  const [statusFilter, setStatusFilter] = useState<DisbursementStatusFilter>("ALL");
  const [modal, setModal] = useState<DisbursementModalState>({ mode: "closed" });

  const rejectedCount = useMemo(
    () => controller.visibleDisbursements.filter((item) => item.status === "REJECTED").length,
    [controller.visibleDisbursements],
  );

  // Khởi tạo bộ lọc giải ngân mặc định phù hợp nhất với vai trò đăng nhập
  useEffect(() => {
    if (rolePermissions.roleCode === "CHIEF_ACCOUNTANT") {
      setStatusFilter("PENDING_CHIEF");
    } else if (rolePermissions.roleCode === "ADMIN") {
      setStatusFilter("PENDING_DIRECTOR");
    } else if (rolePermissions.roleCode === "ACCOUNTANT") {
      setStatusFilter(rejectedCount > 0 ? "REJECTED" : "ALL");
    } else {
      setStatusFilter("ALL");
    }
  }, [rolePermissions.roleCode, rejectedCount]);

  if (controller.loading) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center">
        <Spin size="large" description="Đang tải dữ liệu tài chính..." />
      </section>
    );
  }

  const currentTab = activeTab ?? rolePermissions.defaultTab;

  const openModal = (state: DisbursementModalState) => {
    if (state.mode === "create" && !rolePermissions.canCreateDisbursement) {
      return;
    }
    controller.clearFeedback();
    setModal(state);
  };

  const tabItems: {
    key: FinanceTabKey;
    icon: ReactNode;
    content: ReactNode;
  }[] = [
    {
      key: "disbursement",
      icon: <DollarOutlined />,
      content: (
        <DisbursementTab
          controller={controller}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onEditDisbursement={(disbursement) => openModal({ mode: "edit", disbursement })}
          onCreateDisbursement={() => openModal({ mode: "create" })}
        />
      ),
    },
    {
      key: "capital",
      icon: <BankOutlined />,
      content: <CapitalPlanTab controller={controller} />,
    },
    {
      key: "settlement",
      icon: <FileDoneOutlined />,
      content: <TreasurySettlementTab controller={controller} />,
    },
  ];

  return (
    <div className="w-full max-w-[2560px] mx-auto flex flex-col gap-4">
      {controller.feedback && (
        <FeedbackBar
          type={controller.feedback.type}
          text={controller.feedback.text}
          onClose={controller.clearFeedback}
        />
      )}

      {/* CÁC PHÂN HỆ TAB TÀI CHÍNH (Segmented Pill Tabs phong cách hiện đại, siêu mượt, không giật lag) */}
      <section id="finance-tabs" className="scroll-mt-4">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-100/80 p-1.5 shadow-2xs">
          {tabItems.map((item) => {
            const isActive = currentTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`relative flex items-center gap-2.5 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer select-none ${
                  isActive
                    ? "bg-[#007A78] text-white shadow-sm font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <span className={`text-base leading-none transition-colors ${isActive ? "text-white" : "text-slate-500"}`}>
                  {item.icon}
                </span>
                <span className="whitespace-nowrap tracking-wide">
                  {FINANCE_TAB_LABELS[item.key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Nội dung tương ứng của tab đang chọn */}
        <div>
          {tabItems.find((item) => item.key === currentTab)?.content}
        </div>
      </section>

      {modal.mode !== "closed" && (
        <DisbursementModal
          open
          projects={controller.data.projects}
          contracts={controller.data.contracts}
          treasuryAccounts={controller.data.treasuryAccounts}
          editingDisbursement={modal.mode === "edit" ? modal.disbursement : null}
          prefill={modal.mode === "create" ? modal.prefill : null}
          errorText={controller.feedback?.type === "error" ? controller.feedback.text : undefined}
          onClose={() => setModal({ mode: "closed" })}
          onCreate={controller.createDisbursement}
          onUpdate={controller.updateDisbursement}
        />
      )}
    </div>
  );
}
