import React, { useState, useEffect } from "react";
import {
  getConciliacion,
  guardar_conciliacion,
} from "@/app/services/planing/planingServices";
import { useParams } from "next/navigation";
import Text from "../text/Text";

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
  }, []);

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

      // Actualizar estado, redondeando a 2 decimales
      setData((prev) => ({
        ...prev,
        total: total.toFixed(2),
        rendimiento: rendimiento.toFixed(2),
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

  return (
    <div className="min-h-screen w-full bg-[#0a0d12] text-white p-[10px] sm:p-[10px] flex flex-col rounded-2xl">
      <div className="w-full rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-md overflow-hidden">
        <>
          <form
            id="formConciliacion"
            onSubmit={handleSubmit}
            className="space-y-8"
          >
            <div className="bg-white/2.5 px-[10px] py-[10px] border-b border-white/5 backdrop-blur-sm">
              <Text type="title" color="text-white">
                Formulario de Conciliación
              </Text>
            </div>

            {/* Información general */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 rounded-lg">
              <div>
                <Text type="subtitle" color="text-white">
                  Código Artículo
                </Text>
                <p className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm text-center">
                  {data.codart}
                </p>
              </div>

              <div>
                <Text type="subtitle" color="text-white">
                  Número de Orden
                </Text>
                <p className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm text-center">
                  {data.number_order}
                </p>
              </div>

              <div>
                <Text type="subtitle" color="text-white">
                  Descripción Maestra
                </Text>
                <p className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm text-center">
                  {data.descripcion_maestra}
                </p>
              </div>

              <div>
                <Text type="subtitle" color="text-white">
                  Código Artículo
                </Text>
                <p className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm text-center">
                  {data.codart}
                </p>
              </div>
            </div>
          </form>
        </>
      </div>
      <div className="w-full rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-md overflow-hidden mt-2">
        <>
          <form>
            <div className="bg-white/2.5 px-[10px] py-[10px] border-b border-white/5 backdrop-blur-sm">
              <Text type="title" color="text-white">
                Producción y Desperdicio
              </Text>
            </div>
            {/* Producción y Desperdicio */}
            <div className="p-6 rounded-lg">
              {/* Grid de 4 columnas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div>
                  <Text type="subtitle" color="text-white">
                    Cantidad Teorica (a)
                  </Text>
                  <p className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm text-center">
                    {data.quantityToProduce}
                  </p>
                </div>

                <div>
                  <Text type="subtitle" color="text-white">
                    Faltante (b)
                  </Text>
                  <input
                    type="number"
                    step="any"
                    id="faltante"
                    name="faltante"
                    required
                    value={data.faltante}
                    onChange={inputChange}
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 text-gray-900 bg-white border text-center"
                  />
                </div>

                <div>
                  <Text type="subtitle" color="text-white">
                    Adicionales (c)
                  </Text>
                  <input
                    type="number"
                    step="any"
                    id="adicionales"
                    name="adicionales"
                    required
                    value={data.adicionales}
                    onChange={inputChange}
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 text-gray-900 bg-white border text-center"
                  />
                </div>

                <div>
                  <Text type="subtitle" color="text-white">
                    Rechazo (d)
                  </Text>
                  <input
                    type="number"
                    step="any"
                    id="rechazo"
                    name="rechazo"
                    required
                    value={data.rechazo}
                    onChange={inputChange}
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 text-gray-900 bg-white border text-center"
                  />
                </div>
              </div>

              {/* Grid de 3 columnas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Text type="subtitle" color="text-white">
                    Daño en Proceso (e)
                  </Text>
                  <input
                    type="number"
                    step="any"
                    id="danno_proceso"
                    name="danno_proceso"
                    required
                    value={data.danno_proceso}
                    onChange={inputChange}
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 text-gray-900 bg-white border text-center"
                  />
                </div>

                <div>
                  <Text type="subtitle" color="text-white">
                    Devolución (f)
                  </Text>
                  <input
                    type="number"
                    step="any"
                    id="devolucion"
                    name="devolucion"
                    required
                    value={data.devolucion}
                    onChange={inputChange}
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 text-gray-900 bg-white border text-center"
                  />
                </div>

                <div>
                  <Text type="subtitle" color="text-white">
                    Sobrante (g)
                  </Text>
                  <input
                    type="number"
                    step="any"
                    id="sobrante"
                    name="sobrante"
                    required
                    value={data.sobrante}
                    onChange={inputChange}
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 text-gray-900 bg-white border text-center"
                  />
                </div>
              </div>
            </div>

            {/* Totales */}
            <div className="p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Text type="subtitle" color="text-white">
                    Total (h) = a + c + g - (b + d + e + f)
                  </Text>
                  <input
                    type="number"
                    step="any"
                    id="total"
                    name="total"
                    readOnly
                    value={data.total}
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm px-4 py-2 text-gray-900 bg-gray-100 border text-center"
                  />
                </div>

                <div>
                  <Text type="subtitle" color="text-white">
                    Rendimiento (i) = (h - e) / (a - (d + b)) × 100
                  </Text>
                  <input
                    type="number"
                    step="any"
                    id="rendimiento"
                    name="rendimiento"
                    readOnly
                    value={data.rendimiento}
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm px-4 py-2 text-gray-900 bg-gray-100 border text-center"
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
        </>
      </div>
    </div>
  );
};

export default NewConsolida;
