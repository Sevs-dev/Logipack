import { useEffect, useState, useCallback, useMemo } from "react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import isBetween from "dayjs/plugin/isBetween";
import isoWeek from "dayjs/plugin/isoWeek";
import { getPlanning } from "../../services/planing/planingServices";
import { getClients } from "@/app/services/userDash/clientServices";
import { DynamicIcon } from "../dinamicSelect/DynamicIcon";
import Button from "../buttons/buttons";
import DateLoader from "@/app/components/loader/DateLoader";
import Text from "../text/Text";
import { motion, AnimatePresence } from "framer-motion";
import { showError, showSuccess } from "../toastr/Toaster";
import {
  getPlanningById,
  validate_orden,
} from "../../services/planing/planingServices";

// Configuración inicial
dayjs.extend(isoWeek);
dayjs.extend(isBetween);

// Tipos de datos
interface PlanningItem {
  id: number;
  start_date: string;
  end_date: string;
  duration: string | number;
  color: string;
  codart: string;
  icon: string;
  number_order: string;
  client_id: number;
}

interface Event
  extends Omit<
    PlanningItem,
    "start_date" | "end_date" | "duration" | "codart"
  > {
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
  minutes: number;
  title: string;
  codart: string;
  client_id: number;
  clientName?: string;
}

// Constantes
const WEEK_DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];
const HOURS = Array.from({ length: 12 }, (_, i) => 6 + i);
const DEFAULT_WEEK = dayjs().startOf("isoWeek");

// Funciones auxiliares
const parsePlanningData = (data: PlanningItem[]): Event[] => {
  return data
    .map((item) => {
      if (!item.start_date || !item.end_date) {
        console.warn("Evento con datos inválidos:", item);
        return null;
      }

      return {
        ...item,
        startDate: dayjs(item.start_date.replace(" ", "T")),
        endDate: dayjs(item.end_date.replace(" ", "T")),
        minutes:
          typeof item.duration === "string"
            ? parseInt(item.duration, 10)
            : item.duration,
        title: item.number_order,
      };
    })
    .filter(Boolean) as Event[];
};

const splitEventByDay = (event: Event): Event[] => {
  const parts: Event[] = [];
  let current = dayjs(event.startDate);
  const end = dayjs(event.endDate);

  while (current.isBefore(end, "minute")) {
    const dayEnd = current.endOf("day");
    const partStart = current;
    const partEnd = dayEnd.isBefore(end) ? dayEnd : end;
    const duration = partEnd.diff(partStart, "minute");
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

// Componente principal
const CalendarGantt: React.FC = () => {
  // Estados
  const [currentWeek, setCurrentWeek] = useState(dayjs(DEFAULT_WEEK));
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [currentEventIndex, setCurrentEventIndex] = useState<number>(0);

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Use a function that fetches all clients, e.g., getClientsList (adjust import if needed)
        const [planningData, clientData] = await Promise.all([
          getPlanning(),
          getClients(),
        ]);

        const clientMap = new Map(clientData.map((c) => [c.id, c]));

        const mappedEvents = parsePlanningData(planningData).map((event) => {
          const client = clientMap.get(event.client_id);
          return {
            ...event,
            clientName: client?.name || "Cliente desconocido",
          };
        });

        setEvents(mappedEvents);
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

  //Filtros
  const [filters, setFilters] = useState({
    numberOrder: "",
    codart: "",
    minDuration: null as number | null,
    clientName: "",
  });

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchOrder =
        filters.numberOrder === "" || event.title.includes(filters.numberOrder);
      const matchCodart =
        filters.codart === "" || event.codart === filters.codart;
      const matchDuration =
        filters.minDuration == null || event.minutes >= filters.minDuration;
      const matchClient =
        filters.clientName === "" ||
        event.clientName
          ?.toLowerCase()
          .includes(filters.clientName.toLowerCase());

      return matchOrder && matchCodart && matchDuration && matchClient;
    });
  }, [events, filters]);

  useEffect(() => {
    if (filteredEvents.length > 0) {
      const firstEventDate = filteredEvents[0].startDate.startOf("isoWeek");
      if (!firstEventDate.isSame(currentWeek, "day")) {
        setCurrentWeek(firstEventDate);
      }
    }
  }, [filteredEvents, currentWeek]); // 👈 añadir currentWeek

  useEffect(() => {
    if (!selectedEvent) return;
    const index = filteredEvents.findIndex((ev) => ev.id === selectedEvent.id);
    if (index !== -1) {
      setCurrentEventIndex(index);
    }
  }, [selectedEvent, filteredEvents]);

  // Eventos expandidos por día
  const expandedEvents = useMemo(() => {
    return filteredEvents.flatMap(splitEventByDay);
  }, [filteredEvents]);

  const clientEvents = useMemo(() => {
    if (!selectedEvent) return [];
    return filteredEvents.filter(
      (ev) => ev.client_id === selectedEvent.client_id
    );
  }, [selectedEvent, filteredEvents]);

  const goToNextEvent = () => {
    if (clientEvents.length === 0) return;
    setCurrentEventIndex((prev) => (prev + 1) % clientEvents.length);
    setSelectedEvent(
      clientEvents[(currentEventIndex + 1) % clientEvents.length]
    );
  };

  const goToPreviousEvent = () => {
    if (clientEvents.length === 0) return;
    setCurrentEventIndex(
      (prev) => (prev - 1 + clientEvents.length) % clientEvents.length
    );
    setSelectedEvent(
      clientEvents[
        (currentEventIndex - 1 + clientEvents.length) % clientEvents.length
      ]
    );
  };

  // Navegación de semanas
  const goToPreviousWeek = useCallback(() => {
    setCurrentWeek((prev) => prev.subtract(1, "week"));
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentWeek((prev) => prev.add(1, "week"));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentWeek(dayjs().startOf("isoWeek"));
  }, []);

  const getFormattedDuration = (input: number | string): string => {
    let totalSeconds = 0;

    if (typeof input === "string") input = input.replace(",", ".");
    const num = typeof input === "number" ? input : parseFloat(input);

    if (isNaN(num) || num <= 0) return "0 seg";

    // Si el número tiene decimales, los decimales son segundos (ej: 0.10 => 10 seg)
    const [minStr, secStr] = num.toString().split(".");
    const mins = parseInt(minStr, 10) || 0;
    const secs = secStr ? parseInt(secStr.padEnd(2, "0").slice(0, 2), 10) : 0;
    totalSeconds = mins * 60 + secs;

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts: string[] = [];
    const pushPart = (
      value: number,
      singular: string,
      plural: string = singular + "s"
    ) => {
      if (value > 0) parts.push(`${value} ${value === 1 ? singular : plural}`);
    };

    pushPart(days, "día");
    pushPart(hours, "hora");
    pushPart(minutes, "min", "min");

    const shouldShowSeconds =
      totalSeconds < 3600 && seconds > 0 && days === 0 && hours === 0;
    if (shouldShowSeconds) {
      pushPart(seconds, "seg", "seg");
    }

    return parts.join(" ");
  };

  // Filtrar eventos para una celda específica
  const getEventsForCell = useCallback(
    (dayIndex: number, hour: number): Event[] => {
      const baseTime = currentWeek
        .clone()
        .add(dayIndex, "day")
        .hour(hour)
        .minute(0);

      return expandedEvents.filter((e) => {
        return (
          dayjs(e.startDate).isSame(baseTime, "day") &&
          (e.startDate.hour() === hour ||
            (e.startDate.hour() < hour && e.endDate.hour() > hour) ||
            (e.startDate.hour() === hour && e.startDate.minute() > 0))
        );
      });
    },
    [currentWeek, expandedEvents]
  );

  function assignLanes(events: Event[]) {
    const sorted = [...events].sort(
      (a, b) => a.startDate.valueOf() - b.startDate.valueOf()
    );
    const lanes: Event[][] = [];

    sorted.forEach((event) => {
      let placed = false;
      for (const lane of lanes) {
        const lastInLane = lane[lane.length - 1];
        const endsBefore = lastInLane.startDate
          .add(lastInLane.minutes, "minute")
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
      lane.map((event) => ({ ...event, lane: laneIndex }))
    );
  }

  const estadoLabels: Record<number | string, string> = {
    11500: "Ejecutado",
    // más estados si los tienes...
  };

  const handleTerciario = async () => {
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
      localStorage.setItem(
        "ejecutar",
        JSON.stringify({
          id: plan.id,
          user: user,
        })
      );
      window.open("/pages/lineas", "_blank");
    } else {
      showSuccess(
        `La orden ya fue finalizada. Estado: ${
          estadoLabels[data.estado as number] || data.estado
        }`
      );
    }
  };

  // Renderizado de celdas
  const renderCell = useCallback(
    (dayIndex: number, hour: number): React.ReactNode => {
      const baseTime = currentWeek.add(dayIndex, "day").hour(hour).minute(0);
      const events = assignLanes(getEventsForCell(dayIndex, hour));
      const laneHeight = 24;
      const maxHeight = 24 * 10;
      return (
        <td
          key={hour}
          className="relative border border-gray-300 bg-white group overflow-hidden p-0 align-top h-24"
        >
          <div className="absolute inset-0 flex items-center justify-center text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <span className="text-xs font-medium">+{events.length}</span>
          </div>
          <div
            className="absolute inset-0 overflow-y-auto"
            style={{
              maxHeight: `${maxHeight}px`,
              overflowX: "hidden", // evita scroll horizontal
            }}
          >
            {events.map((event) => {
              const offsetMinutes = event.startDate.diff(baseTime, "minute");
              const left = Math.min((offsetMinutes / 60) * 100, 100);
              const width = Math.min((event.minutes / 60) * 100, 100 - left);
              const top = (event.lane ?? 0) * laneHeight;
              return (
                <div
                  key={`${event.id}-${event.lane}-${event.startDate.valueOf()}`}
                  onClick={() => setSelectedEvent(event)}
                  className="absolute cursor-pointer transition-all duration-200 hover:z-20 group"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    top,
                    height: `${laneHeight - 2}px`, // Dejar margen inferior
                  }}
                >
                  <div
                    className="absolute top-0 left-0 w-full h-full bg-opacity-90 text-white text-xs font-medium px-1 rounded-sm truncate flex items-center group-hover:text-sm"
                    style={{
                      backgroundColor: event.color,
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
    },
    [getEventsForCell, currentWeek]
  );

  if (isLoading) {
    return (
      <DateLoader
        message="Generando Calendario..."
        backgroundColor="#242424"
        color="#ffff"
      />
    );
  }
  // Renderizado principal
  return (
    <div className="w-full p-8 bg-white rounded-3xl shadow-xl border border-gray-200">
      <div className="flex flex-col gap-8 mb-8">
        {/* Navegación y fecha */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          {/* Botones de navegación */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousWeek}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full shadow transition"
              aria-label="Semana anterior"
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
              onClick={goToToday}
              className="text-sm px-5 py-2 bg-gray-50 border border-gray-200 rounded-full shadow hover:bg-gray-100 hover:text-blue-700 transition text-blue-700 font-semibold"
            >
              Hoy
            </button>
            <button
              onClick={goToNextWeek}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full shadow transition"
              aria-label="Semana siguiente"
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
          {/* Selector de fecha */}
          <div className="relative w-full sm:w-auto sm:min-w-[220px]">
            <input
              type="date"
              className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-full shadow text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition bg-white text-center"
              value={selectedDate ? selectedDate.format("YYYY-MM-DD") : ""}
              onChange={(e) => {
                const value = e.target.value;
                if (!value) {
                  setSelectedDate(null);
                  setCurrentWeek(dayjs().startOf("isoWeek"));
                } else {
                  const newDate = dayjs(value);
                  setSelectedDate(newDate);
                  setCurrentWeek(newDate.startOf("isoWeek"));
                }
              }}
            />
          </div>
        </div>
        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Número de orden */}
          <div className="flex flex-col items-center text-center bg-gray-50 rounded-xl shadow p-3 border border-gray-100">
            <label className="mb-1 text-xs font-semibold text-gray-700">
              N° Orden
            </label>
            <input
              type="text"
              placeholder="Ej: 1234"
              value={filters.numberOrder}
              onChange={(e) =>
                setFilters({ ...filters, numberOrder: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm text-sm text-gray-700 placeholder-gray-300 focus:ring-2 focus:ring-blue-200 text-center"
            />
          </div>
          {/* Línea */}
          <div className="flex flex-col items-center text-center bg-gray-50 rounded-xl shadow p-3 border border-gray-100">
            <label className="mb-1 text-xs font-semibold text-gray-700">
              Línea
            </label>
            <select
              value={filters.codart}
              onChange={(e) =>
                setFilters({ ...filters, codart: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-200 text-center"
            >
              <option value="">Todas</option>
              {[...new Set(events.map((e) => e.codart))].map((cod) => (
                <option key={cod} value={cod}>
                  {cod}
                </option>
              ))}
            </select>
          </div>
          {/* Duración mínima */}
          <div className="flex flex-col items-center text-center bg-gray-50 rounded-xl shadow p-3 border border-gray-100">
            <label className="mb-1 text-xs font-semibold text-gray-700">
              Duración (min)
            </label>
            <input
              type="number"
              placeholder="Ej: 30"
              value={filters.minDuration ?? ""}
              onChange={(e) =>
                setFilters({ ...filters, minDuration: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm text-sm text-gray-700 placeholder-gray-300 focus:ring-2 focus:ring-blue-200 text-center"
            />
          </div>
          {/* Cliente */}
          <div className="flex flex-col items-center text-center bg-gray-50 rounded-xl shadow p-3 border border-gray-100">
            <label className="mb-1 text-xs font-semibold text-gray-700">
              Cliente
            </label>
            <select
              value={filters.clientName}
              onChange={(e) =>
                setFilters({ ...filters, clientName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-200 text-center"
            >
              <option value="">Todos</option>
              {[...new Set(events.map((e) => e.clientName))].map((client) => (
                <option key={client} value={client}>
                  {client}
                </option>
              ))}
            </select>
          </div>
          {/* Botón de limpiar */}
          <div className="flex flex-col items-center text-center justify-end bg-transparent">
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
              className="w-full text-sm px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-400 hover:text-black shadow-sm transition font-semibold"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
        {/* Rango de semana */}
        <h2 className="text-xl font-bold text-gray-900 text-center sm:text-center mt-4 tracking-tight">
          Semana del{" "}
          <span className="text-blue-600">
            {currentWeek.format("DD/MM/YYYY")}
          </span>{" "}
          -{" "}
          <span className="text-blue-600">
            {currentWeek.add(6, "day").format("DD/MM/YYYY")}
          </span>
        </h2>
      </div>
      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 mb-4 rounded-xl shadow">
          <p>{error}</p>
        </div>
      )}
      {/* Tabla */}
      <div className="overflow-x-auto border border-gray-200 rounded-2xl shadow-inner bg-white mt-2">
        <table className="min-w-full table-fixed border-collapse">
          <thead className="bg-gradient-to-r from-blue-500 to-blue-400 text-white sticky top-0 z-10 shadow">
            <tr>
              <th className="w-28 border border-blue-600 px-2 text-left font-semibold tracking-wide">
                Día/Hora
              </th>
              {HOURS.map((hora) => (
                <th
                  key={hora}
                  className="w-20 border border-blue-600 text-center font-semibold"
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
                selectedDate && fecha.isSame(selectedDate, "day");
              return (
                <tr
                  key={dayIndex}
                  className={dayIndex % 2 === 0 ? "bg-gray-50" : "bg-white"}
                >
                  <td
                    className={`border border-gray-200 px-2 font-semibold text-gray-800 sticky left-0 z-10 text-center align-middle ${
                      isSelected ? "bg-blue-50 shadow-inner" : "bg-white"
                    }`}
                  >
                    <div>
                      <span className="block text-base">{dia}</span>
                      <span className="text-blue-600 font-bold text-lg">
                        {numeroDia}
                      </span>
                    </div>
                  </td>
                  {HOURS.map((hora) => renderCell(dayIndex, hora))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Modal */}
      {selectedEvent && (
        <AnimatePresence>
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden"
            >
              {/* Botón cerrar */}
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 bg-white hover:bg-gray-100 text-gray-500 p-2 rounded-full shadow transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <div className="p-8 space-y-8">
                {/* Header con animación */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-3"
                >
                  <Text type="title" color="text-gray-900">
                    {selectedEvent.title}
                  </Text>
                </motion.div>
                {/* Detalles */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-6 shadow-inner"
                >
                  <div className="text-blue-700 font-semibold text-base flex items-center mb-3">
                    <svg
                      className="h-5 w-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
                    </svg>
                    Detalles del evento
                  </div>
                  <div className="space-y-3 text-base text-gray-900">
                    <div className="flex justify-between">
                      <span className="font-semibold">Cliente:</span>
                      <span>{selectedEvent.clientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Inicio:</span>
                      <span>
                        {selectedEvent.startDate.format("DD/MM/YYYY HH:mm")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Fin:</span>
                      <span>
                        {selectedEvent.endDate.format("DD/MM/YYYY HH:mm")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Duración:</span>
                      <span>
                        {getFormattedDuration(Number(selectedEvent.minutes))}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between mt-6">
                    <button
                      onClick={goToPreviousEvent}
                      className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
                    >
                      ← Anterior
                    </button>

                    <button
                      onClick={handleTerciario}
                      className="text-sm bg-[#32a9f3] hover:bg-[#303ce5] px-4 py-2 rounded-lg text-white"
                    >
                      Ver detalles
                    </button>

                    <button
                      onClick={goToNextEvent}
                      className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
                    >
                      Siguiente →
                    </button>
                  </div>
                </motion.div>
                {/* Botón */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex justify-center pt-2"
                >
                  <Button
                    onClick={() => setSelectedEvent(null)}
                    variant="cancel"
                    label="Cerrar"
                  />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
      {/* Estilos */}
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
        .overflow-x-auto::-webkit-scrollbar {
          height: 8px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 8px;
        }
        .overflow-x-auto::-webkit-scrollbar-track {
          background: #f3f4f6;
        }
      `}</style>
    </div>
  );
};

export default CalendarGantt;
