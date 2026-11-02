"use client";

import { RightOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "@/components/ui";
import { FLOW_GUTTER, FLOW_INDENT, MAIN_NODE_R, SUB_NODE_R } from "../constants/step-table";
import type { StepFlowProps } from "../hooks/useStepTree";

const flowX = (level: number) => FLOW_GUTTER + MAIN_NODE_R + level * FLOW_INDENT;
const nodeR = (level: number) => (level === 0 ? MAIN_NODE_R : SUB_NODE_R);

const flowColor = (level: number) => (level === 0 ? "#CBD5E1" : "#FCA5A5");

function FlowVLine({ level, style }: { level: number; style: React.CSSProperties }) {
  return <span className="absolute w-[1.5px]" style={{ left: flowX(level) - 0.75, background: flowColor(level), ...style }} />;
}

interface StepFlowCellProps extends StepFlowProps {
  code: string;
  onToggle: () => void;
}

export default function StepFlowCell({
  code,
  depth,
  incoming,
  fromParent,
  outgoing,
  passLevels,
  childCount,
  expanded,
  onToggle,
}: StepFlowCellProps) {
  const x = flowX(depth);
  const r = nodeR(depth);
  const isMain = depth === 0;
  return (
    <div className="relative min-w-32 shrink-0 self-stretch -my-2.5">
      {passLevels.map((level) => (
        <FlowVLine key={level} level={level} style={{ top: 0, bottom: 0 }} />
      ))}

      {incoming && <FlowVLine level={depth} style={{ top: 0, height: `calc(50% - ${r}px)` }} />}

      {fromParent && (
        <span
          className="absolute rounded-bl-[10px] border-b-[1.5px] border-l-[1.5px]"
          style={{
            left: flowX(depth - 1) - 0.75,
            top: 0,
            height: "calc(50% + 0.75px)",
            width: x - r - flowX(depth - 1) + 0.75,
            borderColor: flowColor(depth),
          }}
        />
      )}

      {outgoing && <FlowVLine level={depth} style={{ top: `calc(50% + ${r}px)`, bottom: 0 }} />}

      <div className="relative flex h-full items-center" style={{ paddingLeft: x - r }}>
        {isMain ? (
          <span
            className={`relative z-10 flex items-center justify-center rounded-full px-1 text-[10.5px] font-semibold transition-all duration-200 ${
              expanded
                ? "bg-[#DC2626] text-white shadow-[0_2px_6px_rgba(220,38,38,0.25)]"
                : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
            style={{ minWidth: MAIN_NODE_R * 2, height: MAIN_NODE_R * 2 }}
          >
            {code}
          </span>
        ) : (
          <>
            <span
              className={`relative z-10 shrink-0 rounded-full transition-all ${
                expanded ? "bg-[#DC2626] ring-[1.5px] ring-red-200" : "bg-white ring-[1.5px] ring-red-300"
              }`}
              style={{ width: SUB_NODE_R * 2, height: SUB_NODE_R * 2 }}
            />
            <span className="ml-2 whitespace-nowrap pr-2 font-mono text-[11px] font-medium tracking-tight text-slate-500">
              {code}
            </span>
          </>
        )}
      </div>

      {childCount > 0 && (
        <span className="absolute left-0.5 top-1/2 -translate-y-1/2">
          <Tooltip title={expanded ? "Thu gọn các bước con" : `Mở ${childCount} bước con`}>
            <Button
              type="text"
              size="small"
              rounded="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              aria-expanded={expanded}
              aria-label={`${expanded ? "Thu gọn" : "Mở"} bước con của ${code}`}
              icon={<RightOutlined className={`text-[11px] transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />}
              className="!h-5 !w-5 !min-w-0 !p-0 !text-slate-500 hover:!text-slate-800"
            />
          </Tooltip>
        </span>
      )}
    </div>
  );
}
