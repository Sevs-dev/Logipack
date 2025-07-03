import React, { useState, useMemo } from "react";
import Text from "../text/Text";
import { FaTimes, FaSearch } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

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
            <Text type="subtitle" color="#000">{titulo}</Text>

            {/* Buscador */}
            <div className="relative mt-3 mb-4">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                    <FaSearch />
                </span>
                <input
                    aria-label="Buscar disponibles"
                    type="text"
                    placeholder="Buscar..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    disabled={disabled}
                    className={`w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 bg-white text-black placeholder:text-gray-400
            ${disabled
                            ? "opacity-50 cursor-not-allowed"
                            : "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"}
          `}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Lista disponibles */}
                <div className="bg-white border rounded-2xl shadow-sm p-4 flex flex-col">
                    <Text type="subtitle" color="#000">Disponibles</Text>
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
                                            onKeyDown={(e) => !disabled && e.key === "Enter" && onAgregar(item)}
                                            className={`px-4 py-2 rounded-lg text-sm transition duration-200 text-gray-800
                        ${disabled
                                                    ? "bg-gray-100 opacity-50 cursor-not-allowed"
                                                    : "cursor-pointer bg-gray-100 hover:bg-blue-100"}
                      `}
                                        >
                                            {item.name}
                                        </motion.li>
                                    ))}
                                </AnimatePresence>
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500 mt-2">No se encontraron resultados</p>
                        )}
                    </div>
                </div>

                {/* Lista seleccionados */}
                <div className="bg-white border rounded-2xl shadow-sm p-4 flex flex-col">
                    <Text type="subtitle" color="#000">Seleccionadas</Text>
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
                                            className="flex justify-between items-center px-4 py-2 bg-green-100 rounded-lg text-sm text-gray-800"
                                        >
                                            <span>{item.name}</span>
                                            <button
                                                onClick={() => !disabled && onQuitar(item.id)}
                                                disabled={disabled}
                                                aria-label={`Quitar ${item.name}`}
                                                title={`Quitar ${item.name}`}
                                                className={`transition
                          ${disabled
                                                        ? "text-red-300 cursor-not-allowed"
                                                        : "text-red-500 hover:text-red-700"}
                        `}
                                            >
                                                <FaTimes />
                                            </button>
                                        </motion.li>
                                    ))}
                                </AnimatePresence>
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500 mt-2">No hay elementos seleccionados</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SelectorDual;
