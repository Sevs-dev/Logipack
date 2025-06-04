import React, { ReactElement, cloneElement } from 'react';
import nookies from 'nookies';

interface PermissionWrapperProps {
  allowedRoles?: string[]; // Roles permitidos explícitamente
  fallback?: React.ReactNode | (() => React.ReactNode);
  children: ReactElement<{ canEdit?: boolean; canView?: boolean }>;
}

const rolePermissions: Record<string, { canEdit: boolean; canView: boolean }> = {
  Administrador: { canEdit: true, canView: true },
  J_Calidad: { canEdit: true, canView: true },
  Calidad: { canEdit: true, canView: true },
  Operativo: { canEdit: false, canView: true },
  Coordinador: { canEdit: false, canView: true },
  Consulta: { canEdit: false, canView: true },
  Visitante: { canEdit: false, canView: false },
};

const PermissionWrapper: React.FC<PermissionWrapperProps> = ({
  allowedRoles,
  fallback = <p>No tienes permiso para ver este contenido.</p>,
  children,
}) => {
  const cookies = nookies.get();
  const role = cookies.role || 'Visitante';

  const permissions = rolePermissions[role] || { canEdit: false, canView: false };

  // Verificación de roles explícitamente permitidos
  const isAllowedRole = !allowedRoles || allowedRoles.includes(role);

  if (!isAllowedRole || !permissions.canView) {
    return (
      <div
        style={{
          width: '100%',
          maxWidth: '1190px',
          minHeight: '50px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1rem',
          boxSizing: 'border-box',
          margin: '0 auto',
        }}
      >
        {typeof fallback === 'function' ? fallback() : fallback}
      </div>
    );
  }

  return cloneElement(children, {
    canEdit: permissions.canEdit,
    canView: permissions.canView,
  });
};

export default PermissionWrapper;
