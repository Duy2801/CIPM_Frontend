"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { App } from "antd";
import {
  DeleteOutlined,
  FileTextOutlined,
  FormOutlined,
  HistoryOutlined,
  LockOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Button, Card, DEFAULT_LIST_PAGE_SIZE, Flex, Input, Pagination, Select, Text, Title, Tooltip } from "@/components/ui";
import { todayIso } from "@/utils/date";
import { normalizeSearchText } from "@/utils/search-text";
import AiLegalAssistantDrawer from "./AiLegalAssistantDrawer";
import CreateDocumentDrawer from "./CreateDocumentDrawer";
import DocumentDetailDrawer from "./DocumentDetailDrawer";
import { describeLegalChanges, type LegalDocumentPatch } from "../utils/document-changes";
import LegalStatsChart from "./LegalStatsChart";
import { LEGAL_LOG_MODULE, STATUS_META, STATUS_ORDER, getCategoryLabel } from "../constants/legal-mock-data";
import ActivityDateFilter, { toLocalDate } from "@/features/personnel-assignment/components/ActivityDateFilter";
import ActivityTimeline from "@/features/personnel-assignment/components/ActivityTimeline";
import { useActivityLogVersion } from "@/features/personnel-assignment/hooks/useActivityLogVersion";
import { appendActivity, getPersonnelActivities } from "@/features/personnel-assignment/utils/activity-log";
import { SAMPLE_DECREE_10_2021_CONTENT } from "../constants/legal-sample-content";
import type {
  BuiltInDocumentCategory,
  DocumentCategoryKey,
  LegalDocument,
  LegalDocumentStatus,
} from "../types/legal-ai.types";
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


/** Thứ tự loại văn bản trong bộ lọc (theo thứ bậc hiệu lực pháp lý) */
const CATEGORY_DISPLAY_ORDER: BuiltInDocumentCategory[] = [
  "LAW",
  "RESOLUTION",
  "DECREE",
  "CIRCULAR",
  "DECISION",
  "LOCAL",
  "TEMPLATE",
];

export default function LegalAiLibraryScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { modal } = App.useApp();
  const permissions = useMemo(() => getLegalAiPermissions(user), [user]);
  const canManageDocuments = permissions.canCreateDocument;

  const [legalItems, setLegalItems] = useState<LegalItem[]>(INITIAL_LEGAL_ITEMS);
  // Văn bản thêm trong phiên làm việc — mới nhất đứng đầu, luôn hiển thị trên cùng danh sách
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LegalDocumentStatus | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategoryKey | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [selectedDoc, setSelectedDoc] = useState<LegalDocument | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [screenTab, setScreenTab] = useState<"documents" | "history">("documents");
  // Lọc lịch sử theo một ngày (yyyy-mm-dd), rỗng = tất cả
  const [historyDate, setHistoryDate] = useState("");
  const logVersion = useActivityLogVersion();

  // Lịch sử thao tác trên thư viện (nhật ký dùng chung, lọc theo phân hệ), mới nhất lên đầu
  const libraryHistory = useMemo(() => {
    const all = getPersonnelActivities().filter((e) => e.module === LEGAL_LOG_MODULE);
    return historyDate ? all.filter((e) => toLocalDate(e.at) === historyDate) : all;
    // đọc lại khi nhật ký có dòng mới
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyDate, logVersion]);

  // Lọc văn bản pháp luật: từ khóa (không phân biệt hoa/thường và dấu) + loại văn bản + tình trạng
  const query = normalizeSearchText(search);
  const matchesQuery = (item: LegalItem) =>
    !query ||
    [item.code, item.title, item.issuer, item.summary, ...item.tags].some((text) =>
      normalizeSearchText(text).includes(query),
    );

  const matchesStatus = (item: LegalItem) => statusFilter === "ALL" || item.status === statusFilter;

  // Loại văn bản người dùng tự thêm (đã có văn bản trong thư viện), xếp sau các loại có sẵn
  const customCategories = useMemo(
    () =>
      [...new Set(legalItems.map((item) => item.category))].filter(
        (cat) => !(CATEGORY_DISPLAY_ORDER as string[]).includes(cat),
      ),
    [legalItems],
  );
  const categoryOptions: DocumentCategoryKey[] = [...CATEGORY_DISPLAY_ORDER, ...customCategories];

  const matchesCategory = (item: LegalItem) => categoryFilter === "ALL" || item.category === categoryFilter;

  // Danh sách phẳng (không gom nhóm): văn bản vừa thêm lên đầu, còn lại xếp theo thứ bậc loại văn bản rồi ngày cập nhật
  const filteredItems = useMemo(
    () =>
      legalItems
        .filter((item) => matchesQuery(item) && matchesCategory(item) && matchesStatus(item))
        .sort((a, b) => {
          const addedA = recentlyAddedIds.indexOf(a.id);
          const addedB = recentlyAddedIds.indexOf(b.id);
          if (addedA !== -1 || addedB !== -1) {
            if (addedA === -1) return 1;
            if (addedB === -1) return -1;
            return addedA - addedB;
          }
          const rankA = (CATEGORY_DISPLAY_ORDER as string[]).indexOf(a.category);
          const rankB = (CATEGORY_DISPLAY_ORDER as string[]).indexOf(b.category);
          if (rankA !== rankB) return (rankA === -1 ? 999 : rankA) - (rankB === -1 ? 999 : rankB);
          return b.updatedAt.localeCompare(a.updatedAt);
        }),
    [legalItems, recentlyAddedIds, query, statusFilter, categoryFilter],
  );

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

  // Xóa văn bản khỏi thư viện: hỏi xác nhận, ghi lịch sử
  const confirmDeleteDocument = (item: LegalItem) =>
    modal.confirm({
      centered: true,
      width: 460,
      title: "Xóa văn bản khỏi thư viện?",
      content: (
        <p className="m-0 text-xs leading-relaxed text-slate-600">
          Văn bản <strong className="text-slate-800">{item.code}</strong>
          {item.title ? ` – ${item.title}` : ""} cùng các tệp đính kèm sẽ bị xóa khỏi thư viện.
        </p>
      ),
      okText: "Xóa văn bản",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: () => {
        setLegalItems((prev) => prev.filter((doc) => doc.id !== item.id));
        setRecentlyAddedIds((prev) => prev.filter((id) => id !== item.id));
        if (selectedDoc?.id === item.id) setSelectedDoc(null);
        appendActivity({
          actorName: user?.displayName || user?.name || "Không rõ",
          actorRole: user?.roleName,
          module: LEGAL_LOG_MODULE,
          action: `Xóa văn bản: ${item.code}`,
          targetId: item.id,
          targetName: item.title || item.code,
          changes: [
            { label: "Loại văn bản", from: getCategoryLabel(item.category) },
            { label: "Cơ quan ban hành", from: item.issuer },
          ],
        });
      },
    });

  // Bấm "Lưu thay đổi" trong drawer chi tiết: lưu vào thư viện, cập nhật ngày, ghi lịch sử "cũ → mới"
  const handleUpdateDocument = (docId: string, patch: LegalDocumentPatch) => {
    const current = legalItems.find((item) => item.id === docId);
    if (!current) return;
    const updated: LegalItem = { ...current, ...patch, updatedAt: todayIso() };
    setLegalItems((prev) => prev.map((item) => (item.id === docId ? updated : item)));
    setSelectedDoc(updated);

    const changes = describeLegalChanges(current, patch).map(({ label, from, to }) => ({ label, from, to }));
    appendActivity({
      actorName: user?.displayName || user?.name || "Không rõ",
      actorRole: user?.roleName,
      module: LEGAL_LOG_MODULE,
      action: `Cập nhật văn bản: ${updated.code}`,
      targetId: updated.id,
      targetName: updated.title || updated.code,
      changes,
    });
  };

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

  return (
    <div className="w-full max-w-[2560px] mx-auto flex flex-col gap-4">
      {/* 2 tab trên cùng: danh sách văn bản / lịch sử thao tác */}
      {/* Tab nhỏ gọn: rộng vừa chữ, icon cùng hàng với chữ */}
      <div role="tablist" className="inline-flex gap-1 self-start rounded-lg border border-slate-200 bg-slate-100/70 p-0.5">
        {(
          [
            { key: "documents", icon: <FileTextOutlined />, label: "Danh sách văn bản" },
            { key: "history", icon: <HistoryOutlined />, label: "Lịch sử thay đổi" },
          ] as const
        ).map((tab) => {
          const active = screenTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setScreenTab(tab.key)}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors ${
                active ? "bg-white font-semibold text-slate-900 shadow-xs" : "font-medium text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className={active ? "text-[#DC2626]" : "text-slate-400"}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {screenTab === "history" ? (
        <Card
          surface="flat"
          padding="none"
          rounded="lg"
          className="overflow-hidden border border-slate-200 shadow-xs bg-white"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-4 py-3.5">
            <div className="min-w-0">
              <h2 className="m-0 text-base font-bold text-slate-900">Lịch sử thay đổi</h2>
              <p className="m-0 mt-0.5 text-xs text-slate-500">
                Ai đã thao tác trên thư viện, vào lúc nào · {libraryHistory.length} thao tác
              </p>
            </div>
            <ActivityDateFilter value={historyDate} onChange={setHistoryDate} />
          </div>
          <div className="p-4">
            <ActivityTimeline
              key={historyDate}
              entries={libraryHistory}
              pageSize={20}
              emptyText={
                historyDate
                  ? "Không có thao tác nào trong ngày đã chọn."
                  : "Chưa có thao tác nào trên thư viện được ghi nhận."
              }
            />
          </div>
        </Card>
      ) : (
        <>
          {/* Biểu đồ thống kê tình trạng hiệu lực của toàn thư viện */}
          <LegalStatsChart documents={legalItems} />

          <Card
            surface="flat"
            padding="none"
            rounded="lg"
            className="overflow-hidden border border-slate-200 shadow-xs bg-white"
          >
            {/* Hàng 1: tiêu đề · thêm văn bản */}
            <div className="flex items-start justify-between gap-3 px-4 pt-3.5">
              <div className="min-w-0">
                <h2 className="m-0 text-base font-bold text-slate-900">Văn bản pháp luật</h2>
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
                    setCategoryFilter(val as DocumentCategoryKey | "ALL");
                    setPage(1);
                  }}
                  className="h-9 w-full sm:w-52"
                  options={[
                    { value: "ALL", label: "Tất cả loại văn bản" },
                    ...categoryOptions.map((cat) => ({ value: cat, label: getCategoryLabel(cat) })),
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
                  <Pagination
                    current={currentPage}
                    pageSize={DEFAULT_LIST_PAGE_SIZE}
                    total={filteredItems.length}
                    onChange={setPage}
                    showSizeChanger={false}
                    size="small"
                  />
                </div>
              )}
            </div>

            {/* Danh sách văn bản (không gom nhóm) */}
            {pagedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
                <SearchOutlined className="mb-2 text-2xl text-slate-300" />
                <p className="m-0 text-sm font-semibold text-slate-700">
                  Không tìm thấy văn bản phù hợp
                </p>
                <p className="m-0 mt-1 text-xs text-slate-500">
                  Thử từ khóa khác hoặc bỏ bớt bộ lọc.
                </p>
                {isFiltering && (
                  <Button intent="outline" scale="compact" className="mt-3" onClick={resetFilters}>
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Tiêu đề cột — khớp độ rộng với từng dòng bên dưới */}
                <div
                  aria-hidden
                  className="hidden items-center gap-6 border-b border-slate-200 bg-slate-50/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:flex"
                >
                  <span className="w-40 shrink-0">Số hiệu</span>
                  <span className="w-32 shrink-0">Loại văn bản</span>
                  <span className="min-w-0 flex-1">Tên văn bản</span>
                  <span className="w-28 shrink-0 text-center">Tình trạng</span>
                  {canManageDocuments && <span className="ml-auto w-20 shrink-0 text-center">Thao tác</span>}
                </div>
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
                          className="group flex cursor-pointer flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50/80 focus-visible:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#DC2626]/40 md:flex-row md:items-center md:gap-6"
                        >
                          {/* Số hiệu · cơ quan ban hành */}
                          <div className="flex shrink-0 flex-col items-start gap-1 text-xs md:w-40">
                            <span className="font-semibold text-slate-800">{item.code}</span>
                            <span className="text-slate-500">{item.issuer}</span>
                          </div>

                          {/* Loại văn bản */}
                          <div className="shrink-0 md:w-32">
                            <span className="whitespace-nowrap rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                              {getCategoryLabel(item.category)}
                            </span>
                          </div>

                          {/* Tên văn bản */}
                          <p
                            title={item.title || item.code}
                            className="m-0 line-clamp-2 min-w-0 flex-1 text-[15px] font-bold leading-snug text-slate-900 transition-colors group-hover:text-[#DC2626]"
                          >
                            {item.title || item.code}
                          </p>

                          {/* Tình trạng văn bản */}
                          <div className="flex shrink-0 items-center justify-start md:w-28 md:justify-center">
                            <Tooltip title={`Tình trạng: ${status.label}`}>
                              <div className="inline-flex cursor-help items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1 md:border-0 md:bg-transparent md:p-0">
                                <span
                                  className={`inline-block h-3 w-3 rounded-full ${status.dotClass} shadow-xs ring-4 ring-slate-100`}
                                  aria-label={status.label}
                                />
                                <span className="text-xs font-medium text-slate-600 md:hidden">{status.label}</span>
                              </div>
                            </Tooltip>
                          </div>

                          {/* Thao tác: sửa (mở drawer chi tiết, sửa từng trường bằng bút chì) · xóa */}
                          {canManageDocuments && (
                            <div
                              className="flex shrink-0 items-center gap-1.5 md:ml-auto md:w-20 md:justify-center"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            >
                              <Tooltip title="Sửa văn bản">
                                <Button
                                  intent="outline"
                                  scale="xs"
                                  icon={<FormOutlined />}
                                  aria-label={`Sửa ${item.code}`}
                                  onClick={() => handleOpenDocDetail(item)}
                                  className="text-xs hover:border-[#DC2626]/40! hover:text-[#DC2626]!"
                                />
                              </Tooltip>
                              <Tooltip title="Xóa văn bản">
                                <Button
                                  intent="outline"
                                  scale="xs"
                                  icon={<DeleteOutlined />}
                                  aria-label={`Xóa ${item.code}`}
                                  onClick={() => confirmDeleteDocument(item)}
                                  className="text-xs text-rose-600! hover:border-rose-300! hover:bg-rose-50!"
                                />
                              </Tooltip>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </>
            )}
          </Card>
        </>
      )}

      {/* Drawer xem chi tiết văn bản (closable=false) */}
      <DocumentDetailDrawer
        open={Boolean(selectedDoc)}
        document={selectedDoc}
        onClose={() => setSelectedDoc(null)}
        onUpdate={canManageDocuments ? handleUpdateDocument : undefined}
        categoryOptions={categoryOptions.map((cat) => ({ value: cat, label: getCategoryLabel(cat) }))}
      />

      {/* Drawer thêm mới văn bản (closable=false) */}
      <CreateDocumentDrawer
        open={isCreateOpen}
        knownIssuers={legalItems.map((item) => item.issuer)}
        knownCategories={customCategories}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={(doc) => {
          const newItem: LegalItem = { ...doc, updatedAt: todayIso() };
          appendActivity({
            actorName: user?.displayName || user?.name || "Không rõ",
            actorRole: user?.roleName,
            module: LEGAL_LOG_MODULE,
            action: `Thêm văn bản: ${newItem.code}`,
            targetId: newItem.id,
            targetName: newItem.title || newItem.code,
            changes: [
              { label: "Loại văn bản", to: getCategoryLabel(newItem.category) },
              { label: "Cơ quan ban hành", to: newItem.issuer },
              { label: "Tình trạng", to: STATUS_META[newItem.status].label },
            ],
          });
          setLegalItems((prev) => [newItem, ...prev]);
          setRecentlyAddedIds((prev) => [newItem.id, ...prev]);
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
