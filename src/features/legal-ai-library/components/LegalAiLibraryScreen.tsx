"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LockOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, DEFAULT_LIST_PAGE_SIZE, Flex, Input, Pagination, Select, Text, Title } from "@/components/ui";
import { todayIso } from "@/utils/date";
import { normalizeSearchText } from "@/utils/search-text";
import AiLegalAssistantDrawer from "./AiLegalAssistantDrawer";
import CreateDocumentDrawer from "./CreateDocumentDrawer";
import DocumentDetailDrawer from "./DocumentDetailDrawer";
import { CATEGORY_LABELS, STATUS_META, STATUS_ORDER } from "../constants/legal-mock-data";
import { SAMPLE_DECREE_10_2021_CONTENT } from "../constants/legal-sample-content";
import type { LegalDocument, LegalDocumentCategory, LegalDocumentStatus } from "../types/legal-ai.types";
import { getLegalAiPermissions } from "../utils/legal-ai-permissions";
import { useAuthStore } from "@/stores/auth.store";

// Văn bản trong thư viện: giữ nguyên toàn bộ thông tin đã nhập (tags, tệp) + ngày cập nhật
type LegalItem = LegalDocument & { updatedAt: string };

const INITIAL_LEGAL_ITEMS: LegalItem[] = [
  {
    id: "L-01",
    code: "50/2014/QH13",
    title:
      "Luật Xây dựng năm 2014, được sửa đổi, bổ sung một số điều theo Luật số 62/2020/QH14 về hoạt động đầu tư xây dựng",
    category: "LAW",
    status: "EFFECTIVE",
    issuer: "Quốc hội",
    issueDate: "2014-06-18",
    effectiveDate: "2015-01-01",
    updatedAt: "2026-09-12",
    scope: "M2 – Quản lý dự án & tiến độ thi công",
    summary:
      "Quy định quyền và nghĩa vụ của chủ đầu tư, ban quản lý dự án chuyên ngành; thẩm định thiết kế, dự toán, cấp phép và nghiệm thu bàn giao công trình xây dựng.",
    fileType: "PDF",
    fileSize: "3.1 MB",
    downloads: 126,
    tags: ["Chủ đầu tư", "Thẩm định thiết kế", "Nghiệm thu"],
  },
  {
    id: "L-02",
    code: "22/2023/QH15",
    title:
      "Luật Đấu thầu quy định quản lý nhà nước về đấu thầu, trách nhiệm của các bên và hoạt động lựa chọn nhà thầu, nhà đầu tư",
    category: "LAW",
    status: "EFFECTIVE",
    issuer: "Quốc hội",
    issueDate: "2023-06-23",
    effectiveDate: "2024-01-01",
    updatedAt: "2026-08-30",
    scope: "M7 – Quản lý đấu thầu qua mạng (9 bước)",
    summary:
      "Quy định quy trình lựa chọn nhà thầu qua Hệ thống mạng đấu thầu quốc gia, 9 bước phê duyệt kế hoạch, E-HSMT, đánh giá E-HSDT và ký kết hợp đồng.",
    fileType: "PDF",
    fileSize: "2.8 MB",
    downloads: 98,
    tags: ["Lựa chọn nhà thầu", "E-HSMT", "Mạng đấu thầu quốc gia"],
  },
  {
    id: "L-03",
    code: "31/2024/QH15",
    title:
      "Luật Đất đai quy định chế độ sở hữu đất đai, quyền hạn và trách nhiệm của Nhà nước đại diện chủ sở hữu toàn dân về đất đai",
    category: "LAW",
    status: "EFFECTIVE",
    issuer: "Quốc hội",
    issueDate: "2024-01-18",
    effectiveDate: "2024-08-01",
    updatedAt: "2026-09-05",
    scope: "M6 – Bồi thường, hỗ trợ & GPMB (16 bước)",
    summary:
      "Quy định chính sách thu hồi đất, nguyên tắc bồi thường hỗ trợ tái định cư; thời hạn bắt buộc niêm yết công khai phương án bồi thường tối thiểu 10 ngày (Điều 87).",
    fileType: "PDF",
    fileSize: "4.2 MB",
    downloads: 143,
    tags: ["Thu hồi đất", "Bồi thường", "Tái định cư"],
  },
  {
    id: "L-04",
    code: "10/2021/NĐ-CP",
    title:
      "Nghị định của Chính phủ về quản lý chi phí đầu tư xây dựng",
    category: "DECREE",
    status: "PARTIAL",
    issuer: "Chính phủ",
    issueDate: "2021-02-09",
    effectiveDate: "2021-02-09",
    updatedAt: "2026-10-02",
    scope: "M4 – Giải ngân KBNN, tạm ứng & quyết toán",
    summary:
      "Quy định về quản lý chi phí đầu tư xây dựng, lập và phê duyệt dự toán, kiểm soát thanh toán khối lượng qua Kho bạc Nhà nước.",
    fileType: "PDF",
    fileSize: "1.9 MB",
    downloads: 87,
    tags: ["Chi phí đầu tư", "Dự toán", "Quyết toán"],
    // Toàn văn mẫu dài để thử cuộn trong bản xem trước
    content: SAMPLE_DECREE_10_2021_CONTENT,
  },
  {
    id: "L-05",
    code: "11/2021/TT-BXD",
    title:
      "Thông tư hướng dẫn một số nội dung xác định và quản lý chi phí đầu tư xây dựng",
    category: "CIRCULAR",
    status: "EXPIRING",
    issuer: "Bộ Xây dựng",
    issueDate: "2021-08-31",
    effectiveDate: "2021-10-15",
    updatedAt: "2026-10-10",
    scope: "M4 – Giải ngân KBNN, tạm ứng & quyết toán",
    summary:
      "Hướng dẫn phương pháp xác định và quản lý chi phí đầu tư xây dựng công trình, định mức kinh tế kỹ thuật và đơn giá xây dựng.",
    fileType: "PDF",
    fileSize: "1.2 MB",
    downloads: 64,
    tags: ["Định mức", "Đơn giá", "Chi phí ĐTXD"],
  },
  {
    id: "L-06",
    code: "254/2025/QH15",
    title:
      "Nghị quyết quy định một số cơ chế, chính sách tháo gỡ vướng mắc trong tổ chức thi hành Luật Đất đai",
    category: "RESOLUTION",
    status: "EFFECTIVE",
    issuer: "Quốc hội",
    issueDate: "2025-06-25",
    effectiveDate: "2025-08-01",
    updatedAt: "2026-07-21",
    scope: "M6 – Bồi thường, hỗ trợ & GPMB (16 bước)",
    summary:
      "Nghị quyết thí điểm một số cơ chế, chính sách đặc thù phát triển hệ thống hạ tầng và công tác bồi thường giải phóng mặt bằng dự án trọng điểm.",
    fileType: "PDF",
    fileSize: "0.9 MB",
    downloads: 41,
    tags: ["Cơ chế đặc thù", "GPMB", "Dự án trọng điểm"],
  },
  {
    id: "L-07",
    code: "18/2024/QĐ-UBND",
    title:
      "Quyết định ban hành Quy định về bồi thường, hỗ trợ, tái định cư khi Nhà nước thu hồi đất trên địa bàn tỉnh Kiên Giang",
    category: "DECISION",
    status: "EFFECTIVE",
    issuer: "UBND tỉnh Kiên Giang",
    issueDate: "2024-05-15",
    effectiveDate: "2024-06-01",
    updatedAt: "2026-06-18",
    scope: "M6 – Bồi thường, hỗ trợ & GPMB (16 bước)",
    summary:
      "Quy định đơn giá bồi thường đất, tài sản trên đất, chính sách hỗ trợ chuyển đổi nghề nghiệp và bố trí tái định cư áp dụng trên địa bàn Kiên Giang & TP Hà Tiên.",
    fileType: "PDF",
    fileSize: "1.6 MB",
    downloads: 112,
    tags: ["Đơn giá bồi thường", "Kiên Giang", "Hà Tiên"],
  },
  {
    id: "L-08",
    code: "24/2024/NĐ-CP",
    title:
      "Nghị định quy định chi tiết một số điều và biện pháp thi hành Luật Đấu thầu về lựa chọn nhà thầu",
    category: "DECREE",
    status: "EFFECTIVE",
    issuer: "Chính phủ",
    issueDate: "2024-02-27",
    effectiveDate: "2024-02-27",
    updatedAt: "2026-08-14",
    scope: "M7 – Quản lý đấu thầu qua mạng (9 bước)",
    summary:
      "Quy định chi tiết thi hành một số điều của Luật Đấu thầu về lựa chọn nhà thầu, mẫu hồ sơ mời thầu xây lắp, thẩm định kết quả và bảo đảm dự thầu.",
    fileType: "PDF",
    fileSize: "2.2 MB",
    downloads: 79,
    tags: ["Hồ sơ mời thầu", "Bảo đảm dự thầu", "Thẩm định"],
  },
  {
    id: "L-09",
    code: "06/2021/NĐ-CP",
    title:
      "Nghị định quy định chi tiết một số nội dung về quản lý chất lượng, thi công xây dựng và bảo trì công trình xây dựng",
    category: "DECREE",
    status: "EFFECTIVE",
    issuer: "Chính phủ",
    issueDate: "2021-01-26",
    effectiveDate: "2021-01-26",
    updatedAt: "2026-05-20",
    scope: "M8 – Bảo hành công trình & bảo lãnh hợp đồng",
    summary:
      "Quy định về quản lý chất lượng khảo sát, thiết kế, thi công xây dựng; nghiệm thu, bàn giao công trình và thời hạn bảo hành, bảo trì công trình xây dựng.",
    fileType: "PDF",
    fileSize: "2.6 MB",
    downloads: 95,
    tags: ["Quản lý chất lượng", "Nghiệm thu", "Bảo hành"],
  },
  {
    id: "L-10",
    code: "15/2021/NĐ-CP",
    title: "Nghị định quy định chi tiết một số nội dung về quản lý dự án đầu tư xây dựng",
    category: "DECREE",
    status: "EXPIRED",
    issuer: "Chính phủ",
    issueDate: "2021-03-03",
    effectiveDate: "2021-03-03",
    updatedAt: "2026-04-08",
    scope: "M2 – Quản lý dự án & tiến độ thi công",
    summary:
      "Quy định về lập, thẩm định, phê duyệt dự án, thiết kế xây dựng; cấp giấy phép xây dựng và hình thức tổ chức quản lý dự án đầu tư xây dựng.",
    fileType: "PDF",
    fileSize: "2.3 MB",
    downloads: 58,
    tags: ["Quản lý dự án", "Thẩm định dự án", "Giấy phép xây dựng"],
  },
  {
    id: "L-11",
    code: "58/2024/QH15",
    title: "Luật Đầu tư công quy định việc quản lý nhà nước về đầu tư công, quản lý và sử dụng vốn đầu tư công",
    category: "LAW",
    status: "EFFECTIVE",
    issuer: "Quốc hội",
    issueDate: "2024-11-29",
    effectiveDate: "2025-01-01",
    updatedAt: "2026-03-15",
    scope: "M4 – Giải ngân KBNN, tạm ứng & quyết toán",
    summary:
      "Quy định về kế hoạch đầu tư công trung hạn và hằng năm, quản lý, sử dụng vốn đầu tư công; quyền, nghĩa vụ của cơ quan, tổ chức, cá nhân liên quan.",
    fileType: "PDF",
    fileSize: "1.8 MB",
    downloads: 70,
    tags: ["Vốn đầu tư công", "Kế hoạch trung hạn", "Giải ngân"],
  },
  {
    id: "L-12",
    code: "88/2024/NĐ-CP",
    title: "Nghị định quy định về bồi thường, hỗ trợ, tái định cư khi Nhà nước thu hồi đất",
    category: "DECREE",
    status: "EFFECTIVE",
    issuer: "Chính phủ",
    issueDate: "2024-07-15",
    effectiveDate: "2024-08-01",
    updatedAt: "2026-02-27",
    scope: "M6 – Bồi thường, hỗ trợ & GPMB (16 bước)",
    summary:
      "Quy định chi tiết về bồi thường đất, tài sản gắn liền với đất, hỗ trợ ổn định đời sống, đào tạo chuyển đổi nghề và bố trí tái định cư khi Nhà nước thu hồi đất.",
    fileType: "PDF",
    fileSize: "1.5 MB",
    downloads: 101,
    tags: ["Bồi thường", "Tái định cư", "Thu hồi đất"],
  },
];

type DocumentCategory = Exclude<LegalDocumentCategory, "ALL">;

/** Thứ tự loại văn bản trong bộ lọc (theo thứ bậc hiệu lực pháp lý) */
const CATEGORY_FILTER_ORDER: DocumentCategory[] = ["LAW", "RESOLUTION", "DECREE", "CIRCULAR", "DECISION", "LOCAL"];

/** "2024-06-01" → "01/06/2024" */
function formatDate(isoDate: string | undefined): string {
  if (!isoDate) return "—";
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : isoDate;
}

export default function LegalAiLibraryScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const permissions = useMemo(() => getLegalAiPermissions(user), [user]);
  const canManageDocuments = permissions.canCreateDocument;

  const [legalItems, setLegalItems] = useState<LegalItem[]>(INITIAL_LEGAL_ITEMS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LegalDocumentStatus | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [selectedDoc, setSelectedDoc] = useState<LegalDocument | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

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
                Tài khoản hiện tại: <strong className="text-slate-800">{user?.displayName ?? user?.name ?? "Chưa đăng nhập"}</strong> · Chức danh: <strong className="text-slate-800">{user?.roleName ?? user?.role ?? "Khách"}</strong>
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

  // Lọc văn bản pháp luật: từ khóa (không phân biệt hoa/thường và dấu) + loại văn bản + tình trạng
  const query = normalizeSearchText(search);
  const matchesQuery = (item: LegalItem) =>
    !query ||
    [item.code, item.title, item.issuer, item.summary, ...item.tags].some((text) =>
      normalizeSearchText(text).includes(query),
    );

  const matchesStatus = (item: LegalItem) => statusFilter === "ALL" || item.status === statusFilter;
  const matchesCategory = (item: LegalItem) => categoryFilter === "ALL" || item.category === categoryFilter;

  const filteredItems = legalItems
    .filter((item) => matchesQuery(item) && matchesCategory(item) && matchesStatus(item))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / DEFAULT_LIST_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * DEFAULT_LIST_PAGE_SIZE;
  const pagedItems = filteredItems.slice(pageStart, pageStart + DEFAULT_LIST_PAGE_SIZE);

  const isFiltering = Boolean(query) || statusFilter !== "ALL" || categoryFilter !== "ALL";
  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
    setPage(1);
  };

  // Xem chi tiết văn bản: mở đúng dữ liệu đã lưu (phạm vi, tags, tệp đính kèm)
  const handleOpenDocDetail = (item: LegalItem) => setSelectedDoc(item);

  return (
    <div className="w-full max-w-[2560px] mx-auto flex flex-col gap-4">
      <Card
        surface="flat"
        padding="none"
        rounded="lg"
        className="overflow-hidden border border-slate-200 shadow-xs bg-white"
      >
        {/* Hàng 1: tiêu đề · thêm văn bản */}
        <div className="flex items-start justify-between gap-3 px-4 pt-3.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="m-0 text-base font-bold text-slate-900">Văn bản pháp luật</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                {legalItems.length}
              </span>
            </div>
            <p className="m-0 mt-0.5 text-xs text-slate-500">
              Luật, nghị định, thông tư, nghị quyết và quyết định áp dụng cho công tác quản lý dự án.
            </p>
          </div>
          {canManageDocuments && (
            <Button
              intent="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateOpen(true)}
              className="!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C] !text-white h-9 shrink-0 text-sm font-semibold shadow-2xs"
            >
              Thêm văn bản
            </Button>
          )}
        </div>

        {/* Hàng 2: tìm kiếm · lọc loại văn bản · lọc tình trạng | phân trang */}
        <div className="flex flex-col gap-2 border-b border-slate-200 px-4 pb-3.5 pt-3 xl:flex-row xl:items-center">
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              allowClear
              intent="clean"
              aria-label="Tìm văn bản"
              prefix={<SearchOutlined className="text-slate-400" />}
              placeholder="Tìm số hiệu, tên, cơ quan ban hành, từ khóa..."
              className="h-9 w-full text-sm sm:max-w-md sm:flex-1"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <Select
              aria-label="Lọc theo loại văn bản"
              value={categoryFilter}
              onChange={(val) => {
                setCategoryFilter(val as DocumentCategory | "ALL");
                setPage(1);
              }}
              className="h-9 w-full sm:w-52"
              options={[
                { value: "ALL", label: "Tất cả loại văn bản" },
                ...CATEGORY_FILTER_ORDER.map((cat) => ({
                  value: cat,
                  label: CATEGORY_LABELS[cat],
                })),
              ]}
            />
            <Select
              aria-label="Lọc theo tình trạng"
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val as LegalDocumentStatus | "ALL");
                setPage(1);
              }}
              className="h-9 w-full sm:w-52"
              options={[
                { value: "ALL", label: "Tất cả tình trạng" },
                ...STATUS_ORDER.map((st) => ({
                  value: st,
                  label: STATUS_META[st].label,
                })),
              ]}
            />
          </div>

          {filteredItems.length > 0 && (
            <div className="flex shrink-0 items-center justify-between gap-3 text-xs text-slate-500 xl:justify-end">
              <span className="whitespace-nowrap">
                Hiển thị {pageStart + 1}–{pageStart + pagedItems.length} / {filteredItems.length} văn bản
              </span>
              {totalPages > 1 && (
                <Pagination
                  current={currentPage}
                  pageSize={DEFAULT_LIST_PAGE_SIZE}
                  total={filteredItems.length}
                  onChange={setPage}
                  showSizeChanger={false}
                  size="small"
                />
              )}
            </div>
          )}
        </div>

        {/* Danh sách văn bản */}
        {pagedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
            <SearchOutlined className="mb-2 text-2xl text-slate-300" />
            <p className="m-0 text-sm font-semibold text-slate-700">Không tìm thấy văn bản phù hợp</p>
            <p className="m-0 mt-1 text-xs text-slate-500">Thử từ khóa khác hoặc bỏ bớt bộ lọc.</p>
            {isFiltering && (
              <Button intent="outline" scale="compact" className="mt-3" onClick={resetFilters}>
                Xóa bộ lọc
              </Button>
            )}
          </div>
        ) : (
          <ol className="m-0 list-none divide-y divide-slate-100 p-0">
            {pagedItems.map((item) => {
              const status = STATUS_META[item.status];
              return (
                <li key={item.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={`Xem chi tiết ${item.title ? `${item.code} – ${item.title}` : item.code}`}
                    onClick={() => handleOpenDocDetail(item)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleOpenDocDetail(item);
                      }
                    }}
                    className="group flex cursor-pointer flex-col gap-3 px-4 py-4 transition-colors hover:bg-slate-50/80 focus-visible:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#DC2626]/40 md:flex-row md:items-start md:gap-6"
                  >
                    <div className="min-w-0 flex-1">
                      <div>
                        <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                          {item.title && (
                            <>
                              <span className="font-semibold text-slate-700">{item.code}</span>
                              <span className="text-slate-300" aria-hidden>
                                ·
                              </span>
                            </>
                          )}
                          <span className="text-slate-500">{item.issuer}</span>
                        </div>
                        <p className="m-0 text-[15px] font-bold leading-snug text-slate-900 transition-colors group-hover:text-[#DC2626]">
                          {item.title || item.code}
                        </p>
                        {item.tags.length > 0 && (
                          <ul className="m-0 mt-2 flex list-none flex-wrap gap-1.5 p-0" aria-label="Từ khóa">
                            {item.tags.map((tag) => (
                              <li
                                key={tag}
                                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600"
                              >
                                {tag}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    <dl className="m-0 grid shrink-0 grid-cols-[auto_minmax(0,1fr)] gap-x-2.5 gap-y-1 rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2 text-xs md:ml-auto md:w-[190px]">
                      <dt className="text-slate-500">Ban hành</dt>
                      <dd className="m-0 font-medium text-slate-800">{formatDate(item.issueDate)}</dd>
                      <dt className="text-slate-500">Hiệu lực</dt>
                      <dd className="m-0 font-medium text-slate-800">{formatDate(item.effectiveDate)}</dd>
                      <dt className="text-slate-500">Tình trạng</dt>
                      <dd className={`m-0 font-semibold leading-snug break-words ${status.textClass}`}>{status.label}</dd>
                      <dt className="text-slate-500">Cập nhật</dt>
                      <dd className="m-0 font-medium text-slate-800">{formatDate(item.updatedAt)}</dd>
                    </dl>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

      </Card>

      {/* Drawer xem chi tiết văn bản (closable=false) */}
      <DocumentDetailDrawer
        open={Boolean(selectedDoc)}
        document={selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />

      {/* Drawer thêm mới văn bản (closable=false) */}
      <CreateDocumentDrawer
        open={isCreateOpen}
        knownIssuers={legalItems.map((item) => item.issuer)}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={(doc) => {
          const newItem: LegalItem = { ...doc, updatedAt: todayIso() };
          setLegalItems((prev) => [newItem, ...prev]);
          resetFilters();
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
