import React, { useState, useMemo } from "react";
import Text from "../text/Text";
import { FaTimes, FaSearch } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "../inputs/Input";

interface Item {
  id: number;
  name: string;
}

interface SelectorDualProps {
  titulo: string;
  disponibles: Item[];
  seleccionados: Item[];
  onAgregar: (item: Item) => void;
  onQuitar: (id: number) => void;
  disabled?: boolean;
}

const MAX_LIST_HEIGHT = 240;

const SelectorDual: React.FC<SelectorDualProps> = ({
  titulo,
  disponibles = [],
  seleccionados = [],
  onAgregar,
  onQuitar,
  disabled = false,
}) => {
  const [busqueda, setBusqueda] = useState("");

  const disponiblesFiltradas = useMemo(() => {
    return disponibles.filter(
      (item) =>
        item.name.toLowerCase().includes(busqueda.toLowerCase()) &&
        !seleccionados.some((s) => s.id === item.id)
    );
  }, [busqueda, disponibles, seleccionados]);

  const calcHeight = (count: number) => {
    const itemHeight = 38;
    const totalHeight = count * itemHeight;
    return totalHeight > MAX_LIST_HEIGHT ? MAX_LIST_HEIGHT : totalHeight;
  };

  const maxCount = Math.max(disponiblesFiltradas.length, seleccionados.length);

  return (
    <div className="w-full">
      <Text type="subtitle" color="text-[rgb(var(--foreground))]">
        {titulo}
      </Text>

      {/* Buscador */}
      <div className="relative mt-3 mb-4">
        <Input
          placeholder="Buscar disponibles"
          tone="strong" // usa --border (más oscuro)
          leftIcon={
            <FaSearch className="w-4 h-4 text-[rgb(var(--muted-foreground))]" />
          }
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Lista disponibles */}
        <div className="rounded-2xl shadow-sm p-4 flex flex-col border bg-[rgb(var(--surface))] border-[rgb(var(--border))] dark:bg-slate-900 dark:border-slate-700">
          <Text type="subtitle" color="text-[rgb(var(--foreground))]">
            Disponibles
          </Text>

          <div
            className="overflow-y-auto custom-scroll mt-2"
            style={{
              maxHeight: calcHeight(disponiblesFiltradas.length),
              minHeight: calcHeight(maxCount),
            }}
          >
            {disponiblesFiltradas.length > 0 ? (
              <ul className="space-y-2">
                <AnimatePresence>
                  {disponiblesFiltradas.map((item) => (
                    <motion.li
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      tabIndex={0}
                      role="button"
                      onClick={() => !disabled && onAgregar(item)}
                      onKeyDown={(e) =>
                        !disabled && e.key === "Enter" && onAgregar(item)
                      }
                      className={[
                        "px-4 py-2 rounded-lg text-sm transition duration-200",
                        "text-[rgb(var(--foreground))]",
                        disabled
                          ? "bg-[rgb(var(--surface-muted))] opacity-50 cursor-not-allowed"
                          : "cursor-pointer bg-[rgb(var(--surface-muted))] hover:bg-[rgb(var(--accent))]/15 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]",
                        "dark:bg-slate-800/70 dark:hover:bg-slate-700",
                      ].join(" ")}
                    >
                      {item.name}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            ) : (
              <p className="text-sm text-[rgb(var(--foreground))]/60 mt-2">
                No se encontraron resultados
              </p>
            )}
          </div>
        </div>

        {/* Lista seleccionados */}
        <div className="rounded-2xl shadow-sm p-4 flex flex-col border bg-[rgb(var(--surface))] border-[rgb(var(--border))] dark:bg-slate-900 dark:border-slate-700">
          <Text type="subtitle" color="text-[rgb(var(--foreground))]">
            Seleccionadas
          </Text>

          <div
            className="overflow-y-auto custom-scroll mt-2"
            style={{
              maxHeight: calcHeight(seleccionados.length),
              minHeight: calcHeight(maxCount),
            }}
          >
            {seleccionados.length > 0 ? (
              <ul className="space-y-2">
                <AnimatePresence>
                  {seleccionados.map((item) => (
                    <motion.li
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className={[
                        "flex justify-between items-center px-4 py-2 rounded-lg text-sm",
                        "text-[rgb(var(--foreground))] border border-[rgb(var(--border))]",
                        "bg-[rgb(var(--accent))]/10",
                        "dark:bg-slate-800/70 dark:border-slate-700",
                      ].join(" ")}
                    >
                      <span>{item.name}</span>
                      <button
                        onClick={() => !disabled && onQuitar(item.id)}
                        disabled={disabled}
                        aria-label={`Quitar ${item.name}`}
                        title={`Quitar ${item.name}`}
                        className={[
                          "transition rounded-full p-1",
                          disabled
                            ? "text-red-300 cursor-not-allowed"
                            : "text-red-500 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400/50 dark:text-red-400 dark:hover:text-red-300",
                        ].join(" ")}
                      >
                        <FaTimes />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            ) : (
              <p className="text-sm text-[rgb(var(--foreground))]/60 mt-2">
                No hay elementos seleccionados
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectorDual;
