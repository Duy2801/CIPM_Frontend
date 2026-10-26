"use client";

import { useState } from "react";
import { HistoryOutlined, PlusOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Button, LARGE_MODAL_CONTAINER_STYLE, LARGE_MODAL_PROPS, Modal, Title } from "@/components/ui";
import { useStaffAccess } from "../hooks/usePersonnelAccess";
import RoleEditorView from "./RoleEditorView";
import RoleMatrixHistoryTab from "./RoleMatrixHistoryTab";
import RoleMatrixRoleTable from "./RoleMatrixRoleTable";

/** "list" = danh sách chức danh; "create" / "edit" = màn Tạo / Chỉnh sửa chức danh (có quay lại) */
type MatrixView = { mode: "list" } | { mode: "create" } | { mode: "edit"; roleCode: string };
type ListTab = "roles" | "history";

const LIST_TABS = [
  { key: "roles", icon: <SafetyCertificateOutlined />, label: "Danh sách chức danh" },
  { key: "history", icon: <HistoryOutlined />, label: "Lịch sử thay đổi quyền" },
] as const;

/** Modal quản lý chức danh & phân quyền; chỉ người quản lý tài khoản mới sửa được, người khác chỉ xem */
export default function RolePermissionMatrixModal({ onClose }: { onClose: () => void }) {
  const { canManageAccounts: canManage } = useStaffAccess();
  const [view, setView] = useState<MatrixView>({ mode: "list" });
  // Tab: danh sách chức danh / lịch sử thay đổi quyền (ai cũng xem được)
  const [listTab, setListTab] = useState<ListTab>("roles");
  const backToList = () => setView({ mode: "list" });

  return (
    <Modal
      open
      onCancel={onClose}
      footer={null}
      closable={false}
      // Kích thước popup lớn dùng chung (cùng cỡ với Cấu hình quy trình thủ tục); khung không đệm, nội dung tự lo khoảng cách
      {...LARGE_MODAL_PROPS}
      styles={{ container: { ...LARGE_MODAL_CONTAINER_STYLE, padding: 0, overflow: "hidden" }, body: { flex: 1, minHeight: 0 } }}
      className="shadow-2xl"
    >
      <div className="flex flex-col h-full bg-white text-slate-900 overflow-hidden rounded-2xl">
        {view.mode !== "list" && (
          <RoleEditorView
            key={view.mode === "edit" ? `edit-${view.roleCode}` : "create"}
            roleCode={view.mode === "edit" ? view.roleCode : undefined}
            onBack={backToList}
          />
        )}

        {/* Danh sách vẫn giữ trong cây khi mở màn sửa để không mất từ khóa tìm kiếm / ngày lọc */}
        <div className={view.mode === "list" ? "contents" : "hidden"}>
          {/* Tiêu đề + nút tạo */}
          <div className="px-6 pt-5 pb-4 flex flex-wrap items-start justify-between gap-4 shrink-0">
            <div>
              <Title level={4} className="!m-0 text-slate-900 font-bold text-lg sm:text-xl">
                Quản lý chức danh
              </Title>
              <p className="m-0 mt-1 text-sm text-slate-500">Quản lý các chức danh và phân quyền trong hệ thống</p>
            </div>
            {canManage && listTab === "roles" && (
              <Button
                intent="primary"
                icon={<PlusOutlined />}
                className="h-9 px-4 text-sm font-semibold rounded-lg"
                onClick={() => setView({ mode: "create" })}
              >
                Tạo chức danh
              </Button>
            )}
          </div>

          {/* 2 tab: danh sách chức danh / lịch sử thay đổi quyền — nhỏ gọn, icon cùng hàng với chữ */}
          <div className="px-6 pb-3 shrink-0">
            <div role="tablist" className="inline-flex gap-1 rounded-lg border border-slate-200 bg-slate-100/70 p-0.5">
              {LIST_TABS.map((tab) => {
                const active = listTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setListTab(tab.key)}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors ${
                      active
                        ? "bg-white font-semibold text-slate-900 shadow-xs"
                        : "font-medium text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <span className={active ? "text-[#DC2626]" : "text-slate-400"}>{tab.icon}</span>
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={listTab === "history" ? "contents" : "hidden"}>
            <RoleMatrixHistoryTab onClose={onClose} />
          </div>
          <div className={listTab === "roles" ? "contents" : "hidden"}>
            <RoleMatrixRoleTable onOpenRole={(roleCode) => setView({ mode: "edit", roleCode })} onClose={onClose} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
