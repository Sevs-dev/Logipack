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
    const cookies = nookies.get(null);
    const token = cookies.token;

    const logout = () => {
      nookies.destroy(null, "token");
      nookies.destroy(null, "email");
      setIsAuthenticated(false);
      router.push("/");
    };

    const refreshToken = () => {
      if (token) {
        nookies.set(null, "token", token, {
          maxAge: 1800,
          path: "/",
        });
      }
    };

    const checkAuth = () => {
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

    checkAuth();

    const handleUserActivity = () => refreshToken();
    window.addEventListener("mousemove", handleUserActivity);
    window.addEventListener("keydown", handleUserActivity);

    return () => {
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
    };
  }, []);

  return { isAuthenticated };
}
