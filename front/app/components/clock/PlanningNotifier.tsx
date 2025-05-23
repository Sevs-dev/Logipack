"use client";
import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaRegBell } from "react-icons/fa";
import { getPlanning } from "@/app/services/planing/planingServices";

type Planning = {
  id: number;
  number_order: string;
  clock: boolean;
  start_date: string | null;
  end_date: string | null;
  paused: boolean;
  finish_notificade: boolean;
  out: boolean;
};

const playMessengerSound = () => {
  const src = "/sounds/drop-in.mp3";
  const sound = new Audio(src);
  sound.volume = 0.6;
  sound.play().catch((err) => {
    console.error("Error reproduciendo sonido:", err, "Archivo:", src);
  });
};

export default function PlanningNotifier() {
  const [activities, setActivities] = useState<Planning[]>([]);
  const [showSingle, setShowSingle] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const notifiedIds = useRef<Set<number>>(new Set());
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const fetchActivities = async () => {
    try {
      const data: any[] = await getPlanning(); // asumiendo que este servicio devuelve cualquier cosa

      console.log("Fetched activities raw:", data);

      // Normalizamos los datos para que siempre tengan la estructura que espera el componente
      const normalizedData: Planning[] = data.map((item) => ({
        id: item.id,
        number_order: item.number_order || `Orden #${item.id}`, // si no hay número, ponemos un fallback
        clock: !!item.clock,
        start_date: item.start_date || null,
        end_date: item.end_date || null,
        paused: !!item.paused,
        finish_notificade: !!item.finish_notificade,
        out: false,
      }));

      setActivities(normalizedData);
    } catch (error) {
      console.error("Error fetching planning:", error);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []); 
 

  useEffect(() => {
    if (showModal && notificationCount > 0) {
      playMessengerSound();
    }
  }, [showModal, notificationCount]);

  const topActivity = activities.length > 0 ? activities[0] : null;

  const now = new Date();
  let remainingTime = 0;
  let remainingRatio = 1;
  let formattedRemaining = "";

  if (topActivity?.start_date && topActivity?.end_date) {
    const end = new Date(topActivity.end_date);
    remainingTime = Math.max(end.getTime() - now.getTime(), 0);
    const duration = end.getTime() - new Date(topActivity.start_date).getTime();
    remainingRatio = duration > 0 ? remainingTime / duration : 0;

    const totalMinutes = Math.floor(remainingTime / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    formattedRemaining = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  const handlePause = (id: number) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, paused: true } : a))
    );
  };

  const handleCloseSingle = () => {
    playMessengerSound();
    setShowSingle(false);
  };

  const toggleModal = () => {
    setShowModal((prev) => !prev);
  };

  return (
    <>
      <button
        onClick={toggleModal}
        aria-label="Mostrar todas las notificaciones"
        className="fixed top-6 right-6 z-50 p-3 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-lg hover:shadow-2xl transition-transform duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-60"
      >
        <span className="relative">
          <FaRegBell className="w-6 h-6 text-white" />
          {notificationCount > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 18 }}
              className="absolute -top-2 -right-3 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full animate-pulse font-semibold select-none"
            >
              {notificationCount}
            </motion.span>
          )}
        </span>
      </button>

      <AnimatePresence>
        {showSingle && topActivity && !showModal && (
          <motion.div
            key="single-notification"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
            className={`fixed bottom-6 right-6 z-50 w-80 max-w-[90vw] rounded-2xl overflow-hidden shadow-xl backdrop-blur-xl border border-white/10
              ${topActivity.paused
                ? "bg-yellow-500/20"
                : topActivity.finish_notificade
                  ? "bg-orange-500/25"
                  : "bg-indigo-500/15"
              }`}
          >
            <div className="p-4 flex items-center gap-4">
              <div className="w-11 h-11 relative shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle className="text-zinc-500/30" strokeWidth="3" stroke="currentColor" fill="none" cx="18" cy="18" r="15" />
                  <circle
                    strokeWidth="3"
                    stroke="white"
                    strokeLinecap="round"
                    fill="none"
                    cx="18"
                    cy="18"
                    r="15"
                    strokeDasharray="94.2"
                    strokeDashoffset={(1 - remainingRatio) * 94.2}
                    style={{ transition: "stroke-dashoffset 0.3s ease" }}
                  />
                </svg>
                <span className="absolute inset-0 grid place-content-center font-mono text-xs font-semibold text-white">
                  {formattedRemaining}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white truncate">{topActivity.number_order}</h3>
                <p className="text-sm text-white/70 select-text">
                  {topActivity.paused
                    ? "Actividad pausada"
                    : topActivity.finish_notificade
                      ? "Se acerca el final"
                      : "En progreso"}
                </p>
              </div>
              <button
                aria-label="Cerrar notificación"
                onClick={handleCloseSingle}
                className="text-white hover:text-red-400 transition-colors"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <motion.div
            key="modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 bg-black bg-opacity-60 flex justify-center items-center p-6"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 text-white space-y-4"
            >
              <h2 className="text-xl font-bold">Actividades en curso</h2>
              {activities.length === 0 ? (
                <p className="text-sm text-white/70">No hay actividades activas por ahora.</p>
              ) : (
                activities.map((act) => (
                  <div
                    key={act.id}
                    className={`p-4 rounded-xl border shadow flex justify-between items-center transition-all duration-200 ${act.paused
                      ? "bg-yellow-500/20"
                      : act.finish_notificade
                        ? "bg-orange-500/25"
                        : "bg-indigo-500/15"
                      }`}
                  >
                    <div>
                      <h3 className="font-semibold truncate">{act.number_order}</h3>
                      <p className="text-sm text-white/70">
                        {act.paused
                          ? "Pausada"
                          : act.finish_notificade
                            ? "Cerca de finalizar"
                            : "En progreso"}
                      </p>
                    </div>
                    {!act.paused && (
                      <button
                        onClick={() => handlePause(act.id)}
                        aria-label={`Pausar actividad ${act.number_order}`}
                        className="bg-yellow-400 text-black rounded px-3 py-1 text-sm font-semibold hover:bg-yellow-500 transition"
                      >
                        Pausar
                      </button>
                    )}
                  </div>
                ))
              )}
              <button
                onClick={() => setShowModal(false)}
                className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 transition rounded py-2 font-semibold"
              >
                Cerrar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
