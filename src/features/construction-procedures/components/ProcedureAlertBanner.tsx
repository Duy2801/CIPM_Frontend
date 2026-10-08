"use client";

import { AlertFilled, ClockCircleFilled, RightOutlined } from "@ant-design/icons";
import { Button, Card, Col, Flex, Row, Tag, Text } from "@/components/ui";
import { getProcedureAlertSummary } from "../utils/procedure-rules";
import type { ProcedureStep } from "../types/procedure.types";

interface ProcedureAlertBannerProps {
  steps: ProcedureStep[];
  onSelectStep: (stepId: string) => void;
}

export default function ProcedureAlertBanner({ steps, onSelectStep }: ProcedureAlertBannerProps) {
  const { overdue, dueSoon } = getProcedureAlertSummary(steps);

  if (overdue.length === 0 && dueSoon.length === 0) return null;

  const sections = [
    {
      key: "overdue",
      items: overdue,
      title: "Bước đã quá hạn kế hoạch",
      description: "Quy tắc 9 · Cần ưu tiên xử lý và báo cáo Dashboard",
      icon: <AlertFilled />,
      cardClass: "border-rose-200 border-l-4 border-l-rose-600 bg-rose-50/70",
      iconClass: "bg-rose-600 text-white",
      titleClass: "text-rose-900",
      tagIntent: "danger" as const,
      formatDays: (days: number) => `Quá hạn ${Math.abs(days)} ngày`,
    },
    {
      key: "due-soon",
      items: dueSoon,
      title: "Bước sắp đến hạn",
      description: "Quy tắc 8 · Còn tối đa 7 ngày để hoàn thành",
      icon: <ClockCircleFilled />,
      cardClass: "border-amber-200 border-l-4 border-l-amber-500 bg-amber-50/70",
      iconClass: "bg-amber-500 text-white",
      titleClass: "text-amber-900",
      tagIntent: "warning" as const,
      formatDays: (days: number) => `Còn ${days} ngày`,
    },
  ].filter((section) => section.items.length > 0);

  return (
    <Row gutter={[12, 12]}>
      {sections.map((section) => (
        <Col xs={24} xl={sections.length > 1 ? 12 : 24} key={section.key}>
          <Card surface="flat" padding="compact" className={`h-full ${section.cardClass}`}>
            <Flex align="start" gap="middle">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${section.iconClass}`}>
                {section.icon}
              </span>
              <section className="min-w-0 flex-1">
                <Flex align="center" justify="space-between" gap="small" wrap="wrap">
                  <span>
                    <Text className={`block text-sm font-bold ${section.titleClass}`}>{section.title}</Text>
                    <Text className="block text-[11px] text-slate-600">{section.description}</Text>
                  </span>
                  <Tag intent={section.tagIntent} scale="md">{section.items.length} bước</Tag>
                </Flex>
                <ul className="mt-2 grid list-none gap-1 p-0">
                  {section.items.map(({ step, daysRemaining }) => (
                    <li key={step.id}>
                      <Button
                        intent="link"
                        className="w-full justify-between text-left no-underline hover:no-underline"
                        onClick={() => onSelectStep(step.id)}
                      >
                        <span className="truncate text-xs font-medium text-slate-700">
                          [{step.code}] {step.name}
                        </span>
                        <span className={`ml-3 shrink-0 text-xs font-bold ${section.titleClass}`}>
                          {section.formatDays(daysRemaining)} <RightOutlined />
                        </span>
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            </Flex>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
