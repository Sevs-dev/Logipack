"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "react-countup";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, PieLabelRenderProps } from "recharts";
import useUserData from "../../hooks/useUserData";
import { getPlanDash } from "../../services/planing/planingServices";

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
  // otros campos...
};

type EstadoCard = {
  label: string;
  color: string;
  icon: string;
  filter: (arr: Planning[]) => number;
};

const estados: EstadoCard[] = [
  {
    label: "Órdenes Totales",
    color: "text-blue-400",
    icon: "📦",
    filter: (arr: Planning[]) => arr.length,
  },
  {
    label: "En Creación",
    color: "text-yellow-300",
    icon: "📝",
    filter: (arr: Planning[]) =>
      arr.filter((x) => (x.status_dates ?? "").toLowerCase() === "creacion").length,
  },
  {
    label: "En Planificación",
    color: "text-cyan-300",
    icon: "🗓️",
    filter: (arr: Planning[]) =>
      arr.filter(
        (x) =>
          (x.status_dates ?? "").toLowerCase() === "planificación" ||
          (x.status_dates ?? "").toLowerCase() === "planificacion"
      ).length,
  },
  {
    label: "Ejecutadas",
    color: "text-green-400",
    icon: "✅",
    filter: (arr: Planning[]) =>
      arr.filter((x) => (x.status_dates ?? "").toLowerCase() === "ejecutado").length,
  },
];

const COLORS = ["#FACC15", "#22d3ee", "#4ade80", "#a78bfa", "#f472b6"];

const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
  value
}: PieLabelRenderProps & { name?: string; value?: number }) => {
  if (!value) return null;
  const RADIAN = Math.PI / 180;
  const radius = Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 1.15;
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

// Tooltip personalizado tipado
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
        <b>{name}</b><br />
        {value} órdenes<br />
        {Math.round(percent * 100)}%
      </div>
    );
  }
  return null;
};
const Dashboard = () => {
  const { userName } = useUserData();
  const [emojiIndex, setEmojiIndex] = useState(0);
  const [planning, setPlanning] = useState<Planning[]>([]);
  const didFetch = useRef(false);

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
        console.log("Planning data fetched:", data);
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

  // KPIs adicionales
  const hoy = new Date().toISOString().slice(0, 10);
  const ordenesHoy = planning.filter(
    (p: Planning) => (p.created_at ?? '').slice(0, 10) === hoy
  ).length;

  // Top 3 clientes (por cantidad de órdenes)
  const topClientes = Object.entries(
    planning.reduce((acc: Record<string, number>, curr: Planning) => {
      // Usa el nombre si existe, si no muestra el id
      const clienteName = curr.client?.name ?? String(curr.client_id ?? 'Sin cliente');
      acc[clienteName] = (acc[clienteName] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10); // Top 10

  // Extrae y normaliza los estados únicos
  const uniqueEstados = Array.from(
    new Set(planning.map(p => (p.status_dates ?? "Sin Estado").toLowerCase()))
  );

  // Opcional: Si quieres ordenarlos o poner uno por defecto adelante
  // Por defecto, muestra todos
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<string>("todos");

  // Para labels bonitos
  const estadoLabels: Record<string, string> = {
    creacion: "En Creación",
    planificacion: "En Planificación",
    planificación: "En Planificación",
    ejecutado: "Ejecutadas",
    // ...agrega los que necesites
    "sin estado": "Sin Estado",
  };
  

  const ordenesFiltradas = estadoSeleccionado === "todos"
    ? planning
    : planning.filter(
      (p) => (p.status_dates ?? "Sin Estado").toLowerCase() === estadoSeleccionado
    );


  // Pie chart de estados
  const dataEstados = [
    { name: "Creación", value: estados[1].filter(planning) },
    { name: "Planificación", value: estados[2].filter(planning) },
    { name: "Ejecutadas", value: estados[3].filter(planning) },
  ];

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
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 text-center">
          {estados.map(({ label, color, icon, filter }) => (
            <div
              key={label}
              className="backdrop-blur-md bg-white/10 border border-white/10 p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <h2 className="text-lg font-semibold text-white mb-2">
                {icon} {label}
              </h2>
              <p className={`text-3xl font-bold ${color}`}>
                <CountUp end={filter(planning)} duration={2} />
              </p>
              <p className="text-sm text-gray-400 mt-1">Datos actualizados</p>
            </div>
          ))}
          {/* KPI: Órdenes creadas hoy */}
          <div className="backdrop-blur-md bg-white/10 border border-white/10 p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
            <h2 className="text-lg font-semibold text-white mb-2">📅 Órdenes hoy</h2>
            <p className="text-3xl font-bold text-fuchsia-400">
              <CountUp end={ordenesHoy} duration={2} />
            </p>
            <p className="text-sm text-gray-400 mt-1">Creadas el {hoy}</p>
          </div>
        </section>

        {/* Pie Chart y Top Clientes */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Pie Chart */}
          <div className="backdrop-blur-md bg-white/10 border border-white/10 p-6 rounded-2xl shadow-lg">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span role="img" aria-label="pie">📊</span> Distribución de Estados
            </h2>
            <div className="w-full flex flex-col items-center">
              {dataEstados.every(d => d.value === 0) ? (
                <div className="text-gray-400 text-base py-16">No hay datos para mostrar.</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={dataEstados}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={renderCustomLabel}
                      isAnimationActive
                      animationDuration={900}
                      stroke="#1e293b"
                      strokeWidth={2}
                    >
                      {dataEstados.map((entry, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top 3 Clientes */}
          <div className="backdrop-blur-md bg-white/10 border border-white/10 p-6 rounded-2xl shadow-lg">
            <h2 className="text-lg font-semibold mb-4">🏆 Top 10 Clientes</h2>
            <ol className="space-y-3">
              {topClientes.map(([clienteName, cantidad], idx) => (
                <li key={clienteName} className="flex items-center justify-between px-2">
                  <span className="font-bold text-xl">
                    {["🥇", "🥈", "🥉"][idx] || `#${idx + 1}`} {clienteName}
                  </span>
                  <span className="text-2xl font-bold text-emerald-400">{cantidad}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Tabla detalle */}
        {/* 3. Renderiza una sección por cada estado */}
        {/* Filtros dinámicos de estado */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setEstadoSeleccionado("todos")}
            className={`px-4 py-1 rounded-full font-semibold border capitalize
      ${estadoSeleccionado === "todos"
                ? "bg-cyan-400 text-black shadow"
                : "bg-white/10 text-white border-white/20 hover:bg-cyan-800"}
    `}
          >
            Todos
          </button>
          {uniqueEstados.map(est => (
            <button
              key={est}
              onClick={() => setEstadoSeleccionado(est)}
              className={`px-4 py-1 rounded-full font-semibold border capitalize
        ${estadoSeleccionado === est
                  ? "bg-cyan-400 text-black shadow"
                  : "bg-white/10 text-white border-white/20 hover:bg-cyan-800"}
      `}
            >
              {estadoLabels[est] ?? est}
            </button>
          ))}
        </div>

        <section className="backdrop-blur-md bg-white/10 border border-white/10 p-6 rounded-2xl shadow-lg mb-12">
          <h2 className="text-lg font-semibold mb-4">
            📋 Órdenes {estadoSeleccionado === "todos" ? "" : (estadoLabels[estadoSeleccionado] ?? estadoSeleccionado)}
            <span className="ml-2 text-gray-400 font-normal text-sm">
              ({ordenesFiltradas.length})
            </span>
          </h2>

          <div className="overflow-auto max-h-[400px]">
            <table className="min-w-full text-xs md:text-sm text-left border-separate border-spacing-y-2">
              <thead>
                <tr>
                  <th className="px-2 py-1 bg-black/20 rounded">N° Orden</th>
                  <th className="px-2 py-1 bg-black/20 rounded">Estado</th>
                  <th className="px-2 py-1 bg-black/20 rounded">Cliente</th>
                  <th className="px-2 py-1 bg-black/20 rounded">Fecha Creación</th>
                  <th className="px-2 py-1 bg-black/20 rounded">Fecha Fin</th>
                </tr>
              </thead>
              <tbody>
                {ordenesFiltradas.map((item) => (
                  <tr key={item.id}>
                    <td className="px-2 py-1 bg-white/10 rounded">{item.number_order}</td>
                    <td className="px-2 py-1 bg-white/10 rounded">
                      {estadoLabels[(item.status_dates ?? "Sin Estado").toLowerCase()] ?? item.status_dates}
                    </td>
                    <td className="px-2 py-1 bg-white/10 rounded">
                      {item.client?.name ?? item.client_id}
                    </td>
                    <td className="px-2 py-1 bg-white/10 rounded">
                      {item.created_at?.slice(0, 16)}
                    </td>
                    <td className="px-2 py-1 bg-white/10 rounded">
                      {item.end_date?.slice(0, 16) || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Coming Soon */}
        <section className="mt-12 backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-2xl shadow-inner text-center">
          <h2 className="text-2xl font-bold text-white mb-2">🚀 ¡Más funcionalidades en camino!</h2>
          <p className="text-gray-400">¿Qué más necesitas en este dashboard? ¡Lo armamos!</p>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
