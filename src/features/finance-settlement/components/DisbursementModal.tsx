"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import {
  ExclamationCircleFilled,
  FormOutlined,
  InfoCircleOutlined,
  PlusCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Button, Card, Drawer, Flex, Form, Input, Select, Text, useWatch } from "@/components/ui";
import type {
  Contract,
  Disbursement,
  DisbursementInput,
  DisbursementPrefill,
  FinanceProject,
  TreasuryAccount,
} from "../types/finance.types";
import { formatVndBillions, getContractUsagePercent } from "../utils/finance-rules";

interface DisbursementModalProps {
  open: boolean;
  projects: FinanceProject[];
  contracts: Contract[];
  treasuryAccounts: TreasuryAccount[];
  editingDisbursement?: Disbursement | null;
  prefill?: DisbursementPrefill | null;
  /** Lỗi nghiệp vụ trả về khi lưu (vượt hợp đồng, vượt tổng mức đầu tư...) */
  errorText?: string;
  onClose: () => void;
  onCreate: (input: DisbursementInput) => Promise<boolean>;
  onUpdate: (id: string, input: DisbursementInput) => Promise<boolean>;
}

interface FormValues {
  projectId: string;
  payee: string;
  content: string;
  amount: string;
  contractId?: string;
  approvalDate: string;
  dueDate: string;
  treasuryAccountId: string;
  evidenceName?: string;
}

/** Nhãn trường theo kiểu modal Dự án: chữ in hoa, dấu sao đỏ đặt sau nhãn */
function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
      {children} {required && <span className="text-rose-500">*</span>}
    </span>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card surface="flat" padding="compact" rounded="lg" className="h-full border border-slate-200">
      <Text strong className="mb-2 block text-[11px] uppercase tracking-wide text-slate-800">
        {title}
      </Text>
      {children}
    </Card>
  );
}

export default function DisbursementModal({
  open,
  projects,
  contracts,
  treasuryAccounts,
  editingDisbursement,
  prefill,
  errorText,
  onClose,
  onCreate,
  onUpdate,
}: DisbursementModalProps) {
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const isEditing = Boolean(editingDisbursement);

  const projectId = useWatch("projectId", form);
  const contractId = useWatch("contractId", form);
  const amount = Number(useWatch("amount", form)) || 0;

  const availableContracts = useMemo(
    () => contracts.filter((item) => item.projectId === projectId),
    [contracts, projectId],
  );
  const selectedContract = contracts.find((item) => item.id === contractId);
  const remaining = selectedContract ? selectedContract.value - selectedContract.disbursed : 0;
  const usageAfter = selectedContract && amount > 0
    ? getContractUsagePercent(selectedContract.disbursed + amount, selectedContract.value)
    : undefined;

  useEffect(() => {
    if (editingDisbursement) {
      form.setFieldsValue({
        projectId: editingDisbursement.projectId,
        payee: editingDisbursement.payee,
        content: editingDisbursement.content,
        amount: String(editingDisbursement.amount),
        contractId: editingDisbursement.contractId,
        approvalDate: editingDisbursement.approvalDate,
        dueDate: editingDisbursement.dueDate,
        treasuryAccountId: editingDisbursement.treasuryAccountId,
        evidenceName: editingDisbursement.evidence[0]?.name,
      });
      return;
    }
    form.resetFields();
    if (prefill) {
      const contract = contracts.find((item) => item.id === prefill.contractId);
      form.setFieldsValue({
        projectId: prefill.projectId,
        contractId: prefill.contractId,
        payee: contract?.contractor,
      });
    }
  }, [contracts, editingDisbursement, form, prefill]);

  const submit = async (values: FormValues) => {
    const payload: DisbursementInput = {
      projectId: values.projectId,
      payee: values.payee,
      content: values.content,
      amount: Number(values.amount),
      contractId: values.contractId,
      approvalDate: values.approvalDate,
      dueDate: values.dueDate,
      treasuryAccountId: values.treasuryAccountId,
      evidence: values.evidenceName
        ? [{ id: `FILE-${Date.now()}`, name: values.evidenceName, size: "2,1 MB" }]
        : [],
    };

    setSubmitting(true);
    try {
      const success = editingDisbursement
        ? await onUpdate(editingDisbursement.id, payload)
        : await onCreate(payload);
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
            {isEditing ? (
              <FormOutlined className="text-base" />
            ) : (
              <PlusCircleOutlined className="text-base" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-[#102A43]">
                {isEditing ? `Sửa và trình lại hồ sơ ${editingDisbursement?.code}` : "Lập Đề Nghị Thanh Toán"}
              </span>
            </div>
            <p className="text-xs font-normal text-slate-500 mt-0.5">
              Hồ sơ thanh toán vốn đầu tư công & giải ngân dự án
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
            {isEditing ? "Cập nhật & trình lại" : "Lưu & trình Kế toán trưởng"}
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
          onFinish={submit}
          className="[&_.ant-form-item]:!mb-3"
        >
          <Flex vertical gap={14}>

            {errorText && (
              <Text
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800"
              >
                <ExclamationCircleFilled className="mt-0.5 text-rose-500" />
                <span><strong>Chưa thể lưu:</strong> {errorText}</span>
              </Text>
            )}

            {/* THÔNG TIN HỒ SƠ THANH TOÁN (Theo thứ tự chuẩn) */}
            <Card surface="quiet" padding="compact" rounded="lg" className="border border-slate-200/80">
              {/* 1. Dự án (Bắt buộc) */}
              <Form.Item
                name="projectId"
                label={<FieldLabel required>Dự án</FieldLabel>}
                extra="Liên kết đến dự án trong M2"
                rules={[{ required: true, message: "Vui lòng chọn dự án." }]}
              >
                <Select
                  showSearch={{ optionFilterProp: "label" }}
                  placeholder="Chọn dự án"
                  className="text-xs"
                  options={projects.map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` }))}
                  onChange={() => form.setFieldsValue({ contractId: undefined, payee: "" })}
                />
              </Form.Item>

              {/* 2. Bên nhận thanh toán (Bắt buộc) */}
              <Form.Item
                name="payee"
                label={<FieldLabel required>Bên nhận thanh toán</FieldLabel>}
                extra="Nhà thầu / TV / Chi trả BT"
                rules={[{ required: true, whitespace: true, message: "Vui lòng nhập bên nhận." }]}
              >
                <Input className="text-xs" placeholder="Nhà thầu / đơn vị tư vấn / hộ dân nhận bồi thường..." />
              </Form.Item>

              {/* 3. Nội dung thanh toán (Bắt buộc) */}
              <Form.Item
                name="content"
                label={<FieldLabel required>Nội dung thanh toán</FieldLabel>}
                extra="Mô tả theo đề nghị TT và HĐ"
                rules={[{ required: true, whitespace: true, message: "Vui lòng nhập nội dung." }]}
              >
                <Input.TextArea
                  rows={2}
                  className="text-xs"
                  placeholder="Ví dụ: Thanh toán khối lượng xây lắp hoàn thành đợt 5"
                />
              </Form.Item>

              {/* 4. Số tiền & 5. Số HĐ liên kết */}
              <div className="grid grid-cols-1 gap-x-3.5 sm:grid-cols-2">
                {/* 4. Số tiền (Bắt buộc, > 0, 3 chữ số thập phân, không vượt HĐ) */}
                <Form.Item
                  name="amount"
                  label={<FieldLabel required>Số tiền (tỷ đồng)</FieldLabel>}
                  extra="Đơn vị tỷ đồng, 3 chữ số thập phân (> 0, không vượt HĐ còn lại)"
                  rules={[
                    { required: true, message: "Vui lòng nhập số tiền." },
                    { pattern: /^(?!0(\.0{1,3})?$)\d+(\.\d{1,3})?$/, message: "Số tiền phải > 0 và tối đa 3 chữ số thập phân." },
                    () => ({
                      validator: (_, val?: string) => {
                        const num = Number(val);
                        if (selectedContract && num > remaining) {
                          return Promise.reject(new Error(`Số tiền vượt giá trị HĐ còn lại (${formatVndBillions(remaining)}).`));
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <Input inputMode="decimal" className="font-mono text-xs" placeholder="Ví dụ: 12.850" suffix="tỷ" />
                </Form.Item>

                {/* 5. Số HĐ liên kết (Khuyến nghị) */}
                <Form.Item
                  name="contractId"
                  label={<FieldLabel>Số HĐ liên kết</FieldLabel>}
                  extra={!projectId ? "Chọn dự án trước để hiện danh sách hợp đồng" : "Hợp đồng đã ký trong hệ thống (Khuyến nghị)"}
                >
                  <Select
                    allowClear
                    disabled={!projectId}
                    placeholder="Chọn hợp đồng (khuyến nghị)"
                    className="text-xs"
                    options={availableContracts.map((item) => ({
                      value: item.id,
                      label: `${item.code} · còn ${formatVndBillions(item.value - item.disbursed)}`,
                    }))}
                    onChange={(value) => {
                      const contract = contracts.find((item) => item.id === value);
                      if (contract) form.setFieldValue("payee", contract.contractor);
                    }}
                  />
                </Form.Item>
              </div>

              {selectedContract && (
                <Text
                  className={`block rounded-lg border px-3 py-2 text-xs mb-3 ${
                    usageAfter?.isWarning
                      ? "border-amber-200 bg-amber-50 text-amber-900"
                      : "border-teal-100 bg-teal-50/60 text-teal-900"
                  }`}
                >
                  Hợp đồng {selectedContract.code}: giá trị <strong>{formatVndBillions(selectedContract.value)}</strong>
                  {" · "}đã giải ngân <strong>{formatVndBillions(selectedContract.disbursed)}</strong>
                  {" · "}còn được thanh toán <strong>{formatVndBillions(remaining)}</strong>
                  {usageAfter?.isWarning && (
                    <span className="mt-1 block font-medium">
                      <WarningOutlined /> Sau đợt này hợp đồng đạt {usageAfter.percent}% giá trị
                      {amount > remaining ? " – vượt giá trị còn lại, hồ sơ sẽ bị chặn." : "."}
                    </span>
                  )}
                </Text>
              )}

              {/* 6. Ngày ký duyệt & 7. Tài khoản KBNN */}
              <div className="grid grid-cols-1 gap-x-3.5 sm:grid-cols-2">
                {/* 6. Ngày ký duyệt (Bắt buộc) */}
                <Form.Item
                  name="approvalDate"
                  label={<FieldLabel required>Ngày ký duyệt</FieldLabel>}
                  extra="Ngày Giám đốc ký tờ trình"
                  rules={[{ required: true, message: "Vui lòng chọn ngày ký duyệt." }]}
                >
                  <Input type="date" className="font-mono text-xs" />
                </Form.Item>

                {/* 7. Tài khoản KBNN (Bắt buộc) */}
                <Form.Item
                  name="treasuryAccountId"
                  label={<FieldLabel required>Tài khoản KBNN</FieldLabel>}
                  extra="Chọn từ danh mục TK đã khai báo"
                  rules={[{ required: true, message: "Vui lòng chọn tài khoản KBNN." }]}
                >
                  <Select
                    placeholder="Chọn tài khoản chi"
                    className="text-xs"
                    options={treasuryAccounts.map((item) => ({
                      value: item.id,
                      label: `${item.number} · ${item.label}`,
                    }))}
                  />
                </Form.Item>
              </div>

              {/* Hạn thanh toán (Phụ trợ) */}
              <Form.Item
                name="dueDate"
                label={<FieldLabel>Hạn thanh toán</FieldLabel>}
                dependencies={["approvalDate"]}
                className="!mb-0"
                rules={[
                  ({ getFieldValue }) => ({
                    validator: (_, value?: string) =>
                      !value || !getFieldValue("approvalDate") || value >= getFieldValue("approvalDate")
                        ? Promise.resolve()
                        : Promise.reject(new Error("Hạn thanh toán không được trước ngày ký duyệt.")),
                  }),
                ]}
              >
                <Input type="date" className="font-mono text-xs" />
              </Form.Item>
            </Card>

            {/* 8. File chứng từ (≥ 1 file trước khi lưu) */}
            <SectionCard title="File chứng từ">
              <Form.Item
                name="evidenceName"
                label={<FieldLabel required>File chứng từ</FieldLabel>}
                extra="Tờ trình, ủy nhiệm chi, biên bản NT — Bắt buộc ≥ 1 file trước khi lưu"
                rules={[{ required: true, message: "Cần ít nhất 1 file chứng từ trước khi lưu." }]}
                getValueFromEvent={(event: ChangeEvent<HTMLInputElement>) => event.target.files?.[0]?.name ?? ""}
                getValueProps={() => ({})}
                className="!mb-0"
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg"
                  className="block w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-teal-50 file:px-3 file:py-1 file:text-xs file:font-medium file:text-teal-700 hover:border-teal-400"
                />
              </Form.Item>
              {isEditing && editingDisbursement?.evidence[0] && (
                <Text className="mt-2 block text-[11px] text-slate-500">
                  Đang dùng: {editingDisbursement.evidence[0].name} – chọn file mới nếu cần thay thế.
                </Text>
              )}
            </SectionCard>
          </Flex>
        </Form>
      </div>
    </Drawer>
  );
}
