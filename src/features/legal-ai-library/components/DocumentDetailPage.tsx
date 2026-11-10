"use client";

import { useState } from "react";
import { App } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Segmented } from "@/components/ui";
import { formatDateVi } from "@/utils/date";
import { getCategoryLabel } from "../constants/legal-labels";
import { useCanManageLegalDocuments } from "../hooks/useLegalAccess";
import { useDocumentDraft } from "../hooks/useDocumentDraft";
import { useUpdateLegalDocument } from "../hooks/useLegalMutations";
import { useLegalDocument } from "../hooks/useLegalQueries";
import DocumentFilesSection from "./DocumentFilesSection";
import DocumentHistorySection from "./DocumentHistorySection";
import DocumentInfoTable from "./DocumentInfoTable";
import DocumentTagsSection from "./DocumentTagsSection";
import DocumentTitleCard from "./DocumentTitleCard";

type DetailTab = "info" | "history";

/**
 * Trang chi tiết một văn bản (cùng bố cục với trang chi tiết quy trình): đầu trang quay lại + số hiệu,
 * thẻ nội dung chia tab Thông tin (kèm tệp đính kèm) / Lịch sử. Các trường sửa bằng bút chì gom vào bản nháp,
 * bấm "Lưu thay đổi" mới ghi (xác nhận danh sách "cũ → mới" trước khi lưu).
 */
export default function DocumentDetailPage({ documentId, onBack }: { documentId: string; onBack: () => void }) {
  const { modal } = App.useApp();
  const { data: original } = useLegalDocument(documentId);
  const canManage = useCanManageLegalDocuments();
  const draft = useDocumentDraft(original);
  const updateDocument = useUpdateLegalDocument();
  const [tab, setTab] = useState<DetailTab>("info");

  const { document, changes, isDirty, isChanged } = draft;
  // Không có quyền sửa: các khối chỉ hiển thị
  const setFields = canManage ? draft.setFields : undefined;

  // Bấm "Lưu thay đổi": liệt kê đúng những gì sẽ đổi, đồng ý mới lưu
  const confirmSave = () => {
    if (!original) return;
    modal.confirm({
      centered: true,
      width: 480,
      title: "Xác nhận thay đổi văn bản",
      content: (
        <div className="space-y-2.5 text-xs">
          <p className="m-0 text-slate-600">
            Bạn có đồng ý cập nhật {changes.length} thông tin sau cho văn bản{" "}
            <strong className="text-slate-900">{original.code}</strong>?
          </p>
          <div className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
            {changes.map((c) => (
              <div key={c.field} className="flex flex-wrap items-baseline gap-x-1.5">
                <span className="font-semibold text-slate-700">{c.label}:</span>
                <span className="text-slate-500 line-through">{c.from || "Trống"}</span>
                <span className="text-slate-400">→</span>
                <span className="font-semibold text-[#DC2626]">{c.to || "Trống"}</span>
              </div>
            ))}
          </div>
        </div>
      ),
      okText: "Đồng ý lưu",
      cancelText: "Xem lại",
      okButtonProps: { className: "!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C]" },
      onOk: async () => {
        // Đợi dữ liệu mới về rồi mới bỏ bản nháp để không chớp lại giá trị cũ
        if (await updateDocument.run({ original, patch: draft.patch })) draft.discard();
      },
    });
  };

  // Rời trang khi còn thay đổi chưa lưu: hỏi trước để không mất dữ liệu
  const handleBack = () => {
    if (!isDirty) {
      onBack();
      return;
    }
    modal.confirm({
      centered: true,
      width: 420,
      title: "Bỏ các thay đổi chưa lưu?",
      content: (
        <p className="m-0 text-xs text-slate-600">Có {changes.length} thay đổi chưa lưu. Quay lại sẽ bỏ các thay đổi này.</p>
      ),
      okText: "Bỏ thay đổi",
      cancelText: "Tiếp tục sửa",
      okButtonProps: { danger: true },
      onOk: onBack,
    });
  };

  return (
    <div className="space-y-3">
      {/* Đầu trang: quay lại · số hiệu văn bản · lưu / hủy khi có thay đổi */}
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
        {/* Tên, số hiệu văn bản đã có trong phần thông tin bên dưới */}
        <h1 className="m-0 min-w-0 flex-1 truncate text-base font-bold text-slate-900">Chi tiết văn bản</h1>
        {isDirty && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
              {changes.length} thay đổi chưa lưu
            </span>
            <Button intent="outline" scale="sm" onClick={draft.discard} className="h-9 px-4 text-xs font-medium">
              Hủy thay đổi
            </Button>
            <Button
              intent="primary"
              scale="sm"
              loading={updateDocument.isPending}
              onClick={confirmSave}
              className="h-9 !border-[#DC2626] !bg-[#DC2626] px-4 text-xs font-semibold hover:!bg-[#B91C1C]"
            >
              Lưu thay đổi
            </Button>
          </div>
        )}
      </div>

      {original && document && (
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          {/* Tab nội dung · loại văn bản bên phải */}
          <div className="flex flex-wrap items-center gap-3">
            <Segmented<DetailTab>
              value={tab}
              onChange={setTab}
              options={[
                { value: "info", label: "Thông tin văn bản" },
                { value: "history", label: "Lịch sử thay đổi" },
              ]}
            />
            <div className="ml-auto text-right leading-tight">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Loại văn bản</div>
              <div className="text-[13px] font-semibold text-slate-700">{getCategoryLabel(document.category)}</div>
            </div>
          </div>

          {tab === "info" && (
            <div className="flex flex-col gap-4 text-slate-800">
              <DocumentTitleCard title={document.title} onChange={setFields && ((title) => setFields({ title }))} />
              <DocumentInfoTable document={document} isChanged={isChanged} onChange={setFields} />
              <DocumentTagsSection
                tags={document.tags}
                changed={isChanged("tags")}
                onChange={setFields && ((tags) => setFields({ tags }))}
              />
              {/* Tệp đính kèm nằm ngay dưới thông tin văn bản */}
              <DocumentFilesSection
                document={document}
                changed={isChanged("files")}
                onChange={setFields && ((files) => setFields({ files }))}
              />
            </div>
          )}

          {tab === "history" && <DocumentHistorySection document={original} />}

          {original.updatedAt && (
            <p className="m-0 border-t border-slate-100 pt-2.5 text-right text-xs text-slate-500">
              Cập nhật lần cuối <strong className="text-slate-700">{formatDateVi(original.updatedAt)}</strong>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
