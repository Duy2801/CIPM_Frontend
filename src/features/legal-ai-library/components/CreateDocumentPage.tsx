"use client";

import { useMemo, useState } from "react";
import { App } from "antd";
import {
  ArrowLeftOutlined,
  BookOutlined,
  CalendarOutlined,
  FileTextOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { Button, Input, Select, StandardFileUpload } from "@/components/ui";
import type { UploadedAttachment } from "@/components/ui/standard-file-upload";
import { normalizeSearchText } from "@/utils/search-text";
import {
  CATEGORY_DISPLAY_ORDER,
  COMMON_FIELDS,
  COMMON_ISSUERS,
  DEFAULT_ISSUER_BY_CATEGORY,
  STATUS_META,
  STATUS_ORDER,
  getCategoryLabel,
} from "../constants/legal-labels";
import { useCreateLegalDocument } from "../hooks/useLegalMutations";
import { useLegalDocuments } from "../hooks/useLegalQueries";
import type { BuiltInDocumentCategory, LegalDocument, LegalDocumentStatus } from "../types/legal-ai.types";
import { getCustomCategories } from "../utils/legal-document-filters";
import {
  buildLegalDocument,
  createEmptyLegalForm,
  validateLegalForm,
  type LegalDocumentFormValues,
} from "../utils/legal-document-form";
import { LegalFormField, LegalFormSection } from "./LegalFormSection";
import { SelectWithAddOption } from "@/components/workspace";
import { useCatalog } from "@/shared/catalogs";

const CREATABLE_CATEGORIES = CATEGORY_DISPLAY_ORDER.filter((cat) => cat !== "TEMPLATE");
const DEFAULT_ISSUERS = new Set(Object.values(DEFAULT_ISSUER_BY_CATEGORY));

const STATUS_SELECT_OPTIONS = STATUS_ORDER.map((value) => ({
  value,
  label: (
    <div className="flex items-center gap-2">
      <span className={`inline-block h-2 w-2 rounded-full ${STATUS_META[value].dotClass}`} />
      <span>{STATUS_META[value].label}</span>
    </div>
  ),
}));

function uniqueOptions(values: string[], toLabel: (value: string) => string = (v) => v) {
  const seen = new Set<string>();
  const options: { value: string; label: string }[] = [];
  for (const value of values) {
    const label = toLabel(value).trim();
    const key = normalizeSearchText(label);
    if (!label || seen.has(key)) continue;
    seen.add(key);
    options.push({ value: value.trim(), label });
  }
  return options;
}

const INPUT_CLASS = "w-full text-xs h-8";

interface CreateDocumentPageProps {
  onBack: () => void;
  onCreated: (document: LegalDocument) => void;
}

export default function CreateDocumentPage({ onBack, onCreated }: CreateDocumentPageProps) {
  const { modal } = App.useApp();
  const { data: documents = [] } = useLegalDocuments();
  const createDocument = useCreateLegalDocument();

  const [initialValues] = useState<LegalDocumentFormValues>(createEmptyLegalForm);
  const [values, setValues] = useState<LegalDocumentFormValues>(initialValues);
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [addedCategories, setAddedCategories] = useState<string[]>([]);
  const [addedIssuers, setAddedIssuers] = useState<string[]>([]);
  const [addedFields, setAddedFields] = useState<string[]>([]);
  const [errorText, setErrorText] = useState("");

  const update = (patch: Partial<LegalDocumentFormValues>) => setValues((prev) => ({ ...prev, ...patch }));

  const categoryCatalog = useCatalog("LEGAL_CATEGORY");
  const issuerCatalog = useCatalog("LEGAL_ISSUER");
  const fieldCatalog = useCatalog("LEGAL_FIELD");

  const categoryOptions = useMemo(
    () =>
      uniqueOptions(
        [
          ...CREATABLE_CATEGORIES,
          ...categoryCatalog.items
            .map((item) => (item.isSystem ? item.code.toUpperCase() : item.name))
            .filter((key) => key !== "TEMPLATE"),
          ...getCustomCategories(documents),
          ...addedCategories,
          values.category,
        ],
        getCategoryLabel,
      ),
    [categoryCatalog.items, documents, addedCategories, values.category],
  );
  const issuerOptions = useMemo(
    () =>
      uniqueOptions([
        ...COMMON_ISSUERS,
        ...issuerCatalog.items.map((item) => item.name),
        ...documents.map((doc) => doc.issuer),
        ...addedIssuers,
        values.issuer,
      ]),
    [issuerCatalog.items, documents, addedIssuers, values.issuer],
  );
  const fieldOptions = useMemo(
    () => uniqueOptions([...COMMON_FIELDS, ...fieldCatalog.items.map((item) => item.name), ...addedFields]),
    [fieldCatalog.items, addedFields],
  );

  const changeCategory = (category: string) => {
    const issuer = values.issuer.trim();
    update(
      !issuer || DEFAULT_ISSUERS.has(issuer)
        ? { category, issuer: DEFAULT_ISSUER_BY_CATEGORY[category as BuiltInDocumentCategory] ?? "" }
        : { category },
    );
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const error = validateLegalForm(values);
    setErrorText(error ?? "");
    if (error) return;

    const files = attachments.map((f) => ({
      id: f.id,
      name: f.name,
      size: f.size,
      type: f.type === "DOCX" ? ("DOCX" as const) : ("PDF" as const),
      rawFile: f.rawFile,
      url: f.url,
    }));
    const created = await createDocument.run(buildLegalDocument(values, files));
    if (created) onCreated(created);
  };

  const isDirty = attachments.length > 0 || JSON.stringify(values) !== JSON.stringify(initialValues);

  const handleBack = () => {
    if (!isDirty) {
      onBack();
      return;
    }
    modal.confirm({
      centered: true,
      width: 420,
      title: "Bỏ văn bản đang nhập?",
      content: <p className="m-0 text-xs text-slate-600">Thông tin đã nhập chưa được lưu sẽ bị bỏ.</p>,
      okText: "Bỏ thông tin",
      cancelText: "Tiếp tục nhập",
      okButtonProps: { danger: true },
      onOk: onBack,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          intent="outline"
          scale="compact"
          icon={<ArrowLeftOutlined />}
          aria-label="Quay lại danh sách văn bản"
          title="Quay lại"
          onClick={handleBack}
          className="h-9! w-9! shrink-0 p-0!"
        />
        <h1 className="m-0 min-w-0 flex-1 truncate text-base font-bold text-slate-900">Thêm văn bản pháp luật</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 text-slate-800 shadow-xs"
      >
        {errorText && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
            {errorText}
          </div>
        )}

        <LegalFormSection icon={<FileTextOutlined />} title="Thông tin định danh & Phân loại văn bản">
          <LegalFormField label="Tên văn bản / Trích yếu nội dung" required>
            <Input
              intent="clean"
              value={values.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="VD: Bộ luật Lao động năm 2019 về hoạt động lao động, tiền lương và chế độ nghỉ ngơi"
              className={INPUT_CLASS}
            />
          </LegalFormField>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <LegalFormField label="Loại văn bản" required>
              <SelectWithAddOption
                aria-label="Loại văn bản"
                value={values.category}
                options={categoryOptions}
                onChange={changeCategory}
                onAdd={(name) => {
                  setAddedCategories((prev) => [...prev, name]);
                  changeCategory(name);
                  void categoryCatalog.add(name);
                }}
                addPlaceholder="Nhập loại văn bản mới..."
              />
            </LegalFormField>
            <LegalFormField label="Số hiệu / Ký hiệu văn bản" required>
              <Input
                intent="clean"
                value={values.code}
                onChange={(e) => update({ code: e.target.value })}
                placeholder="VD: 45/2019/QH14"
                className={INPUT_CLASS}
              />
            </LegalFormField>
            <LegalFormField label="Lĩnh vực áp dụng">
              <SelectWithAddOption
                aria-label="Lĩnh vực áp dụng"
                value={values.field}
                options={fieldOptions}
                onChange={(field) => update({ field })}
                onAdd={(name) => {
                  setAddedFields((prev) => [...prev, name]);
                  update({ field: name });
                  void fieldCatalog.add(name);
                }}
                addPlaceholder="Nhập lĩnh vực mới..."
              />
            </LegalFormField>
            <LegalFormField label="Cơ quan ban hành" required>
              <SelectWithAddOption
                aria-label="Cơ quan ban hành"
                placeholder="Chọn cơ quan ban hành..."
                value={values.issuer || undefined}
                options={issuerOptions}
                filterByQuery
                onChange={(issuer) => update({ issuer })}
                onAdd={(name) => {
                  setAddedIssuers((prev) => [...prev, name]);
                  update({ issuer: name });
                  void issuerCatalog.add(name);
                }}
                addPlaceholder="Tìm hoặc nhập cơ quan mới..."
                notFoundContent={<div className="py-1 text-xs text-slate-400">Chưa có cơ quan này trong danh sách.</div>}
              />
            </LegalFormField>
          </div>
        </LegalFormSection>

        <LegalFormSection icon={<BookOutlined />} title="Thông tin công báo & Người ký">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <LegalFormField label="Số công báo">
              <Input
                intent="clean"
                value={values.gazetteNumber}
                onChange={(e) => update({ gazetteNumber: e.target.value })}
                placeholder="VD: 993&994-12/2019"
                className={INPUT_CLASS}
              />
            </LegalFormField>
            <LegalFormField label="Ngày đăng công báo">
              <Input
                type="date"
                intent="clean"
                value={values.gazetteDate}
                onChange={(e) => update({ gazetteDate: e.target.value })}
                className={INPUT_CLASS}
              />
            </LegalFormField>
            <LegalFormField label="Người ký">
              <Input
                intent="clean"
                value={values.signer}
                onChange={(e) => update({ signer: e.target.value })}
                placeholder="VD: Nguyễn Thị Kim Ngân"
                className={INPUT_CLASS}
              />
            </LegalFormField>
          </div>
        </LegalFormSection>

        <LegalFormSection icon={<CalendarOutlined />} title="Mốc thời gian & Tình trạng hiệu lực">
          <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <LegalFormField label="Ngày ban hành">
              <Input
                type="date"
                intent="clean"
                value={values.issueDate}
                onChange={(e) => update({ issueDate: e.target.value })}
                className={INPUT_CLASS}
              />
            </LegalFormField>
            <LegalFormField label="Ngày áp dụng (có hiệu lực)">
              <Input
                type="date"
                intent="clean"
                value={values.effectiveDate}
                onChange={(e) => update({ effectiveDate: e.target.value })}
                className={INPUT_CLASS}
              />
            </LegalFormField>
            <LegalFormField label="Ngày hết hiệu lực" hint="(để trống nếu chưa xác định)">
              <Input
                type="date"
                intent="clean"
                value={values.expiredDate}
                onChange={(e) => update({ expiredDate: e.target.value })}
                className={INPUT_CLASS}
              />
            </LegalFormField>
            <LegalFormField label="Tình trạng hiệu lực">
              <Select
                aria-label="Tình trạng hiệu lực"
                value={values.status}
                onChange={(status) => update({ status: status as LegalDocumentStatus })}
                className="w-full text-xs [&_.ant-select-selector]:!rounded-lg"
                options={STATUS_SELECT_OPTIONS}
              />
            </LegalFormField>
          </div>
        </LegalFormSection>

        <LegalFormSection icon={<TagOutlined />} title="Từ khóa tra cứu & Tệp tài liệu số hóa">
          <LegalFormField label="Từ khóa tra cứu (Tags - phân cách bằng dấu phẩy)">
            <Input
              intent="clean"
              value={values.tags}
              onChange={(e) => update({ tags: e.target.value })}
              placeholder="VD: Quản lý dự án, Đấu thầu, Nghiệm thu, Lao động, Ban QLDA"
              className={INPUT_CLASS}
            />
          </LegalFormField>
          <LegalFormField label="Đính kèm tệp văn bản số hóa (PDF, DOCX)">
            <StandardFileUpload value={attachments} onChange={setAttachments} accept=".pdf,.docx,.doc" />
          </LegalFormField>
        </LegalFormSection>

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <Button
            intent="primary"
            scale="sm"
            loading={createDocument.isPending}
            onClick={handleSubmit}
            className="h-9 !border-[#DC2626] !bg-[#DC2626] px-4 text-xs font-semibold !text-white hover:!bg-[#B91C1C]"
          >
            Lưu vào thư viện
          </Button>
        </div>
      </form>
    </div>
  );
}
