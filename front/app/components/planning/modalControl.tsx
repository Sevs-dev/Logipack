"use client";
import { useEffect, useRef, useState, FormEvent } from "react";
import {
  getActividadesControl,
  guardar_actividades_control,
} from "../../services/planing/planingServices";
import { showSuccess, showError } from "../toastr/Toaster";
import Text from "../text/Text";
import Button from "../buttons/buttons";

/* =========================
 *        Tipos
 * ========================= */

type ModalControlProps = {
  id?: number | null;
  showModal?: boolean; // compatibilidad
  setShowModal?: (v: boolean) => void;
  title?: string;
  className?: string;
};

type FaseControl = {
  descripcion: string;
  phase_type: string;
  // Estos campos se usan al enviar; pueden no venir siempre
  adaptation_date_id?: number | string;
  fase_id?: number | string;
  activities?: unknown; // no asumimos estructura aquí
  // posicion?: number | string; // si lo necesitas, descomenta
};

type BaseConfig =
  | { type: "text" | "textarea" }
  | { type: "number"; min?: number; max?: number; step?: number }
  | { type: "temperature"; min?: number; max?: number }
  | { type: "date" | "time" }
  | { type: "select" | "radio"; options: string[] }
  | { type: "checkbox"; options: string[] }
  | { type: "file" | "image"; accept?: string; multiple?: boolean };

type ActividadConfig = BaseConfig;

type Actividad = {
  id: number;
  description: string;
  // Puede llegar string JSON o ya objeto
  config: string | ActividadConfig;
  binding: boolean;
  // se completan al enviar
  clave?: string;
  valor?: string;
};

type ApiActividadesResponse = {
  fase_control: FaseControl;
  actividades: Actividad[];
};

type MemValue =
  | string
  | number
  | string[]
  | File
  | File[]
  | boolean
  | null
  | undefined;

type MemoriaActividades = Record<string, MemValue>;
type MemoriaFase = { fase_control?: FaseControl };

type LocalSession = { user?: string | number } | null;

type GuardarActividadesPayload = {
  adaptation_date_id?: number | string;
  descripcion?: string;
  fase_id?: number | string;
  activities?: unknown;
  phase_type?: string;
  forms: string;
  user: string | number | "";
};

type GuardarActividadesResponse = {
  estado: number;
  // la API puede devolver más cosas
  [k: string]: unknown;
};

/* =========================
 *      Utilidades
 * ========================= */

// Intenta parsear hasta dos veces por si viene doblemente encadenado
function parseConfig(raw: Actividad["config"]): ActividadConfig | null {
  let val: unknown = raw;
  for (let i = 0; i < 2; i++) {
    if (typeof val === "string") {
      try {
        val = JSON.parse(val);
      } catch {
        break;
      }
    }
  }
  if (typeof val === "object" && val !== null && "type" in (val as object)) {
    return val as ActividadConfig;
  }
  return null;
}

function isOptionsConfig(
  cfg: ActividadConfig | null
): cfg is Extract<ActividadConfig, { options: string[] }> {
  return (
    !!cfg &&
    "options" in cfg &&
    Array.isArray((cfg as { options: unknown }).options)
  );
}

function serializeMemValue(v: MemValue): string {
  if (v == null) return "";
  if (Array.isArray(v)) {
    if (v.length > 0 && v[0] instanceof File) {
      return (v as File[]).map((f) => f.name).join(", ");
    }
    return (v as string[]).join(", ");
  }
  if (v instanceof File) return v.name;
  return String(v);
}

/* =========================
 *     Componente
 * ========================= */

export default function ModalControl({
  id,
  title = "Registro de Control en Procesos",
  className,
}: ModalControlProps) {
  const heading = title;
  const ref = useRef<HTMLFormElement>(null);

  const [local, setLocal] = useState<LocalSession>(null);
  const [controlData, setControlData] = useState<Actividad[]>([]);
  const [memoriaFase, setMemoriaFase] = useState<MemoriaFase>({});
  const [memoriaActividades, setMemoriaActividades] =
    useState<MemoriaActividades>({});
  const [btnDisabled, setBtnDisabled] = useState<boolean>(true);

  // Cargar datos iniciales (localStorage)
  useEffect(() => {
    try {
      const data = localStorage.getItem("ejecutar");
      if (data) {
        const parsed = JSON.parse(data) as { user?: string | number };
        setLocal(parsed);
      }
    } catch {
      showError("Datos inválidos en el almacenamiento local.");
    }
  }, []);

  // Guardar valores dinámicos (texto, número, select, radio, date, time, temp, file)
  const setValue = (name: string, value: MemValue): void => {
    setMemoriaActividades((prev) => ({ ...prev, [name]: value }));
    setBtnDisabled(false);
  };

  // Toggle de checkboxes (arreglo de strings)
  const toggleCheckbox = (name: string, option: string): void => {
    setMemoriaActividades((prev) => {
      const current = Array.isArray(prev[name]) ? (prev[name] as string[]) : [];
      const exists = current.includes(option);
      const next = exists
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...prev, [name]: next };
    });
    setBtnDisabled(false);
  };

  // Cargar datos fase + actividades
  useEffect(() => {
    if (!id) return;

    (getActividadesControl as (id: number) => Promise<ApiActividadesResponse>)(
      id
    ).then((data) => {
      console.log(id);
      if (data && Array.isArray(data.actividades)) {
        setMemoriaFase((prev) => ({
          ...prev,
          fase_control: data.fase_control,
        }));
        setControlData(data.actividades);
      } else {
        setControlData([]);
      }
    });
  }, [id]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    const actividadesPreparadas: Actividad[] = controlData.map((item) => {
      const key = `field_${item.id}`;
      const valor = serializeMemValue(memoriaActividades[key]);
      return {
        id: item.id,
        description: item.description,
        config: item.config,
        binding: item.binding,
        clave: key,
        valor,
      };
    });

    const fase = memoriaFase.fase_control;
    const resultado: GuardarActividadesPayload = {
      adaptation_date_id: fase?.adaptation_date_id,
      descripcion: fase?.descripcion,
      fase_id: fase?.fase_id,
      activities: fase?.activities,
      phase_type: fase?.phase_type,
      forms: JSON.stringify(actividadesPreparadas),
      user: local?.user ?? "",
    };

    const guardar = guardar_actividades_control as (
      payload: GuardarActividadesPayload
    ) => Promise<GuardarActividadesResponse>;

    const data = await guardar(resultado);

    if (data.estado !== 200) {
      showError("Error al guardar el control");
      return;
    }

    ref.current?.reset();
    showSuccess("Control guardado correctamente");
    setBtnDisabled(true);
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  return (
    <div className={className ?? "w-full max-w-5xl"}>
      <Text type="title" color="text-[#000]">
        {heading}
        
      </Text>

      {memoriaFase.fase_control && (
        <div className="mt-2 rounded-lg border border-gray-200 
          bg-white p-4 shadow-sm justify-center flex">
          <p className="font-medium text-gray-800 mr-2">
            {memoriaFase.fase_control.descripcion} |
          </p>
          <p className="font-medium text-gray-800">
            Tipo: {memoriaFase.fase_control.phase_type}
          </p>
        </div>
      )}

      <div className="mt-6">
        <form onSubmit={handleSubmit} ref={ref} className="space-y-6">
          {controlData.map((item) => {
            const cfg = parseConfig(item.config);
            const fieldName = `field_${item.id}`;

            return (
              <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-6
               shadow-sm transition-all duration-300 hover:border-gray-300 hover:shadow-md">
                <Text type="subtitle" color="text-[#000]">
                  {item.description}
                </Text>
                {/* <p className="mt-1 text-sm text-gray-500 text-center">
                  Selecciona una de las siguientes opciones.
                </p> */}

                {/* TEXT */}
                {cfg?.type === "text" && (
                  <input
                    type="text"
                    id={fieldName}
                    name={fieldName}
                    value={(memoriaActividades[fieldName] as string) ?? ""}
                    onChange={(e) => setValue(fieldName, e.target.value)}
                    className="mt-4 block w-full rounded-md border-gray-300 bg-gray-50 py-2 px-3.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                    required={item.binding}
                  />
                )}

                {/* TEXTAREA */}
                {cfg?.type === "textarea" && (
                  <textarea
                    rows={3}
                    id={fieldName}
                    name={fieldName}
                    value={(memoriaActividades[fieldName] as string) ?? ""}
                    onChange={(e) => setValue(fieldName, e.target.value)}
                    className="mt-4 block w-full rounded-md border-gray-300 bg-gray-50 py-2 px-3.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                    required={item.binding}
                  />
                )}

                {/* NUMBER */}
                {cfg?.type === "number" && (
                  <input
                    type="number"
                    id={fieldName}
                    name={fieldName}
                    min={cfg.min}
                    max={cfg.max}
                    step={cfg.step ?? 1}
                    value={
                      (memoriaActividades[fieldName] as number | string) ?? ""
                    }
                    onChange={(e) => {
                      const n = e.target.value;
                      setValue(fieldName, n === "" ? "" : Number(n));
                    }}
                    className="mt-4 block w-full rounded-md border-gray-300 bg-gray-50 py-2 px-3.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                    required={item.binding}
                  />
                )}

                {/* DATE */}
                {cfg?.type === "date" && (
                  <input
                    type="date"
                    id={fieldName}
                    name={fieldName}
                    value={(memoriaActividades[fieldName] as string) ?? ""}
                    onChange={(e) => setValue(fieldName, e.target.value)}
                    className="mt-4 block w-full rounded-md border-gray-300 bg-gray-50 py-2 px-3.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                    required={item.binding}
                  />
                )}

                {/* TIME */}
                {cfg?.type === "time" && (
                  <input
                    type="time"
                    id={fieldName}
                    name={fieldName}
                    value={(memoriaActividades[fieldName] as string) ?? ""}
                    onChange={(e) => setValue(fieldName, e.target.value)}
                    className="mt-4 block w-full rounded-md border-gray-300 bg-gray-50 py-2 px-3.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                    required={item.binding}
                  />
                )}

                {/* SELECT */}
                {cfg?.type === "select" && isOptionsConfig(cfg) && (
                  <select
                    id={fieldName}
                    name={fieldName}
                    value={(memoriaActividades[fieldName] as string) ?? ""}
                    onChange={(e) => setValue(fieldName, e.target.value)}
                    className="mt-4 block w-full rounded-md border-gray-300 bg-gray-50 py-2 px-3.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                    required={item.binding}
                  >
                    <option value="">Seleccione</option>
                    {cfg.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}

                {/* RADIO */}
                {cfg?.type === "radio" && isOptionsConfig(cfg) && (
                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {cfg.options.map((opt) => {
                      const isSelected =
                        (memoriaActividades[fieldName] as string) === opt;
                      return (
                        <label
                          key={opt}
                          className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm transition-all duration-200 text-center ${isSelected
                              ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500"
                              : "border-gray-300 bg-white/10 hover:bg-gray-50"
                            }`}
                        >
                          <input
                            className="sr-only"
                            type="radio"
                            name={fieldName}
                            value={opt}
                            checked={isSelected}
                            required={item.binding}
                            onChange={(e) =>
                              setValue(fieldName, e.target.value)
                            }
                          />
                          <span
                            className={`flex-1 text-sm font-medium ${isSelected ? "text-indigo-900" : "text-gray-800"
                              }`}
                          >
                            {opt}
                          </span>
                          {isSelected && (
                            <svg
                              className="h-5 w-5 text-indigo-600"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* CHECKBOX */}
                {cfg?.type === "checkbox" && isOptionsConfig(cfg) && (
                  <div className="mt-4 space-y-2">
                    {cfg.options.map((opt) => {
                      const checked = Array.isArray(
                        memoriaActividades[fieldName]
                      )
                        ? (memoriaActividades[fieldName] as string[]).includes(
                          opt
                        )
                        : false;
                      return (
                        <label key={opt} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name={fieldName}
                            value={opt}
                            checked={checked}
                            onChange={() => toggleCheckbox(fieldName, opt)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                          />
                          <span className="text-sm">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* IMAGE */}
                {cfg?.type === "image" && (
                  <div className="mt-4">
                    <input
                      type="file"
                      id={fieldName}
                      name={fieldName}
                      accept={cfg.accept ?? "image/*"}
                      multiple={cfg.multiple ?? false}
                      onChange={(e) =>
                        setValue(
                          fieldName,
                          e.currentTarget.files
                            ? Array.from(e.currentTarget.files)
                            : []
                        )
                      }
                      className="block w-full rounded-md border-gray-300 bg-gray-50 py-2 px-3.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                      required={item.binding}
                    />
                  </div>
                )}

                {/* FILE */}
                {cfg?.type === "file" && (
                  <div className="mt-4">
                    <input
                      type="file"
                      id={fieldName}
                      name={fieldName}
                      accept={cfg.accept ?? "*/*"}
                      multiple={cfg.multiple ?? false}
                      onChange={(e) =>
                        setValue(
                          fieldName,
                          e.currentTarget.files
                            ? Array.from(e.currentTarget.files)
                            : []
                        )
                      }
                      className="block w-full rounded-md border-gray-300 bg-gray-50 py-2 px-3.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                      required={item.binding}
                    />
                  </div>
                )}

                {/* TEMPERATURE */}
                {cfg?.type === "temperature" && (
                  <input
                    type="number"
                    id={fieldName}
                    name={fieldName}
                    min={cfg.min}
                    max={cfg.max}
                    step={0.01}
                    value={
                      (memoriaActividades[fieldName] as number | string) ?? ""
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      setValue(fieldName, v === "" ? "" : Number(v));
                    }}
                    className="mt-4 block w-full rounded-md border-gray-300 bg-gray-50 py-2 px-3.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                    required={item.binding}
                  />
                )}
              </div>
            );
          })}

          <hr className="my-4 border-t border-gray-600 w-full max-w-lg mx-auto opacity-60" />
          <div className="flex justify-center gap-4 mt-6">
            <Button
              type="submit"
              variant="create"
              disabled={btnDisabled}
              label="Enviar Respuestas"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
