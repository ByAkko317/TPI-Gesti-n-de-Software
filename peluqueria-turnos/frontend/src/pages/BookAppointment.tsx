import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listServices } from "../api/services";
import { createAppointment, listAppointments } from "../api/appointments";
import { getApiErrorMessage } from "../api/client";
import type { Service } from "../types";
import {
  generateSlots,
  toDateInputValue,
  type Slot,
} from "../lib/slots";

export function BookAppointment() {
  const navigate = useNavigate();

  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [date, setDate] = useState<string>(toDateInputValue(new Date()));
  const [dayAppointments, setDayAppointments] = useState([] as Awaited<
    ReturnType<typeof listAppointments>
  >);

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedFor, setConfirmedFor] = useState<string | null>(null);

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [services, serviceId],
  );

  // Cargar servicios al montar.
  useEffect(() => {
    listServices()
      .then((data) => {
        setServices(data);
        if (data.length > 0) setServiceId(data[0].id);
      })
      .catch((err) => setError(getApiErrorMessage(err, "No pudimos cargar los servicios")))
      .finally(() => setLoadingServices(false));
  }, []);

  // Cargar los turnos del cliente para descontar franjas ocupadas.
  // (El cliente solo ve los suyos; el backend revalida igual al confirmar.)
  useEffect(() => {
    setSelectedSlot(null);
    setLoadingSlots(true);
    listAppointments()
      .then(setDayAppointments)
      .catch(() => setDayAppointments([]))
      .finally(() => setLoadingSlots(false));
  }, [date, serviceId]);

  const slots = useMemo(() => {
    if (!selectedService) return [];
    const [y, m, d] = date.split("-").map(Number);
    const dayDate = new Date(y, m - 1, d);
    // Filtramos los turnos al día elegido.
    const sameDay = dayAppointments.filter((a) => {
      const ad = new Date(a.start_at);
      return (
        ad.getFullYear() === dayDate.getFullYear() &&
        ad.getMonth() === dayDate.getMonth() &&
        ad.getDate() === dayDate.getDate()
      );
    });
    return generateSlots(dayDate, selectedService.duration_min, sameDay);
  }, [selectedService, date, dayAppointments]);

  async function handleConfirm() {
    if (!selectedService || !selectedSlot) return;
    setSubmitting(true);
    setError(null);
    try {
      // Enviamos la hora local en ISO sin forzar zona; el backend la interpreta.
      const iso = localIso(selectedSlot.start);
      await createAppointment(selectedService.id, iso);
      setConfirmedFor(
        `${selectedSlot.start.toLocaleDateString("es-AR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })} a las ${selectedSlot.label}`,
      );
    } catch (err) {
      setError(getApiErrorMessage(err, "No pudimos confirmar el turno"));
    } finally {
      setSubmitting(false);
    }
  }

  // --- Pantalla de éxito ---
  if (confirmedFor) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-clay-50 text-2xl text-clay-500">
          ✓
        </div>
        <h1 className="mt-5 font-display text-3xl font-500">¡Turno confirmado!</h1>
        <p className="mt-3 text-ink/70">
          Te esperamos el <span className="font-500 text-ink">{confirmedFor}</span>.
          Te enviamos un correo con los detalles.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={() => navigate("/turnos")}
            className="rounded-full bg-ink px-6 py-3 font-500 text-cream transition hover:bg-ink/85"
          >
            Ver mis turnos
          </button>
          <button
            onClick={() => {
              setConfirmedFor(null);
              setSelectedSlot(null);
            }}
            className="rounded-full border border-clay-100 px-6 py-3 font-500 transition hover:border-clay-400"
          >
            Sacar otro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-6">
      <h1 className="font-display text-3xl font-500 tracking-tight">Sacar un turno</h1>
      <p className="mt-2 text-ink/65">Elegí servicio, día y horario.</p>

      {loadingServices ? (
        <p className="mt-8 text-ink/50">Cargando servicios…</p>
      ) : (
        <div className="mt-8 space-y-8">
          {/* Paso 1: servicio */}
          <section>
            <h2 className="mb-3 text-sm font-500 uppercase tracking-wider text-clay-500">
              Servicio
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setServiceId(s.id)}
                  className={`rounded-xl border p-4 text-left transition ${
                    serviceId === s.id
                      ? "border-clay-400 bg-clay-50"
                      : "border-clay-100 bg-white hover:border-clay-400"
                  }`}
                >
                  <div className="font-500">{s.name}</div>
                  <div className="mt-1 text-sm text-ink/60">
                    {s.duration_min} min · ${s.price.toLocaleString("es-AR")}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Paso 2: fecha */}
          <section>
            <h2 className="mb-3 text-sm font-500 uppercase tracking-wider text-clay-500">
              Día
            </h2>
            <input
              type="date"
              value={date}
              min={toDateInputValue(new Date())}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-clay-100 bg-white px-3 py-2 outline-none focus:border-clay-400 focus:ring-2 focus:ring-clay-400/20"
            />
          </section>

          {/* Paso 3: horario */}
          <section>
            <h2 className="mb-3 text-sm font-500 uppercase tracking-wider text-clay-500">
              Horario
            </h2>
            {loadingSlots ? (
              <p className="text-ink/50">Buscando horarios…</p>
            ) : slots.length === 0 ? (
              <p className="rounded-lg bg-clay-50 px-4 py-3 text-sm text-ink/70">
                No hay horarios disponibles para ese día. Probá con otra fecha.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {slots.map((slot) => (
                  <button
                    key={slot.label}
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-lg border py-2 text-sm transition ${
                      selectedSlot?.label === slot.label
                        ? "border-clay-400 bg-clay-400 text-cream"
                        : "border-clay-100 bg-white hover:border-clay-400"
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            )}
          </section>

          {error && (
            <p className="rounded-lg bg-clay-50 px-4 py-3 text-sm text-clay-600">
              {error}
            </p>
          )}

          {/* Confirmación */}
          <div className="flex items-center justify-between border-t border-clay-100 pt-6">
            <div className="text-sm text-ink/65">
              {selectedService && selectedSlot ? (
                <>
                  {selectedService.name} · {selectedSlot.label} ·{" "}
                  <span className="font-500 text-ink">
                    ${selectedService.price.toLocaleString("es-AR")}
                  </span>
                </>
              ) : (
                "Elegí un horario para continuar"
              )}
            </div>
            <button
              onClick={handleConfirm}
              disabled={!selectedSlot || submitting}
              className="rounded-full bg-clay-500 px-6 py-3 font-500 text-cream transition hover:bg-clay-600 disabled:opacity-50"
            >
              {submitting ? "Confirmando…" : "Confirmar turno"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** ISO local sin sufijo de zona (YYYY-MM-DDTHH:MM:SS). */
function localIso(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  );
}
