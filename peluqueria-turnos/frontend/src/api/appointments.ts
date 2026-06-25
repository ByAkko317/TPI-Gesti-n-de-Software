import { api } from "./client";
import type { Appointment } from "../types";

export interface ListParams {
  day?: string; // YYYY-MM-DD (solo admin)
  client_id?: number; // solo admin
}

export async function listAppointments(
  params: ListParams = {},
): Promise<Appointment[]> {
  const { data } = await api.get<Appointment[]>("/appointments", { params });
  return data;
}

export async function createAppointment(
  service_id: number,
  start_at: string,
): Promise<Appointment> {
  const { data } = await api.post<Appointment>("/appointments", {
    service_id,
    start_at,
  });
  return data;
}

export async function cancelAppointment(
  id: number,
  comment: string | null,
): Promise<Appointment> {
  const { data } = await api.post<Appointment>(`/appointments/${id}/cancel`, {
    comment,
  });
  return data;
}