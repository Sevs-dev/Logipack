"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import useUserData from "@/app/hooks/useUserData";
import Header from "../Charts/Header";
import KPIGrid from "../Charts/KPIGrid";
import StatesPie, { PieDatum } from "../Charts/StatesPie";
import TopClients from "../Charts/TopClients";
import EstadoChips from "../Charts/EstadoChips";
import OrdersTable from "../Charts/OrdersTable";
import {
  emojis,
  ALL_ESTADOS,
  COLORS,
  estadoLabels,
  normalizeKey,
} from "../Charts/helpers";
import { KPIItem, Planning } from "../Charts/types";

import {
  getPlanDash,
  getPlanningById,
  validate_orden,
  actividades_ejecutadas,
} from "@/app/services/planing/planingServices";
import { showError, showSuccess } from "@/app/components/toastr/Toaster";

export default function Dashboard() {
  const { userName } = useUserData();
  const [emojiIndex, setEmojiIndex] = useState(0);
  const [planning, setPlanning] = useState<Planning[]>([]);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<string>("todos");
  const didFetch = useRef(false);

  // Rotación del emoji
  useEffect(() => {
    if (!userName) return;
    const interval = setInterval(
      () => setEmojiIndex((p) => (p + 1) % emojis.length),
      10000
    );
    return () => clearInterval(interval);
  }, [userName]);

  // Fetch inicial
  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    (async () => {
      try {
        const data = await getPlanDash();
        setPlanning(data || []);
      } catch (err) {
        console.error("Error al traer planning:", err);
      }
    })();
  }, []);

  // ==== TODOS LOS HOOKS ARRIBA, SIN RETURNS EN MEDIO ====

  const hoy = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const ordenesHoy = useMemo(
    () =>
      planning.filter((p) => (p.created_at ?? "").slice(0, 10) === hoy).length,
    [planning, hoy]
  );

  const conteoPorEstado = useMemo(() => {
    return planning.reduce<Record<string, number>>((acc, curr) => {
      const estado = normalizeKey(curr.status_dates ?? "Sin Estado");
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    }, {});
  }, [planning]);

  const dataEstados: (PieDatum & { rawKey: string })[] = useMemo(
    () =>
      ALL_ESTADOS.map((key) => ({
        name: estadoLabels[key] ?? key,
        value: conteoPorEstado[key] || 0,
        rawKey: key,
      })),
    [conteoPorEstado]
  );

  const ordenesFiltradas = useMemo(
    () =>
      estadoSeleccionado === "todos"
        ? planning
        : planning.filter(
            (p) =>
              normalizeKey(p.status_dates ?? "Sin Estado") ===
              estadoSeleccionado
          ),
    [estadoSeleccionado, planning]
  );

  const kpis: KPIItem[] = useMemo(() => {
    const base: KPIItem[] = [
      {
        label: "Órdenes Totales",
        color: "text-blue-400",
        icon: "📦",
        value: planning.length,
      },
    ];
    const extras = dataEstados.map((e, idx) => ({
      label: e.name,
      color: `text-[${COLORS[idx % COLORS.length]}]`,
      icon:
        e.rawKey === "creacion"
          ? "📝"
          : e.rawKey === "planificacion"
          ? "🗓️"
          : e.rawKey === "ejecutado"
          ? "✅"
          : e.rawKey === "en_ejecucion"
          ? "🔄"
          : "📂",
      value: e.value,
    }));
    return [...base, ...extras];
  }, [planning.length, dataEstados]);

  const topClientes = useMemo(() => {
    const counts = planning.reduce<Record<string, number>>((acc, curr) => {
      const name = curr.client?.name ?? String(curr.client_id ?? "Sin cliente");
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [planning]);

  // Handlers
  const handleTerciario = React.useCallback(async (orden: Planning) => {
    if (!orden?.id) return showError("No hay evento seleccionado");

    const res = await getPlanningById(Number(orden.id));
    if (!res || !res.plan) return showError("No se pudo obtener la orden");

    const { plan } = res;
    localStorage.removeItem("ejecutar");

    const validacion = await validate_orden(plan.id);

    if (validacion.estado === 100 || validacion.estado === null) {
      const user = document.cookie
        .split("; ")
        .find((row) => row.startsWith("name="))
        ?.split("=")[1];
      if (!user) return showError("No se encontró usuario");

      localStorage.setItem("ejecutar", JSON.stringify({ id: plan.id, user }));
      window.open("/pages/lineas", "_blank");
    } else {
      showSuccess(
        `La orden ya fue finalizada. Estado: ${
          estadoLabels[normalizeKey(validacion.estado?.toString() ?? "")] ||
          validacion.estado
        }`
      );
    }
  }, []);

  const obtenerActividades = React.useCallback(async (orden: Planning) => {
    if (!orden?.id) return showError("No hay evento seleccionado");
    try {
      const res = await getPlanningById(Number(orden.id));
      if (!res?.plan) return showError("No se pudo obtener la orden");

      const { plan } = res;
      const data = await actividades_ejecutadas(plan.id);
      if (Array.isArray(data?.actividades) && data.actividades.length > 0) {
        window.open(`/pages/ejecuciones/${plan.id}`);
      } else {
        showError("No hay actividades ejecutadas para esta orden");
      }
    } catch (error) {
      console.error("Error al obtener fases:", error);
      showError("Error inesperado al obtener actividades");
    }
  }, []);

  const isLoggedIn = Boolean(userName);

  // ==== RENDER (SIN RETURNS ANTES DE LOS HOOKS) ====
  return (
    <div className="min-h-screen app-bg text-foreground px-4 sm:px-6 md:px-10 py-6">
      {!isLoggedIn ? (
        <div className="min-h-[60vh] flex items-center justify-center">
          <p className="text-lg">
            No estás logueado. Por favor, inicia sesión.
          </p>
        </div>
      ) : (
        <main role="main" className="max-w-7xl mx-auto">
          <Header userName={userName ?? ""} emoji={emojis[emojiIndex]} />

          <KPIGrid
            kpis={kpis}
            extra={{
              label: "Órdenes hoy",
              value: ordenesHoy,
              sub: `Órdenes creadas hoy (${hoy})`,
              accentClass: "text-fuchsia-400",
            }}
          />

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            <StatesPie data={dataEstados} />
            <TopClients topClientes={topClientes} />
          </section>

          <EstadoChips
            estados={ALL_ESTADOS}
            selected={estadoSeleccionado}
            labels={estadoLabels}
            onSelect={setEstadoSeleccionado}
          />

          <OrdersTable
            items={ordenesFiltradas}
            onEjecucion={handleTerciario}
            onActividades={obtenerActividades}
            tituloSufijo={
              estadoSeleccionado === "todos"
                ? ""
                : estadoLabels[estadoSeleccionado] ?? estadoSeleccionado
            }
          />
        </main>
      )}
    </div>
  );
}
