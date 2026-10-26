"use client";

import { useState } from "react";
import { SafetyCertificateOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Drawer } from "@/components/ui";
import { SegmentedTabs } from "@/components/workspace";
import type { SegmentedTabItem } from "@/components/workspace";
import { useStaffDetail } from "../hooks/usePersonnelAccess";
import StaffActivityHistory from "./StaffActivityHistory";
import StaffDetailHeader from "./StaffDetailHeader";
import StaffInfoCard from "./StaffInfoCard";
import StaffPermissionPanel from "./StaffPermissionPanel";

type StaffDetailTab = "info" | "role";

const TAB_ITEMS: SegmentedTabItem<StaffDetailTab>[] = [
  { key: "info", icon: <UserOutlined />, label: "Thông tin cá nhân" },
  { key: "role", icon: <SafetyCertificateOutlined />, label: "Quyền hạn" },
];

/**
 * Drawer hồ sơ & phân quyền của một cán bộ. Chỉ cần mã cán bộ:
 * từng phần bên trong tự tải dữ liệu và tự xử lý thao tác của mình.
 */
export default function StaffDetailDrawer({ staffId, onClose }: { staffId: string; onClose: () => void }) {
  const detail = useStaffDetail(staffId);
  const [activeTab, setActiveTab] = useState<StaffDetailTab>("info");

  return (
    <Drawer
      open
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
      {detail && (
        <>
          <StaffDetailHeader staffId={staffId} />

          {/* THANH TAB: Thông tin cá nhân / Quyền hạn */}
          <SegmentedTabs className="mb-4" activeKey={activeTab} onChange={setActiveTab} items={TAB_ITEMS} />

          {/* Thông tin cá nhân & vị trí công tác (sửa trực tiếp trên thẻ) + lịch sử thay đổi hồ sơ */}
          {activeTab === "info" && (
            <>
              <StaffInfoCard staffId={staffId} />
              <StaffActivityHistory staffId={staffId} />
            </>
          )}

          {/* Quyền hạn theo chức danh + chỉnh quyền riêng cán bộ này */}
          {activeTab === "role" && <StaffPermissionPanel staffId={staffId} />}
        </>
      )}
    </Drawer>
  );
}
