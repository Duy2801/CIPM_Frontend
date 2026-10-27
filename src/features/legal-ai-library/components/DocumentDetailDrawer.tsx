"use client";

import { App } from "antd";
import { ClockCircleOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Button, Drawer } from "@/components/ui";
import { formatDateVi } from "@/utils/date";
import { useCanManageLegalDocuments } from "../hooks/useLegalAccess";
import { useDocumentDraft } from "../hooks/useDocumentDraft";
import { useUpdateLegalDocument } from "../hooks/useLegalMutations";
import { useLegalDocument } from "../hooks/useLegalQueries";
import DocumentFilesSection from "./DocumentFilesSection";
import DocumentHistorySection from "./DocumentHistorySection";
import DocumentInfoTable from "./DocumentInfoTable";
import DocumentTagsSection from "./DocumentTagsSection";
import DocumentTitleCard from "./DocumentTitleCard";

/**
 * Drawer xem / sửa một văn bản. Chỉ cần mã văn bản: tự tải dữ liệu, các trường sửa bằng bút chì
 * gom vào bản nháp, bấm "Lưu thay đổi" mới ghi (xác nhận danh sách "cũ → mới" trước khi lưu).
 */
export default function DocumentDetailDrawer({ documentId, onClose }: { documentId: string; onClose: () => void }) {
  const { modal } = App.useApp();
  const { data: original } = useLegalDocument(documentId);
  const canManage = useCanManageLegalDocuments();
  const draft = useDocumentDraft(original);
  const updateDocument = useUpdateLegalDocument();

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

  // Đóng khi còn thay đổi chưa lưu: hỏi trước để không mất dữ liệu
  const handleClose = () => {
    if (!isDirty) {
      onClose();
      return;
    }
    modal.confirm({
      centered: true,
      width: 420,
      title: "Bỏ các thay đổi chưa lưu?",
      content: (
        <p className="m-0 text-xs text-slate-600">Có {changes.length} thay đổi chưa lưu. Đóng lại sẽ bỏ các thay đổi này.</p>
      ),
      okText: "Bỏ thay đổi",
      cancelText: "Tiếp tục sửa",
      okButtonProps: { danger: true },
      onOk: onClose,
    });
  };

  return (
    <Drawer
      open
      onClose={handleClose}
      width="min(760px, 100vw)"
      title={
        <div className="py-1">
          <div className="flex items-center gap-2 text-base font-bold text-slate-800">
            <SafetyCertificateOutlined className="text-[#DC2626]" />
            <span>Cập nhật văn bản pháp luật</span>
          </div>
          <div className="mt-0.5 text-xs font-normal text-slate-500">
            Chỉnh sửa số hiệu, cơ quan ban hành, hiệu lực pháp lý và tệp tài liệu số hóa
          </div>
        </div>
      }
      footer={
        // Có thay đổi chưa lưu: "Lưu thay đổi" · "Hủy thay đổi" thay chỗ nút Đóng; lưu/hủy xong thì Đóng hiện lại
        <div className="flex flex-wrap items-center gap-2.5 py-1">
          {isDirty ? (
            <>
              <Button
                intent="primary"
                scale="sm"
                loading={updateDocument.isPending}
                onClick={confirmSave}
                className="!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C] px-5 text-xs font-semibold"
              >
                Lưu thay đổi
              </Button>
              <Button intent="outline" scale="sm" onClick={draft.discard} className="px-5 text-xs font-medium">
                Hủy thay đổi
              </Button>
            </>
          ) : (
            <Button intent="outline" scale="sm" onClick={handleClose} className="px-5 text-xs font-medium">
              Đóng
            </Button>
          )}
        </div>
      }
    >
      {original && document && (
        <div className="flex flex-col gap-4 text-slate-800">
          <DocumentTitleCard title={document.title} onChange={setFields && ((title) => setFields({ title }))} />

          <DocumentInfoTable document={document} isChanged={isChanged} onChange={setFields} />

          <DocumentTagsSection
            tags={document.tags}
            changed={isChanged("tags")}
            onChange={setFields && ((tags) => setFields({ tags }))}
          />

          <DocumentFilesSection
            document={document}
            changed={isChanged("files")}
            onChange={setFields && ((files) => setFields({ files }))}
          />

          <DocumentHistorySection document={original} />

          {/* Số thay đổi chưa lưu (trái) · ngày cập nhật cuối cùng (phải) */}
          <div className="flex items-center justify-between border-t border-slate-200/80 pt-2.5 text-xs text-slate-500">
            {isDirty ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                Có {changes.length} thay đổi chưa lưu
              </span>
            ) : (
              <div />
            )}
            {original.updatedAt && (
              <div className="flex items-center gap-1.5 font-medium text-slate-600 ml-auto">
                <ClockCircleOutlined className="text-slate-400" />
                <span>Ngày cập nhật cuối cùng:</span>
                <strong className="text-slate-800">{formatDateVi(original.updatedAt)}</strong>
              </div>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
