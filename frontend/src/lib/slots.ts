import type { Appointment } from "../types";

// Configuración del horario de atención.
// NOTA: estos valores reflejan la config del backend (OPENING_HOUR,
// CLOSING_HOUR, OPEN_WEEKDAYS, MIN_ADVANCE_MINUTES). Idealmente se
// unificarían en un endpoint público GET /config. Por ahora se replican acá.
export const BUSINESS = {
  openingHour: 9,
  closingHour: 18,
  openWeekdays: [1, 2, 3, 4, 5, 6], // getDay(): 0=domingo ... 6=sábado → L-S
  minAdvanceMinutes: 60,
  slotStepMinutes: 30, // cada cuánto empieza un posible turno
};

export interface Slot {
  start: Date;
  label: string; // "HH:MM"
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/**
 * Genera los horarios disponibles para un día y un servicio dado,
 * descartando los que se solapan con turnos confirmados o no cumplen
 * la antelación mínima.
 */
export function generateSlots(
  day: Date,
  durationMin: number,
  existing: Appointment[],
): Slot[] {
  // Día cerrado → sin slots.
  if (!BUSINESS.openWeekdays.includes(day.getDay())) {
    return [];
  }

  const slots: Slot[] = [];
  const now = new Date();
  const earliest = new Date(now.getTime() + BUSINESS.minAdvanceMinutes * 60000);

  // Turnos confirmados de ese día (los cancelados liberan horario).
  const busy = existing
    .filter((a) => a.status === "confirmed")
    .map((a) => ({ start: new Date(a.start_at), end: new Date(a.end_at) }));

  const dayStart = new Date(day);
  dayStart.setHours(BUSINESS.openingHour, 0, 0, 0);
  const dayClose = new Date(day);
  dayClose.setHours(BUSINESS.closingHour, 0, 0, 0);

  const cursor = new Date(dayStart);
  while (cursor < dayClose) {
    const slotStart = new Date(cursor);
    const slotEnd = new Date(cursor.getTime() + durationMin * 60000);

    const fitsInDay = slotEnd <= dayClose;
    const futureEnough = slotStart >= earliest;
    const free = !busy.some((b) => overlaps(slotStart, slotEnd, b.start, b.end));

    if (fitsInDay && futureEnough && free) {
      slots.push({
        start: slotStart,
        label: slotStart.toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    }
    cursor.setMinutes(cursor.getMinutes() + BUSINESS.slotStepMinutes);
  }

  return slots;
}

/** Formatea un Date a 'YYYY-MM-DD' en hora local (para inputs date). */
export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}