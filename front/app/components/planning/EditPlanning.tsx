import React, { useState, useEffect, useCallback, useMemo } from "react";
import { COLORS } from "@/app/constants/colors";
// 🔹 Componentes
import Button from "../buttons/buttons";
import { showSuccess, showError } from "../toastr/Toaster";
import Table from "../table/Table";
import Text from "../text/Text";
import { IconSelector } from "../dinamicSelect/IconSelector";
import ModalSection from "../modal/ModalSection";
import { InfoPopover } from "../buttons/InfoPopover";
import { CreateClientProps } from "../../interfaces/CreateClientProps";
import { MachinePlanning } from "../../interfaces/NewMachine"
import { UserPlaning } from "../../interfaces/CreateUser"
import SelectorDual from "../SelectorDual/SelectorDual"
import DateLoader from '@/app/components/loader/DateLoader';
// 🔹 Servicios 
import { getPlanning, updatePlanning, getActivitiesByPlanning, getPlanningById, validate_orden } from "../../services/planing/planingServices";
import { getActivitieId } from "../../services/maestras/activityServices"
import { getClientsId } from "@/app/services/userDash/clientServices";
import { getFactory } from "@/app/services/userDash/factoryServices";
import { getManu } from "@/app/services/userDash/manufacturingServices";
import { getMachin } from "@/app/services/userDash/machineryServices";
import { getManuId } from "@/app/services/userDash/manufacturingServices";
import { getUsers } from "@/app/services/userDash/authservices"
import { actividades_ejecutadas } from "@/app/services/planing/planingServices";
// 🔹 Interfaces
import { Plan, ActivityDetail, sanitizePlan, ServerPlan, DurationItem, PlanServ } from "@/app/interfaces/EditPlanning";

function EditPlanning({ canEdit = false, canView = false }: CreateClientProps) {
    const [planning, setPlanning] = useState<Plan[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
    const [factories, setFactories] = useState<{ id: number, name: string }[]>([]);
    const [manu, setManu] = useState<{ id: number, name: string }[]>([]);
    const [machine, setMachine] = useState<{ id: number, name: string }[]>([]);
    const [user, setUser] = useState<{ id: number, name: string }[]>([]);
    const [activitiesDetails, setActivitiesDetails] = useState<ActivityDetail[]>([]);
    const [lineActivities, setLineActivities] = useState<Record<number, number[]>>({});
    const [draggedActivityId, setDraggedActivityId] = useState<number | null>(null);
    const [lineDetails, setLineDetails] = useState<Record<number, { name: string }>>({});
    const [selectedMachines, setSelectedMachines] = useState<MachinePlanning[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<UserPlaning[]>([]);
    const [isSaving, setIsSaving] = useState(false);


    const fetchAll = useCallback(async () => {
        try {
            const [planningData, factoriesData, manuData, machineData, userData] = await Promise.all([
                getPlanning(),
                getFactory(),
                getManu(),
                getMachin(),
                getUsers(),
            ]);
            const clientCache = new Map<number, { name: string }>();
            const updatedPlanning = await Promise.all(
                planningData.map(async (plan: Plan) => {
                    if (!clientCache.has(plan.client_id)) {
                        const clientData = await getClientsId(plan.client_id);
                        clientCache.set(plan.client_id, clientData);
                    }
                    return {
                        ...plan,
                        client_name: clientCache.get(plan.client_id)!.name,
                    };
                })
            );
            setPlanning(updatedPlanning);
            setFactories(factoriesData);
            setManu(manuData);
            setMachine(machineData);
            setUser(userData);
        } catch (error) {
            showError("Error cargando datos iniciales");
            console.error("Error en fetchAll:", error);
        }
    }, []);

    useEffect(() => {
        if (canView) {
            fetchAll();
        }
    }, [fetchAll, canView]);

    useEffect(() => {
        if (!currentPlan) return;
        setLineActivities((prev) => {
            if (Object.keys(prev).length > 0) return prev;
            if (currentPlan.lineActivities && Object.keys(currentPlan.lineActivities).length > 0) {
                return currentPlan.lineActivities;
            }
            let keys: number[] = [];
            if (Array.isArray(currentPlan.line)) {
                keys = currentPlan.line;
            } else if (typeof currentPlan.line === 'string') {
                try {
                    keys = JSON.parse(currentPlan.line);
                } catch {
                    keys = [];
                }
            }
            const initial = keys.reduce((acc, lineId) => {
                acc[lineId] = [];
                return acc;
            }, {} as Record<number, number[]>);

            return initial;
        });
    }, [currentPlan]);

    useEffect(() => {
        const fetchLineDetails = async () => {
            if (!currentPlan || !currentPlan.line) {
                setLineDetails({});
                return;
            }
            const lines = getLinesArray(currentPlan.line);
            const details: Record<number, { name: string }> = {};
            await Promise.all(
                lines.map(async (lineId) => {
                    try {
                        const data = await getManuId(lineId);
                        details[lineId] = data;
                    } catch (err) {
                        console.error(`Error cargando línea ${lineId}`, err);
                        details[lineId] = { name: `Línea ${lineId} ` };
                    }
                })
            );
            setLineDetails(details);
        };
        fetchLineDetails();
    }, [currentPlan]);

    useEffect(() => {
        if (!currentPlan) return;

        setLineActivities((prev) => {
            const currentLines = getLinesArray(currentPlan.line);
            // Nuevo objeto sólo con las líneas activas
            const newLineActivities: Record<number, number[]> = {};

            // Mantén las actividades de las líneas existentes
            currentLines.forEach(lineId => {
                newLineActivities[lineId] = prev[lineId] || [];
            });

            return newLineActivities;
        });
    }, [currentPlan?.line]);


    function calculateEndDateRespectingWorkHours(start: string, durationMinutes: number): string {
        const WORK_START_HOUR = 6;
        const WORK_END_HOUR = 18;

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

        const pad = (n: number) => n.toString().padStart(2, "0");
        return `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}T${pad(current.getHours())}:${pad(current.getMinutes())}`;
    }

    const handleSave = async (updatedPlan: Plan) => {
        if (isSaving) return;
        setIsSaving(true);
        if (!updatedPlan) {
            showError("No hay datos para guardar.");
            setIsSaving(false);
            return;
        }
        try {
            const cleanedPlan = sanitizePlan(updatedPlan);
            const lines: number[] = getLinesArray(updatedPlan.line);
            const hasEmptyLines = lines.some(lineId => {
                const activityIds = lineActivities[lineId] || [];
                return activityIds.length === 0;
            });

            if (hasEmptyLines) {
                showError("Hay líneas sin actividades asignadas. Por favor, completa todas antes de guardar.");
                setIsSaving(false);
                return;
            }
            const formattedLines = lines.map(lineId => {
                const activityIdsInLine = lineActivities[lineId] || [];
                const filteredActivities = (activitiesDetails || []).filter(activity =>
                    activityIdsInLine.includes(activity.id)
                );
                return {
                    id: lineId,
                    activities: filteredActivities.map(activity => ({ id: activity.id })),
                };
            });
            const planToSave: PlanServ = {
                ...cleanedPlan,
                adaptation_id: updatedPlan.adaptation_id,
                factory: updatedPlan.factory,
                orderNumber: updatedPlan.orderNumber,
                number_order: updatedPlan.number_order,
                color: currentPlan?.color ?? undefined,
                icon: currentPlan?.icon ?? undefined,
                line: lines,
                activities: formattedLines,
                users: selectedUsers.map(u => u.id),
                machine: selectedMachines.map(m => m.id),
                duration: updatedPlan.duration?.toString() ?? undefined,
                duration_breakdown: updatedPlan.duration_breakdown,
                status_dates: updatedPlan.status_dates,
                created_at: updatedPlan.created_at,
                client_name: updatedPlan.client_name,
                start_date: updatedPlan.start_date,
                end_date: updatedPlan.end_date,
                activitiesDetails: updatedPlan.activitiesDetails,
                lineActivities: updatedPlan.lineActivities,
            };
            await updatePlanning(updatedPlan.id, planToSave);
            await fetchAll();
            setIsOpen(false);
            handleClose();
            showSuccess("Planificación guardada correctamente");
        } catch (error) {
            console.error("Error al guardar cambios:", error);
            showError("Error al guardar la planificación");
        } finally {
            setIsSaving(false); // Desactiva loading
        }
    };

    const handleEdit = useCallback(async (id: number) => {
        const selectedPlan = planning.find((plan: Plan) => plan.id === id);
        if (!selectedPlan) {
            showError("Planificación no encontrada localmente");
            return;
        }
        try {
            const serverPlansWithDetails: ServerPlan[] = await fetchAndProcessPlans(id);
            if (!serverPlansWithDetails || serverPlansWithDetails.length === 0) {
                showError("No se encontró información detallada en el servidor.");
                return;
            }
            const matchedPlan = serverPlansWithDetails.find(
                p => p.ID_ADAPTACION === selectedPlan.id
            ) || serverPlansWithDetails[0];

            if (!matchedPlan) {
                showError("No se encontraron detalles del plan.");
                return;
            }

            const activitiesDetails = matchedPlan.activitiesDetails ?? [];
            const planActivities = selectedPlan.activities ?? [];
            const newLineActivities: Record<number, number[]> = {};

            // ✅ Usamos plan.activities que tiene la relación correcta línea → actividades
            planActivities.forEach((activity: ActivityDetail) => {
                const binding = activity.binding;
                const activityId = activity.id;

                if (Array.isArray(binding)) {
                    binding.forEach(lineId => {
                        const lineKey = Number(lineId);
                        if (!newLineActivities[lineKey]) newLineActivities[lineKey] = [];
                        if (!newLineActivities[lineKey].includes(activityId)) {
                            newLineActivities[lineKey].push(activityId);
                        }
                    });
                } else if (typeof binding === "number" || typeof binding === "string") {
                    const lineKey = Number(binding);
                    if (!newLineActivities[lineKey]) newLineActivities[lineKey] = [];
                    if (!newLineActivities[lineKey].includes(activityId)) {
                        newLineActivities[lineKey].push(activityId);
                    }
                }
            });

            // 🧲 Ahora complementamos con los bindings directos de activitiesDetails
            if (Array.isArray(activitiesDetails)) {
                activitiesDetails.forEach((activity: ActivityDetail) => {
                    const binding = activity.binding;
                    if (Array.isArray(binding)) {
                        binding.forEach(lineId => {
                            const lineKey = Number(lineId);
                            if (!newLineActivities[lineKey]) newLineActivities[lineKey] = [];
                            if (!newLineActivities[lineKey].includes(activity.id)) {
                                newLineActivities[lineKey].push(activity.id);
                            }
                        });
                    } else if (typeof binding === "number" || typeof binding === "string") {
                        const lineKey = Number(binding);
                        if (!newLineActivities[lineKey]) newLineActivities[lineKey] = [];
                        if (!newLineActivities[lineKey].includes(activity.id)) {
                            newLineActivities[lineKey].push(activity.id);
                        }
                    }
                });
            }

            // ✅ Seteamos todo lo necesario
            setLineActivities(newLineActivities);
            setActivitiesDetails(activitiesDetails);
            setSelectedMachines(
                machine.filter(m => (selectedPlan.machine || []).includes(m.id))
            );
            setSelectedUsers(
                user.filter(u => (selectedPlan.users || []).includes(u.id))
            );

            const fullPlan: Plan = {
                ...selectedPlan,
                activitiesDetails: activitiesDetails,
                lineActivities: newLineActivities,
                line: getLinesArray(selectedPlan.line),
            };

            setCurrentPlan(fullPlan);
            setIsOpen(true);
        } catch (error) {
            console.error("❌ Error fetching plan:", error);
            showError("Error al cargar la planificación para edición");
        }
    }, [planning, machine, user]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setCurrentPlan(null);
        setLineActivities({});
        setActivitiesDetails([]);
        setDraggedActivityId(null);
        setSelectedMachines([]);
        setSelectedUsers([]);
    }, []);

    const handleDelete = useCallback(() => {
        // console.log("Eliminar", id);
    }, []);

    const getFormattedDuration = (input: number | string): string => {
        let totalSeconds = 0;

        if (typeof input === "string") input = input.replace(",", ".");
        const num = typeof input === "number" ? input : parseFloat(input);

        if (isNaN(num) || num <= 0) return "0 seg";

        // Si el número tiene decimales, los decimales son segundos (ej: 0.10 => 10 seg)
        const [minStr, secStr] = num.toString().split(".");
        const mins = parseInt(minStr, 10) || 0;
        const secs = secStr ? parseInt(secStr.padEnd(2, "0").slice(0, 2), 10) : 0;
        totalSeconds = mins * 60 + secs;

        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const parts: string[] = [];
        const pushPart = (value: number, singular: string, plural: string = singular + 's') => {
            if (value > 0) parts.push(`${value} ${value === 1 ? singular : plural}`);
        };

        pushPart(days, 'día');
        pushPart(hours, 'hora');
        pushPart(minutes, 'min', 'min');

        const shouldShowSeconds = totalSeconds < 3600 && seconds > 0 && days === 0 && hours === 0;
        if (shouldShowSeconds) {
            pushPart(seconds, 'seg', 'seg');
        }

        return parts.join(' ');
    };

    function formatDurationBreakdown(breakdown: string | DurationItem[]): string {
        const parsed: DurationItem[] = typeof breakdown === "string" ? JSON.parse(breakdown) : breakdown;
        return parsed
            .map((item: DurationItem) => {
                if (item.fase === "TOTAL") {
                    return `🧮 TOTAL → ${getFormattedDuration(item.resultado)}`;
                }

                const { teorica_total, multiplicacion, resultado } = item;

                if (multiplicacion && teorica_total) {
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

            // ⛔ No agregar si ya existe en esta línea
            if (updated[lineId]?.includes(draggedActivityId)) return prev;

            updated[lineId] = [...(updated[lineId] || []), draggedActivityId];
            return updated;
        });

        setDraggedActivityId(null);
    };

    const removeActivityFromLine = (lineId: number, actId: number) => {
        setLineActivities((prev) => {
            const updated = { ...prev };
            if (updated[lineId]) {
                updated[lineId] = updated[lineId].filter(id => id !== actId);
            }
            return updated;
        });
    };

    function getLinesArray(line: string | number[] | null): number[] {
        if (Array.isArray(line)) return line;
        if (typeof line === 'string') {
            try {
                return JSON.parse(line);
            } catch {
                return [];
            }
        }
        return [];
    }

    const availableActivities = useMemo(() => activitiesDetails, [activitiesDetails]);

    async function fetchAndProcessPlans(id: number) {
        const { plan: serverPlans = [] } = await getActivitiesByPlanning(id);
        if (!Array.isArray(serverPlans) || serverPlans.length === 0) {
            throw new Error("Planificación no encontrada desde servidor");
        }
        const serverPlansWithDetails = await Promise.all(
            serverPlans.map(async (line) => {
                const activitiesDetails = Array.isArray(line.ID_ACTIVITIES)
                    ? await Promise.all(line.ID_ACTIVITIES.map(getActivitieId))
                    : [];
                return { ...line, activitiesDetails };
            })
        );
        return serverPlansWithDetails;
    }

    const handleTerciario = useCallback(async (id: number) => {
        const { plan } = await getPlanningById(id);

        // Validar si la orden tiene linea asignada
        if (plan.line === null || plan.line.length < 3) {
            showError("No se asignó línea a la planificación");
            return;
        }

        if (plan.status_dates === null || plan.status_dates === "En Creación") {
            showError("Orden no planificada, debe completar la planificación");
            return;
        }

        localStorage.removeItem("ejecutar");

        const data = await validate_orden(plan.id);
        if (data.estado === 100 || data.estado === null) {
            const user = document.cookie
                .split('; ')
                .find(row => row.startsWith('name='))
                ?.split('=')[1];

            if (!user) {
                showError("No se encontró usuario");
                return;
            }

            localStorage.setItem("ejecutar", JSON.stringify({
                id: plan.id,
                user: user
            }));

            window.open("/pages/lineas", "_blank");
            handleClose();
        } else {
            showError("La orden ya fue finalizada. Estado: " + data.estado);
            fetchAll();
        }
    }, [fetchAll, handleClose]);

    //Componente SelectorDual
    const agregarMaquina = (machine: MachinePlanning) => {
        if (!selectedMachines.find(m => m.id === machine.id)) {
            setSelectedMachines([...selectedMachines, machine]);
        }
    };

    const removerMaquina = (id: number) => {
        setSelectedMachines(selectedMachines.filter(m => m.id !== id));
    };

    const agregarUser = (user: UserPlaning) => {
        if (!selectedUsers.find(m => m.id === user.id)) {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    const removerUser = (id: number) => {
        setSelectedUsers(selectedUsers.filter(m => m.id !== id));
    };

    const handlePDF = useCallback((id: number) => {
        window.open(`/pages/pdfGeneral/${id}`,);
    }, []);

    const obtenerActividades = useCallback(async (id: number) => {
        const { plan } = await getPlanningById(id);
        if (!plan?.id) {
            showError("No se pudo obtener el ID de planificación");
            return;
        }
        try {
            const data = await actividades_ejecutadas(plan.id);
            if (data?.actividades) {
                window.open(`/pages/detalle/${plan.id}`);
            }
        } catch (error) {
            console.error('Error al obtener fases:', error);
        }
    }, []);


    return (
        <div className="break-inside-avoid mb-4">

            {isSaving && (
                <DateLoader message="Cargando..." backgroundColor="rgba(0, 0, 0, 0.28)" color="rgba(255, 255, 0, 1)" />
            )}

            {isOpen && currentPlan && (
                <ModalSection isVisible={isOpen} onClose={() => { setIsOpen(false) }}>
                    <Text type="title" color="text-[#000]">Editar Acondicionamiento</Text>
                    <h2 className="text-xl font-bold mb-6">Editar planificación</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="break-inside-avoid mb-4">
                            <Text type="subtitle" color="#000">Consecutivo</Text>
                            <input
                                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                readOnly
                                value={currentPlan.number_order}
                                onChange={(e) =>
                                    setCurrentPlan({ ...currentPlan, number_order: e.target.value })
                                }
                                disabled={!canEdit}
                            />
                        </div>
                        {/* 🔹 Artículo */}
                        <div className="break-inside-avoid mb-4">
                            <Text type="subtitle" color="#000">Artículo</Text>
                            <input
                                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                readOnly
                                value={currentPlan.codart}
                                onChange={(e) =>
                                    setCurrentPlan({ ...currentPlan, codart: e.target.value })
                                }
                                disabled={!canEdit}
                            />
                        </div>
                        {/* 🔹 Fecha de entrega */}
                        <div className="break-inside-avoid mb-4">
                            <Text type="subtitle" color="#000">Fecha de entrega</Text>
                            <input
                                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                type="date"
                                readOnly
                                value={currentPlan.deliveryDate}
                                onChange={(e) =>
                                    setCurrentPlan({ ...currentPlan, deliveryDate: e.target.value })
                                }
                                disabled={!canEdit}
                            />
                        </div>
                        {/* 🔹 Registro Sanitario */}
                        <div className="break-inside-avoid mb-4">
                            <Text type="subtitle" color="#000">Registro Sanitario</Text>
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
                                disabled={!canEdit}
                            />
                        </div>
                        {/* 🔹 Lote */}
                        <div className="break-inside-avoid mb-4">
                            <Text type="subtitle" color="#000">Lote</Text>
                            <input
                                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                value={currentPlan.lot}
                                readOnly
                                onChange={(e) =>
                                    setCurrentPlan({ ...currentPlan, lot: e.target.value })
                                }
                                disabled={!canEdit}
                            />
                        </div>
                        {/* 🔹 N° de orden */}
                        <div className="break-inside-avoid mb-4">
                            <Text type="subtitle" color="#000">N° de orden</Text>
                            <input
                                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                value={currentPlan.orderNumber}
                                readOnly
                                onChange={(e) =>
                                    setCurrentPlan({ ...currentPlan, orderNumber: e.target.value })
                                }
                                disabled={!canEdit}
                            />
                        </div>
                        {/* 🔹 Cantidad a producir */}
                        <div className="break-inside-avoid mb-4">
                            <Text type="subtitle" color="#000">Cantidad a producir</Text>
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
                                disabled={!canEdit}
                            />
                        </div>
                        {/* 🔹 Cliente */}
                        <div className="break-inside-avoid mb-4">
                            <Text type="subtitle" color="#000">Cliente</Text>
                            <input
                                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                value={currentPlan.client_name || ""}
                                readOnly
                                onChange={(e) =>
                                    setCurrentPlan({ ...currentPlan, client_name: e.target.value })
                                }
                                disabled={!canEdit}
                            />
                        </div>
                        {/* 🔹 Planta */}
                        <div className="break-inside-avoid mb-4">
                            <Text type="subtitle" color="#000">Planta</Text>
                            <input
                                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                value={
                                    factories.find(f => f.id === currentPlan.factory_id)?.name || ""
                                }
                                readOnly
                                disabled={!canEdit}
                            />
                        </div>
                        {/* 🔹 Lineas */}
                        <div className="break-inside-avoid mb-4">
                            <Text type="subtitle" color="#000">Líneas</Text>
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
                                        disabled={!canEdit}
                                    >
                                        {manu.length > 0 ? (
                                            manu
                                                .filter(line => !(currentPlan.line ?? []).includes(line.id))
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
                                                        disabled={!canEdit}
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
                        <div className="break-inside-avoid mb-4">
                            <div className="flex-1 border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-sm transition-all max-h-64 overflow-y-auto scrollbar-thin">
                                <Text type="subtitle" color="#000">Actividades disponibles</Text>
                                {availableActivities.map((act) => {
                                    const isDisabled = !canEdit;
                                    return (
                                        <div
                                            key={act.id}
                                            draggable={!isDisabled}
                                            onDragStart={() => {
                                                if (!isDisabled) setDraggedActivityId(act.id);
                                            }}
                                            className={`border border-gray-300 p-3 mb-3 rounded-md ${isDisabled
                                                ? "cursor-not-allowed bg-gray-100 text-gray-900"
                                                : "cursor-grab bg-white hover:shadow"
                                                } shadow-sm transition-shadow flex justify-between items-center`}
                                            title={isDisabled ? "No tienes permiso para arrastrar actividades" : ""}
                                        >
                                            <span className="text-gray-700 text-center">{act.description}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        {/* Líneas y sus actividades */}
                        <div className="break-inside-avoid mb-4">
                            <div className="flex-[3] flex gap-6 flex-wrap">
                                {!currentPlan || !currentPlan.line ? (
                                    <p>No hay líneas disponibles.</p>
                                ) : (
                                    getLinesArray(currentPlan.line).map((lineId) => {
                                        const activitiesForLine = lineActivities[lineId];
                                        return (
                                            <div
                                                key={lineId}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={() => handleDrop(lineId)}
                                                className="flex-1 min-w-[250px] border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50 transition-colors"
                                            >
                                                <Text type="subtitle" color="#000">
                                                    {lineDetails[lineId]?.name || `Línea ${lineId}`}
                                                </Text>

                                                {Array.isArray(activitiesForLine) && activitiesForLine.length > 0 ? (
                                                    activitiesForLine.map((actId) => {
                                                        const act = activitiesDetails.find((a) => a.id === actId);
                                                        if (!act) {
                                                            return (
                                                                <p key={actId} className="text-red-400 italic">
                                                                    Actividad no encontrada (ID: {actId})
                                                                </p>
                                                            );
                                                        }

                                                        return (
                                                            <div
                                                                key={act.id}
                                                                draggable
                                                                onDragStart={() => setDraggedActivityId(act.id)}
                                                                className="border border-blue-300 p-3 mb-3 rounded-md cursor-grab bg-teal-50 shadow-sm hover:shadow-md transition-shadow flex justify-between items-center"
                                                            >
                                                                <span className="text-gray-800 text-center">{act.description}</span>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        removeActivityFromLine(lineId, act.id);
                                                                    }}
                                                                    className="ml-3 text-red-500 hover:text-red-700 font-bold"
                                                                    aria-label={`Eliminar actividad ${act.description}`}
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
                                        );
                                    })
                                )}
                            </div>
                        </div>
                        {/* 🔹 Maquinaria */}
                        <div className="break-inside-avoid mb-4">
                            <SelectorDual
                                titulo="Maquinaria"
                                disponibles={machine}
                                seleccionados={selectedMachines}
                                onAgregar={agregarMaquina}
                                onQuitar={removerMaquina}
                            />
                        </div>
                        <div className="break-inside-avoid mb-4">
                            <SelectorDual
                                titulo="Usuarios"
                                disponibles={user}
                                seleccionados={selectedUsers}
                                onAgregar={agregarUser}
                                onQuitar={removerUser}
                            />
                        </div>
                        {/* 🔹 Recursos */}
                        <div className="break-inside-avoid mb-4">
                            <Text type="subtitle" color="#000">Recursos</Text>
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
                        <div className="break-inside-avoid mb-4">
                            <Text type="subtitle" color="#000">Color</Text>
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
                        <div className="break-inside-avoid mb-4">
                            <Text type="subtitle" color="#000">Icono</Text>
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
                        <div className="break-inside-avoid mb-4">
                            <Text type="subtitle" color="#000">Duración
                                <InfoPopover content="Esta duracion es calculada segun la cantidad de fases que requiera multiple" />
                            </Text>
                            <input
                                type="text"
                                readOnly
                                className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 bg-gray-100 text-sm text-gray-700 text-center"
                                value={`${currentPlan.duration} min ---> ${getFormattedDuration(Number(currentPlan.duration))}`}
                            />
                        </div>
                        {/* 🔹 Fecha de Inicio */}
                        <div className="break-inside-avoid mb-4">
                            <Text type="subtitle" color="#000">Fecha y Hora de Inicio</Text>
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
                        <div className="break-inside-avoid mb-4">
                            <Text type="subtitle" color="#000">Duración por fase</Text>
                            <div className="w-full p-3 mt-2 text-sm text-gray-800 bg-gray-100 border rounded whitespace-pre-line">
                                {currentPlan.duration_breakdown
                                    ? formatDurationBreakdown(currentPlan.duration_breakdown)
                                    : "Sin desglose disponible"}
                            </div>
                        </div>

                        <div className="break-inside-avoid mb-4">
                            <Text type="subtitle" color="#000">Fecha y Hora de Final</Text>
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

                    <div className="flex justify-center gap-2 mt-6">
                        <Button onClick={() => setIsOpen(false)} variant="cancel" label="Cancelar" />
                        {currentPlan?.status_dates !== "Planificación" && currentPlan?.status_dates !== "En ejecución" && (
                            <Button
                                onClick={async () => {
                                    if (isSaving) return;
                                    setIsSaving(true);
                                    try {
                                        const updatedPlanWithStatus = {
                                            ...currentPlan,
                                            status_dates: "Planificación",
                                        };
                                        await handleSave(updatedPlanWithStatus);
                                    } catch (err) {
                                        console.error("Error al finalizar edición:", err);
                                    } finally {
                                        setIsSaving(false);
                                    }
                                }}
                                variant="terciario"
                                disabled={isSaving}
                                label={isSaving ? "Guardando..." : "Planificar y Guardar"}
                            />
                        )}
                        <Button onClick={() => handleSave(currentPlan)} variant="save" label="Guardar" />
                    </div>
                </ModalSection>
            )}

            <Table
                columns={["client_name", "number_order", "codart", "factory", "status_dates"]}
                rows={planning}
                columnLabels={{
                    client_name: "Cliente",
                    number_order: "N° de orden",
                    codart: "Artículo",
                    factory: "Planta",
                    status_dates: "Estado",
                }}
                onDelete={handleDelete}
                showDeleteButton={false}
                showTerciarioButton={true}
                showViewButton={true}
                onEdit={handleEdit}
                onTerciario={handleTerciario}
                onView={obtenerActividades}
                onPDF={handlePDF}
                showTerciarioCondition={(row) => row.status_dates === "Planificación" || row.status_dates === "En ejecución"} // 👈 Aquí va tu condición
                showViewCondition={(row) => row.status_dates === "Ejecutado" || row.status_dates === "En ejecución"}
                showPDFCondition={(row) => row.status_dates === "Ejecutado"}
            />

        </div>
    );
}

export default EditPlanning;
