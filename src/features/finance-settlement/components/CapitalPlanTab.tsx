"use client";

import { useMemo, useState } from "react";
import { DownloadOutlined, EditOutlined, FileAddOutlined, PaperClipOutlined, PlusCircleOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, Flex, Input, Progress, Table, Tag, Text, Tooltip } from "@/components/ui";
import type { ColumnsType } from "@/components/ui";
import { SOURCE_TAG_INTENTS } from "../constants/finance-labels";
import { SectionIntro } from "@/components/workspace";
import type { FinanceSettlementController } from "../hooks/useFinanceSettlement";
import type { CapitalPlan, FinanceProject } from "../types/finance.types";
import { formatVndBillions } from "../utils/finance-rules";
import CapitalPlanModal from "./CapitalPlanModal";
import CapitalPlanDetailDrawer from "./CapitalPlanDetailDrawer";

interface CapitalPlanTabProps {
  controller: FinanceSettlementController;
}

interface SourceRow {
  key: string;
  plan: CapitalPlan;
  initial: number;
  adjustment: number;
  current: number;
  disbursed: number;
  remaining: number;
}

interface ProjectRow {
  key: string;
  project?: FinanceProject;
  initial: number;
  adjustment: number;
  current: number;
  disbursed: number;
  remaining: number;
  sources: SourceRow[];
}

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

function AdjustmentValue({ value, isParent }: { value: number; isParent?: boolean }) {
  if (value === 0) return <span className="text-xs text-slate-300">—</span>;
  const isPositive = value > 0;
  return (
    <div className="flex flex-col items-center">
      <span
        className={`text-xs ${isParent ? "font-bold" : "font-semibold"} ${
          isPositive ? "text-emerald-700" : "text-rose-600"
        }`}
      >
        {isPositive ? "+" : ""}
        {formatVndBillions(value)}
      </span>
      {!isPositive && isParent && (
        <span
          className="mt-0.5 inline-block rounded bg-rose-50 px-1.5 py-0.2 text-[10px] font-medium text-rose-700 border border-rose-200/60"
          title="Dự án giải ngân chậm hoặc vướng mặt bằng, bị cắt giảm điều chuyển vốn sang dự án khác"
        >
          Cắt giảm vốn
        </span>
      )}
      {isPositive && isParent && (
        <span
          className="mt-0.5 inline-block rounded bg-emerald-50 px-1.5 py-0.2 text-[10px] font-medium text-emerald-700 border border-emerald-200/60"
          title="Dự án hấp thụ vốn tốt, được bổ sung vốn điều chuyển trong năm"
        >
          Bổ sung vốn
        </span>
      )}
    </div>
  );
}

export default function CapitalPlanTab({ controller }: CapitalPlanTabProps) {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [adjustingPlan, setAdjustingPlan] = useState<CapitalPlan>();
  const [defaultProjectId, setDefaultProjectId] = useState<string>();
  const [detailProjectId, setDetailProjectId] = useState<string>();

  const { rolePermissions, visiblePlans, visibleDisbursements, data, filters } = controller;

  const rows = useMemo<ProjectRow[]>(() => {
    const query = search.trim().toLowerCase();
    const projectIds = [...new Set(visiblePlans.map((plan) => plan.projectId))];
    const projectRows: ProjectRow[] = projectIds.map((projectId) => {
      const projectPlans = visiblePlans.filter((plan) => plan.projectId === projectId);
      const totalProjectCurrent = sum(projectPlans.map((p) => p.initialAmount + p.adjustmentAmount));
      const totalProjectDisbursed = sum(
        visibleDisbursements
          .filter((item) => item.projectId === projectId && item.status === "APPROVED")
          .map((item) => item.amount),
      );

      const sources: SourceRow[] = projectPlans.map((plan) => {
        const current = plan.initialAmount + plan.adjustmentAmount;
        // Phân bổ giá trị giải ngân theo tỷ trọng từng nguồn vốn
        const proportion = totalProjectCurrent > 0 ? current / totalProjectCurrent : 0;
        const disbursed = Math.round(totalProjectDisbursed * proportion);
        const remaining = Math.max(0, current - disbursed);
        return {
          key: plan.id,
          plan,
          initial: plan.initialAmount,
          adjustment: plan.adjustmentAmount,
          current,
          disbursed,
          remaining,
        };
      });

      const initial = sum(sources.map((s) => s.initial));
      const adjustment = sum(sources.map((s) => s.adjustment));
      const current = sum(sources.map((s) => s.current));

      return {
        key: projectId,
        project: data.projects.find((item) => item.id === projectId),
        initial,
        adjustment,
        current,
        disbursed: totalProjectDisbursed,
        remaining: Math.max(0, current - totalProjectDisbursed),
        sources,
      };
    });

    if (!query) return projectRows;

    return projectRows.filter((row) => {
      const name = row.project?.name?.toLowerCase() ?? "";
      const code = row.project?.code?.toLowerCase() ?? "";
      const sourceMatch = row.sources.some(
        (child) =>
          child.plan.source.toLowerCase().includes(query) ||
          (child.plan.approvalDocument && child.plan.approvalDocument.toLowerCase().includes(query)),
      );
      return name.includes(query) || code.includes(query) || sourceMatch;
    });
  }, [data.projects, search, visibleDisbursements, visiblePlans]);

  const openAdjust = (plan: CapitalPlan) => {
    setAdjustingPlan(plan);
    setDefaultProjectId(plan.projectId);
    setModalOpen(true);
  };

  const openCreateForProject = (projectId?: string) => {
    setAdjustingPlan(undefined);
    setDefaultProjectId(projectId ?? (filters.projectId !== "ALL" ? filters.projectId : data.projects[0]?.id));
    setModalOpen(true);
  };

  const handleExportCSV = () => {
    const headers = [
      "Dự án / Nguồn vốn",
      "Loại",
      "Kế hoạch đầu năm",
      "Điều chỉnh",
      "Kế hoạch hiện tại",
      "Đã giải ngân",
      "Còn lại",
      "Văn bản phê duyệt",
    ];
    const csvRows: string[][] = [];
    rows.forEach((p) => {
      csvRows.push([
        `"${p.project?.name ?? ""}"`,
        `"Tổng dự án"`,
        String(p.initial),
        String(p.adjustment),
        String(p.current),
        String(p.disbursed),
        String(p.remaining),
        `""`,
      ]);
      p.sources.forEach((c) => {
        csvRows.push([
          `"  -- ${c.plan.source}"`,
          `"Nguồn vốn"`,
          String(c.initial),
          String(c.adjustment),
          String(c.current),
          String(c.disbursed),
          String(c.remaining),
          `"${c.plan.approvalDocument ?? ""}"`,
        ]);
      });
    });
    const csvContent = "\uFEFF" + [headers.join(","), ...csvRows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ke_hoach_von_${filters.year}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: ColumnsType<ProjectRow> = [
    {
      title: "Dự án",
      key: "name",
      width: "28%",
      render: (_, row) => (
        <div className="py-1 pr-2 min-w-0">
          <button
            type="button"
            onClick={() => setDetailProjectId(row.key)}
            className="group block text-left w-full cursor-pointer"
          >
            <Text
              className="block text-xs font-bold leading-snug text-[#102A43] group-hover:text-[#007A78] transition-colors line-clamp-2"
              title={row.project?.name}
            >
              {row.project?.name}
            </Text>
          </button>
          <div className="mt-1">
            <span className="text-[11px] font-semibold text-slate-500">{row.project?.code}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Đầu năm",
      key: "initial",
      width: "12%",
      align: "center",
      render: (_, row) => (
        <span className="text-xs font-bold text-slate-800">
          {formatVndBillions(row.initial)}
        </span>
      ),
    },
    {
      title: "Điều chỉnh",
      key: "adjustment",
      width: "11%",
      align: "center",
      render: (_, row) => <AdjustmentValue value={row.adjustment} isParent />,
    },
    {
      title: "KH hiện tại",
      key: "current",
      width: "12%",
      align: "center",
      render: (_, row) => (
        <span className="text-xs font-black text-[#102A43]">
          {formatVndBillions(row.current)}
        </span>
      ),
    },
    {
      title: "Đã giải ngân",
      key: "progress",
      width: "13%",
      align: "center",
      render: (_, row) => {
        const percent = row.current > 0 ? Math.min(100, Math.round((row.disbursed / row.current) * 100)) : 0;
        return (
          <div className="py-0.5 flex flex-col items-center">
            <div className="flex items-center justify-center gap-1 text-[11.5px] mb-0.5 leading-none">
              <span className="font-bold text-[#007A78]">
                {formatVndBillions(row.disbursed)}
              </span>
              <span className="text-slate-500 font-medium text-[10.5px]">({percent}%)</span>
            </div>
            <Progress
              percent={percent}
              showInfo={false}
              size="small"
              strokeColor="#007A78"
              className="m-0 w-full max-w-[100px] [&_.ant-progress-inner]:!h-1.5"
            />
          </div>
        );
      },
    },
    {
      title: "Còn lại",
      key: "remaining",
      width: "12%",
      align: "center",
      render: (_, row) => (
        <span className="text-xs font-bold text-slate-800">
          {formatVndBillions(row.remaining)}
        </span>
      ),
    },
  ];

  if (rolePermissions.canCreateCapitalPlan || rolePermissions.canAdjustCapitalPlan) {
    columns.push({
      title: "Thao tác",
      key: "actions",
      width: "12%",
      align: "center",
      render: (_, row) => (
        <div className="flex items-center justify-center">
          <Button
            intent="textLink"
            scale="xs"
            icon={<EditOutlined className="text-xs" />}
            onClick={() => {
              if (row.sources.length > 0) {
                openAdjust(row.sources[0].plan);
              } else {
                openCreateForProject(row.key);
              }
            }}
            className="text-xs font-semibold text-[#007A78] hover:text-[#005f5d] px-2.5 py-1 rounded-md hover:bg-teal-50 transition-colors whitespace-nowrap border border-teal-200/60 bg-teal-50/30"
            title="Điều chỉnh tăng, giảm hoặc bổ sung kế hoạch vốn cho dự án này"
          >
            Điều chỉnh vốn
          </Button>
        </div>
      ),
    });
  }

  const selectedDetailProject = data.projects.find((p) => p.id === detailProjectId);
  const selectedProjectPlans = visiblePlans.filter((p) => p.projectId === detailProjectId);

  return (
    <>
      <Card surface="flat" padding="none" rounded="lg" className="border-slate-200 shadow-sm shadow-slate-100 overflow-hidden">
        <SectionIntro
          title={`Kế hoạch vốn niên độ ${filters.year}`}
          description="Quản lý hạn mức kế hoạch vốn đầu tư công theo từng dự án và cơ cấu nguồn vốn. Căn cứ điều chỉnh phải có Quyết định phê duyệt."
          countLabel={`${rows.length} dự án · ${visiblePlans.length} nguồn vốn`}
          readOnly={!rolePermissions.canCreateCapitalPlan && !rolePermissions.canAdjustCapitalPlan}
          guide="Tỷ lệ giải ngân tính trên các hồ sơ đã được Giám đốc phê duyệt. Điều chỉnh giữa năm bắt buộc có văn bản phê duyệt."
          actions={
            <div className="flex items-center gap-2">
              {rolePermissions.canExport && (
                <Button
                  intent="outline"
                  scale="sm"
                  icon={<DownloadOutlined />}
                  onClick={handleExportCSV}
                >
                  Xuất CSV
                </Button>
              )}
              {rolePermissions.canCreateCapitalPlan && (
                <Button
                  intent="primary"
                  scale="sm"
                  icon={<FileAddOutlined />}
                  onClick={() => openCreateForProject()}
                  className="bg-[#007A78] hover:bg-[#006664] text-white font-semibold shadow-xs"
                >
                  Nhập kế hoạch vốn
                </Button>
              )}
            </div>
          }
          toolbar={
            <Flex align="center" gap="small" wrap="wrap" className="w-full">
              <Input
                allowClear
                intent="clean"
                prefix={<SearchOutlined className="text-slate-400" />}
                placeholder="Tìm kiếm dự án, mã dự án, nguồn vốn, số QĐ..."
                style={{ width: 340, maxWidth: "100%" }}
                className="text-xs"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </Flex>
          }
        />

        <Table<ProjectRow>
          rowKey="key"
          columns={columns}
          dataSource={rows}
          size="middle"
          tableLayout="fixed"
          onRow={(record) => ({
            onClick: (e) => {
              const target = e.target as HTMLElement;
              if (target.closest("button") || target.closest("input") || target.closest("select")) {
                return;
              }
              setDetailProjectId(record.key);
            },
            className: "cursor-pointer hover:bg-teal-50/20 transition-colors",
          })}
          pagination={{
            pageSize: 5,
            size: "small",
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20"],
            showTotal: (total, range) => `${range[0]}-${range[1]} trên tổng số ${total} dự án`,
            className: "!px-4 !py-3 !m-0",
          }}
          className="[&_.ant-table-thead>tr>th]:bg-slate-50/90 [&_.ant-table-thead>tr>th]:whitespace-nowrap [&_.ant-table-thead>tr>th]:py-3 [&_.ant-table-thead>tr>th]:px-3 [&_.ant-table-thead>tr>th]:text-xs [&_.ant-table-thead>tr>th]:font-bold [&_.ant-table-thead>tr>th]:text-slate-600 [&_.ant-table-thead>tr>th]:before:!hidden [&_.ant-table-thead>tr>th]:after:!hidden [&_.ant-table-tbody>tr>td]:py-2.5 [&_.ant-table-tbody>tr>td]:px-3 [&_.ant-table-thead>tr>th:first-child]:!pl-5 [&_.ant-table-tbody>tr>td:first-child]:!pl-5 [&_.ant-table-thead>tr>th:last-child]:!pr-5 [&_.ant-table-tbody>tr>td:last-child]:!pr-5"
          locale={{
            emptyText: (
              <div className="py-8 text-center text-slate-500">
                <Text className="block text-xs">
                  {search
                    ? `Không tìm thấy dự án hoặc nguồn vốn nào khớp với "${search}".`
                    : `Chưa có kế hoạch vốn nào cho niên độ ${filters.year} trong phạm vi lọc.`}
                </Text>
                {search && (
                  <Button
                    intent="textLink"
                    scale="xs"
                    className="mt-2 text-xs font-semibold text-[#007A78]"
                    onClick={() => setSearch("")}
                  >
                    Xóa tìm kiếm
                  </Button>
                )}
              </div>
            ),
          }}
        />
      </Card>

      {selectedDetailProject && (
        <CapitalPlanDetailDrawer
          project={selectedDetailProject}
          year={filters.year}
          plans={selectedProjectPlans}
          disbursements={visibleDisbursements}
          controller={controller}
          onClose={() => setDetailProjectId(undefined)}
          onAdjustPlan={(plan) => {
            setDetailProjectId(undefined);
            openAdjust(plan);
          }}
          onAddPlan={(projectId) => {
            setDetailProjectId(undefined);
            openCreateForProject(projectId);
          }}
        />
      )}

      {modalOpen && (
        <CapitalPlanModal
          open={modalOpen}
          projects={data.projects}
          year={filters.year}
          defaultProjectId={defaultProjectId}
          adjustingPlan={adjustingPlan}
          onClose={() => {
            setModalOpen(false);
            setAdjustingPlan(undefined);
            setDefaultProjectId(undefined);
          }}
          onCreate={controller.createCapitalPlan}
          onAdjust={controller.adjustCapitalPlan}
        />
      )}
    </>
  );
}
