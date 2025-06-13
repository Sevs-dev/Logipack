import { motion } from "framer-motion";
import { FaRegBell } from "react-icons/fa";

export const NotificationBell = ({ count, onClick }: { count: number; onClick: () => void }) => (
  <button
    onClick={onClick}
    aria-label="Mostrar todas las notificaciones"
    className="fixed top-6 right-6 z-50 p-3 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-lg hover:shadow-2xl transition-transform duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-60"
  >
    <span className="relative">
      <FaRegBell className="w-6 h-6 text-white" />
      {count > 0 && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 18 }}
          className="absolute -top-2 -right-3 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full animate-pulse font-semibold select-none"
        >
          {count}
        </motion.span>
      )}
    </span>
  </button>
);
