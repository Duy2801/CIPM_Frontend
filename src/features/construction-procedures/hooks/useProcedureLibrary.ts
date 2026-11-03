"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "@/components/ui";
import { fetchProcedureLibrary } from "../services/procedure.service";
import { loadProcedureLibrary, type ProcedureLibraryItem } from "../utils/procedure-library";

/**
 * Thư viện quy trình cho màn hình: hiện ngay bản đã lưu, đồng thời tải mới từ backend (tài khoản thật).
 * `reload` đọc lại bản đã lưu (sau thao tác vừa ghi), `refresh` tải lại từ backend.
 */
export function useProcedureLibrary() {
  const [procedures, setProcedures] = useState<ProcedureLibraryItem[]>(loadProcedureLibrary);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(() => setProcedures(loadProcedureLibrary()), []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setProcedures(await fetchProcedureLibrary());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được danh sách quy trình.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải dữ liệu từ backend khi mở màn
    void refresh();
  }, [refresh]);

  return { procedures, loading, reload, refresh };
}
