"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaPlay, FaStop, FaRedo } from "react-icons/fa";
import { motion } from "framer-motion";
import { showSuccess, showConfirm } from "../toastr/Toaster";
import Text from "../text/Text";
import ModalSection from "../modal/ModalSection";
import { TimerControlData } from "../../interfaces/TimerController";
import { createTimerControl } from "../../services/timerControl/timerControlServices";
import {
  createTimer,
  finishTimer,
  getTimerEjecutadaById,
  getcontrolTimer,
  resetTimer,
  TimerResponse,
} from "../../services/timer/timerServices";

/* =========================
 *        Tipos
 * ========================= */
interface TimerProps {
  ejecutadaId: number;
  stageId: number;
  initialMinutes: number;
  refetchTimer: () => void;
  userId: number; // reservado si lo necesitas
  ordenId?: string;
  controlId?: number | null;
}

type TimerStatus = "idle" | "running" | "paused" | "finished";

type ControlValue = string | number | boolean | File | null;

type ControlActividad = {
  id_activitie: number;
  descripcion_activitie: string;
  description_fase?: string;
  config: string | Record<string, unknown>;
  valor?: ControlValue;
  clave?: string;
};

type ControlActividadGrouped = Record<string, ControlActividad[]>;

type ParsedConfig =
  | { type: "text" | "email" | "password" | "tel" | "url" | "textarea" }
  | { type: "number"; min?: number; max?: number }
  | { type: "temperature"; min?: number; max?: number }
  | { type: "date" | "time" | "datetime-local" | "color" }
  | { type: "select" | "radio" | "checkbox"; options: string[] }
  | { type: "file" | "image"; accept?: string };

type TimerLookup = {
  exists: boolean;
  timer?: {
    id: number;
    time: number; // minutos
    status: string;
    remaining_seconds?: number;
    server_epoch_ms?: number;
    started_at?: string | null;
    paused_at?: string | null;
  } | null;
};

/** Para reconciliar lo que devuelve resetTimer (TimerResponse) con posibles campos extra del backend */
type ResetRespLike = TimerResponse & {
  remaining_seconds?: number;
  server_epoch_ms?: number;
};

/* =========================
 *     Utilidades
 * ========================= */
function safeJSONParse(raw: unknown): unknown {
  if (typeof raw !== "string") return raw;
  try {
    const once = JSON.parse(raw);
    if (typeof once === "string") {
      try {
        return JSON.parse(once);
      } catch {
        return once;
      }
    }
    return once;
  } catch {
    return raw;
  }
}

function parseConfig(raw: ControlActividad["config"]): ParsedConfig | null {
  const parsed = safeJSONParse(raw);
  if (parsed && typeof parsed === "object" && "type" in (parsed as Record<string, unknown>)) {
    return parsed as ParsedConfig;
  }
  return null;
}

function hasOptions(
  cfg: ParsedConfig | null
): cfg is Extract<ParsedConfig, { options: string[] }> {
  return !!cfg && "options" in cfg && Array.isArray((cfg as { options?: unknown }).options);
}

function serializeValue(v: ControlValue): string {
  if (v === null || v === undefined) return "";
  if (v instanceof File) return v.name;
  return String(v);
}

/** Extrae el id del timer de createTimer sin usar any */
function extractCreatedTimerId(
  created: TimerResponse | { exists: true } | { timer: TimerResponse }
): number | null {
  if ("id" in created && typeof created.id === "number") return created.id;
  if ("timer" in created && created.timer && typeof created.timer.id === "number") {
    return created.timer.id;
  }
  return null;
}

/* =========================
 *       Componente
 * ========================= */
const Timer: React.FC<TimerProps> = ({
  ejecutadaId,
  stageId,
  initialMinutes,
  refetchTimer,
  ordenId,
  controlId = null,
}) => {
  const initialSeconds = Math.max(0, Math.floor(initialMinutes * 60));

  // State
  const [timerId, setTimerId] = useState<number | null>(null);
  const [seconds, setSeconds] = useState<number>(initialSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [alarmActive, setAlarmActive] = useState<boolean>(false);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [controlData, setControlData] = useState<ControlActividad[]>([]);
  const [timerStatus, setTimerStatus] = useState<TimerStatus>("idle");

  // Overlay: sólo en idle
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const showInitialBlur = showIntro && !alarmActive && timerStatus === "idle";
  const timerZ = showInitialBlur ? "z-[2147483647]" : "z-[1000]";

  // Refs
  const intervalRef = useRef<number | null>(null);
  const alertAudio = useRef<HTMLAudioElement | null>(null);
  const targetEpochRef = useRef<number | null>(null);

  // Audio
  useEffect(() => {
    const audio = new Audio("/sounds/beep.mp3");
    audio.loop = true;
    alertAudio.current = audio;
  }, []);

  const unlockAudio = useCallback(() => {
    const a = alertAudio.current;
    if (!a) return;
    a.play()
      .then(() => {
        a.pause();
        a.currentTime = 0;
      })
      .catch(() => {
        /* ignore */
      });
  }, []);

  const setTargetFromSeconds = useCallback((secs: number) => {
    targetEpochRef.current = Date.now() + Math.max(0, secs) * 1000;
  }, []);

  // Cargar timer desde servidor
  useEffect(() => {
    (async () => {
      try {
        const result = (await getTimerEjecutadaById(ejecutadaId)) as TimerLookup;

        if (result.exists && result.timer) {
          setTimerId(result.timer.id);

          const raw = (result.timer.status || "").toLowerCase();
          const mapped: TimerStatus =
            raw === "running" ? "running" : raw === "paused" ? "paused" : raw === "finished" ? "finished" : "idle";

          const serverSecs =
            typeof result.timer.remaining_seconds === "number"
              ? result.timer.remaining_seconds
              : result.timer.time * 60;

          setTimerStatus(mapped);
          setSeconds(serverSecs);

          if (mapped === "running") {
            setTargetFromSeconds(serverSecs);
            setIsRunning(true);
            setShowIntro(false);
          } else {
            setIsRunning(false);
          }
        } else {
          setTimerId(null);
          setTimerStatus("idle");
          setSeconds(initialSeconds);
          setIsRunning(false);
          setShowIntro(true);
        }
      } catch {
        /* ignore */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ejecutadaId]);

  // Cargar controles
  useEffect(() => {
    if (!timerId) return;
    (async () => {
      try {
        const control = (await getcontrolTimer(timerId)) as ControlActividad[];
        setControlData(Array.isArray(control) ? control : []);
      } catch {
        /* ignore */
      }
    })();
  }, [timerId]);

  // Guardar controles
  const handleSaveTimerData = async () => {
    if (!timerId || typeof timerId !== "number") return;

    const nameCookie = document.cookie.split("; ").find((row) => row.startsWith("name="));
    const name = nameCookie?.split("=")[1];
    if (!name) return;

    const payload: TimerControlData = {
      timer_id: timerId,
      user: decodeURIComponent(name),
      data: controlData.map((actividad) => {
        const cfg = parseConfig(actividad.config);
        const tipo = cfg?.type ?? "text";
        const rawVal = actividad.valor;
        const valor =
          typeof rawVal === "object" && rawVal !== null && !(rawVal instanceof File)
            ? JSON.stringify(rawVal)
            : serializeValue(rawVal ?? "");
        return {
          activity_id: actividad.id_activitie,
          tipo,
          descripcion: actividad.descripcion_activitie,
          valor,
          clave: actividad.clave ?? `field_${actividad.id_activitie}`,
        };
      }),
    };

    await createTimerControl(payload);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Start
  const handleStart = async () => {
    try {
      if (!timerId && ordenId) {
        const created = (await createTimer({
          ejecutada_id: ejecutadaId,
          stage_id: stageId,
          orden_id: ordenId,
          control_id: controlId ?? null,
          time: Math.ceil(seconds / 60),
        })) as TimerResponse | { exists: true } | { timer: TimerResponse };

        const newId = extractCreatedTimerId(created);
        if (typeof newId === "number") setTimerId(newId);
      }

      const resetResp = (await resetTimer({
        ejecutada_id: ejecutadaId,
        time_reset: Math.ceil(seconds / 60),
      })) as ResetRespLike;

      const raw = (resetResp.status || "").toLowerCase();
      const mapped: TimerStatus =
        raw === "running" ? "running" : raw === "paused" ? "paused" : raw === "finished" ? "finished" : "idle";

      const serverSecs =
        typeof resetResp.remaining_seconds === "number" ? resetResp.remaining_seconds : (resetResp.time ?? 0) * 60;

      setTimerStatus(mapped);
      setSeconds(serverSecs);
      setTargetFromSeconds(serverSecs);

      unlockAudio();
      setShowIntro(false);
      setIsRunning(true);
    } catch (e) {
      // silencioso
      console.error(e);
    }
  };

  const handleFinish = useCallback(() => {
    setIsRunning(false);
    setAlarmActive(true);
    setSeconds(0);
    if ("Notification" in window) {
      const opts: NotificationOptions = { body: "Puedes iniciar el control cuando estés listo.", requireInteraction: true };
      if (Notification.permission === "granted") new Notification("⏱️ ¡El cronómetro ha terminado!", opts);
      else if (Notification.permission !== "denied")
        Notification.requestPermission().then((perm) => perm === "granted" && new Notification("⏱️ ¡El cronómetro ha terminado!", opts));
    }
    if ("vibrate" in navigator) navigator.vibrate?.([300, 200, 300]);
    alertAudio.current?.play().catch(() => undefined);
    setShowPopup(true);
  }, []);

  const handleResetLocal = () => {
    setSeconds(initialSeconds);
    setIsRunning(true);
    setAlarmActive(false);
    const a = alertAudio.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
    setTargetFromSeconds(initialSeconds);
    unlockAudio();
  };

  const handleStop = () => {
    showConfirm("¿Seguro que quieres detener la Fase de control?", async () => {
      try {
        if (timerId) {
          await finishTimer({
            ejecutada_id: ejecutadaId,
            pause_time: Math.ceil(seconds / 60),
          });
          await refetchTimer();
        }
        setIsRunning(false);
        setAlarmActive(false);
        setTimerStatus("finished");
        const a = alertAudio.current;
        if (a) {
          a.pause();
          a.currentTime = 0;
        }
        showSuccess("Fase de control detenida correctamente.");
      } catch {
        /* ignore */
      }
    });
  };

  // Tick sin drift
  useEffect(() => {
    if (isRunning) {
      if (targetEpochRef.current == null) {
        setTargetFromSeconds(seconds);
      }
      const id = window.setInterval(() => {
        const target = targetEpochRef.current ?? Date.now();
        const rem = Math.max(0, Math.round((target - Date.now()) / 1000));
        setSeconds(rem);
        if (rem === 0) {
          window.clearInterval(id);
          targetEpochRef.current = null;
          intervalRef.current = null;
          handleFinish();
        }
      }, 1000);
      intervalRef.current = id;
    } else if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, setTargetFromSeconds, handleFinish]);

  const percentageRemaining = initialSeconds > 0 ? (seconds / initialSeconds) * 100 : 0;

  const getColorClassByPercentage = () => {
    if (seconds === 0) return "bg-gradient-to-br from-red-600/80 to-red-800/80 animate-pulse";
    if (percentageRemaining <= 25) return "bg-gradient-to-br from-red-500/60 to-red-700/80";
    if (percentageRemaining <= 50) return "bg-gradient-to-br from-yellow-500/60 to-yellow-700/80";
    if (percentageRemaining <= 75) return "bg-gradient-to-br from-blue-600/60 to-blue-800/80";
    return "bg-gradient-to-br from-purple-700/60 to-purple-900/80";
  };

  useEffect(() => {
    if (!showInitialBlur) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showInitialBlur]);

  const handleChange = (actividadId: number, newValue: ControlValue) => {
    setControlData((prev) => prev.map((act) => (act.id_activitie === actividadId ? { ...act, valor: newValue } : act)));
  };

  const handleResetValue = () => {
    const reseteado = controlData.map((actividad) => {
      const cfg = parseConfig(actividad.config);
      const tipo = cfg?.type ?? "text";
      let nuevoValor: ControlValue = "";
      if (tipo === "checkbox") nuevoValor = false;
      if (tipo === "file" || tipo === "image") nuevoValor = null;
      return { ...actividad, valor: nuevoValor };
    });
    setControlData(reseteado);
  };

  const commonInputClass =
    "w-full border border-gray-300 p-2 pl-9 rounded-md text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-center";

  return (
    <>
      {/* Overlay inicial: SOLO en idle */}
      {showInitialBlur && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[2147483646] backdrop-blur-md bg-black/40 flex items-center justify-center pointer-events-auto select-none"
        >
          <div className="bg-white/90 backdrop-blur rounded-xl shadow-2xl p-6 max-w-sm text-center animate-pulse">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">¡Fase de Proceso!</h2>
            <p className="text-gray-600 mb-4">
              Presiona <span className="font-semibold text-green-500">Play</span> para iniciar el cronómetro y poder ver los
              controles de procesos.
            </p>
          </div>
        </div>
      )}

      {/* Timer Widget */}
      {timerStatus !== "finished" && (
        <motion.div
          drag
          dragConstraints={{ left: -100, right: 1000, top: -100, bottom: 100 }}
          dragElastic={0.2}
          whileDrag={{ scale: 1.1 }}
          className={`fixed right-6 bottom-6 ${timerZ} backdrop-blur-md ${getColorClassByPercentage()} border border-white/20 rounded-full shadow-xl p-3 w-24 h-24 flex flex-col items-center justify-center gap-1 transition-all duration-300 hover:scale-105 cursor-grab ${
            !isRunning && !alarmActive ? "opacity-50 hover:opacity-100" : ""
          }`}
        >
          <div className={`text-lg font-bold font-mono tracking-wide text-center ${seconds === 0 ? "text-white" : "text-purple-100"}`}>
            {formatTime(seconds)}
          </div>

          <div className="flex gap-1 mt-1">
            {!isRunning && (
              <button onClick={handleStart} className="p-2 bg-green-500/80 hover:bg-green-600/80 text-white rounded-full shadow-sm transition" aria-label="Iniciar">
                <FaPlay size={10} />
              </button>
            )}
            <button onClick={handleStop} className="p-2 bg-red-500/80 hover:bg-red-600/80 text-white rounded-full shadow-sm transition" aria-label="Parar">
              <FaStop size={10} />
            </button>
            <button onClick={handleResetLocal} className="p-2 bg-indigo-500/80 hover:bg-indigo-600/80 text-white rounded-full shadow-sm transition" aria-label="Reiniciar">
              <FaRedo size={10} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Popup fin de ciclo */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[2147483646] backdrop-blur-sm">
          <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-sm">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">⏱️ ¡Es momento de hacer el Control!</h2>
            <p className="text-gray-600 mb-6">El cronómetro ha terminado. Puedes iniciar el control cuando estés listo.</p>
            <button
              onClick={() => {
                const a = alertAudio.current;
                if (a) {
                  a.pause();
                  a.currentTime = 0;
                }
                setShowPopup(false);
                setShowModal(true);
              }}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-lg font-medium transition duration-200 shadow-md"
            >
              🚀 Iniciar control
            </button>
          </div>
        </div>
      )}

      {/* Modal de control */}
      {showModal && (
        <ModalSection isVisible={showModal} onClose={() => setShowModal(false)}>
          {controlData.length > 0 ? (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto p-4">
              {Object.entries(
                controlData.reduce<ControlActividadGrouped>((acc, actividad) => {
                  const fase = actividad.description_fase || "Sin Fase";
                  if (!acc[fase]) acc[fase] = [];
                  acc[fase].push(actividad);
                  return acc;
                }, {})
              ).map(([fase, actividades]) => (
                <div key={fase} className="mb-4">
                  <Text type="title">{fase}</Text>
                  <div className="grid gap-6">
                    {actividades.map((actividad) => {
                      const cfg = parseConfig(actividad.config);
                      const tipo = cfg?.type ?? "text";
                      const value = actividad.valor ?? "";
                      const options = hasOptions(cfg) ? cfg.options : [];

                      return (
                        <div key={actividad.id_activitie} className="flex flex-col gap-2">
                          <Text type="subtitle">{actividad.descripcion_activitie}</Text>

                          {/* Render dinámico por tipo */}
                          {(() => {
                            switch (tipo) {
                              case "text":
                              case "email":
                              case "password":
                              case "tel":
                              case "url":
                                return (
                                  <input
                                    type={tipo}
                                    className={commonInputClass}
                                    value={String(value ?? "")}
                                    onChange={(e) => handleChange(actividad.id_activitie, e.target.value)}
                                  />
                                );
                              case "number":
                                return (
                                  <input
                                    type="number"
                                    className={commonInputClass}
                                    value={String(value ?? "")}
                                    onChange={(e) =>
                                      handleChange(actividad.id_activitie, e.target.value === "" ? "" : Number(e.target.value))
                                    }
                                  />
                                );
                              case "checkbox":
                                return (
                                  <input
                                    type="checkbox"
                                    className="w-5 h-5 accent-blue-500"
                                    checked={value === true || value === "true"}
                                    onChange={(e) => handleChange(actividad.id_activitie, e.target.checked)}
                                  />
                                );
                              case "select":
                                return (
                                  <select
                                    className={commonInputClass}
                                    value={String(value ?? "")}
                                    onChange={(e) => handleChange(actividad.id_activitie, e.target.value)}
                                  >
                                    <option value="">Seleccione...</option>
                                    {options.map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                );
                              case "textarea":
                                return (
                                  <textarea
                                    className={`${commonInputClass} resize-none`}
                                    rows={3}
                                    value={String(value ?? "")}
                                    onChange={(e) => handleChange(actividad.id_activitie, e.target.value)}
                                  />
                                );
                              case "radio":
                                return (
                                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {options.map((opt) => {
                                      const isSelected = value === opt;
                                      return (
                                        <label
                                          key={opt}
                                          className={`relative flex cursor-pointer items-center justify-between rounded-lg border p-4 shadow-sm transition-all duration-200 ${
                                            isSelected
                                              ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500"
                                              : "border-gray-300 bg-white/10 hover:bg-gray-50"
                                          }`}
                                        >
                                          <input
                                            className="sr-only"
                                            type="radio"
                                            name={`radio-${actividad.id_activitie}`}
                                            value={opt}
                                            checked={isSelected}
                                            onChange={() => handleChange(actividad.id_activitie, opt)}
                                          />
                                          <span className={`flex-1 text-sm font-medium text-center ${isSelected ? "text-indigo-900" : "text-gray-800"}`}>
                                            {opt}
                                          </span>
                                          {isSelected && (
                                            <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                              <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                clipRule="evenodd"
                                              />
                                            </svg>
                                          )}
                                        </label>
                                      );
                                    })}
                                  </div>
                                );
                              case "date":
                              case "time":
                              case "datetime-local":
                                return (
                                  <input
                                    type={tipo}
                                    className={commonInputClass}
                                    value={String(value ?? "")}
                                    onChange={(e) => handleChange(actividad.id_activitie, e.target.value)}
                                  />
                                );
                              case "temperature": {
                                const tcfg = cfg as Extract<ParsedConfig, { type: "temperature" }>;
                                const rangoMin = tcfg.min;
                                const rangoMax = tcfg.max;

                                const numeric = typeof value === "number" ? value : value === "" ? NaN : Number(value);
                                const fueraDeRango =
                                  !Number.isNaN(numeric) &&
                                  ((rangoMin !== undefined && numeric < rangoMin) || (rangoMax !== undefined && numeric > rangoMax));

                                return (
                                  <div className="flex flex-col gap-2">
                                    <input
                                      type="number"
                                      step="0.1"
                                      placeholder={
                                        rangoMin !== undefined && rangoMax !== undefined ? `Entre ${rangoMin} y ${rangoMax}` : "Temperatura"
                                      }
                                      className={`${commonInputClass} ${fueraDeRango ? "border-red-500 ring-red-500" : ""}`}
                                      value={String(value ?? "")}
                                      onChange={(e) => {
                                        const v = e.target.value === "" ? "" : Number.parseFloat(e.target.value);
                                        handleChange(actividad.id_activitie, v as number | "");
                                      }}
                                    />
                                    {fueraDeRango && (
                                      <p className="text-sm text-black bg-red-300 p-2 rounded-md mt-1 text-center">
                                        ⚠️ El valor debe estar entre {rangoMin}°C y {rangoMax}°C
                                      </p>
                                    )}
                                  </div>
                                );
                              }
                              case "color":
                                return (
                                  <input
                                    type="color"
                                    className="w-12 h-10 p-1 rounded border border-gray-300 dark:border-gray-600"
                                    value={String(value || "#000000")}
                                    onChange={(e) => handleChange(actividad.id_activitie, e.target.value)}
                                  />
                                );
                              case "file":
                              case "image":
                                return (
                                  <input
                                    type="file"
                                    accept={(cfg as Extract<ParsedConfig, { accept?: string }>).accept || (tipo === "image" ? "image/*" : "*/*")}
                                    className="block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                                    onChange={(e) => handleChange(actividad.id_activitie, e.target.files?.[0] ?? null)}
                                  />
                                );
                              default:
                                return (
                                  <input
                                    type="text"
                                    className={commonInputClass}
                                    value={String(value ?? "")}
                                    onChange={(e) => handleChange(actividad.id_activitie, e.target.value)}
                                  />
                                );
                            }
                          })()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center">No hay actividades disponibles</p>
          )}

          <hr className="my-4 border-t border-gray-600 w-full max-w-lg mx-auto opacity-60" />
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={async () => {
                try {
                  setShowModal(false);
                  await handleSaveTimerData();

                  if (timerId) {
                    const resetResp = (await resetTimer({
                      ejecutada_id: ejecutadaId,
                      time_reset: initialMinutes,
                    })) as ResetRespLike;

                    const serverSecs =
                      typeof resetResp.remaining_seconds === "number" ? resetResp.remaining_seconds : (resetResp.time ?? 0) * 60;

                    setSeconds(serverSecs);
                    setTimerStatus("running");
                    setIsRunning(true);
                    setTargetFromSeconds(serverSecs);
                    setAlarmActive(false);
                  } else {
                    setAlarmActive(false);
                    setTimerStatus("running");
                    setIsRunning(true);
                    setSeconds(initialSeconds);
                    setTargetFromSeconds(initialSeconds);
                  }

                  handleResetValue();
                  showSuccess("Guardado y reiniciado correctamente.");
                  await refetchTimer();
                } catch {
                  /* ignore */
                }
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700"
            >
              Guardar y reiniciar timer
            </button>
          </div>
        </ModalSection>
      )}
    </>
  );
};

export default Timer;
