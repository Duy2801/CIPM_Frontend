"use client";

import { DownloadOutlined, FilePdfOutlined, FileWordOutlined } from "@ant-design/icons";
import { App } from "antd";
import type { DetailedLegalDocument } from "../../types/legal-viewer.types";

interface TabDownloadProps {
  document: DetailedLegalDocument;
}

export default function TabDownload({ document: doc }: TabDownloadProps) {
  const { message } = App.useApp();
  const triggerDownload = (fileName: string, type: "PDF" | "DOCX") => {
    message.success(`Đang tải tệp: ${fileName} (${type})...`);
    // Tạo giả lập tải tệp
    const blob = new Blob(
      [
        `VĂN BẢN PHÁP LUẬT: ${doc.title}\nSố hiệu: ${doc.code}\nCơ quan: ${doc.issuer}\nHiệu lực: ${doc.effectiveDate}\n\nNội dung văn bản được tải từ Thư viện Pháp lý CIPM.`,
      ],
      { type: "text/plain;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${fileName}.${type === "PDF" ? "pdf" : "docx"}`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Tiêu đề văn bản */}
      <div className="border-b border-slate-200 pb-3">
        <h2 className="m-0 text-base font-bold text-slate-900 leading-snug">
          {doc.title}
        </h2>
        <p className="m-0 mt-1 text-xs text-slate-500">
          Tải văn bản gốc có dấu đỏ, bản Word chỉnh sửa và bản dịch đối chiếu quốc tế
        </p>
      </div>

      {/* 2 cột tải về: Cột 1 Tiếng Việt - Cột 2 Tiếng Anh */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ================= CỘT 1: VĂN BẢN TIẾNG VIỆT ================= */}
        <div className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-2xs">
          <h3 className="m-0 text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2.5">
            VĂN BẢN TIẾNG VIỆT
          </h3>

          <div className="space-y-3">
            {/* PDF gốc */}
            <div className="flex items-center justify-between rounded-md border border-slate-200/80 bg-slate-50/50 p-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded bg-rose-100 text-rose-700">
                  <FilePdfOutlined className="text-xl" />
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    {doc.shortTitle} (Bản PDF)
                  </div>
                  <div className="text-[11px] text-slate-400">PDF có dấu đỏ · 3.2 MB</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => triggerDownload(`${doc.shortTitle}_Ban_PDF`, "PDF")}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs"
              >
                <DownloadOutlined /> Tải về
              </button>
            </div>

            {/* Word DOCX */}
            <div className="flex items-center justify-between rounded-md border border-slate-200/80 bg-slate-50/50 p-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded bg-blue-100 text-blue-700">
                  <FileWordOutlined className="text-xl" />
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    {doc.shortTitle} (Bản Word)
                  </div>
                  <div className="text-[11px] text-slate-400">DOCX chỉnh sửa · 1.1 MB</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => triggerDownload(`${doc.shortTitle}_Ban_Word`, "DOCX")}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs"
              >
                <DownloadOutlined /> Tải về
              </button>
            </div>
          </div>

          {/* Nhóm phụ: Tải nội dung hợp nhất */}
          <div className="pt-2 space-y-3">
            <h4 className="m-0 text-xs font-bold uppercase tracking-wider text-slate-700">
              Tải nội dung hợp nhất
            </h4>

            {/* Hợp nhất PDF */}
            <div className="flex items-center justify-between rounded-md border border-slate-200/80 bg-slate-50/50 p-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded bg-rose-100 text-rose-700">
                  <FilePdfOutlined className="text-xl" />
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Nội dung hợp nhất {doc.shortTitle} (Bản PDF)
                  </div>
                  <div className="text-[11px] text-slate-400">Tích hợp sửa đổi 2025/2026 · 4.5 MB</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => triggerDownload(`Hop_Nhat_${doc.shortTitle}_PDF`, "PDF")}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs"
              >
                <DownloadOutlined /> Tải về
              </button>
            </div>

            {/* Hợp nhất Word */}
            <div className="flex items-center justify-between rounded-md border border-slate-200/80 bg-slate-50/50 p-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded bg-blue-100 text-blue-700">
                  <FileWordOutlined className="text-xl" />
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Nội dung hợp nhất {doc.shortTitle} (Bản Word)
                  </div>
                  <div className="text-[11px] text-slate-400">DOCX hoàn chỉnh · 1.8 MB</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => triggerDownload(`Hop_Nhat_${doc.shortTitle}_Word`, "DOCX")}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs"
              >
                <DownloadOutlined /> Tải về
              </button>
            </div>
          </div>
        </div>

        {/* ================= CỘT 2: VĂN BẢN TIẾNG ANH ================= */}
        <div className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-2xs">
          <h3 className="m-0 text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2.5">
            VĂN BẢN TIẾNG ANH
          </h3>

          {/* Nhóm phụ 1: Công báo tiếng Anh */}
          <div className="space-y-3">
            <h4 className="m-0 text-xs font-bold text-slate-700">Công báo tiếng Anh</h4>

            <div className="flex items-center justify-between rounded-md border border-slate-200/80 bg-slate-50/50 p-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded bg-rose-100 text-rose-700">
                  <FilePdfOutlined className="text-xl" />
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Labor Code, Law No. {doc.code} (Bản PDF)
                  </div>
                  <div className="text-[11px] text-slate-400">Official Gazette · 3.8 MB</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => triggerDownload(`Gazette_${doc.code.replace(/[\/\\?%*:|"<>]/g, "_")}_EN`, "PDF")}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs"
              >
                <DownloadOutlined /> Tải về
              </button>
            </div>

            <div className="flex items-center justify-between rounded-md border border-slate-200/80 bg-slate-50/50 p-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded bg-blue-100 text-blue-700">
                  <FileWordOutlined className="text-xl" />
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Labor Code, Law No. {doc.code} (Bản Word)
                  </div>
                  <div className="text-[11px] text-slate-400">DOCX editable · 1.4 MB</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => triggerDownload(`Gazette_${doc.code.replace(/[\/\\?%*:|"<>]/g, "_")}_EN`, "DOCX")}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs"
              >
                <DownloadOutlined /> Tải về
              </button>
            </div>
          </div>

          {/* Nhóm phụ 2: Bản dịch chuẩn */}
          <div className="pt-2 space-y-3">
            <h4 className="m-0 text-xs font-bold text-slate-700">Bản dịch CIPM Legal</h4>

            <div className="flex items-center justify-between rounded-md border border-slate-200/80 bg-slate-50/50 p-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded bg-rose-100 text-rose-700">
                  <FilePdfOutlined className="text-xl" />
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Labor Code Translation (Bản PDF)
                  </div>
                  <div className="text-[11px] text-slate-400">Standard Translation · 2.9 MB</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => triggerDownload(`Translation_${doc.code.replace(/[\/\\?%*:|"<>]/g, "_")}`, "PDF")}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs"
              >
                <DownloadOutlined /> Tải về
              </button>
            </div>

            <div className="flex items-center justify-between rounded-md border border-slate-200/80 bg-slate-50/50 p-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded bg-blue-100 text-blue-700">
                  <FileWordOutlined className="text-xl" />
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Labor Code Translation (Bản Word)
                  </div>
                  <div className="text-[11px] text-slate-400">Word Translation · 1.2 MB</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => triggerDownload(`Translation_${doc.code.replace(/[\/\\?%*:|"<>]/g, "_")}`, "DOCX")}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs"
              >
                <DownloadOutlined /> Tải về
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lưu ý chân trang chuẩn */}
      <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3.5 text-xs text-slate-600">
        <p className="m-0 leading-relaxed italic">
          * <strong>Lưu ý:</strong> Để đọc và chỉnh sửa các văn bản tải về từ Thư viện Pháp lý CIPM, bạn cần cài đặt phần mềm đọc tệp Word (Microsoft Word, LibreOffice, WPS Office) và phần mềm đọc tệp PDF (Adobe Acrobat Reader, Foxit Reader, trình duyệt web).
        </p>
      </div>
    </div>
  );
}
