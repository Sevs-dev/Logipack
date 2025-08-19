import { jwtDecode, JwtPayload } from "jwt-decode";
import nookies from "nookies";

// Reclamaciones del JWT con `exp` obligatorio y claims extra tipados
type JWTPayload = JwtPayload & { exp: number } & Record<string, unknown>;

export function isTokenExpired(): boolean {
  const { token } = nookies.get(null);
  if (!token) return true;

  try {
    const decoded = jwtDecode<JWTPayload>(token);
    const now = Math.floor(Date.now() / 1000); // segundos

    if (decoded.exp <= now) {
      clearAuthCookies();
      return true;
    }
    return false;
  } catch {
    // Token inválido o corrupto
    clearAuthCookies();
    return true;
  }
}

export function clearAuthCookies() {
  const opts = { path: "/" };
  ["token", "email", "role", "name"].forEach((k) =>
    nookies.destroy(null, k, opts)
  );
}
