"use client";

import { UnorderedListOutlined } from "@ant-design/icons";
import { Drawer } from "@/components/ui";
import type { ChapterItem } from "../types/legal-viewer.types";

interface TableOfContentsDrawerProps {
  open: boolean;
  onClose: () => void;
  chapters: ChapterItem[];
  onSelectArticle: (articleNumber: string) => void;
}

export default function TableOfContentsDrawer({
  open,
  onClose,
  chapters,
  onSelectArticle,
}: TableOfContentsDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="left"
      width={360}
      title={
        <div className="flex items-center gap-2">
          <UnorderedListOutlined className="text-[#DC2626]" />
          <span className="text-sm font-bold text-slate-800">Mục lục văn bản</span>
        </div>
      }
    >
      <div className="space-y-4 py-2">
        <p className="m-0 text-xs text-slate-500">
          Nhấp vào chương hoặc điều khoản để cuộn nhanh đến nội dung tương ứng:
        </p>

        <div className="space-y-3">
          {chapters.map((ch, chIdx) => (
            <div key={chIdx} className="rounded-md border border-slate-200 overflow-hidden">
              <div className="bg-slate-100/80 px-3 py-2 font-bold text-xs text-slate-800">
                {ch.number}: {ch.title}
              </div>
              <ul className="m-0 list-none p-1 divide-y divide-slate-100">
                {ch.articles.map((art, aIdx) => (
                  <li key={aIdx}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectArticle(art.number);
                        onClose();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:text-[#DC2626] hover:bg-slate-50 transition-colors flex items-center justify-between"
                    >
                      <span className="font-semibold">{art.number}</span>
                      <span className="truncate max-w-[190px] text-slate-500 text-[11px]">
                        {art.title}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Drawer>
  );
}
