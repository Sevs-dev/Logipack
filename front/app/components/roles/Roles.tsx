"use client";
import { useState, useEffect } from "react";
import { getPermissions, updateRolePermissions } from "../../services/roleServices";

// 🛠️ Definición de Interfaces
interface Permission {
  id: number;
  name: string;
  description: string;
  status: number;
}

type RoleType = {
  id: number;
  name: string;
  permissions: { id: number; name: string; description: string }[];
};

const Roles = () => {
  const [roles, setRoles] = useState<RoleType[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  // 🛠️ Cargar Roles y Permisos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getPermissions();

        if (response && typeof response === "object") {
          setRoles(Array.isArray(response.roles) ? response.roles : []);
          setPermissions(Array.isArray(response.permissions) ? response.permissions : []);
        } else {
          setRoles([]);
          setPermissions([]);
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
        setRoles([]);
        setPermissions([]);
      }
    };

    fetchData();
  }, []);

  // 🛠️ Manejar actualización de permisos
  const handlePermissionToggle = async (roleId: number, permissionId: number, checked: boolean) => {
    const updatedRoles = roles.map((role) => {
      if (role.id === roleId) {
        const updatedPermissions = checked
          ? [...role.permissions, { id: permissionId, name: "", description: "" }]
          : role.permissions.filter((perm) => perm.id !== permissionId);
        return { ...role, permissions: updatedPermissions };
      }
      return role;
    });

    setRoles(updatedRoles);

    try {
      const permissionIds = updatedRoles.find((r) => r.id === roleId)?.permissions.map((p) => p.id) || [];
      await updateRolePermissions(roleId, permissionIds);
    } catch (error) {
      console.error("Error actualizando permisos:", error);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full bg-gray-700 shadow-md rounded-lg border border-gray-200">
        <thead>
          <tr className="bg-gray-900 text-white">
            <th className="p-2 text-left text-sm text-gray-300">Permiso</th>
            {roles.map((role) => (
              <th key={role.id} className="p-2 text-center text-sm capitalize">
                {role.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {permissions.map((permission, index) => (
            <tr key={permission.id} className={`${index % 2 === 0 ? "bg-gray-600" : "bg-gray-800"} text-gray-300 border-b`}>
              <td className="p-2 text-gray-300 text-sm">{permission.description}</td>
              {roles.map((role) => (
                <td key={`${role.id}-${permission.id}`} className="text-center">
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-blue-500 cursor-pointer"
                    checked={role.permissions.some((p) => p.name === permission.name)}
                    onChange={(e) => handlePermissionToggle(role.id, permission.id, e.target.checked)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Roles;
