"use client";
import React, { useEffect, useState, cloneElement, ReactElement, isValidElement } from "react";
import { useAuth } from "../../context/AuthProvider";
import { getPermissionRole } from "../../services/userDash/roleServices";
import Loader from "../loader/Loader";

type PermissionCheckProps = {
  children: ReactElement<{ readOnly?: boolean; disabled?: boolean }>;
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

  if (loading || !fetched) return <Loader />;

  if (hasPermission) return children;

  if (isValidElement(children)) {
    return cloneElement(children, { readOnly: true, disabled: true });
  }

  return null;
};

export default PermissionInputs;
