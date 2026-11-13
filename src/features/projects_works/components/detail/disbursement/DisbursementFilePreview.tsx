"use client";

import { FilePreviewModal } from "@/components/ui";
import { formatMoneyString } from "@/utils/format-money";
import { formatDateVi } from "@/utils/date";
import { attachmentUrl, type DisbursementAttachment, type DisbursementEntry } from "@/shared/projects_works/utils/project-disbursement";

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
  return (
    <FilePreviewModal
      fileName={file.name}
      url={attachmentUrl(file)}
      fallback={<SampleVoucher entry={entry} projectName={projectName} />}
      onClose={onClose}
    />
  );
}

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
