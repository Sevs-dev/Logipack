import React from "react";
import type { CalendarEvent } from "./types";
import { assignLanes } from "./utils";
import { DynamicIcon } from "../dinamicSelect/DynamicIcon"; // ajusta si tu ruta es distinta

type Props = {
  hour: number;
  dayIndex: number;
  baseLeftDateISO: string; // currentWeek + dayIndex + hour (solo para key estable si quieres)
  events: CalendarEvent[];
  onSelect: (ev: CalendarEvent) => void;
};

export default function Cell({
  hour,
  dayIndex,
  baseLeftDateISO,
  events,
  onSelect,
}: Props) {
  const laneHeight = 24;
  const maxHeight = 24 * 10;
  const withLanes = assignLanes(events);

  return (
    <td
      key={`${dayIndex}-${hour}`}
      className="relative border border-[rgb(var(--border))] bg-[rgb(var(--surface))] group overflow-hidden p-0 align-top h-24"
    >
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <span className="text-xs font-medium text-[rgb(var(--muted-foreground))]">
          +{withLanes.length}
        </span>
      </div>
      <div
        className="absolute inset-0 overflow-y-auto"
        style={{ maxHeight: `${maxHeight}px`, overflowX: "hidden" }}
      >
        {withLanes.map((event) => {
          const baseTime = new Date(baseLeftDateISO);
          const baseH = baseTime.getHours();
          const baseM = baseTime.getMinutes();
          const baseMinutes = baseH * 60 + baseM;
          const startMinutes =
            event.startDate.hour() * 60 + event.startDate.minute();
          const offsetMinutes = Math.max(0, startMinutes - baseMinutes);
          const left = Math.min((offsetMinutes / 60) * 100, 100);
          const width = Math.min((event.minutes / 60) * 100, 100 - left);
          const top = (event.lane ?? 0) * laneHeight;
          return (
            <div
              key={`${event.id}-${event.lane}-${event.startDate.valueOf()}`}
              onClick={() => onSelect(event)}
              className="absolute cursor-pointer transition-all duration-200 hover:z-20 group"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                top,
                height: `${laneHeight - 2}px`,
              }}
            >
              <div
                className="absolute top-0 left-0 w-full h-full text-xs font-medium px-1 rounded-sm truncate flex items-center group-hover:text-sm"
                style={{
                  backgroundColor: event.color,
                  color: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
              >
                <span className="mr-1">
                  <DynamicIcon
                    iconName={event.icon}
                    className="w-3 h-3 text-black"
                  />
                </span>
                {event.title}
              </div>
            </div>
          );
        })}
      </div>
    </td>
  );
}
