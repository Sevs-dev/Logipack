// import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { calculateRemaining } from "../../utils/timeUtils";
import { Planning } from "../../hooks/usePlanningNotifier";

export const NotificationToast = ({
    activity,
    onClose,
}: {
    activity: Planning;
    onClose: () => void;
}) => {
    const { ratio, formatted } = calculateRemaining(activity.start_date, activity.end_date);

    const bgColor = activity.paused
        ? "bg-yellow-400/90"
        : activity.finish_notificade
            ? "bg-orange-500/85"
            : "bg-indigo-600/80";

    // Auto-dismiss opcional
    // useEffect(() => {
    //   const timeout = setTimeout(onClose, 10000); // 10 segundos
    //   return () => clearTimeout(timeout);
    // }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
            className={`relative w-80 max-w-[90vw] rounded-2xl overflow-hidden shadow-xl backdrop-blur-xl border border-white/10 ${bgColor}`}
        >
            <div className="p-4 flex items-center gap-4">
                <div className="w-11 h-11 relative shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <circle className="text-zinc-500/30" strokeWidth="3" stroke="currentColor" fill="none" cx="18" cy="18" r="15" />
                        <circle
                            strokeWidth="3"
                            stroke="white"
                            strokeLinecap="round"
                            fill="none"
                            cx="18"
                            cy="18"
                            r="15"
                            strokeDasharray="94.2"
                            strokeDashoffset={(1 - ratio) * 94.2}
                            style={{ transition: "stroke-dashoffset 0.3s ease" }}
                        />
                    </svg>
                    <span className="absolute inset-0 grid place-content-center font-mono text-xs font-semibold text-white">
                        {formatted}
                    </span>
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-white truncate">{activity.number_order}</h3>
                    <p className="text-sm text-white/80">
                        {activity.paused
                            ? "Actividad pausada"
                            : activity.finish_notificade
                                ? "Se acerca el final"
                                : "En progreso"}
                    </p>
                </div>
                <button
                    aria-label="Cerrar notificación"
                    onClick={onClose}
                    className="text-white hover:text-red-400 transition-colors text-xl"
                >
                    ✕
                </button>
            </div>
        </motion.div>
    );
};
