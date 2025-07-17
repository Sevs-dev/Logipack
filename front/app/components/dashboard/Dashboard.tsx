"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "react-countup";
import useUserData from "../../hooks/useUserData";

const emojis = [
  "🤖", "🗂️", "🎯", "📎", "🔧", "🕒", "🧾", "🛠️",
  "📬", "👥", "💬", "🪙", "😎", "🚀", "🔥", "🤓", "💻", "🧃", "🎉", "🧠",
  "👀", "💬", "🙌", "🐱‍👤", "⚡", "🥳", "🪄", "🛠️",
  "🧩", "👾", "🧘", "📦", "📈", "🧑‍💼", "💼", "🏢", "📊", "💡", "🔒",
];

const Dashboard = () => {
  const { userName } = useUserData();
  const [emojiIndex, setEmojiIndex] = useState(0);

  useEffect(() => {
    if (!userName) return;
    const interval = setInterval(() => {
      setEmojiIndex((prev) => (prev + 1) % emojis.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [userName]);

  if (!userName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-lg">No estás logueado. Por favor, inicia sesión.</p>
      </div>
    );
  }

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

        {/* Widgets */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[
            { label: "Usuarios Activos", value: 1234, color: "text-cyan-300", icon: "🧍‍♂️" },
            { label: "Ventas Totales", value: 9870, color: "text-green-400", icon: "💰", prefix: "$" },
            { label: "Nuevos Registros", value: 231, color: "text-purple-300", icon: "📝" },
          ].map(({ label, value, color, icon, prefix }) => (
            <div
              key={label}
              className="backdrop-blur-md bg-white/10 border border-white/10 p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <h2 className="text-lg font-semibold text-white mb-2">
                {icon} {label}
              </h2>
              <p className={`text-3xl font-bold ${color}`}>
                <CountUp end={value} prefix={prefix || ''} duration={2} />
              </p>
              <p className="text-sm text-gray-400 mt-1">Datos actualizados recientemente</p>
            </div>
          ))}
        </section>

        {/* Gráficos y actividad */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="backdrop-blur-md bg-white/10 border border-white/10 p-6 rounded-2xl shadow-lg">
            <h2 className="text-lg font-semibold mb-4">📈 Gráfico de Ventas</h2>
            <div className="h-64 flex items-center justify-center border border-dashed border-gray-500/50 rounded-xl text-gray-400">
              <div className="text-center">
                <p className="text-base">📊 Datos en construcción</p>
                <p className="text-sm mt-2">Estamos preparando tu informe...</p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/10 border border-white/10 p-6 rounded-2xl shadow-lg">
            <h2 className="text-lg font-semibold mb-4">🔔 Actividad Reciente</h2>
            <ul className="space-y-3 text-sm text-gray-300">
              <li>• Nuevo registro: Juan Pérez - Hoy</li>
              <li>• Compra realizada por Ana G. - Ayer</li>
              <li>• Error en servidor reportado - Hace 2 días</li>
              <li>• Notificación enviada a usuarios premium</li>
            </ul>
          </div>
        </section>

        {/* Coming Soon */}
        <section className="mt-12 backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-2xl shadow-inner text-center">
          <h2 className="text-2xl font-bold text-white mb-2">🚀 ¡Más funcionalidades en camino!</h2>
          <p className="text-gray-400">Estamos construyendo nuevas secciones para que tengas el control total de tu sistema.</p>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
