"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DownloadOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  LoadingOutlined,
  LockOutlined,
  PlusOutlined,
  RobotOutlined,
  SearchOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Button, Card, Flex, Input, Select, Table, Tag, Text, Title } from "@/components/ui";
import type { ColumnsType } from "@/components/ui";
import AiLegalAssistantDrawer from "./AiLegalAssistantDrawer";
import CreateDocumentDrawer from "./CreateDocumentDrawer";
import DocumentDetailDrawer from "./DocumentDetailDrawer";
import ReportPreviewModal from "./ReportPreviewModal";
import type { LegalDocument, ReportType } from "../types/legal-ai.types";
import { generateAiReport } from "../utils/report-generator";
import { getLegalAiPermissions } from "../utils/legal-ai-permissions";
import { useAuthStore } from "@/stores/auth.store";

// Dữ liệu danh mục văn bản pháp luật chuẩn theo bố cục yêu cầu
interface LegalItem {
  id: string;
  code: string;
  title: string;
  field: "Xây dựng" | "Đấu thầu" | "Đất đai" | "Tài chính";
  status: "Hiệu lực" | "Xem xét SĐ" | "Sắp hết HLực";
  issuer: string;
  issueDate: string;
  effectiveDate: string;
  summary: string;
}

const INITIAL_LEGAL_ITEMS: LegalItem[] = [
  {
    id: "L-01",
    code: "Luật 50/2014",
    title: "Luật Xây dựng (sửa đổi 2020)",
    field: "Xây dựng",
    status: "Hiệu lực",
    issuer: "Quốc hội",
    issueDate: "2014-06-18",
    effectiveDate: "2015-01-01",
    summary:
      "Quy định quyền và nghĩa vụ của chủ đầu tư, ban quản lý dự án chuyên ngành; thẩm định thiết kế, dự toán, cấp phép và nghiệm thu bàn giao công trình xây dựng.",
  },
  {
    id: "L-02",
    code: "Luật 22/2023",
    title: "Luật Đấu thầu 2023",
    field: "Đấu thầu",
    status: "Hiệu lực",
    issuer: "Quốc hội",
    issueDate: "2023-06-23",
    effectiveDate: "2024-01-01",
    summary:
      "Quy định quy trình lựa chọn nhà thầu qua Hệ thống mạng đấu thầu quốc gia, 9 bước phê duyệt kế hoạch, E-HSMT, đánh giá E-HSDT và ký kết hợp đồng.",
  },
  {
    id: "L-03",
    code: "Luật 31/2024",
    title: "Luật Đất đai 2024",
    field: "Đất đai",
    status: "Hiệu lực",
    issuer: "Quốc hội",
    issueDate: "2024-01-18",
    effectiveDate: "2024-08-01",
    summary:
      "Quy định chính sách thu hồi đất, nguyên tắc bồi thường hỗ trợ tái định cư; thời hạn bắt buộc niêm yết công khai phương án bồi thường tối thiểu 10 ngày (Điều 87).",
  },
  {
    id: "L-04",
    code: "NĐ 10/2021",
    title: "Quyết toán dự án hoàn thành & Quản lý chi phí",
    field: "Xây dựng",
    status: "Xem xét SĐ",
    issuer: "Chính phủ",
    issueDate: "2021-02-09",
    effectiveDate: "2021-02-09",
    summary:
      "Quy định về quản lý chi phí đầu tư xây dựng, lập và phê duyệt dự toán, kiểm soát thanh toán khối lượng qua Kho bạc Nhà nước.",
  },
  {
    id: "L-05",
    code: "TT 09/2021",
    title: "Quản lý chi phí ĐTXD",
    field: "Xây dựng",
    status: "Sắp hết HLực",
    issuer: "Bộ Xây dựng",
    issueDate: "2021-08-16",
    effectiveDate: "2021-10-15",
    summary:
      "Hướng dẫn phương pháp xác định và quản lý chi phí đầu tư xây dựng công trình, định mức kinh tế kỹ thuật và đơn giá xây dựng.",
  },
  {
    id: "L-06",
    code: "NQ 254/2025",
    title: "Quốc hội về đất đai đặc biệt",
    field: "Đất đai",
    status: "Hiệu lực",
    issuer: "Quốc hội",
    issueDate: "2025-06-25",
    effectiveDate: "2025-08-01",
    summary:
      "Nghị quyết thí điểm một số cơ chế, chính sách đặc thù phát triển hệ thống hạ tầng và công tác bồi thường giải phóng mặt bằng dự án trọng điểm.",
  },
  {
    id: "L-07",
    code: "QĐ 18/2024",
    title: "Bồi thường, hỗ trợ, TĐC tỉnh Kiên Giang",
    field: "Đất đai",
    status: "Hiệu lực",
    issuer: "UBND tỉnh Kiên Giang",
    issueDate: "2024-05-15",
    effectiveDate: "2024-06-01",
    summary:
      "Quy định đơn giá bồi thường đất, tài sản trên đất, chính sách hỗ trợ chuyển đổi nghề nghiệp và bố trí tái định cư áp dụng trên địa bàn Kiên Giang & TP Hà Tiên.",
  },
  {
    id: "L-08",
    code: "NĐ 24/2024",
    title: "Quy định chi tiết Luật Đấu thầu 2023",
    field: "Đấu thầu",
    status: "Hiệu lực",
    issuer: "Chính phủ",
    issueDate: "2024-02-27",
    effectiveDate: "2024-02-27",
    summary:
      "Quy định chi tiết thi hành một số điều của Luật Đấu thầu về lựa chọn nhà thầu, mẫu hồ sơ mời thầu xây lắp, thẩm định kết quả và bảo đảm dự thầu.",
  },
];

// Danh sách biểu mẫu chuẩn GPMB (Mẫu 01-09)
interface FormTemplate {
  id: string;
  name: string;
  code: string;
}

const GPMB_TEMPLATES: FormTemplate[] = [
  { id: "T-01", name: "Mẫu 01 – Biên bản họp dân", code: "BM-01-GPMB" },
  { id: "T-02", name: "Mẫu 02 – Thông báo thu hồi đất", code: "BM-02-GPMB" },
  { id: "T-03", name: "Mẫu 03 – Biên bản kiểm kê", code: "BM-03-GPMB" },
  { id: "T-04", name: "Mẫu 04 – Biên bản niêm yết phương án", code: "BM-04-GPMB" },
  { id: "T-05", name: "Mẫu 05 – QĐ phê duyệt phương án", code: "BM-05-GPMB" },
  { id: "T-06", name: "Mẫu 06 – Biên bản chi trả tiền bồi thường", code: "BM-06-GPMB" },
  { id: "T-07", name: "Mẫu 07 – Biên bản bàn giao mặt bằng", code: "BM-07-GPMB" },
  { id: "T-08", name: "Mẫu HĐ-XL – Điều khoản giữ bảo lãnh BH 5%", code: "BM-HD-BH05" },
];

export default function LegalAiLibraryScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const permissions = useMemo(() => getLegalAiPermissions(user), [user]);
  const canManageDocuments = permissions.canCreateDocument;

  const [legalItems, setLegalItems] = useState<LegalItem[]>(INITIAL_LEGAL_ITEMS);
  const [search, setSearch] = useState("");
  const [selectedReportType, setSelectedReportType] = useState<ReportType>("MONTHLY");
  const [reportPeriod, setReportPeriod] = useState("Tháng 09/2026");
  const [isGenerating, setIsGenerating] = useState(false);

  // Chặn truy cập nếu không có quyền theo Ma trận phân quyền BRD Mục 5
  if (!permissions.canAccessModule) {
    return (
      <Flex layout="center" className="min-h-[calc(100vh-140px)] px-4">
        <Card surface="workspace" className="w-full max-w-[560px] text-center border-rose-200 shadow-md">
          <Flex vertical align="center" gap={14}>
            <Flex
              align="center"
              justify="center"
              className="h-14 w-14 rounded-full bg-rose-50 text-rose-600 text-2xl"
            >
              <LockOutlined />
            </Flex>
            <Flex vertical align="center" gap={8}>
              <Title level={4} className="!m-0 text-slate-800">
                Không có quyền truy cập Thư viện Pháp lý + AI
              </Title>
              <Text type="secondary" className="text-sm">
                Tài khoản của bạn không được cấp quyền truy cập phân hệ <strong>M9 – Thư viện Pháp lý + AI</strong> theo Ma trận phân quyền BRD Mục 5.
              </Text>
              <div className="mt-2 text-xs text-slate-500 bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200">
                Tài khoản hiện tại: <strong className="text-slate-800">{user?.displayName ?? user?.name ?? "Chưa đăng nhập"}</strong> · Vai trò: <strong className="text-slate-800">{user?.roleName ?? user?.role ?? "Khách"}</strong>
              </div>
            </Flex>
            <Button intent="primary" onClick={() => router.push("/dashboard")}>
              Quay về Bảng điều khiển
            </Button>
          </Flex>
        </Card>
      </Flex>
    );
  }

  // Modals & Drawers state
  const [previewModal, setPreviewModal] = useState<{
    open: boolean;
    title: string;
    period: string;
    content: string;
  }>({
    open: false,
    title: "",
    period: "",
    content: "",
  });
  const [selectedDoc, setSelectedDoc] = useState<LegalDocument | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Lọc văn bản pháp luật
  const filteredItems = legalItems.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.code.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q) ||
      item.field.toLowerCase().includes(q) ||
      item.status.toLowerCase().includes(q)
    );
  });

  // Tải biểu mẫu
  const handleDownloadTemplate = (template: FormTemplate) => {
    const fileName = `${template.code}_${template.name.replace(/[\/\\?%*:|"<>]/g, "_")}.txt`;
    const element = window.document.createElement("a");
    const file = new Blob(
      [
        `BIỂU MẪU CHUẨN BAN QUẢN LÝ DỰ ÁN ĐẦU TƯ XÂY DỰNG TP HÀ TIÊN\n\n` +
          `Mã biểu mẫu: ${template.code}\n` +
          `Tên biểu mẫu: ${template.name}\n` +
          `Áp dụng: Quy trình Bồi thường, hỗ trợ & GPMB / Quản lý hợp đồng xây lắp\n` +
          `Căn cứ pháp lý: Luật Đất đai 2024, Luật Xây dựng, Quyết định 18/2024/QĐ-UBND Kiên Giang\n`,
      ],
      { type: "text/plain;charset=utf-8" },
    );
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    window.document.body.appendChild(element);
    element.click();
    window.document.body.removeChild(element);
  };

  // AI Kết xuất báo cáo tự động
  const handleGenerateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const generated = generateAiReport(selectedReportType, "ALL", reportPeriod);
      setPreviewModal({
        open: true,
        title: generated.title,
        period: reportPeriod,
        content: generated.content,
      });
      setIsGenerating(false);
    }, 600);
  };

  // Xem chi tiết văn bản
  const handleOpenDocDetail = (item: LegalItem) => {
    const doc: LegalDocument = {
      id: item.id,
      code: item.code,
      title: item.title,
      category: item.code.startsWith("Luật")
        ? "LAW"
        : item.code.startsWith("NĐ")
        ? "DECREE"
        : item.code.startsWith("TT")
        ? "CIRCULAR"
        : "LOCAL",
      issuer: item.issuer,
      issueDate: item.issueDate,
      effectiveDate: item.effectiveDate,
      status: item.status === "Hiệu lực" ? "EFFECTIVE" : item.status === "Sắp hết HLực" ? "EXPIRED" : "PARTIAL",
      scope: `Lĩnh vực ${item.field} – Ban QLDA Hà Tiên`,
      summary: item.summary,
      fileType: "PDF",
      fileSize: "2.4 MB",
      downloads: 48,
      tags: [item.field, item.status, "Văn bản quy phạm"],
    };
    setSelectedDoc(doc);
  };

  // Định nghĩa cột bảng Văn bản pháp luật (chuẩn theo layout ảnh)
  const columns: ColumnsType<LegalItem> = [
    {
      title: "SỐ KÝ HIỆU",
      key: "code",
      width: "25%",
      render: (_, row) => (
        <button
          type="button"
          onClick={() => handleOpenDocDetail(row)}
          className="text-left font-bold text-xs text-[#007A78] hover:text-[#005e5c] hover:underline cursor-pointer"
        >
          {row.code}
        </button>
      ),
    },
    {
      title: "TÊN VĂN BẢN",
      key: "title",
      width: "45%",
      render: (_, row) => (
        <div
          onClick={() => handleOpenDocDetail(row)}
          className="text-xs font-medium text-slate-850 hover:text-[#007A78] cursor-pointer line-clamp-1"
          title={row.title}
        >
          {row.title}
        </div>
      ),
    },
    {
      title: "LĨNH VỰC",
      key: "field",
      width: "15%",
      render: (_, row) => {
        let badgeClass = "bg-sky-50 text-sky-700 border-sky-200";
        if (row.field === "Đấu thầu") badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
        if (row.field === "Đất đai") badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";

        return (
          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${badgeClass}`}>
            {row.field}
          </span>
        );
      },
    },
    {
      title: "TT",
      key: "status",
      width: "15%",
      render: (_, row) => {
        let badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
        if (row.status === "Xem xét SĐ") badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
        if (row.status === "Sắp hết HLực") badgeClass = "bg-rose-50 text-rose-700 border-rose-200";

        return (
          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${badgeClass}`}>
            {row.status}
          </span>
        );
      },
    },
  ];

  return (
    <div className="w-full max-w-[2560px] mx-auto flex flex-col gap-4">
      {/* Thanh trạng thái hệ thống & tác vụ nhanh thay thế tiêu đề cồng kềnh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white px-4 py-2.5 rounded-lg border border-slate-200/90 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Hệ thống văn bản pháp luật & AI
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">
            <strong>{legalItems.length}</strong> văn bản quy phạm
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-600">
            <strong>{GPMB_TEMPLATES.length}</strong> biểu mẫu chuẩn GPMB
          </span>
          <span className="text-slate-300">·</span>
          <span className={`inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded border text-[11px] ${
            permissions.isReadOnly ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-teal-50 text-teal-800 border-teal-200"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${permissions.isReadOnly ? "bg-amber-500" : "bg-teal-600 animate-pulse"}`} />
            {permissions.isReadOnly ? `Quyền: Chỉ xem (${permissions.roleTitle})` : `Quyền: Toàn quyền (${permissions.roleTitle})`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            intent="outline"
            scale="sm"
            icon={<RobotOutlined className="text-[#007A78]" />}
            onClick={() => setIsAssistantOpen(true)}
            className="!border-[#007A78] !text-teal-800 hover:!bg-teal-50 h-8 text-xs font-semibold rounded-lg"
          >
            Hỏi Trợ lý AI
          </Button>

          {canManageDocuments && (
            <Button
              intent="primary"
              scale="sm"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateOpen(true)}
              className="!bg-[#007A78] !border-[#007A78] hover:!bg-[#006361] !text-white h-8 text-xs font-semibold rounded-lg shadow-2xs"
            >
              Thêm văn bản
            </Button>
          )}
        </div>
      </div>

      {/* BỐ CỤC 2 CỘT CHUẨN THEO THIẾT KẾ YÊU CẦU */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* CỘT TRÁI: Bảng Văn bản pháp luật (chiếm ~60-65% không gian) */}
        <div className="lg:col-span-7 xl:col-span-8">
          <Card
            surface="flat"
            padding="none"
            rounded="lg"
            className="overflow-hidden border border-slate-200 shadow-xs bg-white"
          >
            {/* Header thẻ bên trái */}
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-sm font-bold text-slate-850">Văn bản pháp luật</div>
              <div className="w-full sm:w-64">
                <Input
                  allowClear
                  intent="clean"
                  prefix={<SearchOutlined className="text-slate-400 text-xs" />}
                  placeholder="Tìm số hiệu, tên văn bản..."
                  className="w-full text-xs h-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Bảng văn bản pháp luật */}
            <Table<LegalItem>
              rowKey="id"
              columns={columns}
              dataSource={filteredItems}
              pagination={false}
              className="w-full [&_.ant-table-thead>tr>th]:!bg-slate-50 [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-slate-500"
            />
          </Card>
        </div>

        {/* CỘT PHẢI: 2 Thẻ (AI - Kết xuất báo cáo & Biểu mẫu GPMB) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
          {/* 1. Thẻ AI – Kết xuất báo cáo */}
          <Card
            surface="flat"
            padding="md"
            rounded="lg"
            className="border border-slate-200 shadow-xs bg-white flex flex-col gap-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-850">AI – Kết xuất báo cáo</span>
              <span className="rounded bg-teal-100 text-[#007A78] text-[10px] font-bold px-1.5 py-0.5">
                AI
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                LOẠI BÁO CÁO
              </label>
              <Select
                aria-label="Loại báo cáo"
                value={selectedReportType}
                onChange={(val) => setSelectedReportType(val as ReportType)}
                className="w-full text-xs [&_.ant-select-selector]:!rounded-lg"
                options={[
                  { value: "MONTHLY", label: "Báo cáo tiến độ tháng định kỳ" },
                  { value: "WEEKLY", label: "Báo cáo tiến độ tuần của Ban" },
                  { value: "GPMB_TOPIC", label: "Báo cáo chuyên đề Bồi thường & GPMB" },
                  { value: "DISBURSEMENT_TOPIC", label: "Báo cáo tình hình giải ngân vốn đầu tư công" },
                  { value: "ANNUAL", label: "Báo cáo tổng kết công tác năm" },
                ]}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                KỲ BÁO CÁO
              </label>
              <Input
                intent="clean"
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value)}
                placeholder="VD: Tháng 09/2026 hoặc March 2026"
                className="w-full text-xs h-8"
              />
            </div>

            {!permissions.canGenerateReport && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-900 flex items-start gap-2">
                <LockOutlined className="text-amber-600 mt-0.5 text-xs shrink-0" />
                <div>
                  <strong>Phân quyền BRD Mục 5:</strong> Quyền kết xuất và ban hành báo cáo lời cấp Ban bằng AI chỉ dành cho <strong>Ban Giám đốc (GĐ/PGĐ)</strong>. Tài khoản của bạn ({permissions.roleTitle}) có quyền tra cứu văn bản và tải biểu mẫu.
                </div>
              </div>
            )}

            <Button
              intent={permissions.canGenerateReport ? "primary" : "default"}
              disabled={isGenerating || !permissions.canGenerateReport}
              onClick={permissions.canGenerateReport ? handleGenerateReport : undefined}
              className={permissions.canGenerateReport 
                ? "!bg-[#007A78] !border-[#007A78] hover:!bg-[#006361] !text-white h-9 text-xs font-bold rounded-lg w-full flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                : "h-9 text-xs font-semibold rounded-lg w-full flex items-center justify-center gap-1.5 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"}
            >
              {isGenerating ? (
                <>
                  <LoadingOutlined /> Đang kết xuất...
                </>
              ) : permissions.canGenerateReport ? (
                <>✦ Kết xuất báo cáo tự động</>
              ) : (
                <>🔒 Yêu cầu quyền Ban Giám đốc</>
              )}
            </Button>

            <p className="text-[11px] text-slate-500 leading-relaxed mb-0">
              AI điền số liệu thực tế từ hệ thống vào khung mẫu báo cáo → người dùng xem xét và chỉnh sửa → ban hành
            </p>
          </Card>

          {/* 2. Thẻ Biểu mẫu GPMB (Mẫu 01–09) */}
          <Card
            surface="flat"
            padding="md"
            rounded="lg"
            className="border border-slate-200 shadow-xs bg-white"
          >
            <div className="text-sm font-bold text-slate-850 mb-2">
              Biểu mẫu GPMB (Mẫu 01–09)
            </div>

            <div className="divide-y divide-slate-100">
              {GPMB_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="flex items-center justify-between py-2 px-1 hover:bg-slate-50/80 rounded transition-colors"
                >
                  <span
                    className="text-xs font-medium text-slate-800 line-clamp-1 pr-2"
                    title={tmpl.name}
                  >
                    {tmpl.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate(tmpl)}
                    className="shrink-0 flex items-center gap-1 text-[11.5px] font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-0.5 rounded-md transition-colors cursor-pointer"
                  >
                    ↓ Tải
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Modal xem trước báo cáo AI đã kết xuất (closable=false) */}
      <ReportPreviewModal
        open={previewModal.open}
        title={previewModal.title}
        period={previewModal.period}
        initialContent={previewModal.content}
        canExport={permissions.canExportReport}
        onClose={() => setPreviewModal((prev) => ({ ...prev, open: false }))}
      />

      {/* Drawer xem chi tiết văn bản (closable=false) */}
      <DocumentDetailDrawer
        open={Boolean(selectedDoc)}
        document={selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />

      {/* Drawer thêm mới văn bản (closable=false) */}
      <CreateDocumentDrawer
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={(doc) => {
          const newItem: LegalItem = {
            id: doc.id,
            code: doc.code,
            title: doc.title,
            field: doc.scope.includes("Đấu thầu")
              ? "Đấu thầu"
              : doc.scope.includes("GPMB")
              ? "Đất đai"
              : "Xây dựng",
            status: doc.status === "EFFECTIVE" ? "Hiệu lực" : doc.status === "EXPIRED" ? "Sắp hết HLực" : "Xem xét SĐ",
            issuer: doc.issuer,
            issueDate: doc.issueDate,
            effectiveDate: doc.effectiveDate,
            summary: doc.summary,
          };
          setLegalItems((prev) => [newItem, ...prev]);
        }}
      />

      {/* Drawer Trợ lý AI pháp lý (closable=false) */}
      <AiLegalAssistantDrawer
        open={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onSelectDocument={(docId) => {
          const item = legalItems.find((l) => l.id === docId);
          if (item) handleOpenDocDetail(item);
        }}
      />
    </div>
  );
}
