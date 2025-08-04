import React, { useState, useEffect } from 'react';
import { getConciliacion, guardar_conciliacion } from '@/app/services/planing/planingServices';

const NewConsolida = () => {
    const [data, setData] = useState({
        orden_ejecutada: '',
        adaptation_date_id: '',
        number_order: '',
        descripcion_maestra: '',
        codart: '',
        desart: '',
        quantityToProduce: '',
        faltante: '',
        adicionales: '',
        rechazo: '',
        danno_proceso: '',
        devolucion: '',
        sobrante: '',
        total: '',
        rendimiento: '',
        user: '',
    });

    useEffect(() => {
        const obtener_conciliacion = async () => {
            try {
                const response = await getConciliacion(5);
                setData((prev) => ({
                    ...prev,
                    orden_ejecutada: response?.orden?.orden_ejecutada,
                    adaptation_date_id: response?.orden?.adaptation_date_id,
                    number_order: response?.orden?.number_order,
                    descripcion_maestra: response?.orden?.descripcion_maestra,
                    codart: response?.conciliacion?.codart,
                    desart: response?.conciliacion?.desart,
                    quantityToProduce: response?.conciliacion?.quantityToProduce,
                }));
            } catch (error: unknown) {
                console.error("Error en getConciliacion:", error);
                throw error;
            }
        }

        obtener_conciliacion();
    }, []);

    // Obtener los datos del formulario
    const inputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        const usuario = document.cookie
        .split("; ")
        .find((row) => row.startsWith("role="))
        ?.split("=")[1];

        setData(prev => ({
            ...prev,
            [name]: value,
            user: usuario || prev.user,
        }));
    };

    // Calcular los valores, según la fórmula de la conciliación al capturar los datos
    useEffect(() => {
        const calculateValues = () => {
            const quantityToProduce = parseFloat(data.quantityToProduce) || 0;
            const faltante = parseFloat(data.faltante) || 0;
            const adicionales = parseFloat(data.adicionales) || 0;
            const rechazo = parseFloat(data.rechazo) || 0;
            const danno_proceso = parseFloat(data.danno_proceso) || 0;
            const devolucion = parseFloat(data.devolucion) || 0;
            const sobrante = parseFloat(data.sobrante) || 0;

            /*
                Calculo de la conciliación donde:
                (a) Cantidad a Producir
                (b) Faltante
                (c) Adicionales
                (d) Rechazo
                (e) Daño en Proceso
                (f) Devolución
                (g) Sobrante
                (h) Total
                (i) Rendimiento

                total = a + c + g - (b + d + e + f)
                rendimiento = (h - e) / (a - (d + b)) * 100
            */

            // Calcular total
            const total = quantityToProduce + adicionales + sobrante - (faltante + rechazo + danno_proceso + devolucion);

            // Calcular rendimiento
            let rendimiento = 0;
            const denominador = quantityToProduce - (rechazo + faltante);
            if (denominador !== 0) {
                rendimiento = ((total - danno_proceso) / denominador) * 100;
            }

            // Actualizar estado, redondeando a 2 decimales
            setData(prev => ({
                ...prev,
                total: total.toFixed(2),
                rendimiento: rendimiento.toFixed(2)
            }));
        };

        calculateValues();
    }, [
        data.quantityToProduce,
        data.faltante,
        data.adicionales,
        data.rechazo,
        data.danno_proceso,
        data.devolucion,
        data.sobrante
    ]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const response = await guardar_conciliacion(data);
        if (response.message === 'ok') {
            console.log('Formulario guardado correctamente');
            window.close();
        } else {
            console.log('Error al guardar el datos | ' + 'datos existentes.');
        }
    };

    if (data?.orden_ejecutada === '') {
        return (
            <div>
                <h1>Cargando...</h1>
            </div>
        )
    }

    if (data?.orden_ejecutada === undefined) {
        return (
            <div>
                <h1>Sin datos de conciliación</h1>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto px-6 py-8 bg-white rounded-xl shadow-lg">
            <form
                id="formConciliacion"
                onSubmit={handleSubmit}
                className="space-y-8"
            >
                <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Formulario de Conciliación</h2>

                {/* Información general */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-lg">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Orden Ejecutada
                        </label>
                        <p className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm">
                            {data.orden_ejecutada}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Número de Orden
                        </label>
                        <p className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm">
                            {data.number_order}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción Maestra
                        </label>
                        <p className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm">
                            {data.descripcion_maestra}
                        </p>
                    </div>
                </div>

                <hr className="border-t-2 border-gray-200 my-6" />

                {/* Artículo */}
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Artículo a Conciliar</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Código Artículo
                            </label>
                            <p className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm">
                                {data.codart}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Producción y Desperdicio */}
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Producción y Desperdicio</h3>

                    {/* Grid de 4 columnas */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div>
                            <label htmlFor="quantityToProduce" className="block text-sm font-medium text-gray-700 mb-1">
                                Cantidad Teorica (a)
                            </label>
                            <p className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm">
                                {data.quantityToProduce}
                            </p>
                            {/* <input
                                type="number"
                                step="any"
                                id="quantityToProduce"
                                name="quantityToProduce"
                                value={data.quantityToProduce}
                                onChange={inputChange}
                                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 text-gray-900 bg-white border"
                            /> */}
                        </div>
                        <div>
                            <label htmlFor="faltante" className="block text-sm font-medium text-gray-700 mb-1">
                                Faltante (b)
                            </label>
                            <input
                                type="number"
                                step="any"
                                id="faltante"
                                name="faltante"
                                required
                                value={data.faltante}
                                onChange={inputChange}
                                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 text-gray-900 bg-white border"
                            />
                        </div>
                        <div>
                            <label htmlFor="adicionales" className="block text-sm font-medium text-gray-700 mb-1">
                                Adicionales (c)
                            </label>
                            <input
                                type="number"
                                step="any"
                                id="adicionales"
                                name="adicionales"
                                required
                                value={data.adicionales}
                                onChange={inputChange}
                                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 text-gray-900 bg-white border"
                            />
                        </div>
                        <div>
                            <label htmlFor="rechazo" className="block text-sm font-medium text-gray-700 mb-1">
                                Rechazo (d)
                            </label>
                            <input
                                type="number"
                                step="any"
                                id="rechazo"
                                name="rechazo"
                                required
                                value={data.rechazo}
                                onChange={inputChange}
                                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 text-gray-900 bg-white border"
                            />
                        </div>
                    </div>

                    {/* Grid de 3 columnas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label htmlFor="danno_proceso" className="block text-sm font-medium text-gray-700 mb-1">
                                Daño en Proceso (e)
                            </label>
                            <input
                                type="number"
                                step="any"
                                id="danno_proceso"
                                name="danno_proceso"
                                required
                                value={data.danno_proceso}
                                onChange={inputChange}
                                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 text-gray-900 bg-white border"
                            />
                        </div>
                        <div>
                            <label htmlFor="devolucion" className="block text-sm font-medium text-gray-700 mb-1">
                                Devolución (f)
                            </label>
                            <input
                                type="number"
                                step="any"
                                id="devolucion"
                                name="devolucion"
                                required
                                value={data.devolucion}
                                onChange={inputChange}
                                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 text-gray-900 bg-white border"
                            />
                        </div>
                        <div>
                            <label htmlFor="sobrante" className="block text-sm font-medium text-gray-700 mb-1">
                                Sobrante (g)
                            </label>
                            <input
                                type="number"
                                step="any"
                                id="sobrante"
                                name="sobrante"
                                required
                                value={data.sobrante}
                                onChange={inputChange}
                                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 text-gray-900 bg-white border"
                            />
                        </div>
                    </div>
                </div>

                {/* Totales */}
                <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="total" className="block text-sm font-medium text-gray-700 mb-1">
                                Total (h) = a + c + g - (b + d + e + f)
                            </label>
                            <input
                                type="number"
                                step="any"
                                id="total"
                                name="total"
                                readOnly
                                value={data.total}
                                className="mt-1 w-full rounded-md border-gray-300 shadow-sm px-4 py-2 text-gray-900 bg-gray-100 border"
                            />
                        </div>
                        <div>
                            <label htmlFor="rendimiento" className="block text-sm font-medium text-gray-700 mb-1">
                                Rendimiento (i) = (h - e) / (a - (d + b)) × 100
                            </label>
                            <input
                                type="number"
                                step="any"
                                id="rendimiento"
                                name="rendimiento"
                                readOnly
                                value={data.rendimiento}
                                className="mt-1 w-full rounded-md border-gray-300 shadow-sm px-4 py-2 text-gray-900 bg-gray-100 border"
                            />
                        </div>
                    </div>
                </div>

                {/* Botón de envío */}
                <div className="flex justify-center mt-8">
                    <button
                        type="submit"
                        className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Guardar Conciliación
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NewConsolida;