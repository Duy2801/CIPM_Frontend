"use client";

import React, { useState } from "react";
import {
  CheckCircleFilled,
  CloseOutlined,
  LockOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { Button, Card, Flex, Input, Select, Text } from "@/components/ui";
import type { AuthUser } from "@/types/auth";
import type { ProjectItem, ProjectStage } from "../../../types/project.types";
import {
  PROJECT_STATUS_TABS,
  STAGE_DISPLAY_NAMES,
} from "../../../constants/project-enums";
import { canUpdateProjectProgress } from "../../../utils/project-permissions";
import { validateProgressUpdate } from "../../../utils/project-progress";
import ProjectRecentProgressList from "./ProjectRecentProgressList";

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
  const progressPerm = canUpdateProjectProgress(user, project);

  const [newProgress, setNewProgress] = useState<number>(project.actualProgress);
  const [newStage, setNewStage] = useState<ProjectStage>(project.currentStage);
  const [progressNote, setProgressNote] = useState<string>("");
  const [actualEndDate, setActualEndDate] = useState<string>(project.actualEndDate || "");
  const [progressErrorMsg, setProgressErrorMsg] = useState<string>("");
  const [prevProjectId, setPrevProjectId] = useState<string>(project.id);

  if (project.id !== prevProjectId) {
    setPrevProjectId(project.id);
    setNewProgress(project.actualProgress);
    setNewStage(project.currentStage);
    setProgressNote("");
    setActualEndDate(project.actualEndDate || "");
    setProgressErrorMsg("");
  }

  const handleSaveProgressSubmit = () => {
    const error = validateProgressUpdate({
      permission: progressPerm,
      progress: newProgress,
      note: progressNote,
      actualEndDate,
    });
    if (error) {
      setProgressErrorMsg(error);
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

      <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
          <div>
            Phụ trách: <strong className="text-slate-800">{project.managerName}</strong>
          </div>
          <div>
            Giám sát: <strong className="text-slate-800">{project.supervisorName}</strong>
          </div>
          <div>
            Kế hoạch: <strong className="text-amber-700 font-semibold">{project.plannedProgress}%</strong>
          </div>
        </div>
      </div>

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
              className="font-mono font-bold text-[#DC2626] text-sm"
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

        {newProgress === 100 && (
          <Card
            surface="flat"
            padding="compact"
            rounded="sm"
            className={`border transition-colors ${
              !actualEndDate.trim()
                ? "bg-amber-50/80 border-amber-300"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <Flex vertical gap={6}>
              <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
                <Flex align="center" gap={6} className={!actualEndDate.trim() ? "text-amber-900 font-semibold" : "text-slate-800 font-semibold"}>
                  <CheckCircleFilled className={!actualEndDate.trim() ? "text-amber-600" : "text-slate-600"} />
                  <Text strong className={`text-xs ${!actualEndDate.trim() ? "text-amber-900" : "text-slate-800"}`}>
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
                    !actualEndDate.trim() ? "border-amber-400 bg-white" : "border-slate-300"
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

      <ProjectRecentProgressList project={project} />
      </div>

      <footer className="shrink-0 border-t border-slate-200 bg-white px-5 py-3 flex items-center justify-start gap-2.5 z-10 shadow-[0_-2px_8px_rgba(0,0,0,0.03)] flex-wrap">
        <Button
          intent="primary"
          scale="sm"
          className="bg-[#DC2626] border-[#DC2626] hover:bg-[#B91C1C] text-white disabled:bg-slate-200 disabled:border-slate-200 disabled:text-slate-400"
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
