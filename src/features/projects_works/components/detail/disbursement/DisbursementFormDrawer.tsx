"use client";

import { useState } from "react";
import { App } from "antd";
import {
  CalendarOutlined,
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
  PaperClipOutlined,
  UserOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import {
  Button,
  Input,
  Drawer,
  MoneyInput,
  STANDARD_DRAWER_WIDTH,
  Select,
  StandardFileUpload,
  type UploadedAttachment,
} from "@/components/ui";
import { SelectWithAddOption } from "@/components/workspace";
import { cn } from "@/utils/cn";
import { formatMoneyString, parseMoney } from "@/utils/format-money";
import { formatDateVi } from "@/utils/date";
import { useProjectDisbursements } from "../../../hooks/useProjectDisbursements";
import { toDisbursementAttachment, validateDisbursement, type DisbursementKind } from "@/shared/projects_works/utils/project-disbursement";
import { money, today } from "../../../utils/disbursement-format";
import { FieldLabel, FormSection, ReadonlyField } from "./DisbursementFormParts";

export default function DisbursementFormDrawer({
  projectId,
  kind,
  initialCategory,
  onClose: onCancel,
  onSaved,
}: {
  projectId: string;
  kind: DisbursementKind;
  initialCategory?: string;
  onClose: () => void;
  onSaved: (category: string) => void;
}) {
  const { message } = App.useApp();
  const { project, operatorName, summary, unit, budgets, limitFor: limitOf, add, addCategory: onAddCategory } =
    useProjectDisbursements(projectId);
  const categories = summary.byCategory.map((row) => row.category);
  const projectName = project?.name ?? "";
  const sources = budgets.map((b) => b.source);
  const limitFor = (category: string, source?: string) => limitOf(kind, category, source);
  const [category, setCategory] = useState<string | undefined>(
    initialCategory || undefined,
  );
  const todayIso = today();
  const [date, setDate] = useState(todayIso);
  const [amountRaw, setAmountRaw] = useState("");
  const [source, setSource] = useState<string | undefined>(sources.length === 1 ? sources[0] : undefined);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<UploadedAttachment[]>([]);
  const [error, setError] = useState<string>();

  const withdraw = kind === "withdraw";
  const label = unit === "đầu mục" ? "Đầu mục" : "Danh mục chi phí";
  const verb = withdraw ? "thu hồi" : "giải ngân";
  const amount = parseMoney(amountRaw);
  const limit = category ? limitFor(category, source) : withdraw ? 0 : undefined;
  const overLimit = limit !== undefined && amount > limit;

  const clearError = () => setError(undefined);

  const [saving, setSaving] = useState(false);
  const submit = async () => {
    const err = validateDisbursement(
      {
        kind,
        category,
        date,
        today: todayIso,
        amount,
        attachmentCount: files.length,
        content,
        fundingSource: source,
        requireSource: sources.length > 0,
      },
      limit,
    );
    if (err) {
      setError(err);
      return;
    }
    setSaving(true);
    const attachments = await Promise.all(files.map(toDisbursementAttachment));
    try {
      await add(
        { kind, category: category!, fundingSource: source, amount, date, content: content.trim() || undefined, attachments },
        files.flatMap((f) => (f.rawFile ? [f.rawFile] : [])),
      );
    } catch (e) {
      message.error((e as Error).message);
      setSaving(false);
      return;
    }
    message.success(withdraw ? `Đã thu hồi ${money(amount)} của ${category}.` : `Đã giải ngân ${money(amount)} cho ${category}.`);
    onSaved(category!);
  };

  return (
    <Drawer
      open
      onClose={onCancel}
      width={STANDARD_DRAWER_WIDTH}
      styles={{ body: { background: "#f8fafc", padding: 16 } }}
      title={
        <div className="flex items-center gap-3 py-1">
          <Button
            intent="outline"
            scale="compact"
            icon={<ArrowLeftOutlined />}
            aria-label="Quay lại"
            title="Quay lại"
            onClick={onCancel}
            className="h-9! w-9! shrink-0 p-0!"
          />
          <div className="min-w-0">
            <div className="text-base font-bold text-slate-900">
              {withdraw ? "Thu hồi giải ngân" : "Giải ngân"}
            </div>
            <div
              className="truncate text-xs font-normal text-slate-500"
              title={projectName}
            >
              {projectName}
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex w-full items-center gap-2.5 py-2">
          <Button intent="primary" scale="sm" loading={saving} onClick={() => void submit()} className="px-5">
            Xác nhận {verb}
          </Button>
          <Button
            intent="outline"
            scale="sm"
            onClick={onCancel}
            className="px-5"
          >
            Hủy
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <FormSection icon={<WalletOutlined />} title={`Thông tin ${verb}`}>
          <div className="flex flex-col gap-3.5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ReadonlyField
                icon={<CalendarOutlined />}
                label="Ngày thực hiện"
                value={formatDateVi(todayIso)}
                hint="Tự ghi nhận"
              />
              <ReadonlyField
                icon={<UserOutlined />}
                label="Người thực hiện"
                value={operatorName}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {withdraw ? (
                <ReadonlyField
                  icon={<WalletOutlined />}
                  label={label}
                  value={category ?? ""}
                />
              ) : (
                <div>
                  <FieldLabel text={label} required />
                  <SelectWithAddOption
                    aria-label={label}
                    placeholder={`Chọn ${unit} hoặc gõ để thêm mới`}
                    value={category}
                    options={categories.map((c) => ({ value: c, label: c }))}
                    filterByQuery
                    addPlaceholder={`Gõ tên ${unit} mới…`}
                    notFoundContent={
                      <span className="text-xs text-slate-400">
                        Không có {unit} phù hợp, bấm “Thêm” để tạo mới
                      </span>
                    }
                    onChange={(v) => {
                      setCategory(v);
                      clearError();
                    }}
                    onAdd={(name) => {
                      onAddCategory(name);
                      setCategory(name);
                      clearError();
                    }}
                    className="h-9"
                  />
                </div>
              )}
              <div>
                <FieldLabel text={`Ngày ${verb}`} required />
                <Input
                  type="date"
                  aria-label={`Ngày ${verb}`}
                  value={date}
                  max={todayIso}
                  onChange={(e) => {
                    setDate(e.target.value);
                    clearError();
                  }}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel text="Nguồn vốn" required={sources.length > 0} />
                <Select
                  aria-label="Nguồn vốn"
                  placeholder={sources.length > 0 ? "Chọn nguồn vốn" : "Dự án chưa khai báo nguồn vốn"}
                  value={source}
                  disabled={sources.length === 0}
                  options={sources.map((s) => ({ value: s, label: s }))}
                  onChange={(v) => {
                    setSource(v);
                    clearError();
                  }}
                  className="h-9 w-full"
                />
              </div>
              <div>
                <FieldLabel text={`Số tiền ${verb}`} required />
                <MoneyInput
                  value={amountRaw}
                  placeholder="0"
                  status={overLimit ? "error" : undefined}
                  suffix={<span className="text-xs font-medium text-slate-400">VNĐ</span>}
                  onChange={(e: { target: { value: string } }) => {
                    setAmountRaw(e.target.value);
                    clearError();
                  }}
                  className="h-9 text-sm font-semibold"
                />
                {limit !== undefined && (
                  <div className={cn("mt-1 text-[11px]", overLimit ? "text-rose-600" : "text-slate-400")}>
                    {withdraw ? "Có thể thu hồi tối đa" : "Vốn còn lại"}: {formatMoneyString(limit)} VNĐ
                  </div>
                )}
              </div>
            </div>

            <div>
              <FieldLabel
                text={withdraw ? "Lý do thu hồi" : "Nội dung thanh toán"}
                required={withdraw}
              />
              <Input.TextArea
                autoSize={{ minRows: 2, maxRows: 5 }}
                value={content}
                maxLength={500}
                placeholder={
                  withdraw
                    ? "VD: Thu hồi tạm ứng do nhà thầu không thực hiện hợp đồng"
                    : "VD: Thanh toán đợt 1 theo HĐ số 12/2026/HĐ-XD"
                }
                onChange={(e) => {
                  setContent(e.target.value);
                  clearError();
                }}
                className="text-sm"
              />
              <div className="mt-1 text-right text-[11px] text-slate-400">
                {content.length}/500
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection
          icon={<PaperClipOutlined />}
          title={`Chứng từ ${verb} *`}
          extra={
            files.length > 0 ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                {files.length} tệp
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">
                Bắt buộc ít nhất 1 tệp
              </span>
            )
          }
        >
          <StandardFileUpload
            hideHeader
            value={files}
            promptText="Nhấn hoặc kéo thả tệp chứng từ vào đây"
            onChange={(next) => {
              setFiles(next);
              clearError();
            }}
            className={cn(
              "border-0 bg-transparent p-0",
              error && files.length === 0 && "[&>label]:!border-rose-300",
            )}
          />
        </FormSection>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            <ExclamationCircleOutlined />
            {error}
          </div>
        )}
      </div>
    </Drawer>
  );
}
