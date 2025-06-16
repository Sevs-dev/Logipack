import { useEffect, useRef, useState } from "react";
import { getPlanning } from "@/app/services/planing/planingServices";

export type Planning = {
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
  const sound = new Audio("/sounds/drop-in.mp3");
  sound.volume = 0.6;
  sound.play().catch((e) => {
    console.warn("No se pudo reproducir el sonido:", e);
  });
};

export const usePlanningNotifier = () => {
  const [activities, setActivities] = useState<Planning[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const notifiedIds = useRef<Set<number>>(new Set());

  const [userInteracted, setUserInteracted] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("userHasInteracted") === "true";
    }
    return false;
  });

  useEffect(() => {
    if (userInteracted) return;

    const handleUserInteraction = () => {
      localStorage.setItem("userHasInteracted", "true");
      setUserInteracted(true);
    };

    window.addEventListener("click", handleUserInteraction, { once: true });
    window.addEventListener("keydown", handleUserInteraction, { once: true });

    return () => {
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
    };
  }, [userInteracted]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const data = await getPlanning();
        const normalized = data.map((item: Planning) => ({
          ...item,
          number_order: item.number_order || `Orden #${item.id}`,
          clock: !!item.clock,
          start_date: item.start_date || null,
          end_date: item.end_date || null,
          paused: !!item.paused,
          finish_notificade: !!item.finish_notificade,
          out: false,
        }));

        const newNotifs = normalized.filter(
          (a: Planning) =>
            !a.paused && a.finish_notificade && !notifiedIds.current.has(a.id)
        );

        if (newNotifs.length > 0 && userInteracted) {
          playMessengerSound();
          newNotifs.forEach((a: Planning) => notifiedIds.current.add(a.id));
          setHasNewNotification(true);
        }

        setNotificationCount(newNotifs.length);
        setActivities(normalized);
      } catch (err) {
        console.error("Error fetching planning:", err);
      }
    };

    fetchActivities();
    const interval = setInterval(fetchActivities, 10000);
    return () => clearInterval(interval);
  }, [userInteracted]);

  return {
    activities,
    setActivities,
    notificationCount,
    hasNewNotification,
    userInteracted,
  };
};
