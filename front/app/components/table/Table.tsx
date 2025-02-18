import React, { useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";

interface TableProps {
    rows: Record<string, any>[];
    columns: string[];
    columnLabels?: { [key: string]: string };
    onEdit: (id: any) => void;
    onDelete: (id: any) => void;
}

interface HeaderProps {
    column: string;
    label: string;
    onSort: (column: string) => void;
    sortOrder: "asc" | "desc";
    sortColumn: string;
}

const Header: React.FC<HeaderProps> = ({ column, label, onSort, sortOrder, sortColumn }) => {
    const isActive = column === sortColumn;
    return (
        <th
            className={`px-6 py-3 text-center font-semibold text-gray-300 tracking-wide cursor-pointer transition-all 
        ${isActive ? "text-white bg-gray-700 shadow-md" : "hover:bg-gray-800"}`}
            onClick={() => onSort(column)}
        >
            {label}
            {isActive && (
                <i
                    className={`ml-2 text-sm transition-opacity duration-300 ${sortOrder === "asc" ? "fa-solid fa-arrow-up opacity-100" : "fa-solid fa-arrow-down opacity-100"
                        }`}
                ></i>
            )}
        </th>
    );
};

export const Table: React.FC<TableProps> = ({ rows, columns, columnLabels = {}, onEdit, onDelete }) => {
    const [sortColumn, setSortColumn] = useState<string>(columns[0]);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [searchTerm, setSearchTerm] = useState<string>("");

    // Filtrar filas según búsqueda
    const filteredRows = rows.filter((row) =>
        columns.some((column) => row[column]?.toString().toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Ordenar filas
    const sortedRows = [...filteredRows].sort((a, b) => {
        const valA = a[sortColumn] ?? "";
        const valB = b[sortColumn] ?? "";
    
        if (typeof valA === "string" && typeof valB === "string") {
            return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
            return sortOrder === "asc" ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
        }
    });

    const handleSort = (column: string) => {
        setSortColumn(column);
        setSortOrder(sortColumn === column ? (sortOrder === "asc" ? "desc" : "asc") : "asc");
    };

    return (
        <div className="w-full overflow-x-auto rounded-xl shadow-md p-4 bg-gray-900">
            {/* 🔍 Input de búsqueda */}
            <div className="flex justify-end mb-3">
                <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 py-2 text-gray-300 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <table className="w-full border-collapse bg-gray-900 text-gray-300 hidden md:table text-center">
                <thead>
                    <tr className="bg-gradient-to-r from-gray-800 to-gray-700">
                        {columns.map((column) => (
                            <Header
                                key={column}
                                column={column}
                                label={columnLabels[column] || column}
                                onSort={handleSort}
                                sortColumn={sortColumn}
                                sortOrder={sortOrder}
                            />
                        ))}
                        <th className="px-6 py-3 text-center font-semibold text-gray-300">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedRows.map((row, index) => (
                        <tr key={index} className="border-b border-gray-700 odd:bg-gray-800 even:bg-gray-850 hover:bg-gray-700 transition-all">
                            {columns.map((column) => (
                                <td key={column} className="px-6 py-3 text-sm transition-all hover:text-white">
                                    {row[column]}
                                </td>
                            ))}
                            {/* Columna de acciones */}
                            <td className="px-6 py-3 flex justify-center gap-3">
                                <button onClick={() => onEdit(row.id)} className="text-blue-400 hover:text-blue-500">
                                    <FaEdit size={18} />
                                </button>
                                <button onClick={() => onDelete(row.id)} className="text-red-400 hover:text-red-500">
                                    <FaTrash size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Vista móvil */}
            <div className="md:hidden">
                {sortedRows.map((row, index) => (
                    <div key={index} className="p-4 mb-3 bg-gray-800 rounded-lg shadow-md border border-gray-700">
                        {columns.map((column) => (
                            <div key={column} className="flex justify-between text-sm text-gray-300">
                                <span className="font-semibold text-gray-400">{column}:</span>
                                <span className="text-white">{row[column]}</span>
                            </div>
                        ))}
                        {/* Botones en la vista móvil */}
                        <div className="flex justify-end mt-2 gap-3">
                            <button onClick={() => onEdit(row.id)} className="text-blue-400 hover:text-blue-500">
                                <FaEdit size={18} />
                            </button>
                            <button onClick={() => onDelete(row.id)} className="text-red-400 hover:text-red-500">
                                <FaTrash size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Table;
