"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthProvider";
import Loader from "../components/loader/Loader";

function withAuth<P extends object>(Component: React.ComponentType<P>): React.FC<P> {
  const AuthComponent: React.FC<P> = (props) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.replace("/pages/noneUser");
      }
    }, [loading, user, router]);

    if (loading) return <Loader />;
    if (!user) return null;

    return <Component {...props} />;
  };

  AuthComponent.displayName = `withAuth(${Component.displayName || Component.name || "Component"})`;

  return AuthComponent;
}

export default withAuth;
