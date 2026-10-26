"use client";

import { AlertOutlined, BranchesOutlined, CheckCircleOutlined } from "@ant-design/icons";
import type { DetailedLegalDocument } from "../../types/legal-viewer.types";

interface TabConsolidatedProps {
  document: DetailedLegalDocument;
}

export default function TabConsolidated({ document: doc }: TabConsolidatedProps) {
  return (
    <div className="space-y-4">
      {/* Thông tin văn bản hợp nhất */}
      <div className="rounded-lg border border-indigo-200 bg-indigo-50/70 p-4 text-xs text-indigo-950 space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm text-indigo-900">
          <BranchesOutlined className="text-base text-indigo-700" />
          <span>Văn bản hợp nhất kỹ thuật số CIPM Legal</span>
        </div>
        <p className="m-0 leading-relaxed text-slate-700">
          Nội dung hợp nhất phản ánh chính xác các điều, khoản đã được sửa đổi, bổ sung bởi các luật và nghị định ban hành sau. Người áp dụng pháp luật không cần tra cứu đối chiếu thủ công qua nhiều văn bản rời rạc.
        </p>
        <div className="text-[11px] font-semibold text-indigo-800">
          {doc.consolidatedNote}
        </div>
      </div>

      {/* Chi tiết nội dung hợp nhất */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 sm:p-10 shadow-xs max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2 border-b border-slate-100 pb-6">
          <div className="text-xs font-bold uppercase text-slate-700">
            VĂN PHÒNG QUỐC HỘI - CƠ QUAN HỢP NHẤT
          </div>
          <h1 className="m-0 text-base sm:text-lg font-black uppercase text-slate-900">
            VĂN BẢN HỢP NHẤT {doc.shortTitle.toUpperCase()}
          </h1>
          <p className="m-0 text-xs text-slate-500 italic">
            (Hợp nhất Bộ luật số {doc.code} và các Luật sửa đổi số {doc.amendedByCodes.join(", ")})
          </p>
        </div>

        {/* Mẫu điều khoản hợp nhất với ghi chú nguồn sửa đổi */}
        <div className="space-y-6 text-xs sm:text-[13px] leading-relaxed text-slate-800">
          <div className="rounded-md border border-slate-200 bg-slate-50/50 p-4 space-y-2">
            <div className="font-bold text-slate-900">
              Điều 20. Loại hợp đồng lao động{" "}
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 ml-2">
                [Đã hợp nhất quy định mới]
              </span>
            </div>
            <p className="m-0 text-justify">
              1. Hợp đồng lao động phải được giao kết theo một trong các loại sau đây:
            </p>
            <p className="m-0 pl-3">
              a) Hợp đồng lao động không xác định thời hạn là hợp đồng mà trong đó hai bên không xác định thời hạn, thời điểm chấm dứt hiệu lực của hợp đồng;
            </p>
            <p className="m-0 pl-3 bg-amber-50/80 p-2 rounded border border-amber-200">
              b) Hợp đồng lao động xác định thời hạn (thời hạn tối đa 36 tháng). Đối với lao động công nghệ số, dự án trọng điểm công nghệ cao, hai bên được thỏa thuận giao kết hợp đồng linh hoạt theo quy định tại Luật Công nghiệp công nghệ số số 71/2025/QH15.
              <span className="block mt-1 text-[11px] font-semibold text-amber-900 italic">
                *(Điểm b này được bổ sung theo quy định tại Điều 42 Luật số 71/2025/QH15, có hiệu lực từ ngày 01/01/2026)*
              </span>
            </p>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50/50 p-4 space-y-2">
            <div className="font-bold text-slate-900">
              Điều 169. Tuổi nghỉ hưu{" "}
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 ml-2">
                [Lộ trình điều chỉnh theo Luật BHXH 41/2024/QH15]
              </span>
            </div>
            <p className="m-0 text-justify">
              Người lao động bảo đảm điều kiện về thời gian đóng bảo hiểm xã hội theo quy định của pháp luật về bảo hiểm xã hội được hưởng lương hưu khi đủ tuổi nghỉ hưu.
            </p>
            <p className="m-0 text-[11px] text-slate-600 italic">
              *(Cập nhật theo Điều 64 Luật Bảo hiểm xã hội số 41/2024/QH15, áp dụng từ 01/07/2025)*
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
