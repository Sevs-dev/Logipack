"use client";
import { useEffect, useState } from "react";
import nookies from "nookies";
import { useRouter } from "next/navigation";

function parseJwt(token: string) {
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
    console.error("Error al decodificar el token:", error);
    return null;
  }
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const cookies = nookies.get(null);
      const token = cookies.token;

      if (!token) {
        logout();
        return;
      }

      const decoded = parseJwt(token);
      if (!decoded || decoded.exp < Date.now() / 1000) {
        logout();
      } else {
        setIsAuthenticated(true);
        refreshToken();
      }
    };

    const refreshToken = () => {
      const cookies = nookies.get(null);
      if (cookies.token) {
        nookies.set(null, "token", cookies.token, {
          maxAge: 1800, // 30 minutos (1800 segundos)
          path: "/",
        });
      }
    };

    const logout = () => {
      nookies.destroy(null, "token");
      nookies.destroy(null, "email");
      setIsAuthenticated(false);
      router.push("/login");
    };

    checkAuth();

    const handleUserActivity = () => refreshToken();
    window.addEventListener("mousemove", handleUserActivity);
    window.addEventListener("keydown", handleUserActivity);

    return () => {
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
    };
  }, [router]);

  return { isAuthenticated };
}
