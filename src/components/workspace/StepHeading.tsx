/**
 * Tiêu đề một bước quy trình: mã bước (I.1) · tên bước trên cùng một hàng, cùng cỡ chữ và độ đậm,
 * cùng màu chữ đen — dùng chung cho mọi drawer bước.
 */
export default function StepHeading({ code, name }: { code: string; name: string }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 text-[15px] font-semibold leading-6">
      <span className="shrink-0 tabular-nums text-slate-900">{code}</span>
      <span className="text-slate-300" aria-hidden>
        ·
      </span>
      <span className="min-w-0 truncate text-slate-900" title={name}>
        {name}
      </span>
    </div>
  );
}
