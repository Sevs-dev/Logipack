import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Text from "../text/Text";
import Button from "../buttons/buttons";
import type { CalendarEvent } from "./types";
import { getFormattedDuration } from "./utils";

interface Props {
  event: CalendarEvent | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onOpenDetails: () => void;
}

export default function EventModal({
  event,
  onClose,
  onPrev,
  onNext,
  onOpenDetails,
}: Props) {
  if (!event) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative w-full max-w-lg rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-2xl overflow-hidden"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-2 shadow transition-colors border border-[rgb(var(--border))] bg-[rgb(var(--surface))] hover:bg-[rgb(var(--surface-muted))] text-[rgb(var(--muted-foreground))]"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <div className="p-8 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-3"
            >
              <Text type="title" color="text-[rgb(var(--foreground))]">
                {event.title}
              </Text>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-muted))] p-6 shadow-inner"
            >
              <div className="text-base font-semibold mb-3 text-[rgb(var(--accent))]">
                Detalles del evento
              </div>
              <div className="space-y-3 text-base text-[rgb(var(--foreground))]">
                <div className="flex justify-between">
                  <span className="font-semibold">Cliente:</span>
                  <span>{event.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Inicio:</span>
                  <span>{event.startDate.format("DD/MM/YYYY HH:mm")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Fin:</span>
                  <span>{event.endDate.format("DD/MM/YYYY HH:mm")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Duración:</span>
                  <span>{getFormattedDuration(event.minutes)}</span>
                </div>
              </div>
              <div className="flex justify-between mt-6">
                <button
                  onClick={onPrev}
                  className="text-sm px-4 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] hover:bg-[rgb(var(--surface-muted))]"
                >
                  ← Anterior
                </button>
                <button
                  onClick={onOpenDetails}
                  className="text-sm px-4 py-2 rounded-lg bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))] hover:bg-[rgb(var(--accent-hover))]"
                >
                  Ver detalles
                </button>
                <button
                  onClick={onNext}
                  className="text-sm px-4 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] hover:bg-[rgb(var(--surface-muted))]"
                >
                  Siguiente →
                </button>
              </div>
            </motion.div>
            <div className="flex justify-center pt-2">
              <Button onClick={onClose} variant="cancel" label="Cerrar" />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
