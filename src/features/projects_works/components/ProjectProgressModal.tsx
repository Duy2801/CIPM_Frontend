"use client";

import React, { useEffect, useState } from "react";
import {
  CalendarOutlined,
  CheckCircleFilled,
  HistoryOutlined,
  LockOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Button, Card, Flex, Input, Modal, Select, Tag, Text } from "@/components/ui";
import { useAuth } from "@/features/auth";
import type { ProjectItem, ProjectStage } from "../types/project.types";
import {
  PROJECT_STATUS_TABS,
  STAGE_BADGE_CLASSES,
  STAGE_DISPLAY_NAMES,
} from "../constants/project-enums";
import { canUpdateProjectProgress } from "../utils/project-permissions";

interface ProjectProgressModalProps {
  project: ProjectItem | null;
  open: boolean;
  onClose: () => void;
  onSaveProgress: (
    projectId: string,
    newProgress: number,
    note: string,
    actualEndDate?: string,
    newStage?: ProjectStage,
  ) => void;
}

export default function ProjectProgressModal({
  project,
  open,
  onClose,
  onSaveProgress,
}: ProjectProgressModalProps) {
  const { user } = useAuth();
  const [newProgress, setNewProgress] = useState<number>(0);
  const [newStage, setNewStage] = useState<ProjectStage>(project?.currentStage ?? "CONSTRUCTION");
  const [note, setNote] = useState<string>("");
  const [actualEndDate, setActualEndDate] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (project) {
      queueMicrotask(() => {
        setNewProgress(project.actualProgress);
        setNewStage(project.currentStage);
        setNote("");
        // QUY TẮC 6: Không tự động gán ngày hôm nay nếu chưa hoàn thành
        setActualEndDate(project.actualEndDate || "");
        setErrorMsg("");
      });
    }
  }, [project]);

  if (!project) return null;

  // QUY TẮC 4: Kiểm tra quyền cập nhật tiến độ
  const progressPerm = canUpdateProjectProgress(user, project);
  const isAllowedToUpdate = progressPerm.allowed;

  const handleSubmit = () => {
    if (!isAllowedToUpdate) {
      setErrorMsg(progressPerm.reason || "Bạn không có quyền cập nhật tiến độ cho dự án này theo Quy tắc 4.2.4.");
      return;
    }

    if (newProgress < 0 || newProgress > 100) {
      setErrorMsg("Tiến độ thực tế phải nằm trong khoảng từ 0% đến 100%.");
      return;
    }

    // QUY TẮC 6: Khi tiến độ đạt 100%, bắt buộc nhập ngày hoàn thành thực tế
    if (newProgress === 100 && !actualEndDate.trim()) {
      setErrorMsg("Khi tiến độ đạt 100%, bắt buộc nhập ngày hoàn thành thực tế theo Quy tắc 6.");
      return;
    }

    if (!note.trim()) {
      setErrorMsg("Vui lòng nhập ghi chú hoặc nội dung công việc hiện trường trong tuần.");
      return;
    }

    onSaveProgress(
      project.id,
      newProgress,
      note.trim(),
      newProgress === 100 ? actualEndDate.trim() : undefined,
      newStage,
    );
    onClose();
  };

  return (
    <Modal
      title={
        <Flex align="center" gap={8}>
          <ThunderboltOutlined className="text-[#007A78] text-base" />
          <Text strong className="text-slate-900 text-sm sm:text-base">
            Cập nhật tiến độ tuần: {project.code}
          </Text>
        </Flex>
      }
      open={open}
      onCancel={onClose}
      width="min(1180px, calc(100vw - var(--cipm-sidebar-width, 0px) - 56px))"
      centered
      wrapClassName="cipm-centered-modal-wrap"
      className="m-0 max-w-[calc(100vw-32px)]"
      transitionName=""
      maskTransitionName=""
      footer={[
        <Button key="cancel" scale="compact" onClick={onClose}>
          Đóng
        </Button>,
        <Button
          key="save"
          intent="primary"
          scale="compact"
          className="bg-[#007A78] border-[#007A78] text-white"
          disabled={!isAllowedToUpdate}
          onClick={handleSubmit}
        >
          Lưu tiến độ
        </Button>,
      ]}
    >
      <div className="max-h-[min(560px,calc(100vh-260px))] overflow-y-auto pr-1 pb-8 text-xs select-none [scrollbar-width:thin]">
        <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[minmax(0,1fr)_390px]">
          <Flex vertical gap={10}>
            {!isAllowedToUpdate && (
              <Card surface="flat" padding="compact" rounded="sm" className="bg-rose-50 border-rose-200">
                <Flex align="center" gap={8} className="text-rose-700 font-medium">
                  <LockOutlined className="text-base shrink-0" />
                  <Text className="text-xs text-rose-700">
                    Chỉ người phụ trách, Tổ Giám sát - KT hoặc Ban Giám đốc mới được cập nhật tiến độ.
                  </Text>
                </Flex>
              </Card>
            )}

            <Card surface="quiet" padding="compact" rounded="lg" className="border border-slate-200/80">
              <Flex vertical gap={6}>
                <Text strong className="text-sm text-slate-900 leading-snug">
                  {project.name}
                </Text>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                  <Text className="text-xs text-slate-600">
                    Phụ trách: <strong className="text-slate-800">{project.managerName}</strong>
                  </Text>
                  <Text className="text-xs text-slate-600">
                    Giám sát: <strong className="text-slate-800">{project.supervisorName}</strong>
                  </Text>
                  <Text className="text-xs text-slate-600">
                    Kế hoạch: <strong className="text-slate-800">{project.plannedProgress}%</strong>
                  </Text>
                </div>
              </Flex>
            </Card>

            <Card surface="flat" padding="compact" rounded="lg" className="border border-slate-200">
              <Flex vertical gap={10}>
                <Text strong className="text-xs uppercase text-slate-700 tracking-wide">
                  Nhập liệu định kỳ hàng tuần
                </Text>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Flex vertical gap={4}>
                    <Text variant="label" className="text-[11px] font-semibold text-slate-700">
                      Tiến độ hiện tại
                    </Text>
                    <div className="px-3 py-2 rounded-md bg-slate-100 border border-slate-200 font-mono font-bold text-slate-700 text-sm">
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
                        setErrorMsg("");
                      }}
                      disabled={!isAllowedToUpdate}
                      className="font-mono font-bold text-[#007A78] text-sm"
                    />
                  </Flex>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Flex vertical gap={4}>
                    <Text variant="label" className="text-[11px] font-semibold text-slate-700">
                      Giai đoạn hiện tại
                    </Text>
                    <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center h-[38px]">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded font-medium border ${
                          STAGE_BADGE_CLASSES[project.currentStage]
                        }`}
                      >
                        {STAGE_DISPLAY_NAMES[project.currentStage]}
                      </span>
                    </div>
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
                        setErrorMsg("");
                      }}
                      disabled={!isAllowedToUpdate}
                      className="w-full text-xs h-[38px]"
                      options={PROJECT_STATUS_TABS.filter((t) => t.key !== "ALL").map((t) => ({
                        value: t.key,
                        label: (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-block w-2 h-2 rounded-full ${
                                t.key === "COMPLETED"
                                  ? "bg-emerald-500"
                                  : t.key === "CONSTRUCTION"
                                  ? "bg-amber-500"
                                  : t.key === "INSPECTION"
                                  ? "bg-purple-500"
                                  : t.key === "SETTLEMENT"
                                  ? "bg-cyan-500"
                                  : t.key === "BIDDING"
                                  ? "bg-indigo-500"
                                  : t.key === "DESIGN"
                                  ? "bg-sky-500"
                                  : "bg-slate-400"
                              }`}
                            />
                            <span className="text-xs">{STAGE_DISPLAY_NAMES[t.key as ProjectStage] || t.label}</span>
                          </div>
                        ),
                      }))}
                    />
                  </Flex>
                </div>

                {newProgress === 100 && (
                  <Card surface="flat" padding="compact" rounded="sm" className="bg-emerald-50 border-emerald-200">
                    <Flex align="center" gap={10} wrap="wrap">
                      <Flex align="center" gap={6} className="text-emerald-800 font-semibold">
                        <CheckCircleFilled />
                        <Text strong className="text-xs text-emerald-800">
                          Nhập ngày hoàn thành thực tế
                        </Text>
                      </Flex>
                      <Input
                        type="date"
                        value={actualEndDate}
                        onChange={(e) => setActualEndDate(e.target.value)}
                        className="w-full sm:w-[180px] text-xs font-mono"
                      />
                    </Flex>
                  </Card>
                )}

                <Flex vertical gap={4}>
                  <Text variant="label" className="text-[11px] font-semibold text-slate-700">
                    Ghi chú công việc / vướng mắc <span className="text-rose-500">*</span>
                  </Text>
                  <Input.TextArea
                    rows={5}
                    value={note}
                    onChange={(e) => {
                      setNote(e.target.value);
                      setErrorMsg("");
                    }}
                    disabled={!isAllowedToUpdate}
                    placeholder="VD: Đã hoàn thành 184 cọc, nhà thầu đang tập kết đá hộc bù tiến độ..."
                    className="text-xs rounded-lg border-slate-300 resize-none disabled:bg-slate-100"
                  />
                </Flex>

                {errorMsg && (
                  <Text className="text-rose-600 font-medium text-[11px]">
                    {errorMsg}
                  </Text>
                )}
              </Flex>
            </Card>
          </Flex>

          <Card surface="flat" padding="none" rounded="lg" className="self-start border border-slate-200/80 overflow-hidden">
            <Flex align="center" gap={6} className="px-3 py-2.5 border-b border-slate-100 bg-slate-50">
              <HistoryOutlined className="text-slate-500" />
              <Text strong className="text-xs text-slate-800">
                Lịch sử cập nhật ({project.progressHistory.length})
              </Text>
            </Flex>

            <div className="max-h-[450px] overflow-y-auto [scrollbar-width:thin]">
              {project.progressHistory.length === 0 ? (
                <Flex align="center" justify="center" className="p-4 text-slate-400 text-xs">
                  Chưa có lịch sử cập nhật
                </Flex>
              ) : (
                project.progressHistory.map((hist) => (
                  <div key={hist.id} className="p-3 flex flex-col gap-1.5 border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                    <Flex justify="space-between" align="center" gap={8}>
                      <Text strong className="text-slate-900 text-xs truncate">{hist.updatedBy}</Text>
                      <Flex align="center" gap={4} className="shrink-0">
                        <CalendarOutlined className="text-[10px] text-slate-400" />
                        <Text className="text-[10px] text-slate-400 font-mono">{hist.updatedAt}</Text>
                      </Flex>
                    </Flex>
                    <Flex align="center" gap={6} className="text-xs">
                      <Text className="text-slate-500 font-mono text-xs">{hist.oldProgress}%</Text>
                      <Text strong className="text-slate-400 text-xs">→</Text>
                      <Text strong className="text-[#007A78] font-mono text-xs">{hist.newProgress}%</Text>
                      {hist.stageRecorded && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-medium border ${
                            STAGE_BADGE_CLASSES[hist.stageRecorded] || ""
                          }`}
                        >
                          {STAGE_DISPLAY_NAMES[hist.stageRecorded] || hist.stageRecorded}
                        </span>
                      )}
                    </Flex>
                    <Text className="text-slate-600 text-xs leading-relaxed line-clamp-2">
                      {hist.note}
                    </Text>
                    {hist.actualEndDateRecorded && (
                      <Tag intent="success" scale="sm">
                        Hoàn thành: {hist.actualEndDateRecorded}
                      </Tag>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </Modal>
  );
}
