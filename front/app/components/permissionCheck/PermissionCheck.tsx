import React, {
  useEffect,
  useState,
  cloneElement,
  ReactElement,
  isValidElement,
} from "react";
import { useAuth } from "../../context/AuthContext";
import { getPermissionRole } from "../../services/userDash/roleServices";
import Loader from "../loader/Loader";

type PermissionCheckProps = {
  children: ReactElement<{ readOnly?: boolean; disabled?: boolean }>;
  requiredPermission: string;
};

interface PermissionRoleResponse {
  permissions: string[];
}

// Cache simple para permisos
const permissionCache: Record<string, string[]> = {};

const PermissionInputs = ({ children, requiredPermission }: PermissionCheckProps) => {
  const { role, loading } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!loading && role) {
      if (permissionCache[role]) {
        setHasPermission(permissionCache[role].includes(requiredPermission));
        setFetched(true);
      } else {
        getPermissionRole(role)
          .then((data: PermissionRoleResponse) => {
            permissionCache[role] = data.permissions;
            setHasPermission(data.permissions.includes(requiredPermission));
          })
          .catch((error) => {
            console.error("Error en getPermissionRole:", error);
          })
          .finally(() => {
            setFetched(true);
          });
      }
    }
  }, [loading, role, requiredPermission]);

  if (loading || !fetched) return <Loader />;

  // Si tiene permiso, renderizamos el componente como está
  if (hasPermission) return children;

  // Si no tiene permiso, clonamos el elemento agregando los props
  if (isValidElement(children)) {
    return cloneElement(children, {
      readOnly: true,
      disabled: true,
    });
  }

  return null;
};

export default PermissionInputs;
