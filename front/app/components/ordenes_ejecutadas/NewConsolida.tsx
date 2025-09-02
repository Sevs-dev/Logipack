import React, { useState, useEffect } from "react";
import {
  getConciliacion,
  guardar_conciliacion,
} from "@/app/services/planing/planingServices";
import { useParams } from "next/navigation";
import { showError, showSuccess } from "../toastr/Toaster";
import Text from "../text/Text";
import Button from "../buttons/buttons";

const NewConsolida = () => {
  const params = useParams();
  const [teorica, setTeorica] = useState({
    padre: "",
    hijo: "",
    diferencia: "",
  });
  const [data, setData] = useState({
    orden_ejecutada: "",
    adaptation_date_id: "",
    number_order: "",
    orderType: "",
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
        console.log(response);
        setData((prev) => ({
          ...prev,
          orden_ejecutada: response?.orden?.orden_ejecutada,
          adaptation_date_id: response?.orden?.adaptation_date_id,
          number_order: response?.orden?.number_order,
          orderType: response?.orden?.orderType,
          descripcion_maestra: response?.orden?.descripcion_maestra,
          codart: response?.conciliacion?.codart,
          desart: response?.conciliacion?.desart,
          quantityToProduce:
            response?.orden?.orderType === "H" ? "" : response?.diferencia,
        }));
        setTeorica((prev) => ({
          ...prev,
          padre: response?.padre,
          hijo: response?.hijos,
          diferencia: response?.diferencia,
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
      showSuccess("Conciliación guardada correctamente");
      setTimeout(() => {
        window.close();
      }, 2000);
    } else {
      showError("Error al guardar la conciliación o datos existentes.");
    }
  };

  const validaCantidad = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.quantityToProduce === "") {
      showError("Debe ingresar una cantidad.");
      return false;
    }

    if (Number(data.quantityToProduce) < 0) {
      showError("La cantidad debe ser mayor a 0.");
      setData({ ...data, quantityToProduce: "" });
      return false;
    }

    if (Number(data.quantityToProduce) > Number(teorica.diferencia)) {
      showError("La cantidad debe ser menor o igual a la diferencia.");
      setData({ ...data, quantityToProduce: "" });
      return false;
    }

    return true;
  };

  if (data?.orden_ejecutada === "") {
    return (
      <div>
        <h1>Cargando...</h1>
      </div>
    );
  }

  if (
    data?.orden_ejecutada === undefined ||
    data?.orden_ejecutada === null ||
    data?.orden_ejecutada === ""
  ) {
    return (
      <div>
        <h1>Sin datos de conciliación</h1>
      </div>
    );
  }

  // --- COPIA Y PEGA ESTE CÓDIGO ---

  return (
    // Contenedor principal con un fondo sutil para que el formulario resalte
    <div className="min-h-screen py-12 bg-[rgb(var(--background))]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <form
          id="formConciliacion"
          onSubmit={handleSubmit}
          className="bg-[rgb(var(--surface))] rounded-2xl shadow-xl p-8 space-y-10 border border-[rgb(var(--border))]"
        >
          {/* --- Encabezado del Formulario --- */}
          <div className="text-center">
            <Text type="title" color="text-[rgb(var(--foreground))]">
              Formulario de Conciliación
            </Text>
            <p className="mt-3 text-lg leading-8 text-[rgb(var(--foreground))]/70">
              Complete los campos para calcular la producción y el rendimiento.
            </p>
          </div>

          {/* --- Sección de Información de la Orden (Solo lectura) --- */}
          <fieldset className="border border-[rgb(var(--border))] p-6 rounded-xl">
            <legend className="-ml-1 px-2 text-lg font-semibold text-[rgb(var(--accent))]">
              Información de la Orden
            </legend>

            <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-3">
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Orden Ejecutada
                </Text>
                <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))] bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2">
                  {data.orden_ejecutada}
                </p>
              </div>

              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Número de Orden
                </Text>
                <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))] bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                  {data.number_order}
                </p>
              </div>

              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Tipo de Orden
                </Text>
                <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))] bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                  {data.orderType}
                </p>
              </div>

              <div className="sm:col-span-2">
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Descripción Maestra
                </Text>
                <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))] bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2">
                  {data.descripcion_maestra}
                </p>
              </div>

              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Código Artículo
                </Text>
                <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))] bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                  {data.codart}
                </p>
              </div>

              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Total
                </Text>
                <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))] bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                  {teorica?.padre}
                </p>
              </div>

              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Total Parciales
                </Text>
                <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))] bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                  {teorica?.hijo}
                </p>
              </div>

              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Diferencia
                </Text>
                <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))] bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                  {teorica?.diferencia}
                </p>
              </div>
            </div>
          </fieldset>

          {/* --- Sección de Producción y Desperdicio --- */}
          <fieldset className="border border-[rgb(var(--border))] p-6 rounded-xl">
            <legend className="-ml-1 px-2 text-lg font-semibold text-[rgb(var(--accent))]">
              Producción y Desperdicio
            </legend>

            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-4 mt-4">
              {/* Cantidad Teórica */}
              <div className="sm:col-span-2">
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Cantidad Teórica
                  <span className="ml-2 font-mono text-xs bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))]/70 px-1.5 py-0.5 rounded-full">
                    a
                  </span>
                </Text>

                {data?.orderType === "H" ? (
                  <input
                    type="number"
                    step="any"
                    id="quantityToProduce"
                    name="quantityToProduce"
                    required
                    value={data.quantityToProduce}
                    onChange={inputChange}
                    onBlur={validaCantidad}
                    className="mt-2 w-full rounded-md bg-[rgb(var(--surface))] px-3.5 py-2 text-[rgb(var(--foreground))]
                           shadow-sm ring-1 ring-inset ring-[rgb(var(--border))] border border-transparent
                           placeholder:text-[rgb(var(--foreground))]/50
                           focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))]"
                  />
                ) : (
                  <p
                    className="mt-2 block w-full text-center rounded-md py-2 px-3.5 text-[rgb(var(--foreground))]/60
                           bg-[rgb(var(--surface-muted))] shadow-sm ring-1 ring-inset ring-[rgb(var(--border))]
                           cursor-not-allowed"
                  >
                    {data.quantityToProduce}
                  </p>
                )}
              </div>

              {/* Faltante */}
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Faltante
                  <span className="ml-2 font-mono text-xs bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))]/70 px-1.5 py-0.5 rounded-full">
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
                  className="mt-2 block w-full text-center rounded-md bg-[rgb(var(--surface))] px-3.5 py-2 text-[rgb(var(--foreground))]
                         shadow-sm ring-1 ring-inset ring-[rgb(var(--border))] border border-transparent
                         placeholder:text-[rgb(var(--foreground))]/50
                         focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))]"
                />
              </div>

              {/* Adicionales */}
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Adicionales
                  <span className="ml-2 font-mono text-xs bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))]/70 px-1.5 py-0.5 rounded-full">
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
                  className="mt-2 block w-full text-center rounded-md bg-[rgb(var(--surface))] px-3.5 py-2 text-[rgb(var(--foreground))]
                         shadow-sm ring-1 ring-inset ring-[rgb(var(--border))] border border-transparent
                         placeholder:text-[rgb(var(--foreground))]/50
                         focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))]"
                />
              </div>

              {/* Rechazo */}
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Rechazo
                  <span className="ml-2 font-mono text-xs bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))]/70 px-1.5 py-0.5 rounded-full">
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
                  className="mt-2 block w-full text-center rounded-md bg-[rgb(var(--surface))] px-3.5 py-2 text-[rgb(var(--foreground))]
                         shadow-sm ring-1 ring-inset ring-[rgb(var(--border))] border border-transparent
                         placeholder:text-[rgb(var(--foreground))]/50
                         focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))]"
                />
              </div>

              {/* Daño en Proceso */}
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Daño en Proceso
                  <span className="ml-2 font-mono text-xs bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))]/70 px-1.5 py-0.5 rounded-full">
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
                  className="mt-2 block w-full text-center rounded-md bg-[rgb(var(--surface))] px-3.5 py-2 text-[rgb(var(--foreground))]
                         shadow-sm ring-1 ring-inset ring-[rgb(var(--border))] border border-transparent
                         placeholder:text-[rgb(var(--foreground))]/50
                         focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))]"
                />
              </div>

              {/* Devolución */}
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Devolución
                  <span className="ml-2 font-mono text-xs bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))]/70 px-1.5 py-0.5 rounded-full">
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
                  className="mt-2 block w-full text-center rounded-md bg-[rgb(var(--surface))] px-3.5 py-2 text-[rgb(var(--foreground))]
                         shadow-sm ring-1 ring-inset ring-[rgb(var(--border))] border border-transparent
                         placeholder:text-[rgb(var(--foreground))]/50
                         focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))]"
                />
              </div>

              {/* Sobrante */}
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Sobrante
                  <span className="ml-2 font-mono text-xs bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))]/70 px-1.5 py-0.5 rounded-full">
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
                  className="mt-2 block w-full text-center rounded-md bg-[rgb(var(--surface))] px-3.5 py-2 text-[rgb(var(--foreground))]
                         shadow-sm ring-1 ring-inset ring-[rgb(var(--border))] border border-transparent
                         placeholder:text-[rgb(var(--foreground))]/50
                         focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))]"
                />
              </div>
            </div>
          </fieldset>

          {/* --- Sección de Totales y Cajas --- */}
          <fieldset className="border border-[rgb(var(--border))] p-6 rounded-xl">
            <legend className="-ml-1 px-2 text-lg font-semibold text-[rgb(var(--accent))]">
              Totales y Empacado
            </legend>

            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 mt-4">
              {/* Total Producido */}
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Total Producido
                  <span className="ml-2 font-mono text-xs bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))]/70 px-1.5 py-0.5 rounded-full">
                    h
                  </span>
                </Text>
                <input
                  type="number"
                  readOnly
                  value={data.total}
                  className="mt-2 block w-full text-center rounded-md py-2 px-3.5
                         text-[rgb(var(--foreground))]/60 bg-[rgb(var(--surface-muted))]
                         shadow-sm ring-1 ring-inset ring-[rgb(var(--border))] cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-[rgb(var(--foreground))]/60">
                  Cálculo: a + c + g - (b + d + e + f)
                </p>
              </div>

              {/* Rendimiento */}
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Rendimiento (%)
                  <span className="ml-2 font-mono text-xs bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))]/70 px-1.5 py-0.5 rounded-full">
                    i
                  </span>
                </Text>
                <input
                  type="number"
                  readOnly
                  value={data.rendimiento}
                  className="mt-2 block w-full text-center rounded-md py-2 px-3.5
                         text-[rgb(var(--foreground))]/60 bg-[rgb(var(--surface-muted))]
                         shadow-sm ring-1 ring-inset ring-[rgb(var(--border))] cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-[rgb(var(--foreground))]/60">
                  Cálculo: (h - e) / (a - (d + b)) × 100
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-3 mt-8 pt-8 border-t border-[rgb(var(--border))]">
              {/* Unidades por Caja */}
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Unidades por Caja
                  <span className="ml-2 font-mono text-xs bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))]/70 px-1.5 py-0.5 rounded-full">
                    j
                  </span>
                </Text>
                <input
                  type="number"
                  id="unidades_caja"
                  name="unidades_caja"
                  required
                  value={data.unidades_caja}
                  onChange={inputChange}
                  className="mt-2 block w-full text-center rounded-md bg-[rgb(var(--surface))] px-3.5 py-2 text-[rgb(var(--foreground))]
                         shadow-sm ring-1 ring-inset ring-[rgb(var(--border))] border border-transparent
                         placeholder:text-[rgb(var(--foreground))]/50
                         focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))] sm:text-sm sm:leading-6"
                />
              </div>

              {/* Número de Cajas */}
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Número de Cajas
                  <span className="ml-2 font-mono text-xs bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))]/70 px-1.5 py-0.5 rounded-full">
                    k
                  </span>
                </Text>
                <input
                  type="number"
                  id="numero_caja"
                  name="numero_caja"
                  required
                  value={data.numero_caja}
                  onChange={inputChange}
                  className="mt-2 block w-full text-center rounded-md bg-[rgb(var(--surface))] px-3.5 py-2 text-[rgb(var(--foreground))]
                         shadow-sm ring-1 ring-inset ring-[rgb(var(--border))] border border-transparent
                         placeholder:text-[rgb(var(--foreground))]/50
                         focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))] sm:text-sm sm:leading-6"
                />
              </div>

              {/* Unidades de Saldo */}
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Unidades de Saldo
                  <span className="ml-2 font-mono text-xs bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))]/70 px-1.5 py-0.5 rounded-full">
                    l
                  </span>
                </Text>
                <input
                  type="number"
                  id="unidades_saldo"
                  name="unidades_saldo"
                  required
                  value={data.unidades_saldo}
                  onChange={inputChange}
                  className="mt-2 block w-full text-center rounded-md bg-[rgb(var(--surface))] px-3.5 py-2 text-[rgb(var(--foreground))]
                         shadow-sm ring-1 ring-inset ring-[rgb(var(--border))] border border-transparent
                         placeholder:text-[rgb(var(--foreground))]/50
                         focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))] sm:text-sm sm:leading-6"
                />
              </div>

              {/* Total Saldo */}
              <div className="sm:col-span-3">
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Total Saldo
                  <span className="ml-2 font-mono text-xs bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))]/70 px-1.5 py-0.5 rounded-full">
                    L
                  </span>
                </Text>
                <input
                  type="number"
                  readOnly
                  value={data.total_saldo}
                  className="mt-2 block w-full text-center rounded-md py-2 px-3.5
                         text-[rgb(var(--foreground))]/60 bg-[rgb(var(--surface-muted))]
                         shadow-sm ring-1 ring-inset ring-[rgb(var(--border))] cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-center text-[rgb(var(--foreground))]/60">
                  Cálculo: (j * k) + l
                </p>
              </div>
            </div>
          </fieldset>

          {/* --- Botón de Envío --- */}
          <hr className="border-t border-[rgb(var(--border))] my-6" />
          <div className="flex justify-center">
            <Button
              type="submit"
              variant="create"
              label="Guardar Conciliación"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewConsolida;
