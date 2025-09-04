// app/components/calendar/index.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";
import DateLoader from "../loader/DateLoader";
import { showError, showSuccess } from "../toastr/Toaster";
import {
  getPlanning,
  getPlanningById,
  validate_orden,
} from "../../services/planing/planingServices";
import { getClients } from "../../services/userDash/clientServices";
import WeekNav from "./WeekNav";
import FiltersPanel from "./Filters";
import Grid from "./Grid";
import EventModal from "./EventModal";
import { DEFAULT_WEEK, parsePlanningData, splitEventByDay, } from "./utils";
import type { CalendarEvent, Filters, PlanningItem } from "./types";

dayjs.locale("es");

const estadoLabels: Record<number | string, string> = {
  11500: "Ejecutado",
};

export default function CalendarGantt() {
  // Estado base
  const [currentWeek, setCurrentWeek] = useState<Dayjs>(DEFAULT_WEEK.clone());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [currentEventIndex, setCurrentEventIndex] = useState<number>(0);
  const [filters, setFilters] = useState<Filters>({
    numberOrder: "",
    codart: "",
    minDuration: null,
    clientName: "",
  });

  // Carga de datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [planningData, clientData] = await Promise.all([
          getPlanning() as Promise<PlanningItem[]>,
          getClients() as Promise<Array<{ id: number; name: string }>>,
        ]);

        const clientMap = new Map(clientData.map((c) => [c.id, c.name] as const));
        const mapped = parsePlanningData(planningData).map((ev) => ({
          ...ev,
          clientName: clientMap.get(ev.client_id) || "Cliente desconocido",
        }));

        setEvents(mapped);
        setError(null);
      } catch (err) {
        console.error("Error al cargar planning o clientes:", err);
        setError("No se pudieron cargar los eventos. Inténtalo más tarde.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtros
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchOrder =
        filters.numberOrder === "" || ev.title.includes(filters.numberOrder);
      const matchCodart = filters.codart === "" || ev.codart === filters.codart;
      const matchDuration =
        filters.minDuration == null || ev.minutes >= filters.minDuration;
      const matchClient =
        filters.clientName === "" ||
        (ev.clientName || "")
          .toLowerCase()
          .includes(filters.clientName.toLowerCase());
      return matchOrder && matchCodart && matchDuration && matchClient;
    });
  }, [events, filters]);

  // Ajusta semana cuando cambian los eventos filtrados
  useEffect(() => {
    if (filteredEvents.length > 0) {
      const first = filteredEvents[0].startDate.startOf("isoWeek");
      if (!first.isSame(currentWeek, "day")) setCurrentWeek(first);
    }
  }, [filteredEvents, currentWeek]);

  // Mantén índice del seleccionado dentro de la lista filtrada
  useEffect(() => {
    if (!selectedEvent) return;
    const index = filteredEvents.findIndex((ev) => ev.id === selectedEvent.id);
    if (index !== -1) setCurrentEventIndex(index);
  }, [selectedEvent, filteredEvents]);

  // Expandir eventos por día (para celdas)
  const expandedEvents = useMemo(
    () => filteredEvents.flatMap(splitEventByDay),
    [filteredEvents]
  );

  // Navegación entre eventos del mismo cliente
  const clientEvents = useMemo(() => {
    if (!selectedEvent) return [] as CalendarEvent[];
    return filteredEvents.filter(
      (ev) => ev.client_id === selectedEvent.client_id
    );
  }, [selectedEvent, filteredEvents]);

  const goToNextEvent = useCallback(() => {
    if (clientEvents.length === 0) return;
    const nextIndex = (currentEventIndex + 1) % clientEvents.length;
    setCurrentEventIndex(nextIndex);
    setSelectedEvent(clientEvents[nextIndex]);
  }, [clientEvents, currentEventIndex]);

  const goToPreviousEvent = useCallback(() => {
    if (clientEvents.length === 0) return;
    const prevIndex =
      (currentEventIndex - 1 + clientEvents.length) % clientEvents.length;
    setCurrentEventIndex(prevIndex);
    setSelectedEvent(clientEvents[prevIndex]);
  }, [clientEvents, currentEventIndex]);

  // Navegación de semana / fecha
  const goToPreviousWeek = useCallback(
    () => setCurrentWeek((prev) => prev.subtract(1, "week")),
    []
  );
  const goToNextWeek = useCallback(
    () => setCurrentWeek((prev) => prev.add(1, "week")),
    []
  );
  const goToToday = useCallback(
    () => setCurrentWeek(dayjs().startOf("isoWeek")),
    []
  );

  const onPickDate = useCallback((d: dayjs.Dayjs | null) => {
    if (!d) {
      setSelectedDate(null);
      setCurrentWeek(dayjs().startOf("isoWeek"));
    } else {
      setSelectedDate(d);
      setCurrentWeek(d.startOf("isoWeek"));
    }
  }, []);

  // Abrir detalles (manteniendo tu lógica)
  const handleOpenDetails = useCallback(async () => {
    if (!selectedEvent?.id) {
      showError("No hay evento seleccionado");
      return;
    }
    const { plan } = await getPlanningById(selectedEvent.id);
    localStorage.removeItem("ejecutar");
    const data = await validate_orden(plan.id);
    if (data.estado === 100 || data.estado === null) {
      const user = document.cookie
        .split("; ")
        .find((row) => row.startsWith("name="))
        ?.split("=")[1];
      if (!user) {
        showError("No se encontró usuario");
        return;
      }
      localStorage.setItem("ejecutar", JSON.stringify({ id: plan.id, user }));
      window.open("/pages/lineas", "_blank");
    } else {
      showSuccess(
        `La orden ya fue finalizada. Estado: ${
          estadoLabels[data.estado as number] || data.estado
        }`
      );
    }
  }, [selectedEvent]);

  if (isLoading)
    return (
      <DateLoader
        message="Generando Calendario..."
        backgroundColor="#242424"
        color="#ffff"
      />
    );

  return (
    <div className="w-full p-8 rounded-3xl shadow-xl border bg-[rgb(var(--surface))] border-[rgb(var(--border))] animate-fade-in">
      <div className="flex flex-col gap-8 mb-8">
        <WeekNav
          currentWeek={currentWeek}
          selectedDate={selectedDate}
          onPrev={goToPreviousWeek}
          onNext={goToNextWeek}
          onToday={goToToday}
          onPickDate={onPickDate}
        />
        <FiltersPanel filters={filters} setFilters={setFilters} events={events} />
      </div>

      {error && (
        <div className="border-l-4 p-4 mb-4 rounded-xl shadow bg-[rgb(var(--danger-foreground))] border-[rgb(var(--danger))] text-[rgb(var(--danger))]">
          <p>{error}</p>
        </div>
      )}

      <Grid
        currentWeek={currentWeek}
        expandedEvents={expandedEvents}
        selectedDate={selectedDate}
        onSelectEvent={setSelectedEvent}
      />

      <EventModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onPrev={goToPreviousEvent}
        onNext={goToNextEvent}
        onOpenDetails={handleOpenDetails}
      />

      <style jsx global>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-15px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fade-in-down {
          animation: fadeInDown 0.3s ease-out both;
        }
      `}</style>
    </div>
  );
}
