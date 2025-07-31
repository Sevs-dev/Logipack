"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthProvider";
import Loader from "../components/loader/Loader";
import { parseCookies, setCookie, destroyCookie } from "nookies";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

type JWTPayload = {
  exp: number;
};

const clearAuthCookies = () => {
  const keys = ["token", "email", "role", "name", "refresh_token"];
  keys.forEach((key) => destroyCookie(null, key));
  // console.log("🧹 Cookies eliminadas");
};

const isTokenExpired = (): boolean => {
  const { token } = parseCookies();
  if (!token) return true;

  try {
    const decoded = jwtDecode<JWTPayload>(token);
    const now = Date.now() / 1000;
    return decoded.exp < now;
  } catch {
    return true;
  }
};

const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const response = await axios.post("/api/refresh", {}, { withCredentials: true });
    const newToken = response.data.token;

    setCookie(null, "token", newToken, {
      path: "/",
      maxAge: 60 * 15, // 15 minutos
    });

    // console.log("🔁 Token renovado");
    return true;
  } catch {
    // console.warn("❌ Falló el refresh token", error);
    clearAuthCookies();
    return false;
  }
};

function withAuth<P extends object>(Component: React.ComponentType<P>): React.FC<P> {
  const AuthComponent: React.FC<P> = (props) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (loading) return;

      const verify = async () => {
        const expired = isTokenExpired();

        if (expired) {
          const refreshed = await refreshAccessToken();
          if (!refreshed) return router.replace("/pages/noneUser");
        }

        if (!user) {
          router.replace("/pages/noneUser");
        }
      };

      verify();
    }, [loading, user]);

    if (loading) return <Loader />;
    if (!user && !loading) return null;

    return <Component {...props} />;
  };

  AuthComponent.displayName = `withAuth(${Component.displayName || Component.name || "Component"})`;
  return AuthComponent;
}

export default withAuth;
