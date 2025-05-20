"use client";
import React, { useState, useEffect } from "react";
import { motion } from 'framer-motion';
import { createActivitie, deleteActivitie, getActivitie, getActivitieId, updateActivitie, } from "../../services/maestras/activityServices";
import { showError, showSuccess, showConfirm } from "../toastr/Toaster";
import Button from "../buttons/buttons";
import Table from "../table/Table";
import { ActivityType, Activities, EditFormData, activityTypes } from "../../interfaces/NewActivity";
import Text from "../text/Text";
import { Clock } from "lucide-react";

export default function NewActivity() {
    const [isOpen, setIsOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedType, setSelectedType] = useState("Texto corto");
    const [formData, setFormData] = useState({
        description: "",
        config: JSON.stringify(activityTypes["Texto corto"], null, 2),
        binding: false,
        has_time: false,
        duration: 0,
    });
    const [activities, setActivities] = useState<Activities[]>([]);
    const [options, setOptions] = useState<string[]>([""]);
    const [parsedConfig, setParsedConfig] = useState<ActivityType | null>(null);
    const [editingActivity, setEditingActivity] = useState<EditFormData | null>(null);
    const [originalConfig, setOriginalConfig] = useState<ActivityType | null>(null);
    const INPUT_TYPES_WITH_OPTIONS = ["select", "radio", "checkbox"];
    const getDefaultConfig = (type: string) =>
        JSON.stringify(activityTypes[type] || activityTypes["Texto corto"], null, 2);

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
    };

    // Componente reutilizable para manejar opciones
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

    const resetEditModalData = () => {
        setEditingActivity(null);
        setOriginalConfig(null);
        setSelectedType("Texto corto");
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
        fetchActivities();
    }, []);

    useEffect(() => {
        try {
            setParsedConfig(JSON.parse(formData.config));
        } catch (error) {
            console.error("Error al parsear config:", error);
            setParsedConfig(null);
        }
    }, [formData.config]);

    // ────────────────────────────── API ──────────────────────────────

    const fetchActivities = async () => {
        try {
            const data = await getActivitie();
            setActivities(data);
        } catch (error) {
            console.error("Error fetching activities:", error);
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        try {
            await createActivitie(formData);
            showSuccess("Actividad creada exitosamente");
            setIsOpen(false);
            fetchActivities();
            resetModalData();
        } catch (error) {
            console.error("Error al crear la actividad:", error);
            showError("Error al crear la actividad");
        }
    };

    const handleUpdate = async () => {
        if (!editingActivity) return;

        try {
            const parsed = JSON.parse(editingActivity.config);
            const config = JSON.stringify({
                type: parsed.type || "text",
                options: editingActivity.options || [],
            });

            await updateActivitie(editingActivity.id, {
                description: editingActivity.description,
                config,
                binding: editingActivity.binding,
                has_time: editingActivity.has_time,
                duration: editingActivity.duration,
            });

            await fetchActivities();
            setIsEditOpen(false);
            resetEditModalData();
            showSuccess("Actividad actualizada correctamente");
        } catch (error) {
            console.error("Error al actualizar actividad:", error);
            showError("Error al actualizar actividad");
        }
    };

    const handleDelete = async (id: number) => {
        showConfirm("¿Seguro que quieres eliminar esta Actividad?", async () => {
            try {
                await deleteActivitie(id);
                setActivities((prev) => prev.filter((a) => a.id !== id));
                showSuccess("Actividad eliminada con éxito");
            } catch (error) {
                console.error("Error al eliminar Actividad:", error);
                showError("Error al eliminar Actividad");
            }
        });
    };

    // ────────────────────────────── INPUT HANDLERS ──────────────────────────────

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

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
        if (parsedConfig?.type === "radio" && options.length >= 1) {
            showError("Solo se permite una opción para selección única");
            return;
        }
        setOptions([...options, "Nueva opción"]);
    };

    const removeOption = (index: number) => {
        setOptions(options.filter((_, i) => i !== index));
    };

    // ────────────────────────────── EDICIÓN ──────────────────────────────

    const handleTypeChangeEdit = (newType: string) => {
        if (!editingActivity || !originalConfig) return;

        const originalTypeKey = Object.keys(activityTypes).find(
            (key) => activityTypes[key].type === originalConfig.type
        ) || "Texto corto";

        const selectedConfig = activityTypes[newType] || activityTypes["Texto corto"];
        const keepOptions = INPUT_TYPES_WITH_OPTIONS.includes(selectedConfig.type || "");

        setEditingActivity({
            ...editingActivity,
            config: JSON.stringify(
                keepOptions
                    ? { ...selectedConfig, options: editingActivity.options || [] }
                    : selectedConfig,
                null,
                2
            ),
            options: keepOptions ? editingActivity.options || [] : [],
        });

        setSelectedType(newType);
    };

    const handleEdit = async (id: number) => {
        try {
            const data = await getActivitieId(id);

            const parsed = typeof data.config === "string" ? JSON.parse(data.config) : data.config;
            const activityType = Object.keys(activityTypes).find(
                (key) => activityTypes[key].type === parsed.type
            ) || "Texto corto";

            setOriginalConfig(parsed);
            setEditingActivity({
                id: data.id,
                description: data.description,
                config: JSON.stringify(parsed, null, 2),
                binding: data.binding === 1,
                has_time: data.has_time,
                duration: data.duration,
                options: parsed.options || [],
            });
            setSelectedType(activityType);
            setIsEditOpen(true);
        } catch (error) {
            console.error("Error obteniendo datos de la actividad:", error);
            showError("Error obteniendo datos de la actividad");
        }
    };

    const getFormattedDuration = (minutes: number): string => {
        if (minutes <= 0) return 'menos de 1 minuto';
        const days = Math.floor(minutes / 1440); // 1440 min = 1 día
        const remainingMinutesAfterDays = minutes % 1440;
        const hours = Math.floor(remainingMinutesAfterDays / 60);
        const remainingMinutes = remainingMinutesAfterDays % 60;
        const parts: string[] = [];
        if (days > 0) parts.push(`${days} día${days > 1 ? 's' : ''}`);
        if (hours > 0) parts.push(`${hours} hora${hours > 1 ? 's' : ''}`);
        if (remainingMinutes > 0) parts.push(`${remainingMinutes} min`);
        return parts.join(' ');
    };

    return (
        <div>
            {/* Botón para abrir el modal de creación */}
            <div className="flex justify-center space-x-2 mb-2">
                <Button onClick={() => setIsOpen(true)} variant="create" label="Crear Actividad" />
            </div>


            {/* Modal de creación */}
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="bg-white rounded-lg shadow-xl w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-[900px] max-h-[90vh] overflow-y-auto p-4 sm:p-6"
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="text-center">
                            <Text type="title">Crear Actividad</Text>
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
                            />
                        </div>

                        {/* Selector de tipo de actividad */}
                        <div>
                            <Text type="subtitle">Tipo de Actividad</Text>
                            <select
                                value={selectedType}
                                onChange={(e) => handleTypeChange(e.target.value)}
                                className="w-full border p-2 rounded-md text-black mb-4 text-center"
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
                                             min={1}               // Esto evita que el usuario pueda poner 0 o menos en el input
                                            value={formData.duration}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                if (val >= 1) {
                                                    setFormData({ ...formData, duration: val });
                                                } else {
                                                    setFormData({ ...formData, duration: 1 }); // O déjalo en blanco o el valor que consideres mínimo
                                                }
                                            }} 
                                            placeholder="Duración (en minutos)"
                                            className="w-full max-w-[350px] border p-2 pl-9 rounded-md text-black focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <span className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-3 text-gray-800 bg-gray-50 mt-1 text-center">min - ({getFormattedDuration(Number(formData.duration))})</span>
                                </div>
                            )}
                        </div>

                        {/* Botones */}
                        <div className="flex justify-end space-x-4">
                            <Button onClick={() => setIsOpen(false)} variant="cancel" label="Cancelar" />
                            <Button onClick={handleSubmit} variant="create" />
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Modal de edición */}
            {isEditOpen && editingActivity && (
                <motion.div
                    className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="bg-white rounded-lg shadow-xl w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-[900px] max-h-[90vh] overflow-y-auto p-4 sm:p-6"
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <h2 className="text-xl font-semibold mb-4 text-black text-center">Editar Actividad</h2>

                        {/* Campo de descripción */}
                        <input
                            type="text"
                            name="description"
                            value={editingActivity?.description || ''}
                            onChange={(e) =>
                                setEditingActivity({
                                    ...editingActivity!,
                                    description: e.target.value,
                                })
                            }
                            placeholder="Descripción"
                            className="w-full border p-2 rounded-md text-black mb-4"
                        />

                        {/* Selector de tipo de actividad */}
                        <select
                            value={selectedType}
                            onChange={(e) => handleTypeChangeEdit(e.target.value)}
                            className="w-full border p-2 rounded-md text-black mb-4"
                        >
                            {Object.keys(activityTypes).map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>

                        {/* Opciones dinámicas */}
                        {editingActivity && ["select", "radio", "checkbox"].includes(JSON.parse(editingActivity.config).type) && (
                            <div className="mb-4">
                                <h3 className="font-medium mb-2">Opciones:</h3>
                                <OptionsInput
                                    options={editingActivity.options || []}
                                    onChange={(index, value) => {
                                        const newOptions = [...editingActivity.options!];
                                        newOptions[index] = value;
                                        setEditingActivity({
                                            ...editingActivity!,
                                            options: newOptions,
                                        });
                                    }}
                                    onAdd={() =>
                                        setEditingActivity({
                                            ...editingActivity!,
                                            options: [
                                                ...editingActivity.options!,
                                                "Nueva opción",
                                            ],
                                        })
                                    }
                                    onRemove={(index) =>
                                        setEditingActivity({
                                            ...editingActivity!,
                                            options: editingActivity.options!.filter(
                                                (_, i) => i !== index
                                            ),
                                        })
                                    }
                                />
                            </div>
                        )}

                        {/* Contenedor para los tres elementos en fila */}
                        <div className="mt-4 flex flex-wrap justify-center gap-6">
                            {/* Contenedor para "Requerido" */}
                            <div className="flex items-center gap-3">
                                <label htmlFor="binding" className="text-sm text-black">Requerido</label>
                                <input
                                    type="checkbox"
                                    checked={editingActivity?.binding ?? false}
                                    onChange={(e) =>
                                        setEditingActivity({
                                            ...editingActivity!,
                                            binding: e.target.checked,
                                        })
                                    }
                                    className="h-5 w-5 text-blue-500 rounded-md"
                                />
                            </div>

                            {/* Checkbox para "Tiempo" */}
                            <div className="flex items-center gap-3">
                                <label htmlFor="has_time" className="text-sm text-black">Medir Tiempo</label>
                                <input
                                    type="checkbox"
                                    checked={editingActivity?.has_time ?? false}
                                    onChange={(e) =>
                                        setEditingActivity({
                                            ...editingActivity!,
                                            has_time: e.target.checked,
                                        })
                                    }
                                    className="h-5 w-5 text-blue-500 rounded-md"
                                />
                            </div>

                            {editingActivity.has_time && (
                                <div className="flex items-center gap-3 ">
                                    <label htmlFor="duration" className="text-sm text-black">
                                        Duración
                                    </label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                        <input
                                            type="number"
                                            name="duration"
                                            value={editingActivity?.duration ?? 0}
                                            onChange={(e) =>
                                                setEditingActivity({
                                                    ...editingActivity!,
                                                    duration: Number(e.target.value),
                                                })
                                            }
                                            placeholder="Duración (en minutos)"
                                            className="w-full max-w-[150px] border p-2 pl-9 rounded-md text-black focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-3 text-gray-800 bg-gray-50 mt-1 text-center">min - ({getFormattedDuration(Number(editingActivity.duration))})</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Botones */}
                        <div className="flex justify-center space-x-4 mt-4">
                            <Button
                                onClick={() => {
                                    setIsEditOpen(false);
                                    resetEditModalData(); // Reiniciar los datos del modal
                                }}
                                variant="cancel"
                                label="Cancelar"
                            />
                            <Button onClick={handleUpdate} variant="create" label="Guardar" />
                        </div>
                    </motion.div>
                </motion.div>
            )
            }

            {/* Tabla de actividades */}
            <Table columns={["description", "binding"]} rows={activities}
                columnLabels={{
                    description: "Descripción",
                    binding: "Obligatorio",
                }} onDelete={handleDelete} onEdit={handleEdit} />
        </div >
    );
}