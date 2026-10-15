"use client";

import React from "react";
import {
  CloseOutlined,
  EditOutlined,
  FileTextOutlined,
  HistoryOutlined,
  PaperClipOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Button, Flex, Progress, Tag, Text } from "@/components/ui";
import { formatMoneyString } from "@/utils/format-money";
import type { AuthUser } from "@/types/auth";
import {
  getProjectHealthStatus,
} from "../../constants/project-enums";
import type { ProjectItem } from "../../types/project.types";
import { canUserDo } from "@/access-control";

interface ProjectViewTabProps {
  project: ProjectItem;
  user: AuthUser | null;
  onEditClick: () => void;
  onProgressClick?: () => void;
  onReopenProject?: (project: ProjectItem) => void;
  onClose?: () => void;
}

export default function ProjectViewTab({
  project,
  user,
  onEditClick,
  onClose,
}: ProjectViewTabProps) {

  // Tính toán sức khỏe tiến độ & tỷ lệ giải ngân
  const health = getProjectHealthStatus(project.actualProgress, project.plannedProgress);
  const disbursedPercent =
    project.totalInvestment > 0
      ? Math.round((project.disbursedAmount / project.totalInvestment) * 100)
      : 0;

  const currentFiscalYear = new Date().getFullYear();
  const facts = [
    { label: "Loại dự án", value: project.type },
    { label: "Địa bàn xây dựng", value: project.location || "TP. Hà Tiên" },
    { label: "Nguồn vốn", value: project.fundingSource },
    { label: "Tổng mức đầu tư", value: `${formatMoneyString(project.totalInvestment || 0)} VNĐ` },
    {
      label: `Kế hoạch vốn ${currentFiscalYear}`,
      value: project.plan2026 > 0 ? `${formatMoneyString(project.plan2026)} VNĐ` : "Chưa giao kế hoạch",
    },
    { label: "Cơ quan quản lý", value: "Ban QLDA ĐTXD Hà Tiên" },
    {
      label: "Người phụ trách",
      value: project.managerName === "Chưa phân công" ? "Chờ BQL phân công (M5)" : project.managerName,
    },
    {
      label: "Giám sát kỹ thuật",
      value: project.supervisorName === "Chưa phân công" ? "Chờ BQL phân công (M5)" : project.supervisorName,
    },
    { label: "Ngày bắt đầu", value: project.startDate, isMono: true },
    { label: "Kế hoạch hoàn thành", value: project.endDatePlanned, isMono: true },
    ...(project.actualEndDate
      ? [{ label: "Hoàn thành thực tế", value: project.actualEndDate, isMono: true }]
      : []),
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Thông tin tổng quan (Fact grid) */}
      <dl className="m-0 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        {facts.map((fact) => (
          <div key={fact.label} className="min-w-0">
            <dt className="text-xs text-slate-500 font-medium truncate" title={fact.label}>{fact.label}</dt>
            <dd className="m-0 mt-0.5">
              <span
                className={`text-[13px] font-semibold text-slate-800 break-words leading-snug block ${fact.isMono ? "font-mono" : ""
                  }`}
              >
                {fact.value}
              </span>
            </dd>
          </div>
        ))}

        {/* Phòng ban được giao / phối hợp thực hiện */}
        <div className="col-span-1 sm:col-span-2 pt-2.5 mt-1 border-t border-slate-200">
          <dt className="text-xs text-slate-500 font-medium mb-1.5 flex items-center gap-1.5 flex-wrap">
            <TeamOutlined className="text-blue-600 text-xs" />
            <span className="font-semibold text-slate-700">Phòng ban được giao phụ trách:</span>
            {project.departments && project.departments.length > 0 && (
              <span className="text-[11px] text-slate-400 font-normal">
                ({project.departments.length} phòng ban)
              </span>
            )}
          </dt>
          <dd className="m-0 flex flex-wrap gap-1.5">
            {project.departments && project.departments.length > 0 ? (
              project.departments.map((dept) => (
                <span
                  key={dept}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-white text-slate-800 border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  {dept}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">
                Chưa phân công phòng ban phụ trách
              </span>
            )}
          </dd>
        </div>
      </dl>

      {/* Mục tiêu / Quy mô tóm tắt nếu có */}
      {project.scale && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs">
          <span className="text-slate-500 font-medium block mb-1">Mục tiêu / Quy mô dự án:</span>
          <p className="text-slate-800 m-0 leading-relaxed font-normal break-words">{project.scale}</p>
        </div>
      )}

      {/* Khối Tiến độ thực tế vs Kế hoạch */}
      <section className="rounded-xl border border-slate-200 p-4">
        <Flex align="center" justify="space-between" gap="small" wrap="wrap">
          <Text className="text-[13px] font-semibold text-slate-800">Tiến độ thực hiện dự án</Text>
          <Tag
            className={
              health.status === "normal"
                ? "!border-amber-300 !bg-amber-50 !text-amber-800 font-semibold"
                : undefined
            }
            intent={
              health.status === "normal"
                ? undefined
                : health.status === "warning"
                  ? "warning"
                  : "danger"
            }
            scale="sm"
          >
            {health.label}
          </Tag>
        </Flex>

        <div className="mt-3">
          <Flex align="center" justify="space-between" wrap="wrap" gap={8} className="text-xs text-slate-600 mb-1">
            <span>
              Tiến độ thực tế:{" "}
              <strong className="text-slate-900 font-mono text-[13px]">
                {project.actualProgress}%
              </strong>
            </span>
            <span>
              Kế hoạch: <span className="font-mono text-amber-700 font-semibold">{project.plannedProgress}%</span>
            </span>
          </Flex>
          <Progress
            percent={project.actualProgress}
            showInfo={false}
            size="small"
            strokeColor="#DC2626"
          />
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs flex-wrap gap-2">
          <span className="text-slate-500">Tỷ lệ giải ngân vốn:</span>
          <span className="font-semibold text-slate-800">
            {formatMoneyString(project.disbursedAmount)} / {formatMoneyString(project.totalInvestment)} VNĐ ({disbursedPercent}%)
          </span>
        </div>
      </section>

      {/* Khối Nhật ký tiến độ */}
      <section className="rounded-xl border border-slate-200 p-4">
        <Flex align="center" gap={6} className="mb-3">
          <HistoryOutlined className="text-slate-500" />
          <Text className="text-xs font-bold uppercase tracking-wide text-slate-600">
            Nhật ký tiến độ tuần ({(project.progressHistory ?? []).length})
          </Text>
        </Flex>

        <div className="space-y-2 max-h-[240px] overflow-y-auto [scrollbar-width:thin] pr-1">
          {(project.progressHistory ?? []).length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              Chưa có lịch sử cập nhật tiến độ
            </div>
          ) : (
            (project.progressHistory ?? []).map((hist) => (
              <div
                key={hist.id}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors"
              >
                <Flex justify="space-between" align="center" gap={8} className="mb-1">
                  <Text strong className="text-slate-900 text-xs">
                    {hist.updatedBy}
                  </Text>
                  <Text className="text-slate-400 font-mono text-[11px]">
                    {hist.updatedAt}
                  </Text>
                </Flex>
                <div className="text-xs font-mono font-bold text-[#DC2626] mb-1">
                  {hist.oldProgress}% → {hist.newProgress}%
                </div>
                <Text className="block text-xs text-slate-600 leading-relaxed">
                  {hist.note}
                </Text>
                {hist.actualEndDateRecorded && (
                  <div className="mt-1.5">
                    <Tag intent="brand" scale="sm">
                      Hoàn thành thực tế: {hist.actualEndDateRecorded}
                    </Tag>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Khối Tài liệu đính kèm dự án */}
      <section className="rounded-xl border border-slate-200 p-4">
        <Flex align="center" justify="space-between" className="mb-3">
          <Flex align="center" gap={6}>
            <FileTextOutlined className="text-slate-500" />
            <Text className="text-xs font-bold uppercase tracking-wide text-slate-600">
              Tài liệu đính kèm ({(project.documents ?? []).length})
            </Text>
          </Flex>
          <span className="text-[10.5px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
            Hồ sơ pháp lý & kỹ thuật
          </span>
        </Flex>

        {(project.documents ?? []).length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg bg-slate-50/40">
            Chưa có tài liệu đính kèm cho dự án này
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto [scrollbar-width:thin] pr-1">
            {(project.documents ?? []).map((doc, idx) => (
              <div
                key={doc.id || idx}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-7 w-7 items-center justify-center rounded bg-red-50 text-[#DC2626] border border-red-200 shrink-0">
                    <FileTextOutlined className="text-xs" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-800 truncate" title={doc.fileName || doc.name}>
                      {doc.fileName || doc.name}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                      {doc.fileSize && <span>{doc.fileSize}</span>}
                      {doc.uploadedAt && <span>· Ngày tải: {doc.uploadedAt}</span>}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0 ml-2">
                  <PaperClipOutlined className="mr-1 text-[10px]" />
                  Đính kèm
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
      </div>

      {/* Footer thao tác của màn hình Chi tiết (Cố định ở đáy, nút chức năng đứng TRƯỚC, Đóng đứng SAU) */}
      <footer className="shrink-0 border-t border-slate-200 bg-white px-5 py-3 flex items-center justify-start gap-2.5 z-10 shadow-[0_-2px_8px_rgba(0,0,0,0.03)] flex-wrap">
        {canUserDo(user, "m2_projects", "input") && (
          <Button
            intent="primary"
            scale="sm"
            className="bg-[#DC2626] border-[#DC2626] hover:bg-[#B91C1C] text-white disabled:opacity-50"
            disabled={project.status === "closed"}
            title={project.status === "closed" ? "Dự án đã đóng, không thể sửa thông tin" : undefined}
            onClick={onEditClick}
          >
            <EditOutlined className="mr-1" />
            Cập nhật thông tin
          </Button>
        )}
        {onClose && (
          <Button scale="sm" onClick={onClose}>
            <CloseOutlined className="mr-1" />
            Đóng
          </Button>
        )}
      </footer>
    </div>
  );
}
