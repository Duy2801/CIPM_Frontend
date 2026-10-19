"use client";

import { useEffect, useMemo, useState } from "react";
import type { CustomFieldDefinition } from "../types/custom-fields.types";
import { getCustomFields, subscribeCustomFieldsChange } from "../utils/custom-fields-storage";
import {
  AppstoreOutlined,
  EditOutlined,
  LockOutlined,
  RollbackOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SettingOutlined,
  UnlockOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { App } from "antd";
import {
  Button,
  Card,
  Flex,
  Input,
  Modal,
  Pagination,
  Table,
  Tag,
  Text,
  Tooltip,
  toast,
} from "@/components/ui";
import type { ColumnsType } from "@/components/ui";
import { cn } from "@/utils/cn";
import { SectionIntro } from "@/components/workspace";
import { SYSTEM_ROLE_META } from "../constants/personnel-labels";
import { useRoleMatrix } from "../hooks/useRoleMatrix";
import type { PersonnelController } from "../hooks/usePersonnelAssignment";
import type { PersonnelDataset, PersonnelProject, Staff, Team } from "../types/personnel.types";
import StaffModal from "./StaffModal";
import RolePermissionMatrixModal from "./RolePermissionMatrixModal";
import ConfigureCustomFieldsModal from "./ConfigureCustomFieldsModal";
import StaffProjectRoleModal from "./StaffProjectRoleModal";
import GrantRoleModal from "./GrantRoleModal";
import RevokeRoleDrawer from "./RevokeRoleDrawer";
import ChangeRoleDrawer from "./ChangeRoleDrawer";

interface AccountsTabProps {
  controller: PersonnelController;
  onLockAccount: (person: Staff) => void;
}

const PAGE_SIZE = 10;

function loadAllCustomRolesMap(): Map<string, string> {
  const map = new Map<string, string>();
  if (typeof window === "undefined") return map;

  const storageKeys = [
    "cipm_custom_roles_matrix_v3",
    "cipm_custom_roles_matrix_v2",
    "cipm_custom_roles_matrix",
    "cipm_custom_roles",
    "cipm_roles",
  ];

  for (const k of storageKeys) {
    try {
      const raw = window.localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            const code = item.code || item.id;
            const name = item.name || item.title || item.label || item.shortName;
            if (code && name) {
              map.set(String(code).trim(), String(name).trim());
            }
          });
        }
      }
    } catch {
      // ignore
    }
  }

  return map;
}

function getStaffDisplayRoles(
  staff: Staff,
  rolesMap: Map<string, string>,
  teams: Team[],
  projects: PersonnelProject[]
): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  const resolveText = (text: string): string => {
    let clean = text.trim();
    if (!clean) return "";

    // Nếu mã trùng khớp trong từ điển vai trò tùy chỉnh
    if (rolesMap.has(clean)) {
      return rolesMap.get(clean)!;
    }

    // Nếu chứa mã CUSTOM_\d+ thì thay thế bằng tên thật
    if (/CUSTOM_\d+/i.test(clean)) {
      clean = clean.replace(/CUSTOM_\d+/gi, (matched) => {
        return rolesMap.get(matched) || "Vai trò tùy chỉnh";
      });
    }

    // Nếu trùng mã hệ thống
    if (SYSTEM_ROLE_META[clean]) {
      return SYSTEM_ROLE_META[clean].label;
    }

    return clean;
  };

  const addRole = (roleStr: string) => {
    const resolved = resolveText(roleStr);
    if (!resolved) return;
    const key = resolved.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(resolved);
    }
  };

  // 1. Lấy danh sách các vai trò từ staff.title (ngăn cách bởi dấu ·, ;, hoặc xuống dòng)
  const rawTitle = (staff.title || "").trim();
  if (rawTitle) {
    const parts = rawTitle
      .split(/\s*·\s*|\s*;\s*|\r?\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    parts.forEach((p) => addRole(p));
  }

  // 2. Nếu cán bộ được gán vai trò tùy chỉnh qua roleCode (dạng CUSTOM_...)
  if (staff.roleCode) {
    const rCode = staff.roleCode.trim();
    if (/CUSTOM_\d+/i.test(rCode)) {
      const customName = rolesMap.get(rCode) || "Vai trò tùy chỉnh";
      // Nếu hiện tại chỉ có chức danh mặc định "Tổ viên", ưu tiên thay thế bằng tên vai trò mới
      if (result.length === 1 && result[0].toLowerCase() === "tổ viên") {
        result[0] = customName;
        seen.clear();
        seen.add(customName.toLowerCase().trim());
      } else if (!seen.has(customName.toLowerCase().trim())) {
        addRole(customName);
      }
    }
  }

  // 3. Nếu cán bộ là Quyền Chủ nhiệm dự án (ủy quyền thực tế từ các dự án)
  const actingProjects = projects.filter((p) => p.actingDirectorId === staff.id);
  actingProjects.forEach((proj) => {
    const actingTitle = `Quyền CNDA (${proj.code})`;
    if (!result.some((r) => r.toLowerCase().includes("quyền cnda") || r.toLowerCase().includes("quyền chủ nhiệm"))) {
      addRole(actingTitle);
    }
  });

  // 4. Fallback trường hợp chưa có vai trò nào
  if (result.length === 0) {
    if (staff.title) {
      addRole(staff.title);
    } else if (staff.roleCode && SYSTEM_ROLE_META[staff.roleCode]) {
      addRole(SYSTEM_ROLE_META[staff.roleCode].label);
    } else {
      addRole("Thành viên");
    }
  }

  return result;
}

function hasGrantedRole(staff: Staff, data: PersonnelDataset): boolean {
  if (staff.roleCode === "ADMIN") return false;

  const team = data.teams.find((t) => t.id === staff.teamId);
  const isTeamLead = team?.leaderId === staff.id;
  if (isTeamLead) return true;

  if (staff.roleCode === "DEPUTY_DIRECTOR" || staff.roleCode === "CHIEF_ACCOUNTANT") {
    return true;
  }

  const titleLower = (staff.title || "").toLowerCase().trim();
  const isBasicTitle =
    !titleLower ||
    titleLower === "tổ viên" ||
    titleLower === "thành viên" ||
    titleLower === "thành viên tổ";

  if (!isBasicTitle) {
    return true;
  }

  const hasActingProject = data.projects.some((p) => p.actingDirectorId === staff.id);
  if (hasActingProject) {
    return true;
  }

  return false;
}

export default function AccountsTab({ controller, onLockAccount }: AccountsTabProps) {
  const { modal } = App.useApp();
  const { data, staff, permissions } = controller;
  const { roles: matrixRoles } = useRoleMatrix();
  const [customRolesMap, setCustomRolesMap] = useState<Map<string, string>>(() => loadAllCustomRolesMap());

  useEffect(() => {
    const handleUpdate = () => {
      setCustomRolesMap(loadAllCustomRolesMap());
    };
    handleUpdate();
    if (typeof window !== "undefined") {
      window.addEventListener("cipm-roles-updated", handleUpdate);
      window.addEventListener("storage", handleUpdate);
      return () => {
        window.removeEventListener("cipm-roles-updated", handleUpdate);
        window.removeEventListener("storage", handleUpdate);
      };
    }
  }, []);

  const resolvedRolesMap = useMemo(() => {
    const map = new Map<string, string>(customRolesMap);
    matrixRoles.forEach((r) => {
      if (r.code && r.name) {
        map.set(r.code, r.name);
      }
    });
    return map;
  }, [customRolesMap, matrixRoles]);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [matrixModalOpen, setMatrixModalOpen] = useState(false);
  const [configFieldsModalOpen, setConfigFieldsModalOpen] = useState(false);
  const [configuredStaffFields, setConfiguredStaffFields] = useState<CustomFieldDefinition[]>([]);
  const [selectedStaffForRole, setSelectedStaffForRole] = useState<Staff | null>(null);
  const [openInEditRole, setOpenInEditRole] = useState(false);
  const [staffForGrantRole, setStaffForGrantRole] = useState<Staff | null>(null);
  const [staffForChangeRole, setStaffForChangeRole] = useState<Staff | null>(null);
  const [staffForRevokeRole, setStaffForRevokeRole] = useState<Staff | null>(null);

  useEffect(() => {
    setConfiguredStaffFields(getCustomFields("staff"));
    return subscribeCustomFieldsChange((target, fields) => {
      if (target === "staff") setConfiguredStaffFields(fields);
    });
  }, []);



  const confirmUnlock = (person: Staff) => {
    modal.confirm({
      width: 460,
      centered: true,
      icon: null,
      title: null,
      className:
        "[&_.ant-modal-content]:!rounded-2xl [&_.ant-modal-content]:!p-6 [&_.ant-modal-content]:!shadow-xl",
      content: (
        <div className="space-y-3.5">
          <div className="flex items-start gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-amber-600 text-lg shadow-xs">
              <UnlockOutlined />
            </span>
            <div className="pt-0.5">
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                Mở lại tài khoản cán bộ?
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Khôi phục quyền truy cập hệ thống cho cán bộ
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs text-slate-700 leading-relaxed">
            Cán bộ <strong className="text-slate-900">{person.name}</strong> sẽ có thể đăng nhập lại vào hệ thống với vai trò <strong className="text-[#0F4C81]">{resolvedRolesMap.get(person.roleCode) || SYSTEM_ROLE_META[person.roleCode]?.label || person.title || "Cán bộ"}</strong>.
          </div>
        </div>
      ),
      okText: "Mở tài khoản",
      okButtonProps: {
        className:
          "!h-9 !px-5 !rounded-lg !font-semibold !bg-amber-600 hover:!bg-amber-700 !border-amber-600 !text-white !shadow-xs",
      },
      cancelText: "Đóng",
      cancelButtonProps: {
        className:
          "!h-9 !px-4 !rounded-lg !font-medium !text-slate-700 !border-slate-300 hover:!bg-slate-50",
      },
      onOk: () => controller.unlockAccount(person.id),
    });
  };

  const filteredStaff = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter((person) => {
      const teamName = data.teams.find((t) => t.id === person.teamId)?.name ?? "";
      return (
        person.name.toLowerCase().includes(q) ||
        person.title.toLowerCase().includes(q) ||
        person.email.toLowerCase().includes(q) ||
        (person.phone ? person.phone.toLowerCase().includes(q) : false) ||
        teamName.toLowerCase().includes(q)
      );
    });
  }, [staff, searchQuery, data.teams]);

  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredStaff.slice(start, start + PAGE_SIZE);
  }, [filteredStaff, currentPage]);

  const columns: ColumnsType<Staff> = [
    {
      title: "Cán bộ",
      key: "name",
      width: 260,
      render: (_, row) => (
        <div
          className="text-left group cursor-pointer"
          onClick={() => {
            setOpenInEditRole(false);
            setSelectedStaffForRole(row);
          }}
        >
          <Tooltip title="Nhấp để xem chi tiết cán bộ & phân quyền">
            <Text className="block text-[13px] font-semibold text-[#102A43] group-hover:text-[#DC2626] transition-colors">
              {row.name}
            </Text>
          </Tooltip>
          <Text className="block text-xs text-slate-500">
            {row.employment || "Viên chức"}
          </Text>
          {row.customFields && Object.keys(row.customFields).length > 0 && (
            <div className="mt-1 flex items-center gap-1 flex-wrap">
              {Object.entries(row.customFields)
                .filter(([key, val]) => {
                  if (!val) return false;
                  if (/fdsaf/i.test(key)) return false;
                  return configuredStaffFields.some((f) => f.name === key);
                })
                .slice(0, 2)
                .map(([key, val]) => {
                  const fieldDef = configuredStaffFields.find((f) => f.name === key);
                  const label = fieldDef?.label || key.replace(/_/g, " ");
                  return (
                    <span
                      key={key}
                      className="inline-block text-[10px] bg-red-50 text-red-700 border border-red-200/60 px-1.5 py-0.5 rounded font-medium max-w-[200px] truncate"
                      title={`${label}: ${String(val)}`}
                    >
                      {label}: {String(val)}
                    </span>
                  );
                })}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Tổ / bộ phận",
      key: "team",
      width: 200,
      render: (_, row) => (
        <Text className="text-[13px] text-slate-700">
          {data.teams.find((team) => team.id === row.teamId)?.name}
        </Text>
      ),
    },
    {
      title: "Vai trò",
      key: "role",
      width: 220,
      align: "center",
      render: (_, row) => {
        const roles = getStaffDisplayRoles(row, resolvedRolesMap, data.teams, data.projects);
        return (
          <div className="flex flex-col items-center justify-center gap-1.5 py-1 w-full">
            {roles.map((roleName, idx) => (
              <Tag
                key={idx}
                intent="brand"
                scale="md"
                title={roleName}
                className="m-0 !w-[160px] !inline-flex !items-center !justify-center !text-center !rounded-full !py-1 !px-2.5 text-xs font-semibold leading-snug"
              >
                <span className="w-full text-center truncate">{roleName}</span>
              </Tag>
            ))}
          </div>
        );
      },
    },
    {
      title: "Tài khoản",
      key: "account",
      width: 150,
      align: "center",
      render: (_, row) => (
        <div className="flex flex-col items-center justify-center w-full">
          <Tooltip title={!row.accountActive ? row.lockReason || "Tài khoản đang bị khóa" : undefined}>
            <Tag
              scale="md"
              className={`m-0 !w-[116px] !inline-flex !items-center !justify-center !text-center !rounded-full font-semibold ${
                row.accountActive
                  ? "!bg-sky-50 !text-[#0F4C81] !border-sky-300"
                  : "!bg-slate-100 !text-slate-600 !border-slate-300 cursor-help"
              }`}
            >
              <span className="w-full text-center">
                {row.accountActive ? "Đang hoạt động" : "Đang khóa"}
              </span>
            </Tag>
          </Tooltip>
        </div>
      ),
    },
  ];

  if (permissions.canManageAccounts) {
    columns.push({
      title: "Thao tác",
      key: "action",
      width: 250,
      align: "center",
      render: (_, row) => (
        <div className="flex items-center justify-center gap-1.5 w-full flex-nowrap" onClick={(e) => e.stopPropagation()}>
          {/* 1. Nút Cấp role - Luôn hoạt động mở Drawer */}
          <Tooltip title="Cấp thêm vai trò / bổ nhiệm vị trí cho cán bộ (mở Drawer)">
            <Button
              intent="primary"
              scale="compact"
              onClick={(e) => {
                e.stopPropagation();
                setStaffForGrantRole(row);
              }}
              className="!h-7 !px-2.5 !inline-flex !items-center !justify-center text-xs font-semibold !bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C] !text-white shadow-2xs whitespace-nowrap"
            >
              Cấp role
            </Button>
          </Tooltip>

          {/* 2. Nút Đổi role - Mở Drawer đổi vai trò */}
          <Tooltip title="Đổi vai trò, vị trí công tác hoặc thăng chức cho cán bộ (mở Drawer)">
            <Button
              intent="outline"
              scale="compact"
              onClick={(e) => {
                e.stopPropagation();
                setStaffForChangeRole(row);
              }}
              className="!h-7 !px-2.5 !inline-flex !items-center !justify-center !border-sky-300 !text-[#0F4C81] hover:!bg-sky-50 text-xs font-semibold shadow-2xs whitespace-nowrap"
            >
              Đổi role
            </Button>
          </Tooltip>

          {/* 3. Nút Thu hồi role - Mở Drawer thu hồi vai trò */}
          <Tooltip title="Thu hồi chức danh / vai trò của cán bộ (mở Drawer)">
            <Button
              intent="outline"
              scale="compact"
              onClick={(e) => {
                e.stopPropagation();
                setStaffForRevokeRole(row);
              }}
              className="!h-7 !px-2.5 !inline-flex !items-center !justify-center !border-rose-200 !text-rose-700 hover:!border-rose-400 hover:!bg-rose-50 text-xs font-semibold shadow-2xs whitespace-nowrap"
            >
              Thu hồi role
            </Button>
          </Tooltip>
        </div>
      ),
    });
  }

  return (
    <>
      <Card
      surface="flat"
      padding="none"
      rounded="lg"
      className="border-slate-200 shadow-sm shadow-slate-100"
    >
      <SectionIntro
        title="Tài khoản và quyền truy cập hệ thống"
        description="Quản lý trạng thái tài khoản và quyền truy cập các phân hệ của toàn bộ cán bộ."
        countLabel={`${staff.length} tài khoản`}
        readOnly={!permissions.canManageAccounts}
        actions={
          <Flex align="center" gap={8}>
            <Button
              intent="outline"
              icon={<AppstoreOutlined />}
              className="font-semibold text-slate-700 hover:text-[#DC2626] hover:border-[#DC2626]/50 bg-white shadow-2xs"
              onClick={() => setMatrixModalOpen(true)}
            >
              Ma trận phân quyền
            </Button>
            <Button
              intent="outline"
              icon={<SettingOutlined />}
              className="font-semibold text-slate-700 hover:text-[#DC2626] hover:border-[#DC2626]/50 bg-white shadow-2xs"
              onClick={() => setConfigFieldsModalOpen(true)}
            >
              Cấu hình nhân sự
            </Button>
            {permissions.canManageAccounts && (
              <Button
                intent="primary"
                icon={<UserAddOutlined />}
                className="font-semibold !bg-[#DC2626] hover:!bg-[#B91C1C] text-white shadow-2xs"
                onClick={() => setStaffModalOpen(true)}
              >
                Thêm tài khoản
              </Button>
            )}
          </Flex>
        }
      />

      <div className="p-4 sm:p-5">
        {/* Thanh tìm kiếm và phân trang đặt phía trên góc phải */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
          <div className="w-full max-w-sm">
            <Input
              prefix={<SearchOutlined className="text-slate-400" />}
              placeholder="Tìm kiếm cán bộ theo họ tên, chức danh, phòng ban..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              allowClear
              className="w-full text-xs"
            />
          </div>

          {/* Phân trang đặt phía trên góc phải */}
          {filteredStaff.length > PAGE_SIZE && (
            <div className="flex items-center gap-3">
              <Text className="text-xs font-medium text-slate-500">
                Hiển thị {(currentPage - 1) * PAGE_SIZE + 1} -{" "}
                {Math.min(currentPage * PAGE_SIZE, filteredStaff.length)} trong tổng số{" "}
                {filteredStaff.length} tài khoản
              </Text>
              <Pagination
                current={currentPage}
                pageSize={PAGE_SIZE}
                total={filteredStaff.length}
                onChange={(newPage) => setCurrentPage(newPage)}
                showSizeChanger={false}
                hideOnSinglePage={true}
              />
            </div>
          )}
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={paginatedStaff}
          size="middle"
          tableLayout="fixed"
          scroll={{ x: permissions.canManageAccounts ? 1060 : 860 }}
          pagination={false}
          rowClassName={(row) => (row.accountActive ? "" : "[&>td]:!bg-rose-50/40")}
          className="[&_.ant-table-thead>tr>th]:bg-slate-50/90 [&_.ant-table-thead>tr>th]:py-2.5 [&_.ant-table-thead>tr>th]:text-[13px] [&_.ant-table-thead>tr>th]:font-bold [&_.ant-table-thead>tr>th]:text-slate-600 [&_.ant-table-tbody>tr>td]:py-2 [&_.ant-table-tbody>tr>td]:!align-middle [&_.ant-table-thead_th::before]:!hidden [&_.ant-table-thead_th:before]:!content-none"
          onRow={(row) => ({
            onClick: () => {
              setOpenInEditRole(false);
              setSelectedStaffForRole(row);
            },
            className: "cursor-pointer hover:bg-slate-50/70 transition-colors group",
          })}
          locale={{
            emptyText: (
              <Text className="block py-10 text-center text-[13px] text-slate-500">
                Không tìm thấy cán bộ nào khớp với từ khóa tìm kiếm.
              </Text>
            ),
          }}
        />
      </div>
    </Card>

    {staffModalOpen && (
      <StaffModal
        data={controller.data}
        errorText={controller.feedback?.type === "error" ? controller.feedback.text : undefined}
        onClose={() => setStaffModalOpen(false)}
        onCreate={async (input) => {
          const res = await controller.createStaff(input);
          if (res) {
            setCurrentPage(1);
            setSearchQuery("");
          }
          return res;
        }}
      />
    )}

    {matrixModalOpen && (
      <RolePermissionMatrixModal
        open={matrixModalOpen}
        onClose={() => setMatrixModalOpen(false)}
        canManage={permissions.canManageAccounts}
      />
    )}

    {configFieldsModalOpen && (
      <ConfigureCustomFieldsModal
        open={configFieldsModalOpen}
        target="staff"
        onClose={() => setConfigFieldsModalOpen(false)}
        onFieldsUpdated={(fields) => setConfiguredStaffFields(fields)}
      />
    )}

    {staffForGrantRole && (
      <GrantRoleModal
        open={Boolean(staffForGrantRole)}
        staff={staffForGrantRole}
        data={controller.data}
        onClose={() => setStaffForGrantRole(null)}
        onSubmit={controller.updateStaff}
      />
    )}

    {selectedStaffForRole && (
      <StaffProjectRoleModal
        staff={selectedStaffForRole}
        data={controller.data}
        currentUser={controller.currentUser}
        canManageRole={permissions.canGrantRole ?? true}
        initialPromoting={openInEditRole}
        onClose={() => {
          setSelectedStaffForRole(null);
          setOpenInEditRole(false);
        }}
        onGrantRole={controller.grantActingDirector}
        onRevokeRole={controller.revokeActingDirector}
        onUpdateStaff={controller.updateStaff}
        onUpdateProjectPermissions={controller.updateProjectPermissions}
        onLockAccount={onLockAccount}
        onUnlockAccount={confirmUnlock}
      />
    )}

    {staffForChangeRole && (
      <ChangeRoleDrawer
        open={Boolean(staffForChangeRole)}
        staff={staffForChangeRole}
        data={controller.data}
        onClose={() => setStaffForChangeRole(null)}
        onConfirm={async (staffId, updateInput, customMessage) => {
          return await controller.updateStaff(staffId, updateInput, customMessage);
        }}
        onRevokeActingDirector={controller.revokeActingDirector}
      />
    )}

    {staffForRevokeRole && (
      <RevokeRoleDrawer
        open={Boolean(staffForRevokeRole)}
        staff={staffForRevokeRole}
        data={controller.data}
        onClose={() => setStaffForRevokeRole(null)}
        onConfirm={async (staffId, updateInput, revokedActingProjectIds, customMessage) => {
          if (revokedActingProjectIds && revokedActingProjectIds.length > 0) {
            for (const projId of revokedActingProjectIds) {
              await controller.revokeActingDirector(projId, false);
            }
          }
          return await controller.updateStaff(staffId, updateInput, customMessage);
        }}
      />
    )}

  </>
  );
}
