"use client";

import React, { useMemo, useState } from "react";
import {
  HistoryOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Flex,
  Pagination,
  Select,
  Text,
} from "@/components/ui";
import type { ActivityItem } from "../constants/dashboard-mock-data";
import { resolveActivityTime } from "../constants/dashboard-mock-data";

interface ActivityLogSectionProps {
  activities: ActivityItem[];
  onOpen: (activityId: string) => void;
}

export default function ActivityLogSection({
  activities,
  onOpen,
}: ActivityLogSectionProps) {
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

  return (
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
              {filterMethod !== "ALL" && (
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
                ) : null}
              </div>
              )}
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
                      onClick={() => onOpen(item.id)}
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
                            onOpen(item.id);
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
  );
}

