"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircleFilled,
  CloseOutlined,
  HistoryOutlined,
  LockOutlined,
  RollbackOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { Button, Card, Flex, Input, Select, Tag, Text } from "@/components/ui";
import type { AuthUser } from "@/types/auth";
import type { ProjectItem, ProjectStage } from "../../types/project.types";
import {
  PROJECT_STATUS_TABS,
  STAGE_BADGE_CLASSES,
  STAGE_DISPLAY_NAMES,
} from "../../constants/project-enums";
import { canUpdateProjectProgress } from "../../utils/project-permissions";

interface ProjectProgressTabProps {
  project: ProjectItem;
  user: AuthUser | null;
  onBackToView: () => void;
  onClose?: () => void;
  onSaveProgress: (
    projectId: string,
    newProgress: number,
    note: string,
    actualEndDate?: string,
    newStage?: ProjectStage,
  ) => void;
}

export default function ProjectProgressTab({
  project,
  user,
  onBackToView,
  onClose,
  onSaveProgress,
}: ProjectProgressTabProps) {
  // QUY TẮC 4: Kiểm tra quyền cập nhật tiến độ
  const progressPerm = canUpdateProjectProgress(user, project);

  // Form State: Cập nhật tiến độ tuần & giai đoạn
  const [newProgress, setNewProgress] = useState<number>(project.actualProgress);
  const [newStage, setNewStage] = useState<ProjectStage>(project.currentStage);
  const [progressNote, setProgressNote] = useState<string>("");
  // QUY TẮC 6: Không tự động gán ngày hôm nay nếu chưa có
  const [actualEndDate, setActualEndDate] = useState<string>(project.actualEndDate || "");
  const [progressErrorMsg, setProgressErrorMsg] = useState<string>("");

  useEffect(() => {
    setNewProgress(project.actualProgress);
    setNewStage(project.currentStage);
    setProgressNote("");
    setActualEndDate(project.actualEndDate || "");
    setProgressErrorMsg("");
  }, [project]);

  // Xử lý lưu tiến độ tuần
  const handleSaveProgressSubmit = () => {
    // QUY TẮC 4: Chặn nếu không có quyền
    if (!progressPerm.allowed) {
      setProgressErrorMsg(progressPerm.reason || "Bạn không có quyền cập nhật tiến độ cho dự án này.");
      return;
    }

    if (newProgress < 0 || newProgress > 100) {
      setProgressErrorMsg("Tiến độ thực tế phải nằm trong khoảng từ 0% đến 100%.");
      return;
    }

    // QUY TẮC 6: Khi tiến độ đạt 100%, bắt buộc nhập ngày hoàn thành thực tế
    if (newProgress === 100 && !actualEndDate.trim()) {
      setProgressErrorMsg("Khi tiến độ đạt 100%, bắt buộc nhập ngày hoàn thành thực tế theo Quy tắc 6.");
      return;
    }

    if (!progressNote.trim()) {
      setProgressErrorMsg("Vui lòng nhập ghi chú hoặc nội dung công việc hiện trường trong tuần.");
      return;
    }

    onSaveProgress(
      project.id,
      newProgress,
      progressNote.trim(),
      newProgress === 100 ? actualEndDate.trim() : undefined,
      newStage
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Cảnh báo phân quyền (Quy tắc 4) */}
      {!progressPerm.allowed ? (
        <Card surface="flat" padding="compact" rounded="sm" className="bg-rose-50 border-rose-200">
          <Flex align="center" gap={8} className="text-rose-700 font-medium">
            <LockOutlined className="text-base shrink-0" />
            <Text className="text-xs text-rose-700">
              {progressPerm.reason || "Chỉ người phụ trách dự án, Tổ Giám sát – KT, và Ban Giám đốc được cập nhật tiến độ (Quy tắc 4)."}
            </Text>
          </Flex>
        </Card>
      ) : (
        <div></div>
      )}

      {/* Card tóm tắt nhanh dự án */}
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
          <div>
            Phụ trách: <strong className="text-slate-800">{project.managerName}</strong>
          </div>
          <div>
            Giám sát: <strong className="text-slate-800">{project.supervisorName}</strong>
          </div>
          <div>
            Kế hoạch: <strong className="text-slate-800">{project.plannedProgress}%</strong>
          </div>
        </div>
      </div>

      {/* Khối nhập liệu */}
      <div className="rounded-xl border border-slate-200 p-4 space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Flex vertical gap={4}>
            <Text variant="label" className="text-[11px] font-semibold text-slate-700">
              Tiến độ hiện tại
            </Text>
            <div className="px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 font-mono font-bold text-slate-700 text-sm">
              {project.actualProgress}%
            </div>
          </Flex>

          <Flex vertical gap={4}>
            <Text variant="label" className="text-[11px] font-semibold text-slate-700">
              Tiến độ mới (%) <span className="text-rose-500">*</span>
            </Text>
            <Input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={newProgress}
              onChange={(e) => {
                const val = Number(e.target.value);
                setNewProgress(val);
                if (val === 100 && newStage !== "COMPLETED") {
                  setNewStage("COMPLETED");
                }
                setProgressErrorMsg("");
              }}
              disabled={!progressPerm.allowed}
              className="font-mono font-bold text-[#007A78] text-sm"
            />
          </Flex>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Flex vertical gap={4}>
            <Text variant="label" className="text-[11px] font-semibold text-slate-700">
              Giai đoạn hiện tại
            </Text>
            <Input
              value={STAGE_DISPLAY_NAMES[project.currentStage]}
              disabled
              className="text-xs"
            />
          </Flex>

          <Flex vertical gap={4}>
            <Text variant="label" className="text-[11px] font-semibold text-slate-700">
              Cập nhật giai đoạn mới <span className="text-rose-500">*</span>
            </Text>
            <Select
              value={newStage}
              onChange={(val) => {
                const stage = val as ProjectStage;
                setNewStage(stage);
                if (stage === "COMPLETED" && newProgress < 100) {
                  setNewProgress(100);
                }
                setProgressErrorMsg("");
              }}
              disabled={!progressPerm.allowed}
              className="w-full text-xs"
              options={PROJECT_STATUS_TABS.filter((t) => t.key !== "ALL").map((t) => ({
                value: t.key,
                label: STAGE_DISPLAY_NAMES[t.key as ProjectStage] || t.label,
              }))}
            />
          </Flex>
        </div>

        {/* QUY TẮC 6: Khi tiến độ đạt 100%, bắt buộc nhập ngày hoàn thành thực tế */}
        {newProgress === 100 && (
          <Card
            surface="flat"
            padding="compact"
            rounded="sm"
            className={`border transition-colors ${
              !actualEndDate.trim()
                ? "bg-amber-50/80 border-amber-300"
                : "bg-emerald-50 border-emerald-200"
            }`}
          >
            <Flex vertical gap={6}>
              <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
                <Flex align="center" gap={6} className={!actualEndDate.trim() ? "text-amber-900 font-semibold" : "text-emerald-800 font-semibold"}>
                  <CheckCircleFilled className={!actualEndDate.trim() ? "text-amber-600" : "text-emerald-600"} />
                  <Text strong className={`text-xs ${!actualEndDate.trim() ? "text-amber-900" : "text-emerald-800"}`}>
                    Dự án đạt 100% — Bắt buộc nhập ngày hoàn thành thực tế: <span className="text-rose-500 font-bold">*</span>
                  </Text>
                </Flex>
                <Input
                  type="date"
                  value={actualEndDate}
                  onChange={(e) => {
                    setActualEndDate(e.target.value);
                    if (e.target.value) setProgressErrorMsg("");
                  }}
                  disabled={!progressPerm.allowed}
                  className={`w-full sm:w-[170px] text-xs font-mono font-semibold ${
                    !actualEndDate.trim() ? "border-amber-400 bg-white" : "border-emerald-400"
                  }`}
                />
              </Flex>
              {!actualEndDate.trim() && (
                <Text className="text-[11px] text-amber-700 font-medium">
                  ⚠️ Quy tắc 6: Hệ thống yêu cầu phải nhập ngày hoàn thành thực tế khi tiến độ đạt 100%.
                </Text>
              )}
            </Flex>
          </Card>
        )}

        <Flex vertical gap={4}>
          <Text variant="label" className="text-[11px] font-semibold text-slate-700">
            Ghi chú công việc / vướng mắc hiện trường <span className="text-rose-500">*</span>
          </Text>
          <Input.TextArea
            rows={4}
            value={progressNote}
            onChange={(e) => {
              setProgressNote(e.target.value);
              setProgressErrorMsg("");
            }}
            disabled={!progressPerm.allowed}
            placeholder="VD: Đã hoàn thành 184/200 cọc kè, nhà thầu đang tập kết đá hộc san lấp để bù tiến độ..."
            className="text-xs rounded-lg border-slate-300 resize-none disabled:bg-slate-100"
          />
        </Flex>

        {progressErrorMsg && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {progressErrorMsg}
          </div>
        )}
      </div>

      {/* Lịch sử gần đây để kỹ sư tiện đối chiếu */}
      <div className="rounded-xl border border-slate-200 p-4">
        <Flex align="center" gap={6} className="mb-2.5">
          <HistoryOutlined className="text-slate-500" />
          <Text strong className="text-xs text-slate-700">
            Lịch sử các tuần trước ({(project.progressHistory ?? []).length})
          </Text>
        </Flex>
        <div className="max-h-[180px] overflow-y-auto space-y-2 [scrollbar-width:thin] pr-1">
          {(project.progressHistory ?? []).map((hist) => (
            <div key={hist.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 text-xs">
              <div className="flex justify-between items-center text-[11px] text-slate-500 mb-0.5">
                <span className="font-semibold text-slate-700">{hist.updatedBy}</span>
                <span className="font-mono">{hist.updatedAt}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[#007A78] text-[11px]">
                  {hist.oldProgress}% → {hist.newProgress}%
                </span>
                {hist.stageRecorded && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-medium border ${
                      STAGE_BADGE_CLASSES[hist.stageRecorded] || ""
                    }`}
                  >
                    {STAGE_DISPLAY_NAMES[hist.stageRecorded] || hist.stageRecorded}
                  </span>
                )}
              </div>
              <div className="text-slate-600 line-clamp-2 mt-0.5">{hist.note}</div>
              {hist.actualEndDateRecorded && (
                <div className="mt-1">
                  <Tag intent="success" scale="sm">
                    Ngày xong: {hist.actualEndDateRecorded}
                  </Tag>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      </div>

      {/* Footer thao tác cập nhật tiến độ (Cố định ở đáy, nút chức năng đứng TRƯỚC, Đóng đứng SAU) */}
      <footer className="shrink-0 border-t border-slate-200 bg-white px-5 py-3 flex items-center justify-start gap-2.5 z-10 shadow-[0_-2px_8px_rgba(0,0,0,0.03)]">
        <Button
          intent="primary"
          scale="sm"
          className="bg-[#007A78] border-[#007A78] hover:bg-[#006361] text-white disabled:bg-slate-200 disabled:border-slate-200 disabled:text-slate-400"
          disabled={!progressPerm.allowed}
          onClick={handleSaveProgressSubmit}
        >
          <SaveOutlined className="mr-1" />
          Lưu tiến độ tuần
        </Button>
        <Button scale="sm" onClick={onClose ?? onBackToView}>
          <CloseOutlined className="mr-1" />
          Đóng
        </Button>
      </footer>
    </div>
  );
}
