import React, { useState, useEffect } from "react";
import { FaArrowUp, FaArrowDown, FaSort } from "react-icons/fa";
import Button from "../buttons/buttons";
import Mini from "../loader/MiniLoader";

type BooleanColumns = "binding" | "status" | "aprobado" | "paralelo";

type TableProps<T extends { id: number }> = {
    rows: T[];
    columns: (keyof T)[];
    columnLabels?: Partial<Record<keyof T, string>>;
    onEdit?: (id: number) => void;
    onDelete?: (id: number) => void;
    onTerciario?: (id: number) => void;
    onHistory?: (id: number) => void;
    onPDF?: (id: number) => void;
    showDeleteButton?: boolean;
    showEditButton?: boolean;
    showTerciarioButton?: boolean;
    showHistory?: boolean;
    showPDF?: boolean;
    showTerciarioCondition?: (row: T) => boolean;
    showPDFCondition?: (row: T) => boolean;
};

const Header = ({
    column,
    label,
    onSort,
    sortOrder,
    sortColumn,
}: {
    column: string;
    label: string;
    onSort: (column: string) => void;
    sortOrder: "asc" | "desc";
    sortColumn: string;
}) => {
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
                    sortOrder === "asc" ? (
                        <FaArrowUp size={12} className="text-white" />
                    ) : (
                        <FaArrowDown size={12} className="text-white" />
                    )
                ) : (
                    <FaSort size={12} className="text-gray-400" />
                )}
            </span>
        </th>
    );
};

function Table<T extends { id: number }>({
    rows,
    columns,
    columnLabels = {},
    onEdit,
    onDelete,
    onTerciario,
    onHistory,
    onPDF,
    showTerciarioCondition,
    showPDFCondition,
    showDeleteButton = true,
    showEditButton = true,
    showTerciarioButton = true,
    showHistory = true,
    showPDF = true,
}: TableProps<T>) {
    const [sortColumn, setSortColumn] = useState("id");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [columnSearchTerms, setColumnSearchTerms] = useState<Partial<Record<keyof T, string>>>({});
    const [currentPage, setCurrentPage] = useState(1);

    const booleanColumns: BooleanColumns[] = ["binding", "status", "aprobado", "paralelo"];
    const itemsPerPage = 10;
    const maxButtons = 4;

    const filteredRows = rows.filter((row) =>
        columns.every((column) => {
            const searchValue = columnSearchTerms[column]?.toLowerCase() ?? "";
            const cellValue = String(row[column] ?? "").toLowerCase();
            return cellValue.includes(searchValue);
        })
    );

    const sortedRows = [...filteredRows].sort((a, b) => {
        if (sortColumn === "id") {
            return sortOrder === "asc" ? a.id - b.id : b.id - a.id;
        }
        const valA = a[sortColumn as keyof T] ?? "";
        const valB = b[sortColumn as keyof T] ?? "";

        if (typeof valA === "string" && typeof valB === "string") {
            return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
            return sortOrder === "asc" ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
        }
    });

    const totalPages = Math.ceil(sortedRows.length / itemsPerPage);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages || 1);
        }
    }, [totalPages, currentPage]);

    const paginatedRows = sortedRows.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSort = (column: string) => {
        setSortColumn(column);
        setSortOrder(sortColumn === column ? (sortOrder === "asc" ? "desc" : "asc") : "asc");
    };

    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }

    const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

    return (
        <div className="w-full overflow-hidden rounded-xl shadow-lg p-3 sm:p-4 bg-gray-900 transition-all duration-300">
            {filteredRows.length === 0 ? (
                <div className="text-center text-gray-400 py-4 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs sm:text-sm">
                    <span>No hay datos que coincidan con la búsqueda.</span>
                    <Mini />
                </div>
            ) : (
                <>
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full border-collapse bg-gray-900 text-gray-300 text-center">
                            <thead>
                                <tr className="bg-gray-900 text-sm">
                                    {columns.map((column) => (
                                        <th key={`input-${String(column)}`} className="px-2 py-1">
                                            <input
                                                type="text"
                                                value={columnSearchTerms[column] ?? ""}
                                                onChange={(e) => {
                                                    setColumnSearchTerms((prev) => ({
                                                        ...prev,
                                                        [column]: e.target.value,
                                                    }));
                                                    setCurrentPage(1);
                                                }}
                                                className="w-full px-2 py-1 text-sm text-gray-200 bg-gray-800 border border-gray-600 rounded-md 
                                                focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                                placeholder="Buscar..."
                                            />
                                        </th>
                                    ))}
                                    <th />
                                </tr>
                                <tr className="bg-gradient-to-r from-gray-800 to-gray-700 text-sm">
                                    {columns.map((column) => (
                                        <Header
                                            key={String(column)}
                                            column={String(column)}
                                            label={columnLabels[column] ?? String(column)}
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
                                    <tr
                                        key={index}
                                        className="border-b border-gray-700 text-sm odd:bg-gray-800 even:bg-gray-850 hover:bg-gray-700 transition-all duration-300"
                                    >
                                        {columns.map((column) => {
                                            const value = row[column];
                                            if (booleanColumns.includes(String(column) as BooleanColumns)) {
                                                return (
                                                    <td key={String(column)} className="px-4 py-2 text-gray-300">
                                                        <span
                                                            className={`inline-flex items-center px-3 py-1 rounded-full text-white ${value === true || value === 1
                                                                ? "bg-green-600"
                                                                : "bg-red-600"
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
                                                    <td key={String(column)} className="px-4 py-2 text-gray-300">
                                                        {value !== null && value !== undefined ? String(value) : ""}
                                                    </td>
                                                );
                                            }
                                        })}
                                        <td className="px-6 py-3 flex justify-center gap-3">
                                            {showEditButton && onEdit && (
                                                <Button onClick={() => onEdit(row.id)} variant="edit" />
                                            )}
                                            {showDeleteButton && onDelete && (
                                                <Button onClick={() => onDelete(row.id)} variant="delete" />
                                            )}
                                            {showTerciarioButton && onTerciario && (!showTerciarioCondition || showTerciarioCondition(row)) && (
                                                <Button onClick={() => onTerciario(row.id)} variant="create2" />
                                            )}
                                            {showHistory && onHistory && (
                                                <Button onClick={() => onHistory(row.id)} variant="history" />
                                            )}
                                            {showPDF && onPDF && (!showPDFCondition || showPDFCondition(row)) && (
                                                <Button onClick={() => onPDF(row.id)} variant="pdf" />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile version */}
                    <div className="md:hidden space-y-4">
                        {paginatedRows.map((row, index) => (
                            <div
                                key={index}
                                className="bg-gray-800 p-4 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg"
                            >
                                {columns.map((column) => (
                                    <div
                                        key={String(column)}
                                        className="flex justify-between py-1 border-b border-gray-700 last:border-none"
                                    >
                                        <span className="font-semibold text-gray-400">
                                            {columnLabels[column] ?? String(column)}:
                                        </span>
                                        <span className="text-gray-300">
                                            {row[column] !== null && row[column] !== undefined ? String(row[column]) : ""}
                                        </span>
                                    </div>
                                ))}
                                <div className="flex justify-end gap-3 mt-3">
                                    {showEditButton && onEdit && (
                                        <Button onClick={() => onEdit(row.id)} variant="edit" />
                                    )}
                                    {showDeleteButton && onDelete && (
                                        <Button onClick={() => onDelete(row.id)} variant="delete" />
                                    )}
                                    {showTerciarioButton && onTerciario && (
                                        <Button onClick={() => onTerciario(row.id)} variant="create2" />
                                    )}
                                    {showHistory && onHistory && (
                                        <Button onClick={() => onHistory(row.id)} variant="history" />
                                    )}
                                    {showPDF && onHistory && (
                                        <Button onClick={() => onHistory(row.id)} variant="pdf" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="relative flex items-center w-full mt-4">
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

                        <div className="ml-auto flex gap-x-1">
                            {pages.map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-2 py-1 text-sm rounded-md transition-all duration-200 ease-out 
                                        hover:scale-105 ${page === currentPage
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
}

export default Table;
