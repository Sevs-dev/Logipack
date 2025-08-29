import React, { useState, useEffect } from "react";
import { FaArrowUp, FaArrowDown, FaSort } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../buttons/buttons";
import Mini from "../loader/MiniLoader";

type BooleanColumns = "binding" | "status" | "aprobado" | "paralelo" | "canEdit" | "canView";

type TableProps<T extends { id: number }> = {
  rows: T[];
  loading?: boolean;
  columns: (keyof T)[];
  columnLabels?: Partial<Record<keyof T, string>>;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onTerciario?: (id: number) => void;
  onRestablecer?: (id: number) => void;
  onControl?: (id: number) => void;
  onOrdenHija?: (id: number) => void;
  onHistory?: (id: number) => void;
  onPDF?: (id: number) => void;
  onView?: (id: number) => void;
  showDeleteButton?: boolean;
  showEditButton?: boolean;
  showTerciarioButton?: boolean;
  showRestablecerButton?: boolean;
  showControlButton?: boolean;
  showViewButton?: boolean;
  showHistory?: boolean;
  showPDF?: boolean;
  showTerciarioCondition?: (row: T) => boolean;
  showPDFCondition?: (row: T) => boolean;
  showViewCondition?: (row: T) => boolean;
  showOrdenHijaButton?: boolean;

  /** NUEVO: decide si el registro puede editarse (por defecto, true) */
  canEditRow?: (row: T) => boolean;
  /** NUEVO: condición para mostrar botón de Orden Hija además de showOrdenHijaButton (por defecto, sin condición extra) */
  showOrdenHijaCondition?: (row: T) => boolean;
};

function Table<T extends { id: number }>({
  rows,
  loading = false,
  columns,
  columnLabels = {},
  onEdit,
  onDelete,
  onTerciario,
  onRestablecer,
  onOrdenHija,
  onControl,
  onHistory,
  onPDF,
  onView,
  showTerciarioCondition,
  showOrdenHijaButton,
  showOrdenHijaCondition,
  showPDFCondition,
  showViewCondition,
  showDeleteButton = true,
  showEditButton = true,
  showTerciarioButton = true,
  showRestablecerButton = true,
  showControlButton = true,
  showHistory = true,
  showPDF = true,
  showViewButton = false,
  canEditRow,
}: TableProps<T>) {
  const [sortColumn, setSortColumn] = useState<keyof T>("id" as keyof T);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [columnSearchTerms, setColumnSearchTerms] = useState<
    Partial<Record<keyof T, string>>
  >({});
  const [currentPage, setCurrentPage] = useState(1);
  const [animateTable, setAnimateTable] = useState(false);

  const booleanColumns: BooleanColumns[] = [
    "binding",
    "status",
    "aprobado",
    "paralelo",
    "canEdit",
    "canView",
  ];
  const itemsPerPage = 10;
  const maxButtons = 4;

  const filteredRows = rows.filter((row) =>
    columns.every((column) => {
      const searchValue = (columnSearchTerms[column] ?? "").toLowerCase();
      const cellValue = String(row[column] ?? "").toLowerCase();
      return cellValue.includes(searchValue);
    })
  );

  const toPrimitive = (v: unknown): string | number => {
    if (v instanceof Date) return v.getTime();
    const t = typeof v;
    if (t === "number" || t === "bigint") return Number(v as number | bigint);
    if (t === "boolean") return (v as boolean) ? 1 : 0;
    if (v == null) return "";
    return String(v);
  };

  const sortedRows = [...filteredRows].sort((a, b) => {
    const valA = toPrimitive(a[sortColumn]);
    const valB = toPrimitive(b[sortColumn]);
    if (typeof valA === "number" && typeof valB === "number") {
      return sortOrder === "asc" ? valA - valB : valB - valA;
    }
    // comparador seguro para strings
    const sA = String(valA);
    const sB = String(valB);
    return sortOrder === "asc" ? sA.localeCompare(sB) : sB.localeCompare(sA);
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

  const handleSort = (column: keyof T) => {
    setSortColumn(column);
    setSortOrder((prev) =>
      sortColumn === column ? (prev === "asc" ? "desc" : "asc") : "asc"
    );
  };

  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  const endPage = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  const isFiltered = Object.values(columnSearchTerms).some(
    (value) => value && value.trim() !== ""
  );
  const pages = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  // Header tipado dentro para capturar T
  const Header = ({
    column,
    label,
    onSort,
    sortOrder,
    sortColumn,
  }: {
    column: keyof T;
    label: string;
    onSort: (column: keyof T) => void;
    sortOrder: "asc" | "desc";
    sortColumn: keyof T;
  }) => {
    const isActive = column === sortColumn;
    return (
      <th
        className={`px-6 py-3 text-center font-semibold text-gray-300 tracking-wide cursor-pointer transition-all border-r border-gray-700 last:border-r-0
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

  return (
    <div className="w-full overflow-hidden rounded-xl shadow-lg p-3 sm:p-4 bg-gray-900 transition-all duration-300">
      {isFiltered && (
        <div className="flex justify-end mb-2">
          <button
            onClick={() => {
              setColumnSearchTerms({});
              setAnimateTable(true);
              setTimeout(() => setAnimateTable(false), 400);
            }}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-500 transition"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={animateTable ? "anim" : "static"}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          className="hidden md:block overflow-x-auto"
        >
          <table className="w-full border-collapse bg-gray-900 text-gray-300 text-center">
            <thead>
              <tr className="bg-gray-900 text-sm">
                {columns.map((column) => (
                  <th
                    key={`input-${String(column)}`}
                    className="px-2 py-1 border-r border-gray-700 last:border-r-0"
                  >
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
                    column={column}
                    label={columnLabels[column] ?? String(column)}
                    onSort={handleSort}
                    sortColumn={sortColumn}
                    sortOrder={sortOrder}
                  />
                ))}
                <th className="px-6 py-3 text-center font-semibold text-gray-300 border-r border-gray-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="py-8 text-center text-gray-400 px-4 border-r border-gray-700"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <span>Cargando...</span>
                        <Mini />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span>No hay datos que coincidan con la búsqueda.</span>
                        <Mini />
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-700 text-sm odd:bg-gray-800 even:bg-gray-850 hover:bg-gray-700 transition-all duration-300">
                    {columns.map((column) => {
                      const value = row[column];
                      if (
                        booleanColumns.includes(
                          String(column) as BooleanColumns
                        )
                      ) {
                        const isActive =
                          (value as unknown) === true || (value as unknown) === 1;
                        return (
                          <td
                            key={String(column)}
                            className="px-4 py-2 text-gray-300 border-r border-gray-700 last:border-r-0"
                          >
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-white ${
                                isActive ? "bg-green-600" : "bg-red-600"
                              }`}
                            >
                              {isActive && (
                                <span className="mr-2 w-2 h-2 bg-white rounded-full animate-pulse"></span>
                              )}
                              {isActive ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                        );
                      } else {
                        return (
                          <td
                            key={String(column)}
                            className="px-4 py-2 text-gray-300 border-r border-gray-700 last:border-r-0"
                          >
                            {value !== null && value !== undefined
                              ? String(value)
                              : ""}
                          </td>
                        );
                      }
                    })}
                    <td className="px-6 py-3 flex justify-center gap-3 border-r border-gray-700 last:border-r-0">
                      {showEditButton &&
                        onEdit &&
                        (!canEditRow || canEditRow(row)) && (
                          <Button onClick={() => onEdit(row.id)} variant="edit" />
                        )}

                      {showDeleteButton && onDelete && (
                        <Button
                          onClick={() => onDelete(row.id)}
                          variant="delete"
                        />
                      )}

                      {showTerciarioButton &&
                        onTerciario &&
                        (!showTerciarioCondition ||
                          showTerciarioCondition(row)) && (
                          <Button
                            onClick={() => onTerciario(row.id)}
                            variant="create2"
                          />
                        )}

                      {showRestablecerButton && onRestablecer && (
                        <Button
                          onClick={() => onRestablecer(row.id)}
                          variant="restablecer"
                        />
                      )}

                      {showControlButton && onControl && (
                        <Button
                          onClick={() => onControl(row.id)}
                          variant="control"
                        />
                      )}

                      {showViewButton &&
                        onView &&
                        (!showViewCondition || showViewCondition(row)) && (
                          <Button
                            onClick={() => onView(row.id)}
                            variant="view"
                          />
                        )}

                      {showPDF &&
                        onPDF &&
                        (!showPDFCondition || showPDFCondition(row)) && (
                          <Button onClick={() => onPDF(row.id)} variant="pdf" />
                        )}

                      {showHistory && onHistory && (
                        <Button
                          onClick={() => onHistory(row.id)}
                          variant="history"
                        />
                      )}

                      {showOrdenHijaButton &&
                        onOrdenHija &&
                        (!showOrdenHijaCondition ||
                          showOrdenHijaCondition(row)) && (
                          <Button
                            onClick={() => onOrdenHija(row.id)}
                            variant="control"
                          />
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </motion.div>
      </AnimatePresence>

      {/* Vista en formato tarjetas para pantallas pequeñas */}
      <div className="md:hidden space-y-4 mt-4">
        {paginatedRows.map((row, index) => (
          <div
            key={index}
            className="bg-gray-800 p-4 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg"
          >
            {columns.map((column) => {
              const colKey = String(column);
              const value = row[column];
              return (
                <div
                  key={colKey}
                  className="flex justify-between items-center py-1 border-b border-gray-700 last:border-none"
                >
                  <span className="font-semibold text-gray-400 text-sm">
                    {columnLabels[column] ?? colKey}
                  </span>
                  <span className="text-gray-300 text-sm text-right max-w-[60%] truncate">
                    {value != null ? String(value) : ""}
                  </span>
                </div>
              );
            })}

            <div className="flex justify-end flex-wrap gap-2 mt-3">
              {showEditButton && onEdit && (!canEditRow || canEditRow(row)) && (
                <Button onClick={() => onEdit(row.id)} variant="edit" />
              )}
              {showDeleteButton && onDelete && (
                <Button onClick={() => onDelete(row.id)} variant="delete" />
              )}
              {showTerciarioButton &&
                onTerciario &&
                (!showTerciarioCondition || showTerciarioCondition(row)) && (
                  <Button
                    onClick={() => onTerciario(row.id)}
                    variant="create2"
                  />
                )}
              {showControlButton && onControl && (
                <Button onClick={() => onControl(row.id)} variant="control" />
              )}
              {showViewButton &&
                onView &&
                (!showViewCondition || showViewCondition(row)) && (
                  <Button onClick={() => onView(row.id)} variant="view" />
                )}
              {showPDF &&
                onPDF &&
                (!showPDFCondition || showPDFCondition(row)) && (
                  <Button onClick={() => onPDF(row.id)} variant="pdf" />
                )}
              {showHistory && onHistory && (
                <Button onClick={() => onHistory(row.id)} variant="history" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Paginación */}
      {filteredRows.length > 0 && (
        <div className="relative flex items-center w-full mt-4">
          <div className="absolute left-1/2 transform -translate-x-1/2 flex gap-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
            >
              ‹
            </button>

            <span className="px-2 py-1 text-sm font-medium bg-gray-800 text-gray-300 rounded-md">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-2 py-1 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
            >
              ›
            </button>
          </div>

          <div className="ml-auto flex gap-x-1">
            {pages.map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-2 py-1 text-sm rounded-md transition-all duration-200 ease-out hover:scale-105 ${
                  page === currentPage
                    ? "bg-blue-600 text-white scale-105"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;
