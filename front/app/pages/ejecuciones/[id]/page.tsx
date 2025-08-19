"use client";
import { use, useEffect, useState, useCallback } from "react";
import { actividades_ejecutadas } from "@/app/services/planing/planingServices";
import DateLoader from "@/app/components/loader/DateLoader";
import Image from "next/image";

// ---- Tipos ----
type OrdenType = {
    number_order: string;
    cliente: string;
    planta: string;
    descripcion_maestra: string;
};

type ActividadFormConfig = {
    type?: string;
    [key: string]: unknown;
};

type ActividadForm = {
    id_activitie: number | string;
    descripcion_activitie: string;
    clave: string;
    valor: string;
    config: ActividadFormConfig | string;
};

type Actividad = {
    id: number | string;
    description_fase: string;
    phase_type: string;
    linea: string;
    user: string;
    estado_form: string;
    forms: string; // JSON.stringify([...])
};

// ---- Helpers ----
const isImage = (valor: string) =>
    typeof valor === "string" && valor.startsWith("data:image/");
const isPDF = (valor: string) =>
    typeof valor === "string" && valor.startsWith("data:application/pdf");

// ---- Componente ----
const NewDetalle = ({ params }: { params: Promise<{ id: number }> }) => {
    const { id } = use(params);
    const [orden, setOrden] = useState<OrdenType | null>(null);
    const [actividades, setActividades] = useState<Actividad[]>([]);
    const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null);

    // Obtener actividades
    const obtenerActividades = useCallback(async () => {
        try {
            const data = await actividades_ejecutadas(id);
            if (data?.actividades) {
                setOrden(data.orden);
                setActividades(data.actividades);
            }
        } catch (error) {
            console.error("Error al obtener fases:", error);
        }
    }, [id]);

    useEffect(() => {
        obtenerActividades();
    }, [obtenerActividades]);

    if (!actividades.length) {
        return ( 
            <DateLoader message="Cargando actividades..." backgroundColor="#1f2937" color="#ffff" />
        );
    }

    return (
        <div className="w-full bg-gradient-to-tr from-gray-950 via-gray-900 to-gray-950 text-white p-4 sm:p-8 flex flex-col">
            <div className="max-w-5xl mx-auto w-full space-y-6">

                {/* Modal Imagen Ampliada */}
                {imagenAmpliada && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-all duration-300"
                        onClick={() => setImagenAmpliada(null)}
                        role="dialog"
                        aria-modal="true"
                    >
                        <Image
                            src={imagenAmpliada}
                            alt="Vista ampliada"
                            className="max-w-full max-h-[85vh] rounded-xl shadow-2xl border-2 border-cyan-300/20 animate-fade-in drop-shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        />
                        <button
                            className="absolute top-8 right-12 text-white/80 text-4xl font-bold transition hover:scale-125 hover:text-pink-300"
                            onClick={() => setImagenAmpliada(null)}
                            aria-label="Cerrar imagen ampliada"
                            tabIndex={0}
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Header */}
                <div className="gap-4 px-6 py-5 border-b border-cyan-800/20 bg-cyan-900/80 rounded-2xl shadow-lg mb-2">

                    <h3 className="text-2xl font-bold text-cyan-100 tracking-wider  text-center">
                        Información de Actividades
                    </h3>
                </div>

                {/* Información de la Orden */}
                <div className="w-full rounded-2xl bg-gradient-to-br from-gray-800/80 via-gray-900/60 to-gray-950/80 border border-cyan-800/10 shadow-xl p-6 text-cyan-100 font-medium text-lg mb-3">
                    <div className="flex flex-col md:flex-row justify-around items-center gap-6">
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-cyan-400">Orden N°</span>
                            <span className="text-xl font-extrabold text-cyan-100 tracking-wide">{orden?.number_order}</span>
                        </div>
                        <span className="hidden md:block h-10 w-0.5 bg-cyan-600/20 rounded mx-3" />
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-cyan-400">Cliente</span>
                            <span className="font-semibold">{orden?.cliente}</span>
                        </div>
                        <span className="hidden md:block h-10 w-0.5 bg-cyan-600/20 rounded mx-3" />
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-cyan-400">Planta</span>
                            <span className="font-semibold">{orden?.planta}</span>
                        </div>
                        <span className="hidden md:block h-10 w-0.5 bg-cyan-600/20 rounded mx-3" />
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-cyan-400">Maestra</span>
                            <span className="font-semibold">{orden?.descripcion_maestra}</span>
                        </div>
                    </div>
                </div>

                {/* Fase / Actividades */}
                <div className="w-full rounded-2xl bg-white/5 border border-cyan-700/20 shadow-lg overflow-hidden animate-fade-in-up">
                    <div className="px-8 py-4 border-b border-cyan-800/10 bg-white/10 rounded-t-2xl">
                        <h3 className="text-xl font-semibold text-cyan-200 text-center gap-2">
                            Detalle de Actividades
                        </h3>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {actividades.map(
                                ({ id, description_fase, phase_type, linea, user, estado_form, forms }) => {
                                    let lista: ActividadForm[] = [];
                                    try { lista = JSON.parse(forms); } catch { lista = []; }

                                    return (
                                        <div
                                            key={id}
                                            className="bg-gradient-to-br from-gray-800/70 to-gray-900/80 border border-cyan-800/10 rounded-2xl p-6 shadow-md transition hover:shadow-2xl hover:border-cyan-400/30 hover:bg-gray-900/90 group relative overflow-visible"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-lg font-semibold text-cyan-200 flex items-center gap-2">
                                                    <span className="text-cyan-400">🔹</span>
                                                    {description_fase}
                                                </h4>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold
                      ${estado_form === "1"
                                                        ? "bg-green-700/80 text-green-200 border-green-400/30"
                                                        : "bg-yellow-600/80 text-yellow-100 border-yellow-400/20"}
                    `}>
                                                    {estado_form === "1" ? "Finalizado" : "En ejecución"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs text-cyan-400 pb-2 mb-2 border-b border-cyan-800/10">
                                                <span className="italic">{phase_type}</span>
                                                <span>{decodeURIComponent(user)} <b className="text-cyan-300">/ Línea:</b> {linea}</span>
                                            </div>

                                            <div className="space-y-6 mt-4">
                                                {lista.map((item, index) => {
                                                    let config: ActividadFormConfig = {};
                                                    try {
                                                        if (typeof item.config === "string")
                                                            config = JSON.parse(item.config);
                                                        else
                                                            config = item.config ?? {};
                                                    } catch { config = {}; }
                                                    const { type } = config;

                                                    return (
                                                        <div
                                                            key={item.id_activitie}
                                                            className="bg-gradient-to-l from-cyan-900/30 to-gray-900/30 border border-cyan-400/80 pl-5 rounded-lg py-2 shadow-inner"
                                                        >
                                                            <div className="flex flex-col items-center justify-center gap-4 w-full">
                                                                <h5 className="text-cyan-100 font-medium text-center">{item.descripcion_activitie}</h5>
                                                                <div className="grid grid-cols-1 gap-1 text-sm mt-1 w-full">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <span className="text-cyan-400 mr-8">Resultado:</span>
                                                                        <div className="flex items-center justify-center">
                                                                            {isImage(item.valor) ? (
                                                                                <button
                                                                                    type="button"
                                                                                    className="border-none bg-transparent p-0 focus:outline-none"
                                                                                    onClick={() => setImagenAmpliada(item.valor)}
                                                                                    title="Ampliar imagen"
                                                                                >
                                                                                    <Image
                                                                                        src={item.valor}
                                                                                        alt="Vista previa"
                                                                                        className="rounded-md border border-cyan-800/30 shadow max-h-28 object-contain cursor-zoom-in transition-transform duration-300 hover:scale-105"
                                                                                    />
                                                                                </button>
                                                                            ) : isPDF(item.valor) ? (
                                                                                <a
                                                                                    href={item.valor}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="text-blue-400 underline font-mono"
                                                                                    title="Abrir PDF"
                                                                                >
                                                                                    Ver PDF
                                                                                </a>
                                                                            ) : (
                                                                                <span className="text-cyan-100 font-medium break-words">
                                                                                    {item.valor ?? "—"}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {type && (
                                                                        <div className="mt-1 text-xs text-center">
                                                                            <span className="inline-block bg-cyan-900/40 px-2 py-1 rounded text-cyan-400">
                                                                                Tipo: {JSON.stringify(type)}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Divider */}
                                                            {index < lista.length - 1 && (
                                                                <div className="border-b border-cyan-800/10 my-3" />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
};

export default NewDetalle;
