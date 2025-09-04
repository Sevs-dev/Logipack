import React from "react";
import dayjs from "dayjs";

type Props = {
  currentWeek: dayjs.Dayjs;
  selectedDate: dayjs.Dayjs | null;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onPickDate: (d: dayjs.Dayjs | null) => void;
};

export default function WeekNav({
  currentWeek,
  selectedDate,
  onPrev,
  onNext,
  onToday,
  onPickDate,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          aria-label="Semana anterior"
          className="p-2 rounded-full shadow transition border border-[rgb(var(--border))] bg-[rgb(var(--surface))] hover:bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <button
          onClick={onToday}
          className="text-sm px-5 py-2 rounded-full shadow transition font-semibold border border-[rgb(var(--border))] bg-[rgb(var(--surface))] hover:bg-[rgb(var(--surface-muted))] text-[rgb(var(--accent))]"
        >
          Hoy
        </button>
        <button
          onClick={onNext}
          aria-label="Semana siguiente"
          className="p-2 rounded-full shadow transition border border-[rgb(var(--border))] bg-[rgb(var(--surface))] hover:bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <div className="relative w-full sm:w-auto sm:min-w-[220px]">
        <input
          type="date"
          className="w-full pl-4 pr-4 py-2 rounded-full shadow text-center border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
          value={selectedDate ? selectedDate.format("YYYY-MM-DD") : ""}
          onChange={(e) => {
            const value = e.target.value;
            if (!value) onPickDate(null);
            else onPickDate(dayjs(value));
          }}
        />
      </div>
      <h2 className="text-center text-xl font-bold tracking-tight text-[rgb(var(--foreground))]">
        Semana del{" "}
        <span className="text-[rgb(var(--accent))]">
          {currentWeek.format("DD/MM/YYYY")}
        </span>{" "}
        -{" "}
        <span className="text-[rgb(var(--accent))]">
          {currentWeek.add(6, "day").format("DD/MM/YYYY")}
        </span>
      </h2>
    </div>
  );
}
