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
} from "../../services/timer/timerServices";

/* =========================
 *        Tipos
 * ========================= */
interface TimerProps {
  ejecutadaId: number;
  stageId: number;
  initialMinutes: number;
  refetchTimer: () => void;
  userId: number;
}

type TimerStatus = "running" | "paused" | "finished";

type ControlValue = string | number | boolean | File | null;

type ControlActividad = {
  id_activitie: number;
  descripcion_activitie: string;
  description_fase?: string;
  // puede venir string (JSON) o objeto
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
  timer?: { id: number; time: number; status: TimerStatus };
};

/* =========================
 *     Utilidades (TS-safe)
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
  if (parsed && typeof parsed === "object" && "type" in (parsed as object)) {
    return parsed as ParsedConfig;
  }
  return null;
}

function hasOptions(
  cfg: ParsedConfig | null
): cfg is Extract<ParsedConfig, { options: string[] }> {
  return (
    !!cfg &&
    "options" in cfg &&
    Array.isArray((cfg as { options?: unknown }).options)
  );
}

function serializeValue(v: ControlValue): string {
  if (v === null || v === undefined) return "";
  if (v instanceof File) return v.name;
  return String(v);
}

/* =========================
 *       Componente
 * ========================= */
const Timer: React.FC<TimerProps> = ({
  ejecutadaId,
  stageId,
  initialMinutes,
  refetchTimer,
}) => {
  const initialSeconds = initialMinutes * 60;

  // State
  const [timerId, setTimerId] = useState<number | null>(null);
  const [seconds, setSeconds] = useState<number>(initialSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [alarmActive, setAlarmActive] = useState<boolean>(false);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [controlData, setControlData] = useState<ControlActividad[]>([]);
  const [timerStatus, setTimerStatus] = useState<TimerStatus>("paused");

  // Overlay: SIEMPRE aparece al cargar (hasta tocar Play)
  const [showIntro, setShowIntro] = useState<boolean>(true);

  // Overlay activo si hay intro, no hay alarma y no está terminado
  const showInitialBlur =
    showIntro && !alarmActive && timerStatus !== "finished";

  // z-index del timer depende del overlay (timer por encima del overlay)
  const timerZ = showInitialBlur ? "z-[2147483647]" : "z-[1000]";

  // Refs
  const intervalRef = useRef<number | null>(null);
  const alertAudio = useRef<HTMLAudioElement | null>(null);

  // Audio
  useEffect(() => {
    const audio = new Audio("/sounds/beep.mp3");
    audio.loop = true;
    alertAudio.current = audio;
  }, []);

  // Desbloqueo de audio
  const unlockAudio = useCallback(() => {
    const a = alertAudio.current;
    if (!a) return;
    a.play()
      .then(() => {
        a.pause();
        a.currentTime = 0;
      })
      .catch((e) => {
        console.warn("⚠️ No se pudo desbloquear audio", e);
      });
  }, []);

  // Timer existente
  useEffect(() => {
    (async () => {
      try {
        const result = (await getTimerEjecutadaById(
          ejecutadaId
        )) as TimerLookup;
        if (result.exists && result.timer) {
          setTimerId(result.timer.id);
          setSeconds(result.timer.time * 60);
          setIsRunning(result.timer.status === "running");
          setTimerStatus(result.timer.status);
        }
      } catch (error) {
        console.error("Error al obtener timer existente:", error);
      }
    })();
  }, [ejecutadaId]);

  // Control del timer
  useEffect(() => {
    if (!timerId) return;
    (async () => {
      try {
        const control = (await getcontrolTimer(timerId)) as ControlActividad[];
        setControlData(Array.isArray(control) ? control : []);
      } catch (error) {
        console.error("Error al obtener control del timer:", error);
      }
    })();
  }, [timerId]);

  // Guardar datos
  const handleSaveTimerData = async () => {
    if (!timerId || typeof timerId !== "number") {
      console.error("❌ timerId inválido o null:", timerId);
      return;
    }

    const nameCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("name="));
    const name = nameCookie?.split("=")[1];

    if (!name) {
      console.error("❌ Usuario no encontrado en cookies");
      return;
    }

    try {
      const payload: TimerControlData = {
        timer_id: timerId,
        user: decodeURIComponent(name),
        data: controlData.map((actividad) => {
          const cfg = parseConfig(actividad.config);
          const tipo = cfg?.type ?? "text";
          const rawVal = actividad.valor;
          const valor =
            typeof rawVal === "object" &&
            rawVal !== null &&
            !(rawVal instanceof File)
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
    } catch (err) {
      console.error("❌ Error al guardar control de timer", err);
    }
  };

  // Formato tiempo
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Start
  const handleStart = async () => {
    if (!timerId) {
      const timer = await createTimer({
        ejecutada_id: ejecutadaId,
        stage_id: stageId,
        time: Math.ceil(seconds / 60),
      });
      if (timer && typeof (timer as { id: number }).id === "number") {
        setTimerId((timer as { id: number }).id);
      }
    }
    unlockAudio();
    setShowIntro(false); // ocultamos overlay hasta el próximo reload
    setIsRunning(true);
  };

  // Finish
  const handleFinish = useCallback(() => {
    setIsRunning(false);
    setAlarmActive(true);
    setSeconds(0);
    triggerNotification();
    triggerVibration();
    alertAudio.current?.play().catch(console.error);
    setShowPopup(true);
  }, []);

  // Reset
  const handleReset = () => {
    setSeconds(initialSeconds);
    setIsRunning(true);
    setAlarmActive(false);
    const a = alertAudio.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
    unlockAudio();
  };

  // Stop manual
  const handleStop = () => {
    showConfirm("¿Seguro que quieres detener la Fase de control?", async () => {
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
    });
  };

  // Alarma si activa
  useEffect(() => {
    if (alarmActive) {
      alertAudio.current
        ?.play()
        .catch(() =>
          console.warn("No se pudo reproducir la alarma automáticamente.")
        );
    }
  }, [alarmActive]);

  // Notificación
  const triggerNotification = () => {
    const options: NotificationOptions = {
      body: "Puedes iniciar el control cuando estés listo.",
      requireInteraction: true,
    };
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("⏱️ ¡El cronómetro ha terminado!", options);
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((perm) => {
          if (perm === "granted") {
            new Notification("⏱️ ¡El cronómetro ha terminado!", options);
          }
        });
      }
    }
  };

  // Vibración
  const triggerVibration = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.([300, 200, 300]);
    }
  };

  // Ticking
  useEffect(() => {
    if (isRunning) {
      const id = window.setInterval(() => {
        setSeconds((prev) => {
          if (prev > 1) return prev - 1;
          if (prev === 1) {
            handleFinish();
            return 0;
          }
          return 0;
        });
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
  }, [isRunning, handleFinish]);

  // % restante
  const percentageRemaining = (seconds / initialSeconds) * 100;

  const getColorClassByPercentage = () => {
    if (seconds === 0) {
      return "bg-gradient-to-br from-red-600/80 to-red-800/80 animate-pulse";
    } else if (percentageRemaining <= 25) {
      return "bg-gradient-to-br from-red-500/60 to-red-700/80";
    } else if (percentageRemaining <= 50) {
      return "bg-gradient-to-br from-yellow-500/60 to-yellow-700/80";
    } else if (percentageRemaining <= 75) {
      return "bg-gradient-to-br from-blue-600/60 to-blue-800/80";
    }
    return "bg-gradient-to-br from-purple-700/60 to-purple-900/80";
  };

  // Scroll-lock mientras el overlay está activo
  useEffect(() => {
    if (!showInitialBlur) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showInitialBlur]);

  // Actualizar valores del formulario dinámico
  const handleChange = (actividadId: number, newValue: ControlValue) => {
    setControlData((prev) =>
      prev.map((act) =>
        act.id_activitie === actividadId ? { ...act, valor: newValue } : act
      )
    );
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
      {/* Overlay inicial: tapa todo; el timer va por encima */}
      {showInitialBlur && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[2147483646] backdrop-blur-md bg-black/40
               flex items-center justify-center pointer-events-auto select-none"
        >
          <div className="bg-white/90 backdrop-blur rounded-xl shadow-2xl p-6 max-w-sm text-center animate-pulse">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              ¡Fase de Proceso!
            </h2>
            <p className="text-gray-600 mb-4">
              Presiona <span className="font-semibold text-green-500">Play</span> para iniciar
              el cronómetro y poder ver los controles de procesos.
            </p>
          </div>
        </div>
      )}

      {/* Timer Widget (SE renderiza aunque haya overlay; va por encima) */}
      {timerStatus !== "finished" && (
        <motion.div
          drag
          dragConstraints={{ left: -100, right: 1000, top: -100, bottom: 100 }}
          dragElastic={0.2}
          whileDrag={{ scale: 1.1 }}
          className={`
          fixed right-6 bottom-6 ${timerZ} backdrop-blur-md
          ${getColorClassByPercentage()}
          border border-white/20 rounded-full shadow-xl p-3 w-24 h-24
          flex flex-col items-center justify-center gap-1
          transition-all duration-300 hover:scale-105 cursor-grab
          ${!isRunning && !alarmActive ? "opacity-50 hover:opacity-100" : ""}
        `}
        >
          <div
            className={`
              text-lg font-bold font-mono tracking-wide text-center
              ${seconds === 0 ? "text-white" : "text-purple-100"}
            `}
          >
            {formatTime(seconds)}
          </div>

          <div className="flex gap-1 mt-1">
            {!isRunning && (
              <button
                onClick={handleStart}
                className="p-2 bg-green-500/80 hover:bg-green-600/80 text-white rounded-full shadow-sm transition"
                aria-label="Iniciar"
              >
                <FaPlay size={10} />
              </button>
            )}
            <button
              onClick={handleStop}
              className="p-2 bg-red-500/80 hover:bg-red-600/80 text-white rounded-full shadow-sm transition"
              aria-label="Parar"
            >
              <FaStop size={10} />
            </button>
            <button
              onClick={handleReset}
              className="p-2 bg-indigo-500/80 hover:bg-indigo-600/80 text-white rounded-full shadow-sm transition"
              aria-label="Reiniciar"
            >
              <FaRedo size={10} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Popup: Iniciar control (por encima del timer, por debajo del overlay inicial) */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[2147483646] backdrop-blur-sm">
          <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-sm">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              ⏱️ ¡Es momento de hacer el Control!
            </h2>
            <p className="text-gray-600 mb-6">
              El cronómetro ha terminado. Puedes iniciar el control cuando estés
              listo.
            </p>
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
                controlData.reduce<ControlActividadGrouped>(
                  (acc, actividad) => {
                    const fase = actividad.description_fase || "Sin Fase";
                    if (!acc[fase]) acc[fase] = [];
                    acc[fase].push(actividad);
                    return acc;
                  },
                  {}
                )
              ).map(([fase, actividades]) => (
                <div key={fase} className="mb-4">
                  <Text type="title">{fase}</Text>
                  <div className="grid gap-6">
                    {actividades.map((actividad) => {
                      const cfg = parseConfig(actividad.config);
                      const tipo = cfg?.type ?? "text";
                      const value = actividad.valor ?? "";
                      const options =
                        hasOptions(cfg) && Array.isArray(cfg.options)
                          ? cfg.options
                          : [];

                      return (
                        <div
                          key={actividad.id_activitie}
                          className="flex flex-col gap-2"
                        >
                          <Text type="subtitle">
                            {actividad.descripcion_activitie}
                          </Text>

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
                                    onChange={(e) =>
                                      handleChange(
                                        actividad.id_activitie,
                                        e.target.value
                                      )
                                    }
                                  />
                                );
                              case "number":
                                return (
                                  <input
                                    type="number"
                                    className={commonInputClass}
                                    value={String(value ?? "")}
                                    onChange={(e) =>
                                      handleChange(
                                        actividad.id_activitie,
                                        e.target.value === ""
                                          ? ""
                                          : Number(e.target.value)
                                      )
                                    }
                                  />
                                );
                              case "checkbox":
                                return (
                                  <input
                                    type="checkbox"
                                    className="w-5 h-5 accent-blue-500"
                                    checked={value === true || value === "true"}
                                    onChange={(e) =>
                                      handleChange(
                                        actividad.id_activitie,
                                        e.target.checked
                                      )
                                    }
                                  />
                                );
                              case "select":
                                return (
                                  <select
                                    className={commonInputClass}
                                    value={String(value ?? "")}
                                    onChange={(e) =>
                                      handleChange(
                                        actividad.id_activitie,
                                        e.target.value
                                      )
                                    }
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
                                    onChange={(e) =>
                                      handleChange(
                                        actividad.id_activitie,
                                        e.target.value
                                      )
                                    }
                                  />
                                );
                              case "radio":
                                // Variante estilo "card"
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
                                            onChange={() =>
                                              handleChange(
                                                actividad.id_activitie,
                                                opt
                                              )
                                            }
                                          />
                                          <span
                                            className={`flex-1 text-sm font-medium text-center ${
                                              isSelected
                                                ? "text-indigo-900"
                                                : "text-gray-800"
                                            }`}
                                          >
                                            {opt}
                                          </span>
                                          {isSelected && (
                                            <svg
                                              className="h-5 w-5 text-indigo-600"
                                              viewBox="0 0 20 20"
                                              fill="currentColor"
                                              aria-hidden="true"
                                            >
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
                                    onChange={(e) =>
                                      handleChange(
                                        actividad.id_activitie,
                                        e.target.value
                                      )
                                    }
                                  />
                                );
                              case "temperature": {
                                const tcfg = cfg as Extract<
                                  ParsedConfig,
                                  { type: "temperature" }
                                >;
                                const rangoMin = tcfg.min;
                                const rangoMax = tcfg.max;

                                const numeric =
                                  typeof value === "number"
                                    ? value
                                    : value === ""
                                    ? NaN
                                    : Number(value);
                                const fueraDeRango =
                                  !Number.isNaN(numeric) &&
                                  ((rangoMin !== undefined &&
                                    numeric < rangoMin) ||
                                    (rangoMax !== undefined &&
                                      numeric > rangoMax));

                                return (
                                  <div className="flex flex-col gap-2">
                                    <input
                                      type="number"
                                      step="0.1"
                                      placeholder={
                                        rangoMin !== undefined &&
                                        rangoMax !== undefined
                                          ? `Entre ${rangoMin} y ${rangoMax}`
                                          : "Temperatura"
                                      }
                                      className={`${commonInputClass} ${
                                        fueraDeRango
                                          ? "border-red-500 ring-red-500"
                                          : ""
                                      }`}
                                      value={String(value ?? "")}
                                      onChange={(e) => {
                                        const v =
                                          e.target.value === ""
                                            ? ""
                                            : Number.parseFloat(e.target.value);
                                        handleChange(
                                          actividad.id_activitie,
                                          v as number | ""
                                        );
                                      }}
                                    />
                                    {fueraDeRango && (
                                      <p className="text-sm text-black bg-red-300 p-2 rounded-md mt-1 text-center">
                                        ⚠️ El valor debe estar entre {rangoMin}
                                        °C y {rangoMax}°C
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
                                    onChange={(e) =>
                                      handleChange(
                                        actividad.id_activitie,
                                        e.target.value
                                      )
                                    }
                                  />
                                );
                              case "file":
                              case "image":
                                return (
                                  <input
                                    type="file"
                                    accept={
                                      (
                                        cfg as Extract<
                                          ParsedConfig,
                                          { accept?: string }
                                        >
                                      ).accept ||
                                      (tipo === "image" ? "image/*" : "*/*")
                                    }
                                    className="block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                                    onChange={(e) =>
                                      handleChange(
                                        actividad.id_activitie,
                                        e.target.files?.[0] ?? null
                                      )
                                    }
                                  />
                                );
                              default:
                                return (
                                  <input
                                    type="text"
                                    className={commonInputClass}
                                    value={String(value ?? "")}
                                    onChange={(e) =>
                                      handleChange(
                                        actividad.id_activitie,
                                        e.target.value
                                      )
                                    }
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
            <p className="text-gray-500 text-center">
              No hay actividades disponibles
            </p>
          )}

          {/* Botones de acción */}
          <hr className="my-4 border-t border-gray-600 w-full max-w-lg mx-auto opacity-60" />
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => {
                setShowModal(false);
                handleSaveTimerData();
                handleReset();
                handleResetValue();
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
