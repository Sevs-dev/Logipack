"use client";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const { role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!role || !allowedRoles.includes(role))) {
      router.push("/unauthorized");
    }
  }, [role, loading, router, allowedRoles]);

  if (loading) return <p>Cargando...</p>;

  return <>{children}</>;
};

export default ProtectedRoute;
