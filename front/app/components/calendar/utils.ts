// app/components/calendar/utils.ts
import dayjs, { Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import type { CalendarEvent, PlanningItem } from "./types";

dayjs.extend(isoWeek);

// ✅ Semana ISO por defecto (empieza lunes)
export const DEFAULT_WEEK = dayjs().startOf("isoWeek");

// Horas visibles (6:00–17:00). Ajusta si quieres otro rango.
export const HOURS = Array.from({ length: 12 }, (_, i) => 6 + i);

// Días de la semana (Lunes inicia ISO)
export const WEEK_DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

/** ✅ Mapea tu planificación del backend a eventos del calendario */
export const parsePlanningData = (data: PlanningItem[]): CalendarEvent[] => {
  return data
    .map((item) => {
      if (!item.start_date || !item.end_date) return null;

      // Mantén minutos como ENTERO (compat con layout y tu getFormattedDuration)
      const minutes =
        typeof item.duration === "string"
          ? parseInt(item.duration.replace(",", "."), 10)
          : Number(item.duration);

      return {
        id: item.id,
        color: item.color,
        icon: item.icon,
        number_order: item.number_order,
        client_id: item.client_id,
        codart: item.codart,
        startDate: dayjs(item.start_date.replace(" ", "T")),
        endDate: dayjs(item.end_date.replace(" ", "T")),
        minutes: Number.isFinite(minutes) ? minutes : 0,
        title: item.number_order,
      } as CalendarEvent;
    })
    .filter(Boolean) as CalendarEvent[];
};

/** Divide eventos que cruzan medianoche en rebanadas por día */
export const splitEventByDay = (event: CalendarEvent): CalendarEvent[] => {
  const parts: CalendarEvent[] = [];
  let current = dayjs(event.startDate);
  const end = dayjs(event.endDate);
  if (!current.isBefore(end, "minute")) return [{ ...event }];

  while (current.isBefore(end, "minute")) {
    const dayEnd = current.endOf("day");
    const partStart = current;
    const partEnd = dayEnd.isBefore(end) ? dayEnd : end;
    const duration = Math.max(0, partEnd.diff(partStart, "minute"));

    parts.push({
      ...event,
      startDate: partStart,
      endDate: partEnd,
      minutes: duration,
    });

    current = partEnd.add(1, "minute");
  }
  return parts;
};

/** Asigna lanes para evitar solapes en una misma celda */
export function assignLanes(events: CalendarEvent[]) {
  const sorted = [...events].sort(
    (a, b) => a.startDate.valueOf() - b.startDate.valueOf()
  );
  const lanes: CalendarEvent[][] = [];

  sorted.forEach((event) => {
    let placed = false;
    for (const lane of lanes) {
      const last = lane[lane.length - 1];
      const endsBefore = last.startDate
        .add(last.minutes, "minute")
        .isBefore(event.startDate);
      if (endsBefore) {
        lane.push(event);
        placed = true;
        break;
      }
    }
    if (!placed) lanes.push([event]);
  });

  return lanes.flatMap((lane, laneIndex) =>
    lane.map((ev) => ({ ...ev, lane: laneIndex }))
  );
}

/** Formatea duración (soporta strings tipo m.ss) */
export const getFormattedDuration = (input: number | string): string => {
  let totalSeconds = 0;
  const s = typeof input === "string" ? input.replace(",", ".") : String(input);
  const num = Number.parseFloat(s);
  if (!Number.isFinite(num) || num <= 0) return "0 seg";

  const [minStr, secStr] = num.toString().split(".");
  const mins = Number.parseInt(minStr, 10) || 0;
  const secs = secStr
    ? Number.parseInt(secStr.padEnd(2, "0").slice(0, 2), 10)
    : 0;

  totalSeconds = mins * 60 + secs;

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  const push = (v: number, sgl: string, pl: string = `${sgl}s`) => {
    if (v > 0) parts.push(`${v} ${v === 1 ? sgl : pl}`);
  };
  push(days, "día");
  push(hours, "hora");
  push(minutes, "min", "min");
  if (totalSeconds < 3600 && seconds > 0 && days === 0 && hours === 0) {
    push(seconds, "seg", "seg");
  }
  return parts.join(" ");
};

/** Eventos que “tocan” una celda (día+hora) */
export const eventsForCell = (
  expandedEvents: CalendarEvent[],
  currentWeek: Dayjs,
  dayIndex: number,
  hour: number
): CalendarEvent[] => {
  const baseTime = currentWeek.clone().add(dayIndex, "day").hour(hour).minute(0);
  return expandedEvents.filter((e) => {
    return (
      e.startDate.isSame(baseTime, "day") &&
      (e.startDate.hour() === hour ||
        (e.startDate.hour() < hour && e.endDate.hour() > hour) ||
        (e.startDate.hour() === hour && e.startDate.minute() > 0))
    );
  });
};
