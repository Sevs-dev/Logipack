"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import nookies from "nookies";
import { useRouter, usePathname } from "next/navigation";
import { getUserByEmail } from "../services/userDash/authservices";
import Loader from "../components/loader/Loader";
import { showWarning } from "../components/toastr/Toaster";

type User = {
  id: number;
  name: string;
};

type AuthContextType = {
  user: User | null;
  role: string | null;
  loading: boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasNotified, setHasNotified] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const logout = useCallback(
    (showToast = false) => {
      nookies.destroy(null, "token");
      nookies.destroy(null, "email");
      nookies.destroy(null, "role");
      setUser(null);
      setRole(null);
      if (showToast && !hasNotified) {
        showWarning("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
        setHasNotified(true);
      }
      router.push("/pages/login");
    },
    [router, hasNotified]
  );

  const parseJwt = useCallback((token: string) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }, []);

  const isTokenExpired = useCallback(
    (token: string): boolean => {
      const decoded = parseJwt(token);
      return !decoded || decoded.exp < Date.now() / 1000;
    },
    [parseJwt]
  );

  const refreshToken = useCallback(async () => {
    try {
      const res = await fetch("/api/refresh", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${nookies.get().token}`,
        },
      });

      if (!res.ok) throw new Error("Refresh falló");

      const data = await res.json();
      const nuevoToken = data.autorización.token;

      nookies.set(null, "token", nuevoToken, {
        path: "/",
        maxAge: 60 * 60, // 1 hora
      });
    } catch {
      logout(true);
    }
  }, [logout]);

  useEffect(() => {
    const cookies = nookies.get();
    const token = cookies.token;
    const email = cookies.email;
    const storedRole = cookies.role || null;

    if (!token || !email || isTokenExpired(token)) {
      logout(true);
      setLoading(false);
      return;
    }

    const decodedEmail = decodeURIComponent(email);
    getUserByEmail(decodedEmail)
      .then((res) => {
        setUser(res.usuario as User);
        setRole(res.role || storedRole);
      })
      .catch(() => {
        logout(true);
      })
      .finally(() => {
        setLoading(false);
      });

    // Validación cada 30s para token vencido
    const expireInterval = setInterval(() => {
      const currentToken = nookies.get().token;
      if (!currentToken || isTokenExpired(currentToken)) {
        logout(true);
      }
    }, 30 * 1000);

    return () => clearInterval(expireInterval);
  }, [pathname, logout, isTokenExpired]);

  useEffect(() => {
    let lastActivity = Date.now();

    const updateActivity = () => {
      lastActivity = Date.now();
    };

    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keydown", updateActivity);

    const refreshInterval = setInterval(() => {
      const token = nookies.get().token;
      const decoded = token ? parseJwt(token) : null;
      if (!decoded || !decoded.exp) return;

      const tiempoRestante = decoded.exp * 1000 - Date.now();
      const actividadReciente = Date.now() - lastActivity < 10 * 60 * 1000;
      const expiraPronto = tiempoRestante < 5 * 60 * 1000;

      if (expiraPronto && actividadReciente) {
        refreshToken();
      }
    }, 60 * 1000); // cada minuto

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
    };
  }, [parseJwt, refreshToken]);

  if (loading) return <Loader />;

  return (
    <AuthContext.Provider value={{ user, role, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
};
