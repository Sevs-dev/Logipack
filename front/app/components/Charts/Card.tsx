"use client";
import { motion } from "framer-motion";
import React, { ReactNode } from "react";

type CardProps = { children: ReactNode; className?: string };

const Card: React.FC<CardProps> = ({ children, className }) => (
  <motion.div
    whileHover={{
      scale: 1.035,
      boxShadow: "0 6px 36px rgba(34,211,238,0.25)", // cyan-400-ish con alpha
    }}
    transition={{ type: "spring", stiffness: 180, damping: 16 }}
    className={[
      // fondo temeable con gradiente sutil
      "backdrop-blur-lg",
      "bg-gradient-to-tr",
      "from-background/40 via-background/60 to-background/30",
      // borde sutil, en ambos temas
      "border border-foreground/10",
      // padding, radios y sombras
      "p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow",
      className ?? "",
    ].join(" ")}
  >
    {children}
  </motion.div>
);

export default Card;
