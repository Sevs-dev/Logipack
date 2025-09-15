import React, { useState } from "react";
import {
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaPlus,
  FaHistory,
  FaAngleLeft,
  FaAngleRight,
  FaRegFilePdf,
  FaRegPlusSquare,
  FaVoteYea,
  FaListUl,
  FaCreativeCommonsNd,
  FaPenNib ,
} from "react-icons/fa";
import { motion } from "framer-motion";

type Variant = | "save" | "cancel" | "edit" | "delete" | "create" | "create2" | "terciario" | "history" | "after" | "after2" | "before" | "pdf" | "add" | "view" | "restablecer" | "control" | "relacionada";

interface ButtonProps {
  type?: "button" | "submit" | "reset";
  variant: Variant;
  onClick?: () => void;
  disabled?: boolean;
  /** Ahora puede ser texto o un nodo (ej. <X />) */
  label?: React.ReactNode;
  /** Pasa `null` para ocultar el ícono por defecto */
  icon?: React.ReactNode | null;
  /** Siempre string; se usa para accesibilidad y como tooltip en icon-only */
  ariaLabel?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const variantStyles: Record<Variant, string> = {
  save: "bg-[#16A34A] hover:bg-[#22C55E] text-[#FFFFFF]",
  cancel: "bg-[#FF0000FF] hover:bg-[#EF4444] text-[#FFFFFF]",
  delete: "bg-[#FF0037FF] hover:bg-[#F43F5E] text-[#FFFFFF]",
  create: "bg-[#00CC85FF] hover:bg-[#2DD499FF] text-[#FFFFFF]",
  edit: "bg-[#2563EB] hover:bg-[#3B82F6] text-[#FFFFFF]",
  create2:
    "bg-[#EAB308] hover:bg-[#FACC15] focus:ring-[#FACC15] " +
    "shadow-[0_10px_15px_-3px_rgba(234,179,8,0.4),0_4px_6px_-4px_rgba(234,179,8,0.4)] " +
    "text-[#111827] font-semibold px-3 py-1.5 rounded transition duration-300 ease-in-out",
  terciario: "bg-[#84CC16] hover:bg-[#A3E635] text-[#111827]",
  history: "bg-[#9333EA] hover:bg-[#A855F7] text-[#FFFFFF]",
  pdf: "bg-[#06B6D4] hover:bg-[#22D3EE] text-[#FFFFFF]",
  after:
    "bg-[#64748B] hover:bg-[#94A3B8] text-[#FFFFFF] border border-[#64748B]",
  after2:
    "bg-[#EC4899] hover:bg-[#F472B6] text-[#FFFFFF] border border-[#EC4899]",
  before:
    "bg-[#6366F1] hover:bg-[#818CF8] text-[#FFFFFF] border border-[#6366F1]",
  add: "bg-[#F97316] hover:bg-[#FB923C] text-[#FFFFFF]",
  view: "bg-[#D946EF] hover:bg-[#E879F9] text-[#FFFFFF]",
  restablecer: "bg-[#B45309] hover:bg-[#D97706] text-[#FFFFFF]",
  control: "bg-[#E00074] hover:bg-[#FF5DA2] text-[#FFFFFF]",
  relacionada: "bg-[#FF3D00] hover:bg-[#FF6A33] text-[#FFFFFF]",
};

const icons: Record<Variant, React.ReactNode> = {
  save: <FaCheck />,
  cancel: <FaTimes />,
  edit: <FaEdit />,
  delete: <FaTrash />,
  create2: <FaPlus />,
  create: <FaPlus />,
  terciario: <FaPlus />,
  history: <FaHistory />,
  pdf: <FaRegFilePdf />,
  after: <FaAngleRight />,
  after2: <FaAngleRight />,
  before: <FaAngleLeft />,
  add: <FaRegPlusSquare />,
  view: <FaVoteYea />,
  restablecer: <FaListUl />,
  control: <FaCreativeCommonsNd />,
  relacionada: <FaPenNib  />,
};

const labels: Record<Variant, string> = {
  save: "Guardar",
  cancel: "Cancelar",
  edit: "Editar",
  delete: "Eliminar",
  create: "Crear",
  create2: "Orden",
  terciario: "Orden",
  history: "Historial",
  pdf: "PDF",
  after: "Siguiente",
  after2: "Siguiente",
  before: "Anterior",
  add: "Agregar",
  view: "Ver",
  restablecer: "Restablecer",
  control: "Control",
  relacionada: "Orden Relacionada",
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
  icon, // ahora acepta null para ocultar
  ariaLabel,
  size = "sm",
  className = "",
}) => {
  const [particles, setParticles] = useState<number[]>([]);

  const handleClick = () => {
    onClick?.();
    if (["save", "create", "terciario", "add", "view"].includes(variant)) {
      const newParticles = Array.from({ length: 8 }, (_, i) => i);
      setParticles(newParticles);
      setTimeout(() => setParticles([]), 400);
    }
  };

  // Oculta label en estas variantes (icon-only)
  const showLabel = ![
    "edit",
    "delete",
    "pdf",
    "history",
    "after",
    "before",
    "create2",
    "view",
    "restablecer",
    "control",
    "relacionada",
  ].includes(variant);

  // Selección de icono: si icon === null -> no renderiza ícono
  const iconNode = icon !== undefined ? icon : icons[variant];

  // aria-label y title siempre string
  const a11y =
    ariaLabel ??
    (typeof label === "string" && label.trim() ? label : labels[variant]);

  return (
    <motion.button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95, opacity: 0.9 }}
      className={`
        relative flex items-center justify-center gap-2 font-medium transition duration-200
        focus:outline-none focus:ring-2 rounded-lg whitespace-nowrap overflow-hidden
        ${sizeStyles[size]} ${variantStyles[variant]}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}
      `}
      aria-label={a11y}
      title={!showLabel ? a11y : undefined}
    >
      {iconNode}
      {showLabel ? label ?? labels[variant] : null}

      {particles.map((_, i) => (
        <motion.span
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background:
              variant === "add"
                ? "#10b981"
                : variant === "terciario"
                ? "#facc15"
                : ["save"].includes(variant)
                ? "#22c55e"
                : ["create", "restablecer", "control"].includes(variant)
                ? "#22d3ee"
                : variant === "create2"
                ? "#f59e0b"
                : variant === "view"
                ? "#9ca3af"
                : "#fff",
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
