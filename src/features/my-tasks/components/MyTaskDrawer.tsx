"use client";

import { useState, type ReactNode } from "react";
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import {
  Button,
  Drawer,
  Input,
  STANDARD_DRAWER_WIDTH,
  StandardFileUpload,
  Tooltip,
  type UploadedAttachment,
} from "@/components/ui";
import { formatDateVi } from "@/utils/date";
import { loadProjectProcedure } from "@/features/construction-procedures/utils/project-procedure-storage";
import type { ProcedureDocument } from "@/features/construction-procedures/types/procedure.types";
import { FlowBadge } from "@/features/projects_works/components/detail/ProcedureStepFlowDrawer";
import type { MyTask } from "../utils/my-tasks";

const NOT_APPLICABLE = "Chưa áp dụng ở trạng thái này";

/** Thao tác của người thực hiện khi đang làm bước (trả về false nếu lưu không được) */
export interface TaskWorkActions {
  onSaveNote: (task: MyTask, note: string) => boolean;
  onAddFiles: (task: MyTask, files: UploadedAttachment[]) => void;
  onRemoveFile: (task: MyTask, doc: ProcedureDocument) => void;
}

interface MyTaskDrawerProps {
  task: MyTask | null;
  canSubmit: boolean;
  canReview: boolean;
  canAccept: boolean;
  canReportIncident: boolean;
  canResolveIncident: boolean;
  canDecline: boolean;
  canGiveBack: boolean;
  meName: string;
  work: TaskWorkActions;
  onClose: () => void;
  onSubmit: (task: MyTask) => void;
  onApprove: (task: MyTask) => void;
  onReject: (task: MyTask) => void;
  onAccept: (task: MyTask) => void;
  onReportIncident: (task: MyTask) => void;
  onResolveIncident: (task: MyTask) => void;
  onDecline: (task: MyTask) => void;
  onGiveBack: (task: MyTask) => void;
}

const date = (value?: string) => (value ? formatDateVi(value) : "—");

/** Chi tiết một việc: thông tin bước, tình trạng nộp / duyệt, hồ sơ và nhật ký; nút thao tác ở chân */
export default function MyTaskDrawer({
  task,
  canSubmit,
  canReview,
  canAccept,
  canReportIncident,
  canResolveIncident,
  canDecline,
  canGiveBack,
  meName,
  work,
  onClose,
  onSubmit,
  onApprove,
  onReject,
  onAccept,
  onReportIncident,
  onResolveIncident,
  onDecline,
  onGiveBack,
}: MyTaskDrawerProps) {
  // Chân drawer: thao tác chính; Từ chối / Báo cáo sự cố đặt ở góc phải tiêu đề
  const hasActions = canSubmit || canReview || canAccept || canResolveIncident || canGiveBack;
  const step = task?.step;
  const history = task
    ? (loadProjectProcedure(task.projectId)?.history ?? []).filter((log) => log.stepId === task.step.id).slice(0, 8)
    : [];

  return (
    <Drawer
      open={Boolean(task)}
      width={STANDARD_DRAWER_WIDTH}
      onClose={onClose}
      closable={false}
      destroyOnHidden
      className="[&_.ant-drawer-body]:!p-0"
      title={
        task &&
        step && (
          <div className="flex min-w-0 items-start gap-3">
            <Tooltip title="Quay lại">
              <button
                type="button"
                aria-label="Quay lại"
                onClick={onClose}
                className="mt-0.5 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              >
                <ArrowLeftOutlined className="text-sm" />
              </button>
            </Tooltip>
            <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-500">{step.code}</span>
              <FlowBadge step={step} />
              {!task.reached && (
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                  Chưa tới lượt
                </span>
              )}
            </div>
            <div className="mt-0.5 text-sm font-semibold leading-snug text-slate-900">{step.name}</div>
            </div>
            {/* Luôn hiện ở mọi cột; trạng thái chưa áp dụng thì mờ, không bấm được */}
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <Tooltip title={canReportIncident ? undefined : NOT_APPLICABLE}>
                <span>
                  <Button intent="outline" scale="sm" disabled={!canReportIncident} onClick={() => onReportIncident(task)}
                    className={canReportIncident ? "!border-orange-300 !text-orange-600 hover:!bg-orange-50" : ""}>
                    Báo cáo sự cố
                  </Button>
                </span>
              </Tooltip>
              <Tooltip
                title={
                  canReview
                    ? "Trả kết quả về cho người thực hiện làm lại"
                    : canDecline
                      ? "Không làm việc này, trả về Tổ trưởng để giao người khác (giữ ghi chú và hồ sơ)"
                      : NOT_APPLICABLE
                }
              >
                <span>
                  <Button intent="outline" scale="sm" disabled={!canReview && !canDecline}
                    onClick={() => (canReview ? onReject(task) : onDecline(task))}
                    className={canReview || canDecline ? "!border-rose-300 !text-rose-600 hover:!bg-rose-50" : ""}>
                    Từ chối
                  </Button>
                </span>
              </Tooltip>
            </div>
          </div>
        )
      }
      footer={
        task && hasActions ? (
          <div className="flex flex-wrap gap-2">
            {canAccept && (
              <Button intent="primary" scale="sm" onClick={() => onAccept(task)}
                className="!border-[#DC2626] !bg-[#DC2626] font-semibold hover:!bg-[#B91C1C]">
                Tiếp nhận
              </Button>
            )}
            {canResolveIncident && (
              <Button intent="primary" scale="sm" onClick={() => onResolveIncident(task)}
                className="!border-emerald-600 !bg-emerald-600 font-semibold hover:!bg-emerald-700">
                Đã xử lý sự cố
              </Button>
            )}
            {canSubmit && (
              <Button intent="primary" scale="sm" onClick={() => onSubmit(task)}
                className="!border-[#DC2626] !bg-[#DC2626] font-semibold hover:!bg-[#B91C1C]">
                {task.flow === "RETURNED" ? "Nộp lại kết quả" : "Nộp kết quả"}
              </Button>
            )}
            {canReview && (
              <Button intent="primary" scale="sm" onClick={() => onApprove(task)}
                className="!border-emerald-600 !bg-emerald-600 font-semibold hover:!bg-emerald-700">
                Duyệt hoàn thành
              </Button>
            )}
            {canGiveBack && (
              <Tooltip title="Rút kết quả đã nộp, đưa việc về Đang xử lý để làm tiếp (giữ ghi chú và hồ sơ)">
                <Button intent="outline" scale="sm" onClick={() => onGiveBack(task)}
                  className="!border-slate-300 !text-slate-600 hover:!bg-slate-50">
                  Hoàn trả
                </Button>
              </Tooltip>
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
            <Fact label="Người thực hiện" value={step.assignedTo || "—"} wide />
            <Fact label="Bắt đầu kế hoạch" value={date(step.startDatePlanned)} />
            <Fact
              label="Hạn hoàn thành"
              value={date(step.endDatePlanned)}
            />
          </Section>

          <Section title="Nộp & duyệt">
            <Fact label="Nộp kết quả" value={step.submittedBy ? `${step.submittedBy} · ${date(step.submittedAt)}` : "Chưa nộp"} />
            <Fact
              label="Duyệt"
              value={
                task.flow === "COMPLETED" && step.approvedBy
                  ? `${step.approvedBy} · ${date(step.approvedAt)}`
                  : task.flow === "AWAITING_APPROVAL"
                    ? "Đang chờ duyệt"
                    : "—"
              }
            />
            {step.rejectedBy && <Fact label="Từ chối" value={`${step.rejectedBy} · ${date(step.rejectedAt)}`} />}
          </Section>

          {step.incidentReason && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-700">
              <strong className="mb-0.5 block">
                Sự cố{step.incidentReportedBy ? ` · ${step.incidentReportedBy}` : ""}
                {step.incidentReportedAt ? ` · ${date(step.incidentReportedAt)}` : ""}
              </strong>
              {step.incidentReason}
            </div>
          )}

          {task.flow === "RETURNED" && step.rejectionReason && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              <strong className="mb-0.5 block">Bị từ chối, yêu cầu làm lại:</strong>
              {step.rejectionReason}
            </div>
          )}

          {canSubmit ? (
            <WorkSection key={step.id} task={task} meName={meName} work={work} />
          ) : (
            <>
              <section>
                <Heading>Ghi chú</Heading>
                {step.submissionNote ? (
                  <p className="m-0 whitespace-pre-line rounded-lg border border-slate-200 px-3 py-2 text-xs leading-relaxed text-slate-700">
                    {step.submissionNote}
                  </p>
                ) : (
                  <Empty>Chưa có ghi chú</Empty>
                )}
              </section>
              <section>
                <Heading>Hồ sơ đính kèm{step.attachments.length > 0 && ` (${step.attachments.length})`}</Heading>
                {step.attachments.length > 0 ? (
                  <AttachmentList task={task} />
                ) : (
                  <Empty>Chưa có hồ sơ</Empty>
                )}
              </section>
            </>
          )}

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

/**
 * Khu làm việc của người thực hiện khi bước đang làm / bị trả lại:
 * ghi chú (tự lưu khi rời ô) và hồ sơ (thêm là lưu ngay vào bước, gỡ được tệp mình đã thêm).
 */
function WorkSection({ task, meName, work }: { task: MyTask; meName: string; work: TaskWorkActions }) {
  const saved = task.step.submissionNote ?? "";
  const [note, setNote] = useState(saved);
  const [justSaved, setJustSaved] = useState(false);
  const dirty = note.trim() !== saved.trim();

  const saveNote = () => {
    if (!dirty) return;
    if (work.onSaveNote(task, note)) setJustSaved(true);
  };

  return (
    <section className="space-y-3 rounded-lg border border-slate-200 p-3">
      <Heading>Kết quả thực hiện</Heading>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700" htmlFor={`note-${task.step.id}`}>
            Ghi chú
          </label>
          <span className="text-[11px] text-slate-400">
            {dirty ? "Chưa lưu" : justSaved ? "Đã lưu" : "Tự lưu khi rời ô"}
          </span>
        </div>
        <Input.TextArea
          id={`note-${task.step.id}`}
          rows={3}
          value={note}
          maxLength={1000}
          showCount
          placeholder="Ghi lại tiến độ, nội dung đã làm, vướng mắc..."
          onChange={(e) => {
            setNote(e.target.value);
            setJustSaved(false);
          }}
          onBlur={saveNote}
        />
      </div>

      <div>
        <div className="mb-1 text-xs font-semibold text-slate-700">
          Hồ sơ{task.step.attachments.length > 0 && ` (${task.step.attachments.length})`}
        </div>
        {task.step.attachments.length > 0 && (
          <div className="mb-2">
            <AttachmentList
              task={task}
              canRemove={(doc) => doc.uploadedBy === meName}
              onRemove={(doc) => work.onRemoveFile(task, doc)}
            />
          </div>
        )}
        <StandardFileUpload
          hideHeader
          promptText="Nhấn hoặc kéo thả để thêm hồ sơ"
          value={[]}
          onChange={(files) => work.onAddFiles(task, files)}
        />
      </div>
    </section>
  );
}

function AttachmentList({
  task,
  canRemove,
  onRemove,
}: {
  task: MyTask;
  canRemove?: (doc: ProcedureDocument) => boolean;
  onRemove?: (doc: ProcedureDocument) => void;
}) {
  return (
    <div className="space-y-1.5">
      {task.step.attachments.map((doc) => (
        <div key={doc.id} className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-red-200 bg-red-50 text-[#DC2626]">
            <FileTextOutlined className="text-xs" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-slate-800" title={doc.fileName}>{doc.fileName}</div>
            <div className="text-[10px] text-slate-400">
              {doc.fileSize} · {doc.uploadedBy} · {date(doc.uploadedAt)}
            </div>
          </div>
          {onRemove && canRemove?.(doc) && (
            <Tooltip title="Gỡ hồ sơ">
              <button
                type="button"
                aria-label={`Gỡ ${doc.fileName}`}
                onClick={() => onRemove(doc)}
                className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-transparent text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              >
                <DeleteOutlined className="text-xs" />
              </button>
            </Tooltip>
          )}
        </div>
      ))}
    </div>
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
