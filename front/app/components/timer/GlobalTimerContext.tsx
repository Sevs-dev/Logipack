"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import Timer from "./Timer";

export type TimerOpenPayload = {
  ejecutadaId: number;
  stageId: number;
  initialMinutes: number;
  ordenId?: string;
  controlId?: number | null;
  refetchTimer?: () => void;
};

type GlobalTimerContextValue = {
  openTimerFor: (p: TimerOpenPayload) => void;
  closeTimer: () => void;
  isOpen: boolean;
};

type InternalState = {
  payload: TimerOpenPayload | null;
};

const GlobalTimerContext = createContext<GlobalTimerContextValue | null>(null);
const STORAGE_KEY = "globalTimerPayload:v1";

function isValidPayload(obj: unknown): obj is TimerOpenPayload {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.ejecutadaId === "number" &&
    typeof o.stageId === "number" &&
    typeof o.initialMinutes === "number" &&
    (o.ordenId === undefined || typeof o.ordenId === "string") &&
    (o.controlId === undefined || o.controlId === null || typeof o.controlId === "number")
  );
}

export const GlobalTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<InternalState>({ payload: null });

  // Rehidrata último timer
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (isValidPayload(parsed)) {
        setState({ payload: parsed });
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Persiste/Clean
  useEffect(() => {
    if (state.payload) localStorage.setItem(STORAGE_KEY, JSON.stringify(state.payload));
    else localStorage.removeItem(STORAGE_KEY);
  }, [state.payload]);

  const value = useMemo<GlobalTimerContextValue>(
    () => ({
      openTimerFor: (p) => setState({ payload: p }),
      closeTimer: () => setState({ payload: null }),
      isOpen: state.payload != null,
    }),
    [state.payload]
  );

  return (
    <GlobalTimerContext.Provider value={value}>
      {state.payload && (
        <Timer
          ejecutadaId={state.payload.ejecutadaId}
          stageId={state.payload.stageId}
          initialMinutes={state.payload.initialMinutes}
          refetchTimer={state.payload.refetchTimer ?? (() => {})}
          userId={0}
          ordenId={state.payload.ordenId}
          controlId={state.payload.controlId ?? null}
        />
      )}
      {children}
    </GlobalTimerContext.Provider>
  );
};

export function useGlobalTimer(): GlobalTimerContextValue {
  const ctx = useContext(GlobalTimerContext);
  if (!ctx) throw new Error("useGlobalTimer debe usarse dentro de <GlobalTimerProvider>");
  return ctx;
}
