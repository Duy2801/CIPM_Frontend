"use client";

import {
  AlertFilled,
  CheckCircleFilled,
  ClockCircleFilled,
  FieldTimeOutlined,
  SlidersOutlined,
} from "@ant-design/icons";
import { Card, Col, Flex, Progress, Row, Text } from "@/components/ui";

interface ProcedureHeaderKpiProps {
  totalSteps: number;
  activeStepsCount: number;
  disabledCount: number;
  completedCount: number;
  inProgressCount: number;
  dangerRedCount: number;
  warningYellowCount: number;
  completionRate: number;
}

export default function ProcedureHeaderKpi({
  totalSteps,
  activeStepsCount,
  disabledCount,
  completedCount,
  inProgressCount,
  dangerRedCount,
  warningYellowCount,
  completionRate,
}: ProcedureHeaderKpiProps) {
  const items = [
    {
      label: "Quy trình đang áp dụng",
      value: `${activeStepsCount}/${totalSteps}`,
      note: `${disabledCount} bước điều kiện đã tắt`,
      icon: <SlidersOutlined />,
      iconClass: "bg-cyan-50 text-cyan-700",
      valueClass: "text-[#102A43]",
    },
    {
      label: "Đang thực hiện",
      value: inProgressCount,
      note: "Bước đang xử lý",
      icon: <ClockCircleFilled />,
      iconClass: "bg-blue-50 text-blue-700",
      valueClass: "text-blue-700",
    },
    {
      label: "Sắp đến hạn ≤ 7 ngày",
      value: warningYellowCount,
      note: "Cần đôn đốc",
      icon: <FieldTimeOutlined />,
      iconClass: "bg-amber-50 text-amber-700",
      valueClass: warningYellowCount > 0 ? "text-amber-700" : "text-slate-400",
    },
    {
      label: "Quá hạn kế hoạch",
      value: dangerRedCount,
      note: "Ưu tiên xử lý",
      icon: <AlertFilled />,
      iconClass: "bg-rose-50 text-rose-700",
      valueClass: dangerRedCount > 0 ? "text-rose-700" : "text-slate-400",
    },
    {
      label: "Tiến độ thủ tục",
      value: `${completionRate}%`,
      note: `${completedCount}/${activeStepsCount} bước hoàn thành`,
      icon: <CheckCircleFilled />,
      iconClass: "bg-emerald-50 text-emerald-700",
      valueClass: "text-emerald-700",
      progress: completionRate,
    },
  ];

  return (
    <Row gutter={[10, 10]}>
      {items.map((item) => (
        <Col xs={24} sm={12} lg={8} xl={item.label === "Tiến độ thủ tục" ? 8 : 4} key={item.label}>
          <Card surface="flat" padding="compact" className="h-full border-slate-200">
            <Flex align="start" justify="space-between" gap="small">
              <span className="min-w-0 flex-1">
                <Text className="block text-[10px] font-bold uppercase leading-tight tracking-wide text-slate-500">
                  {item.label}
                </Text>
                <Text className={`block text-xl font-black ${item.valueClass}`}>{item.value}</Text>
                {item.progress === undefined ? (
                  <Text className="block text-[11px] text-slate-500">{item.note}</Text>
                ) : (
                  <span className="block">
                    <Progress percent={item.progress} showInfo={false} size="small" strokeColor="#007A78" />
                    <Text className="block text-[10px] text-slate-500">{item.note}</Text>
                  </span>
                )}
              </span>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.iconClass}`}>
                {item.icon}
              </span>
            </Flex>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
