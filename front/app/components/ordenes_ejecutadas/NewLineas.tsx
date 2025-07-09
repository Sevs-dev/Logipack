import { linea_procesos, generar_orden } from '@/app/services/planing/planingServices';
import React, { useState, useEffect } from 'react';
import { showError } from '@/app/components/toastr/Toaster';

const validar_estado = () => {
    const ejecutar = localStorage.getItem("ejecutar");
    if (ejecutar) return JSON.parse(ejecutar);

    setTimeout(() => {
        requestIdleCallback(() => window.close());
    }, 6000);

    return null;
};

const NewLineas = () => {
    const [local, setLocal] = useState(null);
    const [lista, setLista] = useState<any>(null); // inicializamos como null

    // obtener datos de la orden
    useEffect(() => {
        const data = validar_estado();
        if (data) {
            setLocal(data);
        }
    }, []);

    // obtener lineas de procesos
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

    // si no hay datos de la orden o lineas de procesos
    if (!local || !lista) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <p className="text-white text-xl font-semibold">No hay datos de la orden o lineas de procesos</p>
            </div>
        );
    }

    // obtener orden y fases
    const orden = lista.orden;
    const lista_procesos = Array.isArray(lista.linea_procesos) ? lista.linea_procesos : [];
    const lista_fases = Array.isArray(lista.linea_fases) ? lista.linea_fases : [];

    // generar orden si no existe
    if (orden === null) {
        if (local) {
            generar_orden(local.id);
            window.location.reload();
        }
    };

    // seleccionar linea
    const handleLinea = (id: number, tipo: string) => {
        if (!local) return;
        local.linea = id;
        local.tipo = tipo;
        local.orden = orden;
        localStorage.setItem("ejecutar", JSON.stringify(local));
        window.open("/pages/ordenes_ejecutadas", "_blank");
        setTimeout(() => {
            requestIdleCallback(() => window.close());
        }, 1000);
    };

    return (
        <div className="p-8 min-h-screen bg-gray-100">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Líneas de procesos</h2>

            <div className="mb-6 p-4 bg-white shadow rounded-xl border">
                <p className="text-gray-700"><span className="font-semibold">Orden N°:</span> {orden?.number_order}</p>
                <p className="text-gray-700"><span className="font-semibold">Descripción:</span> {orden?.descripcion_maestra}</p>
                <p className="text-gray-700"><span className="font-semibold">Proceso:</span> {orden?.proceso}</p>
                <p className="text-gray-700"><span className="font-semibold">Estado:</span> {orden?.estado}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-5">
                {lista_procesos.map((linea: any) => (
                    <div key={linea.id} className="rounded-2xl shadow-md bg-white p-6 flex items-center 
                        justify-center hover:shadow-lg transition-shadow cursor-pointer active:scale-95"
                        onClick={() => handleLinea(linea.id, 'linea')}>
                        <div className="text-white font-bold text-lg rounded-xl
                            px-10 py-14 w-full text-center bg-blue-600">
                            {linea.descripcion}
                        </div>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {lista_fases.map((linea: any) => (
                    <div key={linea.id} className="rounded-2xl shadow-md bg-white p-6 flex items-center 
                        justify-center hover:shadow-lg transition-shadow cursor-pointer active:scale-95"
                        onClick={() => handleLinea(linea.id, 'fase')}>
                        <div className="text-white font-bold text-lg rounded-xl
                            px-10 py-14 w-full text-center bg-green-600">
                            {linea.descripcion}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

};

export default NewLineas;
