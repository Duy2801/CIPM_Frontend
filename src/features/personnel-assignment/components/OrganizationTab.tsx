"use client";

import { useMemo, useState } from "react";
import {
  ApartmentOutlined,
  CrownOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Flex,
  Input,
  Select,
  Table,
  Tag,
  Text,
  Tooltip,
} from "@/components/ui";
import type { ColumnsType } from "@/components/ui";
import { SectionIntro } from "@/components/workspace";
import { getInitials } from "@/utils/initials";
import { SYSTEM_ROLE_META } from "../constants/personnel-labels";
import { resolveStaffRbac } from "../utils/personnel-rbac";
import type { PersonnelController } from "../hooks/usePersonnelAssignment";
import type { Staff, Team } from "../types/personnel.types";
import AddTeamModal from "./AddTeamModal";
import StaffProjectRoleModal from "./StaffProjectRoleModal";

export default function OrganizationTab({ controller }: { controller: PersonnelController }) {
  const { data, staff, permissions } = controller;
  const [addTeamModalOpen, setAddTeamModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStaffForRole, setSelectedStaffForRole] = useState<Staff | null>(null);

  const filteredStaff = useMemo(() => {
    return staff.filter((person) => {
      if (selectedTeamId !== "ALL" && person.teamId !== selectedTeamId) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = person.name.toLowerCase().includes(q);
        const matchTitle = person.title.toLowerCase().includes(q);
        const matchPhone = person.phone.toLowerCase().includes(q);
        const matchEmail = person.email.toLowerCase().includes(q);
        if (!matchName && !matchTitle && !matchPhone && !matchEmail) {
          return false;
        }
      }

      return true;
    });
  }, [staff, selectedTeamId, searchQuery]);

  const visibleTeams = useMemo(() => {
    return data.teams
      .filter((team) => selectedTeamId === "ALL" || team.id === selectedTeamId)
      .filter((team) => filteredStaff.some((person) => person.teamId === team.id));
  }, [data.teams, selectedTeamId, filteredStaff]);



  const getColumns = (team: Team): ColumnsType<Staff> => [
    {
      title: "Họ và tên cán bộ",
      key: "name",
      width: "35%",
      render: (_, person) => {
        const isLeader = team.leaderId === person.id;
        return (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#DC2626] to-[#991B1B] text-xs font-bold text-white shadow-xs">
              {getInitials(person.name)}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Text className="truncate text-[13px] font-bold text-slate-900 group-hover:text-[#DC2626] transition-colors">
                  {person.name}
                </Text>
                {isLeader && (
                  <Tooltip title="Phụ trách tổ / Tổ trưởng">
                    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                      <CrownOutlined className="text-amber-500 text-[10px]" />
                      Phụ trách
                    </span>
                  </Tooltip>
                )}
                {!person.accountActive && (
                  <Tooltip title={person.lockReason || "Tài khoản đang bị khóa"}>
                    <span className="inline-flex items-center gap-0.5 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-200">
                      <LockOutlined className="text-rose-500 text-[10px]" />
                      Khóa
                    </span>
                  </Tooltip>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                <span className="font-medium text-slate-700">{person.title}</span>
                <span>·</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[11px] text-slate-600">
                  {person.employment}
                </span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Thông tin liên hệ",
      key: "contact",
      width: "27%",
      align: "center",
      render: (_, person) => (
        <div className="inline-block text-left space-y-1 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <PhoneOutlined className="shrink-0 text-[11px] text-slate-400" />
            <span className="font-mono text-[12px] text-slate-700 select-all">{person.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <MailOutlined className="shrink-0 text-[11px] text-slate-400" />
            <span className="text-[12px] text-slate-500 select-all truncate">{person.email}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Vai trò hệ thống",
      key: "role",
      width: "24%",
      align: "center",
      render: (_, person) => {
        const rbac = resolveStaffRbac(person, team, data.projects);
        return (
          <Tooltip
            title={
              <div className="text-xs space-y-1.5 p-1 max-w-xs">
                <div className="font-bold text-white text-[13px] border-b border-slate-600 pb-1">
                  {rbac.displayBadge}
                </div>
                <div className="text-slate-200">
                  <span className="text-emerald-300 font-semibold">1. Cấp bậc (Role):</span> {rbac.roleLabel}
                </div>
                <div className="text-[11px] text-slate-300 pl-3">
                  Quyền hạn: {rbac.rolePermissions.map((p) => p.name).slice(0, 2).join(", ")}...
                </div>
                {rbac.teamCode && (
                  <>
                    <div className="text-slate-200 pt-1 border-t border-slate-700">
                      <span className="text-blue-300 font-semibold">2. Chuyên môn (Team):</span> {rbac.teamLabel}
                    </div>
                    <div className="text-[11px] text-slate-300 pl-3">
                      Nhiệm vụ: {rbac.teamPermissions.map((p) => p.name).slice(0, 2).join(", ")}...
                    </div>
                  </>
                )}
                {rbac.actingDirectorProjects.length > 0 && (
                  <div className="text-amber-300 text-[11px] pt-1 border-t border-slate-700">
                    ★ Đang giữ Quyền CNDA tại {rbac.actingDirectorProjects.length} dự án
                  </div>
                )}
                <div className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-700">
                  Nhấp để xem bảng phân quyền RBAC chi tiết
                </div>
              </div>
            }
          >
            <div className="flex items-center justify-center">
              <Tag
                intent={rbac.isLeader || rbac.roleCode === "DIRECTOR" ? "brand" : "subtle"}
                scale="sm"
                className="m-0 font-medium whitespace-nowrap cursor-pointer hover:border-[#DC2626] transition-colors"
              >
                {rbac.displayBadge}
              </Tag>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: "16%",
      align: "center",
      render: (_, person) => (
        <Button
          intent="outline"
          scale="compact"
          className="text-xs h-7.5 px-3 font-medium !border-slate-300 hover:!border-[#DC2626] hover:!text-[#DC2626]"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedStaffForRole(person);
          }}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <>
      <Card surface="flat" padding="none" rounded="lg" className="border-slate-200 shadow-sm">
        <SectionIntro
          title="Cơ cấu tổ chức và phân công nhân sự"
          description="Ban Giám đốc và các tổ chuyên môn. Quản lý thông tin, phân công và quyền hạn cán bộ."
          countLabel={filteredStaff.length === staff.length ? `${staff.length} cán bộ` : `${filteredStaff.length}/${staff.length} cán bộ`}
          actions={
            (permissions.canManageAccounts || permissions.canManageOrganization) && (
              <Button
                intent="primary"
                icon={<ApartmentOutlined />}
                className="font-semibold !bg-[#DC2626] hover:!bg-[#B91C1C] text-white shadow-2xs"
                onClick={() => setAddTeamModalOpen(true)}
              >
                Thêm phòng ban
              </Button>
            )
          }
          toolbar={
            <Flex align="center" justify="space-between" wrap="wrap" gap="small" className="w-full">
              <Flex align="center" wrap="wrap" gap="small" className="flex-1">
                {/* Bộ lọc tổ / bộ phận */}
                <div className="w-full sm:w-60">
                  <Select
                    value={selectedTeamId}
                    onChange={(val) => setSelectedTeamId(val)}
                    className="w-full text-xs"
                    options={[
                      { value: "ALL", label: "Tất cả tổ / bộ phận" },
                      ...data.teams.map((t) => ({
                        value: t.id,
                        label: t.name,
                      })),
                    ]}
                  />
                </div>


                {/* Ô tìm kiếm */}
                <div className="w-full sm:w-64">
                  <Input
                    allowClear
                    intent="clean"
                    prefix={<SearchOutlined className="text-slate-400" />}
                    placeholder="Tìm cán bộ, chức danh, SĐT..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </Flex>
            </Flex>
          }
        />

        <div className="space-y-6 p-5 sm:p-6">
          {visibleTeams.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
              <Text className="text-sm font-semibold text-slate-700">Không tìm thấy cán bộ phù hợp</Text>
              <Text className="mt-1 text-xs text-slate-500">
                Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.
              </Text>
              <Button
                intent="outline"
                scale="compact"
                className="mt-3"
                onClick={() => {
                  setSelectedTeamId("ALL");
                  setSearchQuery("");
                }}
              >
                Đặt lại bộ lọc
              </Button>
            </div>
          ) : (
            visibleTeams.map((team) => {
              const members = filteredStaff.filter((person) => person.teamId === team.id);
            return (
              <section
                key={team.id}
                className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs"
              >
                {/* Header tổ / ban */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <Text className="text-sm font-bold text-slate-900">{team.name}</Text>
                      <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                        {members.length} người
                      </span>
                    </div>
                    <Text className="mt-0.5 block text-xs text-slate-500">{team.description}</Text>
                  </div>
                </div>

                {/* Danh sách cán bộ */}
                {members.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Không có cán bộ phù hợp trong tổ này.
                  </div>
                ) : (
                  <Table
                    rowKey="id"
                    columns={getColumns(team)}
                    dataSource={members}
                    pagination={false}
                    size="middle"
                    tableLayout="fixed"
                    scroll={{ x: 750 }}
                    className="[&_.ant-table-thead>tr>th]:bg-slate-50/90 [&_.ant-table-thead>tr>th]:py-2.5 [&_.ant-table-thead>tr>th]:text-[13px] [&_.ant-table-thead>tr>th]:font-bold [&_.ant-table-thead>tr>th]:text-slate-600 [&_.ant-table-tbody>tr>td]:py-3 [&_.ant-table-thead_th::before]:!hidden [&_.ant-table-thead_th:before]:!content-none"
                    onRow={(person) => ({
                      onClick: () => setSelectedStaffForRole(person),
                      className: "cursor-pointer hover:bg-slate-50/70 transition-colors group",
                    })}
                  />
                )}
              </section>
            );
          }))}
        </div>
      </Card>

      {addTeamModalOpen && (
        <AddTeamModal
          open={addTeamModalOpen}
          data={controller.data}
          onClose={() => setAddTeamModalOpen(false)}
          onSubmit={controller.createTeam}
        />
      )}



      {/* Drawer Chi tiết cán bộ & Quyền hạn: Xem chi tiết quyền hạn từng DA để thu hồi đúng quyền, và phục vụ khi lên chức */}
      {selectedStaffForRole && (
        <StaffProjectRoleModal
          staff={selectedStaffForRole}
          data={controller.data}
          currentUser={controller.currentUser}
          canManageRole={permissions.canGrantRole ?? true}
          onClose={() => setSelectedStaffForRole(null)}
          onGrantRole={controller.grantActingDirector}
          onRevokeRole={controller.revokeActingDirector}
          onUpdateStaff={controller.updateStaff}
          onUpdateProjectPermissions={controller.updateProjectPermissions}
        />
      )}
    </>
  );
}
