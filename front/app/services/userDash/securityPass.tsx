// services/userDash/securityPass.ts
import axios, { type AxiosResponse } from "axios";
import { API_URL } from "../../config/api";

/** ========= AXIOS INSTANCE ========= */
const BASE = API_URL.replace(/\/+$/, "");
const baseURL = /\/api$/i.test(BASE) ? BASE : `${BASE}/api`;

export const Security = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

/** ========= TYPES ========= */
export interface SignatureValidationRequest {
  /** Contraseña de firma ingresada por el usuario */
  security_pass: string;
  /**
   * Identificador de la firma (ej. la misma key que usas para setSigUnlocked):
   * p.ej. "linea:12|clave:control_temp" o "12::control_temp"
   * (El backend lo usa solo para auditoría/tráceo.)
   */
  signature_id: string;
}

export interface SignatureValidationResponse {
  valid: boolean;
  user?: { id: number; name: string; role: string };
  migrated?: boolean; // si el backend migró de texto plano a hash
  error?: string;     // opcional: código de error del backend
}

type ApiErrorBody = { mensaje?: string; error?: string };

type ValidateByRoleResponse = {
  valid: boolean;
  user?: { id: number; name: string; role: string | number };
  migrated?: boolean;
};

/** ========= HELPERS ========= */
function isApiErrorBody(v: unknown): v is ApiErrorBody {
  return typeof v === "object" && v !== null && ("mensaje" in v || "error" in v);
}

function normalizeAxiosError(err: unknown): Error {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    if (status === 429) {
      return new Error("Demasiados intentos. Intenta de nuevo en un minuto.");
    }
    const dataUnknown = err.response?.data as unknown;
    const apiMsg = isApiErrorBody(dataUnknown)
      ? (dataUnknown.mensaje ?? dataUnknown.error)
      : undefined;
    const msg = apiMsg ?? err.message ?? "Error de red";
    return new Error(msg);
  }
  return err instanceof Error ? err : new Error("Error desconocido");
}

/** ========= NUEVA API (RECOMENDADA) =========
 * Valida ÚNICAMENTE por contraseña (sin depender de rol).
 */
export async function validateSignaturePass(
  payload: SignatureValidationRequest,
  opts?: { signal?: AbortSignal }
): Promise<SignatureValidationResponse> {
  if (!payload?.security_pass?.trim()) {
    throw new Error("security_pass es obligatorio");
  }
  if (!payload?.signature_id?.trim()) {
    throw new Error("signature_id es obligatorio");
  }

  try {
    const { data } = await Security.post<
      SignatureValidationResponse,
      AxiosResponse<SignatureValidationResponse>,
      SignatureValidationRequest
    >("auth/validate-signature-pass", payload, { signal: opts?.signal });

    return data;
  } catch (err: unknown) {
    throw normalizeAxiosError(err);
  }
}

/** ========= COMPAT (DEPRECATED) =========
 * Mantén temporalmente mientras migras al flujo nuevo.
 */

/** @deprecated Usa validateSignaturePass({ security_pass, signature_id }) */
export async function validateSecurityPassByRole(
  payload: { role?: string; role_id?: number; security_pass: string },
  opts?: { signal?: AbortSignal }
): Promise<ValidateByRoleResponse> {
  if (!payload.security_pass) throw new Error("security_pass es obligatorio");
  if (!payload.role && payload.role_id == null) {
    throw new Error("Debes enviar role o role_id");
  }
  try {
    const { data } = await Security.post<
      ValidateByRoleResponse,
      AxiosResponse<ValidateByRoleResponse>,
      { role?: string; role_id?: number; security_pass: string }
    >("users/validate-security-pass", payload, { signal: opts?.signal });

    return data;
  } catch (err: unknown) {
    throw normalizeAxiosError(err);
  }
}

/** @deprecated Usa validateSignaturePass({ security_pass, signature_id }) */
export const validateSecurityPassWithRole = (
  role: string,
  security_pass: string,
  opts?: { signal?: AbortSignal }
) => validateSecurityPassByRole({ role, security_pass }, opts);

/** @deprecated Usa validateSignaturePass({ security_pass, signature_id }) */
export const validateSecurityPassWithRoleId = (
  role_id: number,
  security_pass: string,
  opts?: { signal?: AbortSignal }
) => validateSecurityPassByRole({ role_id, security_pass }, opts);
