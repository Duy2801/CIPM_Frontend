"use client";

import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Card } from "@/components/ui";
import type { ActivityItem } from "../constants/dashboard-mock-data";
import { resolveActivityTime } from "../constants/dashboard-mock-data";
import { buildActivityDetailFacts } from "../utils/activity-detail";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="m-0 mb-3 border-b border-slate-100 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-[#DC2626]">
      {children}
    </h3>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="text-[11px] font-medium text-slate-500">{label}</div>
      <div className="mt-0.5 text-xs font-semibold text-slate-800">{children}</div>
    </div>
  );
}

export default function ActivityDetailPage({ activity, onBack }: { activity: ActivityItem; onBack: () => void }) {
  const facts = buildActivityDetailFacts(activity);
  const { date, timeOfDay } = resolveActivityTime(activity.time);
  const initial = activity.actor.split(" ").slice(-1)[0]?.charAt(0) || "U";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <Button
          intent="outline"
          scale="compact"
          icon={<ArrowLeftOutlined />}
          aria-label="Quay lại Dashboard"
          title="Quay lại Dashboard"
          onClick={onBack}
          className="h-9! w-9! shrink-0 p-0!"
        />
        <h1 className="m-0 min-w-0 truncate text-base font-bold text-slate-900">
          Chi tiết nhật ký điều hành <span className="font-mono text-[#DC2626]">{activity.id}</span>
        </h1>
        {activity.status && (
          <span className="rounded border border-red-200/60 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
            {activity.status}
          </span>
        )}
      </div>

      <Card surface="workspace" padding="none" rounded="lg" className="border border-slate-200/80 shadow-xs">
        <div className="space-y-5 p-5">
          <section>
            <SectionTitle>Người thực hiện</SectionTitle>
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-200/60 bg-red-100/80 text-sm font-bold text-[#DC2626]">
                {initial}
              </div>
              <div className="grid min-w-0 flex-1 grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
                <Field label="Họ và tên">
                  <span className="text-sm text-slate-900">{activity.actor}</span>
                </Field>
                <Field label="Chức danh / Đơn vị">
                  {activity.actorTitle || "Cán bộ chuyên môn"}
                  <div className="font-normal text-slate-500">{activity.actorDepartment || "Ban QLDA Đầu tư Xây dựng"}</div>
                </Field>
                <Field label="Số điện thoại">
                  <span className="font-mono">{activity.actorPhone || "—"}</span>
                </Field>
                <Field label="Email">{activity.actorEmail || "—"}</Field>
              </div>
            </div>
          </section>

          <section>
            <SectionTitle>Dự án & công trình liên quan</SectionTitle>
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
              <Field label="Tên dự án" className="sm:col-span-2 xl:col-span-3">
                <span className="text-sm text-slate-900">{activity.projectName || "Dự án trực thuộc Ban QLDA ĐTXD"}</span>
              </Field>
              <Field label="Mã dự án">
                <span className="font-mono">{activity.projectCode || "Đang cập nhật"}</span>
              </Field>
              <Field label="Giai đoạn dự án">
                <span className="text-[#DC2626]">{activity.projectStage || "Đang thực hiện"}</span>
              </Field>
              <Field label="Địa điểm">{activity.projectLocation || "—"}</Field>
              {activity.packageItem && (
                <Field label="Gói thầu / Hạng mục" className="sm:col-span-2 xl:col-span-3">
                  {activity.packageItem}
                </Field>
              )}
            </div>
          </section>

          <section>
            <SectionTitle>Nội dung điều hành & bổ sung</SectionTitle>
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
              <Field label="Thời điểm">
                <span className="font-mono">
                  {date} · {timeOfDay}
                </span>
              </Field>
              {facts.map((fact) => (
                <Field key={fact.label} label={fact.label}>
                  {fact.value}
                </Field>
              ))}
              <Field label="Nội dung chi tiết đã thực hiện" className="sm:col-span-2 xl:col-span-3">
                <div className="mt-1 rounded-lg border border-slate-100 bg-slate-50/60 p-3 font-medium leading-relaxed">
                  {activity.content}
                </div>
              </Field>
            </div>
          </section>
        </div>
      </Card>
    </div>
  );
}
