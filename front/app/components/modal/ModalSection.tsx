import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";

type ModalSectionProps = {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export default function ModalSection({ isVisible, onClose, children }: ModalSectionProps) {
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

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            ref={modalRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto p-6 scroll-smooth custom-scroll outline-none"
            initial={{ y: -30, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {/* Botón cerrar */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-600 hover:text-white hover:bg-red-500 transition-colors p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-red-300"
              aria-label="Cerrar"
            >
              <FaTimes className="w-5 h-5" />
            </button>

            {children}

            <style>{`
              .custom-scroll::-webkit-scrollbar {
                width: 8px;
              }
              .custom-scroll::-webkit-scrollbar-thumb {
                background-color: rgba(0, 0, 0, 0.2);
                border-radius: 8px;
              }
              .custom-scroll::-webkit-scrollbar-track {
                background: transparent;
              }
              /* Firefox */
              .custom-scroll {
                scrollbar-width: thin;
                scrollbar-color: rgba(0,0,0,0.2) transparent;
              }
            `}</style>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
