import { useEffect, useMemo, useState } from "react";
import {
  AlertOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  CheckOutlined,
  CloseCircleFilled,
  CrownOutlined,
  ExclamationCircleFilled,
  InfoCircleOutlined,
  KeyOutlined,
  PlusCircleOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
  UndoOutlined,
  UserDeleteOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Drawer, Select, Tag, Text, Tooltip, toast } from "@/components/ui";
import { App } from "antd";
import { useAuthStore } from "@/stores/auth.store";
import type { AuthUser, Permission } from "@/types/auth";
import { cn } from "@/utils/cn";
import { formatDateVi } from "@/utils/date";
import { getInitials } from "@/utils/initials";
import { SYSTEM_ROLE_META } from "../constants/personnel-labels";
import { resolveStaffRbac } from "../utils/personnel-rbac";
import type {
  GrantActingDirectorInput,
  PersonnelDataset,
  PersonnelProject,
  Staff,
  StaffInput,
  TeamId,
} from "../types/personnel.types";

/** 1. Danh mục quyền ủy quyền điều hành theo từng Dự án phụ trách (Project-Level Delegation) */
export const PROJECT_DELEGATION_PERMISSIONS: Array<{
  code: string;
  name: string;
  description: string;
}> = [
  {
    code: "project.phase.assign",
    name: "Phân công nhiệm vụ theo giai đoạn",
    description: "Giao việc và chỉ định nhân viên tham gia theo từng giai đoạn dự án phụ trách",
  },
  {
    code: "project.progress.update",
    name: "Cập nhật tiến độ dự án hiện trường",
    description: "Cập nhật tiến độ thi công tuần, sản lượng, nhật ký và ảnh chụp công trình",
  },
  {
    code: "project.report.export",
    name: "Xuất báo cáo dự án",
    description: "Xuất phiếu giao việc, báo cáo tiến độ, khối lượng và hồ sơ dự án phụ trách",
  },
  {
    code: "project.team.manage",
    name: "Quản lý tổ công tác dự án",
    description: "Bổ nhiệm, sắp xếp và thêm bớt cán bộ trong tổ công tác dự án phụ trách",
  },
  {
    code: "project.member.urge",
    name: "Đôn đốc thành viên dự án",
    description: "Đôn đốc tiến độ công việc và gửi nhắc nhở tới các thành viên chậm tiến độ",
  },
];

export const PROJECT_DELEGATION_OPTIONS = PROJECT_DELEGATION_PERMISSIONS.map((perm) => ({
  value: perm.code,
  label: perm.name,
}));

/** 2. Danh mục quyền bổ sung phân hệ tài khoản (Account/Module-Level Permissions) */
export const MODULE_GRANTABLE_PERMISSIONS: Array<{
  code: string;
  name: string;
  module: string;
  description: string;
}> = [
  {
    code: "m7_bidding:approve",
    name: "Phê duyệt đấu thầu",
    module: "M7 - Đấu thầu",
    description: "Ký duyệt kế hoạch LCNT và kết quả lựa chọn nhà thầu",
  },
  {
    code: "m7_bidding:input",
    name: "Lập & Cập nhật gói thầu",
    module: "M7 - Đấu thầu",
    description: "Tạo gói thầu mới theo KHLCNT, cập nhật tiến độ 9 bước lựa chọn nhà thầu",
  },
  {
    code: "m7_bidding:configure",
    name: "Cấu hình quy trình đấu thầu",
    module: "M7 - Đấu thầu",
    description: "Chuẩn hóa danh mục tài liệu và thiết lập mốc thời hạn 9 bước LCNT",
  },
  {
    code: "m6_site_clearance:approve",
    name: "Phê duyệt phương án GPMB",
    module: "M6 - GPMB",
    description: "Phê duyệt các bước quan trọng (bước 9, 13, 15) bồi thường, hỗ trợ tái định cư",
  },
  {
    code: "m6_site_clearance:input",
    name: "Cập nhật hồ sơ hộ dân GPMB",
    module: "M6 - GPMB",
    description: "Cập nhật 16 bước GPMB từng hộ dân, đính kèm biểu mẫu M01-M09",
  },
  {
    code: "m6_site_clearance:configure",
    name: "Quản trị chính sách & biểu mẫu GPMB",
    module: "M6 - GPMB",
    description: "Thiết lập hệ số bồi thường và biểu mẫu chi trả tái định cư",
  },
  {
    code: "m4_finance_settlement:approve",
    name: "Phê duyệt giải ngân & quyết toán",
    module: "M4 - Tài chính",
    description: "Ký duyệt hồ sơ thanh toán, tờ trình Kho bạc Nhà nước và quyết toán dự án",
  },
  {
    code: "m4_finance_settlement:input",
    name: "Lập hồ sơ giải ngân & tạm ứng",
    module: "M4 - Tài chính",
    description: "Soạn thảo hồ sơ đề nghị tạm ứng, thanh toán khối lượng A-B",
  },
  {
    code: "m4_finance_settlement:view",
    name: "Tra cứu hồ sơ tài chính & giải ngân",
    module: "M4 - Tài chính",
    description: "Theo dõi kế hoạch vốn và tiến độ giải ngân KBNN",
  },
  {
    code: "m3_construction_procedures:configure",
    name: "Cấu hình quy trình thủ tục XDCB",
    module: "M3 - Thủ tục",
    description: "Cấu hình số bước và chuẩn hóa danh mục tài liệu quy trình thủ tục",
  },
  {
    code: "m8_warranty:configure",
    name: "Quản lý bảo lãnh & quỹ bảo hành",
    module: "M8 - Bảo hành",
    description: "Xử lý bảo lãnh, hoàn trả khi hết hạn hoặc thu hồi khi nhà thầu vi phạm",
  },
  {
    code: "legal_library:input",
    name: "Quản trị thư viện pháp lý + AI",
    module: "M9 - Pháp lý",
    description: "Đăng tải văn bản quy phạm pháp luật, biểu mẫu chuẩn vào thư viện AI",
  },
];

export const MODULE_GRANTABLE_OPTIONS = Array.from(
  new Set(MODULE_GRANTABLE_PERMISSIONS.map((p) => p.module))
).map((mod) => ({
  label: mod,
  title: mod,
  options: MODULE_GRANTABLE_PERMISSIONS.filter((p) => p.module === mod).map((perm) => ({
    value: perm.code,
    label: perm.name,
  })),
}));

/** Xuất tương thích ngược */
export const SYSTEM_GRANTABLE_PERMISSIONS = [
  ...PROJECT_DELEGATION_PERMISSIONS.map((p) => ({ ...p, module: "Ủy quyền Dự án" })),
  ...MODULE_GRANTABLE_PERMISSIONS,
];

export const GRANTABLE_PERMISSION_OPTIONS = [
  {
    label: "Ủy quyền Dự án",
    title: "Ủy quyền Dự án",
    options: PROJECT_DELEGATION_PERMISSIONS.map((p) => ({
      value: p.code,
      label: p.name,
    })),
  },
  ...MODULE_GRANTABLE_OPTIONS,
];

interface StaffProjectRoleModalProps {
  staff: Staff | null;
  data: PersonnelDataset;
  currentUser: AuthUser | null;
  canManageRole: boolean;
  onClose: () => void;
  onGrantRole?: (input: GrantActingDirectorInput) => Promise<boolean>;
  onRevokeRole?: (projectId: string) => Promise<boolean>;
  onUpdateStaff?: (staffId: string, input: Partial<StaffInput>) => Promise<boolean>;
  onUpdateProjectPermissions?: (projectId: string, grantedPermissions: string[]) => Promise<boolean>;
}

export default function StaffProjectRoleModal({
  staff,
  data,
  currentUser,
  canManageRole,
  onClose,
  onGrantRole,
  onRevokeRole,
  onUpdateStaff,
  onUpdateProjectPermissions,
}: StaffProjectRoleModalProps) {
  // Thăng chức / Điều chỉnh vai trò khi lên chức
  const [isPromoting, setIsPromoting] = useState(false);
  const [editRoleCode, setEditRoleCode] = useState(staff?.roleCode || "TECHNICAL_OFFICER");
  const [editTeamId, setEditTeamId] = useState<TeamId>(staff?.teamId || "GSKT");
  const [editIsLeader, setEditIsLeader] = useState<boolean>(false);
  const [savingStaff, setSavingStaff] = useState(false);

  // Quản lý quyền hạn tài khoản: Thu hồi (revoked) hoặc Cấp thêm phân hệ (custom)
  const [revokedPermCodes, setRevokedPermCodes] = useState<string[]>(staff?.revokedPermissions || []);
  const [customPermCodes, setCustomPermCodes] = useState<string[]>(
    (staff?.permissions || []).filter((p) => !p.startsWith("project."))
  );
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Các dự án mà cán bộ này phụ trách (Chủ nhiệm dự án hoặc Giám sát chính)
  const assignedProjects = useMemo(
    () =>
      data.projects.filter(
        (p) => p.mainExecutorId === staff?.id || p.actingDirectorId === staff?.id,
      ),
    [data.projects, staff?.id],
  );

  // Bản đồ quyền ủy quyền theo từng dự án: projectId -> string[]
  const [projectPermissionsMap, setProjectPermissionsMap] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    data.projects.forEach((p) => {
      if (p.grantedPermissions) {
        map[p.id] = [...p.grantedPermissions];
      } else if (p.actingDirectorId === staff?.id || (p.mainExecutorId === staff?.id && staff?.permissions?.length)) {
        map[p.id] = (staff?.permissions || []).filter((code) => code.startsWith("project."));
      } else {
        map[p.id] = [];
      }
    });
    return map;
  });

  // Dự án đang được chọn để cấu hình ủy quyền
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    return assignedProjects[0]?.id || "";
  });

  const { modal, message } = App.useApp();
  const [savingProjectPerms, setSavingProjectPerms] = useState(false);
  const [activeTab, setActiveTab] = useState<"user" | "project">("user");

  // Đồng bộ khi staff hoặc dataset thay đổi
  useEffect(() => {
    setRevokedPermCodes(staff?.revokedPermissions || []);
    setCustomPermCodes((staff?.permissions || []).filter((p) => !p.startsWith("project.")));

    const map: Record<string, string[]> = {};
    data.projects.forEach((p) => {
      if (p.grantedPermissions) {
        map[p.id] = [...p.grantedPermissions];
      } else if (p.actingDirectorId === staff?.id || (p.mainExecutorId === staff?.id && staff?.permissions?.length)) {
        map[p.id] = (staff?.permissions || []).filter((code) => code.startsWith("project."));
      } else {
        map[p.id] = [];
      }
    });
    setProjectPermissionsMap(map);

    if (assignedProjects.length > 0 && (!selectedProjectId || !assignedProjects.some((p) => p.id === selectedProjectId))) {
      setSelectedProjectId(assignedProjects[0].id);
    }
  }, [staff?.id, staff?.revokedPermissions, staff?.permissions, data.projects]);

  if (!staff) return null;

  const team = data.teams.find((t) => t.id === staff.teamId);
  const rbacProfile = resolveStaffRbac(staff, team, data.projects);

  // Dự án đang chọn cấu hình ủy quyền
  const currentProject =
    assignedProjects.find((p) => p.id === selectedProjectId) || assignedProjects[0] || null;

  // Gộp toàn bộ quyền hạn hệ thống & chuyên môn thành một danh sách thuần nhất
  const unifiedSystemPermissions = [
    ...rbacProfile.rolePermissions,
    ...rbacProfile.teamPermissions,
  ].filter((perm, idx, self) => idx === self.findIndex((p) => p.code === perm.code));

  // Kiểm tra thay đổi ở cấp tài khoản
  const hasStaffChanges = (() => {
    const origRevoked = new Set(staff.revokedPermissions || []);
    const currRevoked = new Set(revokedPermCodes);
    if (origRevoked.size !== currRevoked.size) return true;
    for (const c of currRevoked) {
      if (!origRevoked.has(c)) return true;
    }

    const origCustom = new Set((staff.permissions || []).filter((p) => !p.startsWith("project.")));
    const currCustom = new Set(customPermCodes);
    if (origCustom.size !== currCustom.size) return true;
    for (const c of currCustom) {
      if (!origCustom.has(c)) return true;
    }

    return false;
  })();

  // Kiểm tra thay đổi ở cấp từng dự án
  const hasProjectChanges = assignedProjects.some((p) => {
    const orig = new Set(p.grantedPermissions || []);
    const curr = new Set(projectPermissionsMap[p.id] || []);
    if (orig.size !== curr.size) return true;
    for (const c of curr) {
      if (!orig.has(c)) return true;
    }
    return false;
  });

  const hasPermissionChanges = hasStaffChanges || hasProjectChanges;

  const handleToggleRevoke = (permCode: string) => {
    setRevokedPermCodes((prev) =>
      prev.includes(permCode) ? prev.filter((c) => c !== permCode) : [...prev, permCode]
    );
  };

  const handleResetPermissions = () => {
    setRevokedPermCodes(staff.revokedPermissions || []);
    setCustomPermCodes((staff.permissions || []).filter((p) => !p.startsWith("project.")));

    const map: Record<string, string[]> = {};
    data.projects.forEach((p) => {
      if (p.grantedPermissions) {
        map[p.id] = [...p.grantedPermissions];
      } else {
        map[p.id] = [];
      }
    });
    setProjectPermissionsMap(map);
  };

  const [revokingProjectId, setRevokingProjectId] = useState<string | null>(null);

  const handleRevokeCnda = (proj: PersonnelProject) => {
    modal.confirm({
      width: 490,
      centered: true,
      icon: null,
      title: null,
      className:
        "[&_.ant-modal-content]:!rounded-2xl [&_.ant-modal-content]:!p-6 [&_.ant-modal-content]:!shadow-xl",
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-lg shadow-xs">
              <AlertOutlined />
            </span>
            <div className="pt-0.5">
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                Thu hồi quyền Chủ nhiệm dự án?
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Xác nhận rút quyền điều hành dự án của cán bộ
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 font-medium shrink-0">Dự án áp dụng:</span>
              <span className="font-semibold text-slate-800 text-right truncate" title={proj.name}>
                {proj.code} · {proj.name}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-xs border-t border-slate-200/70 pt-2">
              <span className="text-slate-500 font-medium shrink-0">Cán bộ thu hồi:</span>
              <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60">
                {staff.name}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-amber-50/80 border border-amber-200/80 p-3 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
            <InfoCircleOutlined className="text-amber-600 mt-0.5 shrink-0 text-sm" />
            <div>
              <strong className="font-semibold text-amber-950">Lưu ý:</strong> Sau khi thu hồi, đồng chí này sẽ không còn quyền điều hành, không thể phân công nhiệm vụ, quản lý tổ công tác hay đôn đốc tiến độ dự án này.
            </div>
          </div>
        </div>
      ),
      okText: "Thu hồi quyền CNDA",
      okButtonProps: {
        className:
          "!h-9 !px-5 !rounded-lg !font-semibold !bg-rose-600 hover:!bg-rose-700 !border-rose-600 !text-white !shadow-xs",
      },
      cancelText: "Đóng",
      cancelButtonProps: {
        className:
          "!h-9 !px-4 !rounded-lg !font-medium !text-slate-700 !border-slate-300 hover:!bg-slate-50 hover:!border-slate-400",
      },
      onOk: async () => {
        try {
          setRevokingProjectId(proj.id);
          const ok = await onRevokeRole?.(proj.id);
          if (ok) {
            toast.success(`Đã thu hồi quyền Chủ nhiệm dự án tại ${proj.name}`);
          }
        } finally {
          setRevokingProjectId(null);
        }
      },
    });
  };

  const handleRestoreCnda = (proj: PersonnelProject) => {
    modal.confirm({
      width: 490,
      centered: true,
      icon: null,
      title: null,
      className:
        "[&_.ant-modal-content]:!rounded-2xl [&_.ant-modal-content]:!p-6 [&_.ant-modal-content]:!shadow-xl",
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-[#0F4C81] text-lg shadow-xs">
              <SafetyCertificateOutlined />
            </span>
            <div className="pt-0.5">
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                Cấp lại quyền Chủ nhiệm dự án?
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Khôi phục lại toàn quyền điều hành công trình cho cán bộ
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 font-medium shrink-0">Dự án áp dụng:</span>
              <span className="font-semibold text-slate-800 text-right truncate" title={proj.name}>
                {proj.code} · {proj.name}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-xs border-t border-slate-200/70 pt-2">
              <span className="text-slate-500 font-medium shrink-0">Cán bộ cấp lại:</span>
              <span className="font-bold text-[#0F4C81] bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                {staff.name}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/80 p-3 text-xs text-emerald-900 leading-relaxed flex items-start gap-2.5">
            <CheckOutlined className="text-emerald-600 mt-0.5 shrink-0 text-sm" />
            <div>
              <strong className="font-semibold text-emerald-950">Xác nhận:</strong> Cán bộ sẽ được kích hoạt lại toàn quyền quản lý tổ công tác, phân công nhiệm vụ và đôn đốc tiến độ dự án.
            </div>
          </div>
        </div>
      ),
      okText: "Cấp lại quyền CNDA",
      okButtonProps: {
        className:
          "!h-9 !px-5 !rounded-lg !font-semibold !bg-[#0F4C81] hover:!bg-[#0D3F6C] !border-[#0F4C81] !text-white !shadow-xs",
      },
      cancelText: "Đóng",
      cancelButtonProps: {
        className:
          "!h-9 !px-4 !rounded-lg !font-medium !text-slate-700 !border-slate-300 hover:!bg-slate-50 hover:!border-slate-400",
      },
      onOk: async () => {
        try {
          setRevokingProjectId(proj.id);
          const ok = await onGrantRole?.({
            projectId: proj.id,
            staffId: staff.id,
            assignedBy: currentUser?.name || "Ban Giám đốc",
            note: "Ban Giám đốc khôi phục quyền Chủ nhiệm dự án.",
          });
          if (ok) {
            toast.success(`Đã khôi phục quyền Chủ nhiệm dự án tại ${proj.name}`);
          }
        } finally {
          setRevokingProjectId(null);
        }
      },
    });
  };

  // Cập nhật quyền ủy quyền cho một dự án cụ thể trong state
  const handleChangeProjectPermissions = (projectId: string, newPerms: string[]) => {
    setProjectPermissionsMap((prev) => ({
      ...prev,
      [projectId]: newPerms,
    }));
  };

  // Lưu quyền riêng cho dự án đang chọn
  const handleSaveCurrentProject = async () => {
    if (!currentProject || !onUpdateProjectPermissions) return;
    setSavingProjectPerms(true);
    try {
      const perms = projectPermissionsMap[currentProject.id] || [];
      const ok = await onUpdateProjectPermissions(currentProject.id, perms);
      if (ok) {
        toast.success(`Đã lưu quyền ủy quyền cho dự án "${currentProject.name}" thành công!`);
      }
    } finally {
      setSavingProjectPerms(false);
    }
  };

  // Lưu phân quyền tài khoản (Quyền hệ thống & Phân hệ được cấp thêm)
  const handleSaveStaffPermissions = async () => {
    if (!onUpdateStaff) return;
    setSavingPermissions(true);
    try {
      const ok = await onUpdateStaff(staff.id, {
        permissions: customPermCodes,
        revokedPermissions: revokedPermCodes,
      });

      if (ok) {
        toast.success(`Đã lưu cấu hình phân quyền cho cán bộ ${staff.name} thành công!`);

        if (
          currentUser &&
          (currentUser.id === staff.id ||
            (currentUser.email && staff.email && currentUser.email.toLowerCase() === staff.email.toLowerCase()))
        ) {
          const updatedPerms = new Set(currentUser.permissions || []);
          customPermCodes.forEach((p) => updatedPerms.add(p as Permission));
          revokedPermCodes.forEach((p) => updatedPerms.delete(p as Permission));
          useAuthStore.getState().updateUser({
            permissions: Array.from(updatedPerms),
          });
        }
      }
    } finally {
      setSavingPermissions(false);
    }
  };

  // Lưu toàn bộ phân quyền (cả tài khoản lẫn tất cả các dự án đã thay đổi)
  const handleSaveAllPermissions = async () => {
    setSavingPermissions(true);
    try {
      let staffSuccess = true;
      if (hasStaffChanges && onUpdateStaff) {
        staffSuccess = await onUpdateStaff(staff.id, {
          permissions: customPermCodes,
          revokedPermissions: revokedPermCodes,
        });
      }

      let projectSuccess = true;
      if (onUpdateProjectPermissions) {
        for (const proj of assignedProjects) {
          const orig = new Set(proj.grantedPermissions || []);
          const curr = new Set(projectPermissionsMap[proj.id] || []);
          let changed = orig.size !== curr.size;
          if (!changed) {
            for (const c of curr) {
              if (!orig.has(c)) {
                changed = true;
                break;
              }
            }
          }
          if (changed) {
            const ok = await onUpdateProjectPermissions(proj.id, projectPermissionsMap[proj.id] || []);
            if (!ok) projectSuccess = false;
          }
        }
      }

      if (staffSuccess && projectSuccess) {
        toast.success("Cập nhật và áp dụng toàn bộ phân quyền cho cán bộ và các dự án thành công!");

        if (
          currentUser &&
          (currentUser.id === staff.id ||
            (currentUser.email && staff.email && currentUser.email.toLowerCase() === staff.email.toLowerCase()))
        ) {
          const updatedPerms = new Set(currentUser.permissions || []);
          customPermCodes.forEach((p) => updatedPerms.add(p as Permission));
          revokedPermCodes.forEach((p) => updatedPerms.delete(p as Permission));
          useAuthStore.getState().updateUser({
            permissions: Array.from(updatedPerms),
          });
        }
      }
    } finally {
      setSavingPermissions(false);
    }
  };

  // Lưu thông tin thăng chức / điều chỉnh chức vụ khi viên chức lên chức
  const handleSavePromotion = async () => {
    if (!onUpdateStaff) return;
    setSavingStaff(true);
    try {
      const derivedTitle =
        editRoleCode === "ADMIN"
          ? "Giám đốc"
          : editRoleCode === "DEPUTY_DIRECTOR"
          ? "Phó Giám đốc"
          : editIsLeader
          ? "Tổ trưởng"
          : SYSTEM_ROLE_META[editRoleCode]?.label || staff.title;

      const ok = await onUpdateStaff(staff.id, {
        title: derivedTitle,
        roleCode: editRoleCode,
        teamId: editTeamId,
        isLeader: editIsLeader,
      });
      if (ok) {
        setIsPromoting(false);
        toast.success(`Đã cập nhật vai trò & phân công tổ của cán bộ ${staff.name} thành công!`);
      }
    } finally {
      setSavingStaff(false);
    }
  };

  return (
    <Drawer
      open={Boolean(staff)}
      onClose={onClose}
      width="min(680px, 100vw)"
      footer={
        <div className="flex items-center justify-end px-2 py-1">
          <Button intent="outline" scale="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      }
      title={
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-800">
                Phân quyền cán bộ: {staff.name}
              </span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
                {staff.title}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Quyền hệ thống & chuyên môn · Ủy quyền riêng theo từng dự án
            </div>
          </div>
        </div>
      }
    >
      {/* 1. HỒ SƠ CÁN BỘ & THĂNG CHỨC KHI VIÊN CHỨC LÊN CHỨC */}
      <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar variant="brand" shape="circle" size={44} className="font-semibold text-xs shrink-0">
              {getInitials(staff.name)}
            </Avatar>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Text className="text-sm font-semibold text-slate-900">{staff.name}</Text>
                <Tag scale="sm" intent={rbacProfile.isLeader || rbacProfile.roleCode === "DIRECTOR" ? "brand" : "subtle"}>
                  {rbacProfile.displayBadge}
                </Tag>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {staff.title} · {team?.name}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {staff.citizenId ? `CCCD: ${staff.citizenId} · ` : ""}SĐT: {staff.phone} · Email: {staff.email}
              </div>
            </div>
          </div>

          {canManageRole && onUpdateStaff && (
            <Button
              intent="outline"
              scale="compact"
              onClick={() => {
                const nextState = !isPromoting;
                setIsPromoting(nextState);
                if (nextState) {
                  setEditRoleCode(staff.roleCode);
                  setEditTeamId(staff.teamId);
                  setEditIsLeader(team?.leaderId === staff.id);
                }
              }}
              className="shrink-0 text-xs"
            >
              {isPromoting ? "Đóng" : "Đổi chức vụ / Thăng chức"}
            </Button>
          )}
        </div>

        {/* Khung Thăng chức / Điều chỉnh vai trò khi viên chức lên chức */}
        {isPromoting && (
          <div className="mt-3.5 pt-3.5 border-t border-slate-100 bg-slate-50/70 p-3 rounded-lg space-y-3">
            <div className="text-xs font-semibold text-slate-800">
              Điều chỉnh vai trò hệ thống, Tổ chuyên môn & Vị trí lãnh đạo:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Tổ / Bộ phận:
                </label>
                <Select
                  value={editTeamId}
                  onChange={(val) => {
                    const nextTeamId = val as TeamId;
                    setEditTeamId(nextTeamId);
                    const targetTeam = data.teams.find((t) => t.id === nextTeamId);
                    setEditIsLeader(targetTeam?.leaderId === staff.id);
                  }}
                  className="w-full text-xs"
                  options={data.teams.map((t) => ({
                    value: t.id,
                    label: `${t.name} (${t.id})`,
                  }))}
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Vai trò hệ thống:
                </label>
                <Select
                  value={editRoleCode}
                  onChange={setEditRoleCode}
                  className="w-full text-xs"
                  options={Object.entries(SYSTEM_ROLE_META).map(([code, meta]) => ({
                    value: code,
                    label: meta.label,
                  }))}
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Vị trí trong tổ:
                </label>
                <Select
                  value={editIsLeader ? "LEADER" : "MEMBER"}
                  onChange={(val) => setEditIsLeader(val === "LEADER")}
                  className="w-full text-xs"
                  options={[
                    { value: "MEMBER", label: "Thành viên tổ" },
                    {
                      value: "LEADER",
                      label: editTeamId === "BGD" ? "Lãnh đạo Ban (Giám đốc / PGĐ)" : "Tổ trưởng / Phụ trách tổ (Lead)",
                    },
                  ]}
                />
              </div>
            </div>

            {editIsLeader && (
              <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-xs text-amber-800">
                <CrownOutlined className="text-amber-600 shrink-0" />
                <span>
                  Cán bộ sẽ là <strong>Phụ trách / Tổ trưởng</strong> của <strong>{data.teams.find((t) => t.id === editTeamId)?.name}</strong>.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                intent="primary"
                scale="compact"
                loading={savingStaff}
                onClick={handleSavePromotion}
              >
                Lưu thay đổi
              </Button>
              <Button scale="compact" onClick={() => setIsPromoting(false)}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 2. CHUYỂN ĐỔI 2 MỤC PHÂN QUYỀN A | B */}
      <div className="mb-4 flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("user")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer",
            activeTab === "user"
              ? "bg-white text-[#0F4C81] shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <span>Quyền hạn Người dùng</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("project")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer",
            activeTab === "project"
              ? "bg-white text-[#0F4C81] shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <span>Quyền hạn Dự án</span>
          {hasProjectChanges && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Có thay đổi chưa lưu" />
          )}
        </button>
      </div>

      {/* NỘI DUNG MỤC A: QUYỀN HẠN NGƯỜI DÙNG (TÀI KHOẢN) */}
      {activeTab === "user" && (
        <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="mb-1 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <SafetyCertificateOutlined className="text-slate-700 text-base" />
              <Text className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Quyền hạn hệ thống & Nghiệp vụ chuyên môn
              </Text>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
              {unifiedSystemPermissions.length} quyền khả dụng
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mb-3.5">
            Toàn bộ quyền hạn phân hệ được cấp tự động theo vị trí công tác và vai trò của cán bộ trong hệ thống.
          </div>

          {/* Danh sách quyền hệ thống & chuyên môn thống nhất */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {unifiedSystemPermissions.map((perm) => (
              <div
                key={perm.code}
                className="flex items-center gap-2.5 rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 text-xs hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                <CheckCircleFilled className="text-emerald-600 text-sm shrink-0" />
                <span className="font-medium text-xs text-slate-800 leading-snug">
                  {perm.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NỘI DUNG MỤC B: QUYỀN HẠN DỰ ÁN */}
      {activeTab === "project" && (
        <div className="space-y-5">
          {/* 3. ỦY QUYỀN ĐIỀU HÀNH THEO TỪNG DỰ ÁN PHỤ TRÁCH */}
          <div id="project-delegation-section" className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 shadow-2xs">
        <div className="mb-2 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Text className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Ủy quyền điều hành theo từng Dự án phụ trách
            </Text>
          </div>
        </div>

        {assignedProjects.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-200 bg-white/70 p-3.5 text-center text-xs text-slate-500">
            Cán bộ này hiện chưa được phân công phụ trách công trình nào. Hãy chỉ định cán bộ vào dự án trước khi ủy quyền.
          </div>
        ) : (
          <div className="space-y-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            {/* Bước 1: Chọn dự án */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                1. Chọn Dự án cần phân quyền / ủy quyền:
              </label>
              <Select
                value={selectedProjectId}
                onChange={(val) => setSelectedProjectId(val)}
                className="w-full text-xs"
                options={assignedProjects.map((p) => {
                  const isMain = p.mainExecutorId === staff.id;
                  const permsCount = (projectPermissionsMap[p.id] || []).length;
                  return {
                    value: p.id,
                    label: `${p.code} - ${p.name} (${isMain ? "Chủ nhiệm DA" : "Giám sát chính"} · Đã cấp ${permsCount} quyền)`,
                  };
                })}
              />
            </div>

            {/* Bước 2: Chọn quyền cho dự án đã chọn */}
            {currentProject && (
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                  <label className="text-xs font-bold text-slate-800">
                    2. Quyền ủy quyền cấp cho dự án:{" "}
                    <span className="text-[#0F4C81] font-semibold">{currentProject.code} - {currentProject.name}</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    ({(projectPermissionsMap[currentProject.id] || []).length} quyền đã chọn)
                  </span>
                </div>

                <Select
                  mode="multiple"
                  showSearch
                  allowClear
                  disabled={!canManageRole}
                  placeholder={`Chọn các quyền ủy quyền cho dự án ${currentProject.name}...`}
                  value={projectPermissionsMap[currentProject.id] || []}
                  onChange={(newPerms) => handleChangeProjectPermissions(currentProject.id, newPerms as string[])}
                  options={PROJECT_DELEGATION_OPTIONS}
                  maxTagCount="responsive"
                  className="w-full text-xs mb-2"
                />

                {/* Danh sách các quyền ủy quyền đã chọn của dự án này */}
                {(projectPermissionsMap[currentProject.id] || []).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2 max-h-48 overflow-y-auto">
                    {(projectPermissionsMap[currentProject.id] || []).map((code) => {
                      const perm = PROJECT_DELEGATION_PERMISSIONS.find((p) => p.code === code);
                      return (
                        <div
                          key={code}
                          className="flex items-start justify-between gap-2 rounded-md border border-slate-200 bg-slate-50/60 p-2 text-xs"
                        >
                          <div className="flex items-start gap-1.5 min-w-0 flex-1">
                            <CheckCircleOutlined className="text-slate-400 mt-0.5 shrink-0 text-xs" />
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 text-xs">
                                {perm?.name || code}
                              </div>
                            </div>
                          </div>
                          {canManageRole && (
                            <button
                              type="button"
                              onClick={() => {
                                const curr = projectPermissionsMap[currentProject.id] || [];
                                handleChangeProjectPermissions(currentProject.id, curr.filter((c) => c !== code));
                              }}
                              className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                              title="Bỏ quyền này"
                            >
                              <CloseCircleFilled className="text-xs" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/80 py-2 px-3 text-center text-[11px] text-slate-500">
                    Chưa chọn quyền ủy quyền nào cho dự án này. Hãy chọn từ danh sách trên để ủy quyền điều hành cho Chủ nhiệm dự án.
                  </div>
                )}

                {/* Nút lưu quyền riêng cho dự án này */}
                {canManageRole && onUpdateProjectPermissions && (
                  <div className="flex items-center justify-end gap-2 pt-2.5 mt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-500">
                      Lưu cấu hình quyền ủy quyền chỉ áp dụng riêng cho công trình này:
                    </span>
                    <Button
                      intent="primary"
                      scale="compact"
                      loading={savingProjectPerms}
                      onClick={handleSaveCurrentProject}
                    >
                      <SaveOutlined /> Lưu quyền cho dự án này
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. DANH SÁCH DỰ ÁN PHỤ TRÁCH & QUYỀN ỦY QUYỀN THEO DỰ ÁN */}
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <Text className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Dự án phụ trách ({assignedProjects.length})
          </Text>
          <span className="text-[11px] text-slate-500">
            Chi tiết phân công & Bộ quyền ủy quyền đã cấp tại từng dự án
          </span>
        </div>

        {assignedProjects.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
            Cán bộ này hiện chưa phụ trách công trình nào.
          </div>
        ) : (
          <div className="space-y-2.5">
            {assignedProjects.map((proj) => {
              const isMain = proj.mainExecutorId === staff.id;
              const isSupervisor = proj.mainSupervisorId === staff.id;
              const projectPerms = projectPermissionsMap[proj.id] || proj.grantedPermissions || [];
              const isSelectedForEdit = selectedProjectId === proj.id;

              return (
                <div
                  key={proj.id}
                  className={cn(
                    "rounded-lg border p-3.5 transition-all shadow-2xs",
                    isSelectedForEdit
                      ? "border-[#0F4C81] bg-slate-50/60 ring-1 ring-[#0F4C81]/30 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Tiêu đề, Mã dự án & Trạng thái */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-slate-800">{proj.code}</span>
                        <span className="text-slate-300">·</span>
                        <Text className="text-xs font-semibold text-slate-900">{proj.name}</Text>
                        {proj.status && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 font-medium border border-slate-200">
                            {proj.status}
                          </span>
                        )}
                      </div>

                      {/* Phân công vai trò */}
                      <div className="mt-2 text-xs text-slate-600">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-700">Vai trò phân công:</span>
                            {isMain && (
                              <span
                                className={cn(
                                  "rounded px-2 py-0.5 text-[11px] font-bold border",
                                  proj.cndaRevoked
                                    ? "bg-rose-50 text-rose-800 border-rose-200"
                                    : "bg-slate-100 text-slate-700 border-slate-200"
                                )}
                              >
                                {proj.cndaRevoked
                                  ? "Người thực hiện chính (Đã thu hồi quyền CNDA)"
                                  : "Người thực hiện chính (Chủ nhiệm dự án)"}
                              </span>
                            )}
                            {isSupervisor && !isMain && (
                              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200">
                                Người giám sát chính
                              </span>
                            )}
                            {proj.assignedAt && (
                              <span className="text-[11px] text-slate-400">
                                · Phân công ngày {formatDateVi(proj.assignedAt)}
                              </span>
                            )}
                          </div>

                          {/* Nút Thu hồi / Khôi phục quyền CNDA cho Người thực hiện chính */}
                          {canManageRole && isMain && (
                            <div className="shrink-0">
                              {proj.cndaRevoked ? (
                                <Button
                                  size="small"
                                  className="text-xs text-[#0F4C81] border-slate-300 hover:bg-slate-50"
                                  icon={<SafetyCertificateOutlined />}
                                  loading={revokingProjectId === proj.id}
                                  onClick={() => handleRestoreCnda(proj)}
                                >
                                  Cấp lại quyền CNDA
                                </Button>
                              ) : (
                                <Button
                                  size="small"
                                  danger
                                  icon={<UserDeleteOutlined />}
                                  className="text-xs"
                                  loading={revokingProjectId === proj.id}
                                  onClick={() => handleRevokeCnda(proj)}
                                >
                                  Thu hồi quyền CNDA
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                        {proj.note && (
                          <div className="text-[11px] text-slate-500 mt-1 italic">
                            Ghi chú: {proj.note}
                          </div>
                        )}
                      </div>

                      {/* Quyền ủy quyền trên dự án này */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100">
                        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <KeyOutlined className="text-slate-500 text-xs" />
                            <span className="text-xs font-bold text-slate-800">
                              Quyền ủy quyền trên dự án này ({projectPerms.length}):
                            </span>
                          </div>
                          {canManageRole && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProjectId(proj.id);
                                const el = document.getElementById("project-delegation-section");
                                el?.scrollIntoView({ behavior: "smooth", block: "center" });
                              }}
                              className="text-[11px] font-medium text-[#0F4C81] hover:underline cursor-pointer"
                            >
                              {isSelectedForEdit ? "✓ Đang chọn sửa ở trên" : "Chỉnh sửa quyền dự án này →"}
                            </button>
                          )}
                        </div>

                        {projectPerms.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {projectPerms.map((code) => {
                              const perm = PROJECT_DELEGATION_PERMISSIONS.find((p) => p.code === code);
                              return (
                                <Tooltip key={code} title={perm?.description || code}>
                                  <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200">
                                    <CheckCircleOutlined className="text-slate-400 text-[10px]" />
                                    {perm?.name || code}
                                  </span>
                                </Tooltip>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic">
                            Chưa cấp quyền ủy quyền đặc cách trên dự án này.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>
      )}
    </Drawer>
  );
}
