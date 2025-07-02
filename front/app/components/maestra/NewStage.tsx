"use client";
import React, { useState, useEffect } from "react";
import { createStage, getStageId, updateStage, deleteStage, getStage } from "../../services/maestras/stageServices";
import { getActivitie } from "../../services/maestras/activityServices";
import { getAuditsByModel } from "../../services/history/historyAuditServices";
import { showError, showSuccess, showConfirm } from "../toastr/Toaster";
import Table from "../table/Table";
import Button from "../buttons/buttons";
import { InfoPopover } from "../buttons/InfoPopover";
import { Stage, Data } from "../../interfaces/NewStage";
import Text from "../text/Text";
import { Search, Clock } from "lucide-react";
const phases = ["Planificación", "Conciliación", "Control", "Actividades", "Procesos"];
import { CreateClientProps } from "../../interfaces/CreateClientProps";
import ModalSection from "../modal/ModalSection";
import AuditModal from "../history/AuditModal";
import { Audit } from "../../interfaces/Audit";

function NewStage({ canEdit = false, canView = false }: CreateClientProps) {
    // === useState (Modal & Edición) ===
    const [isOpen, setIsOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingStage, setEditingStage] = useState<Stage | null>(null);
    // === useState (Form inputs) ===
    const [description, setDescription] = useState("");
    const [duration, setDuration] = useState("");
    const [durationUser, setDurationUser] = useState("");
    const [phaseType, setPhaseType] = useState<string>("");
    // === useState (Flags) ===
    const [repeat, setRepeat] = useState(false);
    const [repeat_line, setrepeat_line] = useState(false);
    const [repeatMinutes, setRepeatMinutes] = useState("");
    const [alert, setAlert] = useState(false);
    const [status, setStatus] = useState(false);
    const [multi, setMulti] = useState(false);
    const [canPause, setCanPause] = useState(false);
    // === useState (Datos y selección) ===
    const [stage, setStage] = useState<Stage[]>([]);
    const [availableActivities, setAvailableActivities] = useState<{ id: number; description: string; binding: number, duration: number }[]>([]);
    const [selectedActivities, setSelectedActivities] = useState<{ id: number; description: string, duration: number }[]>([]);
    const [auditList, setAuditList] = useState<Audit[]>([]);
    const [, setSelectedAudit] = useState<Audit | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    // === Fetchers ===
    const fetchStage = async () => {
        try {
            const data = await getStage();
            setStage(data);
        } catch {
            console.error("Error fetching stages:");
        }
    };
    // === useEffects ===
    useEffect(() => {
        if (canView) fetchStage();
    }, [canView]);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const activities = await getActivitie();
                setAvailableActivities(activities);
            } catch {
                showError("Error al cargar las actividades");
            }
        };
        if (["Actividades", "Control", "Procesos"].includes(phaseType)) {
            fetchActivities();
        } else {
            setAvailableActivities([]);
            setSelectedActivities([]);
        }
    }, [phaseType]);

    useEffect(() => {
        if (
            editingStage &&
            ["Actividades", "Control", "Procesos"].includes(phaseType) &&
            availableActivities.length > 0
        ) {
            const selected = editingStage.activities;
            if (Array.isArray(selected) && selected.every(item => typeof item === 'object' && item.id)) {
                setSelectedActivities(selected);
            } else {
                console.warn("El campo 'activities' no es un array de objetos válidos:", selected);
                setSelectedActivities([]);
            }
        }
    }, [availableActivities, editingStage, phaseType]);

    useEffect(() => {
        const total = selectedActivities.reduce(
            (acc, act) => acc + (Number(act.duration) || 0),
            0
        );
        setDuration(String(total));
    }, [selectedActivities]);

    // === Validación ===
    const validateForm = () => {
        if (!description.trim()) {
            showError("La descripción es obligatoria.");
            return false;
        }
        if (!phaseType) {
            showError("El tipo de fase es obligatorio.");
            return false;
        }
        if (repeat && (!repeatMinutes || isNaN(Number(repeatMinutes)))) {
            showError("Por favor, ingresa un valor numérico válido para 'Repetir cada (min)'.");
            return false;
        }
        if (["Actividades", "Control", "Procesos"].includes(phaseType) && selectedActivities.length === 0) {
            showError("Debes seleccionar al menos una actividad.");
            return false;
        }
        return true;
    };

    // === Guardado ===
    const handleSave = async () => {
        if (isSaving) return; // Evita múltiples envíos
        if (!validateForm()) return;
        setIsSaving(true); // Activa loading
        const newStage: Data = {
            description,
            phase_type: phaseType,
            repeat,
            repeat_line,
            repeat_minutes: repeat ? Number(repeatMinutes) : undefined,
            alert,
            can_pause: canPause,
            status,
            multi,
            duration_user: durationUser,
            duration,
            activities: [],
        };
        if (["Actividades", "Control", "Procesos"].includes(phaseType)) {
            newStage.activities = selectedActivities.map((activity) => activity.id);
        }
        try {
            const response = await createStage(newStage);
            if (response.status === 201) {
                showSuccess("Fase creada con éxito");
                setIsOpen(false);
                fetchStage();
                resetForm();
            } else {
                showError("Error al crear la fase");
            }
        } catch (error) {
            console.error("Error al guardar la fase:", error);
            showError("Ocurrió un error al guardar la fase");
        } finally {
            setIsSaving(false); // Desactiva loading
        }
    };

    // === Edición ===
    const handleEdit = async (id: number) => {
        try {
            const data = await getStageId(id);
            setEditingStage(data);
            setDescription(data.description);
            setPhaseType(data.phase_type);
            setRepeat(data.repeat);
            setrepeat_line(!!data.repeat_line);
            setRepeatMinutes(data.repeat_minutes?.toString() || "");
            setAlert(data.alert);
            setStatus(data.status);
            setMulti(data.multi);
            setCanPause(data.can_pause);
            setDuration(data.duration);
            setDurationUser(data.duration_user);
            setIsEditOpen(true);
        } catch {
            console.error("Error obteniendo datos de la fase:");
            showError("Error obteniendo datos de la fase");
        }
    };

    // === Actualización ===
    const handleUpdate = async () => {
        if (isSaving) return;
        if (!editingStage) return;
        setIsSaving(true);
        const activityIds = ["Actividades", "Control", "Procesos"].includes(phaseType)
            ? selectedActivities.map(a => a.id)
            : [];

        const updatedStage: Data = {
            description,
            phase_type: phaseType,
            repeat: Boolean(repeat),
            repeat_line: Boolean(repeat_line),
            repeat_minutes: repeat ? Number(repeatMinutes) : undefined,
            alert: Boolean(alert),
            can_pause: Boolean(canPause),
            status: Boolean(status),
            multi: Boolean(multi),
            activities: activityIds,
            duration_user: durationUser ?? "",
            duration,
        }; 
        try {
            await updateStage(editingStage.id, updatedStage);
            showSuccess("Fase actualizada con éxito");
            setIsEditOpen(false);
            fetchStage();
            resetForm();
        } catch {
            console.error("Error al actualizar la fase:");
            showError("Ocurrió un error al actualizar la fase");
        } finally {
            setIsSaving(false); // Desactiva loading
        }
    };

    // === Eliminación ===
    const handleDelete = async (id: number) => {
        if (!canEdit) return;
        showConfirm("¿Seguro que quieres eliminar esta fase?", async () => {
            try {
                await deleteStage(id);
                setStage(prev => prev.filter((stage) => stage.id !== id));
                showSuccess("Fase eliminada con éxito");
            } catch {
                console.error("Error al eliminar fase:");
                showError("Error al eliminar fase");
            }
        });
    };

    // === Helpers ===
    const resetForm = () => {
        setDescription("");
        setPhaseType("");
        setRepeat(false);
        setRepeatMinutes("");
        setAlert(false);
        setStatus(false);
        setCanPause(false);
        setSelectedActivities([]);
        setDuration("");
        setDurationUser("");
        setMulti(false);
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

    // === Auditoría ===
    const handleHistory = async (id: number) => {
        const model = "Stage";
        try {
            const data = await getAuditsByModel(model, id);
            console.log(data);
            setAuditList(data);
            if (data.length > 0) setSelectedAudit(data[0]);
        } catch {
            console.error("Error al obtener la auditoría:");
        }
    };

    return (
        <div>
            {/* Botón de crear fase */}
            {canEdit && (
                <div className="flex justify-center space-x-2 mb-2">
                    <Button onClick={() => setIsOpen(true)} variant="create" label="Crear Fase" />
                </div>
            )}

            {(isOpen || isEditOpen && editingStage) && (
                <ModalSection isVisible={(isOpen || isEditOpen)} onClose={() => {
                    if (editingStage) {
                        setIsEditOpen(false);
                    } else {
                        setIsOpen(false);
                    }
                    resetForm();
                }}>
                    <Text type="title" color="text-[#000]">{editingStage ? "Editar Fase" : "Crear Fase"}</Text>

                    <div className="space-y-4">
                        {/* Descripción */}
                        <div>
                            <Text type="subtitle" color="#000">Descripción</Text>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="mt-1 w-full text-center p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
                                disabled={!canEdit}
                            />
                        </div>

                        {/* Tipo de Fase */}
                        <div>
                            <Text type="subtitle" color="#000">Tipo de Fase</Text>
                            <select
                                value={phaseType}
                                onChange={(e) =>
                                    setPhaseType(
                                        e.target.value as
                                        | "Planificación"
                                        | "Conciliación"
                                        | "Control"
                                        | "Actividades"
                                        | "Procesos"
                                    )
                                }
                                className="mt-1 w-full text-center p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
                                disabled={!canEdit}
                            >
                                <option value="" disabled>
                                    Seleccione un tipo de Fase
                                </option>
                                {phases.map((phase) => (
                                    <option key={phase} value={phase}>
                                        {phase}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Actividades (solo si Tipo de Fase es Actividades) */}
                        {(phaseType === "Actividades" || phaseType === "Control" || phaseType === "Procesos") && (
                            <div className="space-y-4">
                                <Text type="subtitle" color="#000">Actividades</Text>
                                <div className="flex flex-col md:flex-row gap-4">
                                    {/* Lista de actividades disponibles */}
                                    <div className="w-full md:w-1/2">
                                        <Text type="subtitle" color="#000">Disponibles</Text>
                                        <div className="relative mb-2">
                                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                            <input
                                                type="text"
                                                placeholder="Buscar actividad..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full border border-gray-300 p-2 pl-9 rounded-md text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                disabled={!canEdit}
                                            />
                                        </div>
                                        <ul className="mt-1 border border-gray-300 p-2 rounded-lg max-h-48 overflow-y-auto">
                                            {availableActivities
                                                .filter((activity) => activity.binding === 1)
                                                .filter((activity) =>
                                                    activity.description.toLowerCase().includes(searchTerm.toLowerCase())
                                                )
                                                .map((activity) => {
                                                    const isAdded = selectedActivities.some(
                                                        (item) => item.id === activity.id
                                                    );
                                                    return (
                                                        <li
                                                            key={activity.id}
                                                            className="py-1 border-b border-gray-200 last:border-0"
                                                        >
                                                            <button
                                                                disabled={isAdded || !canEdit}
                                                                onClick={() =>
                                                                    setSelectedActivities((prev) => [...prev, activity])
                                                                }
                                                                className={`w-full text-sm transition text-center ${isAdded
                                                                    ? "text-gray-400 cursor-not-allowed"
                                                                    : "text-blue-500 hover:text-blue-700"
                                                                    }`}
                                                            >
                                                                {activity.description}
                                                            </button>
                                                        </li>
                                                    );
                                                })}
                                        </ul>
                                    </div>

                                    {/* Lista de actividades seleccionadas */}
                                    <div className="w-full md:w-1/2">
                                        <Text type="subtitle" color="#000">Seleccionadas</Text>
                                        <ul className="mt-1 border border-gray-300 p-2 rounded-lg max-h-48 overflow-y-auto">
                                            {selectedActivities.map((activity) => (
                                                <li
                                                    key={activity.id}
                                                    className="flex items-center justify-between py-1 border-b border-gray-200 last:border-0"
                                                >
                                                    <span className="text-sm text-black">
                                                        {activity.description}
                                                    </span>
                                                    <button
                                                        className="text-red-500 hover:text-red-700 text-sm text-center"
                                                        onClick={() =>
                                                            setSelectedActivities((prev) =>
                                                                prev.filter((item) => item.id !== activity.id)
                                                            )
                                                        }
                                                        disabled={!canEdit}
                                                    >
                                                        Eliminar
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>

                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Total de duración */}
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="w-full md:w-1/2">
                                <Text type="subtitle" color="#000">Tiempo Estimado</Text>
                                <div className="mt-4 relative">
                                    <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        readOnly
                                        value={`${duration} minutos`}
                                        className="w-full border border-gray-300 p-2 pl-9 pr-24 rounded-md text-sm text-black bg-gray-100 cursor-default"
                                        disabled={!canEdit}
                                    />
                                    <span className="absolute right-7 top-2.5 text-sm text-gray-600">
                                        ({getFormattedDuration(Number(duration))})
                                    </span>
                                </div>
                            </div>

                            <div className="w-full md:w-1/2">
                                <Text type="subtitle" color="#000">T. Estimado Por El Usuario</Text>
                                <div className="mt-4 relative">
                                    <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                    <input
                                        type="number"
                                        value={durationUser}
                                        onChange={(e) => setDurationUser(e.target.value)}
                                        className="w-full border border-gray-300 p-2 pl-9 rounded-md text-sm text-black bg-white"
                                        disabled={!canEdit}
                                    />
                                    {durationUser && (
                                        <span className="absolute right-7 top-2.5 text-sm text-gray-600">
                                            ({getFormattedDuration(Number(durationUser))})
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Opciones adicionales */}
                        <div className="mt-4 flex justify-center gap-4">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={repeat}
                                    onChange={(e) => setRepeat(e.target.checked)}
                                    className="h-5 w-5 text-blue-600"
                                    disabled={!canEdit}
                                />
                                <span className="text-sm text-black">Repetir</span>
                                {repeat && (
                                    <input
                                        type="number"
                                        placeholder="Cada (min)"
                                        value={repeatMinutes}
                                        onChange={(e) => setRepeatMinutes(e.target.value)}
                                        className="min-w-[120px] p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-black text-sm"
                                        disabled={!canEdit}
                                    />
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={alert}
                                    onChange={(e) => setAlert(e.target.checked)}
                                    className="h-5 w-5 text-blue-600"
                                    disabled={!canEdit}
                                />
                                <span className="text-sm text-black">Activar Alerta</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={status}
                                    onChange={(e) => setStatus(e.target.checked)}
                                    className="h-5 w-5 text-blue-600"
                                    disabled={!canEdit}
                                />
                                <span className="text-sm text-black">Activar Estado</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={multi}
                                    onChange={(e) => setMulti(e.target.checked)}
                                    className="h-5 w-5 text-blue-600"
                                    disabled={!canEdit}
                                />
                                <span className="text-sm text-black">¿Es Multi?
                                    <InfoPopover content="Se selecciona para indicarle al sistema que al tener multiples unidades se pultiplique el tiempo" />
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={canPause}
                                    onChange={(e) => setCanPause(e.target.checked)}
                                    className="h-5 w-5 text-blue-600"
                                    disabled={!canEdit}
                                />
                                <span className="text-sm text-black">¿Se puede pausar?</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={repeat_line}
                                    onChange={(e) => setrepeat_line(e.target.checked)}
                                    className="h-5 w-5 text-blue-600"
                                    disabled={!canEdit}
                                />
                                <span className="text-sm text-black">Repetir Línea</span>
                            </div>
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="mt-4 flex justify-center gap-4">
                        <Button
                            onClick={() => {
                                if (editingStage) {
                                    setIsEditOpen(false);
                                } else {
                                    setIsOpen(false);
                                }
                                resetForm();
                            }}
                            variant="cancel"
                            label="Cancelar"
                        />
                        {canEdit && (
                            <Button
                                onClick={() => (editingStage ? handleUpdate() : handleSave())}
                                variant="create"
                                disabled={
                                    isSaving ||
                                    !description.trim() ||
                                    ((phaseType === "Actividades" || phaseType === "Control") && selectedActivities.length === 0)
                                }
                                label={editingStage ? "Actualizar" : isSaving ? "Guardando..." : "Crear"}
                            />
                        )}
                    </div>
                </ModalSection>

            )}

            {/* Tabla de fases */}
            <Table columns={["description", "phase_type", "status"]}
                rows={stage}
                columnLabels={{
                    description: "Descripción",
                    phase_type: "Tipo de Fase",
                    status: "Estado",
                }}
                onDelete={canEdit ? handleDelete : undefined}
                onEdit={handleEdit} onHistory={handleHistory}
            />
            {auditList.length > 0 && (
                <AuditModal audit={auditList} onClose={() => setAuditList([])} />
            )}
        </div>
    );
}

export default NewStage;

