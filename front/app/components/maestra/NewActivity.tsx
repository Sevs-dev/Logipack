"use client";
import React, { useState, useEffect } from "react";
import { createActivitie, deleteActivitie, getActivitie, getActivitieId, updateActivitie } from "../../services/maestras/activityServices";
import { getAuditsByModel } from "../../services/history/historyAuditServices";
import { showError, showSuccess, showConfirm } from "../toastr/Toaster";
import Button from "../buttons/buttons";
import Table from "../table/Table";
import { ActivityType, Activities, activityTypes } from "../../interfaces/NewActivity";
import Text from "../text/Text";
import { Clock } from "lucide-react";
import { CreateClientProps } from "../../interfaces/CreateClientProps";
import ModalSection from "../modal/ModalSection";
import AuditModal from "../history/AuditModal";

export default function NewActivity({ canEdit = false, canView = false }: CreateClientProps) {
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
    const [auditData, setAuditData] = useState<any>(null);
    const [auditList, setAuditList] = useState<any[]>([]);
    const [selectedAudit, setSelectedAudit] = useState<any | null>(null);

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

    function OptionsInput({
        options,
        onChange,
        onAdd,
        onRemove,
    }: {
        options: string[];
        onChange: (index: number, value: string) => void;
        onAdd: () => void;
        onRemove: (index: number) => void;
    }) {
        return (
            <div>
                {options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                        <input
                            type="text"
                            value={option}
                            onChange={(e) => onChange(index, e.target.value)}
                            className="border p-1 rounded-md text-black flex-grow"
                        // Elimina maxLength o restricciones aquí
                        />
                        <button
                            onClick={() => onRemove(index)}
                            className="bg-red-500 text-white px-2 py-1 rounded-md"
                            aria-label={`Eliminar opción ${index + 1}`}
                        >
                            X
                        </button>
                    </div>
                ))}
                <button
                    onClick={onAdd}
                    className="bg-blue-500 text-white px-2 py-1 rounded-md"
                >
                    Agregar opción
                </button>
            </div>
        );
    }

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
        { canView && fetchActivities() }
    }, [canView]);

    useEffect(() => {
        try {
            setParsedConfig(JSON.parse(formData.config));
        } catch (error) {
            setParsedConfig(null);
        }
    }, [formData.config]);

    // ────────────────────────────── API ──────────────────────────────

    const fetchActivities = async () => {
        try {
            const data = await getActivitie();
            setActivities(data);
        } catch (error) {
            // handle error
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        try {
            if (isEditing && editingId !== null) {
                // Update
                const parsed = JSON.parse(formData.config);
                const config = JSON.stringify({
                    type: parsed.type || "text",
                    options: options || [],
                });
                await updateActivitie(editingId, {
                    description: formData.description,
                    config,
                    binding: formData.binding,
                    has_time: formData.has_time,
                    duration: formData.duration,
                });
                showSuccess("Actividad actualizada correctamente");
            } else {
                // Create
                await createActivitie(formData);
                showSuccess("Actividad creada exitosamente");
            }
            setModalOpen(false);
            fetchActivities();
            resetModalData();
        } catch (error) {
            showError(isEditing ? "Error al actualizar actividad" : "Error al crear la actividad");
        }
    };

    const handleDelete = async (id: number) => {
        if (!canEdit) return;
        showConfirm("¿Seguro que quieres eliminar esta Actividad?", async () => {
            try {
                await deleteActivitie(id);
                setActivities((prev) => prev.filter((a) => a.id !== id));
                showSuccess("Actividad eliminada con éxito");
            } catch (error) {
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

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        const updatedConfig = { ...parsedConfig, options: newOptions };
        setFormData({ ...formData, config: JSON.stringify(updatedConfig, null, 2) });
        setOptions(newOptions);
    };

    const addOption = () => {
        if (parsedConfig?.type === "radio" && options.length >= 5) {
            showError("Demasiadas opciones para selección única");
            return;
        }
        setOptions([...options, "Nueva opción"]);
    };


    const removeOption = (index: number) => {
        const newOptions = options.filter((_, i) => i !== index);
        setOptions(newOptions);
        const updatedConfig = { ...parsedConfig, options: newOptions };
        setFormData({ ...formData, config: JSON.stringify(updatedConfig, null, 2) });
    };

    // ────────────────────────────── EDICIÓN ──────────────────────────────

    const handleEdit = async (id: number) => {
        try {
            const data = await getActivitieId(id);
            const parsed = typeof data.config === "string" ? JSON.parse(data.config) : data.config;
            const activityType = Object.keys(activityTypes).find(
                (key) => activityTypes[key].type === parsed.type
            ) || "Texto corto";
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
        } catch (error) {
            showError("Error obteniendo datos de la actividad");
        }
    };

    const getFormattedDuration = (minutes: number): string => {
        if (minutes <= 0) return 'menos de 1 minuto';
        const days = Math.floor(minutes / 1440);
        const remainingMinutesAfterDays = minutes % 1440;
        const hours = Math.floor(remainingMinutesAfterDays / 60);
        const remainingMinutes = remainingMinutesAfterDays % 60;
        const parts: string[] = [];
        if (days > 0) parts.push(`${days} día${days > 1 ? 's' : ''}`);
        if (hours > 0) parts.push(`${hours} hora${hours > 1 ? 's' : ''}`);
        if (remainingMinutes > 0) parts.push(`${remainingMinutes} min`);
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
        } catch (error) {
            console.error("Error al obtener la auditoría:", error);
        }
    };

    const closeModal = () => {
        setAuditData(null);
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
                        <Text type="title">{isEditing ? "Editar Actividad" : "Crear Actividad"}</Text>
                    </div>
                    {/* Campo de descripción */}
                    <div>
                        <Text type="subtitle">Descripción</Text>
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
                        <Text type="subtitle">Tipo de Actividad</Text>
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
                                <OptionsInput
                                    options={options}
                                    onChange={handleOptionChange}
                                    onAdd={addOption}
                                    onRemove={removeOption}
                                />
                            </div>
                        )
                    }

                    {/* Contenedor para los tres elementos en fila */}
                    <div className="mt-4 flex flex-wrap justify-center gap-6">
                        {/* Contenedor para "Requerido" */}
                        <div className="flex items-center gap-3">
                            <label htmlFor="binding" className="text-sm text-black">Requerido</label>
                            <input
                                id="binding"
                                type="checkbox"
                                checked={formData.binding}
                                onChange={(e) =>
                                    setFormData({ ...formData, binding: e.target.checked })
                                }
                                className="h-5 w-5 text-blue-500 rounded-md focus:ring-2 focus:ring-blue-500"
                                disabled={!canEdit && !isEditing}
                            />
                        </div>

                        {/* Contenedor para "Medir Tiempo" */}
                        <div className="flex items-center gap-3">
                            <label htmlFor="has_time" className="text-sm text-black">Medir Tiempo</label>
                            <input
                                id="has_time"
                                type="checkbox"
                                checked={formData.has_time}
                                onChange={(e) =>
                                    setFormData({ ...formData, has_time: e.target.checked })
                                }
                                className="h-5 w-5 text-blue-500 rounded-md focus:ring-2 focus:ring-blue-500"
                                disabled={!canEdit && !isEditing}
                            />
                        </div>

                        {/* Campo de duración solo visible si 'Tiempo' es true */}
                        {formData.has_time && (
                            <div className="flex items-center gap-3">
                                <label htmlFor="duration" className="text-sm text-black">
                                    Duración
                                </label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                    <input
                                        id="duration"
                                        type="number"
                                        name="duration"
                                        min={1}
                                        value={formData.duration}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setFormData({ ...formData, duration: val >= 1 ? val : 1 });
                                        }}
                                        placeholder="Duración (en minutos)"
                                        className="w-full max-w-[350px] border p-2 pl-9 rounded-md text-black focus:ring-2 focus:ring-blue-500"
                                        disabled={!canEdit && !isEditing}
                                    />
                                </div>
                                <span className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-3 text-gray-800 bg-gray-50 mt-1 text-center">min - ({getFormattedDuration(Number(formData.duration))})</span>
                            </div>
                        )}
                    </div>

                    {/* Botones */}
                    <div className="flex justify-center gap-4 mt-6">
                        <Button onClick={handleModalClose} variant="cancel" label="Cancelar" />
                        {canEdit && (
                            <Button onClick={handleSubmit} variant="create" label={isEditing ? "Guardar" : "Crear"} />
                        )}
                    </div>
                </ModalSection>
            )}

            {/* Tabla de actividades */}
            <Table columns={["description", "binding"]} rows={activities}
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
