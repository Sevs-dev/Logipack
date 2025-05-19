import React, { useState } from "react";
import { FaArrowUp, FaArrowDown, FaSort } from "react-icons/fa";
import PermissionInputs from "../permissionCheck/PermissionInputs";
import Button from "../buttons/buttons"
import Mini from "../loader/MiniLoader"

interface TableProps {
    rows: Record<string, any>[];
    columns: string[];
    columnLabels?: { [key: string]: string };
    onEdit: (id: any) => void;
    onDelete: (id: any) => void;
    showDeleteButton?: boolean;
    showEditButton?: boolean;
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
            title="Click para ordenar"
        >
            {label}
            <span className="ml-2 inline-flex items-center">
                {isActive ? (
                    sortOrder === "asc" ? <FaArrowUp size={12} className="text-white" /> : <FaArrowDown size={12} className="text-white" />
                ) : (
                    <FaSort size={12} className="text-gray-400" />
                )}
            </span>
        </th>
    );
};

export const Table: React.FC<TableProps> = ({ rows, columns, columnLabels = {}, onEdit, onDelete, showDeleteButton = true, showEditButton = true }) => {
    const [sortColumn, setSortColumn] = useState<string>(columns[0]);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const booleanColumns = ["binding", "status", "aprobado"];
    const itemsPerPage = 5;
    const maxButtons = 4;

    const filteredRows = Array.isArray(rows)
        ? rows.filter((row) =>
            columns.some((column) =>
                row[column]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
            )
        )
        : [];


    const sortedRows = [...filteredRows].sort((a, b) => {
        const valA = a[sortColumn] ?? "";
        const valB = b[sortColumn] ?? "";

        if (typeof valA === "string" && typeof valB === "string") {
            return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
            return sortOrder === "asc" ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
        }
    });

    const totalPages = Math.ceil(sortedRows.length / itemsPerPage);
    const paginatedRows = sortedRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleSort = (column: string) => {
        setSortColumn(column);
        setSortOrder(sortColumn === column ? (sortOrder === "asc" ? "desc" : "asc") : "asc");
    };
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }

    const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);


    return (
        <div className="w-full overflow-hidden rounded-xl shadow-lg p-3 sm:p-4 bg-gray-900 transition-all duration-300">
            {filteredRows.length === 0 ? (
                <div className="text-center text-gray-400 py-4 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs sm:text-sm">
                    <span>No hay datos disponibles para mostrar.</span>
                    <Mini />
                </div>
            ) : (
                <>
                    {/* Input de búsqueda con animación sutil */}
                    <div className="flex justify-end mb-3">
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-4 py-2 text-gray-300 bg-gray-800 border border-gray-700 rounded-md 
                       transition-all duration-300 ease-in-out 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 
                       focus:bg-gray-850 focus:border-blue-400 
                       focus:shadow-md hover:shadow-lg"
                        />
                    </div>

                    {/* Tabla en pantallas grandes */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full border-collapse bg-gray-900 text-gray-300 text-center">
                            <thead>
                                <tr className="bg-gradient-to-r from-gray-800 to-gray-700 text-sm">
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
                                {paginatedRows.map((row, index) => (
                                    <tr key={index} className="border-b border-gray-700 text-sm odd:bg-gray-800 even:bg-gray-850 hover:bg-gray-700 transition-all duration-300">
                                        {columns.map((column) => {
                                            const value = row[column];
                                            if (booleanColumns.includes(column)) {
                                                // Verificar si el valor es booleano o numérico (0/1)
                                                const isBoolean = typeof value === "boolean";
                                                const isNumericBoolean = typeof value === "number" && (value === 0 || value === 1);
                                                return (
                                                    <td key={column} className="px-4 py-2 text-gray-300">
                                                        <span
                                                            className={`inline-flex items-center px-3 py-1 rounded-full text-white ${value === true || value === 1 ? "bg-green-600" : "bg-red-600"
                                                                }`}
                                                        >
                                                            {(value === true || value === 1) && (
                                                                <span className="mr-2 w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                                            )}
                                                            {value === true || value === 1 ? "Activo" : "Inactivo"}
                                                        </span>
                                                    </td>
                                                );
                                            } else {
                                                return (
                                                    <td key={column} className="px-4 py-2 text-gray-300">
                                                        {value}
                                                    </td>
                                                );
                                            }
                                        })}

                                        <td className="px-6 py-3 flex justify-center gap-3">
                                            {showEditButton && (
                                                <Button
                                                    onClick={() => { onEdit(row.id) }}
                                                    variant="edit"
                                                />
                                            )}
                                            {showDeleteButton && (
                                                <Button
                                                    onClick={() => { onDelete(row.id) }}
                                                    variant="delete"
                                                />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Tarjetas en pantallas pequeñas */}
                    <div className="md:hidden space-y-4">
                        {paginatedRows.map((row, index) => (
                            <div key={index} className="bg-gray-800 p-4 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg">
                                {columns.map((column) => (
                                    <div key={column} className="flex justify-between py-1 border-b border-gray-700 last:border-none">
                                        <span className="font-semibold text-gray-400">{columnLabels[column] || column}:</span>
                                        <span className="text-gray-300">{row[column]}</span>
                                    </div>
                                ))}
                                <PermissionInputs requiredPermission="gestionar_usuarios">
                                    <div className="flex justify-end gap-3 mt-3">
                                        <Button
                                            onClick={() => { onEdit(row.id); }}
                                            variant="edit"
                                        />
                                        <Button
                                            onClick={() => { onDelete(row.id) }}
                                            variant="delete"
                                        />
                                    </div>
                                </PermissionInputs>
                            </div>
                        ))}
                    </div>

                    {/* Paginación mejorada con animaciones suaves */}
                    <div className="relative flex items-center w-full mt-4">
                        {/* Controles de navegación compactos */}
                        <div className="absolute left-1/2 transform -translate-x-1/2 flex gap-x-2">
                            <button
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-2 py-1 bg-gray-700 text-gray-300 rounded-md 
                hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed 
                transition-all duration-200 active:scale-95"
                            >
                                ‹
                            </button>

                            <span className="px-2 py-1 text-sm font-medium bg-gray-800 text-gray-300 rounded-md">
                                {currentPage} / {totalPages}
                            </span>

                            <button
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-2 py-1 bg-gray-700 text-gray-300 rounded-md 
                hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed 
                transition-all duration-200 active:scale-95"
                            >
                                ›
                            </button>
                        </div>

                        {/* Números de paginación más compactos */}
                        <div className="ml-auto flex gap-x-1">
                            {pages.map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-2 py-1 text-sm rounded-md transition-all duration-200 ease-out 
                hover:scale-105
                ${page === currentPage
                                            ? "bg-blue-600 text-white scale-105"
                                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Table;
