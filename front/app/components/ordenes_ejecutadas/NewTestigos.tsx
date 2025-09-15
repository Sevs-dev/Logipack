"use client";

import React, { useRef, useState, useEffect, FormEvent } from "react";
import { useParams } from "next/navigation";
import { showSuccess, showError } from "../toastr/Toaster";
import Text from "../text/Text";
import Button from "../buttons/buttons";
import { getActividadesTestigos } from "@/app/services/planing/planingServices";
import FirmaB64 from "./FirmaB64";
import axios from "axios";
import { API_URL } from "@/app/config/api";

// ⬇️ Servicio importado (JS), lo tipamos localmente SIN any
import { validateSignaturePass as _validateSignaturePass } from "@/app/services/userDash/securityPass";

type ValidateSignaturePassPayload = {
  security_pass: string;
  signature_id: string;
};

type ValidateSignaturePassResponse = {
  valid: boolean;
  migrated?: boolean;
  [k: string]: unknown;
};

// Cast seguro (unknown → firma tipada)
const validateSignaturePass: (
  payload: ValidateSignaturePassPayload
) => Promise<ValidateSignaturePassResponse> = _validateSignaturePass as unknown as (
  payload: ValidateSignaturePassPayload
) => Promise<ValidateSignaturePassResponse>;

type MemValue =
  | string
  | number
  | string[]
  | File
  | File[]
  | boolean
  | null
  | undefined;

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

// Axios base
const Planning = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

type FaseTestigos = {
  descripcion: string;
  phase_type: string;
  adaptation_date_id?: number | string;
  fase_id?: number | string;
  activities?: unknown;
};

type ApiActividadesResponse = {
  fase_testigo: FaseTestigos;
  actividades: Actividad[];
};

type BaseConfig =
  | { type: "text" | "textarea" }
  | { type: "number"; min?: number; max?: number; step?: number }
  | { type: "temperature"; min?: number; max?: number }
  | { type: "date" | "time" }
  | { type: "select" | "radio"; options: string[] }
  | { type: "checkbox"; options: string[] }
  | { type: "file" | "image"; accept?: string; multiple?: boolean }
  | { type: "signature" };

type ActividadConfig = BaseConfig & {
  signatureSpecific?: boolean;
  allowedRoles?: Array<string | number>;
};

type Actividad = {
  id: number;
  description: string;
  config: string | ActividadConfig;
  binding: boolean;
  clave?: string;
  valor?: string;
};

type MemoriaActividades = Record<string, MemValue>;
type MemoriaFase = { fase_testigo?: FaseTestigos };
type LocalSession = { user?: string | number; role?: string } | null;

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

export const guardar_actividades_testigos = async (
  data: GuardarActividadesPayload
) => {
  try {
    const response = await Planning.post(`/guardar_actividades_testigos`, data);
    return response.data as GuardarActividadesResponse;
  } catch (error: unknown) {
    showError("Error en guardar actividades testigos");
    throw error;
  }
};

// ───────────────────────────── Helpers firma protegida ──────────────────────
const sigKey = (fieldName: string, faseId?: string | number): string =>
  `testigos::${faseId ?? "NA"}::${fieldName}`;

// ────────────────────────────────────────────────────────────────────────────

const NewTestigos = () => {
  const params = useParams();
  const ref = useRef<HTMLFormElement>(null);
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  const [local, setLocal] = useState<LocalSession>(null);
  const [controlData, setControlData] = useState<Actividad[]>([]);
  const [memoriaFase, setMemoriaFase] = useState<MemoriaFase>({});
  const [memoriaActividades, setMemoriaActividades] =
    useState<MemoriaActividades>({});

  // 🔒 Estado de firma protegida
  const [sigUnlocked, setSigUnlocked] = useState<Record<string, boolean>>({});
  const [sigModal, setSigModal] = useState<{
    open: boolean;
    fieldName: string | null;
    allowedRoles: Array<string | number>;
  }>({ open: false, fieldName: null, allowedRoles: [] });
  const [sigPassword, setSigPassword] = useState("");

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

  // Guardar valores dinámicos
  const setValue = (name: string, value: MemValue): void => {
    setMemoriaActividades((prev) => ({ ...prev, [name]: value }));
  };

  // Cargar datos fase + actividades
  useEffect(() => {
    const rawId = (params as unknown as Record<string, string | string[]>).id;
    const idStr = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!idStr) return;

    (getActividadesTestigos as (id: number) => Promise<ApiActividadesResponse>)(
      Number(idStr)
    ).then((data) => {
      if (data && Array.isArray(data.actividades)) {
        setMemoriaFase((prev) => ({
          ...prev,
          fase_testigo: data.fase_testigo,
        }));
        setControlData(data.actividades);
      } else {
        setControlData([]);
      }
    });
  }, [params]);

  // ─────────────── Firma protegida: abrir/cerrar modal + validar ────────────
  const openSigModal = (
    fieldName: string,
    allowedRoles: Array<string | number> = []
  ) => setSigModal({ open: true, fieldName, allowedRoles });

  const closeSigModal = () => {
    setSigModal({ open: false, fieldName: null, allowedRoles: [] });
    setSigPassword("");
  };

  const submitSigValidation = async () => {
    try {
      const pass = String(sigPassword || "").trim();
      if (!pass) {
        showError("Ingresa la contraseña.");
        return;
      }
      if (!sigModal.fieldName) {
        showError("Campo de firma no identificado.");
        return;
      }

      // ✅ Validación EXACTA como en tu snippet 1:
      //    validateSignaturePass({ security_pass, signature_id })
      const signature_id = sigKey(
        sigModal.fieldName,
        memoriaFase.fase_testigo?.fase_id
      );

      const res = await validateSignaturePass({
        security_pass: pass,
        signature_id,
      });

      if (!res?.valid) {
        showError("Contraseña no autorizada para esta firma.");
        return;
      }

      setSigUnlocked((prev) => ({
        ...prev,
        [sigModal.fieldName as string]: true,
      }));
      closeSigModal();
    } catch (err: unknown) {
      console.error("❌ Validación firma error:", err);
      showError("Validación fallida. Intenta de nuevo.");
    }
  };

  // Interceptores para bloquear el select si está protegido
  const onSigSelectMouseDown = (
    e: React.MouseEvent<HTMLSelectElement>,
    cfg: ActividadConfig | null,
    fieldName: string
  ) => {
    if (cfg?.type === "signature" && cfg?.signatureSpecific && !sigUnlocked[fieldName]) {
      e.preventDefault();
      e.stopPropagation();
      openSigModal(fieldName, cfg.allowedRoles ?? []);
    }
  };

  const onSigSelectKeyDown = (
    e: React.KeyboardEvent<HTMLSelectElement>,
    cfg: ActividadConfig | null,
    fieldName: string
  ) => {
    if (cfg?.type === "signature" && cfg?.signatureSpecific && !sigUnlocked[fieldName]) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        openSigModal(fieldName, cfg.allowedRoles ?? []);
      }
    }
  };

  // ───────────────────────────── Submit general ─────────────────────────────
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

    const fase = memoriaFase.fase_testigo;
    const resultado: GuardarActividadesPayload = {
      adaptation_date_id: fase?.adaptation_date_id,
      descripcion: fase?.descripcion,
      fase_id: fase?.fase_id,
      activities: fase?.activities,
      phase_type: fase?.phase_type,
      forms: JSON.stringify(actividadesPreparadas),
      user: local?.user ?? "",
    };

    const data = await guardar_actividades_testigos(resultado);

    if (data.estado !== 200) {
      showError("Error al guardar el control");
      return;
    }

    // Reset DOM + estado (incluye file inputs y desbloqueos)
    ref.current?.reset();
    Object.values(fileInputsRef.current).forEach((inp) => {
      if (inp) inp.value = "";
    });
    setMemoriaActividades({});
    setSigUnlocked({});
    showSuccess("Control guardado correctamente");
    setTimeout(() => {
      window.close();
    }, 1000);
  };

  return (
    <div className="w-full rounded-2xl bg-[rgb(var(--surface))] backdrop-blur-sm border border-[rgb(var(--border))] shadow-md overflow-hidden mt-4">
      <div className="bg-[rgb(var(--surface-muted))] px-[10px] py-[10px] border-b border-[rgb(var(--border))] backdrop-blur-sm">
        <Text type="title" color="text-[rgb(var(--foreground))]">
          Fase de testigos
        </Text>
      </div>

      <div className="mt-6">
        <form
          onSubmit={handleSubmit}
          ref={ref}
          className="min-h-screen w-full bg-[rgb(var(--background))] text-[rgb(var(--foreground))] p-[10px] sm:p-[10px] flex flex-col rounded-2xl"
        >
          {controlData.map((item) => {
            const cfg = parseConfig(item.config);
            const fieldName = `field_${item.id}`;
            const modeName = `${fieldName}_mode`;
            const isProtected =
              cfg?.type === "signature" && cfg?.signatureSpecific;
            const isUnlocked = !!sigUnlocked[fieldName];

            return (
              <div key={item.id}>
                <div className="mt-4">
                  <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                    {item.description}
                  </Text>
                </div>

                {/* TEXT */}
                {cfg?.type === "text" && (
                  <input
                    type="text"
                    id={fieldName}
                    name={fieldName}
                    value={(memoriaActividades[fieldName] as string) ?? ""}
                    onChange={(e) => setValue(fieldName, e.target.value)}
                    className="block w-full px-3 py-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-md shadow-sm
                           focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))]
                           text-[rgb(var(--foreground))] placeholder-[rgb(var(--foreground))]/50 text-center"
                    required={item.binding}
                  />
                )}

                {/* IMAGE */}
                {cfg?.type === "image" && (
                  <input
                    type="file"
                    accept={cfg?.accept ?? "image/*"}
                    id={fieldName}
                    name={fieldName}
                    ref={(el) => {
                      fileInputsRef.current[fieldName] = el;
                    }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const base64 = reader.result as string;
                          setValue(fieldName, base64);
                        };
                        reader.readAsDataURL(file);
                      } else {
                        setValue(fieldName, "");
                      }
                    }}
                    className="block w-full px-3 py-2 bg-[rgb(var(--surface))] border 
               border-[rgb(var(--border))] rounded-md shadow-sm 
               focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] 
               focus:border-[rgb(var(--ring))] text-[rgb(var(--foreground))] 
               placeholder-[rgb(var(--foreground))]/50 text-center"
                    required={item.binding}
                  />
                )}

                {/* SIGNATURE */}
                {cfg?.type === "signature" && (
                  <>
                    {isProtected && !isUnlocked && (
                      <div className="mt-3 mb-2 text-xs text-[rgb(var(--warning))] text-center">
                        🔒 Requiere validación de rol antes de firmar.
                      </div>
                    )}

                    <select
                      className={`text-center block w-full px-3 py-2 bg-[rgb(var(--surface))] border rounded-md shadow-sm
                              focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))]
                              text-[rgb(var(--foreground))] placeholder-[rgb(var(--foreground))]/50 mb-2
                              ${
                                isProtected && !isUnlocked
                                  ? "border-[rgb(var(--warning))]"
                                  : "border-[rgb(var(--border))]"
                              }`}
                      value={(memoriaActividades[modeName] as string) ?? ""}
                      onMouseDown={(e) =>
                        onSigSelectMouseDown(e, cfg, fieldName)
                      }
                      onKeyDown={(e) => onSigSelectKeyDown(e, cfg, fieldName)}
                      onChange={(e) => {
                        if (isProtected && !isUnlocked) {
                          e.preventDefault();
                          return;
                        }
                        setMemoriaActividades((prev) => ({
                          ...prev,
                          [modeName]: e.target.value,
                        }));
                      }}
                      required
                    >
                      <option value="">-- Selecciona --</option>
                      <option value="texto">Texto</option>
                      <option value="firma">Firma</option>
                    </select>

                    {memoriaActividades[modeName] === "texto" && (
                      <input
                        type="text"
                        className="text-center block w-full px-3 py-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-md shadow-sm
                               focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))]
                               text-[rgb(var(--foreground))] placeholder-[rgb(var(--foreground))]/50"
                        name={fieldName}
                        value={(memoriaActividades[fieldName] as string) ?? ""}
                        required={item.binding}
                        onChange={(e) => setValue(fieldName, e.target.value)}
                      />
                    )}

                    {memoriaActividades[modeName] === "firma" && (
                      <FirmaB64
                        onSave={(base64: string) => setValue(fieldName, base64)}
                        onClear={() => setValue(fieldName, "")}
                      />
                    )}
                  </>
                )}
              </div>
            );
          })}

          {/* Modal de validación firma */}
          {sigModal.open && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgb(var(--shadow))]/60 p-4">
              <div className="w-full max-w-sm rounded-xl bg-[rgb(var(--surface))] border border-[rgb(var(--border))] p-5 shadow-2xl">
                <h3 className="text-[rgb(var(--foreground))] text-lg font-semibold mb-2">
                  Validación requerida
                </h3>
                <p className="text-[rgb(var(--foreground))]/80 text-sm mb-4">
                  Ingresa la contraseña para habilitar la firma.
                </p>
                <input
                  type="password"
                  autoFocus
                  value={sigPassword}
                  onChange={(e) => setSigPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitSigValidation()}
                  className="block w-full px-3 py-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-md shadow-sm
                         focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-[rgb(var(--ring))] 
                         text-[rgb(var(--foreground))] placeholder-[rgb(var(--foreground))]/50"
                  placeholder="Contraseña"
                />
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeSigModal}
                    className="px-4 py-2 rounded-lg bg-[rgb(var(--surface-muted))] hover:bg-[rgb(var(--surface-muted))]/80 text-[rgb(var(--foreground))] text-sm"
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

                {Array.isArray(sigModal.allowedRoles) &&
                  sigModal.allowedRoles.length > 0 && (
                    <p className="mt-3 text-xs text-[rgb(var(--foreground))]/70">
                      Roles permitidos: {sigModal.allowedRoles.join(", ")}
                    </p>
                  )}
              </div>
            </div>
          )}

          <hr className="my-4 border-t border-[rgb(var(--border))] w-full max-w-lg mx-auto opacity-60" />
          <div className="flex justify-center gap-4 mt-6">
            <Button type="submit" variant="after2" label="Siguiente Fase" />
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTestigos;
