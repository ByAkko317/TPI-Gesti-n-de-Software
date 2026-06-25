import { useEffect, useMemo, useState } from "react";
import { fetchAnalytics } from "../api/admin";
import { listAppointments, cancelAppointment } from "../api/appointments";
import { getApiErrorMessage } from "../api/client";
import { MonthCalendar } from "../components/MonthCalendar";
import { AppointmentCard } from "../components/AppointmentCard";
import { CancelModal } from "../components/CancelModal";
import { dayKey } from "../lib/calendar";
import type { Analytics, Appointment } from "../types";

export function AdminPanel() {
  return (
    <div className="py-6">
      <h1 className="font-display text-3xl font-500 tracking-tight">Panel</h1>
      <p className="mt-2 text-ink/65">Resumen del negocio y agenda completa.</p>

      <AnalyticsSection />
      <AgendaSection />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Analítica
// ---------------------------------------------------------------------------

function AnalyticsSection() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics()
      .then(setData)
      .catch((err) => setError(getApiErrorMessage(err, "No pudimos cargar la analítica")))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="mt-8 text-ink/50">Cargando métricas…</p>;
  if (error) {
    return (
      <p className="mt-8 rounded-lg bg-clay-50 px-4 py-3 text-sm text-clay-600">
        {error}
      </p>
    );
  }
  if (!data) return null;

  const money = (n: number) => `$${n.toLocaleString("es-AR")}`;
  const maxRevenue = Math.max(
    1,
    ...data.revenue_by_service.map((r) => r.revenue),
  );

  return (
    <section className="mt-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Ingresos" value={money(data.total_revenue)} accent />
        <Stat label="Turnos concretados" value={String(data.confirmed_appointments)} />
        <Stat label="Turnos cancelados" value={String(data.cancelled_appointments)} />
        <Stat
          label={`Clientes (nuevos ${data.new_clients_period_days}d)`}
          value={`${data.total_clients} · +${data.new_clients}`}
        />
      </div>

      {data.revenue_by_service.length > 0 && (
        <div className="mt-6 rounded-2xl border border-clay-100/70 bg-white/60 p-6">
          <h2 className="mb-4 text-sm font-500 uppercase tracking-wider text-clay-500">
            Ingresos por servicio
          </h2>
          <div className="space-y-3">
            {data.revenue_by_service.map((r) => (
              <div key={r.service_name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{r.service_name}</span>
                  <span className="text-ink/60">
                    {r.appointments} · {money(r.revenue)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-clay-50">
                  <div
                    className="h-full rounded-full bg-clay-400"
                    style={{ width: `${(r.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        accent ? "border-clay-400/40 bg-clay-50" : "border-clay-100/70 bg-white/60"
      }`}
    >
      <div className="text-sm text-ink/60">{label}</div>
      <div className="mt-1 font-display text-2xl font-500">{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Agenda completa
// ---------------------------------------------------------------------------

function AgendaSection() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [clientFilter, setClientFilter] = useState("");

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

  // Filtro por nombre/email de cliente (en el front, sobre lo ya traído).
  const filtered = useMemo(() => {
    const q = clientFilter.trim().toLowerCase();
    if (!q) return appointments;
    return appointments.filter((a) => {
      const name = `${a.user.first_name} ${a.user.last_name}`.toLowerCase();
      return name.includes(q) || a.user.email.toLowerCase().includes(q);
    });
  }, [appointments, clientFilter]);

  const dayAppointments = useMemo(() => {
    if (!selectedDate) return [];
    const key = dayKey(selectedDate);
    return filtered
      .filter((a) => dayKey(new Date(a.start_at)) === key)
      .sort(
        (a, b) =>
          new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
      );
  }, [filtered, selectedDate]);

  async function handleConfirmCancel(comment: string | null) {
    if (!toCancel) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await cancelAppointment(toCancel.id, comment);
      setToCancel(null);
      load();
    } catch (err) {
      setCancelError(getApiErrorMessage(err, "No pudimos cancelar el turno"));
    } finally {
      setCancelling(false);
    }
  }

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-500">Agenda</h2>
        <input
          type="search"
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          placeholder="Buscar cliente…"
          className="rounded-full border border-clay-100 bg-white px-4 py-2 text-sm outline-none focus:border-clay-400 focus:ring-2 focus:ring-clay-400/20"
        />
      </div>

      {loading ? (
        <p className="mt-6 text-ink/50">Cargando agenda…</p>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <MonthCalendar
            appointments={filtered}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          <div>
            {!selectedDate ? (
              <p className="rounded-2xl border border-clay-100/70 bg-white/60 p-6 text-ink/60">
                Elegí un día para ver los turnos.
              </p>
            ) : dayAppointments.length === 0 ? (
              <p className="rounded-2xl border border-clay-100/70 bg-white/60 p-6 text-ink/60">
                No hay turnos este día
                {clientFilter ? " para ese cliente" : ""}.
              </p>
            ) : (
              <div className="space-y-3">
                {dayAppointments.map((a) => (
                  <AppointmentCard
                    key={a.id}
                    appointment={a}
                    showClient
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
          commentRequired
          submitting={cancelling}
          error={cancelError}
          onConfirm={handleConfirmCancel}
          onClose={() => {
            setToCancel(null);
            setCancelError(null);
          }}
        />
      )}
    </section>
  );
}
