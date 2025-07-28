import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaPlay, FaStop, FaRedo } from 'react-icons/fa';
import { motion } from "framer-motion";
import { showSuccess, showConfirm } from "../toastr/Toaster";
import Text from "../text/Text";
import { TimerControlData } from '../../interfaces/TimerController';
import { createTimerControl } from '../../services/timerControl/timerControlServices';
import { createTimer, finishTimer, getTimerEjecutadaById, getcontrolTimer } from '../../services/timer/timerServices';
import ModalSection from "../modal/ModalSection";

interface TimerProps {
    ejecutadaId: number;
    stageId: number;
    initialMinutes: number;
    refetchTimer: () => void;
    userId: number; // Add userId as a prop
}

interface ActividadConfig {
    type?: string;
    min?: number;
    max?: number;
    step?: number;
    options?: string[];
    [key: string]: unknown;
}

const Timer: React.FC<TimerProps> = ({ ejecutadaId, stageId, initialMinutes, refetchTimer, userId }) => {
    // 🕒 Config inicial
    const initialSeconds = initialMinutes * 60;

    // 📦 useState
    const [timerId, setTimerId] = useState<number | null>(null);
    const [seconds, setSeconds] = useState<number>(initialSeconds);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [alarmActive, setAlarmActive] = useState<boolean>(false);
    const [showPopup, setShowPopup] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [controlData, setControlData] = useState<any[]>([]);
    const [timerStatus, setTimerStatus] = useState<'running' | 'paused' | 'finished'>('paused');


    // 🔁 Refs
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const alertAudio = useRef<HTMLAudioElement | null>(null);

    // 📀 Carga de audio
    useEffect(() => {
        alertAudio.current = new Audio('/sounds/beep.mp3');
        alertAudio.current.loop = true;
    }, []);

    // 🔓 Desbloqueo de audio
    const unlockAudio = useCallback(() => {
        if (!alertAudio.current) return;
        alertAudio.current.play()
            .then(() => {
                alertAudio.current!.pause();
                alertAudio.current!.currentTime = 0;
            })
            .catch((e) => {
                console.warn('⚠️ No se pudo desbloquear audio', e);
            });
    }, []);

    // 🔄 Fetch de timer inicial
    useEffect(() => {
        async function fetchTimer() {
            try {
                const result = await getTimerEjecutadaById(ejecutadaId);
                if (result.exists && result.timer) {
                    setTimerId(result.timer.id);
                    setSeconds(result.timer.time * 60);
                    setIsRunning(result.timer.status === 'running');
                    setTimerStatus(result.timer.status); // 👈 nuevo
                }
            } catch (error) {
                console.error('Error al obtener timer existente:', error);
            }
        }
        fetchTimer();
    }, [ejecutadaId]);

    // 🔄 Fetch de actividades dinámicas (controlData)
    useEffect(() => {
        async function fetchControlTimer() {
            if (!timerId) return;
            try {
                const control = await getcontrolTimer(timerId);
                console.log("Control de timer obtenido:", control);
                setControlData(control);
            } catch (error) {
                console.error('Error al obtener control del timer:', error);
            }
        }
        fetchControlTimer();
    }, [timerId]);

    // 🧠 Guardar respuestas del formulario dinámico
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
                    let tipo = "text";
                    try {
                        const config = JSON.parse(
                            typeof actividad.config === "string" ? actividad.config : "{}"
                        );
                        if (typeof config === "string") {
                            tipo = JSON.parse(config).type || "text";
                        } else {
                            tipo = config.type || "text";
                        }
                    } catch (error) {
                        console.warn("⚠️ Config malformado en actividad", actividad, error);
                    }

                    const valor =
                        typeof actividad.valor === "object" && actividad.valor !== null
                            ? JSON.stringify(actividad.valor)
                            : actividad.valor ?? "";

                    return {
                        activity_id: actividad.id_activitie,
                        tipo,
                        descripcion: actividad.descripcion_activitie,
                        valor,
                        clave: actividad.clave,
                    };
                }),
            };

            const res = await createTimerControl(payload);
            console.log("✔ Control de timer guardado correctamente", res);
        } catch (err) {
            console.error("❌ Error al guardar control de timer", err);
        }
    };

    // 🧠 Formateo del cronómetro
    const formatTime = (secs: number) => {
        const minutes = Math.floor(secs / 60).toString().padStart(2, '0');
        const seconds = (secs % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    // ▶️ Iniciar
    const handleStart = async () => {
        if (!timerId) {
            const timer = await createTimer({
                ejecutada_id: ejecutadaId,
                stage_id: stageId,
                time: Math.ceil(seconds / 60),
            });
            if ('id' in timer && typeof timer.id === 'number') {
                setTimerId(timer.id);
            }
        }
        unlockAudio();
        setIsRunning(true);
    };

    // ⏹ Finalizar
    const handleFinish = useCallback(() => {
        setIsRunning(false);
        setAlarmActive(true);
        setSeconds(0);
        triggerNotification();
        triggerVibration();

        if (alertAudio.current) {
            alertAudio.current.play().catch(console.error);
        }
        setShowPopup(true);
    }, []);

    // 🔄 Reiniciar
    const handleReset = () => {
        setSeconds(initialSeconds);
        setIsRunning(true);
        setAlarmActive(false);


        if (alertAudio.current) {
            alertAudio.current.pause();
            alertAudio.current.currentTime = 0;
        }
        unlockAudio();
    };

    // ⏸ Detener
    const handleStop = () => {
        showConfirm("¿Seguro que quieres detener la Fase de control?", async () => {
            if (timerId) {
                await finishTimer({ ejecutada_id: ejecutadaId, pause_time: Math.ceil(seconds / 60) });
                await refetchTimer();
            }

            setIsRunning(false);
            setAlarmActive(false);
            setTimerStatus('finished');
            if (alertAudio.current) {
                alertAudio.current.pause();
                alertAudio.current.currentTime = 0;
            }
            showSuccess("Fase de control detenida correctamente.");
        });
    };

    // 🔔 Reproducir alarma si se activa
    useEffect(() => {
        if (alarmActive && alertAudio.current) {
            alertAudio.current.play().catch(() => {
                console.warn('No se pudo reproducir la alarma automáticamente.');
            });
        }
    }, [alarmActive]);

    // 🔔 Notificación nativa
    const triggerNotification = () => {
        const options = {
            body: 'Puedes iniciar el control cuando estés listo.',
            requireInteraction: true,
            vibrate: [200, 100, 200],
        };
        if (Notification.permission === 'granted') {
            new Notification('⏱️ ¡El cronómetro ha terminado!', options);
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('⏱️ ¡El cronómetro ha terminado!', options);
                }
            });
        }
    };

    // 📳 Vibración
    const triggerVibration = () => {
        if (navigator.vibrate) {
            navigator.vibrate([300, 200, 300]);
        }
    };

    // 🕰️ Efecto de temporizador
    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setSeconds(prev => {
                    if (prev > 1) return prev - 1;
                    if (prev === 1) {
                        handleFinish();
                        return 0;
                    }
                    return 0;
                });
            }, 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isRunning, handleFinish]);

    // 🧾 Actualizar valores del formulario dinámico
    const handleChange = (actividadId: number, newValue: any) => {
        setControlData(prev =>
            prev.map(act =>
                act.id_activitie === actividadId ? { ...act, valor: newValue } : act
            )
        );
    };

    const handleResetValue = () => {
        const reseteado = controlData.map((actividad) => {
            const tipo = JSON.parse(actividad.config ?? "{}").type || "text";
            let nuevoValor = "";
            if (tipo === "checkbox") nuevoValor = "false";
            else if (tipo === "file") nuevoValor = "";
            return {
                ...actividad,
                valor: nuevoValor,
            };
        });
        setControlData(reseteado);
    };

    const percentageRemaining = (seconds / initialSeconds) * 100;

    const getColorClassByPercentage = () => {
        if (seconds === 0) {
            return 'bg-gradient-to-br from-red-600/80 to-red-800/80 animate-pulse';
        } else if (percentageRemaining <= 25) {
            return 'bg-gradient-to-br from-red-500/60 to-red-700/80';
        } else if (percentageRemaining <= 50) {
            return 'bg-gradient-to-br from-yellow-500/60 to-yellow-700/80';
        } else if (percentageRemaining <= 75) {
            return 'bg-gradient-to-br from-blue-600/60 to-blue-800/80';
        } else {
            return 'bg-gradient-to-br from-purple-700/60 to-purple-900/80';
        }
    };

    return (
        <>
            {/* Timer Widget */}
            {timerStatus !== 'finished' && (
                <motion.div
                    drag
                    dragConstraints={{ left: -100, right: 1000, top: -100, bottom: 100 }}
                    dragElastic={0.2}
                    whileDrag={{ scale: 1.1 }}
                    className={`
                    fixed right-6 bottom-6 z-[9999] backdrop-blur-md
                    ${getColorClassByPercentage()}
                    border border-white/20 rounded-full shadow-xl p-3 w-24 h-24
                    flex flex-col items-center justify-center gap-1
                    transition-all duration-300 hover:scale-105 cursor-grab
                    ${!isRunning && !alarmActive ? 'opacity-50 hover:opacity-100' : ''}
                `}
                >
                    <div
                        className={`
                        text-lg font-bold font-mono tracking-wide text-center
                        ${seconds === 0 ? 'text-white' : 'text-purple-100'}
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

            {/* Popup: Iniciar control */}
            {showPopup && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[99999] backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-sm animate-bounce-in">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">⏱️ ¡Es momento de hacer el Control!</h2>
                        <p className="text-gray-600 mb-6">
                            El cronómetro ha terminado. Puedes iniciar el control cuando estés listo.
                        </p>
                        <button
                            onClick={() => {
                                if (alertAudio.current) {
                                    alertAudio.current.pause();
                                    alertAudio.current.currentTime = 0;
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
                                controlData.reduce((acc: Record<string, typeof controlData>, actividad) => {
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
                                            const parseConfig = (raw: any) => {
                                                try {
                                                    if (typeof raw === "string") {
                                                        let parsed = JSON.parse(raw);
                                                        if (typeof parsed === "string") parsed = JSON.parse(parsed);
                                                        return parsed;
                                                    }
                                                    return raw ?? {};
                                                } catch (e) {
                                                    console.warn("❌ Error al parsear config:", raw, e);
                                                    return {};
                                                }
                                            };

                                            const parsedConfig = parseConfig(actividad.config);
                                            const tipo = parsedConfig.type || "text";
                                            const value = actividad.valor ?? "";
                                            const options: string[] = Array.isArray(parsedConfig.options) ? parsedConfig.options : [];

                                            const commonInputClass =
                                                "w-full border border-gray-300 p-2 pl-9 rounded-md text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-center";

                                            return (
                                                <div key={actividad.id_activitie} className="flex flex-col gap-2">
                                                    <Text type="subtitle">{actividad.descripcion_activitie}</Text>

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
                                                                        value={value}
                                                                        onChange={(e) => handleChange(actividad.id_activitie, e.target.value)}
                                                                    />
                                                                );
                                                            case "number":
                                                                return (
                                                                    <input
                                                                        type="number"
                                                                        className={commonInputClass}
                                                                        value={value}
                                                                        onChange={(e) => handleChange(actividad.id_activitie, e.target.value)}
                                                                    />
                                                                );
                                                            case "checkbox":
                                                                return (
                                                                    <input
                                                                        type="checkbox"
                                                                        className="w-5 h-5 accent-blue-500"
                                                                        checked={value === "true" || value === true}
                                                                        onChange={(e) => handleChange(actividad.id_activitie, e.target.checked)}
                                                                    />
                                                                );
                                                            case "select":
                                                                return (
                                                                    <select
                                                                        className={commonInputClass}
                                                                        value={value}
                                                                        onChange={(e) => handleChange(actividad.id_activitie, e.target.value)}
                                                                    >
                                                                        <option value="">Seleccione...</option>
                                                                        {options.map((opt, idx) => (
                                                                            <option key={idx} value={opt}>
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
                                                                        value={value}
                                                                        onChange={(e) => handleChange(actividad.id_activitie, e.target.value)}
                                                                    />
                                                                );
                                                            case "radio":
                                                                return (
                                                                    <div className="flex flex-wrap gap-4">
                                                                        {options.map((opt, idx) => (
                                                                            <label key={idx} className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                                                <input
                                                                                    type="radio"
                                                                                    name={`radio-${actividad.id_activitie}`}
                                                                                    value={opt}
                                                                                    checked={value === opt}
                                                                                    onChange={() => handleChange(actividad.id_activitie, opt)}
                                                                                />
                                                                                <span>{opt}</span>
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                );
                                                            case "date":
                                                            case "time":
                                                            case "datetime-local":
                                                                return (
                                                                    <input
                                                                        type={tipo}
                                                                        className={commonInputClass}
                                                                        value={value}
                                                                        onChange={(e) => handleChange(actividad.id_activitie, e.target.value)}
                                                                    />
                                                                );
                                                            case "temperature": {
                                                                const rangoMin = parsedConfig.min;
                                                                const rangoMax = parsedConfig.max;

                                                                const valor = typeof value === "number" ? value : parseFloat(value);
                                                                const fueraDeRango =
                                                                    !isNaN(valor) &&
                                                                    (rangoMin !== undefined && valor < rangoMin || rangoMax !== undefined && valor > rangoMax);

                                                                return (
                                                                    <div className="flex flex-col gap-2">
                                                                        <input
                                                                            type="number"
                                                                            step="0.1"
                                                                            placeholder={`Entre ${rangoMin} y ${rangoMax}`}
                                                                            className={`${commonInputClass} ${fueraDeRango ? "border-red-500 ring-red-500" : ""
                                                                                }`}
                                                                            value={value}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value === "" ? "" : parseFloat(e.target.value);
                                                                                handleChange(actividad.id_activitie, val);
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
                                                                        value={value}
                                                                        onChange={(e) => handleChange(actividad.id_activitie, e.target.value)}
                                                                    />
                                                                );
                                                            case "file":
                                                                return (
                                                                    <input
                                                                        type="file"
                                                                        className="block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                                                                        onChange={(e) => handleChange(actividad.id_activitie, e.target.files?.[0] ?? null)}
                                                                    />
                                                                );
                                                            default:
                                                                return (
                                                                    <input
                                                                        type="text"
                                                                        className={commonInputClass}
                                                                        value={value}
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
