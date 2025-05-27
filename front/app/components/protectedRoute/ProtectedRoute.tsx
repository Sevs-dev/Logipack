"use client";
import { useAuth } from "../../context/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type PermissionCheckProps = {
  children: React.ReactNode;
  requiredPermission: string;
};


const ProtectedRoute = ({ children, requiredPermission }: PermissionCheckProps) => {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (!loading) {
      // Suponiendo que el objeto user tenga un array "permissions"
      if (user && user.permissions && user.permissions.includes(requiredPermission)) {
        setHasPermission(true);
      } else {
        // Opcional: Puedes hacer una verificación extra según el rol, si manejas un mapping
        router.push("/unauthorized");
      }
    }
  }, [loading, user, requiredPermission, router]);

  if (loading) return <p>Cargando...</p>;
  if (!hasPermission) return null; // O muestra un mensaje de acceso denegado

  return <>{children}</>;
};

export default ProtectedRoute;
