"use client";

import React, { useEffect, useState } from "react";
import {
  ApartmentOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CrownOutlined,
  IdcardOutlined,
  MailOutlined,
  ProjectOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Drawer,
  Tag,
  Text,
} from "@/components/ui";
import { getInitials } from "@/utils/initials";
import type {
  PersonnelDataset,
  PersonnelProject,
  Staff,
  Team,
} from "../types/personnel.types";
import type { CustomFieldDefinition } from "../types/custom-fields.types";
import { getCustomFields } from "../utils/custom-fields-storage";

interface StaffDetailDrawerProps {
  open: boolean;
  staff: Staff | null;
  data: PersonnelDataset;
  onClose: () => void;
}

export default function StaffDetailDrawer({
  open,
  staff,
  data,
  onClose,
}: StaffDetailDrawerProps) {
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDefinition[]>([]);

  useEffect(() => {
    if (open) {
      setCustomFieldDefs(getCustomFields("staff"));
    }
  }, [open]);

  if (!staff) return null;

  const team = data.teams.find((t) => t.id === staff.teamId);
  const isLeader = team?.leaderId === staff.id;

  // Danh sách dự án cán bộ tham gia (chủ nhiệm, giám sát chính, hoặc tham gia giai đoạn)
  const relatedProjects: { project: PersonnelProject; roleText: string }[] = [];
  for (const proj of data.projects) {
    if (proj.mainExecutorId === staff.id) {
      relatedProjects.push({ project: proj, roleText: "Người thực hiện chính" });
    } else if (proj.mainSupervisorId === staff.id) {
      relatedProjects.push({ project: proj, roleText: "Người giám sát chính" });
    }
  }

  // Các trường customFields có giá trị
  const populatedCustomFields = customFieldDefs.filter((def) => {
    const val = staff.customFields?.[def.name];
    return val !== undefined && val !== null && val !== "";
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      destroyOnClose
      width="min(680px, 100vw)"
      className="[&_.ant-drawer-header]:py-3 [&_.ant-drawer-body]:p-4 [&_.ant-drawer-footer]:py-2.5"
      title={
        <div>
          <Text className="text-base font-bold text-[#102A43]">
            Hồ sơ cán bộ: {staff.name}
          </Text>
          <Text className="block text-xs font-normal text-slate-500">
            Thông tin nhân sự thuộc cơ cấu tổ chức Ban Quản lý
          </Text>
        </div>
      }
      footer={
        <div className="flex items-center justify-end px-1 py-1">
          <Button intent="outline" scale="compact" onClick={onClose}>
            Đóng
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Card 1: Tổng quan nhân sự */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <Avatar
              variant="brand"
              shape="circle"
              size={52}
              className="font-bold text-sm shrink-0 bg-gradient-to-br from-[#DC2626] to-[#991B1B] text-white shadow-xs"
            >
              {getInitials(staff.name)}
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Text className="text-base font-bold text-slate-900">
                  {staff.name}
                </Text>
                {isLeader && team?.id === "BGD" && (
                  <Tag intent="brand" scale="sm" className="font-semibold">
                    <CrownOutlined className="mr-1" /> Trưởng ban
                  </Tag>
                )}
                {isLeader && team?.id !== "BGD" && team?.id !== "PGD" && (
                  <Tag intent="brand" scale="sm" className="font-semibold">
                    <CrownOutlined className="mr-1" /> Phụ trách tổ
                  </Tag>
                )}
                {staff.accountActive ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-300">
                    <CheckCircleOutlined className="text-[10px] text-amber-600" /> Hoạt động
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200/70">
                    <CloseCircleOutlined className="text-[10px]" /> Tạm khóa
                  </span>
                )}
              </div>

              <div className="text-xs font-medium text-slate-700 mt-1">
                {staff.title} · <span className="text-[#0F4C81] font-semibold">{team?.name || "Chưa phân tổ"}</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5">
                  <MailOutlined className="text-slate-400 text-[11px]" />
                  <span className="text-slate-700">{staff.email || "—"}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Thông tin chi tiết cá nhân & vị trí công tác */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200/70 pb-2">
            <span className="text-xs font-bold text-slate-800">
              Thông tin cá nhân & vị trí công tác
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-white p-2.5 border border-slate-200/70">
              <span className="text-[11px] text-slate-400 block mb-0.5">Họ và tên cán bộ:</span>
              <strong className="text-slate-800">{staff.name}</strong>
            </div>

            <div className="rounded-lg bg-white p-2.5 border border-slate-200/70">
              <span className="text-[11px] text-slate-400 block mb-0.5">Email công vụ:</span>
              <span className="font-mono text-slate-800">{staff.email || "—"}</span>
            </div>

            <div className="rounded-lg bg-white p-2.5 border border-slate-200/70">
              <span className="text-[11px] text-slate-400 block mb-0.5">Phòng ban / Tổ chuyên môn:</span>
              <strong className="text-slate-800">{team?.name || "—"}</strong>
            </div>

            <div className="rounded-lg bg-white p-2.5 border border-slate-200/70">
              <span className="text-[11px] text-slate-400 block mb-0.5">Vị trí / Chức vụ đảm nhiệm:</span>
              <strong className="text-slate-800">{staff.title || "—"}</strong>
            </div>

            <div className="rounded-lg bg-white p-2.5 border border-slate-200/70">
              <span className="text-[11px] text-slate-400 block mb-0.5">Hình thức tuyển dụng:</span>
              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                {staff.employment}
              </span>
            </div>

            <div className="rounded-lg bg-white p-2.5 border border-slate-200/70">
              <span className="text-[11px] text-slate-400 block mb-0.5">Giới tính:</span>
              <span className="font-medium text-slate-800">{staff.gender || "Chưa rõ"}</span>
            </div>

            <div className="rounded-lg bg-white p-2.5 border border-slate-200/70 sm:col-span-2">
              <span className="text-[11px] text-slate-400 block mb-0.5">Ngày tháng năm sinh:</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                <CalendarOutlined className="text-slate-400" />
                {staff.dob || "Chưa cập nhật"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Thông tin tùy biến (Nếu có) */}
        {populatedCustomFields.length > 0 && (
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200/70 pb-2">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-200/80 text-slate-700">
                <ApartmentOutlined className="text-xs" />
              </span>
              <span className="text-xs font-bold text-slate-800">
                Thông tin bổ sung (Tùy biến)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {populatedCustomFields.map((field) => (
                <div
                  key={field.id}
                  className={`rounded-lg bg-white p-2.5 border border-slate-200/70 ${
                    field.type === "textarea" ? "sm:col-span-2" : ""
                  }`}
                >
                  <span className="text-[11px] text-slate-400 block mb-0.5">
                    {field.label}:
                  </span>
                  <strong className="text-slate-800">
                    {String(staff.customFields?.[field.name])}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Card 4: Dự án đang tham gia phụ trách */}
        {relatedProjects.length > 0 && (
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Dự án phụ trách ({relatedProjects.length})
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {relatedProjects.map(({ project, roleText }) => (
                <div
                  key={project.id}
                  className="rounded-lg bg-white p-3 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-800">
                        [{project.code}] {project.name}
                      </span>
                      {project.status && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-medium text-slate-600 border border-slate-200">
                          {project.status}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Vai trò: <strong className="text-[#0F4C81]">{roleText}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
