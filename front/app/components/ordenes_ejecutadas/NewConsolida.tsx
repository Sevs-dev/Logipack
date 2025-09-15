// NewConsolida.tsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  getConciliacion,
  guardar_conciliacion,
} from "@/app/services/planing/planingServices";
import { useParams } from "next/navigation";
import { showError, showSuccess } from "../toastr/Toaster";
import Text from "../text/Text";
import Button from "../buttons/buttons";

/* =========================
 *        Tipos
 * ========================= */
type StrNum = string; // valores numéricos en inputs controlados se manejan como string

interface Orden {
  adaptation_date_id: string;
  descripcion_maestra: string;
  number_order: string;
  orden_ejecutada: string;
  orderType: "P" | "H" | string;
  requiere_bom: string;
}

interface Articulos {
  codart: StrNum;
  desart: StrNum;
  quantityToProduce: StrNum;
  faltante: StrNum;
  adicionales: StrNum;
  rechazo: StrNum;
  danno_proceso: StrNum;
  devolucion: StrNum;
  sobrante: StrNum;
  total: StrNum;
  rendimiento: StrNum;
}

interface Conciliaciones {
  padre: StrNum;
  hijo: StrNum;
  diferencia: StrNum;
  validate: StrNum;
  list: string[];
}

interface Empaque {
  unidades_caja: StrNum;
  numero_caja: StrNum;
  unidades_saldo: StrNum;
  total_saldo: StrNum;
}

/** Estructura esperada del servicio getConciliacion */
interface ApiConciliacion {
  orden?: Partial<Orden> | null;
  articulo_principal?: Partial<Articulos> | null;
  articulo_segundario?: Array<Partial<Articulos>> | null;
  conciliaciones?: Partial<Conciliaciones> | null;
}

/* =========================
 *     Utilidades helper
 * ========================= */
const s = (v: unknown): string =>
  v === undefined || v === null ? "" : String(v);

const nz = (v: unknown): number => {
  const num = Number(v);
  return isFinite(num) ? num : 0;
};

const normalizeArticulo = (a?: Partial<Articulos>): Articulos => ({
  codart: s(a?.codart),
  desart: s(a?.desart),
  quantityToProduce: s(a?.quantityToProduce),
  faltante: s(a?.faltante),
  adicionales: s(a?.adicionales),
  rechazo: s(a?.rechazo),
  danno_proceso: s(a?.danno_proceso),
  devolucion: s(a?.devolucion),
  sobrante: s(a?.sobrante),
  total: s(a?.total),
  rendimiento: s(a?.rendimiento),
});

const normalizeOrden = (o?: Partial<Orden>): Orden => ({
  adaptation_date_id: s(o?.adaptation_date_id),
  descripcion_maestra: s(o?.descripcion_maestra),
  number_order: s(o?.number_order),
  orden_ejecutada: s(o?.orden_ejecutada),
  orderType: (o?.orderType as Orden["orderType"]) ?? "",
  requiere_bom: s(o?.requiere_bom),
});

const normalizeConciliaciones = (
  c?: Partial<Conciliaciones>
): Conciliaciones => ({
  padre: s(c?.padre),
  hijo: s(c?.hijo),
  diferencia: s(c?.diferencia),
  validate: s(c?.validate),
  list: Array.isArray(c?.list) ? c!.list : [],
});

const normalizeEmpaque = (e?: Partial<Empaque>): Empaque => ({
  unidades_caja: s(e?.unidades_caja),
  numero_caja: s(e?.numero_caja),
  unidades_saldo: s(e?.unidades_saldo),
  total_saldo: s(e?.total_saldo),
});

/* =========================
 *   Input reutilizable
 * ========================= */
type NumberFieldProps = {
  id?: string;
  name: keyof Articulos | keyof Empaque;
  label: string;
  value: string;
  hint?: string; // letras a,b,c...
  required?: boolean;
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const NumberField: React.FC<NumberFieldProps> = ({
  id,
  name,
  label,
  value,
  hint,
  required,
  disabled,
  onChange,
}) => (
  <div>
    <Text type="subtitle" color="text-[rgb(var(--foreground))]">
      {label}
      {hint && (
        <span className="ml-2 font-mono text-xs bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))]/70 px-1.5 py-0.5 rounded-full">
          {hint}
        </span>
      )}
    </Text>
    <input
      id={id ?? String(name)}
      name={String(name)}
      type="number"
      step="any"
      required={required}
      disabled={disabled}
      value={value ?? ""} // nunca undefined
      onChange={onChange}
      className="mt-2 block w-full text-center rounded-md bg-[rgb(var(--surface))] px-3.5 py-2 text-[rgb(var(--foreground))]
                 shadow-sm ring-1 ring-inset ring-[rgb(var(--border))] border border-transparent
                 placeholder:text-[rgb(var(--foreground))]/50
                 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))]"
    />
  </div>
);

/* =========================
 *      Componente main
 * ========================= */
const NewConsolida: React.FC = () => {
  const params = useParams<{ id: string }>();
  const refForm = useRef<HTMLFormElement>(null);

  // Estados
  const [loading, setLoading] = useState<boolean>(true);

  const [orden, setOrden] = useState<Orden>(() => normalizeOrden());

  const [conciliaciones, setConciliaciones] = useState<Conciliaciones>(() =>
    normalizeConciliaciones()
  );

  const [principal, setPrincipal] = useState<Articulos>(() =>
    normalizeArticulo()
  );

  const [secundarios, setSecundarios] = useState<Articulos[]>([]);

  const [empaque, setEmpaque] = useState<Empaque>(() => normalizeEmpaque());

  /* =========================
   *      Carga de datos
   * ========================= */
  useEffect(() => {
    const obtener_conciliacion = async () => {
      try {
        const resp = (await getConciliacion(
          Number(params.id)
        )) as ApiConciliacion;

        // Orden
        const o = normalizeOrden(resp?.orden ?? {});
        setOrden(o);

        // Artículo principal
        setPrincipal((prev) =>
          normalizeArticulo({
            ...prev,
            ...resp?.articulo_principal,
            quantityToProduce:
              o.orderType !== "P"
                ? prev.quantityToProduce || ""
                : s(resp?.articulo_principal?.quantityToProduce),
          })
        );

        // Artículos secundarios
        const secundariosNormalizados: Articulos[] = Array.isArray(
          resp?.articulo_segundario
        )
          ? resp!.articulo_segundario!.map((a) =>
              normalizeArticulo({
                ...a,
                quantityToProduce:
                  o.orderType !== "P" ? "" : s(a?.quantityToProduce),
              })
            )
          : [];
        setSecundarios(secundariosNormalizados);

        // Conciliaciones
        setConciliaciones(normalizeConciliaciones(resp?.conciliaciones ?? {}));
      } catch (error) {
        console.error("Error en obtener_conciliacion:", error);
        showError("No se pudo cargar la conciliación.");
      } finally {
        setLoading(false);
      }
    };

    obtener_conciliacion();
  }, [params.id]);

  /* =========================
   *   Handlers de cambios
   * ========================= */

  // Cálculo común de total y rendimiento
  const calculateTotals = (
    v: Articulos
  ): Pick<Articulos, "total" | "rendimiento"> => {
    const total =
      nz(v.quantityToProduce) +
      nz(v.adicionales) +
      nz(v.sobrante) -
      (nz(v.faltante) + nz(v.rechazo) + nz(v.danno_proceso) + nz(v.devolucion));

    const denom =
      nz(v.quantityToProduce) -
      (nz(v.faltante) + nz(v.rechazo) + nz(v.danno_proceso) + nz(v.devolucion));

    const rendimiento =
      denom > 0 ? ((nz(v.total) - nz(v.danno_proceso)) / denom) * 100 : 0;

    return {
      total: total.toFixed(2),
      rendimiento: rendimiento.toFixed(2),
    };
  };

  const inputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index?: number
  ) => {
    const { name, value } = e.target;

    if (index === undefined) {
      // principal
      setPrincipal((prev) => {
        const next: Articulos = { ...prev, [name]: value } as Articulos;

        if (orden.orderType === "P") {
          // Mantener la teórica en modo P (pre-cargada)
          next.quantityToProduce = prev.quantityToProduce;
        }

        const totals = calculateTotals(next);
        return { ...next, ...totals };
      });
    } else {
      // secundarios
      setSecundarios((prev) => {
        const copy = [...prev];
        if (!copy[index]) copy[index] = normalizeArticulo();

        const next: Articulos = { ...copy[index], [name]: value } as Articulos;

        if (orden.orderType === "P") {
          next.quantityToProduce = s(
            Number(copy[index].quantityToProduce || 0).toFixed(2)
          );
        }

        const totals = calculateTotals(next);
        copy[index] = { ...next, ...totals };
        return copy;
      });
    }
  };

  const calculaEmpaque = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setEmpaque((prev) => {
      const current = { ...prev, [name]: value } as Empaque;
      const saldo =
        nz(current.unidades_caja) * nz(current.numero_caja) +
        nz(current.unidades_saldo);
      return { ...current, total_saldo: saldo.toFixed(2) };
    });
  };

  /* =========================
   *        Submit
   * ========================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = document.cookie
      .split("; ")
      .find((row) => row.startsWith("name="))
      ?.split("=")[1];
    const payload = {
      orden,
      principal,
      secundarios,
      empaque,
      user: name,
    };

    try {
      const response = await guardar_conciliacion(payload);
      if ((response as { message?: string })?.message === "ok") {
        showSuccess("Conciliación guardada correctamente");
        setTimeout(() => {
          window.close();
        }, 1500);
      } else {
        showError("Error al guardar la conciliación o datos existentes.");
      }
    } catch {
      showError("Error inesperado al guardar la conciliación.");
    }
  };

  /* =========================
   *       Loading/Empty
   * ========================= */
  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <h1>Cargando...</h1>
      </div>
    );
  }

  if (!orden.orden_ejecutada) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <h1>Sin datos de conciliación</h1>
      </div>
    );
  }

  /* =========================
   *          JSX
   * ========================= */
  return (
    <div className="min-h-screen py-12 bg-[rgb(var(--background))]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <form
          ref={refForm}
          onSubmit={handleSubmit}
          className="bg-[rgb(var(--surface))] rounded-2xl shadow-xl p-8 space-y-10 border border-[rgb(var(--border))]"
        >
          {/* Header */}
          <div className="text-center">
            <Text type="title" color="text-[rgb(var(--foreground))]">
              Formulario de Conciliación
            </Text>
            <p className="mt-3 text-lg leading-8 text-[rgb(var(--foreground))]/70">
              Complete los campos para calcular la producción y el rendimiento.
            </p>
          </div>

          {/* Info Orden */}
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
                  {orden.orden_ejecutada}
                </p>
              </div>

              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Orden N°
                </Text>
                <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))] bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                  {orden.number_order}
                </p>
              </div>

              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Tipo de Orden
                </Text>
                <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))] bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                  {orden.orderType}
                </p>
              </div>

              <div className="sm:col-span-2">
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Descripción Maestra
                </Text>
                <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))] bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2">
                  {orden.descripcion_maestra}
                </p>
              </div>

              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Código Artículo
                </Text>
                <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))] bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                  {principal.codart}
                </p>
              </div>

              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Total
                </Text>
                <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))] bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                  {conciliaciones.padre}
                </p>
              </div>

              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Total Parciales
                </Text>
                <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))] bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                  {conciliaciones.hijo}
                </p>
              </div>

              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Diferencia
                </Text>
                <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))] bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                  {conciliaciones.diferencia}
                </p>
              </div>
            </div>
          </fieldset>

          {/* Principal */}
          <fieldset className="border border-[rgb(var(--border))] p-6 rounded-xl">
            <legend className="-ml-1 px-2 text-lg font-semibold text-[rgb(var(--accent))]">
              Producción y Desperdicio (Artículo Principal)
            </legend>

            <div>
              <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                Código Artículo
              </Text>
              <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))] bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                {principal.codart}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-4 mt-4">
              <div className="sm:col-span-2">
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Cantidad Teórica
                  <span className="ml-2 font-mono text-xs bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))]/70 px-1.5 py-0.5 rounded-full">
                    a
                  </span>
                </Text>

                {orden.orderType === "H" ? (
                  <NumberField
                    name="quantityToProduce"
                    label=""
                    value={principal.quantityToProduce}
                    onChange={inputChange}
                    required
                  />
                ) : (
                  <p
                    className="mt-2 block w-full text-center rounded-md py-2 px-3.5 text-[rgb(var(--foreground))]/60
                           bg-[rgb(var(--surface-muted))] shadow-sm ring-1 ring-inset ring-[rgb(var(--border))]
                           cursor-not-allowed"
                  >
                    {Number(principal.quantityToProduce || 0).toFixed(2)}
                  </p>
                )}
              </div>

              <NumberField
                name="faltante"
                label="Faltante"
                hint="b"
                value={principal.faltante}
                onChange={inputChange}
                required
              />
              <NumberField
                name="adicionales"
                label="Adicionales"
                hint="c"
                value={principal.adicionales}
                onChange={inputChange}
                required
              />
              <NumberField
                name="rechazo"
                label="Rechazo"
                hint="d"
                value={principal.rechazo}
                onChange={inputChange}
                required
              />
              <NumberField
                name="danno_proceso"
                label="Daño en Proceso"
                hint="e"
                value={principal.danno_proceso}
                onChange={inputChange}
                required
              />
              <NumberField
                name="devolucion"
                label="Devolución"
                hint="f"
                value={principal.devolucion}
                onChange={inputChange}
                required
              />
              <NumberField
                name="sobrante"
                label="Sobrante"
                hint="g"
                value={principal.sobrante}
                onChange={inputChange}
                required
              />

              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Total Producido
                  <span className="ml-2 font-mono text-xs bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))]/70 px-1.5 py-0.5 rounded-full">
                    h
                  </span>
                </Text>
                <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))] bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                  {principal.total}
                </p>
                <p className="mt-1 text-xs text-[rgb(var(--foreground))]/60">
                  Cálculo: a + c + g - (b + d + e + f)
                </p>
              </div>

              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Rendimiento (%)
                  <span className="ml-2 font-mono text-xs bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))]/70 px-1.5 py-0.5 rounded-full">
                    i
                  </span>
                </Text>
                <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))] bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                  {principal.rendimiento}
                </p>
                <p className="mt-1 text-xs text-[rgb(var(--foreground))]/60">
                  Cálculo: (h - e) / (a - (d + b)) × 100
                </p>
              </div>
            </div>
          </fieldset>

          {/* Secundarios */}
          {secundarios.map((item, i) => (
            <fieldset
              key={`${item.codart}-${i}`}
              className="border border-[rgb(var(--border))] p-6 rounded-xl"
            >
              <legend className="-ml-1 px-2 text-lg font-semibold text-[rgb(var(--accent))]">
                Producción y Desperdicio (Artículo Secundario)
              </legend>

              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Código Artículo
                </Text>
                <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))] bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                  {item.codart}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-4 mt-4">
                <div className="sm:col-span-2">
                  <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                    Cantidad Teórica
                    <span className="ml-2 font-mono text-xs bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))]/70 px-1.5 py-0.5 rounded-full">
                      a
                    </span>
                  </Text>

                  {orden.orderType === "H" ? (
                    <NumberField
                      name="quantityToProduce"
                      label=""
                      value={secundarios[i]?.quantityToProduce ?? ""}
                      onChange={(e) => inputChange(e, i)}
                      required
                    />
                  ) : (
                    <p
                      className="mt-2 block w-full text-center rounded-md py-2 px-3.5 text-[rgb(var(--foreground))]/60
                        bg-[rgb(var(--surface-muted))] shadow-sm ring-1 ring-inset ring-[rgb(var(--border))] cursor-not-allowed"
                    >
                      {Number(item.quantityToProduce || 0).toFixed(2)}
                    </p>
                  )}
                </div>

                <NumberField
                  name="faltante"
                  label="Faltante"
                  hint="b"
                  value={secundarios[i]?.faltante ?? ""}
                  onChange={(e) => inputChange(e, i)}
                  required
                />
                <NumberField
                  name="adicionales"
                  label="Adicionales"
                  hint="c"
                  value={secundarios[i]?.adicionales ?? ""}
                  onChange={(e) => inputChange(e, i)}
                  required
                />
                <NumberField
                  name="rechazo"
                  label="Rechazo"
                  hint="d"
                  value={secundarios[i]?.rechazo ?? ""}
                  onChange={(e) => inputChange(e, i)}
                  required
                />
                <NumberField
                  name="danno_proceso"
                  label="Daño en Proceso"
                  hint="e"
                  value={secundarios[i]?.danno_proceso ?? ""}
                  onChange={(e) => inputChange(e, i)}
                  required
                />
                <NumberField
                  name="devolucion"
                  label="Devolución"
                  hint="f"
                  value={secundarios[i]?.devolucion ?? ""}
                  onChange={(e) => inputChange(e, i)}
                  required
                />
                <NumberField
                  name="sobrante"
                  label="Sobrante"
                  hint="g"
                  value={secundarios[i]?.sobrante ?? ""}
                  onChange={(e) => inputChange(e, i)}
                  required
                />

                <div>
                  <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                    Total Producido
                    <span className="ml-2 font-mono text-xs bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))]/70 px-1.5 py-0.5 rounded-full">
                      h
                    </span>
                  </Text>
                  <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))] bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                    {secundarios[i]?.total ?? ""}
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--foreground))]/60">
                    Cálculo: a + c + g - (b + d + e + f)
                  </p>
                </div>

                <div>
                  <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                    Rendimiento (%)
                    <span className="ml-2 font-mono text-xs bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))]/70 px-1.5 py-0.5 rounded-full">
                      i
                    </span>
                  </Text>
                  <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))] bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                    {secundarios[i]?.rendimiento ?? ""}
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--foreground))]/60">
                    Cálculo: (h - e) / (a - (d + b)) × 100
                  </p>
                </div>
              </div>
            </fieldset>
          ))}

          {/* Empaque */}
          <fieldset className="border border-[rgb(var(--border))] p-6 rounded-xl">
            <legend className="-ml-1 px-2 text-lg font-semibold text-[rgb(var(--accent))]">
              Totales y Empacado
            </legend>

            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-3 mt-8 pt-8 border-t border-[rgb(var(--border))]">
              <NumberField
                name="unidades_caja"
                label="Unidades por Caja"
                hint="j"
                value={empaque.unidades_caja}
                onChange={calculaEmpaque}
                required
              />
              <NumberField
                name="numero_caja"
                label="Número de Cajas"
                hint="k"
                value={empaque.numero_caja}
                onChange={calculaEmpaque}
                required
              />
              <NumberField
                name="unidades_saldo"
                label="Unidades de Saldo"
                hint="l"
                value={empaque.unidades_saldo}
                onChange={calculaEmpaque}
                required
              />

              <div className="sm:col-span-3">
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Total Saldo
                  <span className="ml-2 font-mono text-xs bg-[rgb(var(--surface-muted))] text-[rgb(var(--foreground))]/70 px-1.5 py-0.5 rounded-full">
                    L
                  </span>
                </Text>
                <p className="mt-1 text-base font-semibold text-center text-[rgb(var(--foreground))] bg-[rgb(var(--surface-muted))] rounded-md px-3 py-2 font-mono">
                  {empaque.total_saldo}
                </p>
                <p className="mt-1 text-xs text-center text-[rgb(var(--foreground))]/60">
                  Cálculo: (j * k) + l
                </p>
              </div>
            </div>
          </fieldset>

          {/* Submit */}
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
