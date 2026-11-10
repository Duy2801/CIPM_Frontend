"use client";

import { useState } from "react";
import { AppstoreOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { Segmented, Spin } from "@/components/ui";
import {
  ReasonModal,
} from "@/components/workspace";
import { useSiteClearance } from "../hooks/useSiteClearance";
import type { Household } from "../types/gpmb.types";
import CompensationTab from "./CompensationTab";
import HouseholdDetailDrawer from "./HouseholdDetailDrawer";
import HouseholdMatrixTab from "./HouseholdMatrixTab";
import StepUpdateModal from "./StepUpdateModal";

/** `listOnly`: mở trong tab quy trình của dự án — chỉ hiện danh sách bồi thường, không có nút chuyển sang ma trận */
export default function SiteClearanceResettlementScreen({
  projectId,
  listOnly = false,
}: { projectId?: string; listOnly?: boolean } = {}) {
  const controller = useSiteClearance(projectId);
  const [view, setView] = useState<"compensation" | "matrix">("compensation");

  const [detailId, setDetailId] = useState<string>();
  const [detailStep, setDetailStep] = useState<number>();
  const [stepTargetId, setStepTargetId] = useState<string>();
  const [rejectTargetId, setRejectTargetId] = useState<string>();

  if (controller.loading) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center">
        <Spin size="large" description="Đang tải hồ sơ giải phóng mặt bằng..." />
      </section>
    );
  }

  const modalError = controller.feedback?.type === "error" ? controller.feedback.text : undefined;
  const findHousehold = (id?: string) => controller.data.households.find((item) => item.id === id);
  const detailHousehold = findHousehold(detailId);
  const stepTarget = findHousehold(stepTargetId);
  const rejectTarget = findHousehold(rejectTargetId);

  // Đóng ngăn chi tiết khi mở modal cập nhật bước để tránh bị chồng lớp
  const openStepModal = (household: Household) => {
    controller.clearFeedback();
    setDetailId(undefined);
    setDetailStep(undefined);
    setStepTargetId(household.id);
  };

  const openRejectModal = (household: Household) => {
    setDetailId(undefined);
    setDetailStep(undefined);
    setRejectTargetId(household.id);
  };

  const openDetailWithStep = (household: Household, step?: number) => {
    setDetailId(household.id);
    setDetailStep(step);
  };

  return (
    <div className="w-full max-w-[2560px] mx-auto flex flex-col gap-4">

      {/* Danh sách bồi thường (bảng tổng hợp chi trả) hoặc ma trận tiến độ 16 bước của từng hộ */}
      {!listOnly && (
        <Segmented<"compensation" | "matrix">
          value={view}
          onChange={setView}
          className="self-start"
          options={[
            { value: "compensation", label: "Danh sách bồi thường", icon: <UnorderedListOutlined /> },
            { value: "matrix", label: "Ma trận 16 bước", icon: <AppstoreOutlined /> },
          ]}
        />
      )}
      {listOnly || view === "compensation" ? (
        <CompensationTab controller={controller} onOpenDetail={(h) => openDetailWithStep(h)} />
      ) : (
        <section id="gpmb-matrix" className="scroll-mt-4">
          <HouseholdMatrixTab
            controller={controller}
            onOpenDetail={openDetailWithStep}
            onUpdateStep={openStepModal}
            onReject={openRejectModal}
          />
        </section>
      )}

      {detailHousehold && (
        <HouseholdDetailDrawer
          household={detailHousehold}
          controller={controller}
          initialStep={detailStep}
          onClose={() => {
            setDetailId(undefined);
            setDetailStep(undefined);
          }}
          onUpdateStep={openStepModal}
          onReject={openRejectModal}
        />
      )}

      {stepTarget && (
        <StepUpdateModal
          household={stepTarget}
          errorText={modalError}
          onClose={() => setStepTargetId(undefined)}
          onComplete={controller.completeStep}
          onPropose={controller.proposeStep}
        />
      )}

      {rejectTarget && (
        <ReasonModal
          open
          title={`Trả lại đề xuất của ${rejectTarget.ownerName}`}
          summary={
            <>
              {rejectTarget.code} · Đề xuất {rejectTarget.proposal ? `bước ${rejectTarget.proposal.step}` : "bước"}
            </>
          }
          label="Lý do không duyệt / yêu cầu bổ sung"
          placeholder="Nêu rõ lý do từ chối để chuyên viên bồi thường biết cần chỉnh sửa gì..."
          confirmText="Xác nhận trả lại"
          onClose={() => setRejectTargetId(undefined)}
          onConfirm={(reason) => controller.rejectProposal(rejectTarget.id, reason)}
        />
      )}
    </div>
  );
}
