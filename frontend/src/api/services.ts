import { api } from "./client";
import type { Service } from "../types";

export async function listServices(): Promise<Service[]> {
  const { data } = await api.get<Service[]>("/services");
  return data;
}