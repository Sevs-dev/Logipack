import React, { useState, useEffect, useRef } from "react";
import {
  getConciliacion,
  guardar_conciliacion,
} from "@/app/services/planing/planingServices";
import { useParams } from "next/navigation";
import { showError, showSuccess } from "../toastr/Toaster";
import Text from "../text/Text";
import Button from "../buttons/buttons";


interface Orden {
  adaptation_date_id: string;
  descripcion_maestra: string;
  number_order: string;
  orden_ejecutada: string;
  orderType: string;
  requiere_bom: string;
}

interface Articulos {
  codart: string;
  desart: string;
  quantityToProduce: string;
  faltante: string;
  adicionales: string;
  rechazo: string;
  danno_proceso: string;
  devolucion: string;
  sobrante: string;
  total: string;
  rendimiento: string;
}

interface Conciliaciones {
  padre: string;
  hijo: string;
  diferencia: string;
  validate: string;
  list: [];
}

const NewConsolida = () => {
  const params = useParams();
  const refForm = useRef<HTMLFormElement>(null);
  // Ordenes
  const [orden, setOrden] = useState<Orden>({
    adaptation_date_id: "",
    descripcion_maestra: "",
    number_order: "",
    orden_ejecutada: "",
    orderType: "",
    requiere_bom: "",
  });

  // // Articulos
  // const [articulo_principal, setArticulo_principal] = useState<Articulos>({
  //   codart: "",
  //   desart: "",
  //   quantityToProduce: "",
  // });

  // // Articulos secundarios
  // const [articulo_secundario, setArticulo_secundario] = useState<Articulos[]>([]);

  // Conciliaciones
  const [conciliaciones, setConciliaciones] = useState<Conciliaciones>({
    padre: "",
    hijo: "",
    diferencia: "",
    validate: "",
    list: [],
  });

  const [principal, setPrincipal] = useState<Articulos>({
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
  });

  const [secundarios, setSecundarios] = useState<Articulos[]>([]);

  const [empaque, setEmpaque] = useState({
    // Empacado
    unidades_caja: "",
    numero_caja: "",
    unidades_saldo: "",
    total_saldo: "",
  });

  useEffect(() => {
    const obtener_conciliacion = async () => {
      try {
        const resp = await getConciliacion(Number(params.id));
        setOrden((prev) => ({ ...prev, ...resp?.orden }));
        // setArticulo_principal((prev) => ({ ...prev, ...resp?.articulo_principal }));
        // setArticulo_secundario(resp?.articulo_segundario || []);

        setPrincipal({
          ...principal,
          desart: resp?.articulo_principal?.desart,
          codart: resp?.articulo_principal?.codart,
          quantityToProduce: resp?.articulo_principal?.quantityToProduce,
        });
        setSecundarios(
          resp?.articulo_segundario?.map((articulo: Articulos) => ({
            ...articulo,
            desart: articulo.desart,
            codart: articulo.codart,
            quantityToProduce: orden.orderType === "P" ? articulo.quantityToProduce : "",
          })) || []
        );
        setConciliaciones((prev) => ({ ...prev, ...resp?.conciliaciones }));
      } catch (error: unknown) {
        console.error("Error en obtener_conciliacion:", error);
        throw error;
      }
    };

    // Obtener conciliacion
    obtener_conciliacion();
  }, [params.id]);

  const inputChange = (e: React.ChangeEvent<HTMLInputElement>, index?: number) => {
    const { name, value } = e.target;

    if (index === undefined) {
      // Es el principal
      setPrincipal(prev => {
        let currentValues = { ...prev };

        if (orden.orderType === "P") {
          currentValues = {
            ...prev,
            quantityToProduce: principal.quantityToProduce,
          };
        }

        const key = name as keyof typeof currentValues;
        currentValues[key] = value;

        // Calcular valores
        const currentTotal =
          (Number(currentValues.quantityToProduce) +
            Number(currentValues.adicionales) +
            Number(currentValues.sobrante)) -
          (Number(currentValues.faltante) +
            Number(currentValues.rechazo) +
            Number(currentValues.danno_proceso) +
            Number(currentValues.devolucion));

        const denominador =
          Number(currentValues.quantityToProduce) -
          (Number(currentValues.faltante) +
            Number(currentValues.rechazo) +
            Number(currentValues.danno_proceso) +
            Number(currentValues.devolucion));

        const currentRendimiento =
          denominador > 0
            ? ((Number(currentValues.total) - Number(currentValues.danno_proceso)) /
              denominador) *
            100
            : 0;

        return {
          ...currentValues,
          total: Number(currentTotal).toFixed(2),
          rendimiento: Number(currentRendimiento).toFixed(2),
        };
      });
    } else {
      // Es un secundario
      setSecundarios(prev => {
        const copy = [...prev];

        // si no existe, crearlo para evitar undefined
        if (!copy[index]) {
          copy[index] = {
            ...prev[index],
            quantityToProduce: "",
            adicionales: "",
            sobrante: "",
            faltante: "",
            rechazo: "",
            danno_proceso: "",
            devolucion: "",
            total: "",
            rendimiento: "",
          };
        }
        let currentValues = { ...copy[index] };
        const key = name as keyof typeof currentValues;
        currentValues[key] = value;

        // Condición especial para tipo P
        if (orden.orderType === "P") {
          currentValues = {
            ...currentValues,
            quantityToProduce: Number(secundarios[index]?.quantityToProduce).toFixed(2),
          };
        }

        // Calcular valores
        const currentTotal =
          (Number(currentValues.quantityToProduce) +
            Number(currentValues.adicionales) +
            Number(currentValues.sobrante)) -
          (Number(currentValues.faltante) +
            Number(currentValues.rechazo) +
            Number(currentValues.danno_proceso) +
            Number(currentValues.devolucion));

        const denominador =
          Number(currentValues.quantityToProduce) -
          (Number(currentValues.faltante) +
            Number(currentValues.rechazo) +
            Number(currentValues.danno_proceso) +
            Number(currentValues.devolucion));

        const currentRendimiento =
          denominador > 0
            ? ((Number(currentValues.total) - Number(currentValues.danno_proceso)) /
              denominador) *
            100
            : 0;

        // Actualizo el secundario en esa posición
        copy[index] = {
          ...currentValues,
          total: Number(currentTotal).toFixed(2),
          rendimiento: Number(currentRendimiento).toFixed(2),
        };

        return copy;
      });
    }
  };


  const calculaEmpaque = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setEmpaque((prev) => {
      let currentValues = { ...prev };
      const key = name as keyof typeof currentValues;
      currentValues[key] = value;

      // Calcular saldo
      const saldo = Number(currentValues.unidades_caja) * Number(currentValues.numero_caja) + Number(currentValues.unidades_saldo);
      return {
        ...currentValues,
        total_saldo: saldo.toFixed(2),
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = {
      orden,
      principal,
      secundarios,
      empaque,
    }
    console.log(result);

    const response = await guardar_conciliacion(result);
    if (response.message === "ok") {
      showSuccess("Conciliación guardada correctamente");
      console.log(response);
      setTimeout(() => {
        window.close();
      }, 2000);
    } else {
      showError("Error al guardar la conciliación o datos existentes.");
    }
  };


  if (orden?.orden_ejecutada === "") {
    return (
      <div>
        <h1>Cargando...</h1>
      </div>
    );
  }

  if (orden?.orden_ejecutada === undefined || orden?.orden_ejecutada === null || orden?.orden_ejecutada === "") {
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
          // id="formConciliacion"
          ref={refForm}
          onSubmit={handleSubmit}
          className="bg-[rgb(var(--surface))] rounded-2xl shadow-xl 
            p-8 space-y-10 border border-[rgb(var(--border))]">

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
                  {orden?.orden_ejecutada}
                </p>
              </div>

              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Orden N°
                </Text>
                <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))] bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                  {orden?.number_order}
                </p>
              </div>

              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Tipo de Orden
                </Text>
                <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))] bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                  {orden?.orderType}
                </p>
              </div>

              <div className="sm:col-span-2">
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Descripción Maestra
                </Text>
                <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))] bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2">
                  {orden?.descripcion_maestra}
                </p>
              </div>

              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Código Artículo
                </Text>
                <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))] bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                  {principal?.codart}
                </p>
              </div>

              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Total
                </Text>
                <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))] bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                  {conciliaciones?.padre}
                </p>
              </div>

              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Total Parciales
                </Text>
                <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))] bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                  {conciliaciones?.hijo}
                </p>
              </div>

              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Diferencia
                </Text>
                <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))] bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                  {conciliaciones?.diferencia}
                </p>
              </div>
            </div>
          </fieldset>

          {/* --- Sección de Producción y Desperdicio artículo principal --- */}
          <fieldset className="border border-[rgb(var(--border))] p-6 rounded-xl">
            <legend className="-ml-1 px-2 text-lg font-semibold text-[rgb(var(--accent))]">
              Producción y Desperdicio
            </legend>

            <div>
              <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                Código Artículo
              </Text>
              <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))] bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                {principal?.codart}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-4 mt-4">
              {/* Cantidad Teórica */}
              <div className="sm:col-span-2">
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Cantidad Teórica
                  <span className="ml-2 font-mono text-xs bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))]/70 px-1.5 py-0.5 rounded-full">
                    a
                  </span>
                </Text>

                {orden?.orderType === "H" ? (
                  <input
                    type="number"
                    step="any"
                    id="quantityToProduce"
                    name="quantityToProduce"
                    required
                    value={principal?.quantityToProduce}
                    onChange={inputChange}
                    className="mt-2 block w-full text-center rounded-md bg-[rgb(var(--surface))] px-3.5 py-2 text-[rgb(var(--foreground))]
                         shadow-sm ring-1 ring-inset ring-[rgb(var(--border))] border border-transparent
                         placeholder:text-[rgb(var(--foreground))]/50
                         focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))]"
                  />
                ) : (
                  <p id="teorica"
                    className="mt-2 block w-full text-center rounded-md py-2 px-3.5 text-[rgb(var(--foreground))]/60
                           bg-[rgb(var(--surface-muted))] shadow-sm ring-1 ring-inset ring-[rgb(var(--border))]
                           cursor-not-allowed">
                    {Number(principal?.quantityToProduce).toFixed(2)}
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
                  value={principal?.faltante}
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
                  value={principal?.adicionales}
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
                  value={principal?.rechazo}
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
                  value={principal?.danno_proceso}
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
                  value={principal?.devolucion}
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
                  value={principal?.sobrante}
                  onChange={inputChange}
                  className="mt-2 block w-full text-center rounded-md bg-[rgb(var(--surface))] px-3.5 py-2 text-[rgb(var(--foreground))]
                         shadow-sm ring-1 ring-inset ring-[rgb(var(--border))] border border-transparent
                         placeholder:text-[rgb(var(--foreground))]/50
                         focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))]"
                />
              </div>

              {/* Total Producido */}
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Total Producido
                  <span className="ml-2 font-mono text-xs bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))]/70 px-1.5 py-0.5 rounded-full">
                    h
                  </span>
                </Text>
                <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))]
                   bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                  {principal?.total}
                  {/* {((Number(principal?.quantityToProduce) + Number(principal?.adicionales) + Number(principal?.sobrante)) - (Number(principal?.faltante) + Number(principal?.rechazo) + Number(principal?.danno_proceso) + Number(principal?.devolucion))).toString()} */}
                </p>
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
                <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))]
                   bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                  {principal?.rendimiento}
                  {
                    // ((Number(principal?.total) - Number(principal?.danno_proceso)) / (Number(principal?.quantityToProduce) - (Number(principal?.faltante) + Number(principal?.rechazo) + Number(principal?.danno_proceso) + Number(principal?.devolucion))) * 100).toString()
                  }
                </p>
                <p className="mt-1 text-xs text-[rgb(var(--foreground))]/60">
                  Cálculo: (h - e) / (a - (d + b)) × 100
                </p>
              </div>

            </div>
          </fieldset>

          {/* --- Sección de Producción y Desperdicio artículo secundario --- */}
          {secundarios.map((item, i) => (
            <fieldset key={i} className="border border-[rgb(var(--border))] p-6 rounded-xl">
              <legend className="-ml-1 px-2 text-lg font-semibold text-[rgb(var(--accent))]">
                Producción y Desperdicio
              </legend>

              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Código Artículo
                </Text>
                <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))] bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                  {item?.codart}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-4 mt-4">
                {/* Cantidad Teórica */}
                <div className="sm:col-span-2">
                  <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                    Cantidad Teórica
                    <span className="ml-2 font-mono text-xs bg-[rgb(var(--surface-muted))]
                      text-[rgb(var(--foreground))]/70 px-1.5 py-0.5 rounded-full">
                      a
                    </span>
                  </Text>

                  {orden?.orderType === "H" ? (
                    <input
                      type="number"
                      step="any"
                      id={`quantityToProduce`}
                      name={`quantityToProduce`}
                      required
                      value={secundarios[i]?.quantityToProduce}
                      onChange={(e) => inputChange(e, i)}
                      className="mt-2 block w-full text-center rounded-md bg-[rgb(var(--surface))] px-3.5 py-2 text-[rgb(var(--foreground))]
                        shadow-sm ring-1 ring-inset ring-[rgb(var(--border))] border border-transparent
                        placeholder:text-[rgb(var(--foreground))]/50
                        focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))]"
                    />
                  ) : (
                    <p
                      className="mt-2 block w-full text-center rounded-md py-2 px-3.5 text-[rgb(var(--foreground))]/60
                        bg-[rgb(var(--surface-muted))] shadow-sm ring-1 ring-inset ring-[rgb(var(--border))]
                        cursor-not-allowed">
                      {Number(item?.quantityToProduce).toFixed(2)}
                    </p>
                  )}
                </div>

                {/* Faltante */}
                <div>
                  <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                    Faltante
                    <span className="ml-2 font-mono text-xs 
                     bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))]/70 px-1.5 py-0.5 rounded-full">
                      b
                    </span>
                  </Text>
                  <input
                    type="number"
                    step="any"
                    id={`faltante`}
                    name={`faltante`}
                    required
                    value={secundarios[i]?.faltante}
                    onChange={(e) => inputChange(e, i)}
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
                    id={`adicionales`}
                    name={`adicionales`}
                    required
                    value={secundarios[i]?.adicionales}
                    onChange={(e) => inputChange(e, i)}
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
                    id={`rechazo`}
                    name={`rechazo`}
                    required
                    value={secundarios[i]?.rechazo}
                    onChange={(e) => inputChange(e, i)}
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
                    id={`danno_proceso`}
                    name={`danno_proceso`}
                    required
                    value={secundarios[i]?.danno_proceso}
                    onChange={(e) => inputChange(e, i)}
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
                    id={`devolucion`}
                    name={`devolucion`}
                    required
                    value={secundarios[i]?.devolucion}
                    onChange={(e) => inputChange(e, i)}
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
                    id={`sobrante`}
                    name={`sobrante`}
                    required
                    value={secundarios[i]?.sobrante}
                    onChange={(e) => inputChange(e, i)}
                    className="mt-2 block w-full text-center rounded-md bg-[rgb(var(--surface))] px-3.5 py-2 text-[rgb(var(--foreground))]
                      shadow-sm ring-1 ring-inset ring-[rgb(var(--border))] border border-transparent
                      placeholder:text-[rgb(var(--foreground))]/50
                      focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))]"
                  />
                </div>

                {/* Total Producido */}
                <div>
                  <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                    Total Producido
                    <span className="ml-2 font-mono text-xs bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))]/70 px-1.5 py-0.5 rounded-full">
                      h
                    </span>
                  </Text>
                  <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))]
                   bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                    {secundarios[i]?.total}
                  </p>
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
                  <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))]
                   bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                    {secundarios[i]?.rendimiento}
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--foreground))]/60">
                    Cálculo: (h - e) / (a - (d + b)) × 100
                  </p>
                </div>

              </div>
            </fieldset>

          ))}

          {/* --- Sección de Totales y Cajas --- */}
          <fieldset className="border border-[rgb(var(--border))] p-6 rounded-xl">
            <legend className="-ml-1 px-2 text-lg font-semibold text-[rgb(var(--accent))]">
              Totales y Empacado
            </legend>

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
                  value={empaque?.unidades_caja}
                  onChange={calculaEmpaque}
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
                  value={empaque?.numero_caja}
                  onChange={calculaEmpaque}
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
                  value={empaque?.unidades_saldo}
                  onChange={calculaEmpaque}
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
                <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))]
                   bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                  {empaque?.total_saldo}
                  {/* {(Number(principal?.unidades_caja) * Number(principal?.numero_caja)) + Number(principal?.unidades_saldo)} */}
                </p>
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
