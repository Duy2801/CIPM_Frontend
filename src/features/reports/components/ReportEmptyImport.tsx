import { InboxOutlined } from "@ant-design/icons";

export default function ReportEmptyImport({ onPickFile }: { onPickFile: () => void }) {
  return (
    <button
      type="button"
      onClick={onPickFile}
      className="flex min-h-[320px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white text-slate-500 hover:border-[#DC2626]/50 hover:text-[#DC2626]"
    >
      <InboxOutlined className="text-4xl text-slate-300" />
      <span className="text-sm font-semibold">Chưa có báo cáo. Nhấn hoặc kéo thả tệp Excel vào đây.</span>
    </button>
  );
}
