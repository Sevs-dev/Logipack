"use client";
import React, { useEffect, useState, cloneElement, ReactElement } from "react";
import { useAuth } from "../../context/AuthContext";
import { getPermissionRole } from "../../services/userDash/roleServices";
import Loader from "../loader/Loader";

type PermissionCheckProps = {
  children: ReactElement; // solo un hijo React
  requiredPermission: string;
};

interface PermissionRoleResponse {
  permissions: string[];
}

const PermissionInputs = ({ children, requiredPermission }: PermissionCheckProps) => {
  const { role, loading } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!loading && role) {
        try {
          const data: PermissionRoleResponse = await getPermissionRole(role);
          setHasPermission(data.permissions?.includes(requiredPermission) ?? false);
        } catch (error) {
          console.error("Error en getPermissionRole:", error);
          setHasPermission(false);
        } finally {
          setFetched(true);
        }
      }
    };

    fetchPermissions();
  }, [loading, role, requiredPermission]);

  if (loading || !fetched) return <Loader />;

  if (hasPermission) return children;

  // Nota: solo funcionará para componentes que acepten estas props
  return cloneElement(children, { readOnly: true, disabled: true });
};

export default PermissionInputs;
