import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaPlay, FaPause, FaStop, FaRedo } from 'react-icons/fa';
import { motion } from 'framer-motion';
import {
    createTimer,
    pauseTimer,
    finishTimer,
    resetTimer,
    getTimerEjecutadaById
} from '../../services/timer/timerServices';

interface TimerProps {
    ejecutadaId: number;
    stageId: number;
    initialMinutes: number;
    refetchTimer: () => void;
}

const Timer: React.FC<TimerProps> = ({ ejecutadaId, stageId, initialMinutes, refetchTimer }) => {
    const initialSeconds = initialMinutes * 60;

    const [timerId, setTimerId] = useState<number | null>(null);
    const [seconds, setSeconds] = useState<number>(initialSeconds);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [alarmActive, setAlarmActive] = useState<boolean>(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const alertAudio = useRef<HTMLAudioElement | null>(null);

    // Inicializar el audio solo una vez
    useEffect(() => {
        alertAudio.current = new Audio('/sounds/beep.mp3');
        alertAudio.current.loop = true;
    }, []);

    // Función para desbloquear el audio con interacción de usuario
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

    // Cargar timer existente al montar
    useEffect(() => {
        async function fetchTimer() {
            try {
                const result = await getTimerEjecutadaById(ejecutadaId);
                if (result.exists && result.timer) {
                    setTimerId(result.timer.id);
                    setSeconds(result.timer.time * 60);
                    setIsRunning(result.timer.status === 'running');
                }
            } catch (error) {
                console.error('Error al obtener timer existente:', error);
            }
        }
        fetchTimer();
    }, [ejecutadaId]);

    const formatTime = (secs: number) => {
        const minutes = Math.floor(secs / 60).toString().padStart(2, '0');
        const seconds = (secs % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

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

    const handlePause = async () => {
        if (!timerId) {
            setIsRunning(false);
            return;
        }
        try {
            await pauseTimer({
                ejecutada_id: ejecutadaId,
                pause_time: Math.ceil(seconds / 60),
            });
            await refetchTimer();
            setIsRunning(false);
        } catch (error) {
            console.error('Error en pauseTimer:', error);
        }
    };

    const handleFinish = useCallback(async () => {
        console.log('⏹️ handleFinish()');

        if (ejecutadaId) {
            await finishTimer({
                ejecutada_id: ejecutadaId,
                pause_time: Math.ceil(seconds / 60), // convertir segundos → minutos
            });
            await refetchTimer();
        }

        setIsRunning(false);
        setAlarmActive(true);
        triggerNotification();
        triggerVibration();

        if (alertAudio.current) {
            alertAudio.current.play().catch((error) => {
                console.error('Error al reproducir sonido:', error);
            });
        }
    }, [ejecutadaId, refetchTimer]);

    const handleReset = async () => {
        if (timerId) {
            await resetTimer({
                ejecutada_id: ejecutadaId,
                time_reset: Math.ceil(seconds / 60),
            });
            await refetchTimer();
        }
        setSeconds(initialSeconds);
        setIsRunning(false);
        setAlarmActive(false);
        if (alertAudio.current) {
            alertAudio.current.pause();
            alertAudio.current.currentTime = 0;
        }
        await handleStart();
    };

    // Sonido de alarma al activarse la alarma
    useEffect(() => {
        if (alarmActive && alertAudio.current) {
            alertAudio.current.play().catch(() => {
                console.warn('No se pudo reproducir la alarma automáticamente.');
            });
        }
    }, [alarmActive]);

    // Notificaciones y vibración
    const triggerNotification = () => {
        if (Notification.permission === 'granted') {
            new Notification('⏱️ ¡El cronómetro ha terminado!');
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('⏱️ ¡El cronómetro ha terminado!');
                }
            });
        }
    };

    const triggerVibration = () => {
        if (navigator.vibrate) {
            navigator.vibrate([300, 200, 300]);
        }
    };

    // Intervalo que cuenta segundos hacia atrás
    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setSeconds((prev) => {
                    if (prev > 1) return prev - 1;
                    if (prev === 1) {
                        setTimeout(() => {
                            if (isRunning) handleFinish();
                        }, 150);
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

    return (
        <motion.div
            drag
            dragConstraints={{ left: -100, right: 1000, top: -100, bottom: 100 }}
            dragElastic={0.2}
            whileDrag={{ scale: 1.1 }}
            className={`
                fixed right-6 bottom-6 z-[9999] backdrop-blur-md
                ${seconds === 0
                    ? 'bg-gradient-to-br from-red-600/80 to-red-800/80 animate-pulse'
                    : 'bg-gradient-to-br from-purple-700/60 to-purple-900/80'
                }
                border border-white/20 rounded-full shadow-xl p-3 w-32 h-32
                flex flex-col items-center justify-center gap-1
                transition-all duration-300 hover:scale-105 cursor-grab
                ${!isRunning && !alarmActive ? 'opacity-50 hover:opacity-100' : ''}
            `}
        >
            <div
                className={`text-base font-mono tracking-wider text-center
                ${seconds === 0 ? 'text-white' : 'text-purple-100'}
            `}
            >
                {formatTime(seconds)}
            </div>

            <div className="flex gap-1 mt-1">
                {isRunning ? (
                    <button
                        onClick={handlePause}
                        className="p-1 bg-yellow-400/80 hover:bg-yellow-500/80 text-white rounded-full shadow-sm transition"
                        aria-label="Pausar"
                    >
                        <FaPause size={10} />
                    </button>
                ) : (
                    <button
                        onClick={handleStart}
                        className="p-1 bg-green-500/80 hover:bg-green-600/80 text-white rounded-full shadow-sm transition"
                        aria-label="Iniciar"
                    >
                        <FaPlay size={10} />
                    </button>
                )}

                <button
                    onClick={handleFinish}
                    className="p-1 bg-red-500/80 hover:bg-red-600/80 text-white rounded-full shadow-sm transition"
                    aria-label="Finalizar"
                >
                    <FaStop size={10} />
                </button>

                <button
                    onClick={handleReset}
                    className="p-1 bg-indigo-500/80 hover:bg-indigo-600/80 text-white rounded-full shadow-sm transition"
                    aria-label="Reiniciar"
                >
                    <FaRedo size={10} />
                </button>
            </div>
        </motion.div>
    );
};

export default Timer;
