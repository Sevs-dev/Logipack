import { useEffect, useState, useCallback, useMemo } from "react";
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import isBetween from 'dayjs/plugin/isBetween';
import isoWeek from 'dayjs/plugin/isoWeek';
import { getPlanning } from "../../services/planing/planingServices";
import { DynamicIcon } from "../dinamicSelect/DynamicIcon";
import Button from "../buttons/buttons";
import Text from "../text/Text";
import { motion, AnimatePresence } from "framer-motion";

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
}

interface Event extends Omit<PlanningItem, 'start_date' | 'end_date' | 'duration' | 'codart'> {
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
  minutes: number;
  title: string;
}

// Constantes
const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const HOURS = Array.from({ length: 12 }, (_, i) => 6 + i);
const DEFAULT_WEEK = dayjs().startOf('isoWeek');

// Funciones auxiliares
const parsePlanningData = (data: PlanningItem[]): Event[] => {
  return data.map((item) => {
    if (!item.start_date || !item.end_date) {
      console.warn('Evento con datos inválidos:', item);
      return null;
    }

    return {
      ...item,
      startDate: dayjs(item.start_date.replace(' ', 'T')),
      endDate: dayjs(item.end_date.replace(' ', 'T')),
      minutes: typeof item.duration === 'string'
        ? parseInt(item.duration, 10)
        : item.duration,
      title: item.number_order,
    };
  }).filter(Boolean) as Event[];
};

const splitEventByDay = (event: Event): Event[] => {
  const parts: Event[] = [];
  let current = dayjs(event.startDate);
  const end = dayjs(event.endDate);

  while (current.isBefore(end, 'minute')) {
    const dayEnd = current.endOf('day');
    const partStart = current;
    const partEnd = dayEnd.isBefore(end) ? dayEnd : end;
    const duration = partEnd.diff(partStart, 'minute');
    parts.push({
      ...event,
      startDate: partStart,
      endDate: partEnd,
      minutes: duration,
    });

    current = partEnd.add(1, 'minute');
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

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data: PlanningItem[] = await getPlanning();
        const mappedEvents = parsePlanningData(data);
        setEvents(mappedEvents);
        setError(null);
      } catch (err) {
        console.error("Error al cargar el planning:", err);
        setError("No se pudieron cargar los eventos. Inténtalo más tarde.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Eventos expandidos por día
  const expandedEvents = useMemo(() => {
    return events.flatMap(splitEventByDay);
  }, [events]);

  // Navegación de semanas
  const goToPreviousWeek = useCallback(() => {
    setCurrentWeek(prev => prev.subtract(1, 'week'));
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentWeek(prev => prev.add(1, 'week'));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentWeek(dayjs().startOf('isoWeek'));
  }, []);

  const getFormattedDuration = (minutes: number): string => {
    if (minutes <= 0) return 'menos de 1 minuto';
    const days = Math.floor(minutes / 1440); // 1440 min = 1 día
    const remainingMinutesAfterDays = minutes % 1440;
    const hours = Math.floor(remainingMinutesAfterDays / 60);
    const remainingMinutes = remainingMinutesAfterDays % 60;
    const parts: string[] = [];
    if (days > 0) parts.push(`${days} día${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hora${hours > 1 ? 's' : ''}`);
    if (remainingMinutes > 0) parts.push(`${remainingMinutes} min`);
    return parts.join(' ');
  };

  // Filtrar eventos para una celda específica
  const getEventsForCell = useCallback((dayIndex: number, hour: number): Event[] => {
    const baseTime = currentWeek.add(dayIndex, 'day').hour(hour).minute(0);

    // Filtramos solo los eventos para el día seleccionado
    if (selectedDate) {
      const startOfDay = selectedDate.startOf('day');
      const endOfDay = selectedDate.endOf('day');

      return expandedEvents.filter(e => {
        return dayjs(e.startDate).isBetween(startOfDay, endOfDay, 'minute', '[]') &&
          (
            e.startDate.hour() === hour ||
            (e.startDate.hour() < hour && e.endDate.hour() > hour) ||
            (e.startDate.hour() === hour && e.startDate.minute() > 0)
          );
      });
    }

    // Si no se seleccionó una fecha, retornar todos los eventos
    return expandedEvents.filter(e => {
      return dayjs(e.startDate).isSame(baseTime, 'day') &&
        (
          e.startDate.hour() === hour ||
          (e.startDate.hour() < hour && e.endDate.hour() > hour) ||
          (e.startDate.hour() === hour && e.startDate.minute() > 0)
        );
    });
  }, [currentWeek, expandedEvents, selectedDate]);

  function assignLanes(events: Event[]) {
    const sorted = [...events].sort((a, b) => a.startDate.valueOf() - b.startDate.valueOf());
    const lanes: Event[][] = [];

    sorted.forEach(event => {
      let placed = false;
      for (const lane of lanes) {
        const lastInLane = lane[lane.length - 1];
        const endsBefore = lastInLane.startDate.add(lastInLane.minutes, 'minute').isBefore(event.startDate);
        if (endsBefore) {
          lane.push(event);
          placed = true;
          break;
        }
      }
      if (!placed) lanes.push([event]);
    });
    return lanes.flatMap((lane, laneIndex) =>
      lane.map(event => ({ ...event, lane: laneIndex }))
    );
  }

  // Renderizado de celdas
  const renderCell = useCallback((dayIndex: number, hour: number): React.ReactNode => {
    const baseTime = currentWeek.add(dayIndex, 'day').hour(hour).minute(0);
    const events = assignLanes(getEventsForCell(dayIndex, hour));
    const laneHeight = 24;
    const maxHeight = 24 * 10; // Ajusta según el número de filas que deseas mostrar sin scroll

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
            overflowX: 'hidden', // evita scroll horizontal
          }}
        >
          {events.map(event => {
            const offsetMinutes = event.startDate.diff(baseTime, 'minute');
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
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }}
                >
                  <span className="mr-1">
                    <DynamicIcon iconName={event.icon} className="w-3 h-3 text-black" />
                  </span>
                  {event.title}
                </div>
              </div>
            );
          })}
        </div>
      </td>
    );
  }, [getEventsForCell, currentWeek]);

  // Renderizado principal
  return (
    <div className="p-6 max-w-6xl mx-auto bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-2xl">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 sm:gap-6">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={goToPreviousWeek}
            className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 focus:ring-offset-2"
            aria-label="Semana anterior"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm bg-white text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 active:bg-indigo-100 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 focus:ring-offset-2"
          >
            Hoy
          </button>
          <button
            onClick={goToNextWeek}
            className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 focus:ring-offset-2"
            aria-label="Semana siguiente"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="relative w-full sm:w-auto sm:min-w-[200px] flex-shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="date"
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 transition-all duration-200 bg-white"
            value={selectedDate ? selectedDate.format('YYYY-MM-DD') : ''}
            onChange={e => {
              const value = e.target.value;
              if (!value) {
                const today = dayjs();
                setSelectedDate(null); // vacía el input
                setCurrentWeek(today.startOf('week'));
              } else {
                const newDate = dayjs(value);
                setSelectedDate(newDate);
                setCurrentWeek(newDate.startOf('week'));
              }
            }}
          />
        </div>
        <h2 className="text-2xl font-bold text-indigo-900 text-center sm:text-left sm:w-full sm:order-3">
          Semana del {currentWeek.format('DD/MM/YYYY')} - {currentWeek.add(6, 'day').format('DD/MM/YYYY')}
        </h2>
      </div>

      {/* Estado de carga */}
      {isLoading && (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto border-2 border-indigo-200 rounded-xl shadow-inner bg-white">
        <table className="min-w-full table-fixed border-collapse">
          <thead className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white sticky top-0 z-10">
            <tr>
              <th className="w-24 border border-gray-600 px-2 text-left">Día/Hora</th>
              {HOURS.map(hora => (
                <th key={hora} className="w-20 border border-gray-600 text-center">
                  {hora}:00
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WEEK_DAYS.map((dia, dayIndex) => {
              const fecha = currentWeek.add(dayIndex, 'day');
              const numeroDia = fecha.format('D');

              return (
                <tr key={dayIndex} className={dayIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="border border-gray-300 px-2 font-semibold text-gray-800 sticky left-0 bg-white z-10 text-center">
                    <div>
                      {dia}
                      <div className="text-blue-500 font-normal">{numeroDia}</div>
                    </div>
                  </td>
                  {HOURS.map(hora => renderCell(dayIndex, hora))}
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative w-full max-w-xl rounded-3xl border border-white/20 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-2xl shadow-2xl overflow-hidden"
            >
              {/* Botón cerrar */}
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 bg-white/80 dark:bg-zinc-800/70 hover:bg-white hover:dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 p-2 rounded-full shadow transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="p-6 sm:p-8 space-y-8">
                {/* Header con animación */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-3"
                >
                  <Text type="title" color="text-white">{selectedEvent.title}</Text>
                </motion.div>

                {/* Detalles */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-2xl border border-indigo-200 dark:border-indigo-300/20 bg-white/50 dark:bg-indigo-900/30 backdrop-blur-md p-5 shadow-inner"
                >
                  <div className="text-indigo-700 dark:text-indigo-300 font-medium text-sm flex items-center mb-3">
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
                    </svg>
                    Detalles del evento
                  </div>
                  <div className="space-y-3 text-sm text-zinc-700 dark:text-zinc-200">
                    <div className="flex justify-between"><span className="text-white">Inicio:</span><span>{selectedEvent.startDate.format('DD/MM/YYYY HH:mm')}</span></div>
                    <div className="flex justify-between"><span className="text-white">Fin:</span><span>{selectedEvent.endDate.format('DD/MM/YYYY HH:mm')}</span></div>
                    <div className="flex justify-between"><span className="text-white">Duración:</span><span>{getFormattedDuration(Number(selectedEvent.minutes))} minutos</span></div>
                  </div>
                </motion.div>

                {/* Información adicional */}
                {/* <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-600 bg-white/40 dark:bg-zinc-800/60 backdrop-blur-md p-5 shadow-inner"
                >
                  <div className="text-zinc-600 dark:text-zinc-300 font-medium text-sm flex items-center mb-3">
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Información adicional
                  </div>
                  <div className="flex justify-between text-sm text-zinc-700 dark:text-zinc-200">
                    <span className="text-zinc-500 dark:text-zinc-400">ID del evento:</span>
                    <span>{selectedEvent.id}</span>
                  </div>
                </motion.div> */}

                {/* Botón */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex justify-center pt-2"
                >
                  <Button onClick={() => setSelectedEvent(null)} variant="cancel" label="Cancelar" />
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
      `}</style>
    </div>
  );
};

export default CalendarGantt;