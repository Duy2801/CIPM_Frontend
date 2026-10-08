"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockOutlined } from "@ant-design/icons";
import { Button, Card, Flex, Spin, Text, Title } from "@/components/ui";
import { useAuthStore } from "@/stores/auth.store";
import {
  FeedbackBar,
  ReasonModal,
} from "@/components/workspace";
import { useWarrantyMaintenance } from "../hooks/useWarrantyMaintenance";
import type { Incident, WarrantyFilter, WarrantyRecord } from "../types/warranty.types";
import { getCountdown } from "../utils/warranty-rules";
import CreateWarrantyDrawer from "./CreateWarrantyDrawer";
import FixAcceptanceModal from "./FixAcceptanceModal";
import IncidentDetailDrawer from "./IncidentDetailDrawer";
import IncidentReportModal from "./IncidentReportModal";
import WarrantyDetailDrawer from "./WarrantyDetailDrawer";
import WarrantyTab from "./WarrantyTab";

type IncidentModalState = { mode: "closed" } | { mode: "report"; warrantyId?: string } | { mode: "fix"; incident: Incident };

const formatBillions = (value: number) =>
  `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 }).format(value)} tỷ`;

export default function WarrantyMaintenanceScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const controller = useWarrantyMaintenance();

  const [warrantyFilter, setWarrantyFilter] = useState<WarrantyFilter>("ALL");
  const [modal, setModal] = useState<IncidentModalState>({ mode: "closed" });
  const [forfeitId, setForfeitId] = useState<string>();
  const [detailWarrantyId, setDetailWarrantyId] = useState<string>();
  const [detailIncidentId, setDetailIncidentId] = useState<string>();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingWarranty, setEditingWarranty] = useState<WarrantyRecord | null>(null);

  if (controller.loading) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center">
        <Spin size="large" description="Đang tải dữ liệu bảo hành..." />
      </section>
    );
  }

  // Chặn truy cập nếu không có quyền theo Ma trận phân quyền BRD Mục 5
  if (!controller.permissions.canAccessModule) {
    return (
      <Flex layout="center" className="min-h-[calc(100vh-140px)] px-4">
        <Card surface="workspace" className="w-full max-w-[560px] text-center border-rose-200 shadow-md">
          <Flex vertical align="center" gap={14}>
            <Flex
              align="center"
              justify="center"
              className="h-14 w-14 rounded-full bg-rose-50 text-rose-600 text-2xl"
            >
              <LockOutlined />
            </Flex>
            <Flex vertical align="center" gap={8}>
              <Title level={4} className="!m-0 text-slate-800">
                Không có quyền truy cập phân hệ Bảo hành & Bảo trì
              </Title>
              <Text type="secondary" className="text-sm">
                Theo Ma trận phân quyền BRD Mục 5, phân hệ <strong>M8 – Bảo hành & Bảo trì</strong> chỉ dành cho <strong>Ban Giám đốc</strong> (chỉ xem), <strong>Tổ Giám sát – Kỹ thuật</strong> và <strong>Kế toán trưởng</strong> (toàn quyền thao tác). Các vai trò khác không có quyền truy cập.
              </Text>
              <div className="mt-2 text-xs text-slate-500 bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200">
                Tài khoản hiện tại: <strong className="text-slate-800">{user?.displayName ?? user?.name ?? "Chưa đăng nhập"}</strong> · Vai trò: <strong className="text-slate-800">{user?.roleName ?? user?.role ?? "Khách"}</strong>
              </div>
            </Flex>
            <Button intent="primary" onClick={() => router.push("/dashboard")}>
              Quay về Bảng điều khiển
            </Button>
          </Flex>
        </Card>
      </Flex>
    );
  }

  const modalError = controller.feedback?.type === "error" ? controller.feedback.text : undefined;
  const forfeitTarget = controller.data.warranties.find((item) => item.id === forfeitId);
  const activeWarranties = controller.warranties.filter((item) => getCountdown(item, controller.today).daysLeft >= 0);

  const openModal = (state: IncidentModalState) => {
    controller.clearFeedback();
    setModal(state);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-4">
      {controller.feedback && modal.mode === "closed" && (
        <FeedbackBar type={controller.feedback.type} text={controller.feedback.text} onClose={controller.clearFeedback} />
      )}

      {/* Hiển thị trực tiếp danh sách công trình bảo hành */}
      <section id="warranty-content" className="scroll-mt-4">
        <WarrantyTab
          controller={controller}
          filter={warrantyFilter}
          onFilterChange={setWarrantyFilter}
          onReportIncident={(warranty) => openModal({ mode: "report", warrantyId: warranty.id })}
          onForfeitBond={(warranty) => setForfeitId(warranty.id)}
          onOpenDetail={(warranty) => setDetailWarrantyId(warranty.id)}
          onOpenCreate={() => {
            setEditingWarranty(null);
            setIsCreateOpen(true);
          }}
          onOpenEdit={(warranty) => {
            setEditingWarranty(warranty);
            setIsCreateOpen(true);
          }}
        />
      </section>

      {modal.mode === "report" && (
        <IncidentReportModal
          warranties={activeWarranties}
          defaultWarrantyId={modal.warrantyId}
          errorText={modalError}
          onClose={() => setModal({ mode: "closed" })}
          onSubmit={controller.reportIncident}
        />
      )}

      {modal.mode === "fix" && (
        <FixAcceptanceModal
          incident={modal.incident}
          errorText={modalError}
          onClose={() => setModal({ mode: "closed" })}
          onSubmit={controller.acceptFix}
        />
      )}

      {forfeitTarget && (
        <ReasonModal
          open
          title="Thu hồi bảo lãnh bảo hành"
          summary={
            <>
              <strong>{forfeitTarget.workName}</strong> · {forfeitTarget.contractor} ·{" "}
              {formatBillions(forfeitTarget.bondValue)}
            </>
          }
          label="Lý do thu hồi (nhà thầu vi phạm nghĩa vụ bảo hành)"
          placeholder="Ví dụ: Nhà thầu không khắc phục sự cố SC-2026-011 sau 2 lần nhắc nhở bằng văn bản"
          confirmText="Thu hồi bảo lãnh"
          onClose={() => setForfeitId(undefined)}
          onConfirm={(reason) => controller.forfeitBond(forfeitTarget.id, reason)}
        />
      )}

      {/* Drawer Chi tiết Bảo hành */}
      {detailWarrantyId && controller.warranties.find((w) => w.id === detailWarrantyId) && (
        <WarrantyDetailDrawer
          warranty={controller.warranties.find((w) => w.id === detailWarrantyId)!}
          controller={controller}
          onClose={() => setDetailWarrantyId(undefined)}
          onReportIncident={(warranty) => {
            setDetailWarrantyId(undefined);
            openModal({ mode: "report", warrantyId: warranty.id });
          }}
          onReturnBond={(warranty) => {
            setDetailWarrantyId(undefined);
            controller.returnBond(warranty.id);
          }}
          onForfeitBond={(warranty) => {
            setDetailWarrantyId(undefined);
            setForfeitId(warranty.id);
          }}
          onOpenIncidentDetail={(incidentId) => {
            setDetailWarrantyId(undefined);
            setDetailIncidentId(incidentId);
          }}
          onEdit={(warranty) => {
            setDetailWarrantyId(undefined);
            setEditingWarranty(warranty);
            setIsCreateOpen(true);
          }}
        />
      )}

      {/* Drawer Chi tiết Sự cố */}
      {detailIncidentId && controller.incidents.find((i) => i.id === detailIncidentId) && (
        <IncidentDetailDrawer
          incident={controller.incidents.find((i) => i.id === detailIncidentId)!}
          controller={controller}
          onClose={() => setDetailIncidentId(undefined)}
          onStartFix={(incident) => {
            controller.startFixing(incident.id);
          }}
          onAcceptFix={(incident) => {
            setDetailIncidentId(undefined);
            openModal({ mode: "fix", incident });
          }}
        />
      )}

      {/* Drawer Thêm mới / Cập nhật Bảo hành */}
      {isCreateOpen && (
        <CreateWarrantyDrawer
          open={isCreateOpen}
          editingWarranty={editingWarranty}
          projects={controller.data.projects}
          today={controller.today}
          errorText={modalError}
          onClose={() => {
            setIsCreateOpen(false);
            setEditingWarranty(null);
          }}
          onSubmit={async (input) => {
            const success = editingWarranty
              ? await controller.updateWarranty(editingWarranty.id, input)
              : await controller.createWarranty(input);
            if (success) {
              setIsCreateOpen(false);
              setEditingWarranty(null);
            }
          }}
        />
      )}
    </div>
  );
}
