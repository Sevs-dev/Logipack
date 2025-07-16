"use client";
import React, { useState, useEffect } from "react";
import { createActivitie, deleteActivitie, getActivitie, getActivitieId, updateActivitie } from "../../services/maestras/activityServices";
import { getAuditsByModel } from "../../services/history/historyAuditServices";
import { showError, showSuccess, showConfirm } from "../toastr/Toaster";
import Button from "../buttons/buttons";
import Table from "../table/Table";
import { InfoPopover } from "../buttons/InfoPopover";
import { ActivityType, Activities } from "../../interfaces/NewActivity";
import Text from "../text/Text";
import { Clock } from "lucide-react";
import { CreateClientProps } from "../../interfaces/CreateClientProps";
import ModalSection from "../modal/ModalSection";
import AuditModal from "../history/AuditModal";
import { Audit } from "../../interfaces/Audit";
import OptionsManager from "../inputs/OptionsManager";

export default function NewActivity({ canEdit = false, canView = false }: CreateClientProps) {
    const activityTypes: Record<string, ActivityType> = {
        "Texto corto": { type: "text" },
        "Texto largo": { type: "textarea" },
        Adjunto: { type: "file" },
        Foto: { type: "image" },
        "Lista desplegable": { type: "select", options: ["Opción 1", "Opción 2"] },
        "Selección única": { type: "radio", options: [""] },
        "Selección múltiple": { type: "checkbox", options: ["Opción A", "Opción B"] },
        Firma: { type: "signature" },
        Informativo: { type: "text", placeholder: "Escribe aquí..." },
        "Rangos": {
            type: "temperature",
            min: undefined,
            max: undefined
        },

        Muestreo: {
            type: "muestreo",
            items: [
                { min: undefined, max: undefined, valor: undefined },
            ]
        }
    };
    const [modalOpen, setModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedType, setSelectedType] = useState("Texto corto");
    const [formData, setFormData] = useState({
        description: "",
        config: JSON.stringify(activityTypes["Texto corto"], null, 2),
        binding: false,
        has_time: false,
        duration: 0,
    });

    const [activities, setActivities] = useState<Activities[]>([]);
    const [options, setOptions] = useState<string[]>([]);
    const [parsedConfig, setParsedConfig] = useState<ActivityType | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const INPUT_TYPES_WITH_OPTIONS = ["select", "radio", "checkbox"];
    const getDefaultConfig = (type: string) =>
        JSON.stringify(activityTypes[type] || activityTypes["Texto corto"], null, 2);
    const [auditList, setAuditList] = useState<Audit[]>([]);
    const [, setSelectedAudit] = useState<Audit | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // ────────────────────────────── HELPERS ──────────────────────────────

    const resetModalData = () => {
        setFormData({
            description: "",
            config: getDefaultConfig("Texto corto"),
            binding: false,
            has_time: false,
            duration: 0,
        });
        setSelectedType("Texto corto");
        setOptions([]);
        setEditingId(null);
        setIsEditing(false);
    };

    const updateOptionsIfNeeded = (type: string, currentOptions: string[] = []) =>
        INPUT_TYPES_WITH_OPTIONS.includes(type) ? currentOptions : [];

    const validateForm = (): boolean => {
        if (!formData.description.trim()) {
            showError("La descripción es obligatoria");
            return false;
        }
        if (INPUT_TYPES_WITH_OPTIONS.includes(parsedConfig?.type || "") && options.length === 0) {
            showError("Debes agregar al menos una opción");
            return false;
        }
        return true;
    };

    // ────────────────────────────── EFFECTS ──────────────────────────────

    useEffect(() => {
        if (canView) fetchActivities();
    }, [canView]);

    useEffect(() => {
        try {
            setParsedConfig(JSON.parse(formData.config));
        } catch {
            setParsedConfig(null);
        }
    }, [formData.config]);

    // ────────────────────────────── API ──────────────────────────────

    const fetchActivities = async () => {
        try {
            const data = await getActivitie();
            setActivities(data);
        } catch {
            // handle error
        }
    };

    const getSerializedConfig = (): string => {
        try {
            const parsed = JSON.parse(formData.config);
            const finalConfig = {
                ...parsed,
                options: INPUT_TYPES_WITH_OPTIONS.includes(parsed.type) ? options : undefined,
            };
            return JSON.stringify(finalConfig, null, 2);
        } catch {
            showError("Error al generar la configuración de la actividad.");
            return formData.config; // fallback en caso de error
        }
    };

    const handleSubmit = async () => {
        if (isSaving) return;
        if (!validateForm()) return;
        setIsSaving(true);

        const config = getSerializedConfig();
        const payload = {
            description: formData.description,
            config,
            binding: formData.binding,
            has_time: formData.has_time,
            duration: formData.duration,
        };

        try {
            if (isEditing && editingId !== null) {
                await updateActivitie(editingId, payload);
                showSuccess("Actividad actualizada correctamente");
            } else {
                await createActivitie(payload);
                showSuccess("Actividad creada exitosamente");
            }

            setModalOpen(false);
            fetchActivities();
            resetModalData();
        } catch {
            showError(isEditing ? "Error al actualizar actividad" : "Error al crear la actividad");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!canEdit) return;
        showConfirm("¿Seguro que quieres eliminar esta Actividad?", async () => {
            try {
                await deleteActivitie(id);
                setActivities((prev) => prev.filter((a) => a.id !== id));
                showSuccess("Actividad eliminada con éxito");
            } catch {
                showError("Error al eliminar Actividad");
            }
        });
    };

    // ────────────────────────────── INPUT HANDLERS ──────────────────────────────

    const handleTypeChange = (type: string) => {
        setSelectedType(type);
        const selected = activityTypes[type] || activityTypes["Texto corto"];
        const updatedConfig = JSON.stringify(selected, null, 2);
        setFormData({ ...formData, config: updatedConfig });
        if (selected.type) {
            setOptions(updateOptionsIfNeeded(selected.type, selected.options));
        }
    };

    // ────────────────────────────── EDICIÓN ──────────────────────────────

    const handleEdit = async (id: number) => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const data = await getActivitieId(id);
            const parsed = typeof data.config === "string" ? JSON.parse(data.config) : data.config;
            const activityType = Object.keys(activityTypes).find((key) => {
                const def = activityTypes[key];

                if (def.type !== parsed.type) return false;
                if (def.type === "temperature") return true;
                if (def.type === "muestreo") return true;
                if (parsed.type === "text" && parsed.min && parsed.max) return key === "Rangos";
                if (parsed.type === "text" && parsed.min && parsed.max && parsed.valor) return key === "Muestreo";
                return JSON.stringify(def) === JSON.stringify(parsed);
            }) || "Texto corto";
            setEditingId(data.id);
            setFormData({
                description: data.description,
                config: JSON.stringify(parsed, null, 2),
                binding: data.binding === 1,
                has_time: data.has_time,
                duration: data.duration,
            });
            setSelectedType(activityType);
            setOptions(parsed.options || []);
            setIsEditing(true);
            setModalOpen(true);
        } catch {
            showError("Error obteniendo datos de la actividad");
        } finally {
            setIsSaving(false);
        }
    };

    const getFormattedDuration = (raw: number): string => {
        const minutes = Math.floor(raw);
        const seconds = Math.round((raw % 1) * 100); // <-- parte decimal como "segundos"
        const totalSeconds = minutes * 60 + seconds;
        if (totalSeconds < 60) return `${totalSeconds} seg`;
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        const parts: string[] = [];
        const pushPart = (value: number, singular: string, plural: string = singular + 's') => {
            if (value > 0) parts.push(`${value} ${value === 1 ? singular : plural}`);
        };
        pushPart(days, 'día');
        pushPart(hours, 'hora');
        pushPart(mins, 'min', 'min');
        const shouldShowSeconds = totalSeconds < 3600 && secs > 0 && days === 0 && hours === 0;
        if (shouldShowSeconds) {
            pushPart(secs, 'seg', 'seg');
        }
        return parts.join(' ');
    };

    // ────────────────────────────── MODAL ──────────────────────────────

    const handleModalClose = () => {
        setModalOpen(false);
        resetModalData();
    };

    const handleHistory = async (id: number) => {
        const model = "Activitie";
        try {
            const data = await getAuditsByModel(model, id);
            setAuditList(data);
            if (data.length > 0) setSelectedAudit(data[0]); // opción: mostrar la primera al abrir
        } catch {
            console.error("Error al obtener la auditoría:");
        }
    };

    return (
        <div>
            {/* Botón para abrir el modal de creación */}
            {canEdit && (
                <div className="flex justify-center space-x-2 mb-2">
                    <Button onClick={() => { resetModalData(); setModalOpen(true); }} variant="create" label="Crear Actividad" />
                </div>
            )}

            {/* Modal unificado para crear/editar */}
            {modalOpen && (
                <ModalSection isVisible={modalOpen} onClose={handleModalClose}>
                    <div className="text-center">
                        <Text type="title" color="text-[#000]">{isEditing ? "Editar Actividad" : "Crear Actividad"}</Text>
                    </div>
                    {/* Campo de descripción */}
                    <div>
                        <Text type="subtitle" color="#000">Descripción</Text>
                        <input
                            type="text"
                            name="description"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            className="w-full border p-2 rounded-md text-black mb-4 text-center"
                            disabled={!canEdit && !isEditing}
                        />
                    </div>

                    {/* Selector de tipo de actividad */}
                    <div>
                        <Text type="subtitle" color="#000">Tipo de Actividad</Text>
                        <select
                            value={selectedType}
                            onChange={(e) => handleTypeChange(e.target.value)}
                            className="w-full border p-2 rounded-md text-black mb-4 text-center"
                            disabled={!canEdit && !isEditing}
                        >
                            {Object.keys(activityTypes).map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Opciones dinámicas */}
                    {parsedConfig &&
                        ["select", "radio", "checkbox"].includes(parsedConfig.type || "") && (
                            <div className="mb-4">
                                <h3 className="font-medium mb-2">Opciones:</h3>
                                <OptionsManager options={options} onChange={setOptions} />
                            </div>
                        )
                    }

                    {/* Contenedor para los tres elementos en fila */}
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-6">
                        {/* Requerido */}
                        <div className="flex items-center gap-2">
                            <label htmlFor="binding" className="text-sm text-black">Requerido</label>
                            <input
                                id="binding"
                                type="checkbox"
                                checked={formData.binding}
                                onChange={(e) => setFormData({ ...formData, binding: e.target.checked })}
                                className="h-5 w-5 text-blue-500 rounded-md focus:ring-2 focus:ring-blue-500"
                                disabled={!canEdit && !isEditing}
                            />
                        </div>

                        {/* Medir Tiempo */}
                        <div className="flex items-center gap-2">
                            <label htmlFor="has_time" className="text-sm text-black">Medir Tiempo</label>
                            <input
                                id="has_time"
                                type="checkbox"
                                checked={formData.has_time}
                                onChange={(e) => setFormData({ ...formData, has_time: e.target.checked })}
                                className="h-5 w-5 text-blue-500 rounded-md focus:ring-2 focus:ring-blue-500"
                                disabled={!canEdit && !isEditing}
                            />
                        </div>

                        {/* Duración */}
                        {formData.has_time && (
                            <div className="flex items-center gap-2">
                                <label htmlFor="duration" className="text-sm text-black flex items-center gap-1">
                                    Duración
                                    <InfoPopover
                                        content={
                                            <>
                                                Para establecer segundos en la duración, separa los minutos con una <strong>coma (,)</strong>.<br />
                                                Ejemplo: <code>1,25 ó ,12</code> representa 1 minuto y 25 segundos ó 12 segundos.
                                            </>
                                        }
                                    />
                                </label>
                                <div className="relative flex items-center">
                                    <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                    <input
                                        id="duration"
                                        type="number"
                                        name="duration"
                                        min={0}
                                        value={formData.duration || ""}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setFormData({
                                                ...formData,
                                                duration: isNaN(val) ? 0 : Math.max(0, val),
                                            });
                                        }}
                                        placeholder="Minutos"
                                        className="w-[140px] border p-2 pl-9 rounded-md text-black focus:ring-2 focus:ring-blue-500"
                                        disabled={!canEdit && !isEditing}
                                    />
                                </div>
                                <span className="border border-gray-300 rounded-lg py-1.5 px-3 text-gray-800 bg-gray-50 text-sm h-[40px] flex items-center">
                                    ({getFormattedDuration(Number(formData.duration))})
                                </span>
                            </div>
                        )}

                        {/* Rango de temperatura */}
                        {selectedType === "Rangos" && (
                            <div className="flex items-center gap-2">
                                <label htmlFor="duration" className="text-sm text-black flex items-center gap-1">
                                    Rangos de la temperatura a medir
                                    <InfoPopover
                                        content={
                                            <>
                                                Establece un rango numerico permitido para esta actividad.<br />
                                                Puedes usar decimales (por ejemplo: <code>36.5</code>).<br />
                                                El valor mínimo debe ser menor que el máximo.
                                            </>
                                        }
                                    />
                                </label>

                                <input
                                    type="number"
                                    step="0.1"
                                    value={parsedConfig?.min ?? ""}
                                    onChange={(e) => {
                                        const updatedConfig = { ...parsedConfig, min: parseFloat(e.target.value) };
                                        setFormData({ ...formData, config: JSON.stringify(updatedConfig, null, 2) });
                                    }}
                                    placeholder="Mín °C"
                                    className="w-[100px] border p-2 rounded-md text-black text-center"
                                />
                                <input
                                    type="number"
                                    step="0.1"
                                    value={parsedConfig?.max ?? ""}
                                    onChange={(e) => {
                                        const updatedConfig = { ...parsedConfig, max: parseFloat(e.target.value) };
                                        setFormData({ ...formData, config: JSON.stringify(updatedConfig, null, 2) });
                                    }}
                                    placeholder="Máx °C"
                                    className="w-[100px] border p-2 rounded-md text-black text-center"
                                />
                            </div>
                        )}

                        {selectedType === "Muestreo" && (
                            <div className="flex flex-col gap-4">
                                <label className="text-sm font-medium text-black">
                                    Rangos de muestreo con valor
                                    <InfoPopover
                                        content={
                                            <>
                                                Puedes agregar varios rangos definidos por <code>min</code>, <code>max</code> y su <code>valor</code> correspondiente.<br />
                                                Útil para medir múltiples puntos o escenarios.
                                            </>
                                        }
                                    />
                                </label>

                                {(parsedConfig?.items || []).map((item, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={item.min ?? ""}
                                            onChange={(e) => {
                                                const items = [...(parsedConfig?.items ?? [])];
                                                items[index].min = parseFloat(e.target.value);
                                                setFormData({ ...formData, config: JSON.stringify({ ...parsedConfig, items }, null, 2) });
                                            }}
                                            placeholder="Min"
                                            className="w-[80px] border p-2 rounded-md text-black text-center"
                                        />
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={item.max ?? ""}
                                            onChange={(e) => {
                                                const items = [...(parsedConfig?.items ?? [])];
                                                items[index].max = parseFloat(e.target.value);
                                                setFormData({ ...formData, config: JSON.stringify({ ...parsedConfig, items }, null, 2) });
                                            }}
                                            placeholder="Max"
                                            className="w-[80px] border p-2 rounded-md text-black text-center"
                                        />
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={item.valor ?? ""}
                                            onChange={(e) => {
                                                const items = [...(parsedConfig?.items ?? [])];
                                                items[index].valor = parseFloat(e.target.value);
                                                setFormData({ ...formData, config: JSON.stringify({ ...parsedConfig, items }, null, 2) });
                                            }}
                                            placeholder="Valor"
                                            className="w-[80px] border p-2 rounded-md text-black text-center"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const items = (parsedConfig?.items ?? []).filter((_, i) => i !== index);
                                                setFormData({ ...formData, config: JSON.stringify({ ...parsedConfig, items }, null, 2) });
                                            }}
                                            className="text-red-500 hover:underline text-sm"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => {
                                        const items = [...(parsedConfig?.items || []), { min: undefined, max: undefined, valor: undefined }];
                                        setFormData({ ...formData, config: JSON.stringify({ ...parsedConfig, items }, null, 2) });
                                    }}
                                    className="text-blue-600 hover:underline text-sm"
                                >
                                    + Agregar otro rango
                                </button>
                            </div>
                        )}

                    </div>


                    {/* Botones */}
                    <div className="flex justify-center gap-4 mt-6">
                        <Button onClick={handleModalClose} variant="cancel" label="Cancelar" />
                        {canEdit && (
                            <Button onClick={handleSubmit} variant="create" disabled={
                                isSaving} label={isEditing ? "Guardar" : isSaving ? "Guardando..." : "Crear"} />
                        )}
                    </div>
                </ModalSection>
            )}

            {/* Tabla de actividades */}
            <Table columns={["description", "binding"]}
                rows={activities}
                columnLabels={{
                    description: "Descripción",
                    binding: "Obligatorio",
                }}
                onDelete={canEdit ? handleDelete : undefined}
                onEdit={handleEdit}
                onHistory={handleHistory}
            />
            {auditList.length > 0 && (
                <AuditModal audit={auditList} onClose={() => setAuditList([])} />
            )}
        </div>
    );
}
