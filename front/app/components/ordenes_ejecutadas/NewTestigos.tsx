import React, { useRef, useState, useEffect, FormEvent } from 'react'
import { useParams } from 'next/navigation'
import { showSuccess, showError } from "../toastr/Toaster";
import Text from "../text/Text";
import Button from "../buttons/buttons";
import { getActividadesTestigos } from '@/app/services/planing/planingServices';
import FirmaB64 from './FirmaB64';
import axios from 'axios';
import { API_URL } from '@/app/config/api';

function serializeMemValue(v: MemValue): string {
    if (v == null) return "";
    if (Array.isArray(v)) {
        if (v.length > 0 && v[0] instanceof File) {
            return (v as File[]).map((f) => f.name).join(", ");
        }
        return (v as string[]).join(", ");
    }
    if (v instanceof File) return v.name;
    return String(v);
}

// Se crea una instancia de axios con la configuración base de la API.
const Planning = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

type MemValue =
    | string
    | number
    | string[]
    | File
    | File[]
    | boolean
    | null
    | undefined;

type FaseTestigos = {
    descripcion: string;
    phase_type: string;
    // Estos campos se usan al enviar; pueden no venir siempre
    adaptation_date_id?: number | string;
    fase_id?: number | string;
    activities?: unknown; // no asumimos estructura aquí
    // posicion?: number | string; // si lo necesitas, descomenta
};

type ApiActividadesResponse = {
    fase_testigo: FaseTestigos;
    actividades: Actividad[];
};


type BaseConfig =
    | { type: "text" | "textarea" }
    | { type: "number"; min?: number; max?: number; step?: number }
    | { type: "temperature"; min?: number; max?: number }
    | { type: "date" | "time" }
    | { type: "select" | "radio"; options: string[] }
    | { type: "checkbox"; options: string[] }
    | { type: "file" | "image"; accept?: string; multiple?: boolean }
    | { type: "signature" };

type ActividadConfig = BaseConfig;

type Actividad = {
    id: number;
    description: string;
    // Puede llegar string JSON o ya objeto
    config: string | ActividadConfig;
    binding: boolean;
    // se completan al enviar
    clave?: string;
    valor?: string;
};

type MemoriaActividades = Record<string, MemValue>;
type MemoriaFase = { fase_testigo?: FaseTestigos };
type LocalSession = { user?: string | number } | null;

// Intenta parsear hasta dos veces por si viene doblemente encadenado
function parseConfig(raw: Actividad["config"]): ActividadConfig | null {
    let val: unknown = raw;
    for (let i = 0; i < 2; i++) {
        if (typeof val === "string") {
            try {
                val = JSON.parse(val);
            } catch {
                break;
            }
        }
    }
    if (typeof val === "object" && val !== null && "type" in (val as object)) {
        return val as ActividadConfig;
    }
    return null;
}

type GuardarActividadesPayload = {
    adaptation_date_id?: number | string;
    descripcion?: string;
    fase_id?: number | string;
    activities?: unknown;
    phase_type?: string;
    forms: string;
    user: string | number | "";
};

type GuardarActividadesResponse = {
    estado: number;
    // la API puede devolver más cosas
    [k: string]: unknown;
};

export const guardar_actividades_testigos = async (
    data: GuardarActividadesPayload
) => {
    try {
        const response = await Planning.post(`/guardar_actividades_testigos`, data);
        console.log(response.data);
        return response.data;
    } catch (error: unknown) {
        showError("Error en guardar actividades testigos");
        throw error;
    }
};

const NewTestigos = () => {
    const params = useParams();
    const ref = useRef<HTMLFormElement>(null);

    const [local, setLocal] = useState<LocalSession>(null);
    const [controlData, setControlData] = useState<Actividad[]>([]);
    const [memoriaFase, setMemoriaFase] = useState<MemoriaFase>({});
    const [memoriaActividades, setMemoriaActividades] =
        useState<MemoriaActividades>({});

    // Cargar datos iniciales (localStorage)
    useEffect(() => {
        try {
            const data = localStorage.getItem("ejecutar");
            if (data) {
                const parsed = JSON.parse(data) as { user?: string | number };
                setLocal(parsed);
            }
        } catch {
            showError("Datos inválidos en el almacenamiento local.");
        }
    }, []);

    // Guardar valores dinámicos (texto, número, select, radio, date, time, temp, file)
    const setValue = (name: string, value: MemValue): void => {
        setMemoriaActividades((prev) => ({ ...prev, [name]: value }));
    };

    // Cargar datos fase + actividades
    useEffect(() => {
        if (!params.id) return;

        (getActividadesTestigos as (id: number) => Promise<ApiActividadesResponse>)(
            params.id
        ).then((data) => {
            if (data && Array.isArray(data.actividades)) {
                setMemoriaFase((prev) => ({
                    ...prev,
                    fase_testigo: data.fase_testigo,
                }));
                setControlData(data.actividades);
            } else {
                setControlData([]);
            }
        });
    }, [params.id]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        const actividadesPreparadas: Actividad[] = controlData.map((item) => {
            const key = `field_${item.id}`;
            const valor = serializeMemValue(memoriaActividades[key]);
            return {
                id: item.id,
                description: item.description,
                config: item.config,
                binding: item.binding,
                clave: key,
                valor,
            };
        });

        const fase = memoriaFase.fase_testigo;
        const resultado: GuardarActividadesPayload = {
            adaptation_date_id: fase?.adaptation_date_id,
            descripcion: fase?.descripcion,
            fase_id: fase?.fase_id,
            activities: fase?.activities,
            phase_type: fase?.phase_type,
            forms: JSON.stringify(actividadesPreparadas),
            user: local?.user ?? "",
        };

        const guardar = guardar_actividades_testigos as (
            payload: GuardarActividadesPayload
        ) => Promise<GuardarActividadesResponse>;

        const data = await guardar(resultado);

        if (data.estado !== 200) {
            showError("Error al guardar el control");
            return;
        }

        ref.current?.reset();
        showSuccess("Control guardado correctamente");
        setTimeout(() => {
            window.close();
        }, 1000);
    };


    return (
        <div className="w-full max-w-5xl">
            <Text type="title" color="text-[#000]">
                Fase de testigos
            </Text>

            {memoriaFase.fase_testigo && (
                <div className="mt-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm justify-center flex">
                    <p className="font-medium text-gray-800 mr-2">
                        {memoriaFase.fase_testigo.descripcion} |
                    </p>
                    <p className="font-medium text-gray-800">
                        Tipo: {memoriaFase.fase_testigo.phase_type}
                    </p>
                </div>
            )}

            <div className="mt-6">
                <form
                    onSubmit={handleSubmit}
                    ref={ref} className="space-y-6">

                    {controlData.map((item) => {
                        const cfg = parseConfig(item.config);
                        const fieldName = `field_${item.id}`;

                        return (
                            <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-6
                                   shadow-sm transition-all duration-300 hover:border-gray-300 hover:shadow-md">
                                <Text type="subtitle" color="text-[#000]">
                                    {item.description}
                                </Text>

                                {/* TEXT */}
                                {cfg?.type === "text" && (
                                    <input
                                        type="text"
                                        id={fieldName}
                                        name={fieldName}
                                        value={(memoriaActividades[fieldName] as string) ?? ""}
                                        onChange={(e) => setValue(fieldName, e.target.value)}
                                        className="mt-4 block w-full rounded-md border-gray-300 
                                        bg-gray-50 py-2 px-3.5 text-gray-900 shadow-sm ring-1 
                                        ring-inset ring-gray-300 focus:ring-2 focus:ring-inset 
                                        focus:ring-indigo-600 sm:text-sm"
                                        required={item.binding}
                                    />
                                )}

                                {/* SIGNATURE */}
                                {cfg?.type === "signature" && (
                                    <>
                                        <select
                                            className="text-center block w-full px-3 py-2 
                                            bg-[#1a1d23] border border-gray-600 rounded-md shadow-sm 
                                            focus:outline-none focus:ring-2 focus:ring-blue-500 
                                            focus:border-blue-500 text-white placeholder-gray-400 mb-2"
                                            value={memoriaActividades[`${fieldName}_mode`] || ""}
                                            onChange={(e) =>
                                                setMemoriaActividades((prev) => ({
                                                    ...prev,
                                                    [`${fieldName}_mode`]: e.target.value,
                                                }))
                                            }>
                                            <option value="">-- Selecciona --</option>
                                            <option value="texto">Texto</option>
                                            <option value="firma">Firma</option>
                                        </select>

                                        {/* Mostrar Input si selecciona "texto" */}
                                        {memoriaActividades[`${fieldName}_mode`] === "texto" && (
                                            <input
                                                type="text"
                                                className="text-center block w-full px-3 py-2 
                                                bg-[#1a1d23] border border-gray-600 rounded-md shadow-sm 
                                                focus:outline-none focus:ring-2 focus:ring-blue-500 
                                                focus:border-blue-500 text-white placeholder-gray-400"
                                                name={fieldName}
                                                value={(memoriaActividades[fieldName] as string) ?? ""}
                                                required={item.binding}
                                                onChange={(e) => setValue(fieldName, e.target.value)}
                                            />
                                        )}

                                        {/* Mostrar Firma si selecciona "firma" */}
                                        {memoriaActividades[`${fieldName}_mode`] === "firma" && (
                                            <FirmaB64
                                                onSave={(base64: string) => setValue(fieldName, base64)}
                                                onClear={() => setValue(fieldName, "")}
                                            />
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                    <hr className="my-4 border-t border-gray-600 w-full max-w-lg mx-auto opacity-60" />
                    <div className="flex justify-center gap-4 mt-6">
                        <Button
                            type="submit"
                            variant="create"
                            label="Enviar Respuestas"
                        />
                    </div>
                </form>
            </div>
        </div>
    )
}

export default NewTestigos
