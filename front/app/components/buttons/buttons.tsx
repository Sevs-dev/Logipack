import React, { useState } from "react";
import {
  FaEdit, FaTrash, FaCheck, FaTimes, FaPlus, FaHistory, FaAngleLeft, FaAngleRight, FaRegFilePdf, FaRegPlusSquare 
} from "react-icons/fa";
import { motion } from "framer-motion";

type Variant =
  | "save" | "cancel" | "edit" | "delete"
  | "create" | "terciario" | "history"
  | "after" | "before" | "pdf" | "add";

interface ButtonProps {
  type?: "button" | "submit" | "reset";
  variant: Variant;
  onClick?: () => void;
  disabled?: boolean;
  label?: string;
  icon?: React.ReactNode;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const variantStyles: Record<Variant, string> = {
  save: "bg-green-600 hover:bg-green-700 text-white",
  cancel: "bg-red-600 hover:bg-red-700 text-white",
  edit: "bg-blue-600 hover:bg-blue-700 text-white",
  delete: "bg-red-700 hover:bg-red-800 text-white",
  create: "bg-green-500 hover:bg-green-600 text-white",
  terciario: "bg-yellow-400 hover:bg-yellow-500 text-gray-900",
  history: "bg-purple-600 hover:bg-purple-700 text-white",
  pdf: "bg-cyan-500 hover:bg-cyan-600 text-white",
  after: "bg-white text-black border border-purple-500 hover:bg-purple-600 hover:text-white",
  before: "bg-white text-black border border-purple-500 hover:bg-purple-600 hover:text-white",
  add: "bg-orange-500 hover:bg-orange-600 text-white",
};

const icons: Record<Variant, React.ReactNode> = {
  save: <FaCheck />,
  cancel: <FaTimes />,
  edit: <FaEdit />,
  delete: <FaTrash />,
  create: <FaPlus />,
  terciario: <FaPlus />,
  history: <FaHistory />,
  pdf: <FaRegFilePdf />,
  after: <FaAngleRight />,
  before: <FaAngleLeft />,
  add: <FaRegPlusSquare  />, // NUEVO
};

const labels: Record<Variant, string> = {
  save: "Guardar",
  cancel: "Cancelar",
  edit: "Editar",
  delete: "Eliminar",
  create: "Crear",
  terciario: "Finalizar",
  history: "Historial",
  pdf: "PDF",
  after: "Siguiente",
  before: "Anterior",
  add: "Agregar", // NUEVO
};

const sizeStyles = {
  xs: "px-2 py-0.5 text-xs",
  sm: "px-3 py-1 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-5 py-2.5 text-lg",
};

const Button: React.FC<ButtonProps> = ({
  type = "button",
  variant,
  onClick,
  disabled = false,
  label,
  icon,
  size = "sm",
  className = "",
}) => {
  const [particles, setParticles] = useState<number[]>([]);

  const handleClick = () => {
    if (onClick) onClick();
    // Solo partículas en botones principales
    if (["save", "create", "terciario", "add"].includes(variant)) {
      const newParticles = Array.from({ length: 8 }, (_, i) => i);
      setParticles(newParticles);
      setTimeout(() => setParticles([]), 400);
    }
  };

  // Si solo es icono, añade aria-label
  const showLabel = !["edit", "delete", "pdf", "history", "after", "before"].includes(variant);

  return (
    <motion.button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95, opacity: 0.9 }}
      className={`
        relative flex items-center justify-center gap-2 font-medium transition duration-200 focus:outline-none focus:ring-2
        rounded-lg whitespace-nowrap overflow-hidden
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
      aria-label={label ?? labels[variant]}
    >
      {icon ?? icons[variant]}
      {showLabel ? (label ?? labels[variant] ?? "") : null}

      {/* Partículas solo si aplica */}
      {particles.map((_, i) => (
        <motion.span
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: variant === "add"
              ? "#10b981" // emerald-500 para add
              : variant === "terciario"
                ? "#facc15"
                : variant === "save"
                  ? "#22c55e"
                  : variant === "create"
                    ? "#22d3ee"
                    : "#fff"
          }}
          initial={{ opacity: 1, x: 0, y: 0 }}
          animate={{
            opacity: 0,
            x: Math.random() * 28 - 14,
            y: Math.random() * 28 - 14,
            scale: 0.5,
          }}
          transition={{ duration: 0.4 }}
        />
      ))}
    </motion.button>
  );
};

export default Button;
