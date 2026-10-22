import { useEffect, useMemo, useState } from "react";
import {
  CrownOutlined,
  InfoCircleOutlined,
  LockOutlined,
  ProjectOutlined,
  RollbackOutlined,
  SafetyCertificateOutlined,
  UnlockOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { App } from "antd";
import {
  Avatar,
  Button,
  Drawer,
  Modal,
  Select,
  Text,
  Tooltip,
  toast,
} from "@/components/ui";
import { SegmentedTabs } from "@/components/workspace";
import type { SegmentedTabItem } from "@/components/workspace";
import type { AuthUser } from "@/types/auth";
import { cn } from "@/utils/cn";
import { getInitials } from "@/utils/initials";
import { resolveStaffRbac } from "../utils/personnel-rbac";
import { isStaffTitleLocked, useLockedTitles } from "../hooks/useLockedTitles";
import RoleAdjustPanel from "./RoleAdjustPanel";
import StaffInfoCard from "./StaffInfoCard";
import StaffPermissionPanel from "./StaffPermissionPanel";
import StaffActivityHistory from "./StaffActivityHistory";
import type {
  GrantActingDirectorInput,
  PersonnelDataset,
  PersonnelProject,
  Staff,
  StaffInput,
  TeamId,
} from "../types/personnel.types";
import { useConfirmAction } from "../hooks/useConfirmAction";

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

type StaffDetailTab = "info" | "role" | "cnda";

interface StaffProjectRoleModalProps {
  staff: Staff | null;
  data: PersonnelDataset;
  currentUser: AuthUser | null;
  canManageRole: boolean;
  onClose: () => void;
  onGrantRole?: (input: GrantActingDirectorInput) => Promise<boolean>;
  onRevokeRole?: (projectId: string, customMessage?: string | false) => Promise<boolean>;
  onUpdateStaff?: (staffId: string, input: Partial<StaffInput>, customMessage?: string | false) => Promise<boolean>;
  onUpdateProjectPermissions?: (projectId: string, grantedPermissions: string[]) => Promise<boolean>;
  onLockAccount?: (person: Staff) => void;
  onUnlockAccount?: (person: Staff) => void;
  /** Cho phép sửa trực tiếp thông tin cá nhân (lưu qua onUpdateStaff) */
  canEditInfo?: boolean;
  initialPromoting?: boolean;
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
  onLockAccount,
  onUnlockAccount,
  canEditInfo = false,
  initialPromoting = false,
}: StaffProjectRoleModalProps) {
  const { modal } = App.useApp();
  const confirmAction = useConfirmAction();
  // Thăng chức / Điều chỉnh vai trò khi lên chức
  const [isPromoting, setIsPromoting] = useState(Boolean(initialPromoting));
  const [editTeamId, setEditTeamId] = useState<TeamId>(staff?.teamId || "GSKT");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [savingStaff, setSavingStaff] = useState(false);
  const [revokingProjectId, setRevokingProjectId] = useState<string | null>(null);

  useEffect(() => {
    setIsPromoting(Boolean(initialPromoting));
  }, [initialPromoting, staff?.id]);


  // Tab đang xem trong drawer; mở cán bộ khác thì quay về tab thông tin cá nhân
  const lockedTitles = useLockedTitles();
  const [activeTab, setActiveTab] = useState<StaffDetailTab>("info");
  const [tabStaffId, setTabStaffId] = useState(staff?.id);
  if (staff?.id !== tabStaffId) {
    setTabStaffId(staff?.id);
    setActiveTab("info");
  }

  // Đồng bộ lại phòng ban đang chọn khi staff thay đổi
  useEffect(() => {
    if (staff?.teamId) {
      setEditTeamId(staff.teamId);
    }
  }, [staff?.id, staff?.teamId]);

  if (!staff) return null;

  const team = data.teams.find((t) => t.id === staff.teamId);
  // Chức danh đang tắt → tài khoản tạm không có quyền (cán bộ vẫn giữ chức danh; bật lại thì có lại quyền)
  const titleLocked = isStaffTitleLocked(staff.title, lockedTitles);
  const rbacProfile = resolveStaffRbac(staff, team, data.projects, titleLocked);

  // Dự án cán bộ được Giám đốc phân công thực hiện / giám sát chính
  const relatedProjects: { project: PersonnelProject; roleText: string }[] = [];
  for (const proj of data.projects) {
    if (proj.mainExecutorId === staff.id) {
      relatedProjects.push({ project: proj, roleText: "Người thực hiện chính" });
    } else if (proj.mainSupervisorId === staff.id) {
      relatedProjects.push({ project: proj, roleText: "Người giám sát chính" });
    }
  }

  // Kiểm tra cán bộ có đang giữ vai trò nâng cao hay đã là thành viên cơ bản (Thành viên)
  const isBasicMember = useMemo(() => {
    if (!staff) return true;
    const isLead = Boolean(rbacProfile.isLeader) || team?.leaderId === staff.id;
    const isElevatedRole =
      staff.roleCode === "ADMIN" ||
      staff.roleCode === "DIRECTOR" ||
      staff.roleCode === "DEPUTY_DIRECTOR" ||
      staff.roleCode === "CHIEF_ACCOUNTANT";
    const hasElevatedTitle =
      /trưởng|phó|giám đốc|chủ nhiệm|lead/i.test(staff.title);
    const hasActingProjects = rbacProfile.actingDirectorProjects.length > 0;

    return !isLead && !isElevatedRole && !hasElevatedTitle && !hasActingProjects;
  }, [staff, team?.leaderId, rbacProfile.actingDirectorProjects.length, rbacProfile.isLeader]);

  // Thu hồi quyền CNDA theo từng dự án
  const handleRevokeCnda = (projId: string, projName: string) => {
    if (!onRevokeRole) return;

    modal.confirm({
      width: 480,
      centered: true,
      icon: null,
      title: null,
      className:
        "[&_.ant-modal-content]:!rounded-2xl [&_.ant-modal-content]:!p-6 [&_.ant-modal-content]:!shadow-xl",
      content: (
        <div className="space-y-3.5">
          <div className="flex items-start gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 text-amber-600 text-lg shadow-xs">
              <RollbackOutlined />
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
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 space-y-1.5 text-xs text-slate-700">
            <div>
              Dự án: <strong className="text-slate-900">{projName}</strong>
            </div>
            <div>
              Cán bộ: <strong className="text-slate-900">{staff.name}</strong>
            </div>
          </div>
        </div>
      ),
      okText: "Thu hồi quyền CNDA",
      okButtonProps: {
        className: "!bg-rose-600 hover:!bg-rose-700 !border-rose-600 !text-white",
      },
      cancelText: "Hủy",
      onOk: async () => {
        setRevokingProjectId(projId);
        try {
          await onRevokeRole(projId, `Đã thu hồi quyền CNDA tại dự án "${projName}"!`);
        } finally {
          setRevokingProjectId(null);
        }
      },
    });
  };

  // Gộp toàn bộ quyền hạn hệ thống & chuyên môn thành một danh sách thuần nhất
  const unifiedSystemPermissions = [
    ...rbacProfile.rolePermissions,
    ...rbacProfile.teamPermissions,
  ].filter((perm, idx, self) => idx === self.findIndex((p) => p.code === perm.code));

  // Danh sách các vai trò / vị trí CHỈ thuộc phòng ban đang chọn (editTeamId)
  const departmentRoles = useMemo(() => {
    const targetTeam = data.teams.find((t) => t.id === editTeamId);

    // 1. Nếu phòng ban là Ban Giám đốc (BGD)
    if (editTeamId === "BGD") {
      const rolesList =
        targetTeam?.roles && targetTeam.roles.length > 0
          ? targetTeam.roles
          : ["Giám đốc", "Thư ký Ban Giám đốc"];
      return rolesList.map((r, idx) => {
        const isAdmin = /giám đốc/i.test(r) && !/phó|thư ký/i.test(r);
        return {
          id: `ROLE_BGD_${idx}`,
          roleCode: isAdmin ? "ADMIN" : "ADMINISTRATIVE_OFFICER",
          title: r,
          isLeader: isAdmin,
          label: r + (isAdmin ? " (Trưởng ban)" : ""),
        };
      });
    }

    // 2. Nếu phòng ban là Ban Phó Giám đốc (PGD)
    if (editTeamId === "PGD") {
      const rolesList =
        targetTeam?.roles && targetTeam.roles.length > 0
          ? targetTeam.roles
          : ["Phó Giám đốc"];
      return rolesList.map((r, idx) => ({
        id: `ROLE_PGD_${idx}`,
        roleCode: "DEPUTY_DIRECTOR",
        title: r,
        isLeader: true,
        label: `${r} BQL`,
      }));
    }

    // 3. Nếu phòng ban có cấu hình roles/vị trí riêng (targetTeam.roles)
    if (targetTeam?.roles && targetTeam.roles.length > 0) {
      const inactiveSet = new Set((targetTeam.inactiveRoles || []).map((r) => r.trim().toLowerCase()));
      return targetTeam.roles
        .filter((r) => {
          const trimmed = r.trim();
          if (!trimmed) return false;
          // Nếu role bị khóa và staff hiện tại không giữ chức danh này thì ẩn
          if (inactiveSet.has(trimmed.toLowerCase()) && staff?.title !== trimmed) return false;
          return true;
        })
        .map((r, idx) => {
        const isLead = idx === 0 || /trưởng|lead|chủ nhiệm|phụ trách/i.test(r);
        let roleCode = "TECHNICAL_OFFICER";
        if (isLead) {
          roleCode =
            editTeamId === "HCTH"
              ? "CHIEF_ACCOUNTANT"
              : editTeamId === "BT"
              ? "COMPENSATION_OFFICER"
              : "TECHNICAL_OFFICER";
        } else if (/kế toán|tài chính/i.test(r)) {
          roleCode = /trưởng/i.test(r) ? "CHIEF_ACCOUNTANT" : "ACCOUNTANT";
        } else if (/bồi thường|gpmb|giải tỏa|tái định cư/i.test(r)) {
          roleCode = "COMPENSATION_OFFICER";
        } else if (/hành chính|văn thư|tổng hợp/i.test(r)) {
          roleCode = "ADMINISTRATIVE_OFFICER";
        }

        return {
          id: `ROLE_${editTeamId}_${idx}`,
          roleCode,
          title: r,
          isLeader: isLead,
          label: r + (isLead && !r.toLowerCase().includes("lead") && !r.toLowerCase().includes("trưởng") ? " (Lead)" : ""),
        };
      });
    }

    // 4. Các tổ chuẩn mặc định nếu chưa cấu hình riêng
    if (editTeamId === "BT") {
      return [
        {
          id: "ROLE_BT_LEAD",
          roleCode: "COMPENSATION_OFFICER",
          title: "Tổ trưởng Bồi thường – GPMB",
          isLeader: true,
          label: "Tổ trưởng Bồi thường – GPMB (Lead)",
        },
        {
          id: "ROLE_BT_MEMBER",
          roleCode: "COMPENSATION_OFFICER",
          title: "Chuyên viên Bồi thường – GPMB",
          isLeader: false,
          label: "Chuyên viên Bồi thường – GPMB",
        },
      ];
    }

    if (editTeamId === "HCTH") {
      return [
        {
          id: "ROLE_HCTH_LEAD",
          roleCode: "CHIEF_ACCOUNTANT",
          title: "Tổ trưởng Hành chính – Tổng hợp",
          isLeader: true,
          label: "Tổ trưởng Hành chính – Tổng hợp (Lead)",
        },
        {
          id: "ROLE_HCTH_CHIEF_ACC",
          roleCode: "CHIEF_ACCOUNTANT",
          title: "Kế toán trưởng",
          isLeader: false,
          label: "Kế toán trưởng",
        },
        {
          id: "ROLE_HCTH_ACC",
          roleCode: "ACCOUNTANT",
          title: "Kế toán viên",
          isLeader: false,
          label: "Kế toán viên (Tài chính)",
        },
        {
          id: "ROLE_HCTH_ADMIN",
          roleCode: "ADMINISTRATIVE_OFFICER",
          title: "Chuyên viên Hành chính – Tổng hợp",
          isLeader: false,
          label: "Chuyên viên Hành chính – Tổng hợp",
        },
      ];
    }

    // Mặc định GSKT hoặc các tổ kỹ thuật
    return [
      {
        id: "ROLE_GSKT_LEAD",
        roleCode: "TECHNICAL_OFFICER",
        title: "Tổ trưởng Giám sát",
        isLeader: true,
        label: "Tổ trưởng Giám sát (Lead)",
      },
      {
        id: "ROLE_GSKT_TECH",
        roleCode: "TECHNICAL_OFFICER",
        title: "Kỹ sư Giám sát – Kỹ thuật",
        isLeader: false,
        label: "Kỹ sư Kỹ thuật – Giám sát",
      },
      {
        id: "ROLE_GSKT_MEMBER",
        roleCode: "TECHNICAL_OFFICER",
        title: "Thành viên",
        isLeader: false,
        label: "Thành viên",
      },
    ];
  }, [editTeamId, data.teams]);

  // Luôn đồng bộ selectedRoleId khi thay đổi phòng ban
  useEffect(() => {
    if (departmentRoles.length > 0) {
      const isLead = team?.leaderId === staff.id;
      const matchedByTitle = departmentRoles.find(
        (r) => r.title.toLowerCase().trim() === staff.title?.toLowerCase().trim()
      );
      if (matchedByTitle) {
        setSelectedRoleId(matchedByTitle.id);
        return;
      }
      const matchedByRoleAndLeader = departmentRoles.find(
        (r) => r.roleCode === staff.roleCode && r.isLeader === isLead
      );
      if (matchedByRoleAndLeader) {
        setSelectedRoleId(matchedByRoleAndLeader.id);
        return;
      }
      const matchedByRole = departmentRoles.find((r) => r.roleCode === staff.roleCode);
      if (matchedByRole) {
        setSelectedRoleId(matchedByRole.id);
        return;
      }
      setSelectedRoleId(departmentRoles[0].id);
    }
  }, [departmentRoles, staff.title, staff.roleCode, staff.id, team?.leaderId]);

  // Lưu thông tin thăng chức / điều chỉnh chức vụ khi viên chức lên chức
  const handleSavePromotion = async () => {
    if (!onUpdateStaff) return;
    if (
      !(await confirmAction({
        title: `Cập nhật chức danh & phòng ban của ${staff.name}?`,
        okText: "Lưu thay đổi",
      }))
    )
      return;
    setSavingStaff(true);
    try {
      const activeRole = departmentRoles.find((r) => r.id === selectedRoleId) || departmentRoles[0];
      const ok = await onUpdateStaff(
        staff.id,
        {
          title: activeRole.title,
          roleCode: activeRole.roleCode,
          teamId: editTeamId,
          isLeader: Boolean(activeRole.isLeader),
        },
        `Đã cập nhật chức danh & phòng ban của cán bộ ${staff.name} thành công!`
      );
      if (ok) {
        setIsPromoting(false);
        onClose();
      }
    } finally {
      setSavingStaff(false);
    }
  };

  const canChangeTitle = canManageRole && Boolean(onUpdateStaff);
  const hasCndaProjects = rbacProfile.actingDirectorProjects.length > 0;
  const tabItems: SegmentedTabItem<StaffDetailTab>[] = [
    { key: "info", icon: <UserOutlined />, label: "Thông tin cá nhân" },
    { key: "role", icon: <SafetyCertificateOutlined />, label: "Chức danh & quyền hạn" },
    ...(hasCndaProjects
      ? [
          {
            key: "cnda" as const,
            icon: <ProjectOutlined />,
            label: "Quyền CNDA",
            badge: rbacProfile.actingDirectorProjects.length,
            badgeTone: "warning" as const,
          },
        ]
      : []),
  ];
  // Tab đang chọn không còn (VD: vừa thu hồi hết quyền CNDA) → quay về tab đầu
  const currentTab = tabItems.some((t) => t.key === activeTab) ? activeTab : "info";

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
            <span className="font-bold text-sm text-slate-800">Hồ sơ & phân quyền</span>
            <div className="text-xs text-slate-500 mt-0.5">
              Thông tin cá nhân, quyền hệ thống & nghiệp vụ chuyên môn
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
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {staff.title || "Chưa có chức danh"} · {team?.name}
                {titleLocked && (
                  <Tooltip title="Chức danh đang tắt: tài khoản tạm không có quyền, cán bộ vẫn giữ chức danh">
                    <span className="ml-1.5 inline-block cursor-help whitespace-nowrap rounded border border-amber-200 bg-amber-50 px-1.5 text-[11px] text-amber-700">
                      Chức danh đang tắt
                    </span>
                  </Tooltip>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Email: {staff.email}
              </div>
            </div>
          </div>

          {/* Khóa / Mở lại tài khoản cán bộ */}
          <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
            {onLockAccount && (
              staff.accountActive ? (
                <Button
                  intent="outline"
                  scale="compact"
                  onClick={() => onLockAccount(staff)}
                  icon={<LockOutlined />}
                  className="!border-rose-200 !text-rose-700 hover:!border-rose-400 hover:!bg-rose-50 text-xs"
                >
                  Khóa tài khoản
                </Button>
              ) : (
                <Button
                  intent="primary"
                  scale="compact"
                  onClick={() => onUnlockAccount && onUnlockAccount(staff)}
                  icon={<UnlockOutlined />}
                  className="!bg-amber-600 !border-amber-600 hover:!bg-amber-700 text-white text-xs font-semibold"
                >
                  Mở lại tài khoản
                </Button>
              )
            )}
          </div>
        </div>

        {/* Khung Thăng chức / Điều chỉnh vai trò khi viên chức lên chức */}
        {isPromoting && (
          <div className="mt-3.5 pt-3.5 border-t border-slate-100 bg-slate-50/70 p-3.5 rounded-lg space-y-3">
            <div className="text-xs font-semibold text-slate-800">
              Điều chỉnh chức danh & phòng ban:
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
                  Chức danh:
                </label>
                <Select
                  value={selectedRoleId}
                  onChange={(val) => setSelectedRoleId(val)}
                  className="w-full text-xs"
                  options={departmentRoles.map((r) => ({
                    value: r.id,
                    label: (
                      <div className="flex items-center gap-1.5">
                        {r.isLeader ? (
                          <CrownOutlined className={editTeamId === "BGD" ? "text-red-500" : editTeamId === "PGD" ? "text-blue-500" : "text-amber-500"} />
                        ) : (
                          <UserOutlined className="text-slate-400" />
                        )}
                        <span className={r.isLeader ? "font-semibold text-slate-900" : "text-slate-700"}>
                          {r.label}
                        </span>
                      </div>
                    ),
                  }))}
                />
              </div>
            </div>

            {(() => {
              const activeRole = departmentRoles.find((r) => r.id === selectedRoleId);
              if (activeRole?.isLeader) {
                return (
                  <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-xs text-amber-800">
                    <CrownOutlined className="text-amber-600 shrink-0" />
                    <span>
                      Cán bộ sẽ là <strong>{activeRole.title}</strong> của <strong>{data.teams.find((t) => t.id === editTeamId)?.name}</strong>.
                    </span>
                  </div>
                );
              }
              return null;
            })()}

            <div className="flex items-center justify-between gap-2 pt-1">
              <Button
                intent="primary"
                scale="compact"
                loading={savingStaff}
                onClick={handleSavePromotion}
                className="!bg-[#0F4C81] hover:!bg-[#0b3b64] !border-[#0F4C81] text-white text-xs font-semibold px-4"
              >
                Lưu thay đổi
              </Button>
              <Button scale="compact" onClick={() => setIsPromoting(false)} className="text-xs font-semibold px-4">
                Đóng
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* THANH TAB: Thông tin cá nhân / Chức danh & quyền hạn / Quyền CNDA */}
      {!isPromoting && (
        <SegmentedTabs className="mb-4" activeKey={currentTab} onChange={setActiveTab} items={tabItems} />
      )}

      {/* 2. THÔNG TIN CÁ NHÂN & VỊ TRÍ CÔNG TÁC (sửa trực tiếp trên thẻ) */}
      {!isPromoting && currentTab === "info" && (
        <StaffInfoCard
          key={`info-${staff.id}`}
          staff={staff}
          team={team}
          teams={data.teams}
          relatedProjects={relatedProjects}
          onSave={canEditInfo ? onUpdateStaff : undefined}
        />
      )}
      {/* Lịch sử thao tác: thay đổi trên hồ sơ + việc cán bộ đã thực hiện */}
      {!isPromoting && currentTab === "info" && <StaffActivityHistory key={`history-${staff.id}`} staff={staff} />}

      {/* 2b. CHỨC DANH (mỗi cán bộ một chức danh) + QUYỀN HẠN theo chức danh, cùng một tab */}
      {!isPromoting && currentTab === "role" && canChangeTitle && onUpdateStaff && (
        <div className="mb-4">
          <RoleAdjustPanel key={`roles-${staff.id}`} staff={staff} data={data} onUpdateStaff={onUpdateStaff} />
        </div>
      )}
      {!isPromoting && currentTab === "role" && (
        // Quyền theo chức danh + chỉnh quyền riêng cán bộ này (người có quyền quản lý chức danh mới chỉnh được)
        <StaffPermissionPanel
          key={`perms-${staff.id}`}
          staff={staff}
          basePermissions={unifiedSystemPermissions}
          onUpdateStaff={canChangeTitle ? onUpdateStaff : undefined}
        />
      )}

      {/* 4. DỰ ÁN ĐƯỢC ỦY QUYỀN ĐIỀU HÀNH (QUYỀN CNDA) NẾU CÓ */}
      {!isPromoting && currentTab === "cnda" && hasCndaProjects && (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50/30 p-4 shadow-2xs">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Text className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                Dự án được ủy quyền điều hành (Quyền CNDA)
              </Text>
            </div>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded border border-amber-300/60">
              {rbacProfile.actingDirectorProjects.length} dự án
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mb-3">
            Cán bộ đang được giao giữ Quyền Chủ nhiệm dự án (CNDA) tại các dự án dưới đây:
          </div>

          <div className="space-y-2">
            {rbacProfile.actingDirectorProjects.map((proj) => (
              <div
                key={proj.id}
                className="flex items-center justify-between gap-3 p-3 bg-white rounded-lg border border-amber-200/70 shadow-xs"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    [{proj.code}] {proj.name}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Ủy quyền bởi: {proj.assignedBy} {proj.assignedAt ? `· Ngày cấp: ${proj.assignedAt}` : ""}
                  </div>
                </div>

                {canManageRole && onRevokeRole && (
                  <Button
                    intent="outline"
                    scale="compact"
                    loading={revokingProjectId === proj.id}
                    onClick={() => handleRevokeCnda(proj.id, proj.name)}
                    className="shrink-0 !border-rose-200 !text-rose-600 hover:!border-rose-400 hover:!bg-rose-50 text-xs"
                  >
                    Thu hồi quyền CNDA
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </Drawer>
  );
}
