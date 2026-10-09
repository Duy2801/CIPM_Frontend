"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CrownOutlined,
  DeleteOutlined,
  KeyOutlined,
  ProjectOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import {
  Button,
  Drawer,
  Select,
  Text,
  toast,
} from "@/components/ui";
import type { AuthUser } from "@/types/auth";
import { cn } from "@/utils/cn";
import type {
  PersonnelDataset,
  PersonnelProject,
} from "../types/personnel.types";
import { PROJECT_DELEGATION_PERMISSIONS } from "./StaffProjectRoleModal";

interface ProjectPermissionsModalProps {
  open: boolean;
  initialProjectId?: string;
  data: PersonnelDataset;
  currentUser: AuthUser | null;
  canManageRole: boolean;
  onClose: () => void;
  onUpdateProjectPermissions?: (
    projectId: string,
    grantedPermissions: string[]
  ) => Promise<boolean>;
}

// Danh sách phẳng chỉ 5 quyền dự án, không có gợi ý phân hệ/màn hình nào
const PROJECT_PERMISSION_OPTIONS = PROJECT_DELEGATION_PERMISSIONS.map((perm) => ({
  value: perm.code,
  label: perm.name,
}));

export default function ProjectPermissionsModal({
  open,
  initialProjectId,
  data,
  currentUser,
  canManageRole,
  onClose,
  onUpdateProjectPermissions,
}: ProjectPermissionsModalProps) {
  // 1. Dự án đang chọn
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    return initialProjectId || data.projects[0]?.id || "";
  });

  useEffect(() => {
    if (initialProjectId) {
      setSelectedProjectId(initialProjectId);
    } else if (!selectedProjectId && data.projects.length > 0) {
      setSelectedProjectId(data.projects[0].id);
    }
  }, [initialProjectId, data.projects, selectedProjectId]);

  const activeProject = useMemo(() => {
    return data.projects.find((p) => p.id === selectedProjectId);
  }, [data.projects, selectedProjectId]);

  // CNDA / Người thực hiện chính của dự án
  const cndaStaff = useMemo(() => {
    if (!activeProject) return undefined;
    const staffId =
      activeProject.actingDirectorId || activeProject.mainExecutorId;
    return staffId ? data.staff.find((s) => s.id === staffId) : undefined;
  }, [activeProject, data.staff]);

  const hasCnda = Boolean(activeProject?.mainExecutorId);

  // 2. Danh sách quyền ủy quyền hiện tại của dự án
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Khởi tạo quyền từ dự án khi đổi dự án
  useEffect(() => {
    if (activeProject) {
      if (activeProject.grantedPermissions) {
        setSelectedPermissions([...activeProject.grantedPermissions]);
      } else if (cndaStaff && (cndaStaff.permissions || []).length > 0) {
        setSelectedPermissions(
          (cndaStaff.permissions || []).filter((p) => p.startsWith("project."))
        );
      } else {
        // Mặc định cấp toàn bộ 5 quyền ủy quyền dự án nếu chưa thiết lập
        setSelectedPermissions(
          PROJECT_DELEGATION_PERMISSIONS.map((p) => p.code)
        );
      }
    } else {
      setSelectedPermissions([]);
    }
  }, [activeProject, cndaStaff]);

  // Kiểm tra quyền có thay đổi so với dữ liệu gốc không
  const hasChanges = useMemo(() => {
    if (!activeProject) return false;
    const orig = new Set(activeProject.grantedPermissions || []);
    const curr = new Set(selectedPermissions);
    if (orig.size !== curr.size) return true;
    for (const code of curr) {
      if (!orig.has(code)) return true;
    }
    return false;
  }, [activeProject, selectedPermissions]);

  // Thao tác toggle quyền
  const togglePermission = (code: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSelectAll = () => {
    setSelectedPermissions(PROJECT_DELEGATION_PERMISSIONS.map((p) => p.code));
  };

  const handleDeselectAll = () => {
    setSelectedPermissions([]);
  };

  // Lưu quyền ủy quyền cho dự án
  const handleSave = async () => {
    if (!activeProject || !onUpdateProjectPermissions) return;
    setSaving(true);
    try {
      const ok = await onUpdateProjectPermissions(
        activeProject.id,
        selectedPermissions
      );
      if (ok) {
        toast.success(
          "Cập nhật thành công",
          `Đã lưu cấu hình cấp quyền cho dự án [${activeProject.code}] ${activeProject.name}.`
        );
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="min(680px, 100vw)"
      closable={false}
      destroyOnHidden
      title={
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-[#007A78] border border-teal-200">
            <KeyOutlined className="text-base" />
          </span>
          <div>
            <div className="text-base font-bold text-slate-900 leading-snug">
              Cấp quyền điều hành dự án
            </div>
            <div className="text-xs text-slate-500 font-normal">
              Ủy quyền quản lý, phân công và điều hành cho Chủ nhiệm dự án (CNDA)
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-2 px-1 py-1">
          <Button intent="outline" scale="sm" onClick={onClose}>
            Đóng
          </Button>
          {canManageRole && hasCnda && (
            <Button
              intent="primary"
              scale="sm"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={handleSave}
              className="!bg-[#007A78] hover:!bg-[#006361] !text-white font-semibold"
            >
              Lưu quyền dự án
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* 1. Chọn dự án cần cấp quyền */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 space-y-2">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <ProjectOutlined className="text-teal-700" />
            1. Chọn dự án cần cấu hình quyền:
          </label>
          <Select
            showSearch
            optionFilterProp="label"
            value={selectedProjectId}
            onChange={(val) => setSelectedProjectId(val)}
            className="w-full text-xs"
            placeholder="Tìm và chọn dự án..."
            options={data.projects.map((p) => {
              const exec = data.staff.find((s) => s.id === p.mainExecutorId);
              const permsCount = (p.grantedPermissions || []).length;
              return {
                value: p.id,
                label: `${p.code} - ${p.name} (${
                  exec ? `CNDA: ${exec.name}` : "Chưa có CNDA"
                } · ${permsCount} quyền)`,
              };
            })}
          />
        </div>

        {/* 2. Danh mục Quyền Ủy Quyền Điều Hành Dự Án */}
        {activeProject && hasCnda && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div>
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <CrownOutlined className="text-[#007A78]" />
                  2. Danh mục quyền ủy quyền điều hành dự án:
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Tích chọn các quyền mà Ban Giám đốc ủy quyền cho Chủ nhiệm dự án thực hiện
                </div>
              </div>
            </div>

            {/* Ô/Nút Chọn quyền (chỉ hiển thị 5 quyền dự án, không có gợi ý phân hệ/màn hình) */}
            <div className="space-y-1.5 rounded-lg border border-teal-200/90 bg-teal-50/40 p-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <KeyOutlined className="text-[#007A78]" />
                  Chọn quyền cấp cho Chủ nhiệm dự án:
                </label>
                <span className="text-[11px] font-semibold text-teal-800 bg-white px-2 py-0.5 rounded border border-teal-200 shadow-2xs">
                  {selectedPermissions.length} quyền đã chọn
                </span>
              </div>
              <Select
                mode="multiple"
                showSearch
                allowClear
                placeholder="Chọn quyền ủy quyền điều hành dự án..."
                value={selectedPermissions}
                onChange={(newPerms) => setSelectedPermissions(newPerms as string[])}
                options={PROJECT_PERMISSION_OPTIONS}
                maxTagCount="responsive"
                className="w-full text-xs"
              />
            </div>

            {/* Danh sách các quyền ĐÃ ĐƯỢC CHỌN (chỉ hiện khi được chọn, có nút thùng rác, không có ô tích) */}
            {selectedPermissions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center text-xs text-slate-500">
                Chưa có quyền nào được chọn. Hãy chọn quyền từ ô trên để ủy quyền điều hành cho dự án này.
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                {selectedPermissions.map((code) => {
                  const perm = PROJECT_DELEGATION_PERMISSIONS.find((p) => p.code === code);
                  if (!perm) return null;
                  return (
                    <div
                      key={perm.code}
                      className="flex items-start justify-between gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/60 shadow-2xs hover:border-slate-300 transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {perm.name}
                          </span>
                          <code className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1 py-0.2 rounded">
                            {perm.code}
                          </code>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                          {perm.description}
                        </div>
                      </div>

                      {/* Nút thùng rác để xóa quyền */}
                      <button
                        type="button"
                        onClick={() => togglePermission(perm.code)}
                        className="shrink-0 p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Xóa quyền này khỏi danh sách cấp"
                      >
                        <DeleteOutlined className="text-sm" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Trường hợp dự án chưa phân công CNDA */}
        {activeProject && !hasCnda && (
          <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/70 p-6 text-center text-xs text-amber-800">
            Dự án này chưa được phân công Chủ nhiệm dự án. Vui lòng bấm nút <strong>&quot;Phân công lãnh đạo DA&quot;</strong> để chỉ định trước khi cấp quyền.
          </div>
        )}
      </div>
    </Drawer>
  );
}
