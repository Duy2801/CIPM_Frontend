"use client";

import type { ReactNode } from "react";
import { CheckOutlined, CloseOutlined, FileTextOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Drawer, STANDARD_DRAWER_WIDTH } from "@/components/ui";
import { formatDateVi } from "@/utils/date";
import { loadProjectProcedure } from "@/features/construction-procedures/utils/project-procedure-storage";
import { FlowBadge } from "@/features/projects_works/components/detail/ProcedureStepFlowDrawer";
import type { MyTask } from "../utils/my-tasks";

interface MyTaskDrawerProps {
  task: MyTask | null;
  canSubmit: boolean;
  canReview: boolean;
  onClose: () => void;
  onSubmit: (task: MyTask) => void;
  onApprove: (task: MyTask) => void;
  onReject: (task: MyTask) => void;
}

const date = (value?: string) => (value ? formatDateVi(value) : "—");

/** Chi tiết một việc: thông tin bước, tình trạng nộp / duyệt, hồ sơ và nhật ký; nút thao tác ở chân */
export default function MyTaskDrawer({ task, canSubmit, canReview, onClose, onSubmit, onApprove, onReject }: MyTaskDrawerProps) {
  const step = task?.step;
  const history = task
    ? (loadProjectProcedure(task.projectId)?.history ?? []).filter((log) => log.stepId === task.step.id).slice(0, 8)
    : [];

  return (
    <Drawer
      open={Boolean(task)}
      width={STANDARD_DRAWER_WIDTH}
      onClose={onClose}
      destroyOnHidden
      className="[&_.ant-drawer-body]:!p-0"
      title={
        task &&
        step && (
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-500">{step.code}</span>
              <FlowBadge step={step} />
              {task.overdue && (
                <span className="rounded-md bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">Quá hạn</span>
              )}
            </div>
            <div className="mt-0.5 text-sm font-semibold leading-snug text-slate-900">{step.name}</div>
          </div>
        )
      }
      footer={
        task && (canSubmit || canReview) ? (
          <div className="flex flex-wrap gap-2">
            {canSubmit && (
              <Button intent="primary" scale="sm" icon={<SendOutlined />} onClick={() => onSubmit(task)}
                className="!border-[#DC2626] !bg-[#DC2626] font-semibold hover:!bg-[#B91C1C]">
                {task.flow === "RETURNED" ? "Nộp lại kết quả" : "Nộp kết quả"}
              </Button>
            )}
            {canReview && (
              <>
                <Button intent="primary" scale="sm" icon={<CheckOutlined />} onClick={() => onApprove(task)}
                  className="!border-emerald-600 !bg-emerald-600 font-semibold hover:!bg-emerald-700">
                  Duyệt hoàn thành
                </Button>
                <Button intent="outline" scale="sm" icon={<CloseOutlined />} onClick={() => onReject(task)}
                  className="!border-rose-300 !text-rose-600 hover:!bg-rose-50">
                  Từ chối
                </Button>
              </>
            )}
          </div>
        ) : null
      }
    >
      {task && step && (
        <div className="space-y-4 p-5">
          <Section title="Công việc">
            <Fact label="Dự án" value={task.projectName} wide />
            <Fact label="Quy trình" value={task.procedureName} />
            <Fact label="Giai đoạn" value={`${step.groupCode}. ${step.groupTitle}`} />
            <Fact label="Người thực hiện" value={step.assignedTo || "—"} />
            <Fact label="Người giao" value={step.assignedBy ? `${step.assignedBy} · ${date(step.assignedAt)}` : "—"} />
            <Fact label="Bắt đầu kế hoạch" value={date(step.startDatePlanned)} />
            <Fact
              label="Hạn hoàn thành"
              value={<span className={task.overdue ? "text-rose-600" : undefined}>{date(step.endDatePlanned)}</span>}
            />
          </Section>

          <Section title="Nộp & duyệt">
            <Fact label="Nộp kết quả" value={step.submittedBy ? `${step.submittedBy} · ${date(step.submittedAt)}` : "Chưa nộp"} />
            <Fact label="Duyệt" value={step.approvedBy ? `${step.approvedBy} · ${date(step.approvedAt)}` : "—"} />
            {step.rejectedBy && <Fact label="Từ chối" value={`${step.rejectedBy} · ${date(step.rejectedAt)}`} />}
          </Section>

          {task.flow === "RETURNED" && step.rejectionReason && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              <strong className="mb-0.5 block">Bị từ chối, yêu cầu làm lại:</strong>
              {step.rejectionReason}
            </div>
          )}

          {step.submissionNote && (
            <section>
              <Heading>Ghi chú khi nộp</Heading>
              <p className="m-0 whitespace-pre-line rounded-lg border border-slate-200 px-3 py-2 text-xs leading-relaxed text-slate-700">
                {step.submissionNote}
              </p>
            </section>
          )}

          <section>
            <Heading>Hồ sơ đính kèm{step.attachments.length > 0 && ` (${step.attachments.length})`}</Heading>
            {step.attachments.length > 0 ? (
              <div className="space-y-1.5">
                {step.attachments.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-red-200 bg-red-50 text-[#DC2626]">
                      <FileTextOutlined className="text-xs" />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-slate-800" title={doc.fileName}>{doc.fileName}</div>
                      <div className="text-[10px] text-slate-400">
                        {doc.fileSize} · {doc.uploadedBy} · {date(doc.uploadedAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty>Chưa có hồ sơ</Empty>
            )}
          </section>

          <section>
            <Heading>Nhật ký bước</Heading>
            {history.length > 0 ? (
              <ol className="m-0 space-y-2 border-l-2 border-slate-100 pl-3">
                {history.map((log) => (
                  <li key={log.id} className="list-none text-xs">
                    <div className="flex flex-wrap items-center gap-x-2">
                      <span className="font-semibold text-slate-800">{log.actionLabel}</span>
                      <span className="font-mono text-[11px] text-slate-400">{log.timestamp}</span>
                    </div>
                    <div className="text-slate-600">{log.details}</div>
                  </li>
                ))}
              </ol>
            ) : (
              <Empty>Chưa có thao tác nào</Empty>
            )}
          </section>
        </div>
      )}
    </Drawer>
  );
}

function Heading({ children }: { children: ReactNode }) {
  return <h3 className="m-0 mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-600">{children}</h3>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <Heading>{title}</Heading>
      <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-lg border border-slate-200 bg-slate-50/60 p-3">{children}</dl>
    </section>
  );
}

function Fact({ label, value, wide }: { label: string; value: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2 min-w-0" : "min-w-0"}>
      <dt className="text-[11px] text-slate-500">{label}</dt>
      <dd className="m-0 mt-0.5 break-words text-xs font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 py-3 text-center text-xs text-slate-400">{children}</div>
  );
}
