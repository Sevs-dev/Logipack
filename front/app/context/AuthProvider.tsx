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
import { showError } from "../components/toastr/Toaster"; // ✅ IMPORTANTE

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
  const [hasNotified, setHasNotified] = useState(false); // ✅ para evitar spam de toast

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
        showError("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
        setHasNotified(true);
      }
      router.push("/pages/login");
    },
    [router, hasNotified]
  );

  const parseJwt = (token: string) => {
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
    } catch (error) {
      return null;
    }
  };

  const isTokenExpired = (token: string): boolean => {
    const decoded = parseJwt(token);
    if (!decoded || decoded.exp < Date.now() / 1000) return true;
    return false;
  };

  useEffect(() => {
    const cookies = nookies.get();
    const token = cookies.token;
    const email = cookies.email;
    const storedRole = cookies.role || null;

    if (!token || !email || isTokenExpired(token)) {
      logout(true); // ✅ con toast
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
        logout(true); // ✅ con toast
      })
      .finally(() => {
        setLoading(false);
      });

    // ⏰ Verificación periódica de expiración de token
    const interval = setInterval(() => {
      const currentCookies = nookies.get();
      const currentToken = currentCookies.token;
      if (!currentToken || isTokenExpired(currentToken)) {
        logout(true); // ✅ con toast
      }
    }, 30 * 1000); // Cada 30 segundos

    return () => clearInterval(interval);
  }, [pathname, logout]);

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
