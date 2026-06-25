import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listAppointments, cancelAppointment } from "../api/appointments";
import { getApiErrorMessage } from "../api/client";
import { MonthCalendar } from "../components/MonthCalendar";
import { AppointmentCard } from "../components/AppointmentCard";
import { CancelModal } from "../components/CancelModal";
import { dayKey } from "../lib/calendar";
import type { Appointment } from "../types";

export function MyAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [toCancel, setToCancel] = useState<Appointment | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    listAppointments()
      .then(setAppointments)
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  // Turnos del día seleccionado, ordenados por hora.
  const dayAppointments = useMemo(() => {
    if (!selectedDate) return [];
    const key = dayKey(selectedDate);
    return appointments
      .filter((a) => dayKey(new Date(a.start_at)) === key)
      .sort(
        (a, b) =>
          new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
      );
  }, [appointments, selectedDate]);

  async function handleConfirmCancel(comment: string | null) {
    if (!toCancel) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await cancelAppointment(toCancel.id, comment);
      setToCancel(null);
      load(); // refrescar tras cancelar
    } catch (err) {
      setCancelError(getApiErrorMessage(err, "No pudimos cancelar el turno"));
    } finally {
      setCancelling(false);
    }
  }

  const hasAny = appointments.length > 0;

  return (
    <div className="py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-500 tracking-tight">
            Mis turnos
          </h1>
          <p className="mt-2 text-ink/65">
            Tocá un día para ver el detalle.
          </p>
        </div>
        <Link
          to="/sacar-turno"
          className="rounded-full bg-clay-500 px-5 py-2.5 font-500 text-cream transition hover:bg-clay-600"
        >
          Sacar turno
        </Link>
      </div>

      {loading ? (
        <p className="mt-8 text-ink/50">Cargando…</p>
      ) : !hasAny ? (
        <div className="mt-10 rounded-2xl border border-clay-100/70 bg-white/60 p-10 text-center">
          <p className="text-ink/70">Todavía no tenés turnos.</p>
          <Link
            to="/sacar-turno"
            className="mt-4 inline-block rounded-full bg-clay-500 px-6 py-3 font-500 text-cream transition hover:bg-clay-600"
          >
            Sacar el primero
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <MonthCalendar
            appointments={appointments}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          <div>
            {!selectedDate ? (
              <p className="rounded-2xl border border-clay-100/70 bg-white/60 p-6 text-ink/60">
                Elegí un día en el calendario.
              </p>
            ) : dayAppointments.length === 0 ? (
              <p className="rounded-2xl border border-clay-100/70 bg-white/60 p-6 text-ink/60">
                No tenés turnos este día.
              </p>
            ) : (
              <div className="space-y-3">
                {dayAppointments.map((a) => (
                  <AppointmentCard
                    key={a.id}
                    appointment={a}
                    onCancel={setToCancel}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {toCancel && (
        <CancelModal
          appointment={toCancel}
          submitting={cancelling}
          error={cancelError}
          onConfirm={handleConfirmCancel}
          onClose={() => {
            setToCancel(null);
            setCancelError(null);
          }}
        />
      )}
    </div>
  );
}
