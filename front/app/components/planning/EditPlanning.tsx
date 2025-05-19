import React, { useState, useEffect, useCallback } from "react";
import { motion, number } from "framer-motion";
import { COLORS } from "@/app/constants/colors";
// 🔹 Componentes
import Button from "../buttons/buttons";
import { showSuccess, showError } from "../toastr/Toaster";
import Table from "../table/Table";
import Text from "../text/Text";
import { IconSelector } from "../dinamicSelect/IconSelector";
// 🔹 Servicios 
import { getPlanning, updatePlanning } from "../../services/planing/planingServices";
import { getClientsId } from "@/app/services/userDash/clientServices";
import { getFactory, getFactoryId } from "@/app/services/userDash/factoryServices";
import { getManu, getManuId } from "@/app/services/userDash/manufacturingServices";
import { getMachin, getMachinById } from "@/app/services/userDash/machineryServices";
import { getMaestraId } from "@/app/services/maestras/maestraServices";
// 🔹 Interfaces
import { Plan } from "@/app/interfaces/EditPlanning";

function EditPlanning() {
    const [planning, setPlanning] = useState<Plan[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
    const [factories, setFactories] = useState<{ id: number, name: string }[]>([]);
    const [manu, setManu] = useState<{ id: number, name: string }[]>([]);
    const [machine, setMachine] = useState<{ id: number, name: string }[]>([]);

    useEffect(() => {
        const fetchPlanning = async () => {
            try {
                const response = await getPlanning();
                console.log("Response from getPlanning:", response);
                const updatedPlanning: Plan[] = await Promise.all(
                    response.map(async (plan: Plan) => {
                        const clientData = await getClientsId(plan.client_id);
                        const factoryData = plan.factory ? await getFactoryId(Number(plan.factory)) : { name: "—" };
                        const manuData = plan.line ? await getManuId(Number(plan.line)) : { name: "—" };
                        const machineData = plan.machine ? await getMachinById(Number(plan.machine)) : { name: "—" };
                        return {
                            ...plan,
                            client_name: clientData.name,
                            factoryName: factoryData.name,
                            lineName: manuData.name,
                            machineName: machineData.name,
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

    const handleSave = async (updatedPlan: Plan) => {
        if (!updatedPlan) {
            showError("No hay datos para guardar.");
            return;
        }
        try {
            const master = await getMaestraId(Number(updatedPlan.master));
            const updatedWithDuration = {
                ...updatedPlan,
                duration: master.duration,
            };
            await updatePlanning(updatedWithDuration.id, updatedWithDuration);
            showSuccess("Planificación actualizada");
            setPlanning(prev =>
                prev.map(plan =>
                    plan.id === updatedWithDuration.id ? updatedWithDuration : plan
                )
            );
            setIsOpen(false);
        } catch (error) {
            console.error("Error al guardar cambios:", error);
            showError("Error al guardar la planificación");
        }
    };

    const handleEdit = useCallback((id: number) => {
        const selectedPlan = planning.find(plan => plan.id === id);
        if (selectedPlan) {
            setCurrentPlan(selectedPlan);
            setIsOpen(true);
        }
    }, [planning]);

    const handleDelete = useCallback((id: number) => {
        console.log("Eliminar", id);
    }, []);

    return (
        <div>
            {isOpen && currentPlan && (
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
                                    value={currentPlan.factory || ""}  // Asegúrate de que factory esté presente
                                    onChange={(e) =>
                                        setCurrentPlan({ ...currentPlan, factory: e.target.value })
                                    }
                                >
                                    <option value="">Seleccione una planta</option>
                                    {factories.length > 0 ? (
                                        factories.map((factory) => (
                                            <option key={factory.id} value={factory.id}>
                                                {factory.name} {/* Mostrar el nombre */}
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
                                <Text type="subtitle">Lineas</Text>
                                <select
                                    className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                    value={currentPlan.line || ""}
                                    onChange={(e) =>
                                        setCurrentPlan({ ...currentPlan, line: e.target.value })
                                    }
                                >
                                    <option value="">Seleccione una planta</option>
                                    {manu.length > 0 ? (
                                        manu.map((line) => (
                                            <option key={line.id} value={line.id}>
                                                {line.name} {/* Mostrar el nombre */}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="" disabled>
                                            No hay lineas disponibles
                                        </option>
                                    )}
                                </select>
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
                    </motion.div>
                </motion.div>
            )}

            <Table
                columns={["client_name", "codart", "deliveryDate", "status_dates", "factoryName", "lineName", "machineName"]}
                rows={planning}
                columnLabels={{
                    client_name: "Cliente",
                    codart: "Artículo",
                    deliveryDate: "Fecha de entrega",
                    status_dates: "Estado",
                    factoryName: "Planta",
                    lineName: "Lineas",
                    machineName: "Maquinaria",
                }}
                onDelete={handleDelete}
                showDeleteButton={false}
                onEdit={handleEdit}
            />
        </div>
    );
}

export default EditPlanning;
