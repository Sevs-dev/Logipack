"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { linea_procesos, generar_orden } from "@/app/services/planing/planingServices";
import Text from "@/app/components/text/Text";
import { showError } from "@/app/components/toastr/Toaster";
import DateLoader from '@/app/components/loader/DateLoader';

const validar_estado = () => {
    const ejecutar = localStorage.getItem("ejecutar");
    if (ejecutar) return JSON.parse(ejecutar);

    setTimeout(() => {
        requestIdleCallback(() => window.close());
    }, 6000);

    return null;
};

type LocalType = {
    id: number;
    [key: string]: any;
};

const LineaCard = ({
    descripcion,
    onClick,
    index,
}: {
    id: number;
    descripcion: string;
    onClick: () => void;
    index: number;
}) => {
    return (
        <motion.div
            role="button"
            tabIndex={0}
            aria-label={`Seleccionar línea: ${descripcion}`}
            onClick={onClick}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
                duration: 0.3,
                delay: index * 0.05,
                ease: "easeOut",
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            className="group relative cursor-pointer rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md hover:shadow-lg"
        >
            <div className="flex items-center justify-center h-20 px-4 rounded-xl">
                <span className="text-base font-semibold text-center truncate max-w-full">
                    {descripcion}
                </span>
            </div>
        </motion.div>
    );
};

const NewLineas = () => {
    const [local, setLocal] = useState<LocalType | null>(null);
    const [lista, setLista] = useState<any>(null);

    useEffect(() => {
        const data = validar_estado();
        if (data) setLocal(data);
    }, []);

    useEffect(() => {
        const cargarLineasProceso = async (local: any) => {
            try {
                const resp = await linea_procesos(local.id);
                setLista(resp);
            } catch (error) {
                showError("Error al obtener las líneas de procesos: " + error);
            }
        };

        if (local) {
            cargarLineasProceso(local);
        }
    }, [local]);

    if (!local || !lista) {
        return ( 
            <DateLoader message=" No hay datos de la orden o líneas de procesos" backgroundColor="#242424" color="#ffff" />
        );
    }

    const orden = lista.orden;
    const lista_procesos = Array.isArray(lista.linea_procesos) ? lista.linea_procesos : [];
    const lista_fases = Array.isArray(lista.linea_fases) ? lista.linea_fases : [];

    if (orden === null && local) {
        generar_orden(local.id);
        window.location.reload();
    }

    const handleLinea = (id: number, tipo: string, descripcion: string) => {
        if (!local) return;
        local.linea = id;
        local.tipo = tipo;
        local.descripcion = descripcion;
        local.orden = orden;
        localStorage.setItem("ejecutar", JSON.stringify(local));
        window.open("/pages/ordenes_ejecutadas", "_blank");
        setTimeout(() => {
            requestIdleCallback(() => window.close());
        }, 1000);
    };

    return (
        <div className="p-8 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
            <div className="max-w-7xl mx-auto flex flex-col gap-12">
                {/* Información de la Orden */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <Text type="title" color="text-black">
                        Líneas de procesos
                    </Text>
                    <div className="mt-6 w-full rounded-3xl bg-white shadow-xl border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <Text type="subtitle" color="text-black">Información de la Orden</Text>
                        </div>
                        <div className="px-6 py-6 grid grid-cols-2 sm:grid-cols-3 gap-6 text-gray-700 text-base text-center">
                            <div>
                                <p className="text-sm text-gray-500">Orden N°</p>
                                <p className="font-semibold text-gray-800">{orden?.number_order}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Descripción</p>
                                <p className="font-semibold text-gray-800">{orden?.descripcion_maestra}</p>
                            </div>
                                {/* <div>
                                    <p className="text-sm text-gray-500">Proceso</p>
                                    <p className="font-semibold text-gray-800">{orden?.proceso}</p>
                                </div> */}
                            <div>
                                <p className="text-sm text-gray-500">Estado</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium 
                  ${orden?.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {orden?.estado}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Líneas */}
                <section>
                    <Text type="title" color="text-black">Líneas</Text>
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {lista_procesos.map((linea: any, index: number) => (
                            <LineaCard
                                key={linea.id}
                                id={linea.id}
                                descripcion={linea.descripcion}
                                index={index}
                                onClick={() => handleLinea(linea.id, "linea", linea.descripcion)}
                            />
                        ))}
                    </div>
                </section>

                {/* Fases */}
                <section>
                    <Text type="title" color="text-black">Fases</Text>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {lista_fases.map((linea: any, index: number) => (
                            <LineaCard
                                key={linea.id}
                                id={linea.id}
                                descripcion={linea.descripcion}
                                index={index}
                                onClick={() => handleLinea(linea.id, "fase")}
                            />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default NewLineas;
