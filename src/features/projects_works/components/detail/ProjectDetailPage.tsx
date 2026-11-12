"use client";

import { useState } from "react";
import { App } from "antd";
import {
  ApartmentOutlined,
  ArrowLeftOutlined,
  DollarOutlined,
  HistoryOutlined,
  ProfileOutlined,
} from "@ant-design/icons";
import { Button } from "@/components/ui";
import type { SegmentedTabItem } from "@/components/workspace";
import { useAuth } from "@/features/auth";
import { canUserDo } from "@/access-control";
import type { ProjectFormData, ProjectItem } from "../../types/project.types";
import { useProcedureDraft } from "../../hooks/useProcedureDraft";
import { useProjectInfoDraft } from "../../hooks/useProjectInfoDraft";
import { useProjectProcedure } from "../../hooks/useProjectProcedure";
import type { ProjectProcedureSync } from "../../types/project-procedure.types";
import { shortProcedureLabel } from "../../utils/procedure-target";
import ProjectDisbursementTab from "./disbursement/ProjectDisbursementTab";
import ProjectChangesSummary from "./ProjectChangesSummary";
import ProjectDetailTabBar, { type DetailTab } from "./ProjectDetailTabBar";
import ProjectHistoryTab from "./ProjectHistoryTab";
import ProjectInfoTab from "./ProjectInfoTab";
import ProjectProcedureTab from "./ProjectProcedureTab";
import ProjectSaveBar from "./ProjectSaveBar";

interface ProjectDetailPageProps {
  project: ProjectItem;
  onBack: () => void;
  onUpdateProject: (projectId: string, data: ProjectFormData) => void;
  onProcedureSync: (projectId: string, sync: ProjectProcedureSync) => void;
  onDisbursedChange: (projectId: string, total: number) => void;
}

export default function ProjectDetailPage({
  project,
  onBack,
  onUpdateProject,
  onProcedureSync,
  onDisbursedChange,
}: ProjectDetailPageProps) {
  const { modal, message } = App.useApp();
  const { user } = useAuth();
  const isClosed = project.status === "closed";

  const info = useProjectInfoDraft(project, canUserDo(user, "m2_projects", "input") && !isClosed);
  const canDisburse = canUserDo(user, "m4_finance_settlement", "input") && !isClosed;
  const canViewProcedure = canUserDo(user, "m3_construction_procedures", "view");

  const procedure = useProjectProcedure(project, (sync) => onProcedureSync(project.id, sync));
  const procedures = useProcedureDraft(procedure);
  const { appliedDepartments, departmentStatus } = procedure;
  const canEditProcedures = procedure.canConfigure && !isClosed;

  const tabLabelOf = (dept: string) =>
    departmentStatus(dept)?.tabLabel || shortProcedureLabel(departmentStatus(dept)?.procedureName ?? dept);

  const [tab, setTab] = useState<DetailTab>("info");
  const detailTabs: SegmentedTabItem<DetailTab>[] = [
    { key: "info", icon: <ProfileOutlined />, label: "Thông tin chung" },
    ...(canViewProcedure
      ? appliedDepartments.map((dept) => ({ key: `proc:${dept}` as const, icon: <ApartmentOutlined />, label: tabLabelOf(dept) }))
      : []),
    { key: "disbursement", icon: <DollarOutlined />, label: "Giải ngân" },
    { key: "history", icon: <HistoryOutlined />, label: "Lịch sử" },
  ];
  const activeTab: DetailTab = detailTabs.some((t) => t.key === tab) ? tab : "info";

  const isDirty = info.isDirty || procedures.changeCount > 0;
  const changeCount = info.changes.length + procedures.changeCount;

  const discardChanges = () => {
    info.reset();
    procedures.reset();
  };

  const confirmSaveChanges = () =>
    modal.confirm({
      centered: true,
      width: 480,
      title: "Xác nhận thay đổi thông tin dự án",
      content: <ProjectChangesSummary projectCode={project.code} fieldChanges={info.changes} procedures={procedures} />,
      okText: "Đồng ý lưu",
      cancelText: "Xem lại",
      okButtonProps: { className: "!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C]" },
      onOk: () => {
        if (info.isDirty) {
          const { view } = info;
          onUpdateProject(project.id, {
            ...info.pending,
            name: view.name,
            type: view.type,
            startDate: view.startDate,
            endDatePlanned: view.endDatePlanned,
            progressNote: info.changes.map((c) => `${c.label}: ${c.from || "Trống"} → ${c.to || "Trống"}`).join("; "),
          });
        }
        if (procedures.changeCount > 0) procedures.save();
        discardChanges();
        message.success("Đã cập nhật dự án.");
      },
    });

  const handleBack = () => {
    const unsavedProcedure = procedure.draftCount > 0 || procedures.changeCount > 0;
    if (!isDirty && !unsavedProcedure) {
      onBack();
      return;
    }
    modal.confirm({
      centered: true,
      width: 420,
      title: "Bỏ các thay đổi chưa lưu?",
      content: (
        <p className="m-0 text-xs text-slate-600">
          {info.isDirty && unsavedProcedure
            ? "Có thay đổi thông tin dự án và phân công quy trình chưa lưu."
            : info.isDirty
              ? "Có thay đổi thông tin dự án chưa lưu."
              : "Có thay đổi quy trình chưa lưu."}{" "}
          Quay lại sẽ bỏ các thay đổi này.
        </p>
      ),
      okText: "Bỏ thay đổi",
      cancelText: "Tiếp tục sửa",
      okButtonProps: { danger: true },
      onOk: onBack,
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          intent="outline"
          scale="compact"
          icon={<ArrowLeftOutlined />}
          aria-label="Quay lại danh sách dự án"
          title="Quay lại danh sách dự án"
          onClick={handleBack}
          className="h-9! w-9! shrink-0 p-0!"
        />
        <h1 className="m-0 min-w-0 truncate text-base font-bold text-slate-900" title={info.view.name}>
          Chi tiết dự án <span className="text-[#DC2626]">{info.view.name}</span>
        </h1>
      </div>

      <ProjectDetailTabBar items={detailTabs} activeKey={activeTab} onChange={setTab} />

      {isClosed && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Dự án đã đóng nên chỉ xem được. Mở lại dự án từ danh sách nếu cần tiếp tục cập nhật.
        </div>
      )}

      {activeTab === "info" && (
        <ProjectInfoTab project={project} info={info} procedures={procedures} canEditProcedures={canEditProcedures} />
      )}
      {activeTab.startsWith("proc:") && (
        <ProjectProcedureTab key={activeTab} department={activeTab.slice(5)} controller={procedure} />
      )}
      {activeTab === "disbursement" && (
        <ProjectDisbursementTab
          project={project}
          operatorName={user?.name || user?.displayName || "Cán bộ quản lý"}
          canDisburse={canDisburse}
          headings={appliedDepartments.map(tabLabelOf)}
          onTotalChange={(total) => onDisbursedChange(project.id, total)}
        />
      )}
      {activeTab === "history" && <ProjectHistoryTab project={project} procedureLogs={procedure.data.history ?? []} />}

      {isDirty && activeTab === "info" && (
        <ProjectSaveBar changeCount={changeCount} onDiscard={discardChanges} onSave={confirmSaveChanges} />
      )}
    </div>
  );
}
