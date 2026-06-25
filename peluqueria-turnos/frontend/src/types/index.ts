// Tipos compartidos con la API. Reflejan los schemas Pydantic del backend.

export type Role = "client" | "admin";

export type AppointmentStatus = "confirmed" | "cancelled";
export type CancelledBy = "client" | "admin";

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  birth_date: string | null;
  role: Role;
}

export interface Service {
  id: number;
  name: string;
  duration_min: number;
  price: number;
  active: boolean;
}

export interface ClientMini {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export interface Appointment {
  id: number;
  start_at: string;
  end_at: string;
  status: AppointmentStatus;
  cancelled_by: CancelledBy | null;
  cancellation_comment: string | null;
  service: Service;
  user: ClientMini;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  birth_date?: string | null;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RevenueByService {
  service_name: string;
  appointments: number;
  revenue: number;
}

export interface Analytics {
  total_revenue: number;
  confirmed_appointments: number;
  cancelled_appointments: number;
  total_clients: number;
  new_clients: number;
  new_clients_period_days: number;
  revenue_by_service: RevenueByService[];
}