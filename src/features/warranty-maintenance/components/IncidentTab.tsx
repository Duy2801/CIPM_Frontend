"use client";

import { useMemo, useState } from "react";
import { AlertOutlined, CheckOutlined, PaperClipOutlined, PlayCircleOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, Flex, Input, Modal, Table, Tag, Text } from "@/components/ui";
import type { ColumnsType } from "@/components/ui";
import { FilterChip, SectionIntro } from "@/components/workspace";
import { daysBetween, formatDateVi } from "@/utils/date";
import { INCIDENT_FILTER_LABELS, INCIDENT_STATUS_META, SEVERITY_META } from "../constants/warranty-labels";
import type { WarrantyController } from "../hooks/useWarrantyMaintenance";
import type { Incident, IncidentFilter } from "../types/warranty.types";
import { isIncidentOverdue, matchesIncidentFilter } from "../utils/warranty-rules";

interface IncidentTabProps {
  controller: WarrantyController;
  filter: IncidentFilter;
  onFilterChange: (filter: IncidentFilter) => void;
  onReportIncident: () => void;
  onAcceptFix: (incident: Incident) => void;
  onOpenDetail: (incident: Incident) => void;
}

const FILTER_ORDER: IncidentFilter[] = ["ALL", "OVERDUE", "OPEN", "FIXING", "FIXED"];
const STATUS_ORDER: Record<Incident["status"], number> = { OPEN: 0, FIXING: 1, FIXED: 2 };

export default function IncidentTab({
  controller,
  filter,
  onFilterChange,
  onReportIncident,
  onAcceptFix,
  onOpenDetail,
}: IncidentTabProps) {
  const [search, setSearch] = useState("");
  const { incidents, warranties, today, permissions } = controller;

  const counts = useMemo(() => {
    const result = {} as Record<IncidentFilter, number>;
    FILTER_ORDER.forEach((key) => {
      result[key] = incidents.filter((item) => matchesIncidentFilter(item, key, today)).length;
    });
    return result;
  }, [incidents, today]);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return incidents
      .filter((item) => matchesIncidentFilter(item, filter, today))
      .filter((item) => !query || [item.code, item.description, item.location].some((value) => value.toLowerCase().includes(query)))
      .sort((a, b) => {
        const overdue = Number(isIncidentOverdue(b, today)) - Number(isIncidentOverdue(a, today));
        return overdue || STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.requiredFixDate.localeCompare(b.requiredFixDate);
      });
  }, [filter, incidents, search, today]);

  const confirmStart = (incident: Incident) => {
    Modal.confirm({
      title: `Nhà thầu đã bắt đầu khắc phục ${incident.code}?`,
      content: <Text className="text-[13px] text-slate-600">{incident.description} – {incident.location}</Text>,
      okText: "Xác nhận",
      cancelText: "Đóng",
      onOk: () => controller.startFixing(incident.id),
    });
  };

  const columns: ColumnsType<Incident> = [
    {
      title: "Sự cố",
      key: "description",
      width: 280,
      render: (_, row) => (
        <section>
          <Flex align="center" gap={6}>
            <span className="text-xs font-bold text-[#007A78] group-hover:underline">
              {row.code}
            </span>
            <Tag intent={SEVERITY_META[row.severity].intent} scale="sm" className="m-0">
              {SEVERITY_META[row.severity].label}
            </Tag>
          </Flex>
          <div className="mt-0.5 block text-left text-sm font-semibold leading-5 text-[#102A43] group-hover:text-[#007A78] group-hover:underline">
            {row.description}
          </div>
          <Text className="block text-xs text-slate-500">Vị trí: {row.location}</Text>
          {row.attachments.length > 0 && (
            <Text className="block text-xs text-teal-700">
              <PaperClipOutlined /> {row.attachments.length} tệp đính kèm
            </Text>
          )}
        </section>
      ),
    },
    {
      title: "Công trình / nhà thầu",
      key: "warranty",
      width: 230,
      render: (_, row) => {
        const warranty = warranties.find((item) => item.id === row.warrantyId);
        return (
          <span>
            <Text className="block text-[13px] font-medium text-slate-800">{warranty?.workName}</Text>
            <Text className="block text-xs text-slate-500">{warranty?.contractor}</Text>
          </span>
        );
      },
    },
    {
      title: "Phát hiện / hạn khắc phục",
      key: "dates",
      width: 190,
      render: (_, row) => {
        const overdue = isIncidentOverdue(row, today);
        return (
          <span>
            <Text className="block text-xs text-slate-500">Phát hiện {formatDateVi(row.foundDate)} · {row.reportedBy}</Text>
            <Text className="block text-[13px] font-medium text-slate-800">Hạn: {formatDateVi(row.requiredFixDate)}</Text>
            {overdue && (
              <Tag intent="danger" scale="md" icon={<AlertOutlined />} className="m-0 mt-1 font-semibold">
                Quá hạn {daysBetween(row.requiredFixDate, today)} ngày
              </Tag>
            )}
          </span>
        );
      },
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 170,
      render: (_, row) => (
        <span>
          <Tag intent={INCIDENT_STATUS_META[row.status].intent} scale="md" className="m-0">
            {INCIDENT_STATUS_META[row.status].label}
          </Tag>
          {row.status === "FIXED" && (
            <Text className="mt-1 block text-xs text-slate-500">
              {formatDateVi(row.fixedDate)} · BB {row.acceptanceDocument}
            </Text>
          )}
        </span>
      ),
    },
  ];

  columns.push({
    title: "Thao tác",
    key: "action",
    width: 170,
    align: "center",
    render: (_, row) =>
      permissions.canManageIncidents && row.status === "OPEN" ? (
        <Button intent="outline" scale="sm" icon={<PlayCircleOutlined />} onClick={() => confirmStart(row)}>
          Bắt đầu sửa
        </Button>
      ) : permissions.canManageIncidents && row.status === "FIXING" ? (
        <Button intent="primary" scale="sm" icon={<CheckOutlined />} onClick={() => onAcceptFix(row)}>
          Nghiệm thu
        </Button>
      ) : (
        <Button
          intent="textLink"
          scale="sm"
          onClick={() => onOpenDetail(row)}
          className="text-xs font-semibold text-[#007A78]"
        >
          Xem chi tiết
        </Button>
      ),
  });

  return (
    <Card surface="flat" padding="none" rounded="lg" className="border-slate-200 shadow-sm shadow-slate-100">
      <SectionIntro
        title="Sự cố trong thời gian bảo hành"
        description="Mỗi sự cố đi qua 3 trạng thái: Mới ghi nhận → Đang khắc phục → Đã khắc phục (có biên bản nghiệm thu)."
        countLabel={`${rows.length} sự cố`}
        readOnly={!permissions.canManageIncidents}
        guide="Sự cố quá hạn khắc phục luôn nằm trên cùng. Nghiệm thu khắc phục cần số biên bản để lưu hồ sơ."
        actions={
          permissions.canManageIncidents && (
            <Button intent="primary" scale="sm" icon={<PlusOutlined />} onClick={onReportIncident}>
              Ghi nhận sự cố mới
            </Button>
          )
        }
        toolbar={
          <Flex justify="space-between" align="center" wrap="wrap" gap="small">
            <Flex gap={6} wrap="wrap" role="group" aria-label="Lọc sự cố">
              {FILTER_ORDER.map((key) => (
                <FilterChip key={key} active={filter === key} count={counts[key]} onClick={() => onFilterChange(key)}>
                  {INCIDENT_FILTER_LABELS[key]}
                </FilterChip>
              ))}
            </Flex>
            <Input
              allowClear
              intent="clean"
              prefix={<SearchOutlined className="text-slate-400" />}
              placeholder="Tìm mã, mô tả, vị trí sự cố..."
              className="w-full lg:w-80"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </Flex>
        }
      />
      <Table
        rowKey="id"
        columns={columns}
        dataSource={rows}
        size="middle"
        tableLayout="fixed"
        scroll={{ x: 1060 }}
        pagination={{ pageSize: 10, hideOnSinglePage: true, showSizeChanger: false }}
        onRow={(record) => ({
          onClick: (e) => {
            const target = e.target as HTMLElement;
            if (
              target.closest("button") ||
              target.closest("a") ||
              target.closest("input") ||
              target.closest(".ant-btn") ||
              target.closest(".ant-dropdown") ||
              target.closest(".ant-popconfirm") ||
              target.closest(".ant-select")
            ) {
              return;
            }
            onOpenDetail(record);
          },
          className: "cursor-pointer hover:bg-slate-50/70 transition-colors group",
        })}
        rowClassName={(row) => (isIncidentOverdue(row, today) ? "align-top [&>td]:!bg-rose-50/50 cursor-pointer" : "align-top cursor-pointer")}
        className="[&_.ant-table-thead>tr>th]:bg-slate-50/90 [&_.ant-table-thead>tr>th]:py-3 [&_.ant-table-thead>tr>th]:text-[13px] [&_.ant-table-thead>tr>th]:font-bold [&_.ant-table-thead>tr>th]:text-slate-600 [&_.ant-table-tbody>tr>td]:py-3"
        locale={{ emptyText: <Text className="block py-10 text-center text-sm text-slate-500">Không có sự cố nào khớp bộ lọc.</Text> }}
      />
    </Card>
  );
}
