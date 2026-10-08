"use client";

import { useMemo, useState } from "react";
import {
  LockOutlined,
  SearchOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import { App } from "antd";
import {
  Button,
  Card,
  Input,
  Modal,
  Pagination,
  Table,
  Tag,
  Text,
  Tooltip,
} from "@/components/ui";
import type { ColumnsType } from "@/components/ui";
import { SectionIntro } from "@/components/workspace";
import { SYSTEM_ROLE_META } from "../constants/personnel-labels";
import type { PersonnelController } from "../hooks/usePersonnelAssignment";
import type { Staff } from "../types/personnel.types";

interface AccountsTabProps {
  controller: PersonnelController;
  onLockAccount: (person: Staff) => void;
}

const PAGE_SIZE = 10;

export default function AccountsTab({ controller, onLockAccount }: AccountsTabProps) {
  const { modal } = App.useApp();
  const { data, staff, permissions } = controller;
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

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
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-lg shadow-xs">
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
            Cán bộ <strong className="text-slate-900">{person.name}</strong> sẽ có thể đăng nhập lại vào hệ thống với vai trò <strong className="text-[#0F4C81]">{SYSTEM_ROLE_META[person.roleCode]?.label ?? person.roleCode}</strong>.
          </div>
        </div>
      ),
      okText: "Mở tài khoản",
      okButtonProps: {
        className:
          "!h-9 !px-5 !rounded-lg !font-semibold !bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 !text-white !shadow-xs",
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
        person.phone.toLowerCase().includes(q) ||
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
      width: 240,
      render: (_, row) => (
        <div className="text-left">
          <Text className="block text-[13px] font-semibold text-[#102A43]">{row.name}</Text>
          <Text className="block text-xs text-slate-500">
            {row.title} · {row.employment}
          </Text>
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
      title: "Vai trò hệ thống",
      key: "role",
      width: 220,
      align: "center",
      render: (_, row) => {
        const meta = SYSTEM_ROLE_META[row.roleCode];
        return (
          <Tooltip title={meta?.description}>
            <div className="flex items-center justify-center">
              <Tag intent="brand" scale="md" className="m-0">
                {meta?.label ?? row.roleCode}
              </Tag>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "Tài khoản",
      key: "account",
      width: 200,
      align: "center",
      render: (_, row) => (
        <div className="flex flex-col items-center justify-center w-full">
          <Tag
            intent={row.accountActive ? "success" : "danger"}
            scale="md"
            className="m-0 !w-[116px] !inline-flex !items-center !justify-center !text-center"
          >
            <span className="w-full text-center">
              {row.accountActive ? "Đang hoạt động" : "Đang khóa"}
            </span>
          </Tag>
          {!row.accountActive && row.lockReason && (
            <Text className="mt-1 block text-xs text-slate-500 max-w-[180px] truncate text-center">
              {row.lockReason}
            </Text>
          )}
        </div>
      ),
    },
  ];

  if (permissions.canManageAccounts) {
    columns.push({
      title: "Thao tác",
      key: "action",
      width: 160,
      align: "center",
      render: (_, row) => (
        <div className="flex items-center justify-center w-full">
          {row.roleCode === "ADMIN" ? (
            <Text className="text-[13px] text-slate-400">Tài khoản quản trị</Text>
          ) : row.accountActive ? (
            <Button
              intent="outline"
              scale="compact"
              onClick={() => onLockAccount(row)}
              className="!w-[126px] !inline-flex !items-center !justify-center !gap-1.5 !border-rose-200 !text-rose-700 hover:!border-rose-400"
            >
              <LockOutlined />
              <span>Khóa tài khoản</span>
            </Button>
          ) : (
            <Button
              intent="primary"
              scale="compact"
              onClick={() => confirmUnlock(row)}
              className="!w-[126px] !inline-flex !items-center !justify-center !gap-1.5"
            >
              <UnlockOutlined />
              <span>Mở lại</span>
            </Button>
          )}
        </div>
      ),
    });
  }

  return (
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
          scroll={{ x: permissions.canManageAccounts ? 1010 : 860 }}
          pagination={false}
          rowClassName={(row) => (row.accountActive ? "" : "[&>td]:!bg-rose-50/40")}
          className="[&_.ant-table-thead>tr>th]:bg-slate-50/90 [&_.ant-table-thead>tr>th]:py-2.5 [&_.ant-table-thead>tr>th]:text-[13px] [&_.ant-table-thead>tr>th]:font-bold [&_.ant-table-thead>tr>th]:text-slate-600 [&_.ant-table-tbody>tr>td]:py-2 [&_.ant-table-tbody>tr>td]:!align-middle [&_.ant-table-thead_th::before]:!hidden [&_.ant-table-thead_th:before]:!content-none"
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
  );
}
