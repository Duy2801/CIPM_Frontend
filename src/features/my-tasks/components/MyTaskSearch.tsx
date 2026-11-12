"use client";

import { AutoComplete } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { Input, Select } from "@/components/ui";
import { useMyTaskColumns } from "../hooks/useMyTaskQueries";
import { useMyTaskStore } from "../hooks/useMyTaskStore";

export default function MyTaskSearch() {
  const { matchedProjects: projects, procedureOptions: procedures, activeProcedure } = useMyTaskColumns();
  const keyword = useMyTaskStore((s) => s.keyword);
  const setKeyword = useMyTaskStore((s) => s.setKeyword);
  const setProcedure = useMyTaskStore((s) => s.setProcedure);

  const byName = new Map<string, { name: string; codes: string[] }>();
  for (const p of projects) {
    const key = p.name.trim().toLowerCase();
    const entry = byName.get(key) ?? { name: p.name, codes: [] };
    if (p.code && p.code !== p.name) entry.codes.push(p.code);
    byName.set(key, entry);
  }
  const groups = [...byName.values()];

  const suggestions =
    groups.length === 0
      ? []
      : [
          {
            label: <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Lọc theo dự án</span>,
            options: groups.map((p) => ({
              key: p.name,
              value: p.name,
              label: (
                <div className="flex items-center gap-2.5 py-1">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
                    {p.name.trim().slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-slate-800">{p.name}</span>
                    {p.codes.length > 0 && (
                      <span className="block truncate font-mono text-[11px] text-slate-400">
                        {p.codes.length > 2 ? `${p.codes.length} dự án cùng tên` : p.codes.join(" · ")}
                      </span>
                    )}
                  </span>
                </div>
              ),
            })),
          },
        ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <AutoComplete
        value={keyword}
        onChange={(next: string) => setKeyword(next ?? "")}
        options={suggestions}
        popupMatchSelectWidth
        listHeight={320}
        className="min-w-0 flex-1"
        classNames={{
          popup: {
            root: "[&_.ant-select-item]:!rounded-lg [&_.ant-select-item-option-active]:!bg-slate-50",
          },
        }}
      >
        <Input
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder="Tìm theo tên dự án"
          className="!border-slate-200 !shadow-none hover:!border-slate-300 [&.ant-input-affix-wrapper-focused]:!border-slate-400"
        />
      </AutoComplete>
      {procedures.length > 0 && (
        <Select
          aria-label="Quy trình"
          allowClear
          placeholder="Tất cả quy trình"
          value={activeProcedure}
          onChange={(v?: string) => setProcedure(v)}
          options={procedures.map((name) => ({ value: name, label: name }))}
          className="w-full sm:w-[280px]"
        />
      )}
    </div>
  );
}
