"use client";

export function SortIcon({ direction }: { direction: "asc" | "desc" | null }) {
  return (
    <span className="inline-flex flex-col items-center justify-center shrink-0 w-3 h-3 text-[9px] leading-none select-none">
      <svg
        className={`w-2.5 h-2 transition-transform duration-150 -mb-[1px] ${
          direction === "asc"
            ? "text-[#DC2626] scale-125"
            : "text-slate-300 group-hover/col:text-slate-400"
        }`}
        viewBox="0 0 10 6"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M5 0.5L9.5 5.5H0.5L5 0.5Z" />
      </svg>
      <svg
        className={`w-2.5 h-2 transition-transform duration-150 -mt-[1px] ${
          direction === "desc"
            ? "text-[#DC2626] scale-125"
            : "text-slate-300 group-hover/col:text-slate-400"
        }`}
        viewBox="0 0 10 6"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M5 5.5L0.5 0.5H9.5L5 5.5Z" />
      </svg>
    </span>
  );
}

interface SortColumnHeaderProps {
  label: string;
  widthClass: string;
  align?: "left" | "center";
  currentSort?: string;
  onSortChange?: (sortKey: string) => void;
  sortKeys: {
    asc: string;
    desc: string;
    matches?: (sort: string) => boolean;
  };
  defaultSort?: "asc" | "desc";
  paddingClass?: string;
}

export function SortColumnHeader({
  label,
  widthClass,
  align = "left",
  currentSort = "",
  onSortChange,
  sortKeys,
  defaultSort = "asc",
  paddingClass = "px-3 py-2",
}: SortColumnHeaderProps) {
  const isAsc = currentSort === sortKeys.asc;
  const isDesc = currentSort === sortKeys.desc;
  const isMatched = sortKeys.matches ? sortKeys.matches(currentSort) : isAsc || isDesc;

  let direction: "asc" | "desc" | null = null;
  if (isAsc) direction = "asc";
  else if (isDesc) direction = "desc";
  else if (isMatched) {
    direction = currentSort.endsWith("_desc") ? "desc" : "asc";
  }

  const handleClick = () => {
    if (!onSortChange) return;
    if (direction === "asc") {
      onSortChange(sortKeys.desc);
    } else if (direction === "desc") {
      onSortChange(sortKeys.asc);
    } else {
      onSortChange(defaultSort === "desc" ? sortKeys.desc : sortKeys.asc);
    }
  };

  const title = !direction
    ? `Sắp xếp theo ${label.toLowerCase()}`
    : direction === "asc"
      ? `${label}: Đang tăng dần (A → Z, Thấp → Cao). Nhấp để chuyển sang giảm dần`
      : `${label}: Đang giảm dần (Z → A, Cao → Thấp). Nhấp để chuyển sang tăng dần`;

  return (
    <th
      scope="col"
      className={`${widthClass} ${paddingClass} group/col cursor-pointer transition-colors select-none hover:bg-slate-200/70 ${
        align === "center" ? "text-center" : "text-left"
      } ${direction ? "bg-red-50/70" : ""}`}
      onClick={handleClick}
      title={title}
      aria-sort={direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none"}
    >
      <div
        className={`inline-flex items-center gap-1.5 ${
          align === "center" ? "justify-center w-full" : ""
        }`}
      >
        <span
          className={`whitespace-nowrap transition-colors text-[11px] font-bold uppercase tracking-wider ${
            direction ? "text-[#DC2626] font-extrabold" : "text-slate-700 group-hover/col:text-slate-900"
          }`}
        >
          {label}
        </span>
        <SortIcon direction={direction} />
      </div>
    </th>
  );
}

export function PlainColumnHeader({
  label,
  widthClass,
  align = "left",
  paddingClass = "px-3 py-2",
}: {
  label: string;
  widthClass: string;
  align?: "left" | "center";
  paddingClass?: string;
}) {
  return (
    <th
      scope="col"
      className={`${widthClass} ${paddingClass} whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-slate-700 ${
        align === "center" ? "text-center" : "text-left"
      }`}
    >
      {label}
    </th>
  );
}
