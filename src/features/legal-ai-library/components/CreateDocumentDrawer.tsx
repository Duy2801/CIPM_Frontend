"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  TagOutlined,
} from "@ant-design/icons";
import {
  Button,
  Divider,
  Drawer,
  Input,
  Select,
  StandardFileUpload,
  STANDARD_DRAWER_WIDTH,
} from "@/components/ui";
import type { UploadedAttachment } from "@/components/ui/standard-file-upload";
import { formatDateVi, todayIso } from "@/utils/date";
import { normalizeSearchText } from "@/utils/search-text";
import {
  COMMON_ISSUERS,
  DEFAULT_ISSUER_BY_CATEGORY,
  STATUS_META,
  STATUS_ORDER,
  getCategoryLabel,
} from "../constants/legal-mock-data";
import type {
  BuiltInDocumentCategory,
  DocumentCategoryKey,
  LegalDocument,
  LegalDocumentStatus,
} from "../types/legal-ai.types";

interface CreateDocumentDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (doc: LegalDocument) => void;
  /** Cơ quan ban hành của các văn bản đã có trong thư viện (bổ sung vào danh sách gợi ý) */
  knownIssuers?: string[];
  /** Loại văn bản người dùng đã tự thêm trước đó (bổ sung vào danh sách chọn) */
  knownCategories?: string[];
}

const BUILT_IN_CATEGORIES: BuiltInDocumentCategory[] = [
  "LAW",
  "DECREE",
  "CIRCULAR",
  "RESOLUTION",
  "DECISION",
  "LOCAL",
];

const STATUS_SELECT_OPTIONS = STATUS_ORDER.map((value) => ({
  value,
  label: (
    <div className="flex items-center gap-2">
      <span className={`inline-block h-2 w-2 rounded-full ${STATUS_META[value].dotClass}`} />
      <span>{STATUS_META[value].label}</span>
    </div>
  ),
}));

const COMMON_FIELDS = [
  "Lao động-Tiền lương",
  "Đầu tư xây dựng",
  "Quản lý đấu thầu",
  "Đất đai - GPMB & TĐC",
  "Tài chính - Quyết toán KBNN",
  "Bảo hành & Bảo trì công trình",
  "Thủ tục XDCB",
];

const DEFAULT_ISSUERS = new Set(Object.values(DEFAULT_ISSUER_BY_CATEGORY));

export default function CreateDocumentDrawer({
  open,
  onClose,
  onSubmit,
  knownIssuers = [],
  knownCategories = [],
}: CreateDocumentDrawerProps) {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<DocumentCategoryKey>("DECREE");
  const [categoryQuery, setCategoryQuery] = useState("");
  const [addedCategories, setAddedCategories] = useState<string[]>([]);
  const [issuer, setIssuer] = useState("");
  const [issuerQuery, setIssuerQuery] = useState("");
  const [addedIssuers, setAddedIssuers] = useState<string[]>([]);
  const [signer, setSigner] = useState("");
  const [gazetteNumber, setGazetteNumber] = useState("");
  const [gazetteDate, setGazetteDate] = useState("");
  const [field, setField] = useState("Lao động-Tiền lương");
  const [fieldQuery, setFieldQuery] = useState("");
  const [addedFields, setAddedFields] = useState<string[]>([]);
  const [issueDate, setIssueDate] = useState(todayIso());
  const [effectiveDate, setEffectiveDate] = useState(todayIso());
  const [expiredDate, setExpiredDate] = useState("");
  const [status, setStatus] = useState<LegalDocumentStatus>("EFFECTIVE");
  const [tagsStr, setTagsStr] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<UploadedAttachment[]>([]);
  const [errorText, setErrorText] = useState("");

  // Đặt lại dữ liệu form khi mở
  useEffect(() => {
    if (!open) return;

    setCode("");
    setTitle("");
    setCategory("DECREE");
    setIssuer(DEFAULT_ISSUER_BY_CATEGORY.DECREE ?? "");
    setSigner("");
    setGazetteNumber("");
    setGazetteDate("");
    setField("Lao động-Tiền lương");
    setIssueDate(todayIso());
    setEffectiveDate(todayIso());
    setExpiredDate("");
    setStatus("EFFECTIVE");
    setTagsStr("");
    setAttachedFiles([]);
    setErrorText("");
    setIssuerQuery("");
    setCategoryQuery("");
  }, [open]);

  const issuerOptions = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const name of [...COMMON_ISSUERS, ...knownIssuers, ...addedIssuers, issuer]) {
      const trimmed = name.trim();
      const key = normalizeSearchText(trimmed);
      if (!trimmed || seen.has(key)) continue;
      seen.add(key);
      list.push(trimmed);
    }
    return list.map((name) => ({ value: name, label: name }));
  }, [knownIssuers, addedIssuers, issuer]);

  const filteredIssuerOptions = useMemo(() => {
    const query = normalizeSearchText(issuerQuery.trim());
    return query
      ? issuerOptions.filter((opt) => normalizeSearchText(opt.value).includes(query))
      : issuerOptions;
  }, [issuerOptions, issuerQuery]);

  const issuerQueryTrimmed = issuerQuery.trim();
  const canAddIssuer =
    Boolean(issuerQueryTrimmed) &&
    !issuerOptions.some(
      (opt) => normalizeSearchText(opt.value) === normalizeSearchText(issuerQueryTrimmed),
    );

  const handleAddIssuer = () => {
    if (!canAddIssuer) return;
    setAddedIssuers((prev) => [...prev, issuerQueryTrimmed]);
    setIssuer(issuerQueryTrimmed);
    setIssuerQuery("");
  };

  const allFields = useMemo(() => {
    return [...COMMON_FIELDS, ...addedFields];
  }, [addedFields]);

  const handleAddField = () => {
    const trimmed = fieldQuery.trim();
    if (!trimmed) return;
    if (!allFields.includes(trimmed)) {
      setAddedFields((prev) => [...prev, trimmed]);
    }
    setField(trimmed);
    setFieldQuery("");
  };

  const categoryOptions = useMemo(() => {
    const seen = new Set<string>();
    const list: { value: string; label: string }[] = [];
    for (const value of [...BUILT_IN_CATEGORIES, ...knownCategories, ...addedCategories, category]) {
      const label = getCategoryLabel(value).trim();
      const key = normalizeSearchText(label);
      if (!label || seen.has(key)) continue;
      seen.add(key);
      list.push({ value, label });
    }
    return list;
  }, [knownCategories, addedCategories, category]);

  const categoryQueryTrimmed = categoryQuery.trim();
  const canAddCategory =
    Boolean(categoryQueryTrimmed) &&
    !categoryOptions.some(
      (opt) => normalizeSearchText(opt.label) === normalizeSearchText(categoryQueryTrimmed),
    );

  const handleCategoryChange = (next: DocumentCategoryKey) => {
    setCategory(next);
    setCategoryQuery("");
    if (!issuer.trim() || DEFAULT_ISSUERS.has(issuer.trim())) {
      setIssuer(DEFAULT_ISSUER_BY_CATEGORY[next as BuiltInDocumentCategory] ?? "");
    }
  };

  const handleAddCategory = () => {
    if (!canAddCategory) return;
    setAddedCategories((prev) => [...prev, categoryQueryTrimmed]);
    handleCategoryChange(categoryQueryTrimmed);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!code.trim()) {
      setErrorText("Vui lòng nhập số hiệu văn bản (Ví dụ: 45/2019/QH14).");
      return;
    }
    if (!issuer.trim()) {
      setErrorText("Vui lòng chọn hoặc nhập cơ quan ban hành.");
      return;
    }
    if (issueDate && effectiveDate && effectiveDate < issueDate) {
      setErrorText("Ngày áp dụng (có hiệu lực) không được trước ngày ban hành.");
      return;
    }
    if (effectiveDate && expiredDate && expiredDate < effectiveDate) {
      setErrorText("Ngày hết hiệu lực không được trước ngày bắt đầu có hiệu lực.");
      return;
    }

    const tags = tagsStr
      .split(/[,;\n]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const primaryType: "PDF" | "DOCX" =
      attachedFiles.length > 0 && attachedFiles[0].type === "DOCX" ? "DOCX" : "PDF";
    const totalSizeStr =
      attachedFiles.length === 1
        ? attachedFiles[0].size
        : attachedFiles.length > 1
          ? `${attachedFiles.length} tệp`
          : "2.4 MB";

    const newDoc: LegalDocument = {
      id: `DOC-${Date.now().toString().slice(-4)}`,
      code: code.trim(),
      title: title.trim() || `${getCategoryLabel(category)} số ${code.trim()}`,
      category,
      issuer: issuer.trim(),
      signer: signer.trim() || undefined,
      gazetteNumber: gazetteNumber.trim() || undefined,
      gazetteDate: gazetteDate.trim() || undefined,
      field: field.trim() || undefined,
      issueDate,
      effectiveDate,
      expiredDate: expiredDate.trim() || undefined,
      status,
      scope: field.trim() || "Quản lý dự án",
      summary: "",
      fileType: primaryType,
      fileSize: totalSizeStr,
      downloads: 0,
      tags: tags.length > 0 ? tags : ["Pháp lý", "Quy chuẩn", "Ban QLDA"],
      files: attachedFiles.map((f) => ({
        id: f.id,
        name: f.name,
        size: f.size,
        type: f.type === "DOCX" ? "DOCX" : "PDF",
        rawFile: f.rawFile,
        url: f.url,
      })),
    };

    onSubmit(newDoc);
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={STANDARD_DRAWER_WIDTH}
      title={
        <div className="py-1">
          <div className="flex items-center gap-2 text-base font-bold text-slate-800">
            <SafetyCertificateOutlined className="text-[#DC2626]" />
            Thêm văn bản pháp luật
          </div>
          <div className="mt-0.5 text-xs font-normal text-slate-500">
            Bổ sung luật, nghị định, thông tư, nghị quyết, quyết định vào thư viện tra cứu
          </div>
        </div>
      }
      footer={
        <div className="flex w-full items-center justify-start gap-2.5 py-2">
          <Button
            intent="primary"
            scale="sm"
            onClick={handleSubmit}
            className="!border-[#DC2626] !bg-[#DC2626] px-5 text-xs font-semibold !text-white shadow-sm hover:!bg-[#B91C1C]"
          >
            Lưu vào thư viện
          </Button>
          <Button intent="outline" scale="sm" onClick={onClose} className="px-4 text-xs font-medium">
            Đóng
          </Button>
        </div>
      }
    >
      {/* Thông tin thời gian cập nhật vào hệ thống bên ngoài/trên form, nằm bên trái */}
      <div className="mb-3 flex items-center justify-between border-b border-slate-200/80 pb-2.5 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-medium text-slate-600">
          <ClockCircleOutlined className="text-slate-400" />
          <span>Ngày cập nhật hệ thống gần nhất:</span>
          <strong className="text-slate-800">{formatDateVi(todayIso())}</strong>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-slate-800">
        {errorText && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
            {errorText}
          </div>
        )}

        {/* 1. KHỐI: PHÂN LOẠI, SỐ HIỆU & CƠ QUAN BAN HÀNH */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4 flex flex-col gap-3">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <FileTextOutlined className="text-[#DC2626]" />
            Thông tin định danh & Phân loại văn bản
          </div>

          {/* Hàng 1: Tên văn bản / Trích yếu nội dung (đưa lên đầu) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên văn bản / Trích yếu nội dung <span className="text-rose-500">*</span>
            </label>
            <Input
              intent="clean"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Bộ luật Lao động năm 2019 về hoạt động lao động, tiền lương và chế độ nghỉ ngơi"
              className="w-full text-xs h-8"
            />
          </div>

          {/* Hàng 2: Loại văn bản & Số hiệu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Loại văn bản <span className="text-rose-500">*</span>
              </label>
              <Select
                aria-label="Loại văn bản"
                value={category}
                options={categoryOptions}
                onChange={(val) => handleCategoryChange(val)}
                className="w-full text-xs [&_.ant-select-selector]:!rounded-lg"
                popupRender={(menu) => (
                  <>
                    {menu}
                    <Divider style={{ margin: "6px 0" }} />
                    <div
                      className="flex items-center gap-2 px-2 pb-1.5"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <Input
                        intent="clean"
                        value={categoryQuery}
                        onChange={(e) => setCategoryQuery(e.target.value)}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCategory();
                          }
                        }}
                        placeholder="Nhập loại văn bản mới..."
                        className="h-7 flex-1 text-xs"
                      />
                      <Button
                        htmlType="button"
                        intent="primary"
                        scale="xs"
                        icon={<PlusOutlined />}
                        disabled={!canAddCategory}
                        onClick={handleAddCategory}
                        className="text-xs"
                      >
                        Thêm
                      </Button>
                    </div>
                  </>
                )}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số hiệu / Ký hiệu văn bản <span className="text-rose-500">*</span>
              </label>
              <Input
                intent="clean"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VD: 45/2019/QH14"
                className="w-full text-xs h-8"
              />
            </div>
          </div>

          {/* Hàng 3: Lĩnh vực áp dụng & Cơ quan ban hành */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lĩnh vực áp dụng
              </label>
              <Select
                aria-label="Lĩnh vực áp dụng"
                value={field}
                options={allFields.map((f) => ({ value: f, label: f }))}
                onChange={(val) => setField(val)}
                className="w-full text-xs [&_.ant-select-selector]:!rounded-lg"
                popupRender={(menu) => (
                  <>
                    {menu}
                    <Divider style={{ margin: "6px 0" }} />
                    <div
                      className="flex items-center gap-2 px-2 pb-1.5"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <Input
                        intent="clean"
                        value={fieldQuery}
                        onChange={(e) => setFieldQuery(e.target.value)}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddField();
                          }
                        }}
                        placeholder="Nhập lĩnh vực mới..."
                        className="h-7 flex-1 text-xs"
                      />
                      <Button
                        htmlType="button"
                        intent="primary"
                        scale="xs"
                        icon={<PlusOutlined />}
                        disabled={!fieldQuery.trim()}
                        onClick={handleAddField}
                        className="text-xs"
                      >
                        Thêm
                      </Button>
                    </div>
                  </>
                )}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cơ quan ban hành <span className="text-rose-500">*</span>
              </label>
              <Select
                aria-label="Cơ quan ban hành"
                placeholder="Chọn cơ quan ban hành..."
                value={issuer || undefined}
                options={filteredIssuerOptions}
                onChange={(val) => {
                  setIssuer(val);
                  setIssuerQuery("");
                }}
                notFoundContent={
                  <div className="py-1 text-xs text-slate-400">Chưa có cơ quan này trong danh sách.</div>
                }
                className="w-full text-xs [&_.ant-select-selector]:!rounded-lg"
                popupRender={(menu) => (
                  <>
                    {menu}
                    <Divider style={{ margin: "6px 0" }} />
                    <div
                      className="flex items-center gap-2 px-2 pb-1.5"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <Input
                        intent="clean"
                        value={issuerQuery}
                        onChange={(e) => setIssuerQuery(e.target.value)}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddIssuer();
                          }
                        }}
                        placeholder="Tìm hoặc nhập cơ quan mới..."
                        className="h-7 flex-1 text-xs"
                      />
                      <Button
                        htmlType="button"
                        intent="primary"
                        scale="xs"
                        icon={<PlusOutlined />}
                        disabled={!canAddIssuer}
                        onClick={handleAddIssuer}
                        className="text-xs"
                      >
                        Thêm
                      </Button>
                    </div>
                  </>
                )}
              />
            </div>
          </div>
        </div>

        {/* 2. KHỐI: CÔNG BÁO & NGƯỜI KÝ */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4 flex flex-col gap-3">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <BookOutlined className="text-[#DC2626]" />
            Thông tin công báo & Người ký
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số công báo
              </label>
              <Input
                intent="clean"
                value={gazetteNumber}
                onChange={(e) => setGazetteNumber(e.target.value)}
                placeholder="VD: 993&994-12/2019"
                className="w-full text-xs h-8"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ngày đăng công báo
              </label>
              <Input
                type="date"
                intent="clean"
                value={gazetteDate}
                onChange={(e) => setGazetteDate(e.target.value)}
                className="w-full text-xs h-8"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Người ký
              </label>
              <Input
                intent="clean"
                value={signer}
                onChange={(e) => setSigner(e.target.value)}
                placeholder="VD: Nguyễn Thị Kim Ngân"
                className="w-full text-xs h-8"
              />
            </div>
          </div>
        </div>

        {/* 3. KHỐI: MỐC THỜI GIAN & TÌNH TRẠNG HIỆU LỰC */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4 flex flex-col gap-3">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <CalendarOutlined className="text-[#DC2626]" />
            Mốc thời gian & Tình trạng hiệu lực
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ngày ban hành
              </label>
              <Input
                type="date"
                intent="clean"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full text-xs h-8"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ngày áp dụng (có hiệu lực)
              </label>
              <Input
                type="date"
                intent="clean"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full text-xs h-8"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 leading-tight">
                <span>Ngày hết hiệu lực</span>
                <span className="block text-[10px] font-normal text-slate-400 mt-0.5">
                  (để trống nếu chưa xác định)
                </span>
              </label>
              <Input
                type="date"
                intent="clean"
                value={expiredDate}
                onChange={(e) => setExpiredDate(e.target.value)}
                className="w-full text-xs h-8"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tình trạng hiệu lực
              </label>
              <Select
                aria-label="Tình trạng hiệu lực"
                value={status}
                onChange={(val) => setStatus(val as LegalDocumentStatus)}
                className="w-full text-xs [&_.ant-select-selector]:!rounded-lg"
                options={STATUS_SELECT_OPTIONS}
              />
            </div>
          </div>
        </div>

        {/* 4. KHỐI: TỪ KHÓA TRA CỨU & TỆP ĐÍNH KÈM */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4 flex flex-col gap-3">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <TagOutlined className="text-[#DC2626]" />
            Từ khóa tra cứu & Tệp tài liệu số hóa
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Từ khóa tra cứu (Tags - phân cách bằng dấu phẩy)
            </label>
            <Input
              intent="clean"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="VD: Quản lý dự án, Đấu thầu, Nghiệm thu, Lao động, Ban QLDA"
              className="w-full text-xs h-8"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Đính kèm tệp văn bản số hóa (PDF, DOCX)
            </label>
            <StandardFileUpload
              value={attachedFiles}
              onChange={setAttachedFiles}
              accept=".pdf,.docx,.doc"
            />
          </div>
        </div>
      </form>
    </Drawer>
  );
}
