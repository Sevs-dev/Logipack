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

  const handleSelect = useCallback((id: string) => {
    setSelectedMaestra((prev) => (prev === id ? null : id));
  }, [setSelectedMaestra]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      if (selectedMaestra && !maestraMap.has(selectedMaestra)) {
        console.warn(`MaestrasSelect: Selected maestra with ID ${selectedMaestra} not found`);
      }
    }
  }, [selectedMaestra, maestraMap]);

  const disponibles = maestras.filter((m) => m.id.toString() !== selectedMaestra);

  return (
    <div className="mb-6">
      <Text type="subtitle" color="text-[#000]" >{label}</Text>

      {maestras.length === 0 ? (
        <div className="p-4 bg-yellow-50 border border-yellow-300 rounded">
          <Text type="alert">{noMaestraMessage}</Text>
        </div>
      ) : (
        <div className="flex gap-6 flex-col md:flex-row">
          {/* Lista de disponibles */}
          <div className="flex-1">
            <Text type="subtitle" color="text-[#000]" >Disponibles:</Text>
            <ul className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-64 overflow-y-auto">
              {disponibles.map((maestra) => (
                <li key={maestra.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(maestra.id.toString())}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:outline-none focus:bg-blue-100 transition-all duration-200 ease-in-out transform hover:scale-[1.02]"
                  >
                    {maestra.descripcion}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Lista seleccionada */}
          <div className="flex-1 mt-4 md:mt-0">
            <Text type="subtitle" color="text-[#000]" >Seleccionada:</Text>
            <ul className="border border-blue-200 rounded-lg divide-y divide-blue-200 max-h-64 overflow-y-auto">
              {selectedMaestra ? (
                maestraMap.has(selectedMaestra) ? (
                  <li>
                    <button
                      type="button"
                      onClick={() => handleSelect(selectedMaestra)}
                      className="w-full text-left px-4 py-2 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:bg-blue-300 transition-all duration-200 ease-in-out transform hover:scale-[1.02]"
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
                <li className="px-4 py-2 text-gray-500 italic">Ninguna seleccionada</li>
              )}
            </ul>
          </div >
        </div >
      )}
    </div >
  );
};

export default React.memo(MaestrasSelect);
