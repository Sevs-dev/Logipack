"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type IntroProps = {
  name: string; // 👈 único prop requerido
};

const MESSAGES = [
  (n: string) => `Bienvenido, ${n}. El sistema está listo para iniciar.`,
  (n: string) => `Hola ${n}, tu panel de Logipack está preparado.`,
  (n: string) => `Buenos días, ${n}. La información de hoy ya está disponible.`,
  (n: string) => `${n}, los indicadores están actualizados y listos.`,
  (n: string) => `Bienvenido de nuevo, ${n}. Continuemos con la gestión.`,
  (n: string) => `Hola ${n}, Logipack está preparado para tus tareas.`,
  (n: string) => `Saludos, ${n}. Los documentos y órdenes están listos para trabajar.`,
];

export default function Intro({ name }: IntroProps) {
  const [visible, setVisible] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Mantener el mismo mensaje durante el ciclo de vida del componente
  const message = useMemo(() => {
    const idx = Math.floor(Math.random() * MESSAGES.length);
    return MESSAGES[idx](name.split(" ")[0] || "usuario");
  }, [name]);

  useEffect(() => {
    // Sonido tipo messenger (coloca el archivo en /public/sounds/notify.mp3)
    audioRef.current = new Audio("/sounds/notify.mp3");
    audioRef.current.volume = 0.35;
    // Intentar reproducir (algunos navegadores requieren interacción previa)
    audioRef.current.play().catch(() => {
      // Silencioso si el autoplay está bloqueado
      // console.debug("Autoplay bloqueado; se omitió el sonido de Intro.");
    });

    // Autocierre
    const t = setTimeout(() => setVisible(false), 4000);
    return () => {
      clearTimeout(t);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 50, y: -50 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 50, y: -50 }}
          transition={{ duration: 0.25 }}
          className="fixed top-4 right-4 z-[9999] rounded-2xl bg-surface px-4 py-3 shadow-lg border border-border min-w-[260px] max-w-[360px]"
          role="status"
          aria-live="polite"
        >
          <p className="text-foreground text-sm font-medium">{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
