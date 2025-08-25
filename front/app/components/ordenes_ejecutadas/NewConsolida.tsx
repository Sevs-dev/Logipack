import React, { useState, useEffect } from "react";
import {
  getConciliacion,
  guardar_conciliacion,
} from "@/app/services/planing/planingServices";
import { useParams } from "next/navigation";

const NewConsolida = () => {
  const params = useParams();
  const [data, setData] = useState({
    orden_ejecutada: "",
    adaptation_date_id: "",
    number_order: "",
    descripcion_maestra: "",
    codart: "",
    desart: "",
    quantityToProduce: "",
    faltante: "",
    adicionales: "",
    rechazo: "",
    danno_proceso: "",
    devolucion: "",
    sobrante: "",
    total: "",
    rendimiento: "",
    unidades_caja: "",
    numero_caja: "",
    unidades_saldo: "",
    total_saldo: "",
    user: "",
  });

  useEffect(() => {
    const obtener_conciliacion = async () => {
      try {
        const response = await getConciliacion(Number(params.id));
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
    };

    obtener_conciliacion();
  }, [params.id]);

  // Obtener los datos del formulario
  const inputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    const usuario = document.cookie
      .split("; ")
      .find((row) => row.startsWith("role="))
      ?.split("=")[1];

    setData((prev) => ({
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
      const unidades_caja = parseFloat(data.unidades_caja) || 0;
      const numero_caja = parseFloat(data.numero_caja) || 0;
      const unidades_saldo = parseFloat(data.unidades_saldo) || 0;
      const total_saldo = parseFloat(data.total_saldo) || 0;

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
                (i) unidades_caja
                (j) numero_caja
                (k) unidades_saldo
                (l) total_saldo

                total = a + c + g - (b + d + e + f)
                rendimiento = (h - e) / (a - (d + b)) * 100
            */

      // Calcular total
      const total =
        quantityToProduce +
        adicionales +
        sobrante -
        (faltante + rechazo + danno_proceso + devolucion);

      // Calcular rendimiento
      let rendimiento = 0;
      const denominador = quantityToProduce - (rechazo + faltante);
      if (denominador !== 0) {
        rendimiento = ((total - danno_proceso) / denominador) * 100;
      }

      // Calcula unidades_caja
      const saldo = (unidades_caja * numero_caja) + unidades_saldo;

      // Actualizar estado, redondeando a 2 decimales
      setData((prev) => ({
        ...prev,
        total: total.toFixed(2),
        rendimiento: rendimiento.toFixed(2),
        total_saldo: saldo.toFixed(2),
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
    data.sobrante,
    data.unidades_caja,
    data.numero_caja,
    data.unidades_saldo,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await guardar_conciliacion(data);
    if (response.message === "ok") {
      console.log("Formulario guardado correctamente");
      window.close();
    } else {
      console.log("Error al guardar el datos | " + "datos existentes.");
    }
  };

  if (data?.orden_ejecutada === "") {
    return (
      <div>
        <h1>Cargando...</h1>
      </div>
    );
  }

  if (data?.orden_ejecutada === undefined) {
    return (
      <div>
        <h1>Sin datos de conciliación</h1>
      </div>
    );
  }

  // --- COPIA Y PEGA ESTE CÓDIGO ---

  return (
    // Contenedor principal con un fondo sutil para que el formulario resalte
    <div className="bg-silver-50 min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <form
          id="formConciliacion"
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl p-8 space-y-10"
        >
          {/* --- Encabezado del Formulario --- */}
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Formulario de Conciliación
            </h1>
            <p className="mt-3 text-lg leading-8 text-slate-600">
              Complete los campos para calcular la producción y el rendimiento.
            </p>
          </div>

          {/* --- Sección de Información de la Orden (Solo lectura) --- */}
          <div className="border-b border-slate-200 pb-8">
            <h2 className="text-base font-semibold leading-7 text-slate-900">
              Información de la Orden
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-4">
              <div>
                <label className="block text-sm font-medium leading-6 text-slate-600">
                  Orden Ejecutada
                </label>
                <p className="mt-1 text-base font-semibold text-slate-800 bg-slate-100 rounded-md px-3 py-2">
                  {data.orden_ejecutada}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium leading-6 text-slate-600">
                  Número de Orden
                </label>
                <p className="mt-1 text-base font-semibold text-slate-800 bg-slate-100 rounded-md px-3 py-2 font-mono">
                  {data.number_order}
                </p>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium leading-6 text-slate-600">
                  Descripción Maestra
                </label>
                <p className="mt-1 text-base font-semibold text-slate-800 bg-slate-100 rounded-md px-3 py-2">
                  {data.descripcion_maestra}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium leading-6 text-slate-600">
                  Código Artículo
                </label>
                <p className="mt-1 text-base font-semibold text-slate-800 bg-slate-100 rounded-md px-3 py-2 font-mono">
                  {data.codart}
                </p>
              </div>
            </div>
          </div>

          {/* --- Sección de Producción y Desperdicio --- */}
          <fieldset className="border border-slate-200 p-6 rounded-xl">
            <legend className="-ml-1 px-2 text-lg font-semibold text-indigo-700">
              Producción y Desperdicio
            </legend>
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-4 mt-4">
              {/* Cantidad Teórica */}
              <div className="sm:col-span-2">
                <label className="flex items-center text-sm font-medium leading-6 text-slate-900">
                  Cantidad Teórica
                  <span className="ml-2 font-mono text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                    a
                  </span>
                </label>
                <p className="mt-2 w-full rounded-md border-0 bg-slate-100 px-3.5 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300">
                  {data.quantityToProduce}
                </p>
              </div>

              {/* Faltante */}
              <div>
                <label
                  htmlFor="faltante"
                  className="flex items-center text-sm font-medium leading-6 text-slate-900"
                >
                  Faltante
                  <span className="ml-2 font-mono text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                    b
                  </span>
                </label>
                <input
                  type="number"
                  step="any"
                  id="faltante"
                  name="faltante"
                  required
                  value={data.faltante}
                  onChange={inputChange}
                  className="mt-2 block w-full rounded-md border-0 py-2 px-3.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>

              {/* Adicionales */}
              <div>
                <label
                  htmlFor="adicionales"
                  className="flex items-center text-sm font-medium leading-6 text-slate-900"
                >
                  Adicionales
                  <span className="ml-2 font-mono text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                    c
                  </span>
                </label>
                <input
                  type="number"
                  step="any"
                  id="adicionales"
                  name="adicionales"
                  required
                  value={data.adicionales}
                  onChange={inputChange}
                  className="mt-2 block w-full rounded-md border-0 py-2 px-3.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>

              {/* Rechazo */}
              <div>
                <label
                  htmlFor="rechazo"
                  className="flex items-center text-sm font-medium leading-6 text-slate-900"
                >
                  Rechazo
                  <span className="ml-2 font-mono text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                    d
                  </span>
                </label>
                <input
                  type="number"
                  step="any"
                  id="rechazo"
                  name="rechazo"
                  required
                  value={data.rechazo}
                  onChange={inputChange}
                  className="mt-2 block w-full rounded-md border-0 py-2 px-3.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>

              {/* Daño en Proceso */}
              <div>
                <label
                  htmlFor="danno_proceso"
                  className="flex items-center text-sm font-medium leading-6 text-slate-900"
                >
                  Daño en Proceso
                  <span className="ml-2 font-mono text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                    e
                  </span>
                </label>
                <input
                  type="number"
                  step="any"
                  id="danno_proceso"
                  name="danno_proceso"
                  required
                  value={data.danno_proceso}
                  onChange={inputChange}
                  className="mt-2 block w-full rounded-md border-0 py-2 px-3.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>

              {/* Devolución */}
              <div>
                <label
                  htmlFor="devolucion"
                  className="flex items-center text-sm font-medium leading-6 text-slate-900"
                >
                  Devolución
                  <span className="ml-2 font-mono text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                    f
                  </span>
                </label>
                <input
                  type="number"
                  step="any"
                  id="devolucion"
                  name="devolucion"
                  required
                  value={data.devolucion}
                  onChange={inputChange}
                  className="mt-2 block w-full rounded-md border-0 py-2 px-3.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>

              {/* Sobrante */}
              <div>
                <label
                  htmlFor="sobrante"
                  className="flex items-center text-sm font-medium leading-6 text-slate-900"
                >
                  Sobrante
                  <span className="ml-2 font-mono text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                    g
                  </span>
                </label>
                <input
                  type="number"
                  step="any"
                  id="sobrante"
                  name="sobrante"
                  required
                  value={data.sobrante}
                  onChange={inputChange}
                  className="mt-2 block w-full rounded-md border-0 py-2 px-3.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
          </fieldset>

          {/* --- Sección de Totales y Cajas --- */}
          <fieldset className="border border-slate-200 p-6 rounded-xl">
            <legend className="-ml-1 px-2 text-lg font-semibold text-indigo-700">
              Totales y Empacado
            </legend>
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 mt-4">
              {/* Total */}
              <div>
                <label
                  htmlFor="total"
                  className="flex items-center text-sm font-medium leading-6 text-slate-900"
                >
                  Total Producido
                  <span className="ml-2 font-mono text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                    h
                  </span>
                </label>
                <input
                  type="number"
                  readOnly
                  value={data.total}
                  className="mt-2 block w-full rounded-md border-0 py-2 px-3.5 text-slate-500 bg-slate-100 shadow-sm ring-1 ring-inset ring-slate-300 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Cálculo: a + c + g - (b + d + e + f)
                </p>
              </div>

              {/* Rendimiento */}
              <div>
                <label
                  htmlFor="rendimiento"
                  className="flex items-center text-sm font-medium leading-6 text-slate-900"
                >
                  Rendimiento (%)
                  <span className="ml-2 font-mono text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                    i
                  </span>
                </label>
                <input
                  type="number"
                  readOnly
                  value={data.rendimiento}
                  className="mt-2 block w-full rounded-md border-0 py-2 px-3.5 text-slate-500 bg-slate-100 shadow-sm ring-1 ring-inset ring-slate-300 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Cálculo: (h - e) / (a - (d + b)) × 100
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-3 mt-8 pt-8 border-t border-slate-200">
              {/* Unidades por Caja */}
              <div>
                <label
                  htmlFor="unidades_caja"
                  className="flex items-center text-sm font-medium leading-6 text-slate-900"
                >
                  Unidades por Caja
                  <span className="ml-2 font-mono text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                    i
                  </span>
                </label>
                <input
                  type="number"
                  id="unidades_caja"
                  name="unidades_caja"
                  required
                  value={data.unidades_caja}
                  onChange={inputChange}
                  className="mt-2 block w-full rounded-md border-0 py-2 px-3.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>

              {/* Número de Cajas */}
              <div>
                <label
                  htmlFor="numero_caja"
                  className="flex items-center text-sm font-medium leading-6 text-slate-900"
                >
                  Número de Cajas
                  <span className="ml-2 font-mono text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                    j
                  </span>
                </label>
                <input
                  type="number"
                  id="numero_caja"
                  name="numero_caja"
                  required
                  value={data.numero_caja}
                  onChange={inputChange}
                  className="mt-2 block w-full rounded-md border-0 py-2 px-3.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>

              {/* Unidades de Saldo */}
              <div>
                <label
                  htmlFor="unidades_saldo"
                  className="flex items-center text-sm font-medium leading-6 text-slate-900"
                >
                  Unidades de Saldo
                  <span className="ml-2 font-mono text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                    k
                  </span>
                </label>
                <input
                  type="number"
                  id="unidades_saldo"
                  name="unidades_saldo"
                  required
                  value={data.unidades_saldo}
                  onChange={inputChange}
                  className="mt-2 block w-full rounded-md border-0 py-2 px-3.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>

              {/* Total Saldo */}
              <div className="sm:col-span-3">
                <label
                  htmlFor="total_saldo"
                  className="flex items-center text-sm font-medium leading-6 text-slate-900"
                >
                  Total Saldo
                  <span className="ml-2 font-mono text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                    L
                  </span>
                </label>
                <input
                  type="number"
                  readOnly
                  value={data.total_saldo}
                  className="mt-2 block w-full rounded-md border-0 py-2 px-3.5 text-slate-500 bg-slate-100 shadow-sm ring-1 ring-inset ring-slate-300 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Cálculo: (i * j) + k
                </p>
              </div>

            </div>
          </fieldset>

          {/* --- Botón de Envío --- */}
          <div className="flex justify-end pt-6">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-8 py-3 text-lg font-semibold text-white shadow-lg transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Guardar Conciliación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewConsolida;
