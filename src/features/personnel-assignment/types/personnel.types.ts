export type TeamId = "BGD" | "PGD" | "GSKT" | "HCTH" | "BT" | "KHKT" | "DT" | (string & {});
export type Employment = "Viên chức" | "Hợp đồng";
export interface Team {
  id: TeamId;
  name: string;
  description: string;
  leaderId: string;
  roles?: string[];
  inactiveRoles?: string[];
  customFields?: Record<string, any>;
}

export interface Staff {
  id: string;
  name: string;
  title: string;
  /** Số CCCD / Căn cước công dân (12 số) */
  citizenId?: string;
  teamId: TeamId;
  /** Vai trò trên hệ thống, quyết định quyền truy cập các phân hệ */
  roleCode: string;
  employment: Employment;
  phone: string;
  email: string;
  accountActive: boolean;
  lockReason?: string;
  /** Ngày tháng năm sinh */
  dob?: string;
  /** Giới tính */
  gender?: "Nam" | "Nữ";
  /** Danh sách các quyền hạn được cấp thêm (Granted Permissions) */
  permissions?: string[];
  /** Danh sách các quyền hạn bị thu hồi (Revoked Permissions) */
  revokedPermissions?: string[];
  /** Vai trò / chức danh đã tắt (thu hồi): không tính vào chức danh & quyền, vẫn lưu để bật lại */
  revokedRoles?: string[];
  /** Các trường thông tin động được cấu hình theo dự án */
  customFields?: Record<string, any>;
}

export interface PersonnelDataset {
  teams: Team[];
  staff: Staff[];
}

export interface StaffInput {
  name: string;
  title: string;
  /** Số CCCD / Căn cước công dân (12 số) */
  citizenId?: string;
  teamId: TeamId;
  roleCode: string;
  employment: Employment;
  phone?: string;
  email: string;
  username?: string;
  password?: string;
  accountActive?: boolean;
  isLeader?: boolean;
  dob?: string;
  gender?: "Nam" | "Nữ";
  note?: string;
  permissions?: string[];
  revokedPermissions?: string[];
  /** Vai trò / chức danh đã tắt (thu hồi): không tính vào chức danh & quyền, vẫn lưu để bật lại */
  revokedRoles?: string[];
  customFields?: Record<string, any>;
}
