import React from "react";
import Text from "../text/Text";
import { getStageId } from "../../services/maestras/stageServices";
import { getStageById as lisTipoacondicionamientoId } from "@/app/services/maestras/TipoAcondicionamientoService";
import { AuditHistoryProps } from "../../interfaces/Audit";

const stageCache: Record<number, string> = {};
const acondCache: Record<number, string> = {};

const translateAction = (action: string): string => {
    const translations: Record<string, string> = {
        create: "Creado",
        update: "Actualizado",
        delete: "Eliminado",
    };
    return translations[action.toLowerCase()] || capitalize(action);
};

const customOrder = [
    "description", "descripcion", "type_product", "type_stage", "type_acondicionamiento",
    "repeat", "repeat_minutes", "can_pause", "multi", "alert", "paralelo", "requiere_bom",
    "version", "config", "binding", "aprobado", "has_time", "phase_type", "activities",
    "duration", "duration_user", "user",
];

const translateKey = (key: string): string => {
    const map: Record<string, string> = {
        user: "Usuario", config: "Configuración", binding: "Obligatorio", version: "Versión",
        duration: "Duración (min)", has_time: "Tiene tiempo", description: "Descripción",
        descripcion: "Descripción", status: "Estado", repeat: "Repetir",
        can_pause: "¿Se puede pausar?", phase_type: "Tipo de Fases", activities: "Actividades",
        duration_user: "Duración indicada Usuario (min)", alert: "Alerta", multi: "Multiarticulo",
        repeat_line: "Repetir Línea", repeat_minutes: "Repetir Cada (Min)", type_product: "Tipo de Producto",
        requiere_bom: "Requiere BOM", type_stage: "Fases", type_acondicionamiento: "Tipo de Acondicionamiento",
        base_quantity: "Cantidad Base", ingredients: "Ingredientes", code_ingredients: "Codart",
    };
    return map[key.toLowerCase()] || capitalize(key);
};

const capitalize = (text: string): string =>
    text.charAt(0).toUpperCase() + text.slice(1);

const AuditHistory: React.FC<AuditHistoryProps> = ({ audit }) => {
    const newValues = audit?.new_values || {};

    const [stageNames, setStageNames] = React.useState<Record<number, string>>({});
    const [acondNames, setAcondNames] = React.useState<Record<number, string>>({});

    React.useEffect(() => {
        if (!audit) return;

        const idsStage = audit.new_values?.type_stage;
        const idsAcond = audit.new_values?.type_acondicionamiento;

        const fetchStageNames = async () => {
            if (Array.isArray(idsStage)) {
                const nameMap: Record<number, string> = {};
                const fetches = idsStage.map(async (id) => {
                    if (stageCache[id]) {
                        nameMap[id] = stageCache[id];
                    } else {
                        try {
                            const res = await getStageId(id);
                            const name = res?.description || `Fase #${id}`;
                            stageCache[id] = name;
                            nameMap[id] = name;
                        } catch {
                            nameMap[id] = `Fase #${id}`;
                        }
                    }
                });
                await Promise.all(fetches);
                setStageNames(nameMap);
            }
        };

        const fetchAcondNames = async () => {
            if (Array.isArray(idsAcond)) {
                const nameMap: Record<number, string> = {};
                const fetches = idsAcond.map(async (id) => {
                    if (acondCache[id]) {
                        nameMap[id] = acondCache[id];
                    } else {
                        try {
                            const res = await lisTipoacondicionamientoId(id);
                            const name = res?.description || `Acond. #${id}`;
                            acondCache[id] = name;
                            nameMap[id] = name;
                        } catch {
                            nameMap[id] = `Acond. #${id}`;
                        }
                    }
                });
                await Promise.all(fetches);
                setAcondNames(nameMap);
            }
        };

        fetchStageNames();
        fetchAcondNames();
    }, [audit]);

    const renderValue = (value: unknown, key?: string): string => {
        if (value === null) return "N/A";

        if (key === "activities" && Array.isArray(value)) {
            const descriptions = value
                .map((item) =>
                    typeof item === "object" && item !== null && "description" in item
                        ? `• ${(item as Record<string, unknown>).description}`
                        : null
                )
                .filter(Boolean)
                .join("\n");
            return descriptions || "Sin actividades";
        }

        if (key === "type_stage" && Array.isArray(value)) {
            return value.map((id) => stageNames[id as number] || `ID: ${id}`).join(", ") || "Sin fases";
        }

        if (key === "type_acondicionamiento" && Array.isArray(value)) {
            return value.map((id) => acondNames[id as number] || `ID: ${id}`).join(", ") || "Sin tipos";
        }

        if (typeof value === "boolean") return value ? "Activo" : "Desactivado";
        if (typeof value === "number") {
            if (value === 1) return "Activo";
            if (value === 0) return "Desactivado";
            return value.toString();
        }
        if (typeof value === "string") return value;
        if (typeof value === "object") {
            try {
                return JSON.stringify(value);
            } catch {
                return "Valor no serializable";
            }
        }

        return "Desconocido";
    };

    if (!audit) return null;

    return (
        <div className="rounded-lg max-h-[70vh]">
            <Text type="title" color="text-[#fff]">Detalle de Historia</Text>

            <div className="space-y-2 text-sm">
                <p><span className="font-semibold text-white">Usuario: </span><span className="text-white">{audit.user}</span></p>
                <p><span className="font-semibold text-white">Acción: </span><span className="text-white">{translateAction(audit.action)}</span></p>
                <p><span className="font-semibold text-white">Fecha: </span><span className="text-white">{new Date(audit.created_at).toLocaleString()}</span></p>
            </div>

            <Text type="subtitle" color="text-[#000]">Cambios</Text>

            <div className="text-sm overflow-y-auto mt-2 flex-grow max-h-[40vh] pr-4 custom-scroll">
                {Object.keys(newValues).length > 0 ? (
                    Object.entries(newValues)
                        .filter(([key]) => !["id", "created_at", "updated_at", "reference_id", "active", "status_type", "code_details"].includes(key))
                        .sort(([aKey], [bKey]) => {
                            const aIndex = customOrder.indexOf(aKey.toLowerCase());
                            const bIndex = customOrder.indexOf(bKey.toLowerCase());
                            return (aIndex === -1 ? Infinity : aIndex) - (bIndex === -1 ? Infinity : bIndex);
                        })
                        .map(([key, value]) => (
                            <div key={key} className="flex justify-between border-b border-gray-300 py-2">
                                <span className="text-white capitalize">{translateKey(key)}</span>
                                <span className="text-white font-mono whitespace-pre-line truncate max-w-[60%]">
                                    {renderValue(value, key)}
                                </span>
                            </div>
                        ))
                ) : (
                    <Text type="subtitle" color="text-[#fff]">No hay cambios registrados.</Text>
                )}
            </div>

            <style>{`
                .custom-scroll::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scroll::-webkit-scrollbar-track {
                    background: rgba(209, 213, 219, 0.15);
                }
                .custom-scroll::-webkit-scrollbar-thumb {
                    background-color: #fff;
                    border-radius: 4px;
                    border: 2px solid rgba(209, 213, 219, 0.2);
                }
                .custom-scroll::-webkit-scrollbar-thumb:hover {
                    background-color: #4b5563;
                }
                .custom-scroll {
                    scrollbar-width: thin;
                    scrollbar-color: #fff rgba(209, 213, 219, 0.15);
                }
            `}</style>
        </div>
    );
};

export default AuditHistory;
