"use client";

import { CloseOutlined, DownloadOutlined } from "@ant-design/icons";
import { Modal } from "@/components/ui";
import { formatMoneyString } from "@/utils/format-money";
import { formatDateVi } from "@/utils/date";
import { attachmentUrl, type DisbursementAttachment, type DisbursementEntry } from "../../utils/project-disbursement";

const isImage = (name: string) => /\.(png|jpe?g|webp|gif)$/i.test(name);
const isPdf = (name: string) => /\.pdf$/i.test(name);

/**
 * Xem tệp chứng từ của một đợt giải ngân: ảnh / PDF hiển thị trực tiếp, loại khác thì tải về.
 * Tệp demo (không có nội dung gốc) dựng bản xem trước từ thông tin đợt.
 */
export default function DisbursementFilePreview({
  file,
  entry,
  projectName,
  onClose,
}: {
  file: DisbursementAttachment;
  entry: DisbursementEntry;
  projectName: string;
  onClose: () => void;
}) {
  const url = attachmentUrl(file);

  return (
    <Modal
      open
      onCancel={onClose}
      footer={null}
      centered
      closable={false}
      width="min(880px, calc(100vw - 24px))"
      destroyOnHidden
      styles={{
        container: { background: "transparent", boxShadow: "none", padding: 0 },
        body: { padding: 0 },
      }}
    >
      <div className="flex h-[calc(100dvh-48px)] flex-col overflow-hidden rounded-md bg-white shadow-2xl">
        <div className="flex shrink-0 items-center gap-1 border-b border-slate-100 py-1.5 pl-4 pr-2">
          <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-600" title={file.name}>
            {file.name}
          </span>
          {url && (
            <a
              href={url}
              download={file.name}
              title="Tải về"
              aria-label="Tải về"
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-[#DC2626]"
            >
              <DownloadOutlined />
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng xem tệp"
            title="Đóng"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-base text-slate-500 hover:bg-slate-100 hover:text-[#DC2626]"
          >
            <CloseOutlined />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-100">
          {url && isPdf(file.name) ? (
            <iframe title={file.name} src={url} className="h-full w-full border-0 bg-white" />
          ) : url && isImage(file.name) ? (
            <div className="flex min-h-full items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- ảnh tạm (data / blob URL) */}
              <img src={url} alt={file.name} className="max-h-full max-w-full rounded shadow" />
            </div>
          ) : url ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-sm text-slate-500">
              Không xem trực tiếp được loại tệp này.
              <a
                href={url}
                download={file.name}
                className="rounded-md bg-[#DC2626] px-4 py-2 text-xs font-semibold text-white hover:bg-[#B91C1C]"
              >
                Tải về để xem
              </a>
            </div>
          ) : (
            <SampleVoucher entry={entry} projectName={projectName} />
          )}
        </div>
      </div>
    </Modal>
  );
}

/** Bản xem trước dựng từ thông tin đợt (tệp demo không có nội dung gốc) */
function SampleVoucher({ entry, projectName }: { entry: DisbursementEntry; projectName: string }) {
  const withdraw = entry.kind === "withdraw";
  const rows: [string, string][] = [
    ["Dự án", projectName],
    ["Đầu mục", entry.category],
    [withdraw ? "Lý do thu hồi" : "Nội dung thanh toán", entry.content || "—"],
    ["Số tiền", `${withdraw ? "−" : ""}${formatMoneyString(entry.amount)} VNĐ`],
    ["Ngày", formatDateVi(entry.date)],
    ["Người lập", entry.createdBy],
  ];
  return (
    <div className="mx-auto my-6 w-[min(640px,calc(100%-32px))] bg-white px-10 py-12 font-serif text-[13px] leading-relaxed text-slate-800 shadow">
      <p className="m-0 text-center text-xs font-bold uppercase">Cộng hòa xã hội chủ nghĩa Việt Nam</p>
      <p className="m-0 text-center text-xs font-semibold">Độc lập – Tự do – Hạnh phúc</p>
      <h2 className="mt-8 mb-6 text-center text-lg font-bold uppercase">
        {withdraw ? "Quyết định thu hồi vốn" : "Ủy nhiệm chi"}
      </h2>
      <table className="w-full border-collapse">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="align-top">
              <td className="w-40 py-1.5 pr-3 font-semibold">{k}:</td>
              <td className="py-1.5">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-10 mb-0 text-center text-[11px] italic text-slate-400">
        Bản xem trước dựng từ dữ liệu demo — chưa có tệp gốc.
      </p>
    </div>
  );
}
