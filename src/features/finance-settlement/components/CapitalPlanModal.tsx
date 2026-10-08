"use client";

import type { ChangeEvent, ReactNode } from "react";
import { EditOutlined, InfoCircleOutlined, PaperClipOutlined, PlusCircleOutlined, UploadOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { Button, Card, Drawer, Flex, Form, Input, Select, Text } from "@/components/ui";
import { CAPITAL_SOURCES } from "../constants/finance-labels";
import type {
  CapitalPlan,
  CapitalPlanAdjustmentInput,
  CapitalPlanInput,
  CapitalSource,
  FinanceProject,
} from "../types/finance.types";
import { formatVndBillions } from "../utils/finance-rules";

interface CapitalPlanModalProps {
  open: boolean;
  projects: FinanceProject[];
  year: number;
  defaultProjectId?: string;
  adjustingPlan?: CapitalPlan;
  onClose: () => void;
  onCreate: (input: CapitalPlanInput) => Promise<boolean>;
  onAdjust: (input: CapitalPlanAdjustmentInput) => Promise<boolean>;
}

interface FormValues {
  projectId: string;
  year?: number;
  source: CapitalSource;
  amount: string;
  approvalDocument?: string;
  approvalFileName?: string;
}

/** Nhãn trường theo kiểu chuẩn: chữ in hoa, dấu sao đỏ đặt sau nhãn */
function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
      {children} {required && <span className="text-rose-500">*</span>}
    </span>
  );
}

export default function CapitalPlanModal({
  open,
  projects,
  year,
  defaultProjectId,
  adjustingPlan,
  onClose,
  onCreate,
  onAdjust,
}: CapitalPlanModalProps) {
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const isAdjustment = Boolean(adjustingPlan);

  useEffect(() => {
    if (open) {
      if (adjustingPlan) {
        form.setFieldsValue({
          projectId: adjustingPlan.projectId,
          year: adjustingPlan.year ?? year,
          source: adjustingPlan.source,
          amount: "",
          approvalDocument: adjustingPlan.approvalDocument ?? "",
          approvalFileName: adjustingPlan.approvalFileName ?? "",
        });
      } else {
        const initialProjId =
          defaultProjectId ||
          (projects.length > 0 ? projects[0].id : "");
        form.setFieldsValue({
          projectId: initialProjId,
          year: year,
          source: "Ngân sách tỉnh",
          amount: "",
          approvalDocument: "",
          approvalFileName: "",
        });
      }
    }
  }, [open, adjustingPlan, defaultProjectId, year, projects, form]);

  const submit = async (values: FormValues) => {
    setSubmitting(true);
    const amount = Number(values.amount);
    const planYear = values.year ? Number(values.year) : year;
    try {
      const success = adjustingPlan
        ? await onAdjust({
          planId: adjustingPlan.id,
          amount,
          approvalDocument: values.approvalDocument ?? "",
          approvalFileName: values.approvalFileName ?? "",
        })
        : await onCreate({
          projectId: values.projectId,
          year: planYear,
          source: values.source,
          amount,
          approvalDocument: values.approvalDocument ?? "QĐ giao vốn đầu năm",
          approvalFileName: values.approvalFileName,
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
      open={open}
      onClose={onClose}
      width="min(680px, 100vw)"
      destroyOnClose
      title={
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-teal-200 bg-teal-50 text-[#007A78]">
            {isAdjustment ? (
              <EditOutlined className="text-base" />
            ) : (
              <PlusCircleOutlined className="text-base" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-[#102A43] leading-snug">
              {isAdjustment ? "Điều chỉnh Kế hoạch vốn giữa năm" : `Nhập Kế hoạch vốn năm ${year}`}
            </h3>
            <p className="text-xs font-normal text-slate-500 mt-0.5">
              {isAdjustment
                ? "Thẩm quyền: Kế toán trưởng thẩm tra / Giám đốc phê duyệt điều chỉnh"
                : "Thẩm quyền: Kế toán viên (Tổ HC-TH) nhập theo Quyết định giao vốn của UBND"}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-2.5 py-1">
          <Button
            key="submit"
            intent="primary"
            scale="compact"
            className="border-[#007A78] bg-[#007A78] text-white"
            loading={submitting}
            onClick={() => form.submit()}
          >
            {isAdjustment ? "Lưu điều chỉnh" : "Lưu kế hoạch vốn"}
          </Button>
          <Button key="cancel" scale="compact" onClick={onClose} disabled={submitting}>
            Đóng
          </Button>
        </div>
      }
    >
      <div className="text-xs pb-3">
        <Form<FormValues>
          form={form}
          layout="vertical"
          layoutType="compact"
          requiredMark={false}
          className="[&_.ant-form-item]:!mb-3"
          onFinish={submit}
        >
          <Flex vertical gap={14}>
            {adjustingPlan && (
              <Text className="block rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Kế hoạch hiện tại:{" "}
                <strong className="text-[#102A43]">
                  {formatVndBillions(adjustingPlan.initialAmount + adjustingPlan.adjustmentAmount)}
                </strong>
                {" · "}Nhập số dương để tăng, số âm để giảm vốn.
              </Text>
            )}

            <Card surface="quiet" padding="compact" rounded="lg" className="border border-slate-200/80">
              <Flex vertical gap={12}>
                <Form.Item
                  name="projectId"
                  label={<FieldLabel required>Dự án</FieldLabel>}
                  rules={[{ required: true, message: "Vui lòng chọn dự án." }]}
                  className="!mb-0"
                >
                  <Select
                    disabled={isAdjustment}
                    className="text-xs w-full"
                    showSearch
                    optionFilterProp="label"
                    filterOption={(input, option) =>
                      String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                    }
                    placeholder="Chọn dự án cần giao kế hoạch vốn"
                    options={projects.map((item) => ({
                      value: item.id,
                      label: `${item.code} — ${item.name}`,
                    }))}
                  />
                </Form.Item>

                <div className="grid grid-cols-1 gap-x-3.5 sm:grid-cols-2">
                  <Form.Item
                    name="year"
                    label={<FieldLabel required>Niên độ vốn (Năm)</FieldLabel>}
                    rules={[{ required: true, message: "Chọn niên độ." }]}
                    className="!mb-0"
                  >
                    <Select
                      disabled={isAdjustment}
                      className="text-xs"
                      options={[2024, 2025, 2026, 2027, 2028].map((y) => ({
                        value: y,
                        label: `Năm ${y}`,
                      }))}
                    />
                  </Form.Item>

                  <Form.Item
                    name="source"
                    label={<FieldLabel required>Nguồn vốn</FieldLabel>}
                    rules={[{ required: true, message: "Chọn nguồn vốn." }]}
                    className="!mb-0"
                  >
                    <Select
                      disabled={isAdjustment}
                      className="text-xs"
                      options={CAPITAL_SOURCES.map((source) => ({ value: source, label: source }))}
                    />
                  </Form.Item>
                </div>
              </Flex>
            </Card>

            <Card surface="flat" padding="compact" rounded="lg" className="border border-slate-200">
              <Text strong className="mb-2 block text-[11px] uppercase tracking-wide text-slate-800">
                {isAdjustment ? `Giá trị điều chỉnh năm ${year}` : `Kế hoạch vốn năm ${year}`}
              </Text>
              <Form.Item
                name="amount"
                label={<FieldLabel required>{isAdjustment ? "Giá trị điều chỉnh (tỷ đồng)" : "Kế hoạch vốn (tỷ đồng)"}</FieldLabel>}
                className="!mb-0"
                rules={[
                  { required: true, message: "Nhập số tiền." },
                  {
                    pattern: isAdjustment ? /^-?\d+(\.\d{1,3})?$/ : /^\d+(\.\d{1,3})?$/,
                    message: "Tối đa 3 chữ số thập phân.",
                  },
                ]}
              >
                <Input
                  inputMode="decimal"
                  className="font-mono text-xs"
                  placeholder={isAdjustment ? "Ví dụ: 5.500 hoặc -2.000" : "Ví dụ: 25.500"}
                  suffix="tỷ đồng"
                />
              </Form.Item>
            </Card>

            {!isAdjustment && (
              <Card surface="flat" padding="compact" rounded="lg" className="border border-slate-200">
                <Text strong className="mb-2 block text-[11px] uppercase tracking-wide text-slate-800">
                  Căn cứ Quyết định phê duyệt giao vốn (Bắt buộc)
                </Text>
                <Form.Item
                  name="approvalDocument"
                  label={<FieldLabel required>Số Quyết định / Văn bản giao vốn</FieldLabel>}
                  extra="Số quyết định phân bổ chỉ tiêu kế hoạch vốn của UBND Thành phố Hà Tiên / UBND Tỉnh"
                  rules={[{ required: true, whitespace: true, message: "Vui lòng nhập Số Quyết định giao vốn." }]}
                >
                  <Input className="text-xs" placeholder="Ví dụ: 125/QĐ-UBND ngày 15/01/2026" />
                </Form.Item>
                <Form.Item
                  name="approvalFileName"
                  label={<FieldLabel required>File Quyết định phê duyệt</FieldLabel>}
                  extra="Đính kèm file Quyết định giao vốn (.pdf, .doc, .docx) — Bắt buộc ≥ 1 file"
                  rules={[{ required: true, message: "Vui lòng đính kèm file Quyết định giao vốn." }]}
                  getValueFromEvent={(event: ChangeEvent<HTMLInputElement>) => event.target.files?.[0]?.name ?? ""}
                  getValueProps={() => ({})}
                  className="!mb-0"
                >
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="block w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-teal-50 file:px-3 file:py-1 file:text-xs file:font-medium file:text-teal-700 hover:border-teal-400"
                  />
                </Form.Item>
              </Card>
            )}

            {isAdjustment && (
              <Card surface="flat" padding="compact" rounded="lg" className="border border-slate-200">
                <Text strong className="mb-2 block text-[11px] uppercase tracking-wide text-slate-800">
                  Văn bản phê duyệt điều chỉnh (Bắt buộc)
                </Text>
                <Form.Item
                  name="approvalDocument"
                  label={<FieldLabel required>Số Quyết định điều chỉnh</FieldLabel>}
                  rules={[{ required: true, whitespace: true, message: "Nhập số văn bản điều chỉnh." }]}
                  extra="Số quyết định phê duyệt điều chỉnh kế hoạch vốn của UBND"
                >
                  <Input className="text-xs" placeholder="Ví dụ: 318/QĐ-UBND" />
                </Form.Item>
                <Form.Item
                  name="approvalFileName"
                  label={<FieldLabel required>File văn bản phê duyệt</FieldLabel>}
                  rules={[{ required: true, message: "Đính kèm file văn bản phê duyệt điều chỉnh." }]}
                  extra="Đính kèm file văn bản (.pdf, .doc, .docx) — Bắt buộc"
                  getValueFromEvent={(event: ChangeEvent<HTMLInputElement>) => event.target.files?.[0]?.name ?? ""}
                  getValueProps={() => ({})}
                  className="!mb-0"
                >
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="block w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-teal-50 file:px-3 file:py-1 file:text-xs file:font-medium file:text-teal-700 hover:border-teal-400"
                  />
                </Form.Item>
                {adjustingPlan?.approvalFileName && (
                  <Text className="mt-2 block text-[11px] text-slate-500">
                    File hiện tại: {adjustingPlan.approvalFileName}
                  </Text>
                )}
              </Card>
            )}
          </Flex>
        </Form>
      </div>
    </Drawer>
  );
}

