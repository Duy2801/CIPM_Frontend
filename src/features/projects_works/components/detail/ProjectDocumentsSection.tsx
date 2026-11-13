"use client";

import { FileTextOutlined, PaperClipOutlined } from "@ant-design/icons";
import { Flex, Text } from "@/components/ui";
import type { ProjectItem } from "@/shared/projects_works/types/project.types";
import { getProjectDocuments } from "../../constants/project-documents-mock";
import { cn } from "@/utils/cn";
import { hasBackendSession } from "@/config/backend";

export function ProjectDocumentsSection({ project, fill = false }: { project: ProjectItem; fill?: boolean }) {
  const documents = hasBackendSession() ? (project.documents ?? []) : getProjectDocuments(project);
  return (
    <section className={cn("rounded-xl border border-slate-200 p-4", fill && "flex h-full flex-col")}>
      <Flex align="center" justify="space-between" className="mb-3">
        <Flex align="center" gap={6}>
          <FileTextOutlined className="text-slate-500" />
          <Text className="text-xs font-bold uppercase tracking-wide text-[#DC2626]">
            Tài liệu đính kèm ({documents.length})
          </Text>
        </Flex>
        <span className="text-[10.5px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
          Hồ sơ pháp lý & kỹ thuật
        </span>
      </Flex>

      {documents.length === 0 ? (
        <div className="py-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg bg-slate-50/40">
          Chưa có tài liệu đính kèm cho dự án này
        </div>
      ) : (
        <div
          className={cn(
            "space-y-1.5 overflow-y-auto [scrollbar-width:thin] pr-1",
            fill ? "min-h-0 flex-1" : "max-h-[220px]",
          )}
        >
          {documents.map((doc, idx) => (
            <div
              key={doc.id || idx}
              className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-7 w-7 items-center justify-center rounded bg-red-50 text-[#DC2626] border border-red-200 shrink-0">
                  <FileTextOutlined className="text-xs" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-800 truncate" title={doc.fileName || doc.name}>
                    {doc.fileName || doc.name}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                    {doc.fileSize && <span>{doc.fileSize}</span>}
                    {doc.uploadedAt && <span>· Ngày tải: {doc.uploadedAt}</span>}
                  </div>
                </div>
              </div>
              <span className="text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0 ml-2">
                <PaperClipOutlined className="mr-1 text-[10px]" />
                Đính kèm
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
