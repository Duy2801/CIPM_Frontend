"use client";

import { useMemo, useState } from "react";
import { AppstoreOutlined, UserAddOutlined } from "@ant-design/icons";
import { Button, Card, Flex, Text } from "@/components/ui";
import { SectionIntro } from "@/components/workspace";
import { normalizeSearchText } from "@/utils/search-text";
import { useStaffAccess } from "../hooks/usePersonnelAccess";
import { useStaffList, useTeams } from "../hooks/usePersonnelQueries";
import DirectoryTeamSection from "./DirectoryTeamSection";
import DirectoryToolbar, { DEFAULT_DIRECTORY_FILTERS, isDirectoryFiltering, type DirectoryFilters } from "./DirectoryToolbar";
import RolePermissionMatrixModal from "./RolePermissionMatrixModal";
import StaffModal from "./StaffModal";

/** Danh bạ cán bộ theo phòng ban: lọc, thêm tài khoản, ma trận phân quyền */
export default function PersonnelDirectoryTab() {
  const { data: teams = [] } = useTeams();
  const { data: staff = [] } = useStaffList();
  const { canManageAccounts } = useStaffAccess();

  const [filters, setFilters] = useState<DirectoryFilters>(DEFAULT_DIRECTORY_FILTERS);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [matrixModalOpen, setMatrixModalOpen] = useState(false);

  const isFiltering = isDirectoryFiltering(filters);
  const isSearching = filters.search.trim() !== "";
  const resetFilters = () => setFilters(DEFAULT_DIRECTORY_FILTERS);

  const filteredStaff = useMemo(() => {
    const q = normalizeSearchText(filters.search);
    return staff.filter((person) => {
      if (filters.teamId !== "ALL" && person.teamId !== filters.teamId) return false;
      if (filters.accountStatus === "ACTIVE" && !person.accountActive) return false;
      if (filters.accountStatus === "LOCKED" && person.accountActive) return false;
      if (!q) return true;
      return (
        normalizeSearchText(person.name).includes(q) ||
        normalizeSearchText(person.title).includes(q) ||
        normalizeSearchText(person.email).includes(q) ||
        normalizeSearchText(person.phone).includes(q)
      );
    });
  }, [staff, filters]);

  const visibleTeams = useMemo(() => {
    return teams
      .filter((team) => filters.teamId === "ALL" || team.id === filters.teamId)
      .filter((team) => !isFiltering || filteredStaff.some((person) => person.teamId === team.id));
  }, [teams, filters.teamId, filteredStaff, isFiltering]);

  return (
    <>
      <Card surface="flat" padding="none" rounded="lg" className="border-slate-200 shadow-sm">
        <SectionIntro
          title="Cơ cấu tổ chức, tài khoản & phân quyền"
          description="Cán bộ theo từng phòng ban. Quản lý thông tin, trạng thái tài khoản và chức danh của cán bộ."
          countLabel={
            filteredStaff.length === staff.length
              ? `${staff.length} cán bộ · ${teams.length} phòng ban`
              : `${filteredStaff.length}/${staff.length} cán bộ`
          }
          actions={
            canManageAccounts && (
              <Flex align="center" gap={8} wrap="wrap">
                <Button
                  intent="outline"
                  icon={<AppstoreOutlined />}
                  className="font-semibold text-slate-700 hover:text-[#DC2626] hover:border-[#DC2626]/50 bg-white shadow-2xs"
                  onClick={() => setMatrixModalOpen(true)}
                >
                  Ma trận phân quyền
                </Button>
                <Button
                  intent="primary"
                  icon={<UserAddOutlined />}
                  className="font-semibold !bg-[#DC2626] hover:!bg-[#B91C1C] text-white shadow-2xs"
                  onClick={() => setStaffModalOpen(true)}
                >
                  Thêm tài khoản
                </Button>
              </Flex>
            )
          }
          toolbar={<DirectoryToolbar filters={filters} onChange={setFilters} />}
        />

        <div className="space-y-6 p-4 sm:p-5">
          {visibleTeams.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
              <Text className="text-sm font-semibold text-slate-700">Không tìm thấy cán bộ phù hợp</Text>
              <Text className="mt-1 text-xs text-slate-500">Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.</Text>
              <Button intent="outline" scale="compact" className="mt-3" onClick={resetFilters}>
                Đặt lại bộ lọc
              </Button>
            </div>
          ) : (
            visibleTeams.map((team) => (
              <DirectoryTeamSection
                key={team.id}
                team={team}
                members={filteredStaff.filter((person) => person.teamId === team.id)}
                forceExpanded={isSearching}
              />
            ))
          )}
        </div>
      </Card>

      {staffModalOpen && <StaffModal onClose={() => setStaffModalOpen(false)} onCreated={resetFilters} />}
      {matrixModalOpen && <RolePermissionMatrixModal onClose={() => setMatrixModalOpen(false)} />}
    </>
  );
}
