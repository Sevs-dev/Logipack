import React, { useState } from "react";

interface MultiSelectProps<T> {
  options: T[];
  selected: T[];
  onChange: (selected: T[]) => void;
  getLabel: (item: T) => string;
  getValue: (item: T) => string;
}

function MultiSelect<T>({
  options,
  selected,
  onChange,
  getLabel,
  getValue,
}: MultiSelectProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOptions = options.filter(
    (item) =>
      getLabel(item).toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selected.some((sel) => getValue(sel) === getValue(item))
  );

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    const selectedItem = options.find(
      (item) => getValue(item) === selectedValue
    );

    if (
      selectedItem &&
      !selected.some((item) => getValue(item) === selectedValue)
    ) {
      onChange([...selected, selectedItem]);
    }
  };

  const handleRemove = (value: string) => {
    onChange(selected.filter((item) => getValue(item) !== value));
  };

  return (
    <div className="w-full bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] border border-[rgb(var(--border))] rounded-lg shadow-md p-4 dark:[--surface:30_41_59] dark:[--surface-muted:51_65_85] dark:[--border:71_85_105] dark:[--foreground:241_245_249] dark:[--ring:56_189_248] dark:[--accent:56_189_248] dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Available Options */}
        <div className="space-y-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full px-4 py-2 rounded-lg border bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] border-[rgb(var(--border))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] placeholder:text-[rgb(var(--foreground))]/50 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--foreground))]/60"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <select
            multiple
            size={10}
            className="w-full px-3 py-2 rounded-lg border overflow-y-auto max-h-64 bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] border-[rgb(var(--border))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
            onChange={handleSelect}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((item) => (
                <option
                  key={getValue(item)}
                  value={getValue(item)}
                  className="bg-[rgb(var(--surface))] text-[rgb(var(--foreground))]"
                >
                  {getLabel(item)}
                </option>
              ))
            ) : (
              <option
                disabled
                className="text-center bg-[rgb(var(--surface))] text-[rgb(var(--foreground))]/60"
              >
                No hay resultados
              </option>
            )}
          </select>
        </div>

        {/* Selected Options */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-[rgb(var(--foreground))] ml-6">
              Seleccionados
            </h3>
            <button
              className="text-sm text-[rgb(var(--accent))] hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] rounded-lg px-3 py-1 transition-all duration-200 border border-[rgb(var(--accent))]/60 hover:border-[rgb(var(--accent))] shadow-sm hover:shadow-md font-medium"
              onClick={() => onChange([])}
            >
              Limpiar todos
            </button>
          </div>

          <div className="border border-[rgb(var(--border))] rounded-lg p-2 max-h-64 overflow-y-auto dark:border-slate-700">
            {selected.length > 0 ? (
              selected.map((item) => (
                <div
                  key={getValue(item)}
                  className="flex justify-between items-center p-2 rounded transition-colors bg-[rgb(var(--surface))] hover:bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))]"
                >
                  <span className="truncate">{getLabel(item)}</span>
                  <button
                    className="text-red-500 hover:text-white hover:bg-red-600 ml-4 focus:outline-none focus:ring-2 focus:ring-red-300 rounded-full p-1 transition-all duration-200 shadow-sm hover:shadow-md border border-transparent hover:border-red-700"
                    onClick={() => handleRemove(getValue(item))}
                    title="Quitar"
                  >
                    <svg
                      className="w-4 h-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))
            ) : (
              <p className="text-center text-[rgb(var(--foreground))]/60 py-4">
                No hay selecciones
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MultiSelect;
