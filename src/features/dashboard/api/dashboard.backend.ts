import apiClient from "@/config";
import type { ApiDashboardSummary } from "../services/dashboard.mapper";

export async function getDashboardSummaryApi(): Promise<ApiDashboardSummary> {
  return (await apiClient.get<ApiDashboardSummary>("dashboard/summary")).data;
}

