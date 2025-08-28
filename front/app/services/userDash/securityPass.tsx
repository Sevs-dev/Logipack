import axios from "axios";
import { API_URL } from "../../config/api";

export const Security = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  // Si usas cookies/sesiones en el backend:
  // withCredentials: true,
});

export type ValidatePayload = {
  role?: string; // si guardas rol como texto en users.role
  role_id?: number; // si usas FK a tabla roles
  security_pass: string;
};

export type ValidateResponse = {
  valid: boolean;
  user?: { id: number; name: string; role: string | number };
  migrated?: boolean; // true si el backend re-hasheó en caliente
};

export async function validateSecurityPassByRole(
  payload: ValidatePayload,
  opts?: { signal?: AbortSignal }
): Promise<ValidateResponse> {
  if (!payload.security_pass) throw new Error("security_pass es obligatorio");
  if (!payload.role && payload.role_id == null) {
    throw new Error("Debes enviar role o role_id");
  }

  try {
    const { data } = await Security.post<ValidateResponse>(
      "/users/validate-security-pass",
      payload,
      { signal: opts?.signal }
    );
    return data;
  } catch (err: unknown) {
    // Mapea errores útiles
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 429) {
        throw new Error("Demasiados intentos. Intenta de nuevo en un minuto.");
      }
      type ErrorResponse = { mensaje?: string };
      const msg =
        (err.response?.data as ErrorResponse)?.mensaje ||
        err.message ||
        "Error validando security_pass";
      throw new Error(msg);
    }
    throw err;
  }
}

/** Azúcar sintáctica por si prefieres llamar con role string */
export function validateSecurityPassWithRole(
  role: string,
  security_pass: string,
  opts?: { signal?: AbortSignal }
) {
  return validateSecurityPassByRole({ role, security_pass }, opts);
}

/** Azúcar sintáctica por si prefieres llamar con role_id numérico */
export function validateSecurityPassWithRoleId(
  role_id: number,
  security_pass: string,
  opts?: { signal?: AbortSignal }
) {
  return validateSecurityPassByRole({ role_id, security_pass }, opts);
}
