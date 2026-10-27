"use client";

import { TagOutlined } from "@ant-design/icons";
import { InlineEditField } from "@/components/workspace";

interface DocumentTagsSectionProps {
  tags: string[];
  changed: boolean;
  /** Ghi danh sách từ khóa mới vào bản nháp; không truyền = chỉ xem */
  onChange?: (tags: string[]) => void;
}

/** Từ khóa tra cứu — sửa dạng "từ khóa 1, từ khóa 2" (bỏ trùng, bỏ ô trống) */
export default function DocumentTagsSection({ tags, changed, onChange }: DocumentTagsSectionProps) {
  if (tags.length === 0 && !onChange) return null;

  return (
    <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4">
      <InlineEditField
        label="Từ khóa tra cứu"
        changed={changed}
        labelNode={
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <TagOutlined className="text-[#DC2626]" />
            Từ khóa tra cứu
          </span>
        }
        allowEmpty
        value={tags.join(", ")}
        editor={{ kind: "text", placeholder: "Các từ khóa, cách nhau bằng dấu phẩy" }}
        display={
          tags.length > 0 ? (
            <ul className="m-0 mt-2 flex list-none flex-wrap gap-1.5 p-0 font-normal">
              {tags.map((tag) => (
                <li key={tag} className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs text-slate-600">
                  {tag}
                </li>
              ))}
            </ul>
          ) : (
            <span className="mt-1 block font-normal italic text-slate-400">Chưa có từ khóa.</span>
          )
        }
        onSave={
          onChange &&
          ((next) =>
            onChange([
              ...new Set(
                next
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              ),
            ]))
        }
      />
    </div>
  );
}
