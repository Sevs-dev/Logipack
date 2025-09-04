import React, { useMemo, useCallback, useEffect } from "react";
import Text from "../text/Text";

interface MaestraBase {
  id: string | number;
  descripcion: string;
}

interface MaestrasSelectProps<T extends MaestraBase> {
  maestras: T[];
  selectedMaestra: string | null;
  setSelectedMaestra: React.Dispatch<React.SetStateAction<string | null>>;
  label: string;
  noMaestraMessage?: string;
}

const MaestrasSelect = <T extends MaestraBase>({
  maestras,
  selectedMaestra,
  setSelectedMaestra,
  label,
  noMaestraMessage = "No hay maestras disponibles.",
}: MaestrasSelectProps<T>) => {
  const maestraMap = useMemo(() => {
    return new Map(maestras.map((m) => [m.id.toString(), m]));
  }, [maestras]);

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedMaestra((prev) => (prev === id ? null : id));
    },
    [setSelectedMaestra]
  );

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      if (selectedMaestra && !maestraMap.has(selectedMaestra)) {
        console.warn(
          `MaestrasSelect: Selected maestra with ID ${selectedMaestra} not found`
        );
      }
    }
  }, [selectedMaestra, maestraMap]);

  const disponibles = maestras.filter(
    (m) => m.id.toString() !== selectedMaestra
  );

  return (
    <div className="mb-6 dark:[--surface:30_41_59] dark:[--surface-muted:51_65_85] dark:[--border:71_85_105] dark:[--foreground:241_245_249] dark:[--ring:56_189_248] dark:[--accent:56_189_248]">
      <Text type="subtitle" color="text-[rgb(var(--foreground))]">
        {label}
      </Text>

      {maestras.length === 0 ? (
        <div className="p-4 rounded border bg-[rgb(var(--accent))]/10 border-[rgb(var(--accent))]/40 dark:bg-slate-800/70 dark:border-slate-700">
          <Text type="alert">{noMaestraMessage}</Text>
        </div>
      ) : (
        <div className="flex gap-6 flex-col md:flex-row">
          {/* Lista de disponibles */}
          <div className="flex-1">
            <Text type="subtitle" color="text-[rgb(var(--foreground))]">
              Disponibles:
            </Text>
            <ul
              className="max-h-64 overflow-y-auto rounded-lg border divide-y
                     bg-[rgb(var(--surface))] text-[rgb(var(--foreground))]
                     border-[rgb(var(--border))] divide-[rgb(var(--border))]
                     dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:divide-slate-700"
              role="listbox"
              aria-label="Maestras disponibles"
            >
              {disponibles.map((maestra) => (
                <li key={maestra.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(maestra.id.toString())}
                    className="w-full text-left px-4 py-2 transition-all duration-150
                           hover:bg-[rgb(var(--surface-muted))] focus:outline-none
                           focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]
                           focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--surface))]"
                  >
                    {maestra.descripcion}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Lista seleccionada */}
          <div className="flex-1 mt-4 md:mt-0">
            <Text type="subtitle" color="text-[rgb(var(--foreground))]">
              Seleccionada:
            </Text>
            <ul
              className="max-h-64 overflow-y-auto rounded-lg border divide-y
                     bg-[rgb(var(--surface))] text-[rgb(var(--foreground))]
                     border-[rgb(var(--accent))]/40 divide-[rgb(var(--border))]
                     dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:divide-slate-700"
              aria-live="polite"
            >
              {selectedMaestra ? (
                maestraMap.has(selectedMaestra) ? (
                  <li>
                    <button
                      type="button"
                      onClick={() => handleSelect(selectedMaestra)}
                      className="w-full text-left px-4 py-2 transition-all duration-150
                             bg-[rgb(var(--accent))]/15 hover:bg-[rgb(var(--accent))]/25
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]
                             focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--surface))]"
                    >
                      {maestraMap.get(selectedMaestra)!.descripcion}
                    </button>
                  </li>
                ) : (
                  <li className="px-4 py-2 text-red-500 italic">
                    ID inválido: {selectedMaestra}
                  </li>
                )
              ) : (
                <li className="px-4 py-2 text-[rgb(var(--foreground))]/60 italic">
                  Ninguna seleccionada
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(MaestrasSelect);
