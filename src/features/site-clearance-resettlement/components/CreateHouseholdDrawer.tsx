"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeftOutlined, FileDoneOutlined, InfoCircleOutlined, UserAddOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  Drawer,
  Form,
  Input,
  Row,
  Select,
  STANDARD_DRAWER_WIDTH,
  StandardFileUpload,
  Text,
  Tooltip,
  type UploadedAttachment,
} from "@/components/ui";
import { todayIso } from "@/utils/date";
import { readFileForStorage } from "@/utils/stored-file";
import { useProjectScope } from "@/components/workspace";
import type { CompensationItem, GpmbDataset, HouseholdFile, HouseholdInput, SpecialStatus } from "../types/gpmb.types";
import { landCodeFromName, summarizeCompensation } from "../utils/gpmb-compensation";
import CompensationItemsEditor from "./CompensationItemsEditor";
import { rememberCatalogItems } from "../utils/compensation-catalog-store";

interface CreateHouseholdDrawerProps {
  open: boolean;
  data: GpmbDataset;
  errorText?: string;
  onClose: () => void;
  onCreate: (input: HouseholdInput) => Promise<boolean>;
}

/** Giá trị chọn "Khác (tự nhập)" trong các ô chọn */
const OTHER = "__other__";

/** Loại đất suy ra từ các khoản bồi thường về đất trong bảng kê (nhiều loại → "Hỗn hợp") */
function landTypeFromItems(items: CompensationItem[]): string {
  const codes = new Set(
    items
      .filter((i) => i.group === "LAND" && i.name.trim())
      .map((i) => landCodeFromName(i.name)),
  );
  if (codes.size > 1) return "Hỗn hợp";
  return [...codes][0] ?? "Chưa xác định";
}

const SPECIAL_STATUS_OPTIONS = [
  { value: "NORMAL", label: "Bình thường (Đồng thuận)" },
  { value: "UNCOOPERATIVE", label: "Không hợp tác (Cần vận động)" },
  { value: "COMPLAINT", label: "Khiếu kiện (Đang giải quyết)" },
  { value: "ENFORCEMENT", label: "Cưỡng chế (Thu hồi bắt buộc)" },
  { value: OTHER, label: "Khác (tự nhập)" },
];


interface FormValues {
  projectId: string;
  ownerName: string;
  idNumber: string;
  address?: string;
  birthDate?: string;
  phone?: string;
  statusChoice: string;
  statusOther?: string;
  note?: string;
}

/** Thêm hồ sơ hộ dân: thông tin chủ hộ, đất thu hồi, tình trạng và bảng kê bồi thường, hỗ trợ */
export default function CreateHouseholdDrawer({ open, data, errorText, onClose, onCreate }: CreateHouseholdDrawerProps) {
  const scopedProjectId = useProjectScope();
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [compensationItems, setCompensationItems] = useState<CompensationItem[]>([]);
  const [itemsError, setItemsError] = useState(false);
  const [originFiles, setOriginFiles] = useState<UploadedAttachment[]>([]);

  const projectId = Form.useWatch("projectId", form) ?? data.projects[0]?.id ?? "";
  const statusChoice = Form.useWatch("statusChoice", form);

  // Mã hộ tự sinh theo dự án: DA-001-HD-001
  const generatedCode = useMemo(() => {
    const project = data.projects.find((p) => p.id === projectId);
    const count = data.households.filter((h) => h.projectId === projectId).length;
    return `${project?.code || "DA-001"}-HD-${String(count + 1).padStart(3, "0")}`;
  }, [data.projects, data.households, projectId]);

  const close = () => {
    form.resetFields();
    setCompensationItems([]);
    setItemsError(false);
    setOriginFiles([]);
    onClose();
  };

  const handleFinish = async (values: FormValues) => {
    if (compensationItems.length === 0) {
      setItemsError(true);
      return;
    }
    const isOtherStatus = values.statusChoice === OTHER;
    setSubmitting(true);
    try {
      // Hồ sơ nguồn gốc đất: đọc nội dung tệp để xem lại sau
      const landOriginFiles: HouseholdFile[] = await Promise.all(
        originFiles.map(async (f) => {
          const dataUrl = await readFileForStorage(f.id, f.rawFile);
          return { id: f.id, name: f.name, size: f.size, ...(dataUrl ? { dataUrl } : {}) };
        }),
      );
      const success = await onCreate({
        code: generatedCode,
        projectId: values.projectId,
        ownerName: values.ownerName,
        idNumber: values.idNumber,
        address: values.address,
        // Diện tích thu hồi = tổng diện tích các thửa đất trong bảng kê
        areaM2: Number(
          compensationItems.filter((i) => i.group === "LAND").reduce((sum, i) => sum + i.quantity, 0).toFixed(2),
        ),
        birthDate: values.birthDate || undefined,
        phone: values.phone?.trim() || undefined,
        landOriginFiles,
        landType: landTypeFromItems(compensationItems),
        specialStatus: (isOtherStatus ? "OTHER" : values.statusChoice) as SpecialStatus,
        specialStatusLabel: isOtherStatus ? values.statusOther?.trim() : undefined,
        currentStep: 1,
        // Tổng tiền = tổng bảng kê
        compensation: summarizeCompensation({ compensation: 0, compensationItems }).total,
        compensationItems,
        note: values.note,
      });
      if (success) {
        // Khoản con vừa nhập được giữ lại để lần sau chọn lại
        rememberCatalogItems(compensationItems, values.projectId);
        close();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      open={open}
      width={STANDARD_DRAWER_WIDTH}
      onClose={close}
      destroyOnClose
      closable={false}
      title={
        <div className="flex items-center gap-3">
          <Tooltip title="Quay lại">
            <button
              type="button"
              aria-label="Quay lại"
              onClick={close}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            >
              <ArrowLeftOutlined className="text-sm" />
            </button>
          </Tooltip>
          <div>
            <Text className="text-base font-bold text-[#102A43]">Thêm hồ sơ hộ dân thu hồi đất</Text>
            <Text className="block text-xs font-normal text-slate-500">Thông tin chủ hộ, đất thu hồi và bảng kê bồi thường</Text>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-start gap-3 px-1 py-1">
          <Button intent="primary" onClick={() => form.submit()} loading={submitting}>
            Thêm hộ dân
          </Button>
        </div>
      }
    >
      {errorText && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-800"
        >
          <InfoCircleOutlined className="mt-0.5 text-rose-500" />
          <span>
            <strong>Chưa thể tạo hồ sơ:</strong> {errorText}
          </span>
        </div>
      )}

      <Form<FormValues>
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="space-y-4"
        initialValues={{
          projectId: data.projects[0]?.id,
          statusChoice: "NORMAL",
        }}
      >
        {/* Thông tin hộ dân: dự án, mã hộ, chủ hộ theo CCCD */}
        <Section icon={<UserAddOutlined />} title="Thông tin hộ dân">
          <Row gutter={[16, 0]}>
            <Col xs={24}>
              <Form.Item name="projectId" label="Dự án" rules={[{ required: true, message: "Vui lòng chọn dự án." }]}>
                <Select
                  disabled={Boolean(scopedProjectId)}
                  options={data.projects.map((p) => ({ value: p.id, label: p.name }))}
                />
              </Form.Item>
            </Col>

            {/* Chủ hộ */}
            <Col xs={24} sm={16}>
              <Form.Item
                name="ownerName"
                label="Họ và tên"
                rules={[{ required: true, whitespace: true, message: "Vui lòng nhập tên chủ hộ theo CCCD." }]}
              >
                <Input placeholder="Theo căn cước công dân" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="birthDate" label="Ngày sinh">
                <Input type="date" max={todayIso()} />
              </Form.Item>
            </Col>

            {/* Giấy tờ & liên hệ: 2 ô đều nhau */}
            <Col xs={24} sm={12}>
              <Form.Item
                name="idNumber"
                label="CCCD"
                rules={[
                  { required: true, message: "Vui lòng nhập số CCCD." },
                  { pattern: /^\d{12}$/, message: "CCCD gồm đúng 12 chữ số." },
                ]}
              >
                <Input maxLength={12} inputMode="numeric" placeholder="12 chữ số" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="phone"
                label="SĐT"
                rules={[{ pattern: /^0\d{9,10}$/, message: "Số điện thoại không hợp lệ." }]}
              >
                <Input inputMode="tel" maxLength={11} placeholder="vd: 0912345678" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="address" label="Địa chỉ">
                <Input placeholder="Tổ, khu phố, xã/phường, tỉnh" />
              </Form.Item>
            </Col>

            {/* Hồ sơ nguồn gốc đất: tải tệp */}
            <Col xs={24}>
              <Form.Item label="Nguồn gốc sử dụng đất" className="mb-0">
                <StandardFileUpload
                  hideHeader
                  // Nằm trong khối thông tin: bỏ khung ngoài để không thành khung lồng khung
                  className="!rounded-none !border-0 !bg-transparent !p-0"
                  promptText="Nhấn hoặc kéo thả tệp hồ sơ vào đây"
                  value={originFiles}
                  onChange={setOriginFiles}
                />
              </Form.Item>
            </Col>
          </Row>
        </Section>

        {/* Bảng kê bồi thường, hỗ trợ theo phương án */}
        <Section icon={<FileDoneOutlined />} title="Bảng kê bồi thường, hỗ trợ">
          <CompensationItemsEditor
            // Đổi dự án thì nạp lại bảng giá của dự án đó
            key={projectId}
            projectId={projectId}
            value={compensationItems}
            onChange={(items) => {
              setCompensationItems(items);
              if (items.length > 0) setItemsError(false);
            }}
          />
          {itemsError && <p className="m-0 mt-2 text-xs text-rose-600">Vui lòng thêm ít nhất một khoản bồi thường, hỗ trợ.</p>}
        </Section>

        <div>
          <Form.Item
            name="statusChoice"
            label="Trạng thái"
            className={statusChoice === OTHER ? "mb-2" : undefined}
            rules={[{ required: true, message: "Vui lòng chọn trạng thái." }]}
          >
            <Select options={SPECIAL_STATUS_OPTIONS} />
          </Form.Item>
          {statusChoice === OTHER && (
            <Form.Item name="statusOther" rules={[{ required: true, whitespace: true, message: "Vui lòng nhập trạng thái." }]}>
              <Input placeholder="Nhập trạng thái, vd: Chờ xác minh nguồn gốc đất" autoFocus />
            </Form.Item>
          )}
        </div>

        <Form.Item name="note" label="Ghi chú hồ sơ" className="mb-2">
          <Input.TextArea rows={2} placeholder="Ý kiến của hộ dân, nội dung cần bổ sung…" />
        </Form.Item>
      </Form>
    </Drawer>
  );
}

function Section({
  icon,
  title,
  hint,
  children,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
      <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
        <span className="flex items-center gap-2 text-[13px] font-bold text-[#102A43]">
          <span className="text-[#0F4C81]">{icon}</span>
          {title}
        </span>
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
