"use client";

import { useState } from "react";
import type React from "react";
import { App } from "antd";
import {
  CalendarOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
  PaperClipOutlined,
  PlusOutlined,
  RollbackOutlined,
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
  validateDisbursement,
  type DisbursementKind,
  type CategorySummary,
  type DisbursementEntry,
} from "../../utils/project-disbursement";

const money = (v: number) => `${formatMoneyString(v)} VNĐ`;
const percent = (part: number, whole: number) =>
  whole > 0 ? Math.min(100, (part / whole) * 100) : 0;
const today = () => new Date().toISOString().slice(0, 10);

/** Cột bảng: Danh mục | Số đợt | Đã giải ngân | Tỷ lệ / TMĐT | Gần nhất | Thao tác */
const GRID =
  "grid grid-cols-[minmax(240px,1fr)_72px_170px_180px_110px_196px] items-center gap-x-4";

/** Drawer đang mở: giải ngân (danh mục có thể chọn) hoặc thu hồi (khóa danh mục) */
type FormState = { kind: DisbursementKind; category: string };

interface ProjectDisbursementTabProps {
  project: ProjectItem;
  operatorName: string;
  /** Được nhập giải ngân (quyền nhập liệu M4, dự án chưa đóng) */
  canDisburse: boolean;
  /** Tổng giải ngân thay đổi sau khi thêm / xóa đợt */
  onTotalChange: (total: number) => void;
}

/** Tab "Giải ngân" của dự án: chọn danh mục chi phí và nhập số tiền cho từng đợt */
export default function ProjectDisbursementTab({
  project,
  operatorName,
  canDisburse,
  onTotalChange,
}: ProjectDisbursementTabProps) {
  const { modal, message } = App.useApp();
  const { entries, categories, summary, add, remove, addCategory } =
    useProjectDisbursements(project.id, operatorName);

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

  const toggle = (category: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });

  const confirmRemove = (entry: DisbursementEntry) =>
    modal.confirm({
      centered: true,
      width: 420,
      title: "Xóa đợt giải ngân?",
      content: (
        <p className="m-0 text-xs text-slate-600">
          Xóa đợt {entry.kind === "withdraw" ? "thu hồi" : "giải ngân"}{" "}
          <strong>{money(entry.amount)}</strong> của danh mục{" "}
          <strong>{entry.category}</strong> ngày {formatDateVi(entry.date)}.
        </p>
      ),
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: () => {
        remove(entry.id);
        onTotalChange(summary.total - signedAmount(entry));
        message.success("Đã xóa đợt.");
      },
    });

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
            Giải ngân theo danh mục
          </h3>
          <p className="m-0 mt-0.5 text-[11px] text-slate-400">
            Bấm vào danh mục để xem các đợt đã giải ngân.
          </p>
        </div>
        {canDisburse && (
          <Button
            intent="primary"
            scale="comfortable"
            onClick={() => setForm({ kind: "disburse", category: "" })}
            className="min-w-[132px] px-6"
          >
            Giải ngân
          </Button>
        )}
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
        <div className="min-w-[940px]">
          <div
            className={cn(
              GRID,
              "border-y border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-semibold text-slate-500",
            )}
          >
            <span className="pl-5">Danh mục</span>
            <span className="text-center">Số đợt</span>
            <span className="text-right">Đã giải ngân</span>
            <span>Tỷ lệ / TMĐT</span>
            <span>Gần nhất</span>
            <span className="text-right">Thao tác</span>
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
              onRemove={confirmRemove}
            />
          ))}

          <div
            className={cn(
              GRID,
              "bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-900",
            )}
          >
            <span className="pl-5">Tổng cộng</span>
            <span className="text-center">{summary.count}</span>
            <span className="text-right text-[#DC2626]">
              {money(summary.total)}
            </span>
            <span className="text-slate-600">{rate.toFixed(1)}%</span>
            <span />
            <span />
          </div>
        </div>
      </div>

      {form && (
        <DisbursementFormDrawer
          kind={form.kind}
          projectName={project.name}
          operatorName={operatorName}
          initialCategory={form.category}
          categories={categories}
          remaining={remaining}
          categoryTotal={(c) =>
            summary.byCategory.find((row) => row.category === c)?.total ?? 0
          }
          onAddCategory={addCategory}
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
  onRemove,
}: {
  row: CategorySummary;
  totalInvestment: number;
  open: boolean;
  onToggle: () => void;
  entries: DisbursementEntry[];
  canDisburse: boolean;
  onDisburse: () => void;
  onWithdraw: () => void;
  onRemove: (entry: DisbursementEntry) => void;
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
        role={hasData ? "button" : undefined}
        tabIndex={hasData ? 0 : undefined}
        aria-expanded={hasData ? open : undefined}
        onClick={hasData ? onToggle : undefined}
        onKeyDown={(e) => {
          if (hasData && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onToggle();
          }
        }}
        className={cn(
          GRID,
          "group px-4 py-2.5 text-xs transition-colors hover:bg-slate-50",
          hasData && "cursor-pointer",
          open && "bg-red-50/40 hover:bg-red-50/60",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <RightOutlined
            className={cn(
              "w-3 shrink-0 text-[10px] text-slate-400 transition-transform",
              !hasData && "invisible",
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
        <span className={cn("text-right font-semibold text-slate-900", muted)}>
          {hasData ? money(row.total) : "—"}
        </span>
        <span className="flex items-center gap-2">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <span
              className="block h-full rounded-full bg-[#DC2626]/80"
              style={{ width: `${share}%` }}
            />
          </span>
          <span
            className={cn(
              "w-11 shrink-0 text-right text-[11px] text-slate-600",
              muted,
            )}
          >
            {share.toFixed(1)}%
          </span>
        </span>
        <span className={cn("text-slate-600", muted)}>
          {row.lastDate ? formatDateVi(row.lastDate) : "—"}
        </span>
        <span className="flex justify-end gap-1.5">
          {canDisburse &&
            (hasData ? (
              <>
                <Button
                  intent="outline"
                  scale="xs"
                  icon={<PlusOutlined />}
                  onClick={act(onDisburse)}
                  className="px-2"
                >
                  Giải ngân thêm
                </Button>
                <Button
                  intent="outline"
                  scale="xs"
                  icon={<RollbackOutlined />}
                  onClick={act(onWithdraw)}
                  disabled={row.total <= 0}
                  className="px-2 hover:!border-rose-400 hover:!text-rose-600"
                >
                  Thu hồi
                </Button>
              </>
            ) : (
              <Button
                intent="outline"
                scale="xs"
                icon={<PlusOutlined />}
                onClick={act(onDisburse)}
                className="px-2 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                Giải ngân
              </Button>
            ))}
        </span>
      </div>

      {/* Các đợt của danh mục: Nội dung · người nhập | — | Số tiền | — | Ngày | Xóa */}
      {open && hasData && (
        <ul className="m-0 list-none border-t border-dashed border-slate-200 bg-slate-50/50 p-0 py-1">
          {entries.map((e) => (
            <li
              key={e.id}
              className={cn(GRID, "group/entry px-4 py-1.5 text-xs")}
            >
              <span className="flex min-w-0 items-center gap-2 pl-5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                <span className="truncate text-slate-600" title={e.content}>
                  {e.content || (
                    <span className="italic text-slate-400">
                      Không có nội dung
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-[11px] text-slate-400">
                  · {e.createdBy}
                </span>
                {(e.attachments?.length ?? 0) > 0 && (
                  <Tooltip title={e.attachments!.map((a) => a.name).join(", ")}>
                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-white px-1.5 py-px text-[11px] text-slate-500 ring-1 ring-slate-200">
                      <PaperClipOutlined />
                      {e.attachments!.length}
                    </span>
                  </Tooltip>
                )}
              </span>
              <span />
              <span
                className={cn(
                  "text-right font-medium",
                  e.kind === "withdraw" ? "text-rose-600" : "text-slate-800",
                )}
              >
                {e.kind === "withdraw" && (
                  <span className="mr-1.5 rounded bg-rose-50 px-1.5 py-px text-[10px] font-semibold text-rose-600 ring-1 ring-rose-200">
                    Thu hồi
                  </span>
                )}
                {e.kind === "withdraw" ? "−" : ""}
                {money(e.amount)}
              </span>
              <span />
              <span className="text-slate-600">{formatDateVi(e.date)}</span>
              <span className="flex justify-end">
                {canDisburse && (
                  <Tooltip title="Xóa đợt">
                    <Button
                      intent="link"
                      aria-label="Xóa đợt"
                      icon={<DeleteOutlined />}
                      onClick={() => onRemove(e)}
                      className="!text-slate-400 opacity-0 transition-opacity group-hover/entry:opacity-100 hover:!text-rose-600 focus-visible:opacity-100"
                    />
                  </Tooltip>
                )}
              </span>
            </li>
          ))}
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
  remaining,
  onAddCategory,
  onCancel,
  onSubmit,
}: {
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
  const verb = withdraw ? "thu hồi" : "giải ngân";
  const amount = parseMoney(amountRaw);
  // Hạn mức: giải ngân = phần còn lại của TMĐT; thu hồi = số đã giải ngân của danh mục
  const limit = withdraw ? (category ? categoryTotal(category) : 0) : remaining;
  const overLimit = limit !== undefined && amount > limit;
  const after = limit !== undefined ? limit - amount : undefined;

  const clearError = () => setError(undefined);

  const submit = () => {
    const err = validateDisbursement(
      { kind, category, amount, attachmentCount: files.length, content },
      limit,
    );
    if (err) {
      setError(err);
      return;
    }
    onSubmit({
      kind,
      category: category!,
      amount,
      content: content.trim() || undefined,
      attachments: files.map(({ id, name, size, type }) => ({
        id,
        name,
        size,
        type,
      })),
    });
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
          <Button intent="primary" scale="sm" onClick={submit} className="px-5">
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
                label="Danh mục chi phí"
                value={category ?? ""}
              />
            ) : (
              <div>
                <FieldLabel text="Danh mục chi phí" required />
                <SelectWithAddOption
                  aria-label="Danh mục chi phí"
                  placeholder="Chọn danh mục hoặc gõ để thêm mới"
                  value={category}
                  options={categories.map((c) => ({ value: c, label: c }))}
                  filterByQuery
                  addPlaceholder="Gõ tên danh mục mới…"
                  notFoundContent={
                    <span className="text-xs text-slate-400">
                      Không có danh mục phù hợp, bấm “Thêm” để tạo mới
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

              {/* Vốn còn lại trước / sau đợt này */}
              {limit !== undefined && (
                <div className="mt-1.5 text-[11px]">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-slate-500">
                    <span>
                      {withdraw ? "Đã giải ngân của danh mục" : "Còn lại"}:{" "}
                      <strong className="text-slate-700">{money(limit)}</strong>
                    </span>
                    {amount > 0 && (
                      <span>
                        {withdraw ? "Sau thu hồi" : "Sau đợt này"}:{" "}
                        <strong
                          className={
                            overLimit ? "text-rose-600" : "text-emerald-600"
                          }
                        >
                          {overLimit
                            ? withdraw
                              ? "Vượt số đã giải ngân"
                              : "Vượt TMĐT"
                            : money(after ?? 0)}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>
              )}
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
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
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
