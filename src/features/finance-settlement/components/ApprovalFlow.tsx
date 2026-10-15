"use client";

import {
  CheckOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import { Flex, Tag, Text } from "@/components/ui";
import { APPROVAL_STAGES } from "../constants/finance-labels";
import type { Disbursement, TreasuryAccount } from "../types/finance.types";
import {
  getApprovalStageViewModel,
  type ApprovalStageState,
} from "./approval-flow.model";

interface ApprovalFlowProps {
  disbursement: Disbursement;
  treasuryAccount?: TreasuryAccount;
}

const STAGE_STYLES: Record<
  ApprovalStageState,
  {
    card: string;
    label: string;
    tagClass: string;
  }
> = {
  done: {
    card: "border-slate-200/90 bg-white shadow-2xs",
    label: "Đã xử lý",
    tagClass: "!bg-slate-100 !text-slate-700 !border-slate-200",
  },
  rejected: {
    card: "border-rose-300 bg-rose-50/50 shadow-2xs",
    label: "Đã trả lại",
    tagClass: "!bg-rose-50 !text-rose-700 !border-rose-200",
  },
  current: {
    card: "border-amber-300 bg-amber-50/50 ring-1 ring-amber-300 shadow-2xs",
    label: "Đang chờ xử lý",
    tagClass: "!bg-amber-50 !text-amber-800 !border-amber-200",
  },
  waiting: {
    card: "border-slate-200/80 bg-slate-50/60 opacity-80",
    label: "Chưa tới lượt",
    tagClass: "!bg-slate-50 !text-slate-500 !border-slate-200",
  },
};

export default function ApprovalFlow({ disbursement, treasuryAccount }: ApprovalFlowProps) {
  return (
    <section className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4 sm:p-5">
      <Flex justify="space-between" align="center" wrap="wrap" gap="small" className="mb-3.5">
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Luồng duyệt 2 cấp · {disbursement.code}
        </Text>
        {treasuryAccount && (
          <Text className="text-[11px] text-slate-500">
            Chi qua TK <strong className="text-slate-700">{treasuryAccount.number}</strong> ({treasuryAccount.label})
          </Text>
        )}
      </Flex>

      <ol className="m-0 flex flex-col gap-2.5 list-none p-0">
        {APPROVAL_STAGES.map((stage, index) => {
          const { state, event, note } = getApprovalStageViewModel(disbursement, stage.role);
          const style = STAGE_STYLES[state];

          return (
            <li
              key={stage.role}
              className={`rounded-xl border p-3.5 transition-all ${style.card}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  {/* Số thứ tự bước */}
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold shadow-2xs mt-0.5 ${
                      state === "done"
                        ? "bg-[#102A43] text-white"
                        : state === "current"
                        ? "bg-amber-500 text-white"
                        : state === "rejected"
                        ? "bg-rose-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {state === "done" ? (
                      <CheckOutlined className="text-xs" />
                    ) : state === "rejected" ? (
                      <CloseOutlined className="text-xs" />
                    ) : state === "current" ? (
                      <ClockCircleOutlined className="text-xs" />
                    ) : (
                      index + 1
                    )}
                  </span>

                  {/* Thông tin bước: Tên bước dòng 1, Người xử lý / Phụ trách & Ngày giờ dòng 2 */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="text-[13px] font-bold text-slate-900 leading-snug">
                      {index + 1}. {stage.title}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
                      {event && state !== "current" ? (
                        <>
                          <span>
                            Người xử lý:{" "}
                            <strong className="font-semibold text-slate-800">
                              {event.actor}
                            </strong>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono text-[11.5px] text-slate-600">
                            {event.at}
                          </span>
                        </>
                      ) : (
                        <>
                          <span>
                            Phụ trách:{" "}
                            <strong className="font-semibold text-slate-800">
                              {stage.defaultActor}
                            </strong>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="italic text-slate-500">
                            {state === "current" ? "Đang chờ xử lý" : "Chưa thực hiện"}
                          </span>
                        </>
                      )}
                    </div>

                    {note && (
                      <div className="text-xs italic text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-200/80 mt-1.5 leading-relaxed">
                        “{note}”
                      </div>
                    )}
                  </div>
                </div>

                {/* Huy hiệu trạng thái bên phải */}
                <div className="shrink-0 self-start sm:self-center pl-10 sm:pl-0">
                  <Tag scale="sm" className={`m-0 font-semibold ${style.tagClass}`}>
                    {style.label}
                  </Tag>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {disbursement.evidence.length > 0 && (
        <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-slate-200/80 pt-3.5">
          <Text className="shrink-0 text-xs font-semibold text-slate-600">
            Chứng từ kèm theo ({disbursement.evidence.length}):
          </Text>
          <div className="flex flex-wrap gap-2 min-w-0">
            {disbursement.evidence.map((file) => (
              <Tag
                key={file.id}
                intent="subtle"
                scale="md"
                icon={<PaperClipOutlined className="text-slate-400" />}
                className="m-0 py-1 px-2.5 rounded-lg text-xs font-medium border border-slate-200/80 bg-white shadow-2xs"
              >
                {file.name} · {file.size}
              </Tag>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
