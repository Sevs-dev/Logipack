"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import nookies from "nookies";
import { useRouter } from "next/navigation";
import { getUserByEmail } from "../services/userDash/authservices";
import Loader from "../components/loader/Loader";

type User = {
  id: number;
  name: string;
  // extiende con lo que necesites
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

  const logout = () => {
    nookies.destroy(null, "token");
    nookies.destroy(null, "email");
    nookies.destroy(null, "role");
    setUser(null);
    setRole(null);
    router.push("/pages/login");
  };

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
    } catch (err) {
      return null;
    }
  };

  // const refreshToken = async (token: string) => {
  //   try {
  //     const decoded = parseJwt(token);
  //     const expiresIn = decoded?.exp - Date.now() / 1000;
  //     if (expiresIn < 300) {
  //       const res = await fetch("/api/refresh-token", {
  //         method: "POST",
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       });
  //       const data = await res.json();
  //       nookies.set(null, "token", data.newToken, {
  //         maxAge: 7200,
  //         path: "/",
  //       });
  //     }
  //   } catch (err) {
  //     console.error("Error al renovar token", err);
  //   }
  // };

  useEffect(() => {
    const cookies = nookies.get();
    const token = cookies.token;
    const email = cookies.email;
    const storedRole = cookies.role || null;

    if (!token || !email) {
      router.push("/pages/login");
      setLoading(false);
      return;
    }

    const decoded = parseJwt(token);
    if (!decoded || decoded.exp < Date.now() / 1000) {
      logout();
      return;
    }

    const decodedEmail = decodeURIComponent(email);
    // refreshToken(token);

    getUserByEmail(decodedEmail)
      .then((res) => {
        setUser(res.usuario);
        setRole(res.role || storedRole);
      })
      .catch(() => {
        logout();
      })
      .finally(() => {
        setLoading(false);
      });

    // const keepAlive = () => refreshToken(token);
    // window.addEventListener("mousemove", keepAlive);
    // window.addEventListener("keydown", keepAlive);

    // return () => {
    //   window.removeEventListener("mousemove", keepAlive);
    //   window.removeEventListener("keydown", keepAlive);
    // };
  }, [router]);

  if (loading) {
    return (
      <Loader />
    );
  }

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
