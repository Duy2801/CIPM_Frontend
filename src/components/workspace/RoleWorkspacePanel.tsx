"use client";

import type { ReactNode } from "react";
import {
  AlertFilled,
  BulbOutlined,
  CheckCircleOutlined,
  ClockCircleFilled,
  InfoCircleFilled,
  RightOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { Card, Col, Flex, Row, Tag, Text } from "@/components/ui";
import { getInitials } from "@/utils/initials";
import type { WorkspaceRoleProfile, WorkspaceTask, WorkspaceTaskTone } from "./workspace.types";

interface RoleWorkspacePanelProps<TTask extends WorkspaceTask> {
  profile: WorkspaceRoleProfile;
  tasks: TTask[];
  /** Tên hiển thị của từng tab để người dùng biết mục việc sẽ mở ở đâu */
  tabLabels: Record<string, string>;
  onSelectTask: (task: TTask) => void;
}

const TONE_STYLES: Record<WorkspaceTaskTone, { icon: ReactNode; bar: string; iconBox: string; count: string }> = {
  danger: {
    icon: <AlertFilled />,
    bar: "border-l-rose-500",
    iconBox: "bg-rose-50 text-rose-600",
    count: "bg-rose-600 text-white",
  },
  warning: {
    icon: <ClockCircleFilled />,
    bar: "border-l-amber-500",
    iconBox: "bg-amber-50 text-amber-600",
    count: "bg-amber-500 text-white",
  },
  info: {
    icon: <InfoCircleFilled />,
    bar: "border-l-sky-500",
    iconBox: "bg-sky-50 text-sky-600",
    count: "bg-slate-200 text-slate-700",
  },
};

export default function RoleWorkspacePanel<TTask extends WorkspaceTask>({
  profile,
  tasks,
  tabLabels,
  onSelectTask,
}: RoleWorkspacePanelProps<TTask>) {
  const heading = profile.isReadOnly ? "Điểm cần theo dõi" : "Việc cần xử lý của bạn";

  return (
    <Row gutter={[12, 12]}>
      {/* Cột trái: Danh sách việc cần xử lý */}
      <Col xs={24} lg={15} xl={16}>
        <Card
          surface="flat"
          padding="none"
          className="h-full border-slate-200 flex flex-col [&>.ant-card-body]:flex-1 [&>.ant-card-body]:flex [&>.ant-card-body]:flex-col"
        >
          <Flex align="center" justify="space-between" className="border-b border-slate-100 px-4 py-3 sm:px-5 shrink-0">
            <Text className="text-base font-bold text-[#102A43]">{heading}</Text>
            <Text className="text-xs text-slate-500">Bấm vào từng mục để mở danh sách tương ứng</Text>
          </Flex>

          {tasks.length === 0 ? (
            <Flex align="center" gap="middle" className="flex-1 px-5 py-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-lg text-emerald-600">
                <CheckCircleOutlined />
              </span>
              <span>
                <Text className="block text-sm font-semibold text-slate-800">Không có việc tồn đọng</Text>
                <Text className="block text-xs text-slate-500">
                  Mọi hồ sơ trong phạm vi bộ lọc hiện tại đều đã được xử lý.
                </Text>
              </span>
            </Flex>
          ) : (
            <ul className="m-0 flex-1 grid list-none grid-cols-1 gap-2.5 p-3.5 sm:p-4 md:grid-cols-2">
              {tasks.map((task) => {
                const tone = TONE_STYLES[task.tone];
                return (
                  <li key={task.key} className="h-full flex">
                    <button
                      type="button"
                      onClick={() => onSelectTask(task)}
                      className={`group flex h-full w-full cursor-pointer items-center gap-3 rounded-lg border border-l-4 border-slate-200 bg-white px-3.5 py-3 text-left transition-all hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${tone.bar}`}
                    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone.iconBox}`}>
                        {tone.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-800 group-hover:text-teal-700 leading-snug">
                          {task.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500">
                          {task.description} · <span className="text-slate-400">Tab {tabLabels[task.tab]}</span>
                        </span>
                      </span>
                      <span className={`flex min-w-5 h-5 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-bold ${tone.count}`}>
                        {task.count}
                      </span>
                      <RightOutlined className="text-[10px] text-slate-400 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </Col>

      {/* Cột phải: Thông tin người dùng & hướng dẫn */}
      <Col xs={24} lg={9} xl={8}>
        <Card
          surface="flat"
          padding="none"
          className="h-full border-slate-200 flex flex-col [&>.ant-card-body]:flex-1 [&>.ant-card-body]:flex [&>.ant-card-body]:flex-col"
        >
          <div className="flex-1 flex flex-col justify-between p-3.5 sm:p-4">
            <div>
              <Flex align="center" gap="small">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0B2546] text-sm font-bold text-white">
                  {getInitials(profile.userName)}
                </span>
                <span className="min-w-0">
                  <Text className="block truncate text-sm font-bold text-[#102A43]">{profile.userName}</Text>
                  <Text className="block truncate text-xs text-slate-500">
                    {profile.roleTitle} · {profile.department}
                  </Text>
                </span>
              </Flex>

              <Text className="mt-3 block text-[13px] leading-5 text-slate-600">
                {profile.scopeDescription}
              </Text>

              <details className="group mt-2">
                <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[13px] font-semibold text-[#0F4C81] hover:underline">
                  <SafetyCertificateOutlined />
                  {profile.isReadOnly ? "Phạm vi được xem" : "Quyền hạn của bạn"} ({profile.allowedDuties.length})
                  <RightOutlined className="text-[9px] transition-transform group-open:rotate-90" />
                </summary>
                <ul className="m-0 mt-1.5 list-none space-y-1 p-0">
                  {profile.allowedDuties.map((duty) => (
                    <li key={duty} className="flex items-start gap-1.5 text-[13px] text-slate-600">
                      <CheckCircleOutlined className="mt-0.5 text-emerald-600" />
                      <span>{duty}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </div>

            <aside className="mt-3 rounded-lg border border-teal-100 bg-teal-50/70 px-3 py-2">
              <Flex align="start" gap="small">
                <BulbOutlined className="mt-0.5 text-teal-700" />
                <span>
                  <Tag intent="brand" scale="sm" className="mb-1">Nên đọc trước</Tag>
                  <Text className="block text-[13px] leading-5 text-teal-900">{profile.readingGuide}</Text>
                </span>
              </Flex>
            </aside>
          </div>
        </Card>
      </Col>
    </Row>
  );
}
