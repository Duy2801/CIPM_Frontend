import type { ReactNode } from "react";

export function MyTaskHeading({ children }: { children: ReactNode }) {
  return <h3 className="m-0 mb-2 text-[11px] font-bold uppercase tracking-wide text-[#DC2626]">{children}</h3>;
}

export function MyTaskFact({ label, value, wide }: { label: string; value: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2 min-w-0" : "min-w-0"}>
      <dt className="text-[11px] text-slate-500">{label}</dt>
      <dd className="m-0 mt-0.5 break-words text-xs font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

export function MyTaskEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 py-3 text-center text-xs text-slate-400">{children}</div>
  );
}

export default function MyTaskSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <MyTaskHeading>{title}</MyTaskHeading>
      <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-lg border border-slate-200 bg-slate-50/60 p-3">{children}</dl>
    </section>
  );
}
