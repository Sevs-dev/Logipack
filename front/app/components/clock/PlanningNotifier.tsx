"use client";
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { usePlanningNotifier } from "../../hooks/usePlanningNotifier";
import { NotificationBell } from "./NotificationBell";
import { NotificationModal } from "./NotificationModal";
import { NotificationToast } from "./NotificationToast";

export default function PlanningNotifier() {
  const {
    activities,
    setActivities,
    notificationCount,
    userInteracted,
  } = usePlanningNotifier();

  const [showModal, setShowModal] = useState(false);
  const [visibleToasts, setVisibleToasts] = useState<number[]>([]);

  // 👉 Cargar toasts previamente cerrados desde localStorage
  const [dismissedToasts, setDismissedToasts] = useState<number[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("dismissedToasts");
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  // 👉 Persistir los cerrados cuando cambian
  useEffect(() => {
    localStorage.setItem("dismissedToasts", JSON.stringify(dismissedToasts));
  }, [dismissedToasts]);

  const handlePause = (id: number) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, paused: true } : a))
    );
  };

  const playMessengerSound = () => {
    const sound = new Audio("/sounds/drop-in.mp3");
    sound.volume = 0.6;
    sound.play().catch((e) => {
      console.warn("No se pudo reproducir el sonido del toast:", e);
    });
  };

  // 👉 Mostrar nuevos toasts notificables (que no estén pausados ni cerrados antes)
  useEffect(() => {
    const newToasts = activities
      .filter(
        (a) =>
          a.finish_notificade &&
          !a.paused &&
          !visibleToasts.includes(a.id) &&
          !dismissedToasts.includes(a.id)
      )
      .map((a) => a.id);

    if (newToasts.length > 0) {
      setVisibleToasts((prev) => [...prev, ...newToasts]);
      playMessengerSound();
    }
  }, [activities, visibleToasts, dismissedToasts]);

  return (
    <>
      {!userInteracted && (
        <div className="fixed bottom-4 right-4 p-3 bg-yellow-100 border border-yellow-300 rounded shadow-lg text-sm z-50">
          🔊 Haz clic en cualquier parte para activar el sonido de notificaciones.
        </div>
      )}

      <NotificationBell count={notificationCount} onClick={() => setShowModal(true)} />

      {/* Stack de toasts */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-4 z-50">
        <AnimatePresence initial={false}>
          {visibleToasts.map((id) => {
            const activity = activities.find((a) => a.id === id);
            return (
              activity && (
                <NotificationToast
                  key={id}
                  activity={activity}
                  onClose={() => {
                    setVisibleToasts((prev) => prev.filter((toastId) => toastId !== id));
                    setDismissedToasts((prev) => [...prev, id]);
                  }}
                />
              )
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showModal && (
          <NotificationModal
            activities={activities}
            onPause={handlePause}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
