"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthProvider";
import Loader from "../components/loader/Loader";
import { parseCookies, destroyCookie } from "nookies";
import { jwtDecode } from "jwt-decode"; // ✅

type JWTPayload = {
  exp: number;
  [key: string]: any;
};

function isTokenExpired(): boolean {
  const { token } = parseCookies();

  if (!token) return true;

  try {
    const decoded = jwtDecode<JWTPayload>(token);
    const now = Date.now() / 1000;

    if (decoded.exp < now) {
      clearAuthCookies();
      return true;
    }

    return false;
  } catch {
    clearAuthCookies();
    return true;
  }
}

function clearAuthCookies() {
  const keys = ["token", "email", "role", "name"];
  keys.forEach((key) => destroyCookie(null, key));
}

function withAuth<P extends object>(Component: React.ComponentType<P>): React.FC<P> {
  const AuthComponent: React.FC<P> = (props) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      const expired = isTokenExpired();
      if (expired || (!loading && !user)) {
        console.warn("🚫 Usuario no autenticado o token expirado. Redirigiendo a /pages/noneUser");
        router.replace("/pages/noneUser");
      }
    }, [loading, user, router]);

    if (loading) return <Loader />;

    if (!user && !loading) return null;

    return <Component {...props} />;
  };

  AuthComponent.displayName = `withAuth(${Component.displayName || Component.name || "Component"})`;

  return AuthComponent;
}

export default withAuth;
