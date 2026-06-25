// Utilidades para armar la grilla de un calendario mensual.

export interface CalendarDay {
  date: Date;
  inMonth: boolean; // si pertenece al mes mostrado o es relleno
}

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTH_LABELS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export const weekdayLabels = WEEKDAY_LABELS;

export function monthLabel(year: number, month: number): string {
  return `${MONTH_LABELS[month]} ${year}`;
}

/**
 * Devuelve la grilla de 6 semanas (42 días) que contiene el mes dado,
 * empezando en lunes. month es 0-based (0=enero).
 */
export function buildMonthGrid(year: number, month: number): CalendarDay[] {
  const first = new Date(year, month, 1);
  // getDay(): 0=domingo ... 6=sábado. Convertimos a lunes=0.
  const offset = (first.getDay() + 6) % 7;

  const start = new Date(year, month, 1 - offset);
  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    days.push({ date, inMonth: date.getMonth() === month });
  }
  return days;
}

/** Clave 'YYYY-MM-DD' en hora local, para agrupar turnos por día. */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function sameDay(a: Date, b: Date): boolean {
  return dayKey(a) === dayKey(b);
}