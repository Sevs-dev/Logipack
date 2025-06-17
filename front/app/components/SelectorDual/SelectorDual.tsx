import React, { useState, useMemo } from "react";
import Text from "../text/Text";
import { FaTimes, FaSearch } from "react-icons/fa";

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
}

const MAX_LIST_HEIGHT = 240; // máximo en px (~15rem)

const SelectorDual: React.FC<SelectorDualProps> = ({
    titulo,
    disponibles = [],
    seleccionados = [],
    onAgregar,
    onQuitar,
}) => {
    const [busqueda, setBusqueda] = useState("");

    const disponiblesFiltradas = useMemo(() => {
        return disponibles.filter(
            (item) =>
                item.name.toLowerCase().includes(busqueda.toLowerCase()) &&
                !seleccionados.some((s) => s.id === item.id)
        );
    }, [busqueda, disponibles, seleccionados]);

    // Calcular altura por cantidad de ítems, limitado por MAX_LIST_HEIGHT
    const calcHeight = (count: number) => {
        const itemHeight = 36; // px por ítem aprox.
        const totalHeight = count * itemHeight;
        return totalHeight > MAX_LIST_HEIGHT ? MAX_LIST_HEIGHT : totalHeight;
    };

    const maxCount = Math.max(disponiblesFiltradas.length, seleccionados.length);

    return (
        <div>
            <Text type="subtitle" color="#000">{titulo}</Text>
            <div className="relative mb-3">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <FaSearch />
                </span>
                <input
                    aria-label="Buscar disponibles"
                    type="text"
                    placeholder="Buscar..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                {/* Disponibles */}
                <div className="border rounded-lg p-4 flex flex-col">
                    <Text type="subtitle" color="#000">Disponibles</Text>
                    <div
                        className="overflow-y-auto"
                        style={{
                            maxHeight: calcHeight(disponiblesFiltradas.length),
                            minHeight: calcHeight(maxCount),
                        }}
                    >
                        {disponiblesFiltradas.length > 0 ? (
                            <ul className="space-y-2">
                                {disponiblesFiltradas.map((item) => (
                                    <li
                                        key={item.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => onAgregar(item)}
                                        onKeyDown={(e) => e.key === "Enter" && onAgregar(item)}
                                        className="cursor-pointer px-3 py-2 bg-gray-100 rounded hover:bg-blue-100 transition text-black"
                                    >
                                        {item.name}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500">No se encontraron resultados</p>
                        )}
                    </div>
                </div>

                {/* Seleccionadas */}
                <div className="border rounded-lg p-4 flex flex-col">
                    <Text type="subtitle" color="#000">Seleccionadas</Text>
                    <div
                        className="overflow-y-auto"
                        style={{
                            maxHeight: calcHeight(seleccionados.length),
                            minHeight: calcHeight(maxCount),
                        }}
                    >
                        {seleccionados.length > 0 ? (
                            <ul className="space-y-2">
                                {seleccionados.map((item) => (
                                    <li
                                        key={item.id}
                                        className="flex justify-between items-center px-3 py-2 bg-green-100 rounded"
                                    >
                                        <span className="text-black">{item.name}</span>
                                        <button
                                            onClick={() => onQuitar(item.id)}
                                            aria-label={`Quitar ${item.name}`}
                                            title={`Quitar ${item.name}`}
                                            className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                            <FaTimes />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500">No hay elementos seleccionados</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SelectorDual;
