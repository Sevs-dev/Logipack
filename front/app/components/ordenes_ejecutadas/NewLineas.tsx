"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { linea_procesos, generar_orden } from "@/app/services/planing/planingServices";
import Text from "@/app/components/text/Text";
import { showError } from "@/app/components/toastr/Toaster";
import DateLoader from "@/app/components/loader/DateLoader";
import { LineasResponse, LocalType } from "@/app/interfaces/NewLineas";

const validar_estado = (): LocalType | null => {
    const ejecutar = localStorage.getItem("ejecutar");
    if (ejecutar) return JSON.parse(ejecutar);

    setTimeout(() => {
        requestIdleCallback(() => window.close());
    }, 6000);

    return null;
};

const NewLineas = () => {
    const [local, setLocal] = useState<LocalType | null>(null);
    const [lista, setLista] = useState<LineasResponse | null>(null);

    useEffect(() => {
        const data = validar_estado();
        if (data) setLocal(data);
    }, []);

    const cargarLineasProceso = async (localData: LocalType) => {
        try {
            const resp = await linea_procesos(localData.id);
            setLista(resp);
        } catch (error) {
            showError("Error al obtener las líneas de procesos: " + error);
        }
    };

    useEffect(() => {

        if (local) {
            cargarLineasProceso(local);
        }
    }, [local]);

    if (!local || !lista) {
        return (
            <DateLoader message=" No hay datos de la orden o líneas de procesos" backgroundColor="#1f2937" color="#ffff" />
        );
    }

    const orden = lista.orden;
    const lista_procesos = Array.isArray(lista.linea_procesos) ? lista.linea_procesos : [];
    const lista_fases = Array.isArray(lista.linea_fases) ? lista.linea_fases : [];

    if (orden?.estado === 11500) {
        window.close();
    }
    console.log("orden", orden?.estado);
    // if (lista_procesos.length === 0 && lista_fases.length === 0 && orden === null) {
    //     window.close();
    // }
    
    const verificarYGenerar = async () => {
        if (orden === null && local) {
            const { message } = await generar_orden(local.id);
            console.log(message);
            if (local) {
                await cargarLineasProceso(local);
            }
        }

        // ⚠️ Revalida después de intentar generar
        const procesosActualizados = Array.isArray(lista.linea_procesos) ? lista.linea_procesos : [];
        if (procesosActualizados.length === 0) {
            // window.close();
            console.log("No hay procesos disponibles para la orden.");
        }
    };
    verificarYGenerar();

    // Si no hay orden, se muestra un loader
    if (orden === null) {
        return (
            <DateLoader message=" Cargando orden...." backgroundColor="#1f2937" color="#ffff" />
        );
    }

    const handleLinea = (id: number, tipo: string, descripcion: string, phase_type: string) => {
        if (!local) return;
        local.linea = id;
        local.tipo = tipo;
        local.descripcion = descripcion;
        local.orden = orden;
        localStorage.setItem("ejecutar", JSON.stringify(local));

        if (phase_type === "Conciliación") {
            window.open("/pages/consolidacion", "_blank");
        } else {
            window.open("/pages/ordenes_ejecutadas", "_blank");
        }
        setTimeout(() => {
            requestIdleCallback(() => window.close());
        }, 1000);
    };

    const estadoMap: Record<number, string> = {
        100: "Pendiente",
        11500: "Ejecutado",
    };

    return (
        <div className="min-h-screen w-full bg-[#0a0d12] text-white p-[10px] sm:p-[10px] flex flex-col rounded-2xl">
            <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="w-full rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-md overflow-hidden">
                    <div className="bg-white/2.5 px-[10px] py-[10px] border-b border-white/5 backdrop-blur-sm">
                        <Text type="title" color="text-white">Información de la Orden</Text>
                    </div>

                    <div className="px-[10px] py-[10px] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm text-white/80">
                        <div>
                            <p className="text-white/60 text-center">Orden N°</p>
                            <p className="font-medium text-white text-center">{orden?.number_order}</p>
                        </div>
                        <div>
                            <p className="text-white/60 text-center">Descripción</p>
                            <p className="font-semibold text-white text-center">{orden?.descripcion_maestra}</p>
                        </div>
                        <div>
                            <p className="text-white/60 text-center">Cliente</p>
                            <p className="font-semibold text-white text-center">{orden?.cliente}</p>
                        </div>
                        <div>
                            <p className="text-white/60 text-center">Planta</p>
                            <p className="font-semibold text-white text-center">{orden?.planta}</p>
                        </div>
                        <div>
                            <p className="text-white/60 text-center">Cantidad a producir</p>
                            <p className="font-semibold text-white text-center">{orden?.cantidad_producir}</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <p className="text-white/60">Estado</p>
                            <p
                                className={`font-semibold rounded-full px-2 py-1 w-24 text-center ${orden?.estado === 11500
                                    ? "bg-green-300/20 text-green-300"
                                    : "bg-yellow-300/20 text-yellow-300"
                                    }`}
                            >
                                {estadoMap[orden?.estado] ?? "Desconocido"}
                            </p>
                        </div>
                    </div>

                    {/* Líneas */}
                    <section className="px-[10px] pb-[10px] pt-[10px]">
                        <Text type="title" color="text-white">Líneas</Text>
                        <div className="mt-3 flex flex-wrap justify-center gap-3">
                            {lista_procesos.map((linea, index) => (
                                <motion.div
                                    key={linea.id}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Seleccionar línea: ${linea.descripcion}`}
                                    onClick={() => handleLinea(linea.id, "linea", linea.descripcion, linea.phase_type)}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{
                                        duration: 0.3,
                                        delay: index * 0.05,
                                        ease: "easeOut",
                                    }}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-[200px] group relative cursor-pointer rounded-lg bg-[#841ae0]/60 border border-white/10 backdrop-blur-sm text-white transition-all shadow-sm hover:shadow-md hover:bg-[#b941ff]/60 active:scale-95"
                                >
                                    <div className="flex items-center justify-center h-14 px-2 rounded-lg">
                                        <span className="text-sm font-medium text-center truncate max-w-[200px]">
                                            {linea.descripcion}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* Fases */}
                    <section className="px-[10px] pb-[10px] pt-[10px]">
                        <Text type="title" color="text-white">Fases</Text>
                        {JSON.stringify(lista_fases)}
                        <div className="mt-3 flex flex-wrap justify-center gap-3">
                            {lista_fases.map((linea, index) => (
                                <motion.div
                                    key={linea.id}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Seleccionar línea: ${linea.descripcion}`}
                                    onClick={() => handleLinea(linea.id, "fase", linea.descripcion, linea.phase_type)}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{
                                        duration: 0.3,
                                        delay: index * 0.05,
                                        ease: "easeOut",
                                    }}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-[200px] group relative cursor-pointer rounded-lg bg-[#841ae0]/60 border border-white/10 backdrop-blur-sm text-white transition-all shadow-sm hover:shadow-md hover:bg-[#b941ff]/60 active:scale-95"
                                >
                                    <div className="flex items-center justify-center h-14 px-2 rounded-lg">
                                        <span className="text-sm font-medium text-center truncate max-w-[300px]">
                                            {linea.descripcion}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                </div>
            </motion.section>
        </div>
    );
};

export default NewLineas;
