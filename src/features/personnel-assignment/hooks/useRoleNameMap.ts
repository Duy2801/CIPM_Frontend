"use client";

import { useEffect, useMemo, useState } from "react";
import { getStoredRoleName, readStoredRoleItems } from "../services/custom-roles.storage";
import { subscribeRolesUpdated } from "../services/role-matrix.storage";
import { useRoleMatrix } from "./useRoleMatrix";

function loadStoredRoleNames(): Map<string, string> {
  const map = new Map<string, string>();
  readStoredRoleItems().forEach((item) => {
    const code = item.code || item.id;
    const name = getStoredRoleName(item);
    if (code && name) map.set(String(code).trim(), String(name).trim());
  });
  return map;
}

/** Mã chức danh → tên hiển thị (chức danh tùy chỉnh đã lưu + chức danh trong ma trận phân quyền) */
export function useRoleNameMap(): Map<string, string> {
  const { roles: matrixRoles } = useRoleMatrix();
  const [storedNames, setStoredNames] = useState<Map<string, string>>(loadStoredRoleNames);

  useEffect(() => {
    const handleUpdate = () => setStoredNames(loadStoredRoleNames());
    handleUpdate();
    return subscribeRolesUpdated(handleUpdate);
  }, []);

  return useMemo(() => {
    const map = new Map<string, string>(storedNames);
    matrixRoles.forEach((r) => {
      if (r.code && r.name) map.set(r.code, r.name);
    });
    return map;
  }, [storedNames, matrixRoles]);
}
