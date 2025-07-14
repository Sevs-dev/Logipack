"use client";
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import nookies from "nookies";
import { useRouter, usePathname } from "next/navigation";
import { getUserByEmail } from "../services/userDash/authservices";
import Loader from "../components/loader/Loader";

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

  const router = useRouter();
  const pathname = usePathname();

  const logout = useCallback(() => {
    // console.log("🚪 Cerrando sesión...");
    nookies.destroy(null, "token");
    nookies.destroy(null, "email");
    nookies.destroy(null, "role");
    setUser(null);
    setRole(null);
    router.push("/pages/login");
  }, [router]);

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
      console.error("❌ Error al parsear JWT:", error);
      return null;
    }
  };

  useEffect(() => {
    const cookies = nookies.get();
    const token = cookies.token;
    const email = cookies.email;
    const storedRole = cookies.role || null;
    // console.log("🍪 Cookies encontradas:", cookies);

    if (!token || !email) {
      // console.warn("❌ Token o email no presentes. Cerrando sesión.");
      logout();
      setLoading(false);
      return;
    }

    const decoded = parseJwt(token);
    if (!decoded || decoded.exp < Date.now() / 1000) {
      // console.warn("⚠️ Token inválido o expirado. Cerrando sesión.");
      logout();
      setLoading(false);
      return;
    }

    const decodedEmail = decodeURIComponent(email);
    // console.log("📧 Buscando usuario por email:", decodedEmail);
    getUserByEmail(decodedEmail)
      .then((res) => {
        // console.log("✅ Usuario obtenido:", res.usuario);
        setUser(res.usuario as User);
        setRole(res.role || storedRole);
      })
      .catch((err) => {
        // console.error("❌ Error al obtener usuario:", err);
        logout();
      })
      .finally(() => {
        setLoading(false);
      });
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
