import React, { useMemo } from "react";
import type { CalendarEvent, Filters } from "./types";

type Props = {
  filters: Filters;
  setFilters: (f: Filters) => void;
  events: CalendarEvent[];
};

export default function FiltersPanel({ filters, setFilters, events }: Props) {
  const codartOptions = useMemo(
    () => Array.from(new Set(events.map((e) => e.codart))),
    [events]
  );
  const clientOptions = useMemo(
    () =>
      Array.from(
        new Set(events.map((e) => e.clientName || "Cliente desconocido"))
      ),
    [events]
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="flex flex-col items-center text-center rounded-xl shadow p-3 border border-[rgb(var(--border))] bg-[rgb(var(--surface-muted))]">
        <label className="mb-1 text-xs font-semibold text-[rgb(var(--muted-foreground))]">
          N° Orden
        </label>
        <input
          type="text"
          placeholder="Ej: 1234"
          value={filters.numberOrder}
          onChange={(e) =>
            setFilters({ ...filters, numberOrder: e.target.value })
          }
          className="w-full px-3 py-2 rounded-lg shadow-sm text-sm text-[rgb(var(--foreground))] placeholder-slate-400 border border-[rgb(var(--border))] bg-[rgb(var(--surface))] focus:ring-2 focus:ring-[rgb(var(--ring))] text-center"
        />
      </div>
      <div className="flex flex-col items-center text-center rounded-xl shadow p-3 border border-[rgb(var(--border))] bg-[rgb(var(--surface-muted))]">
        <label className="mb-1 text-xs font-semibold text-[rgb(var(--muted-foreground))]">
          Línea
        </label>
        <select
          value={filters.codart}
          onChange={(e) => setFilters({ ...filters, codart: e.target.value })}
          className="w-full px-3 py-2 rounded-lg shadow-sm text-sm border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] focus:ring-2 focus:ring-[rgb(var(--ring))] text-center"
        >
          <option value="">Todas</option>
          {codartOptions.map((cod) => (
            <option key={cod} value={cod}>
              {cod}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col items-center text-center rounded-xl shadow p-3 border border-[rgb(var(--border))] bg-[rgb(var(--surface-muted))]">
        <label className="mb-1 text-xs font-semibold text-[rgb(var(--muted-foreground))]">
          Duración (min)
        </label>
        <input
          type="number"
          placeholder="Ej: 30"
          value={filters.minDuration ?? ""}
          onChange={(e) =>
            setFilters({
              ...filters,
              minDuration:
                e.target.value === "" ? null : Number(e.target.value),
            })
          }
          className="w-full px-3 py-2 rounded-lg shadow-sm text-sm text-[rgb(var(--foreground))] placeholder-slate-400 border border-[rgb(var(--border))] bg-[rgb(var(--surface))] focus:ring-2 focus:ring-[rgb(var(--ring))] text-center"
        />
      </div>
      <div className="flex flex-col items-center text-center rounded-xl shadow p-3 border border-[rgb(var(--border))] bg-[rgb(var(--surface-muted))]">
        <label className="mb-1 text-xs font-semibold text-[rgb(var(--muted-foreground))]">
          Cliente
        </label>
        <select
          value={filters.clientName}
          onChange={(e) =>
            setFilters({ ...filters, clientName: e.target.value })
          }
          className="w-full px-3 py-2 rounded-lg shadow-sm text-sm border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] focus:ring-2 focus:ring-[rgb(var(--ring))] text-center"
        >
          <option value="">Todos</option>
          {clientOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col items-center text-center justify-end">
        <label className="mb-1 text-xs font-medium text-transparent">
          Limpiar
        </label>
        <button
          onClick={() =>
            setFilters({
              numberOrder: "",
              codart: "",
              minDuration: null,
              clientName: "",
            })
          }
          className="w-full text-sm px-3 py-2 rounded-xl font-semibold shadow-sm bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))] hover:bg-[rgb(var(--accent-hover))]"
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  );
}
