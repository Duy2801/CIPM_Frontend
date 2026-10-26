"use client";

import { useMemo, useState } from "react";
import {
  BellOutlined,
  BookOutlined,
  CheckOutlined,
  CommentOutlined,
  CopyOutlined,
  DiffOutlined,
  EyeOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  InfoCircleOutlined,
  PrinterOutlined,
  QuestionCircleOutlined,
  SaveOutlined,
  SearchOutlined,
  SwapOutlined,
  TranslationOutlined,
  UnorderedListOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Button, Input, Tooltip } from "@/components/ui";
import { App } from "antd";
import type {
  DetailedLegalDocument,
  LegalViewerTab,
  RelatedDocumentItem,
} from "../types/legal-viewer.types";
import {
  MOCK_CONSTRUCTION_LAW_2014,
  MOCK_LABOR_CODE_2019,
  POPULAR_LEGAL_DOCUMENTS,
} from "../constants/legal-viewer-data";

// Các tab views
import TabOverview from "./tabs/TabOverview";
import TabContent from "./tabs/TabContent";
import TabOriginalPdf from "./tabs/TabOriginalPdf";
import TabEnglish from "./tabs/TabEnglish";
import TabValidity from "./tabs/TabValidity";
import TabRelatedDocs from "./tabs/TabRelatedDocs";
import TabDiagram from "./tabs/TabDiagram";
import TabConsolidated from "./tabs/TabConsolidated";
import TabDownload from "./tabs/TabDownload";

// Modals
import ColorGuideModal from "./ColorGuideModal";
import CompareDocumentModal from "./CompareDocumentModal";
import TableOfContentsDrawer from "./TableOfContentsDrawer";
import AdvancedSearchModal, { type AdvancedSearchCriteria } from "./AdvancedSearchModal";
import NoteModal from "./NoteModal";
import ReportErrorModal from "./ReportErrorModal";

interface LegalDocumentViewerProps {
  initialDocumentCode?: string;
  onOpenAssistantWithPrompt?: (prompt: string) => void;
  onBackToList?: () => void;
}

export default function LegalDocumentViewer({
  initialDocumentCode = "45/2019/QH14",
  onOpenAssistantWithPrompt,
  onBackToList,
}: LegalDocumentViewerProps) {
  const { message } = App.useApp();
  // Văn bản đang xem
  const [selectedDocCode, setSelectedDocCode] = useState<string>(initialDocumentCode);
  const currentDoc: DetailedLegalDocument = useMemo(() => {
    const found = POPULAR_LEGAL_DOCUMENTS.find(
      (d) => d.code === selectedDocCode || d.id === selectedDocCode,
    );
    return found || MOCK_LABOR_CODE_2019;
  }, [selectedDocCode]);

  // Tab đang hoạt động
  const [activeTab, setActiveTab] = useState<LegalViewerTab>("overview");

  // Tìm kiếm trên thanh header
  const [searchQuery, setSearchQuery] = useState("");

  // Trạng thái toggles
  const [isBilingual, setIsBilingual] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);

  // Modals state
  const [isColorGuideOpen, setIsColorGuideOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [noteTarget, setNoteTarget] = useState<string | undefined>(undefined);
  const [isReportErrorOpen, setIsReportErrorOpen] = useState(false);

  // Xử lý tìm kiếm
  const handleSearch = () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      message.info("Vui lòng nhập nội dung cần tìm kiếm.");
      return;
    }
    // Tìm trong danh sách văn bản mẫu
    const matched = POPULAR_LEGAL_DOCUMENTS.find(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.shortTitle.toLowerCase().includes(q),
    );
    if (matched) {
      setSelectedDocCode(matched.code);
      message.success(`Đã mở văn bản: ${matched.shortTitle}`);
    } else {
      message.info(`Tìm kiếm: "${searchQuery}". Chuyển sang lọc danh mục.`);
    }
  };

  const handleAdvancedSearch = (criteria: AdvancedSearchCriteria) => {
    message.success(
      `Đã áp dụng bộ lọc nâng cao (${criteria.keyword || criteria.code || "Tất cả"}).`,
    );
  };

  const handleToggleSave = () => {
    setIsSaved(!isSaved);
    if (!isSaved) {
      message.success(`Đã lưu "${currentDoc.shortTitle}" vào Tủ sách pháp lý cá nhân.`);
    } else {
      message.info(`Đã bỏ lưu "${currentDoc.shortTitle}".`);
    }
  };

  const handleToggleFollow = () => {
    setIsFollowed(!isFollowed);
    if (!isFollowed) {
      message.success(`Đang theo dõi cập nhật hiệu lực mới của "${currentDoc.shortTitle}".`);
    } else {
      message.info(`Đã hủy theo dõi văn bản "${currentDoc.shortTitle}".`);
    }
  };

  const handleAskAiAboutDoc = () => {
    const prompt = `Tôi đang xem văn bản: ${currentDoc.title} (Số hiệu: ${currentDoc.code}, Lĩnh vực: ${currentDoc.field}, Hiệu lực: ${currentDoc.effectiveDate}). Hãy tóm tắt cho tôi các điểm trọng tâm cần lưu ý khi áp dụng trong hoạt động của Ban QLDA?`;
    if (onOpenAssistantWithPrompt) {
      onOpenAssistantWithPrompt(prompt);
    } else {
      message.info("Đang kết nối tới Trợ lý CIPM AI...");
    }
  };

  const handleAskAiSpecificArticle = (articleText: string) => {
    if (onOpenAssistantWithPrompt) {
      onOpenAssistantWithPrompt(articleText);
    }
  };

  const handleOpenNoteForArticle = (targetName: string) => {
    setNoteTarget(targetName);
    setIsNoteOpen(true);
  };

  // Cuộn đến điều khoản từ Mục lục
  const handleScrollToArticle = (artNumber: string) => {
    setActiveTab("content");
    setTimeout(() => {
      const el = document.getElementById(`art-${artNumber.replace(/\s+/g, "-")}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-[#DC2626]");
        setTimeout(() => el.classList.remove("ring-2", "ring-[#DC2626]"), 2000);
      }
    }, 150);
  };

  // Danh sách các tab chuẩn Thư Viện Pháp Luật
  const TABS_CONFIG: { key: LegalViewerTab; label: string; hasInfo?: boolean; isDownload?: boolean }[] = [
    { key: "overview", label: "Tổng quan" },
    { key: "content", label: "Nội dung" },
    { key: "original", label: "VB gốc" },
    { key: "english", label: "Tiếng Anh" },
    { key: "validity", label: "Hiệu lực" },
    { key: "related", label: "VB liên quan" },
    { key: "diagram", label: "Lược đồ" },
    { key: "consolidated", label: "Nội dung hợp nhất", hasInfo: true },
    { key: "download", label: "Tải về", isDownload: true },
  ];

  return (
    <div className="w-full max-w-[2560px] mx-auto space-y-4">
      {/* ================= PHẦN 1: THANH TÌM KIẾM ================= */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
        {/* Thanh tìm kiếm pháp lý lớn chuẩn Thư Viện Pháp Luật */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onPressEnter={handleSearch}
              placeholder="Nhập nội dung cần tìm (số hiệu, tên luật, nghị định, từ khóa pháp lý)..."
              className="h-10 text-xs sm:text-sm !border-slate-300 hover:!border-[#DC2626] focus:!border-[#DC2626]"
              allowClear
            />
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <Button
              intent="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              className="!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C] text-white h-10 px-6 text-xs sm:text-sm font-bold shadow-xs cursor-pointer flex-1 sm:flex-initial"
            >
              Tìm kiếm
            </Button>

            <button
              type="button"
              onClick={() => setIsAdvancedSearchOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#DC2626] transition-colors cursor-pointer shrink-0"
            >
              <SearchOutlined className="text-slate-400" />
              <span>Tìm nâng cao</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= PHẦN 2: TIÊU ĐỀ VĂN BẢN & TAB NAVIGATION ================= */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Dãy Tab chính chuẩn Thư Viện Pháp Luật */}
        <div className="border-b border-slate-200 bg-slate-50/70 overflow-x-auto scrollbar-thin">
          <div className="flex items-center min-w-max px-2">
            {TABS_CONFIG.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center gap-1.5 px-4 py-3 text-xs sm:text-sm font-semibold transition-colors cursor-pointer border-b-2 ${
                    isActive
                      ? "border-[#DC2626] text-[#DC2626] bg-white"
                      : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.hasInfo && (
                    <InfoCircleOutlined className="text-[11px] text-slate-400" />
                  )}
                  {tab.isDownload && (
                    <span className="text-[10px] text-slate-400">ᨆ</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Thanh Quick Action Bar (So sánh VB, Song ngữ, Lưu, Theo dõi, Ghi chú, In, Hỏi AI) */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5 bg-white text-xs">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Khi ở Tab Nội dung: Nút Mục lục */}
            {activeTab === "content" && (
              <button
                type="button"
                onClick={() => setIsTocOpen(true)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors"
              >
                <UnorderedListOutlined className="text-[#DC2626]" />
                <span>Mục lục</span>
              </button>
            )}

            {/* So sánh VB */}
            <button
              type="button"
              onClick={() => setIsCompareOpen(true)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors"
            >
              <SwapOutlined className="text-[#DC2626]" />
              <span className="text-[#DC2626] font-semibold">So sánh VB</span>
            </button>

            {/* VB song ngữ */}
            <button
              type="button"
              onClick={() => {
                setIsBilingual(!isBilingual);
                if (!isBilingual) {
                  setActiveTab("content");
                  message.success("Đã bật chế độ xem song ngữ Tiếng Việt - Tiếng Anh!");
                } else {
                  message.info("Đã tắt chế độ xem song ngữ.");
                }
              }}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                isBilingual
                  ? "border-red-300 bg-red-50 text-[#DC2626] font-semibold"
                  : "border-slate-200 bg-white text-[#DC2626] hover:bg-slate-50"
              }`}
            >
              <TranslationOutlined />
              <span>VB song ngữ</span>
            </button>

            {/* Lưu */}
            <button
              type="button"
              onClick={handleToggleSave}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                isSaved
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <SaveOutlined className={isSaved ? "text-emerald-600" : "text-slate-400"} />
              <span>{isSaved ? "Đã lưu" : "Lưu"}</span>
            </button>

            {/* Theo dõi VB */}
            <button
              type="button"
              onClick={handleToggleFollow}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                isFollowed
                  ? "border-blue-300 bg-blue-50 text-blue-800 font-semibold"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <EyeOutlined className={isFollowed ? "text-blue-600" : "text-slate-400"} />
              <span>{isFollowed ? "Đang theo dõi" : "Theo dõi VB"}</span>
            </button>

            {/* Ghi chú */}
            <button
              type="button"
              onClick={() => {
                setNoteTarget(undefined);
                setIsNoteOpen(true);
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors"
            >
              <CommentOutlined className="text-slate-400" />
              <span>Ghi chú</span>
            </button>

            {/* Báo lỗi */}
            <button
              type="button"
              onClick={() => setIsReportErrorOpen(true)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors"
            >
              <WarningOutlined className="text-amber-500" />
              <span>Báo lỗi</span>
            </button>

            {/* In */}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors"
            >
              <PrinterOutlined className="text-slate-400" />
              <span>In</span>
            </button>
          </div>

          {/* Nút đặc biệt: HỎI AILUAT / CIPM AI */}
          <button
            type="button"
            onClick={handleAskAiAboutDoc}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-blue-400 bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 hover:from-blue-100 hover:to-indigo-100 px-3.5 py-1.5 text-xs font-bold text-blue-800 shadow-2xs transition-all hover:shadow-xs"
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white text-[10px]">
              ?
            </span>
            <span>Hỏi CIPM AI</span>
          </button>
        </div>

        {/* Nội dung chính của Tab đang chọn */}
        <div className="p-4 sm:p-6 bg-slate-50/30 min-h-[600px]">
          {activeTab === "overview" && (
            <TabOverview
              document={currentDoc}
              onNavigateTab={setActiveTab}
              onSelectKeyword={(kw) => {
                setSearchQuery(kw);
                message.info(`Đã chọn từ khóa: "${kw}". Bấm Tìm kiếm để tra cứu.`);
              }}
            />
          )}

          {activeTab === "content" && (
            <TabContent
              document={currentDoc}
              isBilingual={isBilingual}
              onAskAiArticle={handleAskAiSpecificArticle}
              onAddNoteArticle={handleOpenNoteForArticle}
            />
          )}

          {activeTab === "original" && <TabOriginalPdf document={currentDoc} />}

          {activeTab === "english" && <TabEnglish document={currentDoc} />}

          {activeTab === "validity" && (
            <TabValidity
              document={currentDoc}
              onNavigateTab={setActiveTab}
              onOpenColorGuide={() => setIsColorGuideOpen(true)}
              onSelectDocumentCode={(code) => {
                setSelectedDocCode(code);
                setActiveTab("overview");
              }}
            />
          )}

          {activeTab === "related" && (
            <TabRelatedDocs
              document={currentDoc}
              onNavigateTab={setActiveTab}
              onOpenColorGuide={() => setIsColorGuideOpen(true)}
              onSelectDocumentItem={(relItem: RelatedDocumentItem) => {
                setSelectedDocCode(relItem.code);
                message.info(`Đang mở văn bản liên quan: ${relItem.title}`);
              }}
            />
          )}

          {activeTab === "diagram" && (
            <TabDiagram
              document={currentDoc}
              onOpenColorGuide={() => setIsColorGuideOpen(true)}
              onSelectDocumentCode={(code) => {
                setSelectedDocCode(code);
                setActiveTab("overview");
              }}
            />
          )}

          {activeTab === "consolidated" && <TabConsolidated document={currentDoc} />}

          {activeTab === "download" && <TabDownload document={currentDoc} />}
        </div>
      </div>

      {/* ================= MODALS & DRAWERS TIỆN ÍCH ================= */}
      <ColorGuideModal
        open={isColorGuideOpen}
        onClose={() => setIsColorGuideOpen(false)}
      />

      <CompareDocumentModal
        open={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        currentTitle={currentDoc.shortTitle}
        currentCode={currentDoc.code}
      />

      <TableOfContentsDrawer
        open={isTocOpen}
        onClose={() => setIsTocOpen(false)}
        chapters={currentDoc.chapters}
        onSelectArticle={handleScrollToArticle}
      />

      <AdvancedSearchModal
        open={isAdvancedSearchOpen}
        onClose={() => setIsAdvancedSearchOpen(false)}
        onSearch={handleAdvancedSearch}
      />

      <NoteModal
        open={isNoteOpen}
        onClose={() => setIsNoteOpen(false)}
        documentTitle={currentDoc.title}
        initialTarget={noteTarget}
      />

      <ReportErrorModal
        open={isReportErrorOpen}
        onClose={() => setIsReportErrorOpen(false)}
        documentTitle={currentDoc.title}
      />
    </div>
  );
}
