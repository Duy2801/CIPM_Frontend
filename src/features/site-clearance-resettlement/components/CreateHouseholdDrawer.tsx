"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AppstoreOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  MinusCircleOutlined,
  NumberOutlined,
  PaperClipOutlined,
  UploadOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import {
  Button,
  Col,
  Drawer,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Tag,
  Text,
} from "@/components/ui";
import { todayIso } from "@/utils/date";
import { cn } from "@/utils/cn";
import { GPMB_STEPS } from "../constants/gpmb-steps";
import type {
  GpmbDataset,
  HouseholdInput,
  LandType,
  MatrixStepCell,
  SpecialStatus,
  StepStatus,
} from "../types/gpmb.types";

interface CreateHouseholdDrawerProps {
  open: boolean;
  data: GpmbDataset;
  errorText?: string;
  onClose: () => void;
  onCreate: (input: HouseholdInput) => Promise<boolean>;
}

const LAND_TYPE_OPTIONS: { value: LandType; label: string }[] = [
  { value: "ONT", label: "ONT – Đất ở nông thôn" },
  { value: "CLN", label: "CLN – Đất trồng cây lâu năm" },
  { value: "RSX", label: "RSX – Đất rừng sản xuất" },
  { value: "HNK", label: "HNK – Đất trồng cây hàng năm khác" },
  { value: "Hỗn hợp", label: "Hỗn hợp – Nhiều loại đất" },
];

const SPECIAL_STATUS_OPTIONS: { value: SpecialStatus; label: string }[] = [
  { value: "NORMAL", label: "Bình thường (Đồng thuận)" },
  { value: "UNCOOPERATIVE", label: "Không hợp tác (Cần vận động)" },
  { value: "COMPLAINT", label: "Khiếu kiện (Đang giải quyết)" },
  { value: "ENFORCEMENT", label: "Cưỡng chế (Thu hồi bắt buộc)" },
];

const STEP_OPTIONS = GPMB_STEPS.map((s) => ({
  value: s.number,
  label: `Bước ${s.number}: ${s.title} (${s.label})`,
}));

function buildDefaultMatrix(currentStepNumber: number): MatrixStepCell[] {
  const today = todayIso();
  return GPMB_STEPS.map((s) => {
    let status: StepStatus = "PENDING";
    let completedAt: string | undefined = undefined;
    let documentNo: string | undefined = undefined;

    if (s.number < currentStepNumber) {
      status = "COMPLETED";
      completedAt = today;
      documentNo = `${String(s.number).padStart(2, "0")}/HD-BT`;
    } else if (s.number === currentStepNumber) {
      status = "IN_PROGRESS";
    }

    return {
      step: s.number,
      status,
      completedAt,
      documentNo,
    };
  });
}

export default function CreateHouseholdDrawer({
  open,
  data,
  errorText,
  onClose,
  onCreate,
}: CreateHouseholdDrawerProps) {
  const [form] = Form.useForm<HouseholdInput>();
  const [submitting, setSubmitting] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [matrixSteps, setMatrixSteps] = useState<MatrixStepCell[]>([]);
  const [editingCell, setEditingCell] = useState<MatrixStepCell | null>(null);
  const [selectedCellFileName, setSelectedCellFileName] = useState<string>("");
  const [editForm] = Form.useForm<{
    status: StepStatus;
    completedAt?: string;
    documentNo?: string;
    fileName?: string;
    note?: string;
  }>();

  // Khởi tạo dự án mặc định khi mở
  useEffect(() => {
    if (open) {
      const defaultProjId = data.projects[0]?.id || "";
      setSelectedProjectId(defaultProjId);
      setCurrentStep(1);
      setMatrixSteps(buildDefaultMatrix(1));
      form.setFieldsValue({
        projectId: defaultProjId,
        landType: "ONT",
        areaM2: 120.5,
        compensation: 0.85,
        currentStep: 1,
        specialStatus: "NORMAL",
      });
    }
  }, [open, data.projects, form]);

  // Tự sinh mã hộ: DA-001-HD-001
  const generatedCode = useMemo(() => {
    const project = data.projects.find((p) => p.id === selectedProjectId);
    const projectCode = project?.code || "DA-001";
    const countInProj = data.households.filter((h) => h.projectId === selectedProjectId).length;
    return `${projectCode}-HD-${String(countInProj + 1).padStart(3, "0")}`;
  }, [data.projects, data.households, selectedProjectId]);

  // Cập nhật ma trận khi người dùng đổi Bước hiện tại
  const handleCurrentStepChange = (newStep: number) => {
    setCurrentStep(newStep);
    setMatrixSteps((prev) =>
      GPMB_STEPS.map((s) => {
        const existing = prev.find((item) => item.step === s.number);
        let status: StepStatus = "PENDING";
        if (s.number < newStep) {
          status = "COMPLETED";
        } else if (s.number === newStep) {
          status = "IN_PROGRESS";
        }
        return {
          step: s.number,
          status,
          completedAt:
            existing?.completedAt || (status === "COMPLETED" ? todayIso() : undefined),
          documentNo:
            existing?.documentNo ||
            (status === "COMPLETED"
              ? `${String(s.number).padStart(2, "0")}/HD-BT`
              : undefined),
          fileName: existing?.fileName,
          note: existing?.note,
        };
      })
    );
  };

  // Mở popup cập nhật từng ô trong 16 ô
  const handleOpenCellEditor = (cell: MatrixStepCell) => {
    setEditingCell(cell);
    setSelectedCellFileName(cell.fileName || "");
    editForm.setFieldsValue({
      status: cell.status,
      completedAt: cell.completedAt || (cell.status === "COMPLETED" ? todayIso() : ""),
      documentNo: cell.documentNo || "",
      fileName: cell.fileName || "",
      note: cell.note || "",
    });
  };

  // Lưu ô đang sửa
  const handleSaveCell = (values: {
    status: StepStatus;
    completedAt?: string;
    documentNo?: string;
    fileName?: string;
    note?: string;
  }) => {
    if (!editingCell) return;
    setMatrixSteps((prev) =>
      prev.map((item) =>
        item.step === editingCell.step
          ? {
              ...item,
              status: values.status,
              completedAt: values.completedAt,
              documentNo: values.documentNo,
              fileName: values.fileName,
              note: values.note,
            }
          : item
      )
    );
    setEditingCell(null);
  };

  const handleFinish = async (values: HouseholdInput) => {
    setSubmitting(true);
    try {
      const payload: HouseholdInput = {
        ...values,
        code: generatedCode,
        areaM2: Number(Number(values.areaM2).toFixed(2)) || 0,
        compensation: Number(values.compensation) || 0,
        currentStep: Number(values.currentStep) || 1,
        specialStatus: values.specialStatus || "NORMAL",
        matrixSteps,
      };
      const success = await onCreate(payload);
      if (success) {
        form.resetFields();
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const projectOptions = data.projects.map((p) => ({
    value: p.id,
    label: `${p.code} · ${p.name}`,
  }));

  const editingStepDef = editingCell
    ? GPMB_STEPS.find((s) => s.number === editingCell.step)
    : null;

  return (
    <Drawer
      open={open}
      width="min(680px, 100vw)"
      onClose={onClose}
      destroyOnClose
      title={
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B2546] text-white">
            <UserAddOutlined className="text-base" />
          </span>
          <div>
            <Text className="text-base font-bold text-[#102A43]">
              Thêm hồ sơ hộ dân thu hồi đất
            </Text>
            <Text className="block text-xs font-normal text-slate-500">
              Khởi tạo hồ sơ bồi thường, đo đạc và ma trận tiến độ 16 bước
            </Text>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-start gap-3 px-1 py-1">
          <Button
            intent="primary"
            onClick={() => form.submit()}
            loading={submitting}
          >
            Thêm hộ dân
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

      <Form<HouseholdInput>
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="space-y-4"
      >
        {/* Nhóm 1: Định danh & Mã hộ */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="flex items-center gap-2 text-[13px] font-bold text-[#102A43]">
              <NumberOutlined className="text-[#0F4C81]" />
              Dự án & Mã hồ sơ hộ dân
            </span>
            <Tag intent="subtle" scale="sm" className="font-semibold text-xs">
              Mã tự sinh
            </Tag>
          </div>

          <Row gutter={[16, 0]}>
            <Col xs={24} sm={14}>
              <Form.Item
                name="projectId"
                label="Dự án thực hiện GPMB"
                rules={[{ required: true, message: "Vui lòng chọn dự án." }]}
              >
                <Select
                  options={projectOptions}
                  onChange={(val) => {
                    setSelectedProjectId(val);
                    form.setFieldValue("projectId", val);
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={10}>
              <Form.Item label="Mã hộ dân (Tự sinh)">
                <Input
                  value={generatedCode}
                  disabled
                  className="!bg-slate-100 !text-[#102A43] font-bold font-mono tracking-wide"
                  prefix={<span className="text-slate-400 font-normal text-xs">MÃ:</span>}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Nhóm 2: Tên chủ hộ + CCCD */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
            <UserAddOutlined className="text-[#0F4C81]" />
            <Text className="text-[13px] font-bold text-[#102A43]">
              Thông tin chủ hộ (Theo CCCD)
            </Text>
          </div>

          <Row gutter={[16, 0]}>
            <Col xs={24} sm={14}>
              <Form.Item
                name="ownerName"
                label="Tên chủ hộ (Theo căn cước công dân)"
                rules={[
                  { required: true, message: "Vui lòng nhập tên chủ hộ theo CCCD." },
                ]}
              >
                <Input placeholder="vd: Nguyễn Văn An (theo CCCD)" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={10}>
              <Form.Item
                name="idNumber"
                label="Số CCCD"
                rules={[
                  { required: true, message: "Vui lòng nhập số CCCD." },
                  { pattern: /^\d{12}$/, message: "CCCD phải gồm đúng 12 chữ số." },
                ]}
              >
                <Input
                  maxLength={12}
                  placeholder="091090001234 (12 số)"
                  className="font-mono"
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item name="address" label="Địa chỉ / Thửa đất thu hồi">
                <Input placeholder="Tổ, ấp/khu phố, xã/phường nơi có đất bị thu hồi..." />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Nhóm 3: Đất & Bồi thường & Trạng thái */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
            <FileTextOutlined className="text-[#0F4C81]" />
            <Text className="text-[13px] font-bold text-[#102A43]">
              Phương án bồi thường & Phân loại đất
            </Text>
          </div>

          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="areaM2"
                label="Diện tích thu hồi (m² - Biên bản đo đạc)"
                rules={[
                  { required: true, message: "Vui lòng nhập diện tích thu hồi." },
                ]}
                extra="Biên bản đo đạc, hỗ trợ 2 chữ số thập phân (> 0)"
              >
                <Input
                  type="number"
                  min={0.01}
                  step={0.01}
                  suffix="m²"
                  placeholder="vd: 185.50"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="landType"
                label="Loại đất"
                rules={[{ required: true, message: "Vui lòng chọn loại đất." }]}
              >
                <Select options={LAND_TYPE_OPTIONS} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="compensation"
                label="Tiền BT theo phương án (tỷ đồng)"
                rules={[
                  { required: true, message: "Vui lòng nhập số tiền bồi thường." },
                ]}
                extra="Theo QĐ phê duyệt phương án (đồng bộ với M4)"
              >
                <Input
                  type="number"
                  min={0}
                  step={0.001}
                  suffix="tỷ đồng"
                  placeholder="vd: 1.245"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="specialStatus"
                label="Trạng thái đặc biệt"
                rules={[{ required: true, message: "Vui lòng chọn trạng thái." }]}
              >
                <Select options={SPECIAL_STATUS_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Nhóm 4: Bước hiện tại (1–16) & Ma trận ô trạng thái */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="flex items-center gap-2 text-[13px] font-bold text-[#102A43]">
              <AppstoreOutlined className="text-[#0F4C81]" />
              Tiến độ & Ma trận 16 ô trạng thái
            </span>
            <span className="text-xs text-slate-500">
              Nhấp vào ô để cập nhật
            </span>
          </div>

          <div className="mb-3">
            <Form.Item
              name="currentStep"
              label="Bước hiện tại (1–16)"
              rules={[
                { required: true, message: "Vui lòng chọn bước hiện tại." },
              ]}
              extra="Tự cập nhật hoặc chọn thủ công. Các bước trước sẽ tự động đánh dấu đã hoàn thành."
            >
              <Select
                options={STEP_OPTIONS}
                value={currentStep}
                onChange={(val) => {
                  handleCurrentStepChange(Number(val));
                  form.setFieldValue("currentStep", Number(val));
                }}
              />
            </Form.Item>
          </div>

          {/* Lưới 16 ô trạng thái */}
          <div className="mt-3">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Bảng 16 ô quy trình GPMB:</span>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Hoàn thành
                </span>
                <span className="inline-flex items-center gap-1 text-blue-700">
                  <span className="h-2 w-2 rounded-full bg-blue-500" /> Đang làm
                </span>
                <span className="inline-flex items-center gap-1 text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-slate-300" /> Chưa làm
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {matrixSteps.map((cell) => {
                const stepDef = GPMB_STEPS.find((s) => s.number === cell.step);
                const isCompleted = cell.status === "COMPLETED";
                const isInProgress = cell.status === "IN_PROGRESS";

                return (
                  <button
                    key={cell.step}
                    type="button"
                    onClick={() => handleOpenCellEditor(cell)}
                    className={cn(
                      "group relative flex flex-col justify-between rounded-lg border p-2 text-left transition-all cursor-pointer",
                      isCompleted &&
                        "border-emerald-200 bg-emerald-50/60 hover:border-emerald-400 hover:bg-emerald-50",
                      isInProgress &&
                        "border-blue-300 bg-blue-50/70 ring-1 ring-blue-300 hover:border-blue-400 hover:bg-blue-50",
                      !isCompleted &&
                        !isInProgress &&
                        "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white"
                    )}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.2 text-[11px] font-bold",
                          isCompleted && "bg-emerald-600 text-white",
                          isInProgress && "bg-blue-600 text-white",
                          !isCompleted && !isInProgress && "bg-slate-200 text-slate-600"
                        )}
                      >
                        B{String(cell.step).padStart(2, "0")}
                      </span>
                      <span className="text-[10px] text-slate-400 group-hover:text-slate-700 flex items-center gap-0.5">
                        <EditOutlined className="text-[9px]" />
                        Sửa
                      </span>
                    </div>

                    <div className="my-1">
                      <span className="block text-xs font-semibold text-slate-800 line-clamp-1" title={stepDef?.title}>
                        {stepDef?.label || `Bước ${cell.step}`}
                      </span>
                      {cell.documentNo ? (
                        <span className="block text-[10.5px] text-slate-500 font-mono truncate" title={cell.documentNo}>
                          {cell.documentNo}
                        </span>
                      ) : (
                        <span className="block text-[10.5px] text-slate-400">
                          {isCompleted ? "Đã xong" : isInProgress ? "Đang tiến hành" : "Chưa thực hiện"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400 mt-auto">
                      {cell.completedAt ? (
                        <span className="flex items-center gap-1">
                          <CalendarOutlined className="text-[9px]" />
                          {cell.completedAt}
                        </span>
                      ) : (
                        <span />
                      )}
                      {cell.fileName && (
                        <span className="flex items-center gap-0.5 text-[#007A78] font-semibold" title={cell.fileName}>
                          <PaperClipOutlined className="text-[9px]" />
                          Tệp
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <Form.Item name="note" label="Ghi chú hồ sơ" className="mb-2">
          <Input.TextArea
            rows={2}
            placeholder="Ghi chú thêm về hoàn cảnh hộ dân, nguồn gốc đất, nhân khẩu..."
          />
        </Form.Item>
      </Form>

      {/* Modal cập nhật từng ô trạng thái */}
      {editingCell && editingStepDef && (
        <Modal
          open={Boolean(editingCell)}
          title={
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#0B2546] px-2 py-0.5 text-xs font-bold text-white">
                Bước {editingCell.step}
              </span>
              <span className="font-bold text-[#102A43]">
                {editingStepDef.title}
              </span>
            </div>
          }
          onCancel={() => setEditingCell(null)}
          footer={[
            <Button
              key="submit"
              intent="primary"
              onClick={() => editForm.submit()}
            >
              Lưu ô trạng thái
            </Button>,
            <Button
              key="cancel"
              intent="outline"
              onClick={() => setEditingCell(null)}
            >
              Đóng
            </Button>,
          ]}
        >
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleSaveCell}
            className="pt-2"
          >
            <Form.Item
              name="status"
              label="Trạng thái bước"
              rules={[{ required: true, message: "Chọn trạng thái." }]}
            >
              <Select
                options={[
                  { value: "COMPLETED", label: "Hoàn thành (Đã ban hành văn bản)" },
                  { value: "IN_PROGRESS", label: "Đang thực hiện" },
                  { value: "PENDING", label: "Chưa thực hiện" },
                ]}
              />
            </Form.Item>

            <Form.Item
              name="completedAt"
              label="Ngày thực hiện / hoàn thành"
              extra="Định dạng: YYYY-MM-DD"
            >
              <Input placeholder="2026-03-15" />
            </Form.Item>

            <Form.Item
              name="documentNo"
              label="Số văn bản / Biên bản"
              extra="Số quyết định, biên bản họp dân, phương án..."
            >
              <Input placeholder="vd: 12/TB-UBND hoặc 05/PA-BT" />
            </Form.Item>

            <Form.Item
              name="fileName"
              label={
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <PaperClipOutlined className="text-slate-400" />
                  Tệp đính kèm {editingStepDef?.forms ? `(${editingStepDef.forms})` : "(tùy chọn)"}
                </span>
              }
              extra="Đính kèm biên bản scan, quyết định, phiếu khảo sát (PDF, DOC, DOCX, ảnh)"
            >
              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 hover:border-[#007A78] text-xs font-medium text-slate-700 transition-colors shadow-2xs">
                  <UploadOutlined className="text-teal-700 text-sm" />
                  <span>Chọn tệp đính kèm</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      const name = file?.name ?? "";
                      editForm.setFieldsValue({ fileName: name });
                      setSelectedCellFileName(name);
                    }}
                  />
                </label>

                {selectedCellFileName ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-xs text-teal-800 font-medium">
                    <FileTextOutlined className="text-teal-600" />
                    <span className="truncate max-w-[200px]">{selectedCellFileName}</span>
                    <button
                      type="button"
                      onClick={() => {
                        editForm.setFieldsValue({ fileName: "" });
                        setSelectedCellFileName("");
                      }}
                      className="text-slate-400 hover:text-rose-600 ml-1 cursor-pointer font-bold"
                      title="Xóa tệp"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    Chưa có tệp được chọn
                  </span>
                )}
              </div>
            </Form.Item>

            <Form.Item name="note" label="Ghi chú bước">
              <Input.TextArea
                rows={2}
                placeholder="Ghi chú chi tiết cho bước này..."
              />
            </Form.Item>
          </Form>
        </Modal>
      )}
    </Drawer>
  );
}
