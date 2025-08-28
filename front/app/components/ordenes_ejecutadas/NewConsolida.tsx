import React, { useState, useEffect } from "react";
import {
  getConciliacion,
  guardar_conciliacion,
} from "@/app/services/planing/planingServices";
import { useParams } from "next/navigation";
import Text from "../text/Text";
import Button from "../buttons/buttons";

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
      const saldo = unidades_caja * numero_caja + unidades_saldo;

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
    <div className="w-full rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-md overflow-hidden mt-4">
      <div className="bg-white/2.5 px-[10px] py-[10px] border-b border-white/5 backdrop-blur-sm">
        <form id="formConciliacion" onSubmit={handleSubmit}>
          {/* --- Encabezado del Formulario --- */}
          <div className="text-center">
            <Text type="title" color="text-white">
              Formulario de Conciliación
            </Text>
            <Text type="subtitle" color="text-white">
              Complete los campos para calcular la producción y el rendimiento.
            </Text>
          </div>

          {/* --- Sección de Información de la Orden (Solo lectura) --- */}
          <div className="border-b border-slate-200 pb-8">
            <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-4">
              <div>
                <Text type="subtitle" color="text-white">
                  Número de Orden
                </Text>
                <p className="mt-1 text-base font-semibold text-slate-800 bg-slate-100 rounded-md px-3 py-2 font-mono text-center">
                  {data.number_order}
                </p>
              </div>
              <div className="sm:col-span-2">
                <Text type="subtitle" color="text-white">
                  Descripción Maestra
                </Text>
                <p className="mt-1 text-base font-semibold text-slate-800 bg-slate-100 rounded-md px-3 py-2 text-center">
                  {data.descripcion_maestra}
                </p>
              </div>
              <div>
                <Text type="subtitle" color="text-white">
                  Código Artículo
                </Text>
                <p className="mt-1 text-base font-semibold text-slate-800 bg-slate-100 rounded-md px-3 py-2 font-mono text-center">
                  {data.codart}
                </p>
              </div>
            </div>
          </div>

          {/* --- Sección de Producción y Desperdicio --- */}
          <div className="w-full rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-md overflow-hidden mt-4">
            <div className="min-h-screen w-full bg-[#1b2535] text-white p-[10px] sm:p-[10px] flex flex-col rounded-2xl">
              <Text type="title" color="text-white">
                Producción y Desperdicio
              </Text>
              <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-4 mt-4">
                {/* Cantidad Teórica */}
                <div className="sm:col-span-2">
                  <Text type="subtitle" color="text-white">
                    Cantidad Teórica
                    <span className="ml-2 font-mono text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                      a
                    </span>
                  </Text>
                  <p className="mt-2 w-full rounded-md border-0 bg-slate-100 px-3.5 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 text-center">
                    {data.quantityToProduce}
                  </p>
                </div>

                {/* Faltante */}
                <div>
                  <Text type="subtitle" color="text-white">
                    Faltante
                    <span className="ml-2 font-mono text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                      b
                    </span>
                  </Text>
                  <input
                    type="number"
                    step="any"
                    id="faltante"
                    name="faltante"
                    required
                    value={data.faltante}
                    onChange={inputChange}
                    className="mt-2 block w-full rounded-md border-0 py-2 px-3.5 text-center text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>

                {/* Adicionales */}
                <div>
                  <Text type="subtitle" color="text-white">
                    Adicionales
                    <span className="ml-2 font-mono text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                      c
                    </span>
                  </Text>
                  <input
                    type="number"
                    step="any"
                    id="adicionales"
                    name="adicionales"
                    required
                    value={data.adicionales}
                    onChange={inputChange}
                    className="mt-2 block w-full rounded-md border-0 py-2 px-3.5 text-center text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>

                {/* Rechazo */}
                <div>
                  <Text type="subtitle" color="text-white">
                    Rechazo
                    <span className="ml-2 font-mono text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                      d
                    </span>
                  </Text>
                  <input
                    type="number"
                    step="any"
                    id="rechazo"
                    name="rechazo"
                    required
                    value={data.rechazo}
                    onChange={inputChange}
                    className="mt-2 block w-full text-center rounded-md border-0 py-2 px-3.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>

                {/* Daño en Proceso */}
                <div>
                  <Text type="subtitle" color="text-white">
                    Daño en Proceso
                    <span className="ml-2 font-mono text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                      e
                    </span>
                  </Text>
                  <input
                    type="number"
                    step="any"
                    id="danno_proceso"
                    name="danno_proceso"
                    required
                    value={data.danno_proceso}
                    onChange={inputChange}
                    className="mt-2 block w-full text-center rounded-md border-0 py-2 px-3.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>

                {/* Devolución */}
                <div>
                  <Text type="subtitle" color="text-white">
                    Devolución
                    <span className="ml-2 font-mono text-xs  bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                      f
                    </span>
                  </Text>
                  <input
                    type="number"
                    step="any"
                    id="devolucion"
                    name="devolucion"
                    required
                    value={data.devolucion}
                    onChange={inputChange}
                    className="mt-2 block w-full text-center rounded-md border-0 py-2 px-3.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>

                {/* Sobrante */}
                <div>
                  <Text type="subtitle" color="text-white">
                    Sobrante
                    <span className="ml-2 font-mono text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                      g
                    </span>
                  </Text>
                  <input
                    type="number"
                    step="any"
                    id="sobrante"
                    name="sobrante"
                    required
                    value={data.sobrante}
                    onChange={inputChange}
                    className="mt-2 block w-full text-center rounded-md border-0 py-2 px-3.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              {/* --- Sección de Totales y Cajas --- */}
              <Text type="title" color="text-white">
                Totales y Empacado
              </Text>
              <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 mt-4">
                {/* Total */}
                <div>
                  <Text type="subtitle" color="text-white">
                    Total Producido
                    <span className="ml-2 font-mono text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                      h
                    </span>
                  </Text>
                  <input
                    type="number"
                    readOnly
                    value={data.total}
                    className="mt-2 block w-full text-center rounded-md border-0 py-2 px-3.5 text-slate-500 bg-slate-100 shadow-sm ring-1 ring-inset ring-slate-300 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-slate-200 text-center">
                    Cálculo: a + c + g - (b + d + e + f)
                  </p>
                </div>

                {/* Rendimiento */}
                <div>
                  <Text type="subtitle" color="text-white">
                    Rendimiento (%)
                    <span className="ml-2 font-mono text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                      i
                    </span>
                  </Text>
                  <input
                    type="number"
                    readOnly
                    value={data.rendimiento}
                    className="mt-2 block text-center w-full rounded-md border-0 py-2 px-3.5 text-slate-500 bg-slate-100 shadow-sm ring-1 ring-inset ring-slate-300 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-slate-200 text-center">
                    Cálculo: (h - e) / (a - (d + b)) × 100
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-3 mt-8 pt-8 border-t border-slate-200">
                {/* Unidades por Caja */}
                <div>
                  <Text type="subtitle" color="text-white">
                    Unidades por Caja
                    <span className="ml-2 font-mono text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                      i
                    </span>
                  </Text>
                  <input
                    type="number"
                    id="unidades_caja"
                    name="unidades_caja"
                    required
                    value={data.unidades_caja}
                    onChange={inputChange}
                    className="mt-2 block w-full text-center rounded-md border-0 py-2 px-3.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>

                {/* Número de Cajas */}
                <div>
                  <Text type="subtitle" color="text-white">
                    Número de Cajas
                    <span className="ml-2 font-mono text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                      j
                    </span>
                  </Text>
                  <input
                    type="number"
                    id="numero_caja"
                    name="numero_caja"
                    required
                    value={data.numero_caja}
                    onChange={inputChange}
                    className="mt-2 block w-full text-center rounded-md border-0 py-2 px-3.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>

                {/* Unidades de Saldo */}
                <div>
                  <Text type="subtitle" color="text-white">
                    Unidades de Saldo
                    <span className="ml-2 font-mono text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                      k
                    </span>
                  </Text>
                  <input
                    type="number"
                    id="unidades_saldo"
                    name="unidades_saldo"
                    required
                    value={data.unidades_saldo}
                    onChange={inputChange}
                    className="mt-2 block w-full text-center rounded-md border-0 py-2 px-3.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>

                {/* Total Saldo */}
                <div className="sm:col-span-3">
                  <Text type="subtitle" color="text-white">
                    Total Saldo
                    <span className="ml-2 font-mono text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                      L
                    </span>
                  </Text>
                  <input
                    type="number"
                    readOnly
                    value={data.total_saldo}
                    className="mt-2 block w-full text-center rounded-md border-0 py-2 px-3.5 text-slate-500 bg-slate-100 shadow-sm ring-1 ring-inset ring-slate-300 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-slate-200 text-center">
                    Cálculo: (i * j) + k
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* --- Botón de Envío --- */}
          <hr className="border-t border-white/20 my-6" />
          <div className="flex justify-center">
            <Button
              type="submit"
              variant="after2"
              label="Guardar Conciliación"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewConsolida;
