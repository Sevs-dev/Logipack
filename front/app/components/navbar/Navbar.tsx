// app/components/navbar/Navbar.tsx
"use client";
import React from "react";
import { Menu, Timer as TimerIcon, X } from "lucide-react";
import { useGlobalTimer } from "../timer/GlobalTimerContext";

interface NavbarProps {
  onToggleSidebar: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const { isOpen, closeTimer } = useGlobalTimer();

  return (
    <header className="sticky top-0 z-20 bg-surface border-b border-border">
      <div className="h-14 px-4 sm:px-6 md:px-8 flex items-center justify-between">
        {/* Botón menú (sólo útil en móvil) */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg hover:bg-surface/80 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>

        {/* Branding */}
        <div className="font-semibold text-foreground">Logipack</div>

        {/* Acciones / usuario */}
        <div className="flex items-center gap-2">
          {isOpen && (
            <button
              onClick={closeTimer}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-600/10 text-emerald-800 hover:bg-emerald-600/20 transition shadow-sm border border-emerald-700/20"
              aria-label="Cerrar timer global"
              title="Cerrar timer global"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <TimerIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Timer activo</span>
              <X className="w-4 h-4 opacity-70" />
            </button>
          )}

          <div className="text-sm text-foreground/70">Usuario</div>
        </div>
      </div>
    </header>
  );
}
