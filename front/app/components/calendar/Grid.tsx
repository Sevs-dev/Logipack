// app/components/calendar/Grid.tsx
import React, { useMemo } from "react";
import type { Dayjs } from "dayjs";
import Cell from "./Cell"; // ⬅️ ajusta la ruta si tu Cell vive en otro lado
import { HOURS, WEEK_DAYS, eventsForCell } from "./utils"; // ⬅️ ajusta la ruta
import type { CalendarEvent } from "./types"; // ⬅️ ajusta la ruta

type Props = {
  currentWeek: Dayjs;
  expandedEvents: CalendarEvent[];
  selectedDate: Dayjs | null;
  onSelectEvent: (ev: CalendarEvent) => void;
};

export default function Grid({
  currentWeek,
  expandedEvents,
  selectedDate,
  onSelectEvent,
}: Props) {
  const cellsMap = useMemo(() => {
    // Precalcula eventos por celda para evitar recalcular en cada render
    const map = new Map<string, CalendarEvent[]>();
    for (let d = 0; d < 7; d++) {
      for (const h of HOURS) {
        const evs = eventsForCell(expandedEvents, currentWeek, d, h);
        const key = `${d}-${h}`;
        map.set(key, evs);
      }
    }
    return map;
  }, [expandedEvents, currentWeek]);

  return (
    <div className="overflow-x-auto border border-[rgb(var(--border))] rounded-2xl shadow-inner bg-[rgb(var(--surface))] mt-2">
      <table className="min-w-full table-fixed border-collapse">
        <thead className="sticky top-0 z-10 text-white bg-gradient-to-r from-[rgb(var(--accent))] to-[rgb(var(--info))] shadow">
          <tr>
            <th className="w-28 border px-2 text-left font-semibold tracking-wide border-[rgb(var(--border))]">
              Día/Hora
            </th>
            {HOURS.map((hora) => (
              <th
                key={hora}
                className="w-20 border text-center font-semibold border-[rgb(var(--border))]"
              >
                {hora}:00
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {WEEK_DAYS.map((dia, dayIndex) => {
            const fecha = currentWeek.add(dayIndex, "day");
            const numeroDia = fecha.format("D");
            const isSelected =
              !!selectedDate && fecha.isSame(selectedDate, "day");
            return (
              <tr
                key={dayIndex}
                className={
                  dayIndex % 2 === 0
                    ? "bg-[rgb(var(--surface-muted))]"
                    : "bg-[rgb(var(--surface))]"
                }
              >
                <td
                  className={`border px-2 font-semibold sticky left-0 z-10 text-center align-middle border-[rgb(var(--border))] ${
                    isSelected
                      ? "bg-[rgb(var(--bg-via))] shadow-inner"
                      : "bg-[rgb(var(--surface))]"
                  }`}
                >
                  <div className="text-[rgb(var(--foreground))]">
                    <span className="block text-base">{dia}</span>
                    <span className="font-bold text-lg text-[rgb(var(--accent))]">
                      {numeroDia}
                    </span>
                  </div>
                </td>
                {HOURS.map((hour) => (
                  <Cell
                    key={`${dayIndex}-${hour}`}
                    hour={hour}
                    dayIndex={dayIndex}
                    baseLeftDateISO={currentWeek
                      .clone()
                      .add(dayIndex, "day")
                      .hour(hour)
                      .minute(0)
                      .toISOString()}
                    events={cellsMap.get(`${dayIndex}-${hour}`) || []}
                    onSelect={onSelectEvent}
                  />
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <style jsx global>{`
        .overflow-x-auto::-webkit-scrollbar {
          height: 8px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.6);
          border-radius: 8px;
        }
        .overflow-x-auto::-webkit-scrollbar-track {
          background: rgba(226, 232, 240, 0.5);
        }
      `}</style>
    </div>
  );
}
