import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";

type ModalSectionProps = {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export default function ModalSection({
  isVisible,
  onClose,
  children,
}: ModalSectionProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Cerrar con ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isVisible) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isVisible, onClose]);

  // Focus trap básico
  useEffect(() => {
    if (!isVisible) return;

    const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    const firstEl = focusableElements?.[0];
    const lastEl = focusableElements?.[focusableElements.length - 1];

    function handleTab(e: KeyboardEvent) {
      if (e.key !== "Tab") return;

      if (!focusableElements || focusableElements.length === 0) {
        e.preventDefault();
        return;
      }

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl?.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl?.focus();
        }
      }
    }

    window.addEventListener("keydown", handleTab);
    (firstEl ?? modalRef.current)?.focus();

    return () => window.removeEventListener("keydown", handleTab);
  }, [isVisible]);

  // Bloquear scroll del <body> mientras el modal está abierto
  useEffect(() => {
    if (!isVisible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 bg-black/50 dark:bg-black/40 backdrop-blur-sm flex justify-center items-center p-4 z-50"
          onMouseDown={(e) => {
            // Cerrar si el click fue en el overlay (no dentro del panel)
            if (e.target === e.currentTarget) onClose();
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            ref={modalRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            className={[
              "relative rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto p-6 scroll-smooth custom-scroll outline-none",
              // Base con tokens
              "bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] border border-[rgb(var(--border))]",
              // Fallbacks si usas .dark global
              "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700",
              // ⬇️ Aclarado SOLO dentro del modal (valores R G B)
              "dark:[--surface:30_41_59]", // slate-800
              "dark:[--surface-muted:51_65_85]", // slate-700
              "dark:[--border:71_85_105]", // slate-600
              "dark:[--foreground:241_245_249]", // slate-100
              "dark:[--ring:56_189_248]", // sky-400
              "dark:[--accent:56_189_248]", // sky-400
            ].join(" ")}
            initial={{ y: -30, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {/* Botón cerrar */}
            <button
              onClick={onClose}
              className={[
                "absolute top-4 right-4 p-2 rounded-full transition-colors",
                "text-[rgb(var(--foreground))]/70 hover:text-white",
                "hover:bg-[rgb(var(--accent))] focus:outline-none",
                "focus:ring-2 focus:ring-[rgb(var(--ring))]",
              ].join(" ")}
              aria-label="Cerrar"
            >
              <FaTimes className="w-5 h-5" />
            </button>

            {children}

            <style>{`
              /* Scrollbar con variables del tema */
              .custom-scroll::-webkit-scrollbar {
                width: 10px;
                height: 10px;
              }
              .custom-scroll::-webkit-scrollbar-thumb {
                background-color: rgb(var(--foreground) / 0.18);
                border-radius: 10px;
                border: 2px solid transparent;
                background-clip: padding-box;
              }
              .custom-scroll::-webkit-scrollbar-thumb:hover {
                background-color: rgb(var(--foreground) / 0.30);
              }
              .custom-scroll::-webkit-scrollbar-track {
                background: rgb(var(--surface));
              }
              /* Firefox */
              .custom-scroll {
                scrollbar-width: thin;
                scrollbar-color: rgb(var(--foreground) / 0.25) rgb(var(--surface));
              }
            `}</style>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
