import { api } from "./client";
import type { Analytics } from "../types";

export async function fetchAnalytics(periodDays = 30): Promise<Analytics> {
  const { data } = await api.get<Analytics>("/admin/analytics", {
    params: { period_days: periodDays },
  });
  return data;
}