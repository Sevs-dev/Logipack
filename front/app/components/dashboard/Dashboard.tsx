"use client";

import React, { useEffect, useState, useRef, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "react-countup";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, PieLabelRenderProps } from "recharts";
import useUserData from "../../hooks/useUserData";
import { getPlanDash } from "../../services/planing/planingServices";
import { getPlanningById, validate_orden } from "../../services/planing/planingServices";
import { showError, showSuccess } from "../toastr/Toaster";
import { actividades_ejecutadas } from "@/app/services/planing/planingServices";

const emojis = [
  "🤖", "🗂️", "🎯", "📎", "🔧", "🕒", "🧾", "🛠️",
  "📬", "👥", "💬", "🪙", "😎", "🚀", "🔥", "🤓", "💻", "🧃", "🎉", "🧠",
  "👀", "💬", "🙌", "🐱‍👤", "⚡", "🥳", "🪄", "🛠️",
  "🧩", "👾", "🧘", "📦", "📈", "🧑‍💼", "💼", "🏢", "📊", "💡", "🔒",
];

type Planning = {
  id: number | string;
  number_order?: string;
  client?: { name: string };
  client_id?: string | number;
  status_dates?: string;
  created_at?: string;
  end_date?: string;
};

type CardProps = {
  children: ReactNode;
  // ...otros props opcionales
}

const COLORS = [
  "#FACC15", "#22d3ee", "#4ade80", "#a78bfa",
  "#f472b6", "#fb7185", "#6ee7b7", "#fcd34d"
];

// 1. Helper para normalizar los keys de estado
// Helper normalizador reforzado
const normalizeKey = (key: string) => {
  const norm = key
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quita tildes
    .replace(/[\s-]+/g, "_")
    .replace(/^en_/, ""); // <-- si empieza por "en_", lo quita

  // Aliases
  if (["creacion", "en_creacion", "encreacion"].includes(norm)) return "creacion";
  if (["planificacion", "en_planificacion"].includes(norm)) return "planificacion";
  if (["ejecutado", "ejecutada"].includes(norm)) return "ejecutado";
  if (["en_ejecucion", "ejecucion"].includes(norm)) return "en_ejecucion";
  return norm;
};


// 2. Diccionario labels (con keys normalizados)
const estadoLabels: Record<string, string> = {
  creacion: "En Creación",
  planificacion: "Planificación",
  ejecutado: "Ejecutadas",
  en_ejecucion: "En Ejecución",
};

const ALL_ESTADOS = Object.keys(estadoLabels); // Muestra siempre estos

const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  outerRadius,
  percent,
  name,
  value,
}: PieLabelRenderProps & { name?: string; value?: number }) => {
  if (!value) return null;
  const RADIAN = Math.PI / 180;
  const SEPARACION_LABEL = 1.28; // O prueba 1.3, 1.32, etc
  const radius = Number(outerRadius) * SEPARACION_LABEL;
  const x = Number(cx) + radius * Math.cos(-Number(midAngle) * RADIAN);
  const y = Number(cy) + radius * Math.sin(-Number(midAngle) * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      fontSize={13}
      fontWeight={700}
      textAnchor={x > Number(cx) ? "start" : "end"}
      dominantBaseline="central"
      className="drop-shadow"
    >
      {`${name}: ${value} (${(percent! * 100).toFixed(0)}%)`}
    </text>
  );
};

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { name: string; value: number; percent: number } }[];
}) => {
  if (active && payload && payload.length) {
    const { name, value, percent } = payload[0].payload;
    return (
      <div className="bg-black/80 rounded-xl px-4 py-2 text-white text-xs shadow-lg">
        <b>{name}</b>
        <br />
        {value} órdenes
        <br />
        {Math.round(percent * 100)}%
      </div>
    );
  }
  return null;
};


const Card: React.FC<CardProps> = ({ children, ...props }) => (
  <motion.div
    whileHover={{ scale: 1.035, boxShadow: "0 6px 36px #0ff3c22e" }}
    transition={{ type: "spring", stiffness: 180, damping: 16 }}
    className="backdrop-blur-lg bg-gradient-to-tr from-white/10 via-cyan-900/20 to-white/5 border border-cyan-600/10 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow"
    {...props}
  >
    {children}
  </motion.div>
);
const Dashboard = () => {
  const { userName } = useUserData();
  const [emojiIndex, setEmojiIndex] = useState(0);
  const [planning, setPlanning] = useState<Planning[]>([]);
  const didFetch = useRef(false);
  const uniqueEstados = ALL_ESTADOS;
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<string>("todos");

  useEffect(() => {
    if (!userName) return;
    const interval = setInterval(() => {
      setEmojiIndex((prev) => (prev + 1) % emojis.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [userName]);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    const fetchData = async () => {
      try {
        const data = await getPlanDash();
        setPlanning(data || []);
      } catch (error) {
        console.error("Error al traer planning:", error);
      }
    };
    fetchData();
  }, []);

  if (!userName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-lg">No estás logueado. Por favor, inicia sesión.</p>
      </div>
    );
  }

  const hoy = new Date().toISOString().slice(0, 10);
  const ordenesHoy = planning.filter(
    (p: Planning) => (p.created_at ?? '').slice(0, 10) === hoy
  ).length;

  // Top 5 clientes (por cantidad de órdenes)
  const topClientes = Object.entries(
    planning.reduce((acc: Record<string, number>, curr: Planning) => {
      const clienteName = curr.client?.name ?? String(curr.client_id ?? 'Sin cliente');
      acc[clienteName] = (acc[clienteName] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // -------- Pie Chart ESTADOS DINÁMICO --------
  // Siempre todos los estados posibles
  const conteoPorEstado: Record<string, number> = planning.reduce(
    (acc, curr) => {
      const estado = normalizeKey(curr.status_dates ?? "Sin Estado");
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const dataEstados = ALL_ESTADOS.map((key) => ({
    name: estadoLabels[key] ?? key,
    value: conteoPorEstado[key] || 0,
    rawKey: key,
  }));

  const dataEstadosFiltrados = dataEstados.filter((d) => d.value > 0);
  // Para los filtros, muestra siempre todos

  const ordenesFiltradas =
    estadoSeleccionado === "todos"
      ? planning
      : planning.filter(
        (p) => normalizeKey(p.status_dates ?? "Sin Estado") === estadoSeleccionado
      );

  // KPIs (color dinámico por estado, normalizado)
  const estadosKPIs = [
    {
      label: "Órdenes Totales",
      color: "text-blue-400",
      icon: "📦",
      value: planning.length,
    },
    ...dataEstados.map((e, idx) => ({
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
    })),
  ];

  const handleTerciario = async (orden: Planning) => {
    if (!orden?.id) {
      showError("No hay evento seleccionado");
      return;
    }
    // Trae el plan real por ID
    const res = await getPlanningById(Number(orden.id)); // CORREGIDO
    if (!res || !res.plan) {
      showError("No se pudo obtener la orden");
      return;
    }
    const { plan } = res;

    localStorage.removeItem("ejecutar");

    // Valida si ya está finalizada
    const validacion = await validate_orden(plan.id);

    if (validacion.estado === 100 || validacion.estado === null) {
      // Busca el user en la cookie
      const user = document.cookie
        .split('; ')
        .find(row => row.startsWith('name='))
        ?.split('=')[1];

      if (!user) {
        showError("No se encontró usuario");
        return;
      }

      localStorage.setItem("ejecutar", JSON.stringify({
        id: plan.id,
        user: user
      }));
      window.open("/pages/lineas", "_blank");
    } else {
      showSuccess(
        `La orden ya fue finalizada. Estado: ${estadoLabels[normalizeKey(validacion.estado?.toString() ?? "")] || validacion.estado}`
      );
    }
  };

  const obtenerActividades = async (orden: Planning) => {
    if (!orden?.id) {
      showError("No hay evento seleccionado");
      return;
    }

    try {
      const res = await getPlanningById(Number(orden.id));
      if (!res?.plan) {
        showError("No se pudo obtener la orden");
        return;
      }

      const { plan } = res;
      const data = await actividades_ejecutadas(plan.id);

      // Si hay actividades ejecutadas, abre la página
      if (Array.isArray(data?.actividades) && data.actividades.length > 0) {
        window.open(`/pages/ejecuciones/${plan.id}`);
      } else {
        showError("No hay actividades ejecutadas para esta orden");
      }
    } catch (error) {
      console.error('Error al obtener fases:', error);
      showError("Error inesperado al obtener actividades");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-950 text-white px-4 md:px-10 py-6">
      <main role="main" className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col items-center text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow mb-2">
            Panel de Control
          </h1>
          <p className="text-lg md:text-xl text-gray-300 flex items-center gap-2">
            Bienvenido,&nbsp;
            <span className="text-cyan-400 font-bold underline underline-offset-4 decoration-wavy">
              {userName}
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={emojiIndex}
                initial={{ opacity: 0, scale: 0.4, rotate: -30, y: -20 }}
                animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
                exit={{ opacity: 0, scale: 0.4, rotate: 30, y: 20 }}
                transition={{ type: "spring", stiffness: 500, damping: 25, duration: 0.5 }}
                className="text-3xl md:text-4xl inline-block"
              >
                {emojis[emojiIndex]}
              </motion.span>
            </AnimatePresence>
          </p>
        </header>

        {/* Widgets Dinámicos */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 text-center">
          {estadosKPIs.map(({ label, color, icon, value }) => (
            <div
              key={label}
              className="backdrop-blur-md bg-white/10 border border-white/10 p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <h2 className="text-xl font-semibold text-white mb-2">
                {icon} {label}
              </h2>
              <p className={`text-3xl font-bold ${color}`}>
                <CountUp end={value} duration={2} />
              </p>
              <p className="text-xs text-gray-400 mt-2">Datos Actualizados</p>
            </div>
          ))}
          {/* KPI: Órdenes creadas hoy */}
          <div className="backdrop-blur-md bg-white/10 border border-white/10 p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
            <h2 className="text-xl font-semibold text-white mb-2">📅 Órdenes hoy</h2>
            <p className="text-3xl font-bold text-fuchsia-400">
              <CountUp end={ordenesHoy} duration={2} />
            </p>
            <p className="text-xs text-gray-400 mt-2">Órdenes creadas hoy ({hoy})</p>
          </div>
        </section>

        {/* Pie Chart y Top Clientes */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Pie Chart */}
          <Card>
            <h2 className="text-xl md:text-2xl font-extrabold mb-5 text-center text-cyan-200 tracking-wider flex items-center justify-center gap-2 drop-shadow-sm">
              <span className="text-3xl md:text-4xl animate-pulse">📊</span>
              <span className="drop-shadow">Distribución de Estados</span>
            </h2>

            <div className="w-full flex flex-col items-center min-h-[280px]">
              {dataEstados.every((d) => d.value === 0) ? (
                <div className="flex flex-col items-center py-14 opacity-70 select-none">
                  <span className="text-6xl mb-3 animate-bounce">🤷‍♂️</span>
                  <span className="text-base md:text-lg text-cyan-100/90 font-medium">
                    No hay datos para mostrar.
                  </span>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={dataEstados}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={92}
                        label={renderCustomLabel}
                        isAnimationActive
                        animationDuration={800}
                        stroke="#0ea5e9"
                        strokeWidth={2.5}
                      >
                        {dataEstadosFiltrados.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={COLORS[i % COLORS.length]}
                            className="hover:opacity-80 transition-opacity"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={<CustomTooltip />}
                        wrapperStyle={{
                          borderRadius: 12,
                          background: "#0f172a",
                          color: "#fff",
                        }}
                        cursor={{ fill: "#0ea5e930" }}
                      />
                      {/* <Legend ... /> REMOVIDO */}
                    </PieChart>
                  </ResponsiveContainer>

                  {/* ✅ Leyenda personalizada afuera */}
                  <div className="flex flex-wrap justify-center gap-4 mt-5">
                    {dataEstadosFiltrados.map((entry, i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <span
                          className="w-3 h-3 rounded-full inline-block"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <span className="text-sm text-cyan-100/90 font-medium">
                          {entry.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </Card>


          {/* Top 5 Clientes */}
          <Card>
            <h2 className="text-lg font-bold mb-4 text-center text-amber-200 tracking-wide flex items-center justify-center gap-2">
              <span className="text-2xl">🏆</span> Top 5 Clientes
            </h2>
            <ol className="space-y-3">
              {topClientes.length === 0 ? (
                <div className="flex flex-col items-center py-12 opacity-60">
                  <span className="text-5xl mb-2 animate-bounce">🤷‍♂️</span>
                  <span className="text-base">Sin clientes destacados.</span>
                </div>
              ) : (
                topClientes.map(([clienteName, cantidad], idx) => (
                  <motion.li
                    key={clienteName}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex items-center justify-between px-4 py-2 rounded-xl shadow-sm ${idx === 0
                      ? "bg-gradient-to-r from-amber-400/30 via-white/0 to-white/0"
                      : idx === 1
                        ? "bg-gradient-to-r from-gray-300/20 via-white/0 to-white/0"
                        : idx === 2
                          ? "bg-gradient-to-r from-amber-700/30 via-white/0 to-white/0"
                          : "bg-white/0"
                      }`}
                  >
                    <span className="font-bold text-lg flex items-center gap-2">
                      {["🥇", "🥈", "🥉"][idx] || <span className="text-gray-500">#{idx + 1}</span>}{" "}
                      <span className="ml-2">{clienteName}</span>
                    </span>
                    <span className="text-2xl font-extrabold text-emerald-400 drop-shadow-sm">{cantidad}</span>
                  </motion.li>
                ))
              )}
            </ol>
          </Card>
        </section>

        {/* Filtros dinámicos de estado */}
        <div className="flex flex-wrap gap-2 mb-6 items-center justify-center">
          <button
            onClick={() => setEstadoSeleccionado("todos")}
            className={`px-4 py-1 rounded-full font-semibold border capitalize
      ${estadoSeleccionado === "todos"
                ? "bg-cyan-400 text-black shadow"
                : "bg-white/10 text-white border-white/20 hover:bg-cyan-800"}`}
          >
            Todos
          </button>
          {uniqueEstados.map((est) => (
            <button
              key={est}
              onClick={() => setEstadoSeleccionado(est)}
              className={`px-4 py-1 rounded-full font-semibold border capitalize
        ${estadoSeleccionado === est
                  ? "bg-cyan-400 text-black shadow"
                  : "bg-white/10 text-white border-white/20 hover:bg-cyan-800"}`}
            >
              {estadoLabels[est] ?? est}
            </button>
          ))}
        </div>

        {/* Tabla detalle */}
        <section className="backdrop-blur-md bg-white/10 border border-white/10 p-6 rounded-2xl shadow-lg">
          <h2 className="text-lg font-semibold mb-4 text-center">
            📋 Órdenes{" "}
            {estadoSeleccionado === "todos"
              ? ""
              : (estadoLabels[estadoSeleccionado] ?? estadoSeleccionado)}
            <span className="ml-2 text-gray-400 font-normal text-sm">
              ({ordenesFiltradas.length})
            </span>
          </h2>

          <div
            className="overflow-auto max-h-[400px] rounded-2xl shadow-inner border border-white/10"
            style={{
              scrollbarColor: "#818cf8 #23272f",        // Para Firefox
              scrollbarWidth: "thin",
              msOverflowStyle: "none",                   // IE/Edge
            }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                width: 10px;
                background: #23272f;
                border-radius: 12px;
              }
              div::-webkit-scrollbar-thumb {
                background: linear-gradient(135deg, #22d3ee 0%, #818cf8 100%);
                border-radius: 12px;
                min-height: 48px;
                border: 2px solid #23272f;
                transition: background 0.2s;
                box-shadow: 0 1px 8px #23272f55;
              }
              div::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(135deg, #818cf8 0%, #22d3ee 100%);
              }
              div::-webkit-scrollbar-track {
                background: #23272f;
                border-radius: 12px;
              }
              div::-webkit-scrollbar-corner {
                background: #23272f;
              }
            `}</style>
            <table className="min-w-full text-xs md:text-sm border-separate">
              <thead>
                <tr>
                  <th className="px-4 py-2 bg-gradient-to-r via-gray-900 to-gray-950 text-cyan-300 font-semibold  text-center shadow-md tracking-wide border-b border-cyan-600/30 border rounded-tl-xl">
                    N° Orden
                  </th>
                  <th className="px-4 py-2 bg-gradient-to-r via-gray-900 to-gray-950 text-cyan-300 font-semibold text-center shadow-md tracking-wide border-b border-cyan-600/30 border  ">
                    Estado
                  </th>
                  <th className="px-4 py-2 bg-gradient-to-r via-gray-900 to-gray-950 text-cyan-300 font-semibold text-center shadow-md tracking-wide border-b border-cyan-600/30 border  ">
                    Cliente
                  </th>
                  <th className="px-4 py-2 bg-gradient-to-r via-gray-900 to-gray-950 text-cyan-300 font-semibold text-center shadow-md tracking-wide border-b border-cyan-600/30 border  ">
                    Fecha Creación
                  </th>
                  <th className="px-4 py-2 bg-gradient-to-r via-gray-900 to-gray-950 text-cyan-300 font-semibold  text-center shadow-md tracking-wide border-b border-cyan-600/30 border rounded-tr-xl">
                    Fecha Fin
                  </th>
                </tr>
              </thead>
              <tbody>
                {ordenesFiltradas.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`
            transition-colors
            hover:bg-gradient-to-r hover:from-[#22d3ee]/10 hover:to-[#818cf8]/10
            ${idx % 2 === 0 ? "bg-white/5" : "bg-white/10"}
            rounded-xl
          `}
                  >
                    <td className="px-4 py-2 text-center   font-mono font-bold text-white/90 drop-shadow border border-white/10">
                      {item.number_order}
                    </td>
                    <td className="px-4 py-2 text-center border border-white/10">
                      <span
                        className={`
    inline-block px-3 py-1 rounded-full text-xs font-semibold transition
    ${(() => {
                            switch (normalizeKey(item.status_dates ?? "Sin Estado")) {
                              case "ejecutado":
                                return "bg-green-500/20 text-green-400 cursor-pointer hover:bg-green-600/40 hover:scale-105 ring-2 ring-green-300/40";
                              case "planificacion":
                                return "bg-cyan-500/20 text-cyan-300";
                              case "creacion":
                                return "bg-yellow-400/20 text-yellow-200";
                              case "en_ejecucion":
                                return "bg-fuchsia-600/20 text-fuchsia-300 cursor-pointer hover:bg-fuchsia-700/40 hover:scale-105 ring-2 ring-fuchsia-300/40";
                              default:
                                return "bg-gray-500/10 text-white/60";
                            }
                          })()}
  `}
                        style={{
                          userSelect: "none",
                          transition: "all 0.15s"
                        }}
                        onClick={() => {
                          const estado = normalizeKey(item.status_dates ?? "Sin Estado");
                          if (estado === "en_ejecucion") {
                            handleTerciario(item);
                          }
                          if (estado === "ejecutado") {
                            obtenerActividades(item);
                          }
                          // Aquí puedes agregar más casos si mañana tienes más estados interactivos
                        }}
                        title={
                          normalizeKey(item.status_dates ?? "Sin Estado") === "en_ejecucion"
                            ? "Ir a ejecución"
                            : undefined
                        }
                        role={normalizeKey(item.status_dates ?? "Sin Estado") === "en_ejecucion" ? "button" : undefined}
                        tabIndex={normalizeKey(item.status_dates ?? "Sin Estado") === "en_ejecucion" ? 0 : undefined}
                      >
                        {estadoLabels[normalizeKey(item.status_dates ?? "Sin Estado")] ?? item.status_dates}
                        {normalizeKey(item.status_dates ?? "Sin Estado") === "en_ejecucion" && (
                          <span className="ml-2 animate-pulse">🚀</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center font-semibold text-white/80 border border-white/10">
                      {item.client?.name ?? item.client_id}
                    </td>
                    <td className="px-4 py-2 text-center text-xs text-white/60 border border-white/10">
                      {item.created_at?.slice(0, 16)}
                    </td>
                    <td className="px-4 py-2 text-center  text-xs text-white/60 border border-white/10">
                      {item.end_date?.slice(0, 16) || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>


      </main>
    </div>
  );
};

export default Dashboard;
