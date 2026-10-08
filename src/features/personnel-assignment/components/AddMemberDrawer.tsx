"use client";

import React, { useMemo, useState } from "react";
import {
  ApartmentOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  CloseOutlined,
  SearchOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  Drawer,
  Flex,
  Input,
  Select,
  Tag,
  Text,
  Tooltip,
} from "@/components/ui";
import type {
  PersonnelDataset,
  PersonnelProject,
  Staff,
  TeamId,
} from "../types/personnel.types";
import { getWorkload } from "../utils/personnel-rules";

interface AddMemberDrawerProps {
  open: boolean;
  project: PersonnelProject;
  data: PersonnelDataset;
  currentStaffName?: string;
  onClose: () => void;
  onSubmit: (staffIds: string[]) => Promise<boolean>;
}

export default function AddMemberDrawer({
  open,
  project,
  data,
  currentStaffName = "Chủ nhiệm dự án",
  onClose,
  onSubmit,
}: AddMemberDrawerProps) {
  // Phòng ban được chọn: mặc định là phòng ban đầu tiên trong danh sách
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    data.teams[0]?.id || "ALL"
  );
  // Danh sách ID các cán bộ được chọn để thêm vào tổ
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  // Từ khóa tìm kiếm cán bộ
  const [searchTerm, setSearchTerm] = useState<string>("");
  // Trạng thái đang lưu
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Tập hợp các cán bộ đã có sẵn trong tổ công tác dự án
  const existingMemberIds = useMemo(() => {
    return new Set(project.teamMembers || []);
  }, [project.teamMembers]);




  // Danh sách nhân sự thuộc phòng ban đang chọn
  const staffInCurrentTeam = useMemo(() => {
    if (selectedTeamId === "ALL") {
      return data.staff;
    }
    return data.staff.filter((s) => s.teamId === selectedTeamId);
  }, [data.staff, selectedTeamId]);

  // Lọc theo từ khóa tìm kiếm
  const filteredStaff = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return staffInCurrentTeam;

    return staffInCurrentTeam.filter((s) => {
      const team = data.teams.find((t) => t.id === s.teamId);
      return (
        s.name.toLowerCase().includes(term) ||
        s.title.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term) ||
        s.phone.toLowerCase().includes(term) ||
        team?.name.toLowerCase().includes(term)
      );
    });
  }, [staffInCurrentTeam, searchTerm, data.teams]);

  // Danh sách nhân sự khả dụng trong view hiện tại (chưa có trong dự án & tài khoản hoạt động)
  const availableInView = useMemo(() => {
    return filteredStaff.filter(
      (s) => !existingMemberIds.has(s.id) && s.accountActive
    );
  }, [filteredStaff, existingMemberIds]);

  // Kiểm tra xem tất cả nhân sự khả dụng trong view hiện tại đã được chọn chưa
  const isAllAvailableSelectedInView = useMemo(() => {
    if (availableInView.length === 0) return false;
    return availableInView.every((s) => selectedStaffIds.includes(s.id));
  }, [availableInView, selectedStaffIds]);

  // Danh sách chi tiết các cán bộ đang được chọn (để hiển thị thẻ tóm tắt)
  const selectedStaffList = useMemo(() => {
    return selectedStaffIds
      .map((id) => data.staff.find((s) => s.id === id))
      .filter((s): s is Staff => Boolean(s));
  }, [selectedStaffIds, data.staff]);

  // Bật / tắt chọn 1 cán bộ
  const handleToggleStaff = (staffId: string) => {
    setSelectedStaffIds((prev) => {
      if (prev.includes(staffId)) {
        return prev.filter((id) => id !== staffId);
      } else {
        return [...prev, staffId];
      }
    });
  };

  // Chọn tất cả hoặc bỏ chọn tất cả trong view hiện tại
  const handleToggleSelectAllInView = () => {
    if (isAllAvailableSelectedInView) {
      const removeIds = new Set(availableInView.map((s) => s.id));
      setSelectedStaffIds((prev) => prev.filter((id) => !removeIds.has(id)));
    } else {
      const addIds = availableInView.map((s) => s.id);
      setSelectedStaffIds((prev) => Array.from(new Set([...prev, ...addIds])));
    }
  };

  // Bỏ chọn 1 cán bộ từ danh sách chip tóm tắt
  const handleRemoveSelected = (staffId: string) => {
    setSelectedStaffIds((prev) => prev.filter((id) => id !== staffId));
  };

  // Bỏ chọn tất cả
  const handleClearAllSelected = () => {
    setSelectedStaffIds([]);
  };

  // Xử lý nộp form
  const handleSubmit = async () => {
    if (selectedStaffIds.length === 0) return;

    setSubmitting(true);
    try {
      const success = await onSubmit(selectedStaffIds);
      if (success) {
        setSelectedStaffIds([]);
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      open={open}
      width="min(680px, 100vw)"
      onClose={onClose}
      destroyOnHidden
      className="[&_.ant-drawer-body]:!p-0 [&_.ant-drawer-body]:!overflow-hidden flex flex-col h-full"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#007A78] border border-teal-100 flex items-center justify-center font-bold text-lg shrink-0">
            <UserAddOutlined />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 leading-tight">
                Thêm thành viên vào tổ công tác
              </span>
              <Tag color="cyan" className="!m-0 text-[11px] font-semibold">
                Đang có: {existingMemberIds.size} thành viên
              </Tag>
            </div>
            <div className="text-xs text-slate-500 font-normal mt-0.5">
              {project.code} · {project.name}
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between px-3 py-2 w-full bg-white">
          <div className="text-xs text-slate-500">
            {selectedStaffIds.length > 0 ? (
              <span>
                Đã chọn{" "}
                <strong className="text-teal-700 font-bold">
                  {selectedStaffIds.length} cán bộ
                </strong>{" "}
                sẵn sàng thêm vào tổ công tác.
              </span>
            ) : (
              <span>Chọn các cán bộ từ danh sách trên để thêm vào dự án.</span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <Button
              intent="primary"
              onClick={handleSubmit}
              loading={submitting}
              disabled={selectedStaffIds.length === 0}
              icon={<CheckCircleFilled />}
              className="!bg-[#007A78] !border-[#007A78] hover:!bg-[#005f5d] text-white text-xs font-semibold px-4 h-8.5 rounded-lg shadow-xs"
            >
              Thêm{" "}
              {selectedStaffIds.length > 0
                ? `${selectedStaffIds.length} thành viên`
                : "thành viên"}
            </Button>
            <Button
              intent="outline"
              onClick={onClose}
              disabled={submitting}
              className="text-xs font-medium px-4 h-8.5 rounded-lg"
            >
              Đóng
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col h-full overflow-hidden bg-slate-50/40">
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4.5">
          {/* PHẦN 1: CHỌN PHÒNG BAN / TỔ CHUYÊN MÔN */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <ApartmentOutlined className="text-[#007A78] text-sm" />
                1. Chọn phòng ban / Tổ chuyên môn
              </span>
            </div>

            {/* Selector phòng ban */}
            <Select
              value={selectedTeamId}
              onChange={(val) => {
                setSelectedTeamId(val);
                setSearchTerm("");
              }}
              className="w-full text-xs font-medium"
              options={[
                {
                  value: "ALL",
                  label: "Tất cả phòng ban",
                },
                ...data.teams.map((t) => ({
                  value: t.id,
                  label: t.name,
                })),
              ]}
            />

          </div>

          {/* PHẦN 2: CHỌN THÀNH VIÊN TRONG PHÒNG BAN ĐÓ */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <TeamOutlined className="text-[#007A78] text-sm" />
                  2. Chọn thành viên trong phòng ban
                </span>
                <span className="block text-[11px] text-slate-500 mt-0.5">
                  Có thể chọn nhiều cán bộ cùng lúc để thêm vào tổ công tác.
                </span>
              </div>

              {availableInView.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    scale="compact"
                    intent={isAllAvailableSelectedInView ? "secondary" : "outline"}
                    onClick={handleToggleSelectAllInView}
                    className="text-xs font-medium h-7 px-2.5 rounded-lg"
                  >
                    {isAllAvailableSelectedInView
                      ? "Bỏ chọn tất cả"
                      : `Chọn tất cả (${availableInView.length})`}
                  </Button>
                </div>
              )}
            </div>

            {/* Thanh tìm kiếm nhanh cán bộ */}
            <Input
              prefix={<SearchOutlined className="text-slate-400 mr-1" />}
              placeholder="Tìm kiếm cán bộ theo tên, chức danh, số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              className="text-xs h-8.5 rounded-lg"
            />

            {/* Danh sách thẻ cán bộ */}
            <div className="space-y-2">
              {filteredStaff.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  Không tìm thấy cán bộ nào phù hợp với bộ lọc tìm kiếm.
                </div>
              ) : (
                filteredStaff.map((person) => {
                  const isExisting = existingMemberIds.has(person.id);
                  const isSelected = selectedStaffIds.includes(person.id);
                  const isLocked = !person.accountActive;
                  const isDisabled = isExisting || isLocked;
                  const workload = getWorkload(person.id, data.assignments);
                  const personTeam = data.teams.find((t) => t.id === person.teamId);

                  return (
                    <div
                      key={person.id}
                      onClick={() => {
                        if (!isDisabled) {
                          handleToggleStaff(person.id);
                        }
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isDisabled
                          ? "bg-slate-50/70 border-slate-200 opacity-65 cursor-not-allowed"
                          : isSelected
                          ? "bg-teal-50/70 border-[#007A78] ring-1 ring-[#007A78] shadow-xs cursor-pointer"
                          : "bg-white border-slate-200 hover:border-teal-300 hover:bg-slate-50/50 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Checkbox
                          checked={isSelected || isExisting}
                          disabled={isDisabled}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (!isDisabled) {
                              handleToggleStaff(person.id);
                            }
                          }}
                          className="shrink-0"
                        />

                        <Avatar
                          variant="brand"
                          shape="circle"
                          size={38}
                          className="font-bold shrink-0 text-xs"
                        >
                          {person.name
                            .split(" ")
                            .slice(-2)
                            .map((w) => w[0])
                            .join("")}
                        </Avatar>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {person.name}
                            </span>
                            {isExisting && (
                              <Tag color="default" className="!m-0 text-[10px] font-medium">
                                Đã trong tổ
                              </Tag>
                            )}
                            {isLocked && (
                              <Tag color="error" className="!m-0 text-[10px] font-medium">
                                Tài khoản khóa
                              </Tag>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {person.title} ·{" "}
                            <span className="text-slate-700 font-medium">
                              {personTeam?.name}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {person.email} · {person.phone}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-2">
                        <Tag
                          color={
                            workload >= 4 ? "red" : workload >= 2 ? "gold" : "green"
                          }
                          className="!m-0 text-[11px] font-semibold"
                        >
                          {workload} việc
                        </Tag>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* KHỐI HIỂN THỊ TÓM TẮT CÁN BỘ ĐÃ CHỌN (NẾU CÓ) */}
          {selectedStaffList.length > 0 && (
            <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                  <CheckCircleFilled className="text-teal-600" />
                  Danh sách cán bộ đã chọn ({selectedStaffList.length})
                </span>
                <button
                  type="button"
                  onClick={handleClearAllSelected}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer underline"
                >
                  Xóa tất cả
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-0.5">
                {selectedStaffList.map((person) => {
                  const personTeam = data.teams.find((t) => t.id === person.teamId);
                  return (
                    <div
                      key={person.id}
                      className="flex items-center gap-2 bg-white border border-teal-200 rounded-lg px-2.5 py-1 shadow-2xs text-xs"
                    >
                      <Avatar
                        variant="brand"
                        shape="circle"
                        size={22}
                        className="font-bold text-[10px]"
                      >
                        {person.name
                          .split(" ")
                          .slice(-2)
                          .map((w) => w[0])
                          .join("")}
                      </Avatar>
                      <div>
                        <span className="font-bold text-slate-800">{person.name}</span>
                        <span className="text-[10px] text-slate-500 ml-1">
                          ({personTeam?.name || person.title})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSelected(person.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors ml-0.5 cursor-pointer"
                        title="Bỏ chọn cán bộ này"
                      >
                        <CloseOutlined className="text-[10px]" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
