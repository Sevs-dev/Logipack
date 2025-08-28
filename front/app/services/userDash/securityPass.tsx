// services/userDash/securityPass.tsx
import axios from "axios";
import { API_URL } from "../../config/api";

const BASE = API_URL.replace(/\/+$/,'');
const baseURL = /\/api$/i.test(BASE) ? BASE : `${BASE}/api`;

export const Security = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// Security.interceptors.request.use((cfg) => {
//   const full = `${cfg.baseURL?.replace(/\/+$/,'')}/${String(cfg.url||'').replace(/^\/+/,'')}`;
//   console.log("➡️ [Security] URL:", full);
//   return cfg;
// });

export async function validateSecurityPassByRole(payload: {
  role?: string;
  role_id?: number;
  security_pass: string;
}, opts?: { signal?: AbortSignal }) {
  if (!payload.security_pass) throw new Error("security_pass es obligatorio");
  if (!payload.role && payload.role_id == null) {
    throw new Error("Debes enviar role o role_id");
  }
//   console.log("validateSecurityPassByRole payload:", payload);

  try {
    // 👇 sin slash inicial
    const { data } = await Security.post("users/validate-security-pass", payload, { signal: opts?.signal });
    // console.log("validateSecurityPassByRole response:", data);
    return data as { valid: boolean; user?: { id:number; name:string; role:string|number }, migrated?: boolean };
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error("❌ validateSecurityPassByRole error:", {
        status: err.response?.status, data: err.response?.data
      });
      if (err.response?.status === 429) throw new Error("Demasiados intentos. Intenta de nuevo en un minuto.");
      throw new Error((err.response?.data as { mensaje?: string })?.mensaje || err.message || "Error validando security_pass");
    }
    throw err;
  }
}

export const validateSecurityPassWithRole = (role: string, security_pass: string, opts?: { signal?: AbortSignal }) =>
  validateSecurityPassByRole({ role, security_pass }, opts);
export const validateSecurityPassWithRoleId = (role_id: number, security_pass: string, opts?: { signal?: AbortSignal }) =>
  validateSecurityPassByRole({ role_id, security_pass }, opts);
