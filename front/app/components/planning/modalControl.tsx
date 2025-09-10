"use client";
import { useEffect, useMemo, useRef, useState, FormEvent } from "react";
import {
  getActividadesControl,
  guardar_actividades_control,
} from "../../services/planing/planingServices";
import { validateSignaturePass } from "../../services/userDash/securityPass";
import { showSuccess, showError } from "../toastr/Toaster";
import Text from "../text/Text";
import Button from "../buttons/buttons";
import Firma from "../ordenes_ejecutadas/Firma";

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
  adaptation_date_id?: number | string;
  fase_id?: number | string;
  activities?: unknown;
};

type BaseExtras = {
  binding?: boolean;
  signatureSpecific?: boolean;
  allowedRoles?: string[];
  accept?: string;
  multiple?: boolean;
};

type BaseConfig =
  | ({ type: "text" | "textarea" } & BaseExtras)
  | ({ type: "number"; min?: number; max?: number; step?: number } & BaseExtras)
  | ({ type: "temperature"; min?: number; max?: number } & BaseExtras)
  | ({ type: "date" | "time" } & BaseExtras)
  | ({ type: "select" | "radio"; options: string[] } & BaseExtras)
  | ({ type: "checkbox"; options: string[] } & BaseExtras)
  | ({ type: "file" | "image" } & BaseExtras)
  | ({ type: "signature" } & BaseExtras);

type ActividadConfig = BaseConfig;

type Actividad = {
  id: number;
  description: string;
  config: string | ActividadConfig;
  binding: boolean;
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
  [k: string]: unknown;
};

/* =========================
 *      Utilidades
 * ========================= */

// Parse robusto (hasta 2 niveles)
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
  if (val && typeof val === "object" && "type" in (val as object)) {
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
    Array.isArray((cfg as { options?: unknown }).options)
  );
}

function serializeMemValue(v: MemValue): string {
  if (v == null) return "";
  if (Array.isArray(v)) {
    if (v.length > 0 && v[0] instanceof File)
      return (v as File[]).map((f) => f.name).join(", ");
    return (v as string[]).join(", ");
  }
  if (v instanceof File) return v.name;
  return String(v);
}

type SigType = "" | "texto" | "firma";
const sigKey = (fieldName: string) => `control::${fieldName}`;

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

  // ==== Estado firma (igual patrón que en App) ====
  const [sigTypeByField, setSigTypeByField] = useState<Record<string, SigType>>(
    {}
  );
  const [sigUnlocked, setSigUnlocked] = useState<Record<string, boolean>>({});
  const [sigModal, setSigModal] = useState<{
    open: boolean;
    fieldName: string | null;
  }>({
    open: false,
    fieldName: null,
  });
  const [sigPassword, setSigPassword] = useState<string>("");

  // ==== Proxy para integrar Firma (requiere estructura { [lineaIndex]: {...} }) ====
  const SIG_SCOPE = "control"; // línea sintética para este modal
  const [memProxy, setMemProxy] = useState<
    Record<string, Record<string, unknown>>
  >({ [SIG_SCOPE]: {} });

  // Dark mode (opcional si ya lo manejas globalmente)
  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem("theme")
        : null;
    if (saved === "dark" || saved === "light")
      document.documentElement.setAttribute("data-theme", saved);
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    try {
      const data = localStorage.getItem("ejecutar");
      if (data) setLocal(JSON.parse(data) as { user?: string | number });
    } catch {
      showError("Datos inválidos en el almacenamiento local.");
    }
  }, []);

  // Guardar valores dinámicos
  const setValue = (name: string, value: MemValue): void => {
    setMemoriaActividades((prev) => ({ ...prev, [name]: value }));
    setBtnDisabled(false);
  };

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

  // Cargar fase + actividades
  useEffect(() => {
    if (!id) return;
    (getActividadesControl as (id: number) => Promise<ApiActividadesResponse>)(
      id
    ).then((data) => {
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

  // ===== Requireds y validaciones
  const missingRequired = useMemo(() => {
    const faltantes: string[] = [];
    for (const item of controlData) {
      const cfg = parseConfig(item.config);
      const fieldName = `field_${item.id}`;
      const label = item.description || `Actividad ${item.id}`;
      const required = Boolean(
        item.binding || (cfg as BaseExtras | null)?.binding
      );
      if (!required) continue;

      const val = memoriaActividades[fieldName];
      const isEmpty = (v: unknown) => String(v ?? "").trim() === "";
      const isNumInvalid = (v: unknown) => v === "" || Number.isNaN(Number(v));
      const tipo = cfg?.type ?? "text";

      switch (tipo) {
        case "text":
        case "textarea":
        case "date":
        case "time":
        case "select":
        case "radio":
          if (isEmpty(val)) faltantes.push(label);
          break;
        case "number":
          if (isNumInvalid(val)) faltantes.push(label);
          break;
        case "checkbox": {
          const arr = Array.isArray(val) ? (val as string[]) : [];
          if (arr.length === 0) faltantes.push(label);
          break;
        }
        case "file":
        case "image": {
          const arr = Array.isArray(val) ? (val as File[]) : [];
          if (arr.length === 0) faltantes.push(label);
          break;
        }
        case "temperature": {
          const tcfg = cfg as Extract<ActividadConfig, { type: "temperature" }>;
          const n =
            typeof val === "number" ? val : val === "" ? NaN : Number(val);
          if (Number.isNaN(n)) faltantes.push(label);
          else if (
            (tcfg.min !== undefined && n < tcfg.min) ||
            (tcfg.max !== undefined && n > tcfg.max)
          )
            faltantes.push(`${label} (fuera de rango)`);
          break;
        }
        case "signature": {
          const sType = sigTypeByField[fieldName] || "";
          const locked =
            (cfg as BaseExtras | null)?.signatureSpecific &&
            !sigUnlocked[sigKey(fieldName)];
          if (locked) {
            faltantes.push(`${label} (firma bloqueada)`);
            break;
          }
          if (sType === "") {
            faltantes.push(`${label} (elige texto o firma)`);
            break;
          }
          if (sType === "texto") {
            if (isEmpty(val)) faltantes.push(label);
          } else if (sType === "firma") {
            const v = typeof val === "string" ? val : "";
            if (!v.startsWith("data:image"))
              faltantes.push(`${label} (falta firma)`);
          }
          break;
        }
        default:
          if (isEmpty(val)) faltantes.push(label);
      }
    }
    return faltantes;
  }, [controlData, memoriaActividades, sigTypeByField, sigUnlocked]);

  const allValid = missingRequired.length === 0;

  // ===== Submit
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!allValid) {
      showError("Completa los campos obligatorios antes de enviar.");
      return;
    }

    const actividadesPreparadas: Actividad[] = controlData.map((item) => {
      const key = `field_${item.id}`;
      const valor = serializeMemValue(memoriaActividades[key]);
      return {
        id: item.id,
        description: item.description,
        config: item.config,
        binding: item.binding,
        clave: key,
        valor, // para signature será texto o base64 según selección
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
    setTimeout(() => window.location.reload(), 1200);
  };

  // ===== UI helpers
  const baseInput =
    "mt-4 block w-full rounded-md border border-[rgb(var(--input))] bg-[rgb(var(--surface))] " +
    "py-2 px-3.5 text-[rgb(var(--foreground))] shadow-sm focus:ring-2 focus:ring-inset " +
    "focus:ring-[rgb(var(--ring))] sm:text-sm text-center";

  // ===== Modal firma (password)
  async function submitSigValidation() {
    try {
      const fieldName = sigModal.fieldName;
      if (!fieldName) return;
      const pass = String(sigPassword || "").trim();
      if (!pass) {
        showError("Ingresa la contraseña.");
        return;
      }

      const res = await validateSignaturePass({
        security_pass: pass,
        signature_id: sigKey(fieldName),
      });

      if (!res?.valid) {
        showError("Contraseña no autorizada para esta firma.");
        return;
      }

      setSigUnlocked((prev) => ({ ...prev, [sigKey(fieldName)]: true }));
      setSigPassword("");
      setSigModal({ open: false, fieldName: null });
    } catch {
      showError("Validación fallida. Intenta de nuevo.");
    }
  }

  // ===== saveToDB proxy para el componente Firma (refleja cambios al estado plano)
  const saveToDBProxy = async (
    _key: string,
    data: Record<string, Record<string, unknown>>
  ) => {
    setMemProxy(data);
    const scoped = data[SIG_SCOPE] ?? {};
    Object.entries(scoped).forEach(([k, v]) => {
      setMemoriaActividades((prev) => ({ ...prev, [k]: v as string }));
    });
  };

  return (
    <div
      className={
        className ??
        "w-full max-w-5xl use-token-borders text-[rgb(var(--foreground))]"
      }
    >
      <Text type="title" color="text-[rgb(var(--foreground))]">
        {heading}
      </Text>

      {memoriaFase.fase_control && (
        <div className="mt-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-sm justify-center flex">
          <p className="font-medium mr-2">
            {memoriaFase.fase_control.descripcion} |
          </p>
          <p className="font-medium">
            Tipo: {memoriaFase.fase_control.phase_type}
          </p>
        </div>
      )}

      <div className="mt-6">
        <form onSubmit={handleSubmit} ref={ref} className="space-y-6">
          {controlData.map((item) => {
            const cfg = parseConfig(item.config);
            const fieldName = `field_${item.id}`;
            const tipo = cfg?.type ?? "text";
            const lockedSig =
              tipo === "signature"
                ? Boolean((cfg as BaseExtras | null)?.signatureSpecific) &&
                  !sigUnlocked[sigKey(fieldName)]
                : false;

            return (
              <div
                key={item.id}
                className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 shadow-sm transition-all duration-300 hover:border-[rgb(var(--border))] hover:shadow-md"
              >
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  {item.description}
                </Text>

                {/* TEXT */}
                {tipo === "text" && (
                  <input
                    type="text"
                    id={fieldName}
                    name={fieldName}
                    value={(memoriaActividades[fieldName] as string) ?? ""}
                    onChange={(e) => setValue(fieldName, e.target.value)}
                    className={baseInput}
                    required={item.binding}
                  />
                )}

                {/* TEXTAREA */}
                {tipo === "textarea" && (
                  <textarea
                    rows={3}
                    id={fieldName}
                    name={fieldName}
                    value={(memoriaActividades[fieldName] as string) ?? ""}
                    onChange={(e) => setValue(fieldName, e.target.value)}
                    className={`${baseInput} !text-left`}
                    required={item.binding}
                  />
                )}

                {/* NUMBER */}
                {tipo === "number" && (
                  <input
                    type="number"
                    id={fieldName}
                    name={fieldName}
                    min={
                      (cfg as Extract<ActividadConfig, { type: "number" }>).min
                    }
                    max={
                      (cfg as Extract<ActividadConfig, { type: "number" }>).max
                    }
                    step={
                      (cfg as Extract<ActividadConfig, { type: "number" }>)
                        .step ?? 1
                    }
                    value={
                      (memoriaActividades[fieldName] as number | string) ?? ""
                    }
                    onChange={(e) => {
                      const n = e.target.value;
                      setValue(fieldName, n === "" ? "" : Number(n));
                    }}
                    className={baseInput}
                    required={item.binding}
                  />
                )}

                {/* DATE */}
                {tipo === "date" && (
                  <input
                    type="date"
                    id={fieldName}
                    name={fieldName}
                    value={(memoriaActividades[fieldName] as string) ?? ""}
                    onChange={(e) => setValue(fieldName, e.target.value)}
                    className={baseInput}
                    required={item.binding}
                  />
                )}

                {/* TIME */}
                {tipo === "time" && (
                  <input
                    type="time"
                    id={fieldName}
                    name={fieldName}
                    value={(memoriaActividades[fieldName] as string) ?? ""}
                    onChange={(e) => setValue(fieldName, e.target.value)}
                    className={baseInput}
                    required={item.binding}
                  />
                )}

                {/* SELECT */}
                {tipo === "select" && isOptionsConfig(cfg) && (
                  <select
                    id={fieldName}
                    name={fieldName}
                    value={(memoriaActividades[fieldName] as string) ?? ""}
                    onChange={(e) => setValue(fieldName, e.target.value)}
                    className={baseInput}
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
                {tipo === "radio" && isOptionsConfig(cfg) && (
                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {cfg.options.map((opt) => {
                      const isSelected =
                        (memoriaActividades[fieldName] as string) === opt;
                      return (
                        <label
                          key={opt}
                          className={`relative flex cursor-pointer rounded-lg border p-4 text-center shadow-sm transition-all duration-200 ${
                            isSelected
                              ? "border-[rgb(var(--ring))] bg-[rgb(var(--surface-muted))] ring-2 ring-[rgb(var(--ring))]"
                              : "border-[rgb(var(--border))] bg-[rgb(var(--surface))] hover:bg-[rgb(var(--surface-muted))]"
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
                            className={`flex-1 text-sm font-medium ${
                              isSelected ? "" : "opacity-80"
                            }`}
                          >
                            {opt}
                          </span>
                          {isSelected && (
                            <svg
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
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
                {tipo === "checkbox" && isOptionsConfig(cfg) && (
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
                            className="h-4 w-4 rounded border-[rgb(var(--border))] accent-[rgb(var(--accent))] focus:ring-[rgb(var(--ring))]"
                          />
                          <span className="text-sm">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* IMAGE */}
                {tipo === "image" && (
                  <div className="mt-4">
                    <input
                      type="file"
                      id={fieldName}
                      name={fieldName}
                      accept={(cfg as BaseExtras).accept ?? "image/*"}
                      multiple={(cfg as BaseExtras).multiple ?? false}
                      onChange={(e) =>
                        setValue(
                          fieldName,
                          e.currentTarget.files
                            ? Array.from(e.currentTarget.files)
                            : []
                        )
                      }
                      className={baseInput}
                      required={item.binding}
                    />
                  </div>
                )}

                {/* FILE */}
                {tipo === "file" && (
                  <div className="mt-4">
                    <input
                      type="file"
                      id={fieldName}
                      name={fieldName}
                      accept={(cfg as BaseExtras).accept ?? "*/*"}
                      multiple={(cfg as BaseExtras).multiple ?? false}
                      onChange={(e) =>
                        setValue(
                          fieldName,
                          e.currentTarget.files
                            ? Array.from(e.currentTarget.files)
                            : []
                        )
                      }
                      className={baseInput}
                      required={item.binding}
                    />
                  </div>
                )}

                {/* TEMPERATURE */}
                {tipo === "temperature" && (
                  <>
                    <input
                      type="number"
                      id={fieldName}
                      name={fieldName}
                      min={
                        (
                          cfg as Extract<
                            ActividadConfig,
                            { type: "temperature" }
                          >
                        ).min
                      }
                      max={
                        (
                          cfg as Extract<
                            ActividadConfig,
                            { type: "temperature" }
                          >
                        ).max
                      }
                      step={0.01}
                      value={
                        (memoriaActividades[fieldName] as number | string) ?? ""
                      }
                      onChange={(e) => {
                        const v = e.target.value;
                        setValue(fieldName, v === "" ? "" : Number(v));
                      }}
                      className={baseInput}
                      required={item.binding}
                    />
                    {(() => {
                      const tcfg = cfg as Extract<
                        ActividadConfig,
                        { type: "temperature" }
                      >;
                      const v = memoriaActividades[fieldName];
                      const num =
                        typeof v === "number" ? v : v === "" ? NaN : Number(v);
                      const out =
                        !Number.isNaN(num) &&
                        ((tcfg.min !== undefined && num < tcfg.min) ||
                          (tcfg.max !== undefined && num > tcfg.max));
                      return out ? (
                        <p className="mt-2 mb-2 px-4 py-2 text-sm text-center font-semibold text-[rgb(var(--foreground))] bg-[rgb(var(--warning))]/20 rounded-xl shadow border border-[rgb(var(--warning))]/40 max-w-xs mx-auto">
                          ⚠️ Valor debe estar entre <b>{tcfg.min}</b> y{" "}
                          <b>{tcfg.max}</b>.
                        </p>
                      ) : null;
                    })()}
                  </>
                )}

                {/* SIGNATURE — usando TU componente <Firma /> */}
                {tipo === "signature" && (
                  <div className="mt-4 space-y-2">
                    {lockedSig && (
                      <div className="text-xs text-[rgb(var(--warning))] text-center">
                        🔒 Requiere validación antes de firmar.
                      </div>
                    )}

                    <select
                      className={baseInput}
                      value={sigTypeByField[fieldName] || ""}
                      onMouseDown={(e) => {
                        if (lockedSig) {
                          e.preventDefault();
                          e.stopPropagation();
                          setSigModal({ open: true, fieldName });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (
                          lockedSig &&
                          ["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)
                        ) {
                          e.preventDefault();
                          setSigModal({ open: true, fieldName });
                        }
                      }}
                      onChange={(e) => {
                        if (lockedSig) return;
                        const v = e.target.value as SigType;
                        setSigTypeByField((prev) => ({
                          ...prev,
                          [fieldName]: v,
                        }));
                        setValue(fieldName, "");
                      }}
                      required
                    >
                      <option value="">-- Selecciona --</option>
                      <option value="texto">Texto</option>
                      <option value="firma">Firma</option>
                    </select>

                    {sigTypeByField[fieldName] === "texto" && (
                      <input
                        type="text"
                        className={baseInput}
                        value={(memoriaActividades[fieldName] as string) ?? ""}
                        onChange={(e) => setValue(fieldName, e.target.value)}
                      />
                    )}

                    {sigTypeByField[fieldName] === "firma" && (
                      <Firma
                        type="signature"
                        // Pasamos item con clave forzada para que Firma la use como nombre de campo
                        item={{ ...item, clave: fieldName }}
                        info={memProxy[SIG_SCOPE] ?? {}}
                        lineaIndex={SIG_SCOPE}
                        setMemoriaGeneral={(
                          updater:
                            | Record<string, Record<string, unknown>>
                            | ((
                                prev: Record<string, Record<string, unknown>>
                              ) => Record<string, Record<string, unknown>>)
                        ) => {
                          setMemProxy((prev) => {
                            const next =
                              typeof updater === "function"
                                ? (
                                    updater as (
                                      p: Record<string, Record<string, unknown>>
                                    ) => Record<string, Record<string, unknown>>
                                  )(prev)
                                : updater;

                            const scoped = next[SIG_SCOPE] ?? {};
                            Object.entries(scoped).forEach(([k, v]) => {
                              setMemoriaActividades((pf) => ({
                                ...pf,
                                [k]: v as string,
                              }));
                            });
                            return next;
                          });
                        }}
                        saveToDB={async (
                          _k: string,
                          data: Record<string, Record<string, unknown>>
                        ) => {
                          await saveToDBProxy(_k, data);
                        }}
                        typeMem="memoria_fase"
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <hr className="my-4 border-t border-[rgb(var(--border))] w-full max-w-lg mx-auto opacity-60" />

          <div className="flex justify-center gap-4 mt-6">
            <Button
              type="submit"
              variant="create"
              disabled={btnDisabled || !allValid}
              label="Enviar Respuestas"
            />
          </div>
        </form>
      </div>

      {/* Modal contraseña firma */}
      {sigModal.open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl bg-[rgb(var(--surface))] border border-[rgb(var(--border))] p-5 shadow-2xl">
            <h3 className="text-[rgb(var(--foreground))] text-lg font-semibold mb-2">
              Validación requerida
            </h3>
            <p className="text-[rgb(var(--muted-foreground))] text-sm mb-4">
              Ingresa la contraseña para habilitar la firma.
            </p>
            <input
              type="password"
              autoFocus
              value={sigPassword}
              onChange={(e) => setSigPassword(e.target.value)}
              onKeyDown={async (e) =>
                e.key === "Enter" && (await submitSigValidation())
              }
              className={baseInput}
              placeholder="Contraseña"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSigModal({ open: false, fieldName: null });
                  setSigPassword("");
                }}
                className="px-4 py-2 rounded-lg bg-[rgb(var(--surface-muted))] hover:opacity-90 text-[rgb(var(--foreground))] text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submitSigValidation}
                className="px-4 py-2 rounded-lg bg-[rgb(var(--accent))] hover:bg-[rgb(var(--accent-hover))] text-[rgb(var(--accent-foreground))] text-sm shadow"
              >
                Validar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
