import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaRegBell  } from "react-icons/fa";

const getPlanning = async () => [
  {
    id: 1,
    name: "Actividad Test",
    clock: true,
    start_date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    end_date: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
    paused: false,
    finish_notificade: false,
    out: false,
  },
  {
    id: 2,
    name: "Otra actividad",
    clock: true,
    start_date: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    end_date: new Date(Date.now() + 1000 * 60 * 50).toISOString(),
    paused: false,
    finish_notificade: false,
    out: false,
  },
];

type Planning = {
  id: number;
  name: string;
  clock: boolean;
  start_date: string | null;
  end_date: string | null;
  paused: boolean;
  finish_notificade: boolean;
  out: boolean;
};

const playMessengerSound = (type: "in" | "out") => {
  const sound = new Audio(`/sounds/${type === "in" ? "drop-in" : "drop-out"}.mp3`);
  sound.volume = 0.6;
  sound.play();
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

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const data = await getPlanning();
        const now = new Date();

        const updatedActivities = data.map((activity) => {
          if (!activity.clock || !activity.start_date || !activity.end_date) return activity;
          const start = new Date(activity.start_date);
          const end = new Date(activity.end_date);
          const remainingTime = end.getTime() - now.getTime();

          if (now > end) {
            return { ...activity, out: true };
          }
          if (remainingTime <= 30 * 60 * 1000 && !activity.paused) {
            return { ...activity, finish_notificade: true };
          }
          return activity;
        });

        const ongoing = updatedActivities.filter((item) => {
          if (!item.clock || !item.start_date || !item.end_date) return false;
          const start = new Date(item.start_date);
          const end = new Date(item.end_date);
          return start <= now && now <= end && !item.out;
        });

        const newActivities = ongoing.filter((act) => !notifiedIds.current.has(act.id));

        newActivities.forEach((act) => {
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Nueva actividad en curso", {
              body: act.name,
              icon: "/notification-icon.png",
            });
          }
          notifiedIds.current.add(act.id);
        });

        setActivities(ongoing);
        setNotificationCount(ongoing.length);
        setShowSingle(newActivities.length > 0);
        if (ongoing.length === 0) setShowModal(false);
      } catch (error) {
        console.error("Error fetching planning:", error);
      }
    };

    fetchActivities();
    const interval = setInterval(fetchActivities, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showModal && notificationCount > 0) {
      playMessengerSound("in");
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
    playMessengerSound("out");
    setShowSingle(false);
  };

  const toggleModal = () => {
    setShowModal((prev) => !prev);
  };

  return (
    <>
      {/* Botón con badge */}
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

      {/* Notificación única */}
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
              {/* Progreso circular */}
              <div className="w-11 h-11 relative shrink-0">
                <svg
                  className="w-full h-full transform -rotate-90"
                  viewBox="0 0 36 36"
                >
                  <circle
                    className="text-zinc-500/30"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    cx="18"
                    cy="18"
                    r="15"
                  />
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

              {/* Texto */}
              <div className="flex-1">
                <h3 className="font-bold text-white truncate">{topActivity.name}</h3>
                <p className="text-sm text-white/70 select-text">
                  {topActivity.paused
                    ? "Actividad pausada"
                    : topActivity.finish_notificade
                      ? "Se acerca el final"
                      : "En progreso"}
                </p>
              </div>

              {/* Botón cerrar */}
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

      {/* Modal */}
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
              className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 flex flex-col gap-4"
            >
              <h2 className="text-xl font-bold text-white">Actividades en curso</h2>

              {activities.length === 0 && (
                <p className="text-zinc-400">No hay actividades activas.</p>
              )}

              <ul className="flex flex-col gap-3 overflow-y-auto max-h-96">
                {activities.map((act) => {
                  const start = act.start_date ? new Date(act.start_date) : null;
                  const end = act.end_date ? new Date(act.end_date) : null;
                  let remaining = 0;
                  let ratio = 1;
                  let timeStr = "";

                  if (start && end) {
                    const now = new Date();
                    remaining = Math.max(end.getTime() - now.getTime(), 0);
                    const duration = end.getTime() - start.getTime();
                    ratio = duration > 0 ? remaining / duration : 0;

                    const totalMin = Math.floor(remaining / (1000 * 60));
                    const h = Math.floor(totalMin / 60);
                    const m = totalMin % 60;
                    timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
                  }

                  return (
                    <li
                      key={act.id}
                      className={`bg-zinc-800 rounded-lg p-3 flex items-center justify-between gap-3
                        ${act.paused ? "opacity-70" : "opacity-100"}`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Progreso circular pequeño */}
                        <div className="w-10 h-10 relative shrink-0">
                          <svg
                            className="w-full h-full transform -rotate-90"
                            viewBox="0 0 36 36"
                          >
                            <circle
                              className="text-zinc-700"
                              strokeWidth="3"
                              stroke="currentColor"
                              fill="none"
                              cx="18"
                              cy="18"
                              r="15"
                            />
                            <circle
                              strokeWidth="3"
                              stroke="cyan"
                              strokeLinecap="round"
                              fill="none"
                              cx="18"
                              cy="18"
                              r="15"
                              strokeDasharray="94.2"
                              strokeDashoffset={(1 - ratio) * 94.2}
                              style={{ transition: "stroke-dashoffset 0.3s ease" }}
                            />
                          </svg>
                          <span className="absolute inset-0 grid place-content-center font-mono text-xs text-cyan-300 font-semibold select-none">
                            {timeStr}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-semibold">{act.name}</p>
                          <p className="text-sm text-zinc-400">
                            {act.paused
                              ? "Pausada"
                              : act.finish_notificade
                                ? "Finalizando pronto"
                                : "En progreso"}
                          </p>
                        </div>
                      </div>

                      {!act.paused && (
                        <button
                          onClick={() => handlePause(act.id)}
                          className="px-3 py-1 rounded-md bg-yellow-500 hover:bg-yellow-600 text-zinc-900 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          aria-label={`Pausar actividad ${act.name}`}
                        >
                          Pausar
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>

              <button
                onClick={() => setShowModal(false)}
                className="mt-6 self-end px-5 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md font-semibold text-white transition-colors focus:outline-none focus:ring-4 focus:ring-indigo-400"
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
