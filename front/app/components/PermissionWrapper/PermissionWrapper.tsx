import React, { ReactElement, cloneElement, useEffect, useState } from "react";
import nookies from "nookies";
import { getRole } from "../../services/userDash/rolesServices";

interface PermissionWrapperProps {
  allowedRoles?: string[]; // Roles permitidos explícitamente
  fallback?: React.ReactNode | (() => React.ReactNode);
  children: ReactElement<{ canEdit?: boolean; canView?: boolean }>;
}

type RoleFromApi = {
  name?: string;
  can_edit?: boolean;
  can_view?: boolean;
  active?: boolean;
  version?: number | string;
};

const DEFAULT_PERMISSIONS = { canEdit: false, canView: false };

// ---- Type guards ----
const isRole = (x: unknown): x is RoleFromApi =>
  !!x && typeof x === "object" && "name" in (x as Record<string, unknown>);

const isRoleArray = (x: unknown): x is RoleFromApi[] =>
  Array.isArray(x) && x.every(isRole);

const isWrappedRole = (x: unknown): x is { data: RoleFromApi } =>
  !!x &&
  typeof x === "object" &&
  "data" in (x as Record<string, unknown>) &&
  isRole((x as { data: unknown }).data);

const PermissionWrapper: React.FC<PermissionWrapperProps> = ({
  allowedRoles,
  fallback = <p>No tienes permiso para ver este contenido.</p>,
  children,
}) => {
  const cookies = nookies.get();
  const role = (cookies.role || "Visitante").trim();

  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<{ canEdit: boolean; canView: boolean }>(
    DEFAULT_PERMISSIONS
  );

  useEffect(() => {
    let alive = true;
    const fetchPermissions = async () => {
      try {
        // ✅ FIX: getRole NO recibe argumentos
        const raw: unknown = await getRole();
        const normalize = (input: unknown): RoleFromApi | null => {
          if (isWrappedRole(input)) return input.data;
          if (isRole(input)) return input;
          if (isRoleArray(input)) {
            const candidates = input.filter(
              (r) => (r.name?.toLowerCase() || "") === role.toLowerCase()
            );
            if (candidates.length === 0) return null;
            const active =
              candidates.find((r) => r.active) ||
              candidates
                .slice()
                .sort(
                  (a, b) => (Number(b.version) || 0) - (Number(a.version) || 0)
                )[0];
            return active ?? null;
          }
          return null;
        };
        const roleObj = normalize(raw);
        let computed = {
          canEdit: Boolean(roleObj?.can_edit),
          canView: Boolean(roleObj?.can_view),
        };
        // 🔓 Override: Master y Administrador siempre full acceso
        if (["master", "administrador"].includes(role.toLowerCase())) {
          computed = { canEdit: true, canView: true };
        }
        if (alive) {
          setPermissions(computed);
          setLoading(false);
        }
      } catch {
        const fallbackPerms = ["master", "administrador"].includes(role.toLowerCase())
          ? { canEdit: true, canView: true }
          : DEFAULT_PERMISSIONS;
        if (alive) {
          setPermissions(fallbackPerms);
          setLoading(false);
        }
      }
    };

    fetchPermissions();
    return () => {
      alive = false;
    };
  }, [role]);

  // Verificación de roles explícitamente permitidos
  const isAllowedRole =
    !allowedRoles || allowedRoles.some((r) => r.toLowerCase() === role.toLowerCase());

  // Mientras carga, muestra el fallback “suave”
  if (loading) {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: "1190px",
          minHeight: "50px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "1rem",
          boxSizing: "border-box",
          margin: "0 auto",
          opacity: 0.8,
        }}
      >
        {typeof fallback === "function" ? fallback() : fallback}
      </div>
    );
  }

  if (!isAllowedRole || !permissions.canView) {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: "1190px",
          minHeight: "50px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "1rem",
          boxSizing: "border-box",
          margin: "0 auto",
        }}
      >
        {typeof fallback === "function" ? fallback() : fallback}
      </div>
    );
  }

  return cloneElement(children, {
    canEdit: permissions.canEdit,
    canView: permissions.canView,
  });
};

export default PermissionWrapper;
