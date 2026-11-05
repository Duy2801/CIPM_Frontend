"use client";

import { useEffect, useState } from "react";
import type React from "react";
import { App } from "antd";
import {
  CalendarOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
  PaperClipOutlined,
  PlusOutlined,
  RightOutlined,
  UserOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Input,
  Drawer,
  MoneyInput,
  STANDARD_DRAWER_WIDTH,
  StandardFileUpload,
  Tooltip,
  type UploadedAttachment,
} from "@/components/ui";
import { SelectWithAddOption } from "@/components/workspace";
import { cn } from "@/utils/cn";
import { formatMoneyString, parseMoney } from "@/utils/format-money";
import { formatDateVi } from "@/utils/date";
import type { ProjectItem } from "../../types/project.types";
import {
  useProjectDisbursements,
  type NewDisbursement,
} from "../../hooks/useProjectDisbursements";
import {
  signedAmount,
  toDisbursementAttachment,
  validateDisbursement,
  type DisbursementKind,
  type CategorySummary,
  type DisbursementAttachment,
  type DisbursementEntry,
} from "../../utils/project-disbursement";
import DisbursementFilePreview from "./DisbursementFilePreview";

const money = (v: number) => `${formatMoneyString(v)} VNĐ`;
const percent = (part: number, whole: number) =>
  whole > 0 ? Math.min(100, (part / whole) * 100) : 0;
const today = () => new Date().toISOString().slice(0, 10);

/** Cột bảng: Danh mục | Số đợt | Đã giải ngân | Tỷ lệ / TMĐT | Gần nhất | Thao tác */
const GRID =
  "grid grid-cols-[minmax(220px,1fr)_80px_160px_minmax(180px,240px)_110px_190px] items-center gap-x-6";

/** Drawer đang mở: giải ngân (danh mục có thể chọn) hoặc thu hồi (khóa danh mục) */
type FormState = { kind: DisbursementKind; category: string };

interface ProjectDisbursementTabProps {
  project: ProjectItem;
  operatorName: string;
  /** Được nhập giải ngân (quyền nhập liệu M4, dự án chưa đóng) */
  canDisburse: boolean;
  /** Đầu mục của dự án (tên tab quy trình); có thì giải ngân theo đầu mục thay cho danh mục chi phí */
  headings?: string[];
  /** Tổng giải ngân thay đổi sau khi thêm / xóa đợt */
  onTotalChange: (total: number) => void;
}

/** Tab "Giải ngân" của dự án: chọn danh mục chi phí và nhập số tiền cho từng đợt */
export default function ProjectDisbursementTab({
  project,
  operatorName,
  canDisburse,
  headings,
  onTotalChange,
}: ProjectDisbursementTabProps) {
  const { message } = App.useApp();
  const byHeading = (headings?.length ?? 0) > 0;
  const { entries, summary, add, addCategory } =
    useProjectDisbursements(
      project.id,
      operatorName,
      byHeading ? [...new Set(headings)] : undefined,
    );
  const unit = byHeading ? "đầu mục" : "danh mục";

  // Các danh mục đang mở xem đợt
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  // Drawer giải ngân / thu hồi: undefined = đóng; category "" = chưa chọn
  const [form, setForm] = useState<FormState>();

  const totalInvestment = project.totalInvestment || 0;
  const remaining =
    totalInvestment > 0
      ? Math.max(0, totalInvestment - summary.total)
      : undefined;
  const rate = percent(summary.total, totalInvestment);

  // Giữ "đã giải ngân" của dự án khớp với số liệu trong tab (kể cả dữ liệu demo tạo sẵn)
  useEffect(() => {
    if ((project.disbursedAmount ?? 0) !== summary.total) onTotalChange(summary.total);
  }, [project.disbursedAmount, summary.total, onTotalChange]);

  const toggle = (category: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });

  // Đợt đang xem chi tiết
  const [viewing, setViewing] = useState<DisbursementEntry>();

  return (
    <Card
      surface="workspace"
      padding="none"
      rounded="lg"
      className="overflow-hidden border border-slate-200/80 shadow-xs"
    >
      {/* Tiêu đề + nút giải ngân */}
      <div className="flex flex-wrap items-center gap-3 px-4 pt-4 pb-3">
        <div className="mr-auto min-w-0">
          <h3 className="m-0 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Tình hình giải ngân
          </h3>
        </div>
      </div>

      {/* Tổng quan vốn: một dải số liệu */}
      <div className="mx-4 grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-50/60 lg:grid-cols-4">
        <Stat
          label="Tổng mức đầu tư"
          value={totalInvestment > 0 ? money(totalInvestment) : "Chưa có"}
        />
        <Stat
          label="Đã giải ngân"
          value={money(summary.total)}
          hint={`${summary.count} đợt`}
          accent
          className="border-l border-slate-200"
        />
        <Stat
          label="Còn lại"
          value={remaining !== undefined ? money(remaining) : "—"}
          className="border-t border-slate-200 lg:border-t-0 lg:border-l"
        />
        <div className="border-t border-l border-slate-200 px-4 py-3 lg:border-t-0">
          <div className="text-[11px] font-medium text-slate-500">
            Tỷ lệ giải ngân
          </div>
          <div className="mt-1 flex items-center gap-2.5">
            <span className="text-sm font-bold text-slate-900">
              {rate.toFixed(1)}%
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[#DC2626] transition-all"
                style={{ width: `${rate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bảng danh mục: mỗi dòng mở ra để xem các đợt */}
      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[1100px]">
          <div
            className={cn(
              GRID,
              "border-y border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-semibold text-slate-500",
            )}
          >
            <span className="pl-5">{byHeading ? "Đầu mục" : "Danh mục"}</span>
            <span className="text-center">Số đợt</span>
            <span className="text-center">Đã giải ngân</span>
            <span className="text-center">Tỷ lệ / TMĐT</span>
            <span className="text-center">Gần nhất</span>
            <span className="text-center">Thao tác</span>
          </div>

          {summary.byCategory.map((row) => (
            <CategoryRow
              key={row.category}
              row={row}
              totalInvestment={totalInvestment}
              open={expanded.has(row.category)}
              onToggle={() => toggle(row.category)}
              entries={entries.filter((e) => e.category === row.category)}
              canDisburse={canDisburse}
              onDisburse={() =>
                setForm({ kind: "disburse", category: row.category })
              }
              onWithdraw={() =>
                setForm({ kind: "withdraw", category: row.category })
              }
              onView={setViewing}
            />
          ))}

          {/* Thêm dòng giải ngân: mở form, chọn đầu mục có sẵn hoặc gõ đầu mục mới */}
          {canDisburse && (
            <button
              type="button"
              onClick={() => setForm({ kind: "disburse", category: "" })}
              className="flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent px-4 py-2.5 text-left text-xs font-semibold text-[#DC2626] transition-colors hover:bg-red-50/60"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded border border-dashed border-[#DC2626]/60 text-[10px]">
                <PlusOutlined />
              </span>
              Thêm dòng giải ngân
            </button>
          )}
        </div>
      </div>

      {viewing && (
        <DisbursementDetailDrawer
          entry={viewing}
          projectName={project.name}
          unit={unit}
          onClose={() => setViewing(undefined)}
        />
      )}

      {form && (
        <DisbursementFormDrawer
          kind={form.kind}
          projectName={project.name}
          operatorName={operatorName}
          initialCategory={form.category}
          categories={summary.byCategory.map((row) => row.category)}
          unit={unit}
          remaining={remaining}
          categoryTotal={(c) =>
            summary.byCategory.find((row) => row.category === c)?.total ?? 0
          }
          // Đầu mục mới chỉ dùng cho dự án này (không thêm vào danh mục chi phí chung)
          onAddCategory={byHeading ? () => undefined : addCategory}
          onCancel={() => setForm(undefined)}
          onSubmit={(input) => {
            add(input);
            onTotalChange(summary.total + signedAmount(input));
            // Mở sẵn danh mục vừa thao tác để thấy đợt mới
            setExpanded((prev) => new Set(prev).add(input.category));
            setForm(undefined);
            message.success(
              input.kind === "withdraw"
                ? `Đã thu hồi ${money(input.amount)} của ${input.category}.`
                : `Đã giải ngân ${money(input.amount)} cho ${input.category}.`,
            );
          }}
        />
      )}
    </Card>
  );
}

function Stat({
  label,
  value,
  hint,
  accent,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("px-4 py-3", className)}>
      <div className="text-[11px] font-medium text-slate-500">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span
          className={cn(
            "text-sm font-bold",
            accent ? "text-[#DC2626]" : "text-slate-900",
          )}
        >
          {value}
        </span>
        {hint && <span className="text-[11px] text-slate-400">· {hint}</span>}
      </div>
    </div>
  );
}

/** Một danh mục: dòng tổng hợp + (khi mở) danh sách các đợt */
function CategoryRow({
  row,
  totalInvestment,
  open,
  onToggle,
  entries,
  canDisburse,
  onDisburse,
  onWithdraw,
  onView,
}: {
  row: CategorySummary;
  totalInvestment: number;
  open: boolean;
  onToggle: () => void;
  entries: DisbursementEntry[];
  canDisburse: boolean;
  onDisburse: () => void;
  onWithdraw: () => void;
  onView: (entry: DisbursementEntry) => void;
}) {
  const hasData = row.count > 0;
  // Bấm nút thao tác không mở / đóng dòng
  const act = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };
  const share = percent(row.total, totalInvestment);
  const muted = hasData ? "" : "text-slate-300";

  return (
    <div className="border-b border-slate-100">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onToggle();
          }
        }}
        className={cn(
          GRID,
          "group cursor-pointer px-4 py-3 text-xs transition-colors hover:bg-slate-50",
          open && "bg-red-50/40 hover:bg-red-50/60",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <RightOutlined
            className={cn(
              "w-3 shrink-0 text-[10px] text-slate-400 transition-transform",
              open && "rotate-90 !text-[#DC2626]",
            )}
          />
          <span
            className={cn(
              "truncate font-medium",
              hasData ? "text-slate-800" : "text-slate-500",
            )}
            title={row.category}
          >
            {row.category}
          </span>
        </span>
        <span className={cn("text-center text-slate-700", muted)}>
          {hasData ? row.count : "—"}
        </span>
        <span className={cn("text-center font-semibold text-slate-900", muted)}>
          {hasData ? money(row.total) : "—"}
        </span>
        <span className="flex items-center justify-center gap-2">
          <span className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-100">
            <span
              className="block h-full rounded-full bg-[#DC2626]"
              style={{ width: `${share}%` }}
            />
          </span>
          <span
            className={cn(
              "w-11 shrink-0 text-left text-xs font-medium text-slate-700",
              muted,
            )}
          >
            {share.toFixed(1)}%
          </span>
        </span>
        <span className={cn("text-center text-slate-600", muted)}>
          {row.lastDate ? formatDateVi(row.lastDate) : "—"}
        </span>
        <span className="flex justify-center gap-1.5">
          {canDisburse &&
            (hasData ? (
              <>
                <Button
                  intent="outline"
                  scale="xs"
                  onClick={act(onDisburse)}
                  className="!h-7 px-2.5 !text-xs"
                >
                  Giải ngân thêm
                </Button>
                <Button
                  intent="outline"
                  scale="xs"
                  onClick={act(onWithdraw)}
                  disabled={row.total <= 0}
                  className="!h-7 px-2.5 !text-xs hover:!border-rose-400 hover:!text-rose-600"
                >
                  Thu hồi
                </Button>
              </>
            ) : (
              <Button
                intent="outline"
                scale="xs"
                onClick={act(onDisburse)}
                className="!h-7 px-2.5 !text-xs opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                Giải ngân
              </Button>
            ))}
        </span>
      </div>

      {/* Các đợt của danh mục: Nội dung · người nhập | — | Số tiền | — | Ngày | Xóa */}
      {open && !hasData && (
        <div className="border-t border-dashed border-slate-200 bg-slate-50/50 px-4 py-3 pl-9 text-xs text-slate-400">
          Chưa có đợt giải ngân nào.
          {canDisburse && (
            <button
              type="button"
              onClick={onDisburse}
              className="ml-2 cursor-pointer border-0 bg-transparent p-0 text-xs font-semibold text-[#DC2626] hover:underline"
            >
              Giải ngân ngay
            </button>
          )}
        </div>
      )}
      {open && hasData && (
        <ul className="m-0 list-none border-t border-slate-100 bg-slate-50/60 p-0">
          {entries.map((e) => {
            const withdraw = e.kind === "withdraw";
            const files = e.attachments?.length ?? 0;
            return (
              <li
                key={e.id}
                onClick={() => onView(e)}
                className={cn(
                  GRID,
                  "group/entry cursor-pointer border-b border-slate-100 px-4 py-2 text-xs transition-colors last:border-b-0 hover:bg-white",
                )}
              >
                <span className="min-w-0 pl-5">
                  <span className="block truncate font-medium text-slate-700" title={e.content}>
                    {withdraw && <span className="mr-1.5 font-semibold text-rose-600">Thu hồi ·</span>}
                    {e.content || <span className="font-normal italic text-slate-400">Không có nội dung</span>}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                    {e.createdBy}
                    {files > 0 && ` · ${files} tệp đính kèm`}
                  </span>
                </span>
                <span />
                <span className={cn("text-center font-semibold", withdraw ? "text-rose-600" : "text-slate-800")}>
                  {withdraw ? "−" : ""}
                  {money(e.amount)}
                </span>
                <span />
                <span className="text-center text-slate-600">{formatDateVi(e.date)}</span>
                <span className="flex justify-center">
                  <Tooltip title="Xem chi tiết">
                    <button
                      type="button"
                      aria-label="Xem chi tiết đợt"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onView(e);
                      }}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-sm text-slate-400 transition-colors hover:bg-red-50 hover:text-[#DC2626] group-hover/entry:text-slate-600"
                    >
                      <EyeOutlined />
                    </button>
                  </Tooltip>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Một khối trong drawer: tiêu đề có icon + nội dung */
function FormSection({
  icon,
  title,
  extra,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="m-0 flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-red-50 text-[13px] text-[#DC2626]">
            {icon}
          </span>
          {title}
        </h4>
        {extra}
      </div>
      {children}
    </section>
  );
}

/** Nhãn trường: tên + dấu * bắt buộc */
function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <div className="mb-1.5 text-xs font-medium text-slate-600">
      {text}
      {required && <span className="text-[#DC2626]"> *</span>}
    </div>
  );
}

/** Drawer nhập một đợt giải ngân: chọn (hoặc thêm) danh mục, nhập số tiền, đính kèm chứng từ */
function DisbursementFormDrawer({
  kind,
  categoryTotal,
  projectName,
  operatorName,
  initialCategory,
  categories,
  unit,
  remaining,
  onAddCategory,
  onCancel,
  onSubmit,
}: {
  /** "đầu mục" hoặc "danh mục" */
  unit: string;
  kind: DisbursementKind;
  /** Số đã giải ngân (thực còn) của một danh mục */
  categoryTotal: (category: string) => number;
  projectName: string;
  operatorName: string;
  initialCategory?: string;
  categories: string[];
  remaining?: number;
  onAddCategory: (name: string) => void;
  onCancel: () => void;
  onSubmit: (input: NewDisbursement) => void;
}) {
  const [category, setCategory] = useState<string | undefined>(
    initialCategory || undefined,
  );
  const [amountRaw, setAmountRaw] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<UploadedAttachment[]>([]);
  const [error, setError] = useState<string>();

  const withdraw = kind === "withdraw";
  const label = unit === "đầu mục" ? "Đầu mục" : "Danh mục chi phí";
  const verb = withdraw ? "thu hồi" : "giải ngân";
  const amount = parseMoney(amountRaw);
  // Hạn mức: giải ngân = phần còn lại của TMĐT; thu hồi = số đã giải ngân của danh mục
  const limit = withdraw ? (category ? categoryTotal(category) : 0) : remaining;
  const overLimit = limit !== undefined && amount > limit;

  const clearError = () => setError(undefined);

  const [saving, setSaving] = useState(false);
  const submit = async () => {
    const err = validateDisbursement(
      { kind, category, amount, attachmentCount: files.length, content },
      limit,
    );
    if (err) {
      setError(err);
      return;
    }
    setSaving(true);
    // Đọc nội dung tệp để xem lại được trong chi tiết đợt
    const attachments = await Promise.all(files.map(toDisbursementAttachment));
    onSubmit({ kind, category: category!, amount, content: content.trim() || undefined, attachments });
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
            {/* Tự ghi nhận, không cần nhập */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ReadonlyField
                icon={<CalendarOutlined />}
                label={`Ngày ${verb}`}
                value={formatDateVi(today())}
                hint="Tự ghi nhận"
              />
              <ReadonlyField
                icon={<UserOutlined />}
                label="Người thực hiện"
                value={operatorName}
              />
            </div>

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
              <FieldLabel text={`Số tiền ${verb}`} required />
              <MoneyInput
                value={amountRaw}
                placeholder="0"
                status={overLimit ? "error" : undefined}
                suffix={
                  <span className="text-xs font-medium text-slate-400">
                    VNĐ
                  </span>
                }
                onChange={(e: { target: { value: string } }) => {
                  setAmountRaw(e.target.value);
                  clearError();
                }}
                className="h-9 text-sm font-semibold"
              />

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
            subTitle={
              withdraw
                ? "Quyết định / văn bản thu hồi, giấy nộp trả… · tối đa 50MB/tệp"
                : "Tờ trình, ủy nhiệm chi, biên bản nghiệm thu… · tối đa 50MB/tệp"
            }
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

/** Ô chỉ đọc (hệ thống tự ghi nhận): cùng chiều cao với ô nhập, nền xám */
function ReadonlyField({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
        {label}
        {hint && (
          <span className="rounded bg-slate-100 px-1.5 py-px text-[10px] font-normal text-slate-500">
            {hint}
          </span>
        )}
      </div>
      <div className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
        <span className="text-slate-400">{icon}</span>
        <span className="truncate" title={value}>
          {value}
        </span>
      </div>
    </div>
  );
}

/** Drawer xem chi tiết một đợt giải ngân / thu hồi (chỉ xem) */
function DisbursementDetailDrawer({
  entry,
  projectName,
  unit,
  onClose,
}: {
  entry: DisbursementEntry;
  projectName: string;
  unit: string;
  onClose: () => void;
}) {
  const withdraw = entry.kind === "withdraw";
  const verb = withdraw ? "thu hồi" : "giải ngân";
  const files = entry.attachments ?? [];
  const [preview, setPreview] = useState<DisbursementAttachment>();

  return (
    <Drawer
      open
      onClose={onClose}
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
            onClick={onClose}
            className="h-9! w-9! shrink-0 p-0!"
          />
          <div className="min-w-0">
            <div className="text-base font-bold text-slate-900">Chi tiết đợt {verb}</div>
            <div className="truncate text-xs font-normal text-slate-500" title={projectName}>
              {projectName}
            </div>
          </div>
        </div>
      }
    >
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        {/* Số tiền + đầu mục */}
        <div className={cn("px-5 py-5", withdraw ? "bg-rose-50/50" : "bg-red-50/40")}>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded px-2 py-0.5 text-[11px] font-semibold",
                withdraw ? "bg-rose-100 text-rose-700" : "bg-red-100 text-[#DC2626]",
              )}
            >
              {withdraw ? "Thu hồi" : "Giải ngân"}
            </span>
            <span className="truncate text-xs font-medium text-slate-600" title={entry.category}>
              {entry.category}
            </span>
          </div>
          <div className={cn("mt-2 text-[28px] font-bold leading-none tracking-tight", withdraw ? "text-rose-600" : "text-slate-900")}>
            {withdraw ? "−" : ""}
            {formatMoneyString(entry.amount)}
            <span className="ml-1.5 text-sm font-semibold text-slate-400">VNĐ</span>
          </div>
        </div>

        {/* Thông tin: nhãn trái · giá trị phải */}
        <dl className="m-0 divide-y divide-slate-100 px-5">
          <DetailRow label={unit === "đầu mục" ? "Đầu mục" : "Danh mục"} value={entry.category} />
          <DetailRow label={`Ngày ${verb}`} value={formatDateVi(entry.date)} />
          <DetailRow label="Người thực hiện" value={entry.createdBy} />
          <DetailRow
            label={withdraw ? "Lý do thu hồi" : "Nội dung"}
            value={entry.content || <span className="font-normal italic text-slate-400">Không có nội dung</span>}
            multiline
          />
        </dl>

        {/* Chứng từ */}
        <div className="border-t border-slate-100 px-5 py-4">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Chứng từ</span>
            <span className="text-[11px] text-slate-400">{files.length} tệp</span>
          </div>
          {files.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 py-4 text-center text-xs text-slate-400">
              Không có tệp đính kèm
            </div>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {files.map((f) => {
                const ext = (f.name.split(".").pop() ?? "").toUpperCase().slice(0, 4);
                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => setPreview(f)}
                      title="Bấm để xem tệp"
                      className="group/file flex w-full cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5 text-left transition hover:border-red-200 hover:shadow-sm"
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[10px] font-bold",
                          ext === "PDF" ? "bg-red-50 text-[#DC2626]" : "bg-slate-100 text-slate-500",
                        )}
                      >
                        {ext || "FILE"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-slate-800 group-hover/file:text-[#DC2626]">
                          {f.name}
                        </span>
                        {f.size && <span className="mt-0.5 block text-[11px] text-slate-400">{f.size}</span>}
                      </span>
                      <span className="shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold text-slate-500 transition group-hover/file:bg-red-50 group-hover/file:text-[#DC2626]">
                        Xem
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {preview && (
        <DisbursementFilePreview
          file={preview}
          entry={entry}
          projectName={projectName}
          onClose={() => setPreview(undefined)}
        />
      )}
    </Drawer>
  );
}

/** Một dòng thông tin chỉ xem: nhãn bên trái, giá trị bên phải */
function DetailRow({ label, value, multiline }: { label: string; value: React.ReactNode; multiline?: boolean }) {
  return (
    <div className={cn("flex gap-4 py-3 text-xs", multiline ? "items-start" : "items-center")}>
      <dt className="w-32 shrink-0 text-slate-500">{label}</dt>
      <dd className={cn("m-0 min-w-0 flex-1 font-semibold text-slate-800", multiline ? "whitespace-pre-wrap leading-relaxed" : "truncate")}>
        {value}
      </dd>
    </div>
  );
}
