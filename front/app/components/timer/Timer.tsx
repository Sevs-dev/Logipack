"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo, } from "react";
import { FaPlay, FaStop, FaRedo } from "react-icons/fa";
import { motion } from "framer-motion";
import { showSuccess, showConfirm, showError } from "../toastr/Toaster";
import Text from "../text/Text";
import ModalSection from "../modal/ModalSection";
import { TimerControlData } from "../../interfaces/TimerController";
import { createTimerControl } from "../../services/timerControl/timerControlServices";
import { createTimer, finishTimer, getTimerEjecutadaById, getcontrolTimer, resetTimer, TimerResponse, } from "../../services/timer/timerServices";
import { validateSignaturePass } from "../../services/userDash/securityPass";
import Firma from "../ordenes_ejecutadas/Firma";

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

type BaseCfgExtras = {
  binding?: boolean; // requerido
  signatureSpecific?: boolean;
  allowedRoles?: string[];
  accept?: string;
};

type ParsedConfig =
  | ({
      type: "text" | "email" | "password" | "tel" | "url" | "textarea";
    } & BaseCfgExtras)
  | ({ type: "number"; min?: number; max?: number } & BaseCfgExtras)
  | ({ type: "temperature"; min?: number; max?: number } & BaseCfgExtras)
  | ({ type: "date" | "time" | "datetime-local" | "color" } & BaseCfgExtras)
  | ({ type: "select" | "radio"; options: string[] } & BaseCfgExtras)
  | ({ type: "checkbox" } & BaseCfgExtras) // checkbox simple (booleano)
  | ({ type: "file" | "image"; accept?: string } & BaseCfgExtras)
  | ({ type: "signature" } & BaseCfgExtras);

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
  if (
    parsed &&
    typeof parsed === "object" &&
    "type" in (parsed as Record<string, unknown>)
  ) {
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

function isBinding(cfg: ParsedConfig | null): boolean {
  return (
    !!cfg &&
    "binding" in (cfg as Record<string, unknown>) &&
    Boolean((cfg as Record<string, unknown>).binding)
  );
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
  if (
    "timer" in created &&
    created.timer &&
    typeof created.timer.id === "number"
  ) {
    return created.timer.id;
  }
  return null;
}

/* =========================
 *  Signature helpers/UI
 * ========================= */
type SigType = "" | "texto" | "firma";
const sigKey = (clave: string | undefined, id: number) =>
  `timer::${clave ?? `id_${id}`}`;

/** Estado proxy para integrar <Firma /> */
type FirmaScopedMem = Record<string, string>;
type FirmaMem = Record<string, FirmaScopedMem>;
const SIG_SCOPE = "control";

/* =========================
 *  Reglas de validación
 * ========================= */
// 🔒 Requerir TODOS los campos al guardar (true) o solo los que tengan `binding` (false)
const REQUIRE_ALL_FIELDS = true;

function isRequiredField(cfg: ParsedConfig | null): boolean {
  return REQUIRE_ALL_FIELDS ? true : isBinding(cfg);
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

  // Firma: tipo seleccionado por actividad y desbloqueos
  const [sigTypeById, setSigTypeById] = useState<Record<number, SigType>>({});
  const [sigUnlocked, setSigUnlocked] = useState<Record<string, boolean>>({});
  const [sigModal, setSigModal] = useState<{
    open: boolean;
    actividadId: number | null;
    clave: string | null;
    allowedRoles: string[];
  }>({
    open: false,
    actividadId: null,
    clave: null,
    allowedRoles: [],
  });
  const [sigPassword, setSigPassword] = useState<string>("");

  // Proxy de memoria para <Firma />
  const [memProxy, setMemProxy] = useState<FirmaMem>({ [SIG_SCOPE]: {} });

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
        const result = (await getTimerEjecutadaById(
          ejecutadaId
        )) as TimerLookup;

        if (result.exists && result.timer) {
          setTimerId(result.timer.id);

          const raw = (result.timer.status || "").toLowerCase();
          const mapped: TimerStatus =
            raw === "running"
              ? "running"
              : raw === "paused"
              ? "paused"
              : raw === "finished"
              ? "finished"
              : "idle";

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
  const handleSaveTimerData = async (): Promise<void> => {
    if (!timerId || typeof timerId !== "number") return;

    const nameCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("name="));
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
        raw === "running"
          ? "running"
          : raw === "paused"
          ? "paused"
          : raw === "finished"
          ? "finished"
          : "idle";

      const serverSecs =
        typeof resetResp.remaining_seconds === "number"
          ? resetResp.remaining_seconds
          : (resetResp.time ?? 0) * 60;

      setTimerStatus(mapped);
      setSeconds(serverSecs);
      setTargetFromSeconds(serverSecs);

      unlockAudio();
      setShowIntro(false);
      setIsRunning(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFinish = useCallback(() => {
    if (!isRunning) return;
    setIsRunning(false);
    setAlarmActive(true);
    setSeconds(0);
    if ("Notification" in window) {
      const opts: NotificationOptions = {
        body: "Puedes iniciar el control cuando estés listo.",
        requireInteraction: true,
      };
      if (Notification.permission === "granted")
        new Notification("⏱️ ¡El cronómetro ha terminado!", opts);
      else if (Notification.permission !== "denied")
        Notification.requestPermission().then(
          (perm) =>
            perm === "granted" &&
            new Notification("⏱️ ¡El cronómetro ha terminado!", opts)
        );
    }
    if ("vibrate" in navigator) navigator.vibrate?.([300, 200, 300]);
    alertAudio.current?.play().catch(() => undefined);
    setShowPopup(true);
  }, [isRunning]);

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

  const percentageRemaining =
    initialSeconds > 0 ? (seconds / initialSeconds) * 100 : 0;

  const getColorClassByPercentage = () => {
    if (seconds === 0)
      return "bg-gradient-to-br from-red-600/80 to-red-800/80 animate-pulse";
    if (percentageRemaining <= 25)
      return "bg-gradient-to-br from-red-500/60 to-red-700/80";
    if (percentageRemaining <= 50)
      return "bg-gradient-to-br from-yellow-500/60 to-yellow-700/80";
    if (percentageRemaining <= 75)
      return "bg-gradient-to-br from-blue-600/60 to-blue-800/80";
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
      if (tipo === "signature") nuevoValor = "";
      return { ...actividad, valor: nuevoValor };
    });
    setControlData(reseteado);
    setSigTypeById({});
    setMemProxy({ [SIG_SCOPE]: {} });
  };

  const commonInputClass =
    "block w-full rounded-md border px-3 py-2 transition " +
    "bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] " +
    "border-[rgb(var(--input))] placeholder:text-[rgb(var(--muted-foreground))]/70 " +
    "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))]";

  // ─────────────────────────────────────────────────────────────
  // Firma: modal y bloqueo por contraseña
  const openSigModal = (
    actividadId: number,
    clave: string | undefined,
    allowedRoles: string[]
  ) => {
    setSigModal({
      open: true,
      actividadId,
      clave: clave ?? null,
      allowedRoles,
    });
  };
  const closeSigModal = () => {
    setSigModal({
      open: false,
      actividadId: null,
      clave: null,
      allowedRoles: [],
    });
    setSigPassword("");
  };
  const submitSigValidation = async () => {
    try {
      const pass = String(sigPassword || "").trim();
      if (!pass) {
        showError("Ingresa la contraseña.");
        return;
      }
      const key = sigKey(
        sigModal.clave ?? undefined,
        sigModal.actividadId ?? 0
      );
      const res = await validateSignaturePass({
        security_pass: pass,
        signature_id: key,
      });
      if (!res?.valid) {
        showError("Contraseña no autorizada para esta firma.");
        return;
      }
      setSigUnlocked((prev) => ({ ...prev, [key]: true }));
      setSigPassword("");
      closeSigModal();
    } catch {
      showError("Validación fallida. Intenta de nuevo.");
    }
  };

  // Proxy saveToDB para <Firma /> (sin any)
  const saveToDBProxy = async (
    _key: string,
    data: Record<string, Record<string, unknown>>
  ): Promise<void> => {
    // Esperamos { [SIG_SCOPE]: { [fieldName]: base64 } }
    const next: FirmaMem = {};
    for (const scope of Object.keys(data)) {
      const scoped = data[scope];
      const cleaned: Record<string, string> = {};
      for (const k of Object.keys(scoped)) {
        const val = scoped[k];
        if (typeof val === "string") cleaned[k] = val;
      }
      next[scope] = cleaned;
    }
    setMemProxy(next);

    const scoped = next[SIG_SCOPE] ?? {};
    // Reflejar cambios hacia controlData.valor
    Object.entries(scoped).forEach(([field, value]) => {
      setControlData((prev) =>
        prev.map((a) =>
          (a.clave ?? `field_${a.id_activitie}`) === field
            ? { ...a, valor: value }
            : a
        )
      );
    });
  };

  // ─────────────────────────────────────────────────────────────
  // Validación de campos requeridos (sin any, con IDs inválidos)
  const validation = useMemo((): {
    missingList: string[];
    invalidIds: Set<number>;
  } => {
    const faltantes: string[] = [];
    const invalidIds = new Set<number>();

    const isEmptyString = (v: unknown) => String(v ?? "").trim() === "";
    const isNumberInvalid = (v: unknown) => v === "" || Number.isNaN(Number(v));

    for (const act of controlData) {
      const cfg = parseConfig(act.config);
      const tipo = cfg?.type ?? "text";
      const req = isRequiredField(cfg);
      if (!req) continue;

      const label =
        act.descripcion_activitie || `Actividad ${act.id_activitie}`;
      const val = act.valor;

      switch (tipo) {
        case "text":
        case "email":
        case "password":
        case "tel":
        case "url":
        case "textarea":
        case "date":
        case "time":
        case "datetime-local":
        case "color":
        case "select":
        case "radio": {
          if (isEmptyString(val)) {
            faltantes.push(label);
            invalidIds.add(act.id_activitie);
          }
          break;
        }
        case "number": {
          if (isNumberInvalid(val)) {
            faltantes.push(label);
            invalidIds.add(act.id_activitie);
          }
          break;
        }
        case "checkbox": {
          if (val !== true && val !== "true") {
            faltantes.push(label);
            invalidIds.add(act.id_activitie);
          }
          break;
        }
        case "file":
        case "image": {
          if (!(val instanceof File)) {
            faltantes.push(label);
            invalidIds.add(act.id_activitie);
          }
          break;
        }
        case "temperature": {
          const n =
            typeof val === "number" ? val : val === "" ? NaN : Number(val);
          const min = (cfg as Extract<ParsedConfig, { type: "temperature" }>)
            .min;
          const max = (cfg as Extract<ParsedConfig, { type: "temperature" }>)
            .max;
          if (
            Number.isNaN(n) ||
            (min !== undefined && n < min) ||
            (max !== undefined && n > max)
          ) {
            faltantes.push(
              min !== undefined || max !== undefined
                ? `${label} (fuera de rango)`
                : label
            );
            invalidIds.add(act.id_activitie);
          }
          break;
        }
        case "signature": {
          const sType = sigTypeById[act.id_activitie] || "";
          const key = sigKey(act.clave, act.id_activitie);
          if (
            (cfg as BaseCfgExtras | null)?.signatureSpecific &&
            !sigUnlocked[key]
          ) {
            faltantes.push(`${label} (firma bloqueada)`);
            invalidIds.add(act.id_activitie);
            break;
          }
          if (sType === "") {
            faltantes.push(`${label} (elige texto o firma)`);
            invalidIds.add(act.id_activitie);
          } else if (sType === "texto") {
            if (isEmptyString(val)) {
              faltantes.push(label);
              invalidIds.add(act.id_activitie);
            }
          } else if (sType === "firma") {
            const v = typeof val === "string" ? val : "";
            if (!v.startsWith("data:image")) {
              faltantes.push(`${label} (falta firma)`);
              invalidIds.add(act.id_activitie);
            }
          }
          break;
        }
        default: {
          if (isEmptyString(val)) {
            faltantes.push(label);
            invalidIds.add(act.id_activitie);
          }
        }
      }
    }

    return { missingList: faltantes, invalidIds };
  }, [controlData, sigTypeById, sigUnlocked]);

  const allValid = validation.missingList.length === 0;

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
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              ¡Fase de Proceso!
            </h2>
            <p className="text-gray-600 mb-4">
              Presiona{" "}
              <span className="font-semibold text-green-500">Play</span> para
              iniciar el cronómetro y poder ver los controles de procesos.
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
          <div
            className={`text-lg font-bold font-mono tracking-wide text-center ${
              seconds === 0 ? "text-white" : "text-purple-100"
            }`}
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
              onClick={handleResetLocal}
              className="p-2 bg-indigo-500/80 hover:bg-indigo-600/80 text-white rounded-full shadow-sm transition"
              aria-label="Reiniciar"
            >
              <FaRedo size={10} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Popup fin de ciclo */}
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
          <div className="use-token-borders text-[rgb(var(--foreground))]">
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
                        const options = hasOptions(cfg) ? cfg.options : [];
                        const fieldKey =
                          actividad.clave ?? `field_${actividad.id_activitie}`;
                        const key = sigKey(
                          actividad.clave,
                          actividad.id_activitie
                        );
                        const locked =
                          (cfg as BaseCfgExtras | null)?.signatureSpecific &&
                          !sigUnlocked[key];
                        const invalid = validation.invalidIds.has(
                          actividad.id_activitie
                        );

                        return (
                          <div
                            key={actividad.id_activitie}
                            data-invalid={invalid ? "true" : undefined}
                            className={`flex flex-col gap-2 ${
                              invalid
                                ? "rounded-md ring-1 ring-[rgb(var(--danger))] bg-[rgb(var(--danger))]/5 p-2"
                                : ""
                            }`}
                          >
                            <Text type="subtitle">
                              {actividad.descripcion_activitie}
                            </Text>

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
                                      required
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
                                      required
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
                                      className="w-5 h-5 accent-[rgb(var(--accent))]"
                                      required
                                      checked={
                                        value === true || value === "true"
                                      }
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
                                      required
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
                                      required
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
                                  return (
                                    <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                      {options.map((opt) => {
                                        const isSelected = value === opt;
                                        return (
                                          <label
                                            key={opt}
                                            className={`relative flex cursor-pointer items-center justify-between rounded-lg border p-4 shadow-sm transition-all
                                      ${
                                        isSelected
                                          ? "border-[rgb(var(--ring))] ring-2 ring-[rgb(var(--ring))] bg-[rgb(var(--surface))]"
                                          : "border-[rgb(var(--border))] bg-[rgb(var(--surface))] hover:bg-[rgb(var(--surface-muted))]"
                                      }`}
                                          >
                                            <input
                                              className="sr-only"
                                              type="radio"
                                              name={`radio-${actividad.id_activitie}`}
                                              required
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
                                                  ? "text-[rgb(var(--foreground))]"
                                                  : "text-[rgb(var(--muted-foreground))]"
                                              }`}
                                            >
                                              {opt}
                                            </span>
                                            {isSelected && (
                                              <svg
                                                className="h-5 w-5 text-[rgb(var(--accent))]"
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
                                      required
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
                                        required
                                        className={`${commonInputClass} ${
                                          fueraDeRango
                                            ? "border-[rgb(var(--danger))] ring-[rgb(var(--danger))]"
                                            : ""
                                        }`}
                                        value={String(value ?? "")}
                                        onChange={(e) => {
                                          const v =
                                            e.target.value === ""
                                              ? ""
                                              : Number.parseFloat(
                                                  e.target.value
                                                );
                                          handleChange(
                                            actividad.id_activitie,
                                            v
                                          );
                                        }}
                                      />
                                      {fueraDeRango && (
                                        <p className="text-sm text-[rgb(var(--danger-foreground))] bg-[rgb(var(--danger))]/25 border border-[rgb(var(--danger))]/50 px-3 py-2 rounded-md mt-1 text-center">
                                          ⚠️ El valor debe estar entre{" "}
                                          {rangoMin}°C y {rangoMax}°C
                                        </p>
                                      )}
                                    </div>
                                  );
                                }

                                case "color":
                                  return (
                                    <input
                                      type="color"
                                      className="w-12 h-10 p-1 rounded border border-[rgb(var(--border))]"
                                      value={String(value || "#000000")}
                                      required
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
                                      required
                                      accept={
                                        (
                                          cfg as Extract<
                                            ParsedConfig,
                                            { accept?: string }
                                          >
                                        ).accept ||
                                        (tipo === "image" ? "image/*" : "*/*")
                                      }
                                      className="block w-full text-sm text-[rgb(var(--foreground))] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[rgb(var(--accent))] file:text-[rgb(var(--accent-foreground))] hover:file:bg-[rgb(var(--accent-hover))]"
                                      onChange={(e) =>
                                        handleChange(
                                          actividad.id_activitie,
                                          e.target.files?.[0] ?? null
                                        )
                                      }
                                    />
                                  );

                                case "signature": {
                                  const currentType =
                                    sigTypeById[actividad.id_activitie] || "";
                                  return (
                                    <div className="flex flex-col gap-2">
                                      {(cfg as BaseCfgExtras | null)
                                        ?.signatureSpecific &&
                                        !sigUnlocked[key] && (
                                          <div className="mb-1 text-xs text-[rgb(var(--danger))] text-center">
                                            🔒 Requiere validación antes de
                                            firmar.
                                          </div>
                                        )}

                                      <select
                                        className={`${commonInputClass} text-center ${
                                          locked
                                            ? "border-[rgb(var(--danger))] ring-[rgb(var(--danger))]"
                                            : ""
                                        }`}
                                        value={currentType}
                                        required
                                        onMouseDown={(e) => {
                                          if (locked) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            openSigModal(
                                              actividad.id_activitie,
                                              actividad.clave,
                                              (cfg as BaseCfgExtras)
                                                ?.allowedRoles ?? []
                                            );
                                          }
                                        }}
                                        onKeyDown={(e) => {
                                          if (
                                            locked &&
                                            [
                                              "Enter",
                                              " ",
                                              "ArrowDown",
                                              "ArrowUp",
                                            ].includes(e.key)
                                          ) {
                                            e.preventDefault();
                                            openSigModal(
                                              actividad.id_activitie,
                                              actividad.clave,
                                              (cfg as BaseCfgExtras)
                                                ?.allowedRoles ?? []
                                            );
                                          }
                                        }}
                                        onChange={(e) => {
                                          if (locked) return;
                                          const v = e.target.value as SigType;
                                          setSigTypeById((prev) => ({
                                            ...prev,
                                            [actividad.id_activitie]: v,
                                          }));
                                          // limpiar valor previo
                                          handleChange(
                                            actividad.id_activitie,
                                            ""
                                          );
                                        }}
                                      >
                                        <option value="">
                                          -- Selecciona --
                                        </option>
                                        <option value="texto">Texto</option>
                                        <option value="firma">Firma</option>
                                      </select>

                                      {currentType === "texto" && (
                                        <input
                                          type="text"
                                          className={commonInputClass}
                                          required
                                          value={String(value ?? "")}
                                          onChange={(e) =>
                                            handleChange(
                                              actividad.id_activitie,
                                              e.target.value
                                            )
                                          }
                                        />
                                      )}

                                      {currentType === "firma" && (
                                        <Firma
                                          type="signature"
                                          item={{
                                            id_activitie:
                                              actividad.id_activitie as number,
                                            descripcion_activitie:
                                              actividad.descripcion_activitie,
                                            config: actividad.config,
                                            binding: Boolean(
                                              (
                                                parseConfig(
                                                  actividad.config
                                                ) as BaseCfgExtras | null
                                              )?.binding
                                            ),
                                            clave: fieldKey,
                                          }}
                                          info={memProxy[SIG_SCOPE] ?? {}}
                                          lineaIndex={SIG_SCOPE}
                                          setMemoriaGeneral={(
                                            updater:
                                              | FirmaMem
                                              | ((prev: FirmaMem) => FirmaMem)
                                          ) => {
                                            setMemProxy((prev) => {
                                              const next =
                                                typeof updater === "function"
                                                  ? (
                                                      updater as (
                                                        p: FirmaMem
                                                      ) => FirmaMem
                                                    )(prev)
                                                  : updater;
                                              const scoped =
                                                next[SIG_SCOPE] ?? {};
                                              // reflejar en controlData.valor
                                              Object.entries(scoped).forEach(
                                                ([k, v]) => {
                                                  if (typeof v === "string") {
                                                    setControlData((pf) =>
                                                      pf.map((a) =>
                                                        (a.clave ??
                                                          `field_${a.id_activitie}`) ===
                                                        k
                                                          ? { ...a, valor: v }
                                                          : a
                                                      )
                                                    );
                                                  }
                                                }
                                              );
                                              return next;
                                            });
                                          }}
                                          saveToDB={async (
                                            _k: string,
                                            data: Record<
                                              string,
                                              Record<string, unknown>
                                            >
                                          ) => {
                                            await saveToDBProxy(_k, data);
                                          }}
                                          typeMem="memoria_fase"
                                        />
                                      )}
                                    </div>
                                  );
                                }

                                default:
                                  return (
                                    <input
                                      type="text"
                                      className={commonInputClass}
                                      required
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
              <p className="text-[rgb(var(--muted-foreground))] text-center">
                No hay actividades disponibles
              </p>
            )}

            {/* Resumen de faltantes */}

            <hr className="my-4 border-t border-[rgb(var(--border))] w-full max-w-lg mx-auto opacity-60" />

            <div className="flex flex-col items-center gap-3 mt-4">
              <button
                className={`px-4 py-2 rounded-lg bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))] shadow
    hover:bg-[rgb(var(--accent-hover))] transition
    ${!allValid ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={!allValid}
                onClick={async () => {
                  if (!allValid) {
                    showError(
                      "Completa los campos obligatorios antes de guardar y reiniciar."
                    );
                    // Llevar la vista al primer campo inválido
                    requestAnimationFrame(() => {
                      const firstInvalid = document.querySelector(
                        '[data-invalid="true"]'
                      ) as HTMLElement | null;
                      firstInvalid?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    });
                    return;
                  }

                  try {
                    // Cierra modal/popup y apaga alarma sí o sí
                    setShowModal(false);
                    setShowPopup(false);
                    setAlarmActive(false);
                    const a = alertAudio.current;
                    if (a) {
                      a.pause();
                      a.currentTime = 0;
                    }

                    // 1) Guarda respuestas
                    await handleSaveTimerData();

                    // 2) (Opcional) registra el tiempo transcurrido del ciclo finalizado
                    if (timerId != null) {
                      const elapsedSeconds = Math.max(
                        0,
                        initialSeconds - seconds
                      );
                      const elapsedMinutes = Math.ceil(elapsedSeconds / 60);
                      if (elapsedMinutes > 0) {
                        try {
                          await finishTimer({
                            ejecutada_id: ejecutadaId,
                            pause_time: elapsedMinutes,
                          });
                        } catch {
                          /* ignora si no aplica */
                        }
                      }
                    }

                    // 3) Reinicio
                    const minutesInt = Math.max(
                      1,
                      Math.ceil(initialSeconds / 60)
                    );

                    const resetResp = (await resetTimer({
                      ejecutada_id: ejecutadaId,
                      time_reset: minutesInt,
                    })) as ResetRespLike;

                    let serverSecs =
                      typeof resetResp.remaining_seconds === "number"
                        ? resetResp.remaining_seconds
                        : typeof resetResp.time === "number"
                        ? Math.max(1, Math.ceil(resetResp.time * 60))
                        : initialSeconds;

                    if (!Number.isFinite(serverSecs) || serverSecs <= 0) {
                      serverSecs = Math.max(1, initialSeconds || 60);
                    }

                    if (intervalRef.current) {
                      window.clearInterval(intervalRef.current);
                      intervalRef.current = null;
                    }

                    setSeconds(serverSecs);
                    setTargetFromSeconds(serverSecs);
                    setTimerStatus("running");
                    setIsRunning(true);
                    setShowIntro(false);
                    handleResetValue();

                    showSuccess("Guardado y reiniciado correctamente.");
                    await refetchTimer();
                  } catch {
                    showError(
                      "No se pudo reiniciar el timer. Revisa conexión/servidor."
                    );
                    setShowPopup(false);
                    setAlarmActive(false);
                  }
                }}
              >
                Guardar y reiniciar timer
              </button>
            </div>

            {/* Modal de contraseña para firma */}
            {sigModal.open && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
                <div className="w-full max-w-sm rounded-xl bg-[rgb(var(--surface))] border border-[rgb(var(--border))] p-5 shadow-2xl">
                  <h3 className="text-[rgb(var(--foreground))] text-lg font-semibold mb-2">
                    Validación requerida
                  </h3>
                  <p className="text-sm mb-4 text-[rgb(var(--muted-foreground))]">
                    Ingresa la contraseña para habilitar la firma.
                  </p>
                  <input
                    type="password"
                    autoFocus
                    value={sigPassword}
                    onChange={(e) => setSigPassword(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && submitSigValidation()
                    }
                    className={commonInputClass}
                    placeholder="Contraseña"
                  />
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={closeSigModal}
                      className="px-4 py-2 rounded-lg bg-[rgb(var(--surface-muted))] hover:opacity-90 text-[rgb(var(--foreground))] text-sm border border-[rgb(var(--border))]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={submitSigValidation}
                      className="px-4 py-2 rounded-lg bg-[rgb(var(--accent))] hover:bg-[rgb(var(--accent-hover))] text-[rgb(var(--accent-foreground))] text-sm shadow"
                    >
                      Validar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ModalSection>
      )}
    </>
  );
};

export default Timer;
