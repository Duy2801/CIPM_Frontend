"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import {
  CalendarOutlined,
  ExclamationCircleFilled,
  FileTextOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Form, Input, Select, Tag } from "@/components/ui";
import { addDays, todayIso } from "@/utils/date";
import { SEVERITY_META } from "../constants/warranty-labels";
import type { IncidentInput, IncidentSeverity, WarrantyRecord } from "../types/warranty.types";

interface IncidentReportModalProps {
  warranties: WarrantyRecord[];
  defaultWarrantyId?: string;
  errorText?: string;
  onClose: () => void;
  onSubmit: (input: IncidentInput) => Promise<boolean>;
}

interface FormValues {
  warrantyId: string;
  foundDate: string;
  description: string;
  location: string;
  severity: IncidentSeverity;
  requiredFixDate: string;
  attachment?: string;
}

export default function IncidentReportModal({
  warranties,
  defaultWarrantyId,
  errorText,
  onClose,
  onSubmit,
}: IncidentReportModalProps) {
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const today = todayIso();

  const watchedWarrantyId = Form.useWatch("warrantyId", form);
  const selectedWarrantyId = watchedWarrantyId || defaultWarrantyId;
  const selectedWarranty = useMemo(
    () => warranties.find((w) => w.id === selectedWarrantyId),
    [warranties, selectedWarrantyId],
  );

  const handleFinish = async (values: FormValues) => {
    setSubmitting(true);
    try {
      if (await onSubmit({ ...values, attachment: values.attachment || undefined })) onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      open
      width="min(680px, 100vw)"
      onClose={onClose}
      destroyOnClose
      title={
        <span>
          <span className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-[#102A43]">Ghi nhận sự cố bảo hành</span>
            <Tag intent="danger" scale="md" className="m-0 font-medium">
              Lập biên bản
            </Tag>
          </span>
          <span className="block text-xs font-normal text-slate-500 mt-0.5">
            Ghi nhận hư hỏng, sự cố phát sinh trong thời gian bảo hành và gửi yêu cầu khắc phục cho nhà thầu
          </span>
        </span>
      }
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            intent="primary"
            onClick={() => form.submit()}
            loading={submitting}
            className="!bg-[#007A78] !border-[#007A78] hover:!bg-[#006361] !text-white"
          >
            Ghi nhận và gửi nhà thầu
          </Button>
          <Button intent="outline" onClick={onClose} disabled={submitting}>
            Đóng
          </Button>
        </div>
      }
    >
      {errorText && (
        <aside role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] text-rose-800">
          <ExclamationCircleFilled className="mt-0.5 text-rose-500" />
          <span><strong>Chưa thể lưu:</strong> {errorText}</span>
        </aside>
      )}

      {selectedWarranty && (
        <dl className="mb-4 m-0 grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="col-span-2">
            <dt className="text-xs text-slate-500 font-medium">Công trình</dt>
            <dd className="m-0 text-[13px] font-semibold text-slate-800 mt-0.5">{selectedWarranty.workName}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 font-medium">Hợp đồng & Nhà thầu</dt>
            <dd className="m-0 text-[13px] font-semibold text-slate-800 mt-0.5">HĐ {selectedWarranty.contractCode} · {selectedWarranty.contractor}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 font-medium">Bảo lãnh bảo hành</dt>
            <dd className="m-0 text-[13px] font-semibold text-slate-800 mt-0.5">{selectedWarranty.bondValue} tỷ ({selectedWarranty.bank})</dd>
          </div>
        </dl>
      )}

      <Form<FormValues>
        form={form}
        layout="vertical"
        initialValues={{
          warrantyId: defaultWarrantyId || warranties[0]?.id,
          foundDate: today,
          severity: "NORMAL",
          requiredFixDate: addDays(today, 14),
        }}
        onFinish={handleFinish}
      >
        <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
            <FileTextOutlined className="text-sm text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
              Chi tiết sự cố & Vị trí
            </span>
          </div>

          <Form.Item name="warrantyId" label="Công trình cần ghi nhận" rules={[{ required: true, message: "Vui lòng chọn công trình." }]}>
            <Select
              placeholder="Chọn công trình đang bảo hành"
              options={warranties.map((item) => ({ value: item.id, label: `${item.workName} (${item.contractor})` }))}
            />
          </Form.Item>

          <Form.Item name="description" label="Mô tả sự cố" rules={[{ required: true, whitespace: true, message: "Vui lòng mô tả sự cố." }]}>
            <Input.TextArea rows={3} placeholder="Ví dụ: Nứt mạch vữa thân kè, dài khoảng 1,5 m, có dấu hiệu xói lở chân kè..." />
          </Form.Item>

          <Form.Item name="location" label="Vị trí tại công trình" rules={[{ required: true, whitespace: true, message: "Vui lòng nhập vị trí." }]}>
            <Input placeholder="Ví dụ: Đoạn K0+120 phía biển, bờ kè hướng Đông" />
          </Form.Item>
        </section>

        <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
            <CalendarOutlined className="text-sm text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
              Thời gian & Mức độ xử lý
            </span>
          </div>

          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-3">
            <Form.Item name="foundDate" label="Ngày phát hiện" rules={[{ required: true, message: "Chọn ngày." }]}>
              <Input type="date" max={today} />
            </Form.Item>
            <Form.Item name="requiredFixDate" label="Hạn khắc phục" rules={[{ required: true, message: "Chọn hạn." }]}>
              <Input type="date" />
            </Form.Item>
            <Form.Item name="severity" label="Mức độ">
              <Select
                options={(Object.keys(SEVERITY_META) as IncidentSeverity[]).map((key) => ({ value: key, label: SEVERITY_META[key].label }))}
              />
            </Form.Item>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
            <PaperClipOutlined className="text-sm text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
              Hồ sơ ảnh hiện trường / Biên bản
            </span>
          </div>

          <Form.Item
            name="attachment"
            label="Ảnh hiện trường hoặc biên bản ghi nhận (.pdf, .jpg, .png)"
            getValueFromEvent={(event: ChangeEvent<HTMLInputElement>) => event.target.files?.[0]?.name ?? ""}
            getValueProps={() => ({})}
          >
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="block w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-teal-50 file:px-3 file:py-1 file:text-[13px] file:font-medium file:text-teal-700 hover:border-teal-400"
            />
          </Form.Item>
        </section>
      </Form>
    </Drawer>
  );
}
