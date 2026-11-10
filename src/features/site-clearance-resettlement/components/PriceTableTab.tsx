"use client";

import { useMemo, useRef, useState } from "react";
import { App } from "antd";
import { ArrowLeftOutlined, DeleteOutlined, DownloadOutlined, PlusOutlined, SearchOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Card, Drawer, Form, Input, Modal, MoneyInput, Pagination, Radio, Segmented, STANDARD_DRAWER_WIDTH, Table, Tooltip } from "@/components/ui";
import { readCsv, readXlsx } from "@/utils/xlsx-reader";
import type { ColumnsType } from "@/components/ui";
import { SelectWithAddOption } from "@/components/workspace";
import { formatMoneyString, parseMoney } from "@/utils/format-money";
import type { CatalogEntry } from "../constants/gpmb-compensation-catalog";
import { useSiteClearance } from "../hooks/useSiteClearance";
import type { CompensationGroup } from "../types/gpmb.types";
import {
  PRICE_TABLE_GROUPS,
  loadPriceTable,
  loadUnits,
  rememberUnit,
  savePriceTable,
  type PriceTable,
} from "../utils/compensation-catalog-store";
import { landCodeFromName } from "../utils/gpmb-compensation";
import {
  IMPORT_GROUPS,
  applyPriceTableImport,
  buildPriceTableRows,
  diffPriceTable,
  parsePriceTableRows,
  toCsv,
  type ImportMode,
  type ParsedPriceTable,
} from "../utils/price-table-excel";

const GROUP_META: Record<CompensationGroup, { label: string; nameLabel: string }> = {
  LAND: {
    label: "Đất đai",
    nameLabel: "Loại Đất",
  },
  CROPS: {
    label: "Cây trồng",
    nameLabel: "Loại Cây",
  },
  STRUCTURES: {
    label: "Vật kiến trúc",
    nameLabel: "Hạng Mục",
  },
  POLICY: {
    label: "Hỗ trợ",
    nameLabel: "Loại Hỗ Trợ",
  },
  SUPPORT: { label: "Hỗ trợ CĐN", nameLabel: "" },
};

const PAGE_SIZE = 20;

const isResidential = (name: string) => ["ODT", "ONT"].includes(landCodeFromName(name));
const normalize = (s: string) => s.trim().toLowerCase();

type Row = CatalogEntry & { index: number; stt: number; usage: number };

interface EntryForm {
  name: string;
  unit: string;
  price: string | number;
  supportPrice?: string | number;
}

/** MoneyInput trả về sự kiện (dùng được với Form) */
const readMoney = (v: unknown) =>
  parseMoney((v && typeof v === "object" && "target" in v ? (v as { target: { value: string } }).target.value : v) as string) || 0;

/**
 * Bảng giá bồi thường, hỗ trợ của dự án (tương đương sheet BANG_GIA): quản lý danh mục 4 nhóm —
 * thêm, sửa đơn giá, xóa. Form thêm hộ dân lấy tên và đơn giá từ bảng này.
 */
export default function PriceTableTab({ projectId }: { projectId: string }) {
  const { modal, message } = App.useApp();
  const { households, permissions } = useSiteClearance(projectId);
  const canEdit = permissions.canEdit;

  const [table, setTable] = useState<PriceTable>(() => loadPriceTable(projectId));
  const [group, setGroup] = useState<CompensationGroup>("LAND");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<{ index: number | null } | null>(null);
  const [units, setUnits] = useState(() => loadUnits(projectId));
  const [form] = Form.useForm<EntryForm>();
  const meta = GROUP_META[group];

  const commit = (next: PriceTable) => {
    setTable(next);
    savePriceTable(projectId, next);
  };

  /** Số hộ trong dự án đang dùng mỗi mục (theo tên) */
  const usage = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of households) {
      const names = new Set((h.compensationItems ?? []).filter((i) => i.group === group).map((i) => normalize(i.name)));
      names.forEach((n) => map.set(n, (map.get(n) ?? 0) + 1));
    }
    return map;
  }, [households, group]);

  const rows = useMemo<Row[]>(() => {
    const q = normalize(search);
    return table[group]
      .map((e, index) => ({ ...e, index, stt: 0, usage: usage.get(normalize(e.name)) ?? 0 }))
      .filter((e) => !q || normalize(e.name).includes(q))
      .map((e, i) => ({ ...e, stt: i + 1 }));
  }, [table, group, search, usage]);

  const openEditor = (index: number | null) => {
    const entry = index === null ? undefined : table[group][index];
    form.setFieldsValue({
      name: entry?.name ?? "",
      unit: entry?.unit ?? (group === "LAND" ? "m²" : ""),
      price: entry?.price ?? 0,
      supportPrice: entry?.supportPrice ?? 0,
    });
    setEditing({ index });
  };

  const saveEntry = (values: EntryForm) => {
    if (!editing) return;
    const name = values.name.trim();
    const duplicate = table[group].some((e, i) => i !== editing.index && normalize(e.name) === normalize(name));
    if (duplicate) {
      form.setFields([{ name: "name", errors: ["Tên này đã có trong bảng giá."] }]);
      return;
    }
    const supportPrice = group === "LAND" && !isResidential(name) ? readMoney(values.supportPrice) : 0;
    const entry: CatalogEntry = {
      name,
      unit: values.unit?.trim() || (group === "LAND" ? "m²" : "khoản"),
      price: readMoney(values.price),
      ...(supportPrice ? { supportPrice } : {}),
    };
    const list = [...table[group]];
    if (editing.index === null) list.unshift(entry);
    else list[editing.index] = entry;
    commit({ ...table, [group]: list });
    setEditing(null);
    if (editing.index === null) {
      setSearch("");
      setPage(1);
    }
    message.success(editing.index === null ? "Đã thêm vào bảng giá." : "Đã cập nhật đơn giá.");
  };

  const removeEntry = (row: Row) =>
    modal.confirm({
      centered: true,
      title: "Xóa khỏi bảng giá?",
      content: (
        <div className="space-y-1.5 text-xs text-slate-600">
          <p className="m-0">
            Xóa <strong className="text-slate-800">{row.name}</strong> khỏi bảng giá {meta.label.toLowerCase()}.
          </p>
          {row.usage > 0 && (
            <p className="m-0 text-amber-700">
              {row.usage} hộ đang có khoản này trong bảng kê — bảng kê của các hộ đó giữ nguyên.
            </p>
          )}
        </div>
      ),
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: () => commit({ ...table, [group]: table[group].filter((_, i) => i !== row.index) }),
    });

  // Ô trống như trong file khi không có đơn giá
  const money = (v?: number) => (v ? formatMoneyString(v) : "");

  /** Cột đúng theo sheet BANG_GIA: Đất (Loại Đất · Đơn Giá Bồi Thường · Đơn Giá Hỗ Trợ), nhóm khác (tên · ĐVT · Đơn Giá) */
  const columns: ColumnsType<Row> = [
    { title: "STT", dataIndex: "stt", width: 64, align: "center" },
    {
      title: meta.nameLabel,
      key: "name",
      render: (_, row) => <span className="text-[13px] text-slate-800">{row.name}</span>,
    },
    ...(group === "LAND"
      ? [
          {
            title: "Đơn Giá Bồi Thường (đ/m2)",
            key: "price",
            width: 200,
            align: "center" as const,
            render: (_: unknown, row: Row) => <span className="tabular-nums text-slate-900">{money(row.price)}</span>,
          },
          {
            title: "Đơn Giá Hỗ Trợ (đ/m2)",
            key: "support",
            width: 200,
            align: "center" as const,
            render: (_: unknown, row: Row) => <span className="tabular-nums text-slate-900">{money(row.supportPrice)}</span>,
          },
        ]
      : [
          { title: "ĐVT", dataIndex: "unit", width: 110, align: "center" as const, render: (u: string) => u },
          {
            title: "Đơn Giá",
            key: "price",
            width: 160,
            align: "center" as const,
            render: (_: unknown, row: Row) => <span className="tabular-nums text-slate-900">{money(row.price)}</span>,
          },
        ]),
  ];

  // ── Nhập / xuất Excel theo bố cục sheet BANG_GIA ──
  const fileRef = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);
  const [pendingImport, setPendingImport] = useState<{ fileName: string; parsed: ParsedPriceTable } | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>("merge");

  const exportTable = () => {
    const csv = toCsv(buildPriceTableRows(table));
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `BANG_GIA_${projectId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importFile = async (file: File) => {
    setReading(true);
    try {
      let parsed: ParsedPriceTable = { table: {}, found: [] };
      if (/\.csv$/i.test(file.name)) {
        parsed = parsePriceTableRows(await readCsv(file));
      } else {
        const workbook = await readXlsx(file);
        // Ưu tiên sheet BANG_GIA; không có thì lấy sheet tìm thấy nhiều bảng giá nhất
        const names = [
          ...workbook.sheetNames.filter((n) => normalize(n) === "bang_gia"),
          ...workbook.sheetNames.filter((n) => normalize(n) !== "bang_gia"),
        ];
        for (const name of names) {
          const candidate = parsePriceTableRows(await workbook.readSheet(name));
          if (candidate.found.length > parsed.found.length) parsed = candidate;
          if (parsed.found.length === IMPORT_GROUPS.length) break;
        }
      }
      if (parsed.found.length === 0) {
        message.error("Không tìm thấy bảng giá trong file. Cần có dòng tiêu đề cột như: Loại Cây | ĐVT | Đơn Giá.");
        return;
      }
      setImportMode("merge");
      setPendingImport({ fileName: file.name, parsed });
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Không đọc được file.");
    } finally {
      setReading(false);
    }
  };

  const importDiff = pendingImport ? diffPriceTable(table, pendingImport.parsed) : null;

  const confirmImport = () => {
    if (!pendingImport) return;
    commit(applyPriceTableImport(table, pendingImport.parsed, importMode));
    setPendingImport(null);
    setPage(1);
    message.success(`Đã nhập bảng giá từ ${pendingImport.fileName}.`);
  };

  const editingName = Form.useWatch("name", form) ?? "";
  const editingUnit = Form.useWatch("unit", form);

  return (
    <Card surface="flat" padding="none" rounded="lg" className="overflow-hidden border-slate-200 shadow-sm shadow-slate-100">
      <header className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4">
        {/* Hàng 1: tiêu đề · tìm kiếm + thêm mục */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="m-0 text-base font-bold text-slate-900">Bảng giá bồi thường, hỗ trợ</h3>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            {/* antd Input luôn rộng 100%: đặt độ rộng ở khung bọc */}
            <div className="min-w-0 flex-1 sm:w-72 sm:flex-none">
              <Input
                allowClear
                intent="clean"
                prefix={<SearchOutlined className="text-xs text-slate-400" />}
                placeholder={`Tìm ${meta.nameLabel.toLowerCase()}…`}
                className="h-8 w-full text-xs"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Button intent="outline" scale="sm" icon={<DownloadOutlined />} onClick={exportTable} className="h-8 shrink-0 text-xs">
              Xuất Excel
            </Button>
            {canEdit && (
              <>
                <Button
                  intent="outline"
                  scale="sm"
                  icon={<UploadOutlined />}
                  loading={reading}
                  onClick={() => fileRef.current?.click()}
                  className="h-8 shrink-0 text-xs"
                >
                  Nhập Excel
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xlsm,.csv"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) void importFile(file);
                  }}
                />
                <Button intent="primary" scale="sm" icon={<PlusOutlined />} onClick={() => openEditor(null)} className="h-8 shrink-0 px-3 text-xs">
                  Thêm vào bảng giá
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Hàng 2: nhóm bảng giá · phân trang */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented<CompensationGroup>
            value={group}
            onChange={(g) => {
              setGroup(g);
              setSearch("");
              setPage(1);
            }}
            options={PRICE_TABLE_GROUPS.map((g) => ({ value: g, label: `${GROUP_META[g].label} (${table[g].length})` }))}
          />
          <Pagination
            current={page}
            pageSize={PAGE_SIZE}
            total={rows.length}
            onChange={setPage}
            showSizeChanger={false}
            hideOnSinglePage
            size="small"
          />
        </div>
      </header>

      <Table<Row>
        rowKey={(r) => `${group}-${r.index}`}
        size="small"
        bordered
        columns={columns}
        dataSource={rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
        tableLayout="fixed"
        scroll={{ x: 900 }}
        pagination={false}
        onRow={(row) => (canEdit ? { onClick: () => openEditor(row.index), className: "cursor-pointer" } : {})}
        className="[&_.ant-table-thead>tr>th]:!bg-slate-50 [&_.ant-table-thead>tr>th]:!text-center [&_.ant-table-thead>tr>th]:text-[12px] [&_.ant-table-thead>tr>th]:font-bold [&_.ant-table-thead>tr>th]:text-slate-600 [&_.ant-table-tbody>tr:not(.ant-table-measure-row)>td]:!py-2"
        locale={{ emptyText: <div className="py-10 text-sm text-slate-500">Không có mục nào khớp.</div> }}
      />

      <Modal
        open={Boolean(pendingImport)}
        centered
        destroyOnHidden
        width={560}
        title="Nhập bảng giá từ Excel"
        onCancel={() => setPendingImport(null)}
        okText="Nhập vào bảng giá"
        cancelText="Hủy"
        onOk={confirmImport}
      >
        {pendingImport && importDiff && (
          <div className="space-y-3 pt-1 text-xs">
            <p className="m-0 text-slate-600">
              File <strong className="text-slate-900">{pendingImport.fileName}</strong>
            </p>
            <table className="w-full border-collapse overflow-hidden rounded-lg text-[12.5px]">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="border border-slate-200 px-2 py-1.5 text-center font-semibold">Bảng giá</th>
                  <th className="border border-slate-200 px-2 py-1.5 text-center font-semibold">Số dòng trong file</th>
                  <th className="border border-slate-200 px-2 py-1.5 text-center font-semibold">Thêm mới</th>
                  <th className="border border-slate-200 px-2 py-1.5 text-center font-semibold">Đổi đơn giá</th>
                  <th className="border border-slate-200 px-2 py-1.5 text-center font-semibold">Giữ nguyên</th>
                </tr>
              </thead>
              <tbody>
                {IMPORT_GROUPS.map((g) => {
                  const inFile = pendingImport.parsed.table[g]?.length ?? 0;
                  const d = importDiff[g];
                  return (
                    <tr key={g} className={inFile ? "" : "text-slate-400"}>
                      <td className="border border-slate-200 px-2 py-1.5">{GROUP_META[g].label}</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center">{inFile || "Không có"}</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center">{inFile ? d.added : ""}</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center">{inFile ? d.updated : ""}</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center">{inFile ? d.unchanged : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Radio.Group value={importMode} onChange={(e) => setImportMode(e.target.value)} className="flex flex-col gap-1.5">
              <Radio value="merge">
                Cập nhật đơn giá và thêm dòng mới <span className="text-slate-400">— giữ các dòng không có trong file</span>
              </Radio>
              <Radio value="replace">
                Thay toàn bộ <span className="text-slate-400">— bảng nào có trong file thì lấy đúng các dòng trong file</span>
              </Radio>
            </Radio.Group>
            <p className="m-0 text-slate-500">Bảng kê của các hộ đã lập giữ nguyên đơn giá lúc lập.</p>
          </div>
        )}
      </Modal>

      <Drawer
        open={Boolean(editing)}
        width={STANDARD_DRAWER_WIDTH}
        destroyOnClose
        closable={false}
        onClose={() => setEditing(null)}
        title={
          <div className="flex items-center gap-3">
            <Tooltip title="Quay lại">
              <button
                type="button"
                aria-label="Quay lại"
                onClick={() => setEditing(null)}
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              >
                <ArrowLeftOutlined className="text-sm" />
              </button>
            </Tooltip>
            <span className="text-base font-bold text-[#102A43]">
              {editing?.index === null ? `Thêm vào bảng giá ${meta.label.toLowerCase()}` : `Sửa đơn giá ${meta.label.toLowerCase()}`}
            </span>
          </div>
        }
        footer={
          <div className="flex items-center justify-between gap-2 px-1 py-1">
            <Button intent="primary" onClick={() => form.submit()}>
              {editing?.index === null ? "Thêm vào bảng giá" : "Lưu thay đổi"}
            </Button>
            {editing && editing.index !== null && (
              <Button
                intent="outline"
                icon={<DeleteOutlined />}
                onClick={() => {
                  const index = editing.index as number;
                  setEditing(null);
                  removeEntry({ ...table[group][index], index, stt: 0, usage: usage.get(normalize(table[group][index].name)) ?? 0 });
                }}
                className="hover:!border-rose-300 hover:!text-rose-600"
              >
                Xóa khỏi bảng giá
              </Button>
            )}
          </div>
        }
      >
        {/* Trường đúng theo cột của bảng trong sheet BANG_GIA */}
        <Form<EntryForm> form={form} layout="vertical" onFinish={saveEntry}>
          <Form.Item name="name" label={meta.nameLabel} rules={[{ required: true, whitespace: true, message: "Vui lòng nhập tên." }]}>
            <Input.TextArea
              autoSize={{ minRows: 1, maxRows: 4 }}
              placeholder={group === "LAND" ? "vd: Đất ở đô thị-VT1 - đường số 06" : "Tên theo quyết định đơn giá"}
            />
          </Form.Item>

          {group === "LAND" ? (
            <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
              <Form.Item name="price" label="Đơn Giá Bồi Thường (đ/m2)" rules={[{ required: true, message: "Nhập đơn giá." }]}>
                <MoneyInput placeholder="0" />
              </Form.Item>
              <Form.Item
                name="supportPrice"
                label="Đơn Giá Hỗ Trợ (đ/m2)"
                extra={isResidential(editingName) ? "Đất ở không có hỗ trợ CĐN và TKVL." : "Để trống nếu không áp dụng."}
              >
                <MoneyInput placeholder="0" disabled={isResidential(editingName)} />
              </Form.Item>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
              <Form.Item name="unit" label="ĐVT">
                <SelectWithAddOption
                  size="large"
                  maxVisibleItems={5}
                  value={editingUnit || undefined}
                  placeholder="Chọn đơn vị"
                  addPlaceholder="Đơn vị mới…"
                  options={units.map((u) => ({ value: u, label: u }))}
                  onChange={(u) => form.setFieldValue("unit", u)}
                  onAdd={(u) => {
                    rememberUnit(u);
                    setUnits((prev) => [...prev, u]);
                    form.setFieldValue("unit", u);
                  }}
                  className="text-sm"
                />
              </Form.Item>
              <Form.Item name="price" label="Đơn Giá" rules={[{ required: true, message: "Nhập đơn giá." }]}>
                <MoneyInput placeholder="0" />
              </Form.Item>
            </div>
          )}
        </Form>
      </Drawer>
    </Card>
  );
}
