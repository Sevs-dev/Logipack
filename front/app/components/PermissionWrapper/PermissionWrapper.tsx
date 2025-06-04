import React, { ReactElement, cloneElement } from 'react';
import nookies from 'nookies';

interface PermissionWrapperProps {
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

const PermissionWrapper: React.FC<PermissionWrapperProps> = ({ fallback = null, children }) => {
  const cookies = nookies.get();
  const role = cookies.role || 'Visitante';

  const { canEdit, canView } = rolePermissions[role] || { canEdit: false, canView: false };

  if (!canView) {
    return (
      <div
        style={{
          width: '100%',
          maxWidth: '1190px',
          height: 'auto',
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


  return cloneElement(children, { canEdit, canView });
};

export default PermissionWrapper;
