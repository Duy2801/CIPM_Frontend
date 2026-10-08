"use client";

import { useState } from "react";
import { Spin } from "@/components/ui";
import { FeedbackBar, ReasonModal } from "@/components/workspace";
import { useBiddingManagement } from "../hooks/useBiddingManagement";
import type { BidPackage, PackageFilter } from "../types/bidding.types";
import BidPackageDetailDrawer from "./BidPackageDetailDrawer";
import BidPackageTab from "./BidPackageTab";
import BidStepModal from "./BidStepModal";
import CreatePackageModal from "./CreatePackageModal";

export default function BiddingManagementScreen() {
  const controller = useBiddingManagement();

  const [filter, setFilter] = useState<PackageFilter>("ALL");
  const [stepTargetId, setStepTargetId] = useState<string>();
  const [rejectTargetId, setRejectTargetId] = useState<string>();
  const [detailPkgId, setDetailPkgId] = useState<string>();
  const [creating, setCreating] = useState(false);

  if (controller.loading) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center">
        <Spin size="large" description="Đang tải dữ liệu đấu thầu..." />
      </section>
    );
  }

  const findPackage = (id?: string) => controller.data.packages.find((pkg) => pkg.id === id);
  const stepTarget = findPackage(stepTargetId);
  const rejectTarget = findPackage(rejectTargetId);
  const detailPkg = findPackage(detailPkgId);
  const modalOpen = Boolean(stepTarget) || creating;
  const modalError = controller.feedback?.type === "error" ? controller.feedback.text : undefined;

  const openStepModal = (pkg: BidPackage) => {
    controller.clearFeedback();
    setStepTargetId(pkg.id);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-4">
      {controller.feedback && !modalOpen && (
        <FeedbackBar
          type={controller.feedback.type}
          text={controller.feedback.text}
          onClose={controller.clearFeedback}
        />
      )}

      {/* Hiển thị trực tiếp danh sách gói thầu, không qua thanh tab */}
      <section id="bidding-packages" className="scroll-mt-4">
        <BidPackageTab
          controller={controller}
          filter={filter}
          onFilterChange={setFilter}
          onOpenDetail={(pkg) => setDetailPkgId(pkg.id)}
          onUpdateStep={openStepModal}
          onReject={(pkg) => setRejectTargetId(pkg.id)}
          onCreatePackage={() => {
            controller.clearFeedback();
            setCreating(true);
          }}
        />
      </section>

      {stepTarget && (
        <BidStepModal
          pkg={stepTarget}
          errorText={modalError}
          onClose={() => setStepTargetId(undefined)}
          onComplete={controller.completeStep}
          onSubmit={controller.submitStep}
        />
      )}

      {creating && (
        <CreatePackageModal
          projects={controller.data.projects}
          errorText={modalError}
          onClose={() => setCreating(false)}
          onCreate={controller.createPackage}
        />
      )}

      {rejectTarget?.submission && (
        <ReasonModal
          open
          title={`Trả lại tờ trình bước ${rejectTarget.submission.step}`}
          summary={<>Gói thầu <strong>{rejectTarget.code}</strong> – {rejectTarget.name}</>}
          label="Lý do trả lại"
          placeholder="Ví dụ: Cần tách phần thiết bị thành gói riêng, bổ sung dự toán chi tiết"
          confirmText="Trả lại tờ trình"
          onClose={() => setRejectTargetId(undefined)}
          onConfirm={(reason) => controller.rejectSubmission(rejectTarget.id, reason)}
        />
      )}

      {detailPkg && (
        <BidPackageDetailDrawer
          pkg={detailPkg}
          controller={controller}
          onClose={() => setDetailPkgId(undefined)}
          onUpdateStep={openStepModal}
          onReject={(pkg) => setRejectTargetId(pkg.id)}
        />
      )}
    </div>
  );
}
