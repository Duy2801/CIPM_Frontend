"use client";

import { SearchOutlined } from "@ant-design/icons";
import { Button, Flex, Input, Select } from "@/components/ui";
import { useTeams } from "../hooks/usePersonnelQueries";

export interface DirectoryFilters {
  search: string;
  /** "ALL" = tất cả phòng ban */
  teamId: string;
  accountStatus: "ALL" | "ACTIVE" | "LOCKED";
}

export const DEFAULT_DIRECTORY_FILTERS: DirectoryFilters = { search: "", teamId: "ALL", accountStatus: "ALL" };

export const isDirectoryFiltering = (filters: DirectoryFilters) =>
  filters.teamId !== "ALL" || filters.accountStatus !== "ALL" || filters.search.trim() !== "";

interface DirectoryToolbarProps {
  filters: DirectoryFilters;
  onChange: (filters: DirectoryFilters) => void;
}

/** Bộ lọc danh bạ: tìm kiếm, phòng ban, trạng thái tài khoản */
export default function DirectoryToolbar({ filters, onChange }: DirectoryToolbarProps) {
  const { data: teams = [] } = useTeams();
  const update = (patch: Partial<DirectoryFilters>) => onChange({ ...filters, ...patch });

  return (
    <Flex align="center" wrap="wrap" gap="small" className="w-full">
      <div className="w-full sm:w-72">
        <Input
          allowClear
          intent="clean"
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder="Tìm cán bộ, chức danh, email, SĐT..."
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
        />
      </div>
      <div className="w-full sm:w-60">
        <Select
          value={filters.teamId}
          onChange={(teamId) => update({ teamId })}
          className="w-full text-xs"
          options={[
            { value: "ALL", label: "Tất cả phòng ban" },
            ...teams.map((t) => ({ value: t.id, label: t.name })),
          ]}
        />
      </div>
      <div className="w-full sm:w-48">
        <Select
          value={filters.accountStatus}
          onChange={(accountStatus) => update({ accountStatus: accountStatus as DirectoryFilters["accountStatus"] })}
          className="w-full text-xs"
          options={[
            { value: "ALL", label: "Tất cả tài khoản" },
            { value: "ACTIVE", label: "Đang hoạt động" },
            { value: "LOCKED", label: "Đang khóa" },
          ]}
        />
      </div>
      {isDirectoryFiltering(filters) && (
        <Button intent="outline" scale="compact" onClick={() => onChange(DEFAULT_DIRECTORY_FILTERS)}>
          Đặt lại bộ lọc
        </Button>
      )}
    </Flex>
  );
}
