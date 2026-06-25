import { useState } from "react";
import {
  buildMonthGrid,
  dayKey,
  monthLabel,
  sameDay,
  weekdayLabels,
} from "../lib/calendar";
import type { Appointment } from "../types";

interface MonthCalendarProps {
  appointments: Appointment[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}

export function MonthCalendar({
  appointments,
  selectedDate,
  onSelectDate,
}: MonthCalendarProps) {
  const today = new Date();
  const [cursor, setCursor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const grid = buildMonthGrid(cursor.getFullYear(), cursor.getMonth());

  // Cuántos turnos confirmados hay por día, para el marcador.
  const countByDay = new Map<string, number>();
  for (const a of appointments) {
    if (a.status !== "confirmed") continue;
    const key = dayKey(new Date(a.start_at));
    countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
  }

  function shiftMonth(delta: number) {
    setCursor(
      new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1),
    );
  }

  return (
    <div className="rounded-2xl border border-clay-100/70 bg-white/60 p-4">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => shiftMonth(-1)}
          className="rounded-full px-3 py-1 text-ink/60 transition hover:bg-clay-50"
          aria-label="Mes anterior"
        >
          ‹
        </button>
        <span className="font-display text-lg font-500 capitalize">
          {monthLabel(cursor.getFullYear(), cursor.getMonth())}
        </span>
        <button
          onClick={() => shiftMonth(1)}
          className="rounded-full px-3 py-1 text-ink/60 transition hover:bg-clay-50"
          aria-label="Mes siguiente"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-ink/50">
        {weekdayLabels.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {grid.map(({ date, inMonth }) => {
          const key = dayKey(date);
          const count = countByDay.get(key) ?? 0;
          const isToday = sameDay(date, today);
          const isSelected = selectedDate && sameDay(date, selectedDate);

          return (
            <button
              key={key}
              onClick={() => onSelectDate(date)}
              className={`relative aspect-square rounded-lg text-sm transition ${
                isSelected
                  ? "bg-clay-400 text-cream"
                  : inMonth
                    ? "hover:bg-clay-50"
                    : "text-ink/25"
              } ${isToday && !isSelected ? "ring-1 ring-clay-400" : ""}`}
            >
              {date.getDate()}
              {count > 0 && (
                <span
                  className={`absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${
                    isSelected ? "bg-cream" : "bg-clay-400"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
