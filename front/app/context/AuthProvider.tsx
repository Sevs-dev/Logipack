"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
  useCallback,
} from "react";
import nookies from "nookies";
import { useRouter, usePathname } from "next/navigation";
import { getUserByEmail, refresh } from "../services/userDash/authservices";
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
  const [warnedAboutExpiry, setWarnedAboutExpiry] = useState(false);
  const lastActivityRef = useRef(Date.now()); // ✅ correctamente colocado aquí

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
      const nuevoToken = await refresh();

      nookies.set(null, "token", nuevoToken, {
        path: "/",
        maxAge: 60 * 60, // 1 hora
      });

      console.log("🔁 Token renovado automáticamente");
    } catch (err) {
      console.warn("❌ Error al refrescar token", err);
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

    const expireInterval = setInterval(() => {
      const currentToken = nookies.get().token;
      if (!currentToken || isTokenExpired(currentToken)) {
        logout(true);
      }
    }, 30 * 1000);

    return () => clearInterval(expireInterval);
  }, [pathname, logout, isTokenExpired]);

  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keydown", updateActivity);

    const refreshInterval = setInterval(() => {
      const token = nookies.get().token;
      const decoded = token ? parseJwt(token) : null;
      if (!decoded || !decoded.exp) return;

      const tiempoRestante = decoded.exp * 1000 - Date.now();
      const actividadReciente = Date.now() - lastActivityRef.current < 10 * 60 * 1000;
      const expiraPronto = tiempoRestante < 5 * 60 * 1000;
      const expiraEnUnMinuto = tiempoRestante < 60 * 1000;

      if (expiraPronto && actividadReciente) {
        console.log("🕒 Token expira pronto y hubo actividad, renovando...");
        refreshToken();
        setWarnedAboutExpiry(false);
        return;
      }

      if (expiraEnUnMinuto && !actividadReciente && !warnedAboutExpiry) {
        showWarning("⚠️ Tu sesión se cerrará pronto si no hay actividad.");
        setWarnedAboutExpiry(true);
        return;
      }

      if (!expiraEnUnMinuto && warnedAboutExpiry) {
        setWarnedAboutExpiry(false);
      }
    }, 60 * 1000);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
    };
  }, [parseJwt, refreshToken, warnedAboutExpiry]);

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
