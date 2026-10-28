"use client";

import { createContext, useContext, type ReactNode } from "react";

const ProjectScopeContext = createContext<string | undefined>(undefined);

/**
 * Màn hình phân hệ (GPMB, đấu thầu, tài chính, bảo hành...) mở bên trong trang chi tiết một dự án:
 * mọi thứ chỉ thuộc dự án đó, nên ẩn cột / ô chọn dự án và khóa dự án trong các hộp tạo mới.
 */
export function ProjectScopeProvider({ projectId, children }: { projectId: string; children: ReactNode }) {
  return <ProjectScopeContext.Provider value={projectId}>{children}</ProjectScopeContext.Provider>;
}

/** Mã dự án đang xem chi tiết; `undefined` khi màn hình mở độc lập (xem mọi dự án) */
export function useProjectScope(): string | undefined {
  return useContext(ProjectScopeContext);
}
