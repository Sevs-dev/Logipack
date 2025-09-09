import React, { useRef, useState, useEffect, FormEvent } from "react";
import { useParams } from "next/navigation";
import { showSuccess, showError } from "../toastr/Toaster";
import Text from "../text/Text";
import Button from "../buttons/buttons";
import { getActividadesTestigos } from "@/app/services/planing/planingServices";
import FirmaB64 from "./FirmaB64";
import axios from "axios";
import { API_URL } from "@/app/config/api";

// ⬇️ IMPORTA el servicio de seguridad (rol + pass)
import {
  validateSecurityPassWithRole,
  // Si algún día necesitas por ID:
  // validateSecurityPassWithRoleId,
} from "@/app/services/userDash/securityPass";

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

// Se crea una instancia de axios con la configuración base de la API.
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

// 👇 Extendemos para soportar firma protegida
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
    console.log(response.data);
    return response.data;
  } catch (error: unknown) {
    showError("Error en guardar actividades testigos");
    throw error;
  }
};

// ───────────────────────────── Helpers firma protegida ──────────────────────
const getCookieRole = (): string => {
  const raw = document.cookie
    .split("; ")
    .find((row) => row.startsWith("role="))
    ?.split("=")[1];
  return raw ? decodeURIComponent(raw).replace(/"/g, "").trim() : "";
};

const includesCI = (arr: Array<string | number> | undefined, val: string) =>
  Array.isArray(arr) &&
  arr.some(
    (x) => String(x).trim().toLowerCase() === String(val).trim().toLowerCase()
  );

// ────────────────────────────────────────────────────────────────────────────

const NewTestigos = () => {
  const params = useParams();
  const ref = useRef<HTMLFormElement>(null);

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
    if (!params.id) return;
    (getActividadesTestigos as (id: number) => Promise<ApiActividadesResponse>)(
      Number(params.id)
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
  }, [params.id]);

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

      const roleStr =
        // si algún día guardas rol en local, úsalo primero
        (local && typeof local.role === "string" && String(local.role)) ||
        getCookieRole();

      if (!roleStr) {
        showError("No se detectó tu rol actual.");
        return;
      }

      // Si allowedRoles viene como nombres, validamos aquí también
      const allowed = sigModal.allowedRoles || [];
      const allNumeric = allowed.every((r) => Number.isFinite(Number(r)));
      if (allowed.length > 0 && !allNumeric) {
        if (!includesCI(allowed, roleStr)) {
          showError(`Tu rol (${roleStr}) no está autorizado para esta firma.`);
          return;
        }
      } else if (allowed.length > 0 && allNumeric) {
        console.warn(
          "⚠️ allowedRoles viene como IDs. El backend debe validar el mapeo ID→rol. (Recomendado: migrar a nombres)"
        );
      }

      // Validación en backend por ROL TEXTO + PASSWORD
      const res = await validateSecurityPassWithRole(roleStr, pass);
      console.log("✅ Validación firma (role string):", { roleStr, res });

      if (!res?.valid) {
        showError("Contraseña o rol no autorizado.");
        return;
      }

      if (!sigModal.fieldName) {
        showError("Campo de firma no identificado.");
        return;
      }

      // Desbloquear select para este campo
      setSigUnlocked((prev) => ({
        ...prev,
        [sigModal.fieldName as string]: true,
      }));
      closeSigModal();

      if (res?.migrated) {
        console.log("ℹ️ security_pass migrado a hash de forma segura.");
      }
    } catch (err: unknown) {
      console.error("❌ Validación firma error:", err);
      if (err && typeof err === "object" && "message" in err) {
        showError(
          (err as { message?: string }).message ??
          "Validación fallida. Intenta de nuevo."
        );
      } else {
        showError("Validación fallida. Intenta de nuevo.");
      }
    }
  };

  // Interceptores para bloquear el select si está protegido
  const onSigSelectMouseDown = (
    e: React.MouseEvent<HTMLSelectElement>,
    cfg: ActividadConfig | null,
    fieldName: string
  ) => {
    if (
      cfg?.type === "signature" &&
      cfg?.signatureSpecific &&
      !sigUnlocked[fieldName]
    ) {
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
    if (
      cfg?.type === "signature" &&
      cfg?.signatureSpecific &&
      !sigUnlocked[fieldName]
    ) {
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

    const guardar = guardar_actividades_testigos as (
      payload: GuardarActividadesPayload
    ) => Promise<GuardarActividadesResponse>;

    const data = await guardar(resultado);

    if (data.estado !== 200) {
      showError("Error al guardar el control");
      return;
    }

    ref.current?.reset();
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
                    accept="image/*"
                    id={fieldName}
                    name={fieldName}
                    value={(memoriaActividades[fieldName] as string) ?? ""}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const base64 = reader.result;
                          setValue(fieldName, base64 as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="block w-full px-3 py-2 bg-[#1a1d23] border 
                    border-gray-600 rounded-md shadow-sm focus:outline-none
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                    text-white placeholder-gray-400 text-center"
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
                      required
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
                    >
                      <option value="">-- Selecciona --</option>
                      <option value="texto">Texto</option>
                      <option value="firma">Firma</option>
                    </select>

                    {/* Mostrar Input si selecciona "texto" */}
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

                    {/* Mostrar Firma si selecciona "firma" */}
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
