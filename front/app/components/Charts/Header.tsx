"use client";
import { AnimatePresence, motion } from "framer-motion";

type HeaderProps = {
  userName: string;
  emoji: string;
};

export default function Header({ userName, emoji }: HeaderProps) {
  return (
    <header className="flex flex-col items-center text-center mb-12">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground drop-shadow mb-2">
        Panel de Gestión
      </h1>

      <p className="text-base sm:text-lg md:text-xl text-foreground/70 flex flex-wrap justify-center items-center gap-2 text-center">
        Bienvenido,&nbsp;
        <span className="text-cyan-400 font-bold underline underline-offset-4 decoration-wavy">
          {userName}
        </span>

        <AnimatePresence mode="wait">
          <motion.span
            key={emoji}
            initial={{ opacity: 0, scale: 0.4, rotate: -30, y: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.4, rotate: 30, y: 20 }}
            transition={{ type: "spring", stiffness: 500, damping: 25, duration: 0.5 }}
            className="text-2xl sm:text-3xl md:text-4xl inline-block"
          >
            {emoji}
          </motion.span>
        </AnimatePresence>
      </p>
    </header>
  );
}
