import { jwtDecode } from "jwt-decode"; // ✅
import nookies from 'nookies';

type JWTPayload = {
  exp: number; // tiempo de expiración en segundos (Unix timestamp)
  [key: string]: any;
};

export function isTokenExpired(): boolean {
  const { token } = nookies.get(null);

  if (!token) return true;

  try {
    const decoded = jwtDecode<JWTPayload>(token);
    const now = Date.now() / 1000; // tiempo actual en segundos

    if (decoded.exp < now) {
      // Token expirado
      clearAuthCookies();
      return true;
    }

    return false;
  } catch (error) {
    // Token inválido
    clearAuthCookies();
    return true;
  }
}

export function clearAuthCookies() {
  nookies.destroy(null, 'token');
  nookies.destroy(null, 'email');
  nookies.destroy(null, 'role');
  nookies.destroy(null, 'name');
}
