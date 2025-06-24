import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaPlay, FaStop, FaRedo } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Firma from '../ordenes_ejecutadas/Firma';
import Text from "../text/Text";
import {
    createTimer,
    finishTimer,
    getTimerEjecutadaById
} from '../../services/timer/timerServices';
import ModalSection from "../modal/ModalSection";

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
    const [showPopup, setShowPopup] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const alertAudio = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        alertAudio.current = new Audio('/sounds/beep.mp3');
        alertAudio.current.loop = true;
    }, []);

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

    const handleFinish = useCallback(() => {
        console.log('⏹️ handleFinish()');

        setIsRunning(false);
        setAlarmActive(true);
        setSeconds(0);
        triggerNotification();
        triggerVibration();

        if (alertAudio.current) {
            alertAudio.current.play().catch((error) => {
                console.error('Error al reproducir sonido:', error);
            });
        }

        setShowPopup(true);
    }, []);

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

    const handleStop = async () => {
        if (timerId) {
            await finishTimer({
                ejecutada_id: ejecutadaId,
                pause_time: Math.ceil(seconds / 60),
            });
            await refetchTimer();
        }
        setIsRunning(false);
        setAlarmActive(false);
        if (alertAudio.current) {
            alertAudio.current.pause();
            alertAudio.current.currentTime = 0;
        }
    };

    useEffect(() => {
        if (alarmActive && alertAudio.current) {
            alertAudio.current.play().catch(() => {
                console.warn('No se pudo reproducir la alarma automáticamente.');
            });
        }
    }, [alarmActive]);

    const triggerNotification = () => {
        const options = {
            body: 'Puedes iniciar el control cuando estés listo.',
            icon: '/icons/timer-icon.png',  // <-- pon aquí un icono PNG de 128x128
            badge: '/icons/badge-icon.png', // <-- opcional, badge chiquito
            requireInteraction: true,      // la notificación queda visible hasta que el user interactúe
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

    const triggerVibration = () => {
        if (navigator.vibrate) {
            navigator.vibrate([300, 200, 300]);
        }
    };

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setSeconds((prev) => {
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

    return (
        <>
            {/* Timer Widget */}
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
                    {!isRunning && (
                        <button
                            onClick={handleStart}
                            className="p-1 bg-green-500/80 hover:bg-green-600/80 text-white rounded-full shadow-sm transition"
                            aria-label="Iniciar"
                        >
                            <FaPlay size={10} />
                        </button>
                    )}

                    <button
                        onClick={handleStop}
                        className="p-1 bg-red-500/80 hover:bg-red-600/80 text-white rounded-full shadow-sm transition"
                        aria-label="Parar"
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
                <ModalSection isVisible={showModal} onClose={() => {
                    setShowModal(false);
                }}>
                    <button
                        onClick={() => {
                            setShowModal(false);
                            handleReset();
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700"
                    >
                        Cerrar y reiniciar timer
                    </button>

                </ModalSection>
            )}
        </>
    );
};

export default Timer;
