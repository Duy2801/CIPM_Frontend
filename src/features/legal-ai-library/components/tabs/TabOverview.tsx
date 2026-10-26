"use client";

import { useState } from "react";
import {
  FilePdfOutlined,
  FileWordOutlined,
  InfoCircleOutlined,
  RightOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Tooltip } from "@/components/ui";
import type { DetailedLegalDocument } from "../../types/legal-viewer.types";

interface TabOverviewProps {
  document: DetailedLegalDocument;
  onNavigateTab: (tabKey: any) => void;
  onSelectKeyword: (kw: string) => void;
}

export default function TabOverview({
  document: doc,
  onNavigateTab,
  onSelectKeyword,
}: TabOverviewProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Cột chính bên trái: 8 hoặc 9 cột */}
      <div className="lg:col-span-8 xl:col-span-9 space-y-6">
        {/* Thông báo sửa đổi bổ sung */}
        <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-amber-950">Văn bản này được sửa đổi, bổ sung bởi:</span>
            {doc.amendedByCodes.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => onNavigateTab("validity")}
                className="font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer bg-white px-2 py-0.5 rounded border border-amber-300"
              >
                {code}
              </button>
            ))}
          </div>
          <div className="mt-2 text-slate-600">
            Xem chi tiết <strong>{doc.shortTitle}</strong> có hiệu lực kể từ ngày{" "}
            <strong>{doc.effectiveDate}</strong>.
          </div>
        </div>

        {/* Bảng thuộc tính định danh văn bản 2 cột chuẩn */}
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Thuộc tính văn bản quy phạm pháp luật
            </span>
            <span className="text-[11px] text-slate-500">{doc.updatedAtText}</span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="w-1/4 p-3 font-semibold text-slate-600 bg-slate-50/40">
                  Cơ quan ban hành:
                </td>
                <td className="w-1/4 p-3 text-slate-900 font-medium">{doc.issuer}</td>
                <td className="w-1/4 p-3 font-semibold text-slate-600 bg-slate-50/40">
                  <div className="flex items-center gap-1">
                    <span>Số công báo:</span>
                    <Tooltip title="Số đăng ký công báo nước Cộng hòa Xã hội Chủ nghĩa Việt Nam">
                      <InfoCircleOutlined className="text-slate-400 cursor-help" />
                    </Tooltip>
                  </div>
                </td>
                <td className="w-1/4 p-3 text-slate-900 font-medium">{doc.gazetteNumber}</td>
              </tr>

              <tr className="border-b border-slate-100">
                <td className="p-3 font-semibold text-slate-600 bg-slate-50/40">Số hiệu:</td>
                <td className="p-3 text-slate-900 font-bold">{doc.code}</td>
                <td className="p-3 font-semibold text-slate-600 bg-slate-50/40">
                  Ngày đăng công báo:
                </td>
                <td className="p-3 text-slate-900 font-medium">{doc.gazetteDate}</td>
              </tr>

              <tr className="border-b border-slate-100">
                <td className="p-3 font-semibold text-slate-600 bg-slate-50/40">Loại văn bản:</td>
                <td className="p-3 text-slate-900 font-medium">{doc.categoryName}</td>
                <td className="p-3 font-semibold text-slate-600 bg-slate-50/40">Người ký:</td>
                <td className="p-3 text-slate-900 font-medium">{doc.signer}</td>
              </tr>

              <tr className="border-b border-slate-100">
                <td className="p-3 font-semibold text-slate-600 bg-slate-50/40">
                  <div className="flex items-center gap-1">
                    <span>Ngày ban hành:</span>
                    <Tooltip title="Ngày ký ban hành văn bản chính thức">
                      <InfoCircleOutlined className="text-slate-400 cursor-help" />
                    </Tooltip>
                  </div>
                </td>
                <td className="p-3 text-slate-900 font-medium">{doc.issueDate}</td>
                <td className="p-3 font-semibold text-slate-600 bg-slate-50/40">
                  <div className="flex items-center gap-1">
                    <span>Ngày hết hiệu lực:</span>
                    <Tooltip title="Ngày văn bản hết hiệu lực thi hành">
                      <InfoCircleOutlined className="text-slate-400 cursor-help" />
                    </Tooltip>
                  </div>
                </td>
                <td className="p-3 text-slate-500 italic">{doc.expiredDate}</td>
              </tr>

              <tr>
                <td className="p-3 font-semibold text-slate-600 bg-slate-50/40">
                  <div className="flex items-center gap-1">
                    <span>Ngày áp dụng:</span>
                    <Tooltip title="Thời điểm bắt đầu có hiệu lực thi hành">
                      <InfoCircleOutlined className="text-slate-400 cursor-help" />
                    </Tooltip>
                  </div>
                </td>
                <td className="p-3 text-slate-900 font-bold">{doc.effectiveDate}</td>
                <td className="p-3 font-semibold text-slate-600 bg-slate-50/40">
                  <div className="flex items-center gap-1">
                    <span>Tình trạng hiệu lực:</span>
                    <Tooltip title="Nhấp tab Hiệu lực để xem các văn bản sửa đổi">
                      <InfoCircleOutlined className="text-slate-400 cursor-help" />
                    </Tooltip>
                  </div>
                </td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 font-bold text-amber-700 border border-amber-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {doc.statusText}
                  </span>
                </td>
              </tr>

              <tr className="border-t border-slate-100 bg-slate-50/20">
                <td className="p-3 font-semibold text-slate-600 bg-slate-50/40">Lĩnh vực:</td>
                <td colSpan={3} className="p-3 text-slate-900 font-medium">
                  {doc.field}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tóm tắt & Cấu trúc văn bản */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
          <h3 className="m-0 text-sm font-bold uppercase tracking-wide text-slate-800 border-b border-slate-100 pb-2">
            TÓM TẮT {doc.shortTitle.toUpperCase()}
          </h3>

          <div>
            <h4 className="m-0 text-xs font-bold text-slate-900">
              Cấu trúc của {doc.shortTitle}
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-slate-700">
              <strong>{doc.shortTitle}</strong> gồm <strong>{doc.totalChapters} Chương</strong> và{" "}
              <strong>{doc.totalArticles} Điều</strong>. Danh mục các chương trọng tâm:
            </p>

            <ul className="mt-2 space-y-1 pl-4 text-xs text-slate-600 list-disc">
              <li>Chương I: Những quy định chung</li>
              <li>Chương II: Việc làm, tuyển dụng và quản lý lao động</li>
              <li>Chương III: Hợp đồng lao động</li>
              <li>Chương IV: Giáo dục nghề nghiệp và phát triển kỹ năng nghề</li>
              <li>Chương V: Đối thoại nơi làm việc, thương lượng tập thể, thỏa ước lao động tập thể</li>
              <li>Chương VI: Tiền lương</li>
              <li>Chương VII: Thời giờ làm việc, nghỉ ngơi...</li>
            </ul>
          </div>

          <div className="pt-2">
            <h4 className="m-0 text-xs font-bold text-slate-900">Điểm mới & tác động trọng tâm:</h4>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {doc.summaryHighlights.map((hl, idx) => (
                <div
                  key={idx}
                  className="rounded-md border border-slate-100 bg-slate-50/80 p-2.5 text-xs text-slate-700 flex items-start gap-2"
                >
                  <span className="text-[#DC2626] font-bold">✓</span>
                  <span>{hl}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tải văn bản nhanh */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-3">
          <h4 className="m-0 text-xs font-bold uppercase tracking-wider text-slate-700">
            TẢI {doc.shortTitle.toUpperCase()}
          </h4>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => onNavigateTab("download")}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-rose-200 bg-rose-50/70 hover:bg-rose-100 px-4 py-2.5 text-xs font-semibold text-rose-800 transition-colors"
            >
              <FilePdfOutlined className="text-base text-rose-600" />
              <span>{doc.shortTitle} PDF (Bản có dấu đỏ)</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab("download")}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100 px-4 py-2.5 text-xs font-semibold text-blue-800 transition-colors"
            >
              <FileWordOutlined className="text-base text-blue-600" />
              <span>{doc.shortTitle} DOC (Bản Word)</span>
            </button>
          </div>
        </div>

        {/* Tác giả & Từ khóa liên quan */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <UserOutlined className="text-slate-400" />
              <span>Biên soạn & Kiểm duyệt:</span>
              <span className="font-semibold text-slate-800">{doc.authors.join(" | ")}</span>
            </div>
            <span className="text-[11px] text-slate-400">CIPM Legal Editorial</span>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-700 block mb-2">Từ khóa liên quan:</span>
            <div className="flex flex-wrap gap-1.5">
              {doc.keywords.map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => onSelectKeyword(kw)}
                  className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 px-3 py-1 text-xs transition-colors cursor-pointer border border-slate-200/80"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Câu hỏi thường gặp */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-3">
          <h3 className="m-0 text-sm font-bold uppercase tracking-wide text-slate-800 border-b border-slate-100 pb-2">
            CÂU HỎI THƯỜNG GẶP?
          </h3>
          <div className="divide-y divide-slate-100">
            {doc.faqs.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div key={idx} className="py-2.5">
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-800 hover:text-[#DC2626] cursor-pointer gap-2 py-1"
                  >
                    <span>{faq.question}</span>
                    <RightOutlined
                      className={`text-[10px] text-slate-400 transition-transform ${
                        isOpen ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600 pl-2 border-l-2 border-[#DC2626] bg-slate-50/50 p-2 rounded-r">
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cột phụ bên phải: 4 hoặc 3 cột */}
      <div className="lg:col-span-4 xl:col-span-3 space-y-4">
        {/* Widget 1: Video chính sách mới */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          <h4 className="m-0 text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
            Chính sách nổi bật
          </h4>
          <ul className="m-0 list-none p-0 divide-y divide-slate-100 text-xs">
            <li className="py-2">
              <a href="#" className="font-semibold text-slate-800 hover:text-[#DC2626] block leading-snug">
                • Video: Chính sách tiền lương mới nhất áp dụng từ năm 2026
              </a>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Cập nhật 3 ngày trước</span>
            </li>
            <li className="py-2">
              <a href="#" className="font-semibold text-slate-800 hover:text-[#DC2626] block leading-snug">
                • Bảng lương cán bộ, công chức và viên chức cập nhật mới nhất
              </a>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Nghị định 204 & sửa đổi</span>
            </li>
            <li className="py-2">
              <a href="#" className="font-semibold text-slate-800 hover:text-[#DC2626] block leading-snug">
                • Lương cơ sở áp dụng cho các đơn vị BQL Dự án công lập
              </a>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Phân hệ Tài chính M4</span>
            </li>
          </ul>
        </div>

        {/* Widget 2: Biểu mẫu liên quan */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="m-0 text-xs font-bold uppercase tracking-wider text-slate-700">
              BIỂU MẪU LIÊN QUAN
            </h4>
            <span className="text-[11px] text-[#DC2626] font-semibold cursor-pointer">Xem tất cả</span>
          </div>

          <ul className="m-0 list-none p-0 divide-y divide-slate-100 text-xs">
            <li className="py-2.5 flex items-start gap-2">
              <FileWordOutlined className="text-blue-600 text-base mt-0.5 shrink-0" />
              <div>
                <a href="#" className="font-medium text-slate-800 hover:text-blue-700 block leading-snug">
                  Mẫu Quyết định phân công phụ trách phòng / ban dự án
                </a>
                <span className="text-[10px] text-slate-400">File DOCX · 45 KB</span>
              </div>
            </li>

            <li className="py-2.5 flex items-start gap-2">
              <FileWordOutlined className="text-blue-600 text-base mt-0.5 shrink-0" />
              <div>
                <a href="#" className="font-medium text-slate-800 hover:text-blue-700 block leading-snug">
                  Mẫu Phụ lục hợp đồng lao động điều chỉnh lương & vị trí
                </a>
                <span className="text-[10px] text-slate-400">File DOCX · 52 KB</span>
              </div>
            </li>

            <li className="py-2.5 flex items-start gap-2">
              <FilePdfOutlined className="text-rose-600 text-base mt-0.5 shrink-0" />
              <div>
                <a href="#" className="font-medium text-slate-800 hover:text-rose-700 block leading-snug">
                  Mẫu Thỏa ước lao động tập thể chuẩn cho đơn vị sự nghiệp
                </a>
                <span className="text-[10px] text-slate-400">File PDF · 128 KB</span>
              </div>
            </li>
          </ul>
        </div>

        {/* Widget 3: Hỗ trợ tra cứu */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 space-y-2">
          <span className="font-bold text-slate-800 block">Cần hỗ trợ tra cứu chuyên sâu?</span>
          <p className="m-0 leading-relaxed text-[11px]">
            Sử dụng nút <strong>Hỏi AILuat</strong> ở góc trên thanh công cụ để hỏi đáp trực tiếp các vướng mắc về điều khoản với trợ lý pháp lý AI.
          </p>
        </div>
      </div>
    </div>
  );
}
