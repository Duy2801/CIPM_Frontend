"use client";

import React, { useMemo, useState } from "react";
import {
  FileTextOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  ProjectOutlined,
  UserOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Drawer,
  Flex,
  Pagination,
  Select,
  Text,
} from "@/components/ui";
import type { ActivityItem } from "../constants/dashboard-mock-data";
import { resolveActivityTime } from "../constants/dashboard-mock-data";
import {
  ACTIVITY_DETAIL_DRAWER_WIDTH,
  buildActivityDetailFacts,
} from "../utils/activity-detail";

interface ActivityLogSectionProps {
  activities: ActivityItem[];
}

export default function ActivityLogSection({
  activities,
}: ActivityLogSectionProps) {
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(
    null,
  );
  const [filterMethod, setFilterMethod] = useState<"ALL" | "PROJECT" | "ACTOR">(
    "ALL",
  );
  const [selectedProject, setSelectedProject] = useState<string | undefined>(
    undefined,
  );
  const [selectedActor, setSelectedActor] = useState<string | undefined>(
    undefined,
  );
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Danh sách các dự án để lọc
  const projectOptions = useMemo(() => {
    const map = new Map<string, { name: string; code?: string }>();
    activities.forEach((item) => {
      const key = item.projectId || item.projectCode || item.projectName;
      if (key && item.projectName) {
        if (!map.has(key)) {
          map.set(key, { name: item.projectName, code: item.projectCode });
        }
      }
    });
    return Array.from(map.entries()).map(([key, info]) => ({
      value: key,
      label: info.code ? `${info.name} (${info.code})` : info.name,
    }));
  }, [activities]);

  // Danh sách người thực hiện để lọc
  const actorOptions = useMemo(() => {
    const map = new Map<string, { actor: string; title?: string }>();
    activities.forEach((item) => {
      if (item.actor && !map.has(item.actor)) {
        map.set(item.actor, { actor: item.actor, title: item.actorTitle });
      }
    });
    return Array.from(map.values()).map((info) => ({
      value: info.actor,
      label: info.title ? `${info.actor} (${info.title})` : info.actor,
    }));
  }, [activities]);

  // Lọc danh sách nhật ký theo phương thức đã chọn & giá trị tương ứng
  const filteredActivities = useMemo(() => {
    return activities.filter((item) => {
      if (filterMethod === "PROJECT" && selectedProject) {
        const match =
          item.projectId === selectedProject ||
          item.projectCode === selectedProject ||
          item.projectName === selectedProject;
        if (!match) return false;
      }
      if (filterMethod === "ACTOR" && selectedActor) {
        if (item.actor !== selectedActor) return false;
      }
      return true;
    });
  }, [activities, filterMethod, selectedProject, selectedActor]);

  const totalItems = filteredActivities.length;

  const paginatedActivities = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredActivities.slice(startIndex, startIndex + pageSize);
  }, [filteredActivities, currentPage, pageSize]);

  const hasFilter =
    (filterMethod === "PROJECT" && Boolean(selectedProject)) ||
    (filterMethod === "ACTOR" && Boolean(selectedActor));

  const handleResetFilters = () => {
    setFilterMethod("ALL");
    setSelectedProject(undefined);
    setSelectedActor(undefined);
    setCurrentPage(1);
  };

  const detailFacts = selectedActivity
    ? buildActivityDetailFacts(selectedActivity)
    : [];

  return (
    <>
      <Card
        surface="workspace"
        padding="compact"
        rounded="lg"
        className="w-full border border-slate-200/80 bg-white shadow-xs rounded-2xl p-5"
      >
        <Flex vertical gap={10} className="w-full">
          {/* Header & Filter Toolbar */}
          <Flex
            align="center"
            justify="space-between"
            wrap="wrap"
            gap={12}
            className="min-h-14 border-b border-slate-100 py-2.5"
          >
            {/* Nhóm mé trái: Tiêu đề + 2 nút lọc hiển thị to rõ nét */}
            <Flex align="center" gap={12} wrap="wrap" className="flex-1 justify-start">
              <Flex align="center" gap={8} className="shrink-0 mr-1">
                <HistoryOutlined className="text-[#DC2626] text-base" />
                <Text
                  strong
                  className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-tight"
                >
                  NHẬT KÝ ĐIỀU HÀNH GẦN NHẤT
                </Text>
              </Flex>

              {/* Nút 1: Chọn phương thức lọc */}
              <div className="w-full sm:w-[195px]">
                <Select
                  value={filterMethod}
                  onChange={(val) => {
                    setFilterMethod(val as "ALL" | "PROJECT" | "ACTOR");
                    setSelectedProject(undefined);
                    setSelectedActor(undefined);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: "ALL", label: "Tất cả nhật ký" },
                    { value: "PROJECT", label: "Lọc theo dự án" },
                    { value: "ACTOR", label: "Lọc theo người thực hiện" },
                  ]}
                  className="w-full text-xs [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!border-slate-300 hover:[&_.ant-select-selector]:!border-[#DC2626] [&_.ant-select-selection-item]:!text-slate-800 [&_.ant-select-selection-item]:!font-semibold [&_.ant-select-selector]:!bg-white [&_.ant-select-selector]:!shadow-xs [&_.ant-select-selector]:!h-9 [&_.ant-select-selection-search-input]:!h-9"
                />
              </div>

              {/* Nút 2: Nút còn lại để lọc theo phương thức đã chọn */}
              <div className="w-full sm:w-[280px]">
                {filterMethod === "PROJECT" ? (
                  <Select
                    placeholder="Chọn dự án để lọc..."
                    allowClear
                    showSearch
                    popupMatchSelectWidth={false}
                    dropdownStyle={{ minWidth: 320 }}
                    optionFilterProp="label"
                    value={selectedProject}
                    onChange={(val) => {
                      setSelectedProject(val as string | undefined);
                      setCurrentPage(1);
                    }}
                    options={projectOptions}
                    className="w-full text-xs [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!border-slate-300 hover:[&_.ant-select-selector]:!border-[#DC2626] [&_.ant-select-selection-placeholder]:!text-slate-500 [&_.ant-select-selector]:!bg-white [&_.ant-select-selector]:!shadow-xs [&_.ant-select-selector]:!h-9 [&_.ant-select-selection-search-input]:!h-9"
                  />
                ) : filterMethod === "ACTOR" ? (
                  <Select
                    placeholder="Chọn người thực hiện để lọc..."
                    allowClear
                    showSearch
                    popupMatchSelectWidth={false}
                    dropdownStyle={{ minWidth: 290 }}
                    optionFilterProp="label"
                    value={selectedActor}
                    onChange={(val) => {
                      setSelectedActor(val as string | undefined);
                      setCurrentPage(1);
                    }}
                    options={actorOptions}
                    className="w-full text-xs [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!border-slate-300 hover:[&_.ant-select-selector]:!border-[#DC2626] [&_.ant-select-selection-placeholder]:!text-slate-500 [&_.ant-select-selector]:!bg-white [&_.ant-select-selector]:!shadow-xs [&_.ant-select-selector]:!h-9 [&_.ant-select-selection-search-input]:!h-9"
                  />
                ) : (
                  <Select
                    disabled
                    value="all"
                    options={[{ value: "all", label: "Hiển thị toàn bộ nhật ký" }]}
                    className="w-full text-xs [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!border-slate-200 [&_.ant-select-selector]:!bg-slate-50 [&_.ant-select-selection-item]:!text-slate-400 [&_.ant-select-selector]:!h-9 cursor-not-allowed"
                  />
                )}
              </div>
            </Flex>

            {/* Khối bên phải: Phân trang */}
            <div className="shrink-0 ml-auto">
              <Pagination
                size="small"
                current={currentPage}
                pageSize={pageSize}
                total={totalItems}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
              />
            </div>
          </Flex>

          {/* Activity Table */}
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-[130px]">THỜI GIAN</th>
                  <th className="py-2.5 px-3 w-[240px]">DỰ ÁN / CÔNG TRÌNH</th>
                  <th className="py-2.5 px-3 w-[180px]">NGƯỜI THỰC HIỆN</th>
                  <th className="py-2.5 px-3">NỘI DUNG CÔNG VIỆC CHÍNH</th>
                  <th className="py-2.5 px-3 text-right w-[80px]">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {paginatedActivities.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="text-xs sm:text-sm text-slate-600">
                          Không tìm thấy nhật ký điều hành phù hợp với bộ lọc.
                        </span>
                        {hasFilter && (
                          <Button scale="xs" intent="outline" onClick={handleResetFilters}>
                            Xóa bộ lọc
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedActivities.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => setSelectedActivity(item)}
                    >
                      <td className="py-3 px-3 font-mono whitespace-nowrap text-xs">
                        {(() => {
                          const { date, timeOfDay } = resolveActivityTime(item.time);
                          return (
                            <div>
                              <div className="font-semibold text-slate-800">{date}</div>
                              <div className="text-slate-500 mt-0.5">{timeOfDay}</div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 text-xs line-clamp-1 group-hover:text-[#DC2626] transition-colors">
                          {item.projectName || "Dự án Ban QLDA"}
                        </div>
                        {item.projectCode && (
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                            {item.projectCode}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 text-xs">
                          {item.actor}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[170px] mt-0.5">
                          {item.actorTitle || item.actorDepartment || "Cán bộ chuyên môn"}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-700 leading-relaxed text-xs">
                        <div className="line-clamp-2">{item.content}</div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button
                          intent="link"
                          scale="xs"
                          className="!text-[#DC2626] text-xs font-semibold hover:underline !p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedActivity(item);
                          }}
                        >
                          Chi tiết
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Flex>
      </Card>

      {/* Detail Drawer — Chuẩn thông tin đầy đủ về Dự án, Người thực hiện & Nội dung điều hành */}
      <Drawer
        title={
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-2">
              <FileTextOutlined className="text-base text-[#DC2626]" />
              <span className="text-base font-bold text-[#102A43]">
                Chi tiết nhật ký điều hành
              </span>
            </span>
            {selectedActivity && (
              <span className="text-xs font-normal text-slate-500">
                Mã bản ghi: <span className="font-mono font-medium text-slate-700">{selectedActivity.id}</span>
                {selectedActivity.status && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200/60">
                    {selectedActivity.status}
                  </span>
                )}
              </span>
            )}
          </div>
        }
        open={Boolean(selectedActivity)}
        width={ACTIVITY_DETAIL_DRAWER_WIDTH}
        onClose={() => setSelectedActivity(null)}
        footer={
          <div className="flex items-center justify-start gap-2.5 py-1">
            <Button scale="sm" onClick={() => setSelectedActivity(null)}>
              Đóng
            </Button>
          </div>
        }
      >
        {selectedActivity && (
          <article className="space-y-4">
            {/* KHỐI 1: THÔNG TIN NGƯỜI THỰC HIỆN */}
            <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                <UserOutlined className="text-[#DC2626] text-sm" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Thông tin người thực hiện
                </span>
              </div>
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-red-100/80 text-[#DC2626] flex items-center justify-center font-bold text-sm shrink-0 border border-red-200/60 mt-0.5">
                  {selectedActivity.actor.split(" ").slice(-1)[0]?.charAt(0) || "U"}
                </div>
                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900">
                      {selectedActivity.actor}
                    </div>
                    <div className="text-xs font-medium text-slate-600 mt-0.5">
                      {selectedActivity.actorTitle || "Cán bộ chuyên môn"}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {selectedActivity.actorDepartment || "Ban QLDA Đầu tư Xây dựng"}
                    </div>
                  </div>
                  {(selectedActivity.actorPhone || selectedActivity.actorEmail) && (
                    <div className="flex flex-col sm:items-end gap-1.5 text-xs text-slate-600 shrink-0">
                      {selectedActivity.actorPhone && (
                        <span className="flex items-center gap-1.5">
                          <PhoneOutlined className="text-slate-400 text-[11px]" />
                          <span className="font-mono text-slate-700 font-medium">{selectedActivity.actorPhone}</span>
                        </span>
                      )}
                      {selectedActivity.actorEmail && (
                        <span className="flex items-center gap-1.5">
                          <MailOutlined className="text-slate-400 text-[11px]" />
                          <span className="text-slate-700">{selectedActivity.actorEmail}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* KHỐI 2: THÔNG TIN DỰ ÁN */}
            <section className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200/80">
                <ProjectOutlined className="text-[#DC2626] text-sm" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Dự án & Công trình liên quan
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">Tên dự án</div>
                  <div className="text-sm font-semibold text-slate-900 leading-snug mt-0.5">
                    {selectedActivity.projectName || "Dự án trực thuộc Ban QLDA ĐTXD"}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">Mã dự án</div>
                    <div className="text-xs font-mono font-semibold text-slate-800 mt-0.5">
                      {selectedActivity.projectCode || "Đang cập nhật"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">Giai đoạn dự án</div>
                    <div className="text-xs font-semibold text-[#DC2626] mt-0.5">
                      {selectedActivity.projectStage || "Đang thực hiện"}
                    </div>
                  </div>
                </div>
                {selectedActivity.packageItem && (
                  <div className="pt-1">
                    <div className="text-[11px] text-slate-500 font-medium">Gói thầu / Hạng mục</div>
                    <div className="text-xs font-medium text-slate-800 mt-0.5">
                      {selectedActivity.packageItem}
                    </div>
                  </div>
                )}
                {selectedActivity.projectLocation && (
                  <div className="pt-1 flex items-start gap-1.5 text-xs text-slate-600">
                    <EnvironmentOutlined className="text-slate-400 mt-0.5 shrink-0" />
                    <span>{selectedActivity.projectLocation}</span>
                  </div>
                )}
              </div>
            </section>

            {/* KHỐI 3: NỘI DUNG ĐIỀU HÀNH & KẾ HOẠCH BỔ SUNG */}
            <section className="rounded-xl border border-slate-200/90 bg-white p-4 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Nội dung điều hành & Bổ sung
                </span>
                <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                  <ClockCircleOutlined className="text-slate-400" />
                  {(() => {
                    const { date, timeOfDay } = resolveActivityTime(selectedActivity.time);
                    return `${date} · ${timeOfDay}`;
                  })()}
                </span>
              </div>

              {/* Thông số căn cứ & pháp lý */}
              <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                {detailFacts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="text-[11px] text-slate-500 font-medium">{fact.label}</dt>
                    <dd className="m-0 text-xs font-semibold text-slate-800 mt-0.5">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>

              {/* Diễn giải chi tiết công việc */}
              <div>
                <Text className="block text-xs font-semibold uppercase text-slate-500">
                  Nội dung chi tiết đã thực hiện
                </Text>
                <div className="mt-1 rounded-lg border border-slate-100 bg-slate-50/40 p-3 text-xs leading-relaxed font-medium text-slate-800">
                  {selectedActivity.content}
                </div>
              </div>
            </section>
          </article>
        )}
      </Drawer>
    </>
  );
}

