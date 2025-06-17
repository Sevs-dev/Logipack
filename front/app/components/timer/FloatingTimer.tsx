"use client";

import { createPortal } from "react-dom";
import Timer from "@/app/components/timer/Timer";
import { useEffect, useState } from "react";

export default function FloatingTimer() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Para evitar problemas en SSR (Next.js), esperamos a que esté montado
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <Timer adaptationId={1} stageId={2} initialMinutes={1} />,
    document.body
  );
}
