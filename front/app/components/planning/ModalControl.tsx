import React, { useState, useEffect } from 'react';
import ModalSection from '../modal/ModalSection';
import Text from '../text/Text';
import { fase_control } from '@/app/services/planing/planingServices';
import { createTimerControl } from '@/app/services/timerControl/timerControlServices';

const ModalControl = ({ id = '' }) => {
    const [showModal, setShowModal] = useState(false);
    const [controlData, setControlData] = useState<any[]>([]);

    // 🔄 Fetch de actividades dinámicas (controlData)
    useEffect(() => {
        async function fetchControlTimer() {
            if (!id) return;
            try {
                const control = await fase_control(Number(id));
                setControlData(control);
            } catch (error) {
                console.error('Error al obtener control del timer:', error);
            }
        }
        fetchControlTimer();
    }, [id]);


    // 🧾 Actualizar valores del formulario dinámico
    const handleChange = (actividadId: number, newValue: any) => {
        setControlData(prev =>
            prev.map(act =>
                act.id_activitie === actividadId ? { ...act, valor: newValue } : act
            )
        );
    };

    // 🧠 Guardar respuestas del formulario dinámico
    const handleSaveTimerData = async () => {

        const nameCookie = document.cookie
            .split("; ")
            .find((row) => row.startsWith("name="));

        const name = nameCookie?.split("=")[1];

        if (!name) {
            console.error("❌ Usuario no encontrado en cookies");
            return;
        }

        try {
            const payload: any = {
                timer_id: id,
                user: decodeURIComponent(name),
                data: controlData.map((actividad) => {
                    let tipo = "text";
                    try {
                        const config = JSON.parse(
                            typeof actividad.config === "string" ? actividad.config : "{}"
                        );
                        if (typeof config === "string") {
                            tipo = JSON.parse(config).type || "text";
                        } else {
                            tipo = config.type || "text";
                        }
                    } catch (error) {
                        console.warn("⚠️ Config malformado en actividad", actividad, error);
                    }

                    const valor =
                        typeof actividad.valor === "object" && actividad.valor !== null
                            ? JSON.stringify(actividad.valor)
                            : actividad.valor ?? "";

                    return {
                        activity_id: actividad.id_activitie,
                        tipo,
                        descripcion: actividad.descripcion_activitie,
                        valor,
                        clave: actividad.clave,
                    };
                }),
            };
            await createTimerControl(payload);
        } catch (err) {
            console.error("❌ Error al guardar control de timer", err);
        }
    };


    return (
        <div>
            {/* Modal de control */}
            {showModal && (
                <ModalSection isVisible={showModal} onClose={() => setShowModal(false)}>
                    {controlData.length > 0 ? (
                        <div className="space-y-6 max-h-[60vh] overflow-y-auto p-4">
                            {Object.entries(
                                controlData.reduce((acc: Record<string, typeof controlData>, actividad) => {
                                    const fase = actividad.description_fase || "Sin Fase";
                                    if (!acc[fase]) acc[fase] = [];
                                    acc[fase].push(actividad);
                                    return acc;
                                }, {})
                            ).map(([fase, actividades]) => (
                                <div key={fase} className="mb-4">
                                    <Text type="title">{fase}</Text>
                                    <div className="grid gap-6">
                                        {actividades.map((actividad) => {
                                            const parseConfig = (raw: any) => {
                                                try {
                                                    if (typeof raw === "string") {
                                                        let parsed = JSON.parse(raw);
                                                        if (typeof parsed === "string") parsed = JSON.parse(parsed);
                                                        return parsed;
                                                    }
                                                    return raw ?? {};
                                                } catch (e) {
                                                    console.warn("❌ Error al parsear config:", raw, e);
                                                    return {};
                                                }
                                            };

                                            const parsedConfig = parseConfig(actividad.config);
                                            const tipo = parsedConfig.type || "text";
                                            const value = actividad.valor ?? "";
                                            const options: string[] = Array.isArray(parsedConfig.options) ? parsedConfig.options : [];

                                            const commonInputClass =
                                                "w-full border border-gray-300 p-2 pl-9 rounded-md text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-center";

                                            return (
                                                <div key={actividad.id_activitie} className="flex flex-col gap-2">
                                                    <Text type="subtitle">{actividad.descripcion_activitie}</Text>

                                                    {(() => {
                                                        switch (tipo) {
                                                            case "text":
                                                            case "email":
                                                            case "password":
                                                            case "tel":
                                                            case "url":
                                                                return (
                                                                    <input
                                                                        type={tipo}
                                                                        className={commonInputClass}
                                                                        value={value}
                                                                        onChange={(e) => handleChange(actividad.id_activitie, e.target.value)}
                                                                    />
                                                                );
                                                            case "number":
                                                                return (
                                                                    <input
                                                                        type="number"
                                                                        className={commonInputClass}
                                                                        value={value}
                                                                        onChange={(e) => handleChange(actividad.id_activitie, e.target.value)}
                                                                    />
                                                                );
                                                            case "checkbox":
                                                                return (
                                                                    <input
                                                                        type="checkbox"
                                                                        className="w-5 h-5 accent-blue-500"
                                                                        checked={value === "true" || value === true}
                                                                        onChange={(e) => handleChange(actividad.id_activitie, e.target.checked)}
                                                                    />
                                                                );
                                                            case "select":
                                                                return (
                                                                    <select
                                                                        className={commonInputClass}
                                                                        value={value}
                                                                        onChange={(e) => handleChange(actividad.id_activitie, e.target.value)}
                                                                    >
                                                                        <option value="">Seleccione...</option>
                                                                        {options.map((opt, idx) => (
                                                                            <option key={idx} value={opt}>
                                                                                {opt}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                );
                                                            case "textarea":
                                                                return (
                                                                    <textarea
                                                                        className={`${commonInputClass} resize-none`}
                                                                        rows={3}
                                                                        value={value}
                                                                        onChange={(e) => handleChange(actividad.id_activitie, e.target.value)}
                                                                    />
                                                                );
                                                            case "radio":
                                                                return (
                                                                    <div className="flex flex-wrap gap-4">
                                                                        {options.map((opt, idx) => (
                                                                            <label key={idx} className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                                                <input
                                                                                    type="radio"
                                                                                    name={`radio-${actividad.id_activitie}`}
                                                                                    value={opt}
                                                                                    checked={value === opt}
                                                                                    onChange={() => handleChange(actividad.id_activitie, opt)}
                                                                                />
                                                                                <span>{opt}</span>
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                );
                                                            case "date":
                                                            case "time":
                                                            case "datetime-local":
                                                                return (
                                                                    <input
                                                                        type={tipo}
                                                                        className={commonInputClass}
                                                                        value={value}
                                                                        onChange={(e) => handleChange(actividad.id_activitie, e.target.value)}
                                                                    />
                                                                );
                                                            case "temperature": {
                                                                const rangoMin = parsedConfig.min;
                                                                const rangoMax = parsedConfig.max;

                                                                const valor = typeof value === "number" ? value : parseFloat(value);
                                                                const fueraDeRango =
                                                                    !isNaN(valor) &&
                                                                    (rangoMin !== undefined && valor < rangoMin || rangoMax !== undefined && valor > rangoMax);

                                                                return (
                                                                    <div className="flex flex-col gap-2">
                                                                        <input
                                                                            type="number"
                                                                            step="0.1"
                                                                            placeholder={`Entre ${rangoMin} y ${rangoMax}`}
                                                                            className={`${commonInputClass} ${fueraDeRango ? "border-red-500 ring-red-500" : ""
                                                                                }`}
                                                                            value={value}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value === "" ? "" : parseFloat(e.target.value);
                                                                                handleChange(actividad.id_activitie, val);
                                                                            }}
                                                                        />
                                                                        {fueraDeRango && (
                                                                            <p className="text-sm text-black bg-red-300 p-2 rounded-md mt-1 text-center">
                                                                                ⚠️ El valor debe estar entre {rangoMin}°C y {rangoMax}°C
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                );
                                                            }

                                                            case "color":
                                                                return (
                                                                    <input
                                                                        type="color"
                                                                        className="w-12 h-10 p-1 rounded border border-gray-300 dark:border-gray-600"
                                                                        value={value}
                                                                        onChange={(e) => handleChange(actividad.id_activitie, e.target.value)}
                                                                    />
                                                                );
                                                            case "file":
                                                                return (
                                                                    <input
                                                                        type="file"
                                                                        className="block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                                                                        onChange={(e) => handleChange(actividad.id_activitie, e.target.files?.[0] ?? null)}
                                                                    />
                                                                );
                                                            default:
                                                                return (
                                                                    <input
                                                                        type="text"
                                                                        className={commonInputClass}
                                                                        value={value}
                                                                        onChange={(e) => handleChange(actividad.id_activitie, e.target.value)}
                                                                    />
                                                                );
                                                        }
                                                    })()}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center">No hay actividades disponibles</p>
                    )}


                    {/* Botones de acción */}
                    <hr className="my-4 border-t border-gray-600 w-full max-w-lg mx-auto opacity-60" />
                    <div className="flex justify-center gap-4 mt-6">
                        <button
                            onClick={() => {
                                setShowModal(false);
                                handleSaveTimerData();
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700"
                        >
                            Guardar y cerrar
                        </button>
                    </div>
                </ModalSection>
            )}

        </div>
    )
}

export default ModalControl
