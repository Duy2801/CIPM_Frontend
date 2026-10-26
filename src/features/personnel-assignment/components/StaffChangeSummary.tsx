export interface StaffFieldChange {
  label: string;
  from: unknown;
  to: unknown;
}

const isEmptyValue = (val: unknown) => val === undefined || val === null || val === "";

const renderValue = (val: unknown) =>
  isEmptyValue(val) ? <span className="italic text-slate-400">Trống</span> : String(val);

/** Nội dung hộp xác nhận lưu hồ sơ: liệt kê đúng những thông tin sẽ đổi (cũ → mới) */
export default function StaffChangeSummary({ staffName, changes }: { staffName: string; changes: StaffFieldChange[] }) {
  return (
    <div className="space-y-2.5 text-xs">
      <p className="m-0 text-slate-600">
        Bạn có đồng ý cập nhật {changes.length} thông tin sau cho cán bộ{" "}
        <strong className="text-slate-900">{staffName}</strong>?
      </p>
      <div className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
        {changes.map((c) => (
          <div key={c.label} className="flex flex-wrap items-baseline gap-x-1.5">
            <span className="font-semibold text-slate-700">{c.label}:</span>
            <span className="text-slate-500 line-through">{renderValue(c.from)}</span>
            <span className="text-slate-400">→</span>
            <span className="font-semibold text-[#DC2626]">{renderValue(c.to)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
