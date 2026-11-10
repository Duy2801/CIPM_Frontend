"use client";

import { useState, type ReactNode } from "react";
import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { Input, MoneyInput, Select } from "@/components/ui";
import { SelectWithAddOption } from "@/components/workspace";
import { formatMoneyString, parseMoney } from "@/utils/format-money";
import type { CatalogEntry } from "../constants/gpmb-compensation-catalog";
import type { CompensationGroup, CompensationItem } from "../types/gpmb.types";
import { loadCatalog, loadUnits, rememberCatalogItems, rememberUnit } from "../utils/compensation-catalog-store";
import {
  COMPENSATION_GROUP_LABELS,
  itemAmount,
  itemSupportAmount,
  landCodeFromName,
  summarizeCompensation,
} from "../utils/gpmb-compensation";

/**
 * Nhóm nhập trong bảng kê (theo mẫu phương án bồi thường): Đất đai · Cây trồng · Vật kiến trúc · Hỗ trợ.
 * "Thành tiền hỗ trợ" (chuyển đổi nghề & tìm kiếm việc làm) không nhập riêng mà tính trên từng thửa đất.
 */
const INPUT_GROUPS: { group: CompensationGroup; label: string; nameLabel: string; qtyLabel: string; priceLabel: string }[] = [
  { group: "LAND", label: "Đất đai", nameLabel: "Loại Đất", qtyLabel: "Diện Tích (m2)", priceLabel: "Đơn Giá bồi thường" },
  { group: "CROPS", label: "Cây trồng", nameLabel: "Loại Cây", qtyLabel: "Số lượng", priceLabel: "Đơn giá cây trồng" },
  { group: "STRUCTURES", label: "Vật kiến trúc", nameLabel: "Hạng Mục", qtyLabel: "Khối Lượng", priceLabel: "Đơn giá vật kiến trúc" },
  { group: "POLICY", label: "Hỗ trợ", nameLabel: "Loại Hỗ Trợ", qtyLabel: "Số lượng hỗ trợ", priceLabel: "Đơn giá hỗ trợ" },
];
const groupConfig = (group: CompensationGroup) => INPUT_GROUPS.find((g) => g.group === group) ?? INPUT_GROUPS[0];

/**
 * Bảng kê bồi thường, hỗ trợ của một hộ: chọn nhóm rồi điền từng dòng thuộc nhóm đó.
 * - Đất đai: TBĐ, thửa, loại đất, diện tích, đơn giá bồi thường, đơn giá hỗ trợ CĐN & TKVL.
 * - Cây trồng / Vật kiến trúc / Hỗ trợ: tên theo bảng giá, số lượng (khối lượng), đơn vị, đơn giá.
 * Chọn tên trong bảng giá thì đơn vị, đơn giá tự điền; tên chưa có thì nhập mới ở cuối danh sách.
 */
export default function CompensationItemsEditor({
  value,
  onChange,
  defaultLandArea,
  projectId,
}: {
  /** Dự án: dùng bảng giá của dự án này */
  projectId?: string;
  value: CompensationItem[];
  onChange: (items: CompensationItem[]) => void;
  /** Diện tích thu hồi đã nhập: thửa đất đầu tiên lấy sẵn số này */
  defaultLandArea?: number;
}) {
  const summary = summarizeCompensation({ compensation: 0, compensationItems: value });
  const [catalog, setCatalog] = useState(
    () =>
      Object.fromEntries(INPUT_GROUPS.map(({ group }) => [group, loadCatalog(group, projectId)])) as Record<
        CompensationGroup,
        CatalogEntry[]
      >,
  );
  const [units, setUnits] = useState(() => loadUnits(projectId));

  const update = (index: number, patch: Partial<CompensationItem>) =>
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const remove = (index: number) => onChange(value.filter((_, i) => i !== index));

  const addGroup = (group: CompensationGroup) => {
    const firstLand = group === "LAND" && !value.some((i) => i.group === "LAND");
    onChange([
      ...value,
      {
        group,
        name: "",
        quantity: firstLand && defaultLandArea ? defaultLandArea : group === "LAND" ? 0 : 1,
        unit: group === "LAND" ? "m²" : "",
        unitPrice: 0,
      },
    ]);
  };

  /** Chọn một mục trong bảng giá: lấy đơn vị, đơn giá (đất: cả đơn giá hỗ trợ) */
  const pick = (index: number, group: CompensationGroup, entry: CatalogEntry) =>
    update(index, {
      name: entry.name,
      unitPrice: entry.price,
      ...(group === "LAND"
        ? { supportPrice: isResidential(entry.name) ? undefined : entry.supportPrice }
        : { unit: entry.unit || value[index].unit }),
    });

  /** Thêm tên mới vào bảng giá của nhóm (lưu lại để lần sau chọn được) */
  const addEntry = (index: number, group: CompensationGroup, name: string) => {
    const item = value[index];
    const entry: CatalogEntry = { name, unit: item.unit || (group === "LAND" ? "m²" : ""), price: item.unitPrice };
    rememberCatalogItems([{ ...item, name }], projectId);
    setCatalog((prev) => ({ ...prev, [group]: [...prev[group], entry] }));
    update(index, { name });
  };

  const numberField = (label: string, val: number | undefined, onVal: (n: number) => void, decimals = 0) => (
    <Field label={label}>
      <MoneyInput maxDecimals={decimals} value={val ?? 0} onChange={(v) => onVal(readMoneyInput(v))} />
    </Field>
  );

  const renderItem = (index: number, item: CompensationItem) => {
    const cfg = groupConfig(item.group);
    const nameSelect = (
        <SelectWithAddOption
          size="large"
          maxVisibleItems={5}
          filterByQuery
          value={item.name || undefined}
          placeholder={`Chọn ${cfg.nameLabel.toLowerCase()} trong bảng giá`}
          addPlaceholder="Nhập mới…"
          options={[...new Set(catalog[item.group].map((e) => e.name))].map((name) => ({ value: name, label: name }))}
          onChange={(name) => {
            const entry = catalog[item.group].find((e) => e.name === name);
            if (entry) pick(index, item.group, entry);
          }}
          onAdd={(name) => addEntry(index, item.group, name)}
          className="text-sm"
        />
    );
    // Nhóm chỉ có một dòng: xóa bằng nút X ở thanh tiêu đề nhóm; nhiều dòng thì mỗi dòng có nút xóa riêng
    const multiple = value.filter((i) => i.group === item.group).length > 1;
    /** Dòng tiêu đề của thẻ: tên mục bên trái, nút xóa dòng bên phải (khi nhóm có nhiều dòng) */
    const header = (title: string) => (
      <div className="flex min-h-6 items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-600">{title}</span>
        {multiple && (
          <button
            type="button"
            aria-label={`Xóa ${item.name || title.toLowerCase()}`}
            title="Xóa dòng này"
            onClick={() => remove(index)}
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded border-0 bg-transparent text-slate-400 hover:bg-rose-50 hover:text-rose-600"
          >
            <CloseOutlined className="text-[11px]" />
          </button>
        )}
      </div>
    );

    if (item.group === "LAND") {
      const support = itemSupportAmount(item);
      return (
        <>
          {header("Thửa đất")}
          <div className="flex items-end gap-2">
            <Field label="TBĐ" className="w-24 shrink-0">
              <Input value={item.mapSheet} placeholder="TBĐ" onChange={(e) => update(index, { mapSheet: e.target.value })} />
            </Field>
            <Field label="Thửa" className="w-24 shrink-0">
              <Input value={item.parcel} placeholder="Số thửa" onChange={(e) => update(index, { parcel: e.target.value })} />
            </Field>
            <Field label={cfg.nameLabel} className="min-w-0 flex-1">
              {nameSelect}
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {numberField(cfg.qtyLabel, item.quantity, (n) => update(index, { quantity: n }), 2)}
            {numberField(cfg.priceLabel, item.unitPrice, (n) => update(index, { unitPrice: n }))}
            {isResidential(item.name) ? (
              // Không phải ô nhập: chỉ là dòng thông báo (đất ở không có khoản hỗ trợ này)
              <div>
                <span className="mb-1 block text-[11px] font-medium text-slate-500">Đơn giá CĐN và TKVL</span>
                <div
                  aria-disabled
                  className="flex h-10 cursor-not-allowed select-none items-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 text-sm text-slate-400"
                >
                  Không áp dụng cho đất ở
                </div>
              </div>
            ) : (
              numberField("Đơn giá CĐN và TKVL", item.supportPrice, (n) =>
                update(index, { supportPrice: n || undefined }),
              )
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-xs text-slate-500">
            <span>
              Thành tiền bồi thường <Amount value={itemAmount(item)} />
            </span>
            {support > 0 && (
              <span>
                Thành tiền hỗ trợ CĐN và TKVL <Amount value={support} />
              </span>
            )}
          </div>
        </>
      );
    }

    return (
      <>
        {header(cfg.nameLabel)}
        {nameSelect}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {numberField(cfg.qtyLabel, item.quantity, (n) => update(index, { quantity: n }), 2)}
          <Field label="Đơn vị">
            <SelectWithAddOption
              size="large"
              maxVisibleItems={5}
              value={item.unit || undefined}
              placeholder="Chọn đơn vị"
              addPlaceholder="Đơn vị mới…"
              options={units.map((u) => ({ value: u, label: u }))}
              onChange={(unit) => update(index, { unit })}
              onAdd={(unit) => {
                rememberUnit(unit);
                setUnits((prev) => [...prev, unit]);
                update(index, { unit });
              }}
              className="text-sm"
            />
          </Field>
          {numberField(cfg.priceLabel, item.unitPrice, (n) => update(index, { unitPrice: n }))}
        </div>
        <div className="flex items-center justify-end text-xs text-slate-500">
          <span>
            {`Thành tiền ${cfg.label.toLowerCase()}`} <Amount value={itemAmount(item)} />
          </span>
        </div>
      </>
    );
  };

  const groupsInUse = INPUT_GROUPS.filter(({ group }) => value.some((i) => i.group === group));

  return (
    <div className="flex flex-col gap-4">
      <Select
        value={null}
        size="large"
        // Ô chọn nhóm nổi bật bằng viền đỏ
        className="w-full !border-[#DC2626] [&_.ant-select-selector]:!border-[#DC2626]"
        placeholder={
          <span>
            <PlusOutlined className="mr-1.5" />
            Chọn nhóm để thêm dòng: đất đai, cây trồng, vật kiến trúc, hỗ trợ…
          </span>
        }
        options={INPUT_GROUPS.map(({ group, label }) => ({ value: group, label }))}
        onChange={(g: CompensationGroup) => addGroup(g)}
      />

      {groupsInUse.map(({ group, label }) => (
        <section key={group} className="overflow-hidden rounded-lg border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 py-1.5 pl-3 pr-1.5">
            <h4 className="m-0 text-xs font-bold uppercase tracking-wide text-slate-600">{label}</h4>
            <button
              type="button"
              aria-label={`Xóa nhóm ${label.toLowerCase()}`}
              title={`Xóa nhóm ${label.toLowerCase()}`}
              onClick={() => onChange(value.filter((i) => i.group !== group))}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-slate-400 hover:bg-rose-50 hover:text-rose-600"
            >
              <CloseOutlined />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {value.map((item, index) =>
              item.group !== group ? null : (
                <div key={index} className="space-y-2 px-3 py-3">
                  {renderItem(index, item)}
                </div>
              ),
            )}
          </div>

          {/* Cộng tiền của nhóm: ở cuối khung (đất đai: bồi thường đất + hỗ trợ CĐN & TKVL) */}
          <div className="space-y-1 border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs">
            <SumRow label={`Cộng ${COMPENSATION_GROUP_LABELS[group].toLowerCase()}`} value={summary[group]} />
            {group === "LAND" && summary.SUPPORT > 0 && (
              <SumRow label="Cộng thành tiền hỗ trợ CĐN và TKVL" value={summary.SUPPORT} />
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

/**
 * Đất ở (ODT/ONT) không có hỗ trợ chuyển đổi nghề và tìm kiếm việc làm —
 * khoản này chỉ dành cho đất nông nghiệp của hộ trực tiếp sản xuất (bảng giá ghi "-CĐN").
 */
const isResidential = (landName: string) => ["ODT", "ONT"].includes(landCodeFromName(landName));

/** MoneyInput trả về sự kiện (dùng được với Form) — lấy chuỗi số trong `target.value` rồi đổi ra số */
function readMoneyInput(v: unknown): number {
  const raw = v && typeof v === "object" && "target" in v ? (v as { target: { value: string } }).target.value : v;
  return parseMoney(raw as string | number | undefined) || 0;
}

function Amount({ value }: { value: number }) {
  return <span className="ml-1 text-sm font-semibold tabular-nums text-slate-900">{formatMoneyString(value) || "0"} đ</span>;
}

function SumRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="font-bold tabular-nums text-slate-900">{formatMoneyString(value) || "0"} đ</span>
    </div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <label className={className}>
      <span className="mb-1 block text-[11px] font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}
