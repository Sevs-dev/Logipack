import React, { useState, useEffect, useRef } from 'react';
import { FaPlay, FaPause, FaStop, FaRedo } from 'react-icons/fa';
import { motion } from 'framer-motion';
import {
    createTimer,
    pauseTimer,
    finishTimer,
    resetTimer, 
} from '../../services/timer/timerServices';

interface TimerProps {
    adaptationId: number;
    stageId: number;
    initialMinutes: number;
}

const Timer: React.FC<TimerProps> = ({ adaptationId, stageId, initialMinutes }) => {
    const initialSeconds = initialMinutes * 60;

    const [timerId, setTimerId] = useState<number | null>(null);
    const [seconds, setSeconds] = useState<number>(initialSeconds);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [alarmActive, setAlarmActive] = useState<boolean>(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const alertAudio = useRef<HTMLAudioElement | null>(null);

    // Cargar audio solo 1 vez
    useEffect(() => {
        alertAudio.current = new Audio('/sounds/beep.mp3');
        alertAudio.current.loop = true;
    }, []);

    const formatTime = (secs: number) => {
        const minutes = Math.floor(secs / 60).toString().padStart(2, '0');
        const seconds = (secs % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    const handleStart = async () => {
        if (!timerId) {
            const timer = await createTimer({
                adaptation_id: adaptationId,
                stage_id: stageId,
                time: seconds,
            });
            setTimerId(timer.id);
        }

        // 👉 Desbloquear audio en el primer click
        if (alertAudio.current) {
            alertAudio.current.play().then(() => {
                alertAudio.current!.pause();
                alertAudio.current!.currentTime = 0;
            }).catch(e => {
                console.log('No se pudo desbloquear audio', e);
            });
        }

        setIsRunning(true);
    };

    const handlePause = async () => {
        if (timerId) {
            await pauseTimer(timerId);
        }
        setIsRunning(false);
    };

    const handleFinish = async () => {
        if (timerId) {
            await finishTimer(timerId);
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
    };

    const handleReset = async () => {
        if (timerId) {
            await resetTimer(timerId);
        }
        setSeconds(initialSeconds);
        setIsRunning(false);
        setAlarmActive(false);

        if (alertAudio.current) {
            alertAudio.current.pause();
            alertAudio.current.currentTime = 0;
        }

        // 🚀 Iniciar automáticamente después de reset
        await handleStart();
    };

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
            navigator.vibrate([300, 200, 300, 200, 300]);
        }
    };

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setSeconds((prev) => {
                    if (prev > 0) {
                        return prev - 1;
                    } else {
                        handleFinish();
                        return 0;
                    }
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
    }, [isRunning]);

    return (
        <motion.div
            drag
            dragConstraints={{ left: -100, right: 1000, top: -100, bottom: 1000 }}
            dragElastic={0.2}
            whileDrag={{ scale: 1.1 }}
            className={`
        fixed right-6 bottom-6 z-[9999] backdrop-blur-md
        ${seconds === 0
                    ? 'bg-gradient-to-br from-red-600/80 to-red-800/80 animate-pulse'
                    : 'bg-gradient-to-br from-purple-700/60 to-purple-900/80'
                }
        border border-white/20 rounded-full shadow-xl p-4 w-44 h-44
        flex flex-col items-center justify-center gap-2
        transition-all duration-300 hover:scale-105 cursor-grab
        ${!isRunning && !alarmActive ? 'opacity-50 hover:opacity-100' : ''}
    `}
        >
            <div
                className={`text-lg font-mono tracking-widest text-center
            ${seconds === 0 ? 'text-white' : 'text-purple-100'}`}
            >
                {formatTime(seconds)}
            </div>

            <div className="flex flex-wrap justify-center gap-1.5 mt-1">
                {isRunning ? (
                    <button
                        onClick={handlePause}
                        className="p-1.5 bg-yellow-400/80 hover:bg-yellow-500/80 text-white rounded-full shadow transition"
                    >
                        <FaPause size={12} />
                    </button>
                ) : (
                    <button
                        onClick={handleStart}
                        className="p-1.5 bg-green-500/80 hover:bg-green-600/80 text-white rounded-full shadow transition"
                    >
                        <FaPlay size={12} />
                    </button>
                )}

                <button
                    onClick={handleFinish}
                    className="p-1.5 bg-red-500/80 hover:bg-red-600/80 text-white rounded-full shadow transition"
                >
                    <FaStop size={12} />
                </button>

                <button
                    onClick={handleReset}
                    className="p-1.5 bg-indigo-500/80 hover:bg-indigo-600/80 text-white rounded-full shadow transition"
                >
                    <FaRedo size={12} />
                </button>
            </div>
        </motion.div>
    );
};

export default Timer;
