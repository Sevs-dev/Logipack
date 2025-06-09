import React, { useState } from "react";
import { FaEdit, FaTrash, FaCheck, FaTimes, FaPlus, FaHistory } from "react-icons/fa";
import { motion } from "framer-motion";

interface ButtonProps {
  type?: "button" | "submit" | "reset";
  variant: "save" | "cancel" | "edit" | "delete" | "create" | "create2" | "terciario" | "history";
  onClick?: () => void;
  disabled?: boolean;
  label?: string;
}

const buttonStyles = {
  save: "bg-green-600 hover:bg-green-700 focus:ring-green-400 shadow-lg shadow-green-500/40 text-white font-semibold px-3 py-1.5 rounded transition duration-300 ease-in-out",
  cancel: "bg-red-600 hover:bg-red-700 focus:ring-red-400 shadow-lg shadow-red-500/40 text-white font-semibold px-3 py-1.5 rounded transition duration-300 ease-in-out",
  edit: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-400 shadow-lg shadow-blue-500/40 text-white font-semibold px-3 py-1.5 rounded transition duration-300 ease-in-out",
  delete: "bg-red-700 hover:bg-red-800 focus:ring-red-500 shadow-lg shadow-red-600/40 text-white font-semibold px-3 py-1.5 rounded transition duration-300 ease-in-out",
  create: "bg-green-500 hover:bg-green-600 focus:ring-green-400 shadow-lg shadow-green-500/40 text-white font-semibold px-3 py-1.5 rounded transition duration-300 ease-in-out",
  create2: "bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400 shadow-lg shadow-yellow-500/40 text-gray-900 font-semibold px-3 py-1.5 rounded transition duration-300 ease-in-out",
  terciario: "bg-yellow-400 hover:bg-yellow-500 focus:ring-yellow-300 shadow-lg shadow-yellow-400/40 text-gray-900 font-semibold px-3 py-1.5 rounded transition duration-300 ease-in-out",
  history: "bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 shadow-lg shadow-purple-500/50 text-white font-semibold px-3 py-1.5 rounded transition duration-300 ease-in-out",
};

const icons = {
  save: <FaCheck />, // Icono cambiado a "Check" (✓)
  cancel: <FaTimes />, // Icono cambiado a "X"
  edit: <FaEdit />,
  delete: <FaTrash />,
  create: <FaPlus />,
  create2: <FaPlus />,
  terciario: <FaPlus />,
  history: <FaHistory />,
};

const labels: Record<ButtonProps["variant"], string> = {
  save: "Guardar",
  cancel: "Cancelar",
  edit: "Editar",
  delete: "Eliminar",
  create: "Crear",
  create2: "Finalizar",
  terciario: "Finalizar",
  history: "Historial",
};

const Button: React.FC<ButtonProps> = ({ type = "button", variant, onClick, disabled = false, label }) => {
  const [particles, setParticles] = useState<number[]>([]);

  const handleClick = () => {
    if (onClick) onClick();
    const newParticles = Array.from({ length: 8 }, (_, i) => i);
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 400);
  };

  return (
    <motion.button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      whileHover={{ scale: 1.05, boxShadow: "0px 0px 8px rgba(255,255,255,0.6)" }}
      whileTap={{ scale: 0.95, opacity: 0.9 }}
      className={`relative flex items-center justify-center gap-2 rounded-lg font-medium transition duration-200 focus:outline-none focus:ring-2
        px-2 py-1 text-xs sm:px-3 sm:py-1 sm:text-sm whitespace-nowrap overflow-hidden
        ${buttonStyles[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {icons[variant]}
      {variant !== "edit" && variant !== "delete" && variant !== "create2" && variant !== "history" ? (label ?? labels[variant] ?? "") : null}

      {particles.map((_, i) => (
        <motion.span
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          initial={{ opacity: 1, x: 0, y: 0 }}
          animate={{
            opacity: 0,
            x: Math.random() * 30 - 15,
            y: Math.random() * 30 - 15,
            scale: 0.5,
          }}
          transition={{ duration: 0.4 }}
        />
      ))}
    </motion.button>
  );
};

export default Button;