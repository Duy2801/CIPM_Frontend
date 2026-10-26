"use client";

import { useEffect, useState } from "react";
import { InfoCircleOutlined, MailOutlined } from "@ant-design/icons";
import { Button, Col, Drawer, Form, Input, Row, Select, Text, toast } from "@/components/ui";
import { normalizeSearchText } from "@/utils/search-text";
import type { StaffInput, TeamId } from "../types/personnel.types";
import type { CustomFieldDefinition } from "../types/custom-fields.types";
import { dobGetValueProps, dobInputProps, dobNormalize } from "../utils/dob-date";
import { inferRoleCode, isLeaderTitle } from "../utils/role-code-inference";
import { BASE_TEAM_POSITIONS, toTeamRoleValue } from "../utils/staff-role-options";
import { useConfirmAction } from "../hooks/useConfirmAction";
import { useCustomFieldDefs } from "../hooks/useCustomFieldDefs";
import { useStaffRoleOptions } from "../hooks/useStaffRoleOptions";
import { useCreateStaff, useCreateTeam, useUpdateTeam } from "../hooks/usePersonnelMutations";
import { useTeams } from "../hooks/usePersonnelQueries";
import StaffFormAddOption from "./StaffFormAddOption";
import StaffFormCustomFields from "./StaffFormCustomFields";

interface StaffFormValues extends Omit<StaffInput, "isLeader" | "title"> {
  title?: string;
  teamRole: string;
  customFields?: Record<string, any>;
}

interface StaffModalProps {
  onClose: () => void;
  /** Gọi sau khi thêm cán bộ thành công (VD: bỏ bộ lọc để thấy cán bộ mới) */
  onCreated?: () => void;
}

/** Danh sách xổ xuống hiện khoảng 5 mục, còn lại cuộn chuột */
const DROPDOWN_LIST_HEIGHT = 5 * 36;

/** Vị trí mặc định của phòng ban mới tạo từ form */
const NEW_TEAM_DEFAULT_ROLES = ["Tổ trưởng", "Tổ phó", "Thành viên"];

/** Drawer "Thêm nhân sự mới": tự tải danh mục phòng ban / chức danh, thêm nhanh phòng ban / chức danh / trường dữ liệu */
export default function StaffModal({ onClose, onCreated }: StaffModalProps) {
  const [form] = Form.useForm<StaffFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const confirmAction = useConfirmAction();
  const [customFields] = useCustomFieldDefs("staff");
  // Trường bị bỏ tích "Áp dụng" (chưa có trong danh sách = đang áp dụng)
  const [appliedFieldIds, setAppliedFieldIds] = useState<Record<string, boolean>>({});

  // Danh mục phòng ban (thêm phòng ban / chức danh ngay trên form)
  const { data: teams = [] } = useTeams();
  const createStaff = useCreateStaff();
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();

  const selectedTeamId = Form.useWatch("teamId", form);

  const currentTeam = teams.find((t) => t.id === selectedTeamId);

  const allRoleOptions = useStaffRoleOptions();
  // Chỉ hiện tên vị trí (không biểu tượng); vị trí lãnh đạo in đậm
  const roleSelectOptions = allRoleOptions.map((o) => ({
    ...o,
    label: <span className={o.isLeader ? "font-semibold text-slate-900" : "text-slate-700"}>{o.displayTitle}</span>,
  }));

  // Xử lý thêm phòng ban mới trực tiếp từ dropdown
  const handleAddDepartment = async (name: string): Promise<boolean> => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.warning("Chưa nhập tên phòng ban", "Vui lòng nhập tên phòng ban / tổ chuyên môn.");
      return false;
    }

    if (teams.some((t) => normalizeSearchText(t.name) === normalizeSearchText(trimmed))) {
      toast.warning("Trùng tên phòng ban", "Phòng ban này đã tồn tại trong danh sách.");
      return false;
    }

    if (
      !(await confirmAction({
        title: `Thêm phòng ban "${trimmed}"?`,
        description: "Phòng ban mới sẽ được thêm vào danh mục phòng ban của hệ thống.",
        okText: "Thêm phòng ban",
      }))
    )
      return false;

    const createdTeam = await createTeam.run({ team: { name: trimmed, roles: NEW_TEAM_DEFAULT_ROLES }, successText: false });
    if (!createdTeam) return false;
    handleTeamChange(createdTeam.id as TeamId);
    toast.success("Thành công", `Đã thêm phòng ban "${trimmed}".`);
    return true;
  };

  // Xử lý thêm vị trí / vai trò mới trực tiếp từ dropdown
  const handleAddRole = async (name: string): Promise<boolean> => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.warning("Chưa nhập tên chức danh", "Vui lòng nhập tên chức danh mới.");
      return false;
    }

    if (!selectedTeamId) {
      toast.warning("Chưa chọn phòng ban", "Vui lòng chọn bộ phận trực thuộc trước.");
      return false;
    }

    const currentRoles = currentTeam?.roles || [];
    if (
      currentRoles.some((r) => normalizeSearchText(r) === normalizeSearchText(trimmed)) ||
      allRoleOptions.some((opt) => normalizeSearchText(opt.title) === normalizeSearchText(trimmed))
    ) {
      toast.warning("Trùng tên chức danh", "Chức danh này đã tồn tại trong danh mục.");
      return false;
    }

    if (
      !(await confirmAction({
        title: `Thêm chức danh "${trimmed}"?`,
        description: `Chức danh mới sẽ được thêm vào ${currentTeam?.name || "phòng ban đang chọn"}.`,
        okText: "Thêm chức danh",
      }))
    )
      return false;

    const updated = await updateTeam.run({
      teamId: selectedTeamId,
      input: { roles: [...currentRoles, trimmed] },
      successText: false,
    });
    if (!updated) return false;

    const roleCode = inferRoleCode(selectedTeamId, trimmed, isLeaderTitle(trimmed));
    form.setFieldValue("teamRole", toTeamRoleValue(selectedTeamId, trimmed));
    form.setFieldValue("title", trimmed);
    form.setFieldValue("roleCode", roleCode);

    toast.success("Thành công", `Đã thêm chức danh "${trimmed}" cho ${currentTeam?.name || "phòng ban"}.`);
    return true;
  };

  const handleToggleFieldApplied = (field: CustomFieldDefinition, applied: boolean) => {
    setAppliedFieldIds((prev) => ({ ...prev, [field.id]: applied }));
    if (!applied) {
      form.setFieldValue(["customFields", field.name], undefined);
    }
  };

  // Luôn đồng bộ giá trị khởi tạo khi danh sách vai trò sẵn sàng
  useEffect(() => {
    if (allRoleOptions.length > 0) {
      const currentVal = form.getFieldValue("teamRole");
      const matched = allRoleOptions.find((opt) => opt.value === currentVal);
      if (!matched) {
        const defaultRole =
          allRoleOptions.find((r) => r.teamId === selectedTeamId) ||
          allRoleOptions[0];
        if (defaultRole) {
          form.setFieldValue("teamRole", defaultRole.value);
          form.setFieldValue("roleCode", defaultRole.roleCode);
          form.setFieldValue("title", defaultRole.title);
        }
      }
    }
  }, [allRoleOptions, form]);

  const handleFinish = async (values: StaffFormValues) => {
    if (
      !(await confirmAction({
        title: `Thêm cán bộ "${values.name.trim()}"?`,
        description: (
          <>
            Cán bộ sẽ được thêm vào hệ thống và tạo tài khoản đăng nhập theo email công vụ. Thông tin đăng nhập gồm{" "}
            <strong>email</strong> và <strong>mật khẩu</strong> sẽ được gửi về địa chỉ{" "}
            <strong className="text-slate-800">{values.email?.trim()}</strong>. Cán bộ nên đổi mật khẩu sau lần đăng
            nhập đầu tiên.
          </>
        ),
        okText: "Thêm nhân sự",
      }))
    )
      return;
    setSubmitting(true);
    try {
      const matchedOpt = allRoleOptions.find((o) => o.value === values.teamRole);
      const isLeader = matchedOpt ? matchedOpt.isLeader : false;
      const title = matchedOpt?.title || values.title || "Thành viên";
      const roleCode = values.roleCode || matchedOpt?.roleCode || "TECHNICAL_OFFICER";

      let filteredCustomFields: Record<string, any> | undefined = undefined;
      if (values.customFields) {
        const result: Record<string, any> = {};
        for (const field of customFields) {
          const isApplied = appliedFieldIds[field.id] !== false;
          if (isApplied && values.customFields[field.name] !== undefined && values.customFields[field.name] !== "") {
            result[field.name] = values.customFields[field.name];
          }
        }
        if (Object.keys(result).length > 0) {
          filteredCustomFields = result;
        }
      }

      const payload: StaffInput = {
        name: values.name.trim(),
        citizenId: values.citizenId?.trim() || undefined,
        dob: values.dob?.trim() || undefined,
        gender: values.gender,
        teamId: values.teamId,
        title,
        employment: values.employment,
        phone: values.phone?.trim() || "",
        email: values.email?.trim(),
        roleCode,
        isLeader,
        username: values.email?.trim(),
        password: "1111",
        accountActive: true,
        customFields: filteredCustomFields,
      };
      if (await createStaff.run(payload)) {
        form.resetFields();
        onCreated?.();
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const teamOptions = teams.map((t) => ({
    value: t.id,
    searchText: `${t.name} ${t.id}`,
    label: `${t.name} (${t.id})`,
  }));

  const handleTeamChange = (newTeamId: TeamId) => {
    form.setFieldValue("teamId", newTeamId);
    // Nếu người dùng chưa chọn vai trò nào thì mới tự động gán vai trò của phòng ban mới
    const currentVal = form.getFieldValue("teamRole");
    if (!currentVal) {
      const defaultRole = allRoleOptions.find((r) => r.teamId === newTeamId) || allRoleOptions[0];
      if (defaultRole) {
        form.setFieldValue("teamRole", defaultRole.value);
        form.setFieldValue("roleCode", defaultRole.roleCode);
        form.setFieldValue("title", defaultRole.title);
      }
    }
  };

  const handleTeamRoleChange = (roleValue: string) => {
    const matched = allRoleOptions.find((opt) => opt.value === roleValue);
    if (matched) {
      // Mỗi vị trí gắn với một phòng ban (quyền khác nhau) → đồng bộ bộ phận trực thuộc
      if (matched.teamId && matched.teamId !== form.getFieldValue("teamId")) {
        form.setFieldValue("teamId", matched.teamId as TeamId);
      }
      form.setFieldValue("roleCode", matched.roleCode);
      if (matched.title) {
        form.setFieldValue("title", matched.title);
      } else {
        form.setFieldValue("title", "");
      }
    }
  };

  // Tìm trong dropdown: không phân biệt hoa/thường và dấu ("giam doc" khớp "Giám đốc")
  const filterBySearchText = (input: string, option?: any) => {
    if (!input) return true;
    const searchTarget = option?.searchText || option?.label || option?.value || "";
    return normalizeSearchText(String(searchTarget)).includes(normalizeSearchText(input));
  };

  const initialTeam = teams[0];
  const initialBasePos = BASE_TEAM_POSITIONS[initialTeam?.id || "BGD"]?.[0];

  return (
    <Drawer
      open
      width="min(680px, 100vw)"
      closable={false}
      onClose={onClose}
      destroyOnClose
      className="[&_.ant-drawer-header]:py-3 [&_.ant-drawer-body]:p-4 [&_.ant-drawer-footer]:py-2.5"
      title={
        <div>
          <Text className="text-base font-bold text-[#102A43]">
            Thêm nhân sự mới
          </Text>
          <Text className="block text-xs font-normal text-slate-500">
            Khởi tạo hồ sơ và chức danh của cán bộ trên hệ thống
          </Text>
        </div>
      }
      footer={
        <div className="flex items-center justify-start gap-3 px-1 py-1">
          <Button
            intent="primary"
            onClick={() => form.submit()}
            loading={submitting}
          >
            Thêm nhân sự
          </Button>
          <Button
            intent="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Đóng
          </Button>
        </div>
      }
    >
      {createStaff.error && (
        <div role="alert" className="mb-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
          <InfoCircleOutlined className="mt-0.5 text-rose-500" />
          <span><strong>Chưa thể tạo nhân sự:</strong> {createStaff.error.message}</span>
        </div>
      )}

      <Form<StaffFormValues>
        form={form}
        layout="vertical"
        className="[&_.ant-form-item]:mb-2.5 [&_.ant-form-item-label]:!pb-0.5 [&_.ant-form-item-label>label]:text-xs [&_.ant-form-item-label>label]:font-semibold [&_.ant-form-item-label>label]:text-slate-700"
        initialValues={{
          gender: "Nam",
          employment: "Viên chức",
          teamId: (initialTeam?.id ?? "BGD") as TeamId,
          teamRole: initialBasePos ? `ROLE_${initialTeam?.id ?? "BGD"}_${initialBasePos.title}` : "",
          roleCode: initialBasePos?.roleCode || "ADMIN",
          title: initialBasePos?.title || "Giám đốc",
        }}
        onFinish={handleFinish}
      >
        {/* Section 1: Thông tin hồ sơ nhân sự */}
        <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50/40 p-3.5">
          <div className="mb-2.5 flex items-center gap-1.5 border-b border-slate-200/70 pb-1.5">
            <Text className="text-xs font-bold text-[#102A43]">Thông tin hồ sơ nhân sự</Text>
          </div>

          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="name"
                label="Họ và tên cán bộ"
                rules={[{ required: true, whitespace: true, message: "Vui lòng nhập họ và tên." }]}
              >
                <Input placeholder="Ví dụ: Nguyễn Văn An" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label="Email công vụ"
                rules={[
                  { required: true, whitespace: true, message: "Vui lòng nhập email." },
                  { type: "email", message: "Email không đúng định dạng." },
                ]}
              >
                <Input prefix={<MailOutlined className="text-slate-400" />} placeholder="canbo@hatien.gov.vn" />
              </Form.Item>
            </Col>

            {/* Ngày sinh & Giới tính */}
            <Col xs={24} sm={12}>
              <Form.Item
                name="dob"
                label="Ngày sinh"
                rules={[{ required: true, message: "Vui lòng chọn ngày sinh." }]}
                getValueProps={dobGetValueProps}
                normalize={dobNormalize}
              >
                {/* Ô ngày của trình duyệt: chọn trên lịch, không cho gõ tay; lưu dạng dd/mm/yyyy như hồ sơ cán bộ */}
                <Input {...dobInputProps()} className="w-full cursor-pointer" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="gender"
                label="Giới tính"
                rules={[{ required: true, message: "Vui lòng chọn giới tính." }]}
              >
                <Select
                  options={[
                    { value: "Nam", label: "Nam" },
                    { value: "Nữ", label: "Nữ" },
                  ]}
                  placeholder="Chọn giới tính"
                />
              </Form.Item>
            </Col>

            {/* Tổ / Bộ phận và Vị trí trong tổ */}
            <Col xs={24} sm={12}>
              <Form.Item
                name="teamId"
                label="Tất cả phòng ban"
                rules={[{ required: true, message: "Vui lòng chọn tổ công tác." }]}
              >
                <Select
                  showSearch
                  placeholder="Gõ để tìm phòng ban..."
                  options={teamOptions}
                  listHeight={DROPDOWN_LIST_HEIGHT}
                  filterOption={filterBySearchText}
                  onChange={(val) => handleTeamChange(val)}
                  notFoundContent={
                    <div className="py-1 text-xs text-slate-400">Chưa có phòng ban này trong hệ thống.</div>
                  }
                  popupRender={(menu) => (
                    <>
                      {menu}
                      <StaffFormAddOption
                        placeholder="Nhập tên phòng ban mới..."
                        loading={createTeam.isPending}
                        isDuplicate={(name) => teams.some((t) => normalizeSearchText(t.name) === normalizeSearchText(name))}
                        onAdd={handleAddDepartment}
                      />
                    </>
                  )}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="teamRole"
                label="Chức danh"
                rules={[{ required: true, message: "Vui lòng chọn chức danh." }]}
                tooltip="Mỗi cán bộ giữ một chức danh; quyền hạn đi theo chức danh"
              >
                <Select
                  showSearch
                  placeholder="Gõ để tìm chức danh..."
                  options={roleSelectOptions}
                  listHeight={DROPDOWN_LIST_HEIGHT}
                  filterOption={filterBySearchText}
                  onChange={(val) => handleTeamRoleChange(val)}
                  notFoundContent={
                    <div className="py-1 text-xs text-slate-400">Chưa có chức danh này trong hệ thống.</div>
                  }
                  popupRender={(menu) => (
                    <>
                      {menu}
                      <StaffFormAddOption
                        placeholder="Nhập tên chức danh mới..."
                        loading={updateTeam.isPending}
                        isDuplicate={(name) => allRoleOptions.some((opt) => normalizeSearchText(opt.title) === normalizeSearchText(name))}
                        onAdd={handleAddRole}
                      />
                    </>
                  )}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="employment"
                label="Loại hình biên chế"
                rules={[{ required: true, message: "Vui lòng chọn loại biên chế." }]}
              >
                <Select
                  options={[
                    { value: "Viên chức", label: "Viên chức" },
                    { value: "Hợp đồng", label: "Hợp đồng lao động" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Section 2: Trường thông tin tùy biến (cấu hình động - áp dụng linh hoạt khi thêm) */}
        <StaffFormCustomFields
          appliedFieldIds={appliedFieldIds}
          onToggleApplied={handleToggleFieldApplied}
        />
      </Form>
    </Drawer>
  );
}
