"use client";

import { CloseOutlined } from "@ant-design/icons";
import { Flex, Select, Text } from "@/components/ui";
import { DEPARTMENT_OPTIONS } from "../../../constants/project-enums";

export default function ProjectDepartmentsField({
  departments,
  onChange,
}: {
  departments: string[];
  onChange: (departments: string[]) => void;
}) {
  return (
    <Flex vertical gap={6} className="w-full">
      <div className="flex items-center justify-between">
        <Text variant="label" className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
          PHÒNG BAN PHỤ TRÁCH <span className="text-rose-500">*</span>
        </Text>
        {departments.length > 0 && (
          <span className="text-[11px] text-slate-500 font-medium">
            Đã chọn: <strong className="text-[#DC2626]">{departments.length}</strong> phòng ban
          </span>
        )}
      </div>

      <Select
        placeholder={
          DEPARTMENT_OPTIONS.filter((d) => !departments.includes(d.value)).length > 0
            ? "+ Chọn thêm phòng ban phụ trách..."
            : "Đã chọn đủ tất cả phòng ban"
        }
        value={null}
        disabled={DEPARTMENT_OPTIONS.filter((d) => !departments.includes(d.value)).length === 0}
        onChange={(val) => {
          if (val && !departments.includes(val)) {
            onChange([...departments, val]);
          }
        }}
        className="w-full text-xs"
        options={DEPARTMENT_OPTIONS.filter((d) => !departments.includes(d.value)).map((dept) => ({
          value: dept.value,
          label: `${dept.short} — ${dept.value}`,
        }))}
      />

      {departments.length > 0 ? (
        <div className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between px-1 pb-1">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Danh sách phòng ban đã thêm
            </span>
            {departments.length > 1 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-[11px] text-slate-400 hover:text-red-600 cursor-pointer transition-colors"
              >
                Xóa tất cả
              </button>
            )}
          </div>
          {departments.map((deptVal) => {
            const deptInfo = DEPARTMENT_OPTIONS.find((d) => d.value === deptVal);
            const short = deptInfo?.short || "PB";
            return (
              <div
                key={deptVal}
                className="flex items-center justify-between px-3 py-2 rounded-md bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-xs px-2 py-0.5 rounded font-bold bg-[#DC2626] text-white shrink-0">
                    {short}
                  </span>
                  <span className="text-xs font-semibold text-slate-800" title={deptVal}>
                    {deptVal}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onChange(departments.filter((d) => d !== deptVal));
                  }}
                  className="text-slate-400 hover:text-[#DC2626] hover:bg-red-50 p-1 rounded-md transition-colors cursor-pointer shrink-0 ml-2"
                  title={`Xóa ${deptVal}`}
                >
                  <CloseOutlined className="text-xs" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500">
          Chưa có phòng ban phụ trách nào được chọn. Vui lòng chọn từ menu ở trên.
        </div>
      )}
    </Flex>
  );
}
