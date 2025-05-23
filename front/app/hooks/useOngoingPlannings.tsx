"use client";
import { useEffect, useState, useCallback } from "react";
import { getPlanning } from "@/app/services/planing/planingServices";

type Planning = {
  id: number;
  name: string;
  clock: boolean;
  start_date: string | null;
  end_date: string | null;
};

export const useOngoingPlannings = () => {
  const [ongoing, setOngoing] = useState<Planning[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlannings = useCallback(async () => {
    try {
      const data: Planning[] = await getPlanning();
      const now = new Date();

      const filtered = data.filter((item) => {
        if (!item.clock || !item.start_date || !item.end_date) return false;
        const start = new Date(item.start_date);
        const end = new Date(item.end_date);
        return start <= now && now <= end;
      });

      setOngoing(filtered);
    } catch (err) {
      console.error("Error loading plannings", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    const load = async () => {
      setLoading(true);
      try {
        const data: Planning[] = await getPlanning();
        const now = new Date();

        const filtered = data.filter((item) => {
          if (!item.clock || !item.start_date || !item.end_date) return false;
          const start = new Date(item.start_date);
          const end = new Date(item.end_date);
          return start <= now && now <= end;
        });

        if (isSubscribed) setOngoing(filtered);
      } catch (err) {
        console.error("Error loading plannings", err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    load();

    const interval = setInterval(() => {
      load();
    }, 60 * 1000); // cada 60 segundos

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [fetchPlannings]);

  return { ongoing, loading, refetch: fetchPlannings };
};
