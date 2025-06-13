import { motion } from "framer-motion";
import { Planning } from "../../hooks/usePlanningNotifier";

export const NotificationModal = ({
  activities,
  onPause,
  onClose,
}: {
  activities: Planning[];
  onPause: (id: number) => void;
  onClose: () => void;
}) => (
  <motion.div
    key="modal"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-60 bg-black bg-opacity-60 flex justify-center items-center p-6"
    onClick={onClose}
  >
    <motion.div
      onClick={(e) => e.stopPropagation()}
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 text-white space-y-4"
    >
      <h2 className="text-xl font-bold">Actividades en curso</h2>
      {activities.length === 0 ? (
        <p className="text-sm text-white/70">No hay actividades activas por ahora.</p>
      ) : (
        activities.map((act) => (
          <div
            key={act.id}
            className={`p-4 rounded-xl border shadow flex justify-between items-center transition-all duration-200 ${
              act.paused
                ? "bg-yellow-500/20"
                : act.finish_notificade
                ? "bg-orange-500/25"
                : "bg-indigo-500/15"
            }`}
          >
            <div>
              <h3 className="font-semibold truncate">{act.number_order}</h3>
              <p className="text-sm text-white/70">
                {act.paused
                  ? "Pausada"
                  : act.finish_notificade
                  ? "Cerca de finalizar"
                  : "En progreso"}
              </p>
            </div>
            {!act.paused && (
              <button
                onClick={() => onPause(act.id)}
                className="bg-yellow-400 text-black rounded px-3 py-1 text-sm font-semibold hover:bg-yellow-500 transition"
              >
                Pausar
              </button>
            )}
          </div>
        ))
      )}
      <button onClick={onClose} className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 transition rounded py-2 font-semibold">
        Cerrar
      </button>
    </motion.div>
  </motion.div>
);
