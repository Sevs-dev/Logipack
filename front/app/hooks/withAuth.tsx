"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthProvider";
import Loader from "../components/loader/Loader";

function withAuth<P extends {}>(Component: React.ComponentType<P>): React.FC<P> {
  return (props: P) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.replace("/pages/noneUser");
      }
    }, [loading, user, router]);

    if (loading) return <Loader />;

    if (!user) return null; // Para que no intente renderizar nada mientras redirige

    return <Component {...props} />;
  };
}

export default withAuth;
