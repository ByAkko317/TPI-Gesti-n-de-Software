import type { Appointment } from "../types";

interface AppointmentCardProps {
  appointment: Appointment;
  // Si es admin, muestra los datos del cliente.
  showClient?: boolean;
  onCancel?: (appointment: Appointment) => void;
}

export function AppointmentCard({
  appointment,
  showClient,
  onCancel,
}: AppointmentCardProps) {
  const start = new Date(appointment.start_at);
  const end = new Date(appointment.end_at);
  const cancelled = appointment.status === "cancelled";

  const time = (d: Date) =>
    d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      className={`rounded-xl border p-4 ${
        cancelled
          ? "border-clay-100/50 bg-clay-50/40 opacity-70"
          : "border-clay-100 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-500">{appointment.service.name}</div>
          <div className="mt-1 text-sm text-ink/60">
            {time(start)}–{time(end)}
          </div>
          {showClient && (
            <div className="mt-2 text-sm text-ink/70">
              {appointment.user.first_name} {appointment.user.last_name} ·{" "}
              {appointment.user.phone}
            </div>
          )}
        </div>

        <div className="text-right">
          {cancelled ? (
            <span className="rounded-full bg-clay-100/60 px-2 py-0.5 text-xs text-clay-600">
              Cancelado
            </span>
          ) : (
            <span className="text-sm font-500 text-ink">
              ${appointment.service.price.toLocaleString("es-AR")}
            </span>
          )}
        </div>
      </div>

      {cancelled && appointment.cancellation_comment && (
        <p className="mt-2 text-xs text-ink/55">
          {appointment.cancelled_by === "admin" ? "Cancelado por el local" : "Cancelado por vos"}
          : {appointment.cancellation_comment}
        </p>
      )}

      {!cancelled && onCancel && (
        <div className="mt-3 border-t border-clay-100 pt-3">
          <button
            onClick={() => onCancel(appointment)}
            className="text-sm text-clay-600 transition hover:underline"
          >
            Cancelar turno
          </button>
        </div>
      )}
    </div>
  );
}
