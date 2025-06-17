"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthProvider";
import Loader from "../components/loader/Loader";

function withAuth<P extends object>(Component: React.ComponentType<P>): React.FC<P> {
  const AuthComponent: React.FC<P> = (props) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    // Seguridad extra: si no user, hacer replace
    useEffect(() => {
      if (!loading && !user) {
        console.warn("🚫 Usuario no autenticado. Redirigiendo a /pages/noneUser");
        router.replace("/pages/noneUser");
      }
    }, [loading, user, router]);

    // Render logic:
    if (loading) return <Loader />;

    if (!user && !loading) {
      // Prevent flicker:
      if (typeof window !== "undefined") {
        router.replace("/pages/noneUser");
      }
      return null;
    }

    return <Component {...props} />;
  };

  AuthComponent.displayName = `withAuth(${Component.displayName || Component.name || "Component"})`;

  return AuthComponent;
}

export default withAuth;
