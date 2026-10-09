"use client";

import { useState } from "react";
import { Spin } from "@/components/ui";
import {
  FeedbackBar,
  ReasonModal,
} from "@/components/workspace";
import { useSiteClearance } from "../hooks/useSiteClearance";
import type { Household } from "../types/gpmb.types";
import HouseholdDetailDrawer from "./HouseholdDetailDrawer";
import HouseholdMatrixTab from "./HouseholdMatrixTab";
import StepUpdateModal from "./StepUpdateModal";

export default function SiteClearanceResettlementScreen() {
  const controller = useSiteClearance();

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
      {controller.feedback && !stepTarget && (
        <FeedbackBar
          type={controller.feedback.type}
          text={controller.feedback.text}
          onClose={controller.clearFeedback}
        />
      )}

      {/* Trang sử dụng trực tiếp ma trận 16 bước tích hợp toàn bộ thanh lọc, tìm kiếm, phân trang và thao tác */}
      <section id="gpmb-matrix" className="scroll-mt-4">
        <HouseholdMatrixTab
          controller={controller}
          onOpenDetail={openDetailWithStep}
          onUpdateStep={openStepModal}
          onReject={openRejectModal}
        />
      </section>

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
