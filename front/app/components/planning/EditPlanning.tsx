import React, { useState, useEffect, useCallback } from "react";
import { COLORS } from "@/app/constants/colors";
// 🔹 Componentes
import Button from "../buttons/buttons";
import { showSuccess, showError } from "../toastr/Toaster";
import Table from "../table/Table";
import Text from "../text/Text";
import { IconSelector } from "../dinamicSelect/IconSelector";
import ModalSection from "../modal/ModalSection";
import { InfoPopover } from "../buttons/InfoPopover";
// 🔹 Servicios 
import { getPlanning, updatePlanning, getPlanningId } from "../../services/planing/planingServices";
import { getActivitieId } from "../../services/maestras/activityServices"
import { getClientsId } from "@/app/services/userDash/clientServices";
import { getFactory } from "@/app/services/userDash/factoryServices";
import { getManu } from "@/app/services/userDash/manufacturingServices";
import { getMachin } from "@/app/services/userDash/machineryServices";
// 🔹 Interfaces
import { Plan } from "@/app/interfaces/EditPlanning";
import { NewActivity } from "../../interfaces/NewActivity";

function EditPlanning() {
    const [planning, setPlanning] = useState<Plan[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
    const [factories, setFactories] = useState<{ id: number, name: string }[]>([]);
    const [manu, setManu] = useState<{ id: number, name: string }[]>([]);
    const [machine, setMachine] = useState<{ id: number, name: string }[]>([]);
    const [activitiesDetails, setActivitiesDetails] = useState<NewActivity[]>([]);
    const [lineActivities, setLineActivities] = useState<Record<number, number[]>>({});
    const [draggedActivityId, setDraggedActivityId] = useState<number | null>(null);

    useEffect(() => {
        const fetchPlanning = async () => {
            try {
                const response = await getPlanning();
                const updatedPlanning: Plan[] = await Promise.all(
                    response.map(async (plan: Plan) => {
                        const clientData = await getClientsId(plan.client_id);
                        return {
                            ...plan,
                            client_name: clientData.name,
                        };
                    })
                );

                setPlanning(updatedPlanning);
            } catch (error) {
                showError("Error al cargar la planificación");
                console.error(error);
            }
        };
        fetchPlanning();
    }, []);

    useEffect(() => {
        const fetchFactories = async () => {
            try {
                const response = await getFactory();
                setFactories(response);
            } catch (error) {
                showError("Error al cargar las fábricas");
                console.error("Error al cargar fábricas:", error);
            }
        };

        fetchFactories();
    }, []);

    useEffect(() => {
        const fetchManu = async () => {
            try {
                const response = await getManu();
                setManu(response);
            } catch (error) {
                showError("Error al cargar las Manu");
                console.error("Error al cargar Manu:", error);
            }
        };

        fetchManu();
    }, []);

    useEffect(() => {
        const fetchMachine = async () => {
            try {
                const response = await getMachin();
                setMachine(response);
            } catch (error) {
                showError("Error al cargar las Machine");
                console.error("Error al cargar Machine:", error);
            }
        };

        fetchMachine();
    }, []);

    useEffect(() => {
        if (!currentPlan) return;

        if (currentPlan.lineActivities) {
            setLineActivities(currentPlan.lineActivities);
        } else {
            let keys: string[] = [];
            if (Array.isArray(currentPlan.line)) {
                // Es un array, perfecto
                keys = currentPlan.line.map(String);
            } else if (
                currentPlan.line &&
                typeof currentPlan.line === 'object' &&
                !Array.isArray(currentPlan.line)
            ) {
                // Es objeto, sacamos las keys
                keys = Object.keys(currentPlan.line);
            } else {
                // No es array ni objeto, no hay líneas
                keys = [];
            }
            const initial = keys.reduce((acc, lineId) => {
                acc[lineId] = [];
                return acc;
            }, {} as Record<string, number[]>);

            setLineActivities(initial);
        }
    }, [currentPlan]);


    // 🔧 Función para calcular la fecha final respetando el rango laboral
    function calculateEndDateRespectingWorkHours(start: string, durationMinutes: number): string {
        const WORK_START_HOUR = 6;
        const WORK_END_HOUR = 18;
        const WORK_MINUTES_PER_DAY = (WORK_END_HOUR - WORK_START_HOUR) * 60;

        let remainingMinutes = durationMinutes;
        const current = new Date(start);

        while (remainingMinutes > 0) {
            const currentHour = current.getHours();
            const currentMinute = current.getMinutes();
            const currentTotalMinutes = currentHour * 60 + currentMinute;

            const workStartMinutes = WORK_START_HOUR * 60;
            const workEndMinutes = WORK_END_HOUR * 60;

            if (currentTotalMinutes < workStartMinutes) {
                current.setHours(WORK_START_HOUR, 0, 0, 0);
            } else if (currentTotalMinutes >= workEndMinutes) {
                current.setDate(current.getDate() + 1);
                current.setHours(WORK_START_HOUR, 0, 0, 0);
            }

            const nowMinutes = current.getHours() * 60 + current.getMinutes();
            const minutesLeftToday = workEndMinutes - nowMinutes;
            const minutesToAdd = Math.min(remainingMinutes, minutesLeftToday);

            current.setMinutes(current.getMinutes() + minutesToAdd);
            remainingMinutes -= minutesToAdd;

            if (remainingMinutes > 0) {
                current.setDate(current.getDate() + 1);
                current.setHours(WORK_START_HOUR, 0, 0, 0);
            }
        }

        // 🕓 Convertimos a formato compatible con <input type="datetime-local"> en zona local
        const pad = (n: number) => n.toString().padStart(2, "0");
        return `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}T${pad(current.getHours())}:${pad(current.getMinutes())}`;
    }

    const sanitizePlan = (plan: Plan): any => {
        return {
            id: plan.id,
            client_id: plan.client_id,
            factory_id: plan.factory_id,
            master: plan.master,
            bom: plan.bom,
            codart: plan.codart,
            deliveryDate: plan.deliveryDate,
            factory: plan.factory,
            healthRegistration: plan.healthRegistration,
            ingredients: plan.ingredients,
            line: plan.line,
            lot: plan.lot,
            machine: plan.machine,
            number_order: plan.orderNumber,
            quantityToProduce: plan.quantityToProduce,
            resource: plan.resource,
            start_date: plan.start_date,
            end_date: plan.end_date,
            duration: Number(plan.duration || 0),
            duration_breakdown: plan.duration_breakdown,
            status_dates: plan.status_dates,
            created_at: plan.created_at,
        };
    };

    const handleSave = async (updatedPlan: Plan) => {
        if (!updatedPlan) {
            showError("No hay datos para guardar.");
            return;
        }
        try {
            const cleanedPlan = sanitizePlan(updatedPlan);
            const planToSave = {
                ...cleanedPlan,
                line: Array.isArray(updatedPlan.line) ? JSON.stringify(updatedPlan.line) : updatedPlan.line,
                duration: updatedPlan.duration?.toString() ?? null,
                activities: Array.isArray(updatedPlan.activitiesDetails)
                    ? updatedPlan.activitiesDetails.map(a => a.id)
                    : [],
            };
            console.log("Guardando planificación:", planToSave);
            await updatePlanning(updatedPlan.id, planToSave);
            showSuccess("Planificación actualizada");
            setPlanning(prev =>
                prev.map(plan =>
                    plan.id === updatedPlan.id ? planToSave : plan
                )
            );
            setIsOpen(false);
        } catch (error) {
            console.error("Error al guardar cambios:", error);
            showError("Error al guardar la planificación");
        }
    };

    const handleEdit = useCallback(async (id: number) => {
        const selectedPlan = planning.find(plan => plan.id === id);
        // console.log("Planificación seleccionada:", selectedPlan);
        if (!selectedPlan) {
            showError("Planificación no encontrada localmente");
            return;
        }
        try {
            const plan = await getPlanningId(id);
            const plansArray = plan.plan;

            if (!plansArray || !Array.isArray(plansArray) || plansArray.length === 0) {
                showError("Planificación no encontrada desde servidor");
                return;
            }
            const plansWithActivities = await Promise.all(
                plansArray.map(async (planItem) => {
                    if (!planItem.ID_ACTIVITIES || !Array.isArray(planItem.ID_ACTIVITIES)) {
                        return { ...planItem, activitiesDetails: [] };
                    }

                    const activitiesDetails = await Promise.all(
                        planItem.ID_ACTIVITIES.map((activityId: number) =>
                            getActivitieId(activityId)
                        )
                    );
                    return {
                        ...planItem,
                        activitiesDetails,
                    };
                })
            );
            const matchedPlan = plansWithActivities.find(
                p => p.ID_ADAPTACION === selectedPlan.id
            ) || plansWithActivities[0];
            setActivitiesDetails(matchedPlan.activitiesDetails); 
            const enrichedSelectedPlan = {
                ...selectedPlan,
                activitiesDetails: matchedPlan.activitiesDetails,
            };
            setCurrentPlan(enrichedSelectedPlan);
            setIsOpen(true);
        } catch (error) {
            console.error("Error fetching plan:", error);
            showError("Error al cargar planificación desde servidor");
        }
    }, [planning]);

    const handleDelete = useCallback((id: number) => {
        console.log("Eliminar", id);
    }, []);

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

    function formatDurationBreakdown(breakdown: string | any[]): string {
        const parsed = typeof breakdown === "string" ? JSON.parse(breakdown) : breakdown;

        return parsed
            .map((item: any) => {
                if (item.fase === "TOTAL") {
                    return `🧮 TOTAL → ${getFormattedDuration(item.resultado)}`;
                }

                const base = item.duracion_base;
                const teorica = item.teorica_total;
                const multiplicacion = item.multiplicacion;
                const resultado = item.resultado;

                if (multiplicacion && teorica) {
                    return `${item.fase} → ${multiplicacion} = ${resultado} min`;
                }

                return `${item.fase} → ${resultado} min`;
            })
            .join("\n");
    }

    const handleDrop = (lineId: number) => {
        if (draggedActivityId === null) return;
        setLineActivities((prev) => {
            const updated = { ...prev };
            // Quitar actividad de cualquier línea donde esté
            for (const key in updated) {
                updated[key] = updated[key].filter((id) => id !== draggedActivityId);
                // No borrar la clave, dejar array vacío para no romper lógica
            }
            // Agregar actividad a línea destino
            if (!updated[lineId]) updated[lineId] = [];
            updated[lineId].push(draggedActivityId);
            return updated;
        });

        setDraggedActivityId(null);
    };

    const assignedActivityIds = Object.values(lineActivities).flat();
    const availableActivities = activitiesDetails.filter(
        (a) => !assignedActivityIds.includes(a.id)
    );

    const removeActivityFromLine = (lineId: string | number, actId: string | number) => {
        setLineActivities((prev) => {
            const updated: Record<string | number, number[]> = { ...prev };
            if (updated[lineId]) {
                updated[lineId] = updated[lineId].filter((id) => id !== actId);
            }
            return updated;
        });
    };

    const getLinesArray = (line: any): number[] => {
        if (!line) return [];
        if (Array.isArray(line)) return line;
        try {
            return JSON.parse(line);
        } catch {
            return [];
        }
    };

    return (
        <div>
            {isOpen && currentPlan && (
                <ModalSection isVisible={isOpen} onClose={() => { setIsOpen(false) }}>
                    <Text type="title">Editar Acondicionamiento</Text>
                    <h2 className="text-xl font-bold mb-6">Editar planificación</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* 🔹 Artículo */}
                        <div>
                            <Text type="subtitle">Artículo</Text>
                            <input
                                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                readOnly
                                value={currentPlan.codart}
                                onChange={(e) =>
                                    setCurrentPlan({ ...currentPlan, codart: e.target.value })
                                }
                            />
                        </div>
                        {/* 🔹 Fecha de entrega */}
                        <div>
                            <Text type="subtitle">Fecha de entrega</Text>
                            <input
                                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                type="date"
                                readOnly
                                value={currentPlan.deliveryDate}
                                onChange={(e) =>
                                    setCurrentPlan({ ...currentPlan, deliveryDate: e.target.value })
                                }
                            />
                        </div>
                        {/* 🔹 Registro Sanitario */}
                        <div>
                            <Text type="subtitle">Registro Sanitario</Text>
                            <input
                                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                value={currentPlan.healthRegistration}
                                readOnly
                                onChange={(e) =>
                                    setCurrentPlan({
                                        ...currentPlan,
                                        healthRegistration: e.target.value,
                                    })
                                }
                            />
                        </div>
                        {/* 🔹 Lote */}
                        <div>
                            <Text type="subtitle">Lote</Text>
                            <input
                                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                value={currentPlan.lot}
                                readOnly
                                onChange={(e) =>
                                    setCurrentPlan({ ...currentPlan, lot: e.target.value })
                                }
                            />
                        </div>
                        {/* 🔹 N° de orden */}
                        <div>
                            <Text type="subtitle">N° de orden</Text>
                            <input
                                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                value={currentPlan.orderNumber}
                                readOnly
                                onChange={(e) =>
                                    setCurrentPlan({ ...currentPlan, orderNumber: e.target.value })
                                }
                            />
                        </div>
                        {/* 🔹 Cantidad a producir */}
                        <div>
                            <Text type="subtitle">Cantidad a producir</Text>
                            <input
                                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                type="number"
                                readOnly
                                value={currentPlan.quantityToProduce.toString()}
                                onChange={(e) =>
                                    setCurrentPlan({
                                        ...currentPlan,
                                        quantityToProduce: parseFloat(e.target.value),
                                    })
                                }
                            />
                        </div>
                        {/* 🔹 Cliente */}
                        <div>
                            <Text type="subtitle">Cliente</Text>
                            <input
                                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                value={currentPlan.client_name || ""}
                                readOnly
                                onChange={(e) =>
                                    setCurrentPlan({ ...currentPlan, client_name: e.target.value })
                                }
                            />
                        </div>
                        {/* 🔹 Estado */}
                        <div>
                            <Text type="subtitle">Estado</Text>
                            <select
                                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                value={currentPlan.status_dates}
                                onChange={(e) =>
                                    setCurrentPlan({ ...currentPlan, status_dates: e.target.value })
                                }
                            >
                                <option value="">Seleccione una opción</option>
                                <option value="En Creación">En Creación</option>
                                <option value="Planificación">Planificación</option>
                            </select>
                        </div>
                        {/* 🔹 Planta */}
                        <div>
                            <Text type="subtitle">Planta</Text>
                            <select
                                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                value={currentPlan.factory_id || ""} // Usar factory_id
                                onChange={(e) =>
                                    setCurrentPlan({ ...currentPlan, factory_id: Number(e.target.value) })
                                }
                            >
                                <option value="">Seleccione una planta</option>
                                {factories.length > 0 ? (
                                    factories.map((factory) => (
                                        <option key={factory.id} value={factory.id}>
                                            {factory.name}
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>
                                        No hay fábricas disponibles
                                    </option>
                                )}
                            </select>
                        </div>
                        {/* 🔹 Lineas */}
                        <div>
                            <Text type="subtitle">Líneas</Text>
                            <div className="flex flex-col sm:flex-row gap-4 mt-2">
                                {/* Lista de líneas disponibles */}
                                <div className="sm:w-1/2 w-full">
                                    <select
                                        multiple
                                        className="w-full h-48 border p-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={(() => {
                                            if (!currentPlan.line) return [];
                                            if (Array.isArray(currentPlan.line)) return currentPlan.line.map(String);
                                            try {
                                                return JSON.parse(currentPlan.line).map(String);
                                            } catch {
                                                return [];
                                            }
                                        })()}
                                        onChange={(e) => {
                                            // Primero parseamos line para estar seguros de que es array
                                            const currentLine = (() => {
                                                if (!currentPlan.line) return [];
                                                if (Array.isArray(currentPlan.line)) return currentPlan.line;
                                                try {
                                                    return JSON.parse(currentPlan.line);
                                                } catch {
                                                    return [];
                                                }
                                            })();

                                            const selected = Array.from(e.target.selectedOptions, option => Number(option.value));
                                            const merged = Array.from(new Set([...currentLine, ...selected]));
                                            setCurrentPlan({ ...currentPlan, line: merged });
                                        }}
                                    >
                                        {manu.length > 0 ? (
                                            manu
                                                .filter(line => !(currentPlan.line ?? []).includes(line.id)) // Oculta las ya seleccionadas
                                                .map((line) => (
                                                    <option key={line.id} value={line.id.toString()}>
                                                        {line.name}
                                                    </option>
                                                ))
                                        ) : (
                                            <option value="" disabled>No hay líneas disponibles</option>
                                        )}
                                    </select>
                                </div>

                                {/* Lista de líneas seleccionadas */}
                                <div className="sm:w-1/2 w-full border rounded-lg p-3 h-48 overflow-auto bg-gray-50">
                                    {getLinesArray(currentPlan.line).length > 0 ? (
                                        getLinesArray(currentPlan.line).map((lineId) => {
                                            const line = manu.find(l => l.id === lineId);
                                            if (!line) return null;
                                            return (
                                                <div
                                                    key={line.id}
                                                    className="flex justify-between items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-md mb-2"
                                                >
                                                    <span className="truncate">{line.name}</span>
                                                    <button
                                                        onClick={() =>
                                                            setCurrentPlan({
                                                                ...currentPlan,
                                                                line: getLinesArray(currentPlan.line).filter(id => id !== line.id),
                                                            })
                                                        }
                                                        className="text-red-500 hover:text-red-700 font-bold"
                                                    >
                                                        ✖
                                                    </button>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-gray-400 text-sm">No hay líneas seleccionadas</p>
                                    )}
                                </div>

                            </div>
                        </div>

                        {/* Actividades disponibles para arrastrar */}
                        <div className="flex-1 border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-sm transition-all">
                            <Text type="subtitle">Actividades disponibles</Text>

                            {availableActivities.length === 0 ? (
                                <p className="text-sm text-gray-500">(Ninguna disponible)</p>
                            ) : (
                                availableActivities.map((act) => (
                                    <div
                                        key={act.id}
                                        draggable
                                        onDragStart={() => setDraggedActivityId(act.id)}
                                        className="border border-gray-300 p-3 mb-3 rounded-md cursor-grab bg-white shadow-sm hover:shadow transition-shadow flex justify-between items-center"
                                    >
                                        <span className="text-gray-700 text-center">{act.description}</span>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Líneas y sus actividades */}
                        <div className="flex-[3] flex gap-6 flex-wrap">
                            {getLinesArray(currentPlan.line).map((lineId) => (
                                <div
                                    key={lineId}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => handleDrop(lineId)}
                                    className="flex-1 min-w-[250px] border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50 transition-colors"
                                >
                                    <Text type="subtitle">{lineId}</Text>

                                    {lineActivities[lineId]?.length > 0 ? (
                                        lineActivities[lineId].map((actId) => {
                                            const act = activitiesDetails.find((a) => a.id === actId);
                                            return (
                                                <div
                                                    key={actId}
                                                    draggable
                                                    onDragStart={() => setDraggedActivityId(actId)}
                                                    className="border border-blue-300 p-3 mb-3 rounded-md cursor-grab bg-teal-50 shadow-sm hover:shadow-md transition-shadow flex justify-between items-center"
                                                >
                                                    <span className="text-gray-800 text-center">{act?.description ?? "Actividad no encontrada"}</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Para que no interfiera con el drag
                                                            removeActivityFromLine(lineId, actId);
                                                        }}
                                                        className="ml-3 text-red-500 hover:text-red-700 font-bold"
                                                        aria-label={`Eliminar actividad ${act?.description ?? ""}`}
                                                    >
                                                        &times;
                                                    </button>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-gray-400 italic">Sin actividades</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* 🔹 Maquinaria */}
                        <div>
                            <Text type="subtitle">Maquinaria</Text>
                            <select
                                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                value={currentPlan.machine || ""}
                                onChange={(e) =>
                                    setCurrentPlan({ ...currentPlan, machine: e.target.value })
                                }
                            >
                                <option value="">Seleccione una Maquina</option>
                                {machine.length > 0 ? (
                                    machine.map((machine) => (
                                        <option key={machine.id} value={machine.id}>
                                            {machine.name} {/* Mostrar el nombre */}
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>
                                        No hay maquinas disponibles
                                    </option>
                                )}
                            </select>
                        </div>
                        {/* 🔹 Recursos */}
                        <div>
                            <Text type="subtitle">Recursos</Text>
                            <textarea
                                name="resource"
                                value={currentPlan.resource || ""}
                                onChange={(e) =>
                                    setCurrentPlan({
                                        ...currentPlan,
                                        resource: e.target.value,
                                    })
                                }
                                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={4}
                            />
                        </div>
                        {/* Color */}
                        <div>
                            <Text type="subtitle">Color</Text>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {COLORS.map((color, index) => {
                                    const isSelected = currentPlan.color === color;
                                    return (
                                        <button
                                            key={`${color}-${index}`}
                                            type="button"
                                            className={`w-6 h-6 rounded-full relative flex items-center justify-center transition-shadow duration-200 ${isSelected ? "ring-2 ring-white ring-offset-2" : ""
                                                }`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => setCurrentPlan({ ...currentPlan, color })}
                                            aria-label={`Seleccionar color ${color}`}
                                        >
                                            {isSelected && (
                                                <svg
                                                    className="w-3 h-3 text-white"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="3"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        {/* Icono */}
                        <div>
                            <Text type="subtitle">Icono</Text>
                            <IconSelector
                                selectedIcon={currentPlan?.icon || ""}
                                onChange={(iconName) =>
                                    setCurrentPlan((prev) =>
                                        prev ? { ...prev, icon: iconName } : prev
                                    )
                                }
                            />
                        </div>
                        {/* 🔹 Duración */}
                        <div>
                            <Text type="subtitle">Duración
                                <InfoPopover content="Esta duracion es calculada segun la cantidad de fases que requiera multiple" />
                            </Text>
                            <input
                                type="text"
                                readOnly
                                className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 bg-gray-100 text-sm text-gray-700 text-center"
                                value={`${currentPlan.duration} min ---> ${getFormattedDuration(Number(currentPlan.duration))}`}
                            />
                        </div>

                        <div>
                            <Text type="subtitle">Duración por fase</Text>
                            <div className="w-full p-3 mt-2 text-sm text-gray-800 bg-gray-100 border rounded whitespace-pre-line">
                                {currentPlan.duration_breakdown
                                    ? formatDurationBreakdown(currentPlan.duration_breakdown)
                                    : "Sin desglose disponible"}
                            </div>
                        </div>
                        {/* 🔹 Fecha de Inicio */}
                        <div>
                            <Text type="subtitle">Fecha y Hora de Inicio</Text>
                            <input
                                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                value={currentPlan.start_date || ""}
                                type="datetime-local"
                                onChange={(e) => {
                                    const start = e.target.value;
                                    let end = "";

                                    if (currentPlan?.duration) {
                                        end = calculateEndDateRespectingWorkHours(start, Number(currentPlan.duration));
                                    } else {
                                        const fallback = new Date(start);
                                        fallback.setHours(18, 0, 0, 0);
                                        const pad = (n: number) => n.toString().padStart(2, "0");
                                        end = `${fallback.getFullYear()}-${pad(fallback.getMonth() + 1)}-${pad(fallback.getDate())}T${pad(fallback.getHours())}:${pad(fallback.getMinutes())}`;
                                    }

                                    setCurrentPlan({
                                        ...currentPlan,
                                        start_date: start,
                                        end_date: end,
                                    });
                                }}
                            />
                        </div>

                        <div>
                            <Text type="subtitle">Fecha y Hora de Final</Text>
                            <input
                                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                value={currentPlan.end_date || ""}
                                type="datetime-local"
                                onChange={(e) =>
                                    setCurrentPlan({ ...currentPlan, end_date: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button onClick={() => setIsOpen(false)} variant="cancel" label="Cancelar" />
                        <Button onClick={() => handleSave(currentPlan)} variant="save" label="Guardar" />
                    </div>
                </ModalSection>
            )}

            <Table
                columns={["client_name", "codart", "deliveryDate", "status_dates"]}
                rows={planning}
                columnLabels={{
                    client_name: "Cliente",
                    codart: "Artículo",
                    deliveryDate: "Fecha de entrega",
                    status_dates: "Estado",
                }}
                onDelete={handleDelete}
                showDeleteButton={false}
                onEdit={handleEdit}
            />
        </div>
    );
}

export default EditPlanning;
