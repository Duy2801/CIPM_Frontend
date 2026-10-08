"use client";

import { useState } from "react";
import { ExclamationCircleFilled, PlusCircleOutlined } from "@ant-design/icons";
import { Button, Col, Drawer, Form, Input, Row, Select, Text } from "@/components/ui";
import { BID_STEPS, PACKAGE_TYPES, SELECTION_METHODS } from "../constants/bidding-steps";
import type { BidProject, CreatePackageInput, PackageType, SelectionMethod } from "../types/bidding.types";

interface CreatePackageModalProps {
  projects: BidProject[];
  errorText?: string;
  onClose: () => void;
  onCreate: (input: CreatePackageInput) => Promise<boolean>;
}

interface FormValues {
  name: string;
  projectId: string;
  method: SelectionMethod;
  estimatedPrice: string;
  type: PackageType;
  currentStep: number;
  winner?: string;
  winningPrice?: string;
  bidDeadline?: string;
  note?: string;
}

const STEP_OPTIONS = BID_STEPS.map((s) => ({
  value: s.number,
  label: `B${s.number} – ${s.title}`,
}));

export default function CreatePackageModal({
  projects,
  errorText,
  onClose,
  onCreate,
}: CreatePackageModalProps) {
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const success = await onCreate({
        name: values.name.trim(),
        projectId: values.projectId,
        type: values.type,
        method: values.method,
        estimatedPrice: Number(values.estimatedPrice),
        currentStep: Number(values.currentStep) || 1,
        winner: values.winner?.trim() || undefined,
        winningPrice: values.winningPrice ? Number(values.winningPrice) : undefined,
        bidDeadline: values.bidDeadline?.trim() || undefined,
        note: values.note?.trim() || undefined,
      });
      if (success) {
        form.resetFields();
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      open
      width="min(680px, 100vw)"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-start gap-3 px-1 py-1">
          <Button
            intent="primary"
            onClick={() => form.submit()}
            loading={submitting}
            className="!bg-[#007A78] !border-[#007A78] hover:!bg-[#006361] !text-white font-semibold"
          >
            Lưu gói thầu
          </Button>
          <Button intent="outline" onClick={onClose} disabled={submitting}>
            Đóng
          </Button>
        </div>
      }
      title={
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#007A78] text-white">
            <PlusCircleOutlined className="text-base" />
          </span>
          <div>
            <Text className="text-base font-bold text-[#102A43]">
              Thêm gói thầu mới
            </Text>
            <Text className="block text-xs font-normal text-slate-500 mt-0.5">
              Khởi tạo thông tin gói thầu và quy trình lựa chọn nhà thầu
            </Text>
          </div>
        </div>
      }
    >
      {errorText && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-800"
        >
          <ExclamationCircleFilled className="mt-0.5 text-rose-500" />
          <span>
            <strong>Chưa thể lưu gói thầu:</strong> {errorText}
          </span>
        </div>
      )}

      <Form<FormValues>
        form={form}
        layout="vertical"
        initialValues={{
          projectId: projects[0]?.id,
          method: "Chỉ định thầu",
          type: "Tư vấn thiết kế",
          currentStep: 1,
        }}
        onFinish={handleFinish}
        className="pt-2"
      >
        {/* Tên gói thầu */}
        <Form.Item
          name="name"
          label={<span className="font-semibold text-xs text-slate-700 uppercase tracking-wide">Tên gói thầu *</span>}
          rules={[{ required: true, whitespace: true, message: "Vui lòng nhập tên gói thầu." }]}
        >
          <Input placeholder="Ví dụ: TV Thiết kế BCKTKT Rạch Đùng GĐ2" />
        </Form.Item>

        {/* Hàng 1: Dự án & Hình thức lựa chọn NT */}
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="projectId"
              label={<span className="font-semibold text-xs text-slate-700 uppercase tracking-wide">Dự án *</span>}
              rules={[{ required: true, message: "Vui lòng chọn dự án." }]}
            >
              <Select
                placeholder="— Chọn dự án —"
                showSearch={{ optionFilterProp: "label" }}
                options={projects.map((project) => ({
                  value: project.id,
                  label: `${project.code} · ${project.name}`,
                }))}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="method"
              label={<span className="font-semibold text-xs text-slate-700 uppercase tracking-wide">Hình thức lựa chọn NT *</span>}
              rules={[{ required: true, message: "Vui lòng chọn hình thức lựa chọn nhà thầu." }]}
            >
              <Select
                options={SELECTION_METHODS.map((method) => ({
                  value: method,
                  label: method,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Hàng 2: Giá gói thầu & Loại gói thầu */}
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="estimatedPrice"
              label={<span className="font-semibold text-xs text-slate-700 uppercase tracking-wide">Giá gói thầu (tỷ đồng) *</span>}
              rules={[
                { required: true, message: "Vui lòng nhập giá gói thầu." },
                { pattern: /^\d+(\.\d{1,3})?$/, message: "Nhập số dương, tối đa 3 chữ số thập phân." },
              ]}
            >
              <Input inputMode="decimal" suffix="tỷ" placeholder="Ví dụ: 0.12" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="type"
              label={<span className="font-semibold text-xs text-slate-700 uppercase tracking-wide">Loại gói thầu</span>}
              rules={[{ required: true, message: "Vui lòng chọn loại gói thầu." }]}
            >
              <Select
                options={PACKAGE_TYPES.map((type) => ({
                  value: type,
                  label: type,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Hàng 3: Bước KHLCNT hiện tại & Nhà thầu trúng thầu */}
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="currentStep"
              label={<span className="font-semibold text-xs text-slate-700 uppercase tracking-wide">Bước KHLCNT hiện tại</span>}
            >
              <Select options={STEP_OPTIONS} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="winner"
              label={<span className="font-semibold text-xs text-slate-700 uppercase tracking-wide">Nhà thầu trúng thầu (Nếu đã có)</span>}
            >
              <Input placeholder="Ví dụ: Cty TNHH TV XD ABC" />
            </Form.Item>
          </Col>
        </Row>

        {/* Hàng 4: Giá trúng thầu & Hạn nộp HSDT */}
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="winningPrice"
              label={<span className="font-semibold text-xs text-slate-700 uppercase tracking-wide">Giá trúng thầu (tỷ đồng)</span>}
            >
              <Input inputMode="decimal" suffix="tỷ" placeholder="Điền sau khi có kết quả" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="bidDeadline"
              label={<span className="font-semibold text-xs text-slate-700 uppercase tracking-wide">Hạn nộp HSDT</span>}
              extra="Định dạng: YYYY-MM-DD"
            >
              <Input placeholder="Ví dụ: 2026-04-15" />
            </Form.Item>
          </Col>
        </Row>

        {/* Ghi chú */}
        <Form.Item
          name="note"
          label={<span className="font-semibold text-xs text-slate-700 uppercase tracking-wide">Ghi chú</span>}
        >
          <Input.TextArea rows={3} placeholder="Ghi chú thêm về gói thầu, số tờ trình, điều kiện..." />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
