"use client";
import React, { useEffect, useState, ReactElement } from "react";
import { useAuth } from "../../context/AuthProvider";
import { getPermissionRole } from "../../services/userDash/roleServices";

type PermissionCheckProps = {
  children: ReactElement; // se espera un único elemento React
  requiredPermission: string;
};

interface PermissionRoleResponse {
  permissions: string[];
}

const PermissionOnClick = ({ children, requiredPermission }: PermissionCheckProps) => {
  const { role, loading } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!loading && role) {
      getPermissionRole(role)
        .then((data: PermissionRoleResponse) => {
          if (data.permissions && data.permissions.includes(requiredPermission)) {
            setHasPermission(true);
          }
        })
        .catch((error) => {
          console.error("Error en getPermissionRole:", error);
        })
        .finally(() => {
          setFetched(true);
        });
    }
  }, [loading, role, requiredPermission]);

  if (loading || !fetched) return <p>Cargando...</p>;

  if (hasPermission) return children;

  // Si no tiene permiso, envolvemos los children en un div que bloquea los clicks.
  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      style={{ pointerEvents: "none", opacity: 0.6 }}
    >
      {children}
    </div>
  );
};

export default PermissionOnClick;
