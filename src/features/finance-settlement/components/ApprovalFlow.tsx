"use client";

import { PaperClipOutlined } from "@ant-design/icons";
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
    tagIntent: "success" | "danger" | "warning" | "muted";
  }
> = {
  done: {
    card: "border-emerald-200/90 bg-white shadow-2xs",
    label: "Đã xử lý",
    tagIntent: "success",
  },
  rejected: {
    card: "border-rose-300 bg-rose-50/50 shadow-2xs",
    label: "Đã trả lại",
    tagIntent: "danger",
  },
  current: {
    card: "border-amber-300 bg-amber-50/50 ring-1 ring-amber-300 shadow-2xs",
    label: "Đang chờ xử lý",
    tagIntent: "warning",
  },
  waiting: {
    card: "border-slate-200/80 bg-slate-50/60 opacity-80",
    label: "Chưa tới lượt",
    tagIntent: "muted",
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

      <ol className="m-0 grid list-none grid-cols-1 items-stretch gap-3.5 p-0 md:grid-cols-3">
        {APPROVAL_STAGES.map((stage, index) => {
          const { state, event, note } = getApprovalStageViewModel(disbursement, stage.role);
          const style = STAGE_STYLES[state];

          return (
            <li
              key={stage.role}
              className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${style.card}`}
            >
              {/* Tiêu đề bước và tag trạng thái */}
              <div className="flex flex-col gap-2.5">
                <Text className="text-[13px] font-bold leading-snug text-[#102A43] min-h-[38px]">
                  {index + 1}. {stage.title}
                </Text>
                <div>
                  <Tag intent={style.tagIntent} scale="sm" className="m-0 font-medium">
                    {style.label}
                  </Tag>
                </div>
              </div>

              {/* Thông tin người xử lý / phụ trách */}
              <div className="mt-3.5 flex flex-col gap-1 border-t border-slate-200/70 pt-3">
                {event && state !== "current" ? (
                  <>
                    <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Người xử lý
                    </Text>
                    <Text strong className="text-[13px] font-semibold leading-5 text-slate-800">
                      {event.actor}
                    </Text>
                    <Text className="text-xs font-mono leading-4 text-slate-500">
                      {event.at}
                    </Text>
                    {note && (
                      <Text className="line-clamp-2 text-xs italic leading-relaxed text-slate-600 bg-white/60 p-1.5 rounded mt-0.5 border border-slate-200/60">
                        “{note}”
                      </Text>
                    )}
                  </>
                ) : (
                  <>
                    <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Phụ trách
                    </Text>
                    <Text strong className="text-[13px] font-semibold leading-5 text-slate-800">
                      {stage.defaultActor}
                    </Text>
                    <Text className="text-xs leading-4 text-slate-400 italic">
                      {state === "current" ? "Đang chờ xử lý" : "Chưa thực hiện"}
                    </Text>
                  </>
                )}
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
