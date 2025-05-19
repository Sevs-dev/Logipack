"use client";
import { useState, useEffect } from "react";
import { getPermissions, updateRolePermissions, createPermission, deletePermission, getPermissionId, updatePermission } from "../../services/userDash/roleServices";
import { getRole, getRoleId, createRole, updateRole, deleteRole } from "../../services/userDash/rolesServices";
import { motion } from "framer-motion";
import { showSuccess, showError, showConfirm } from "../toastr/Toaster";
import PermissionCheck from "..//permissionCheck/PermissionCheck";
import Button from "../buttons/buttons"

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
  permissions: Permission[];
};

const Roles = () => {
  const [roles, setRoles] = useState<RoleType[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [status, setStatus] = useState<number>(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  // Estados para el modal de Roles
  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(false);
  const [roleName, setRoleName] = useState<string>('');
  const [rolePermissions, setRolePermissions] = useState<number[]>([]);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [hoveredRole, setHoveredRole] = useState<number | null>(null);
  let hideTimeout: NodeJS.Timeout;

  // Función para reiniciar el formulario del modal de roles
  const resetRoleModal = () => {
    setRoleName('');
    setRolePermissions([]);
    setEditingRoleId(null);
  };

  // Función asíncrona para obtener y configurar los datos de permisos y roles
  const fetchData = async () => {
    try {
      // Llama a la función que obtiene los permisos (y roles) desde el backend
      const response = await getPermissions();

      // Verifica que la respuesta sea un objeto válido
      if (response && typeof response === "object") {
        // Actualiza el estado de roles: si response.roles es un array, se utiliza, de lo contrario se asigna un array vacío
        setRoles(Array.isArray(response.roles) ? response.roles : []);
        // Actualiza el estado de permisos: si response.permissions es un array, se utiliza, de lo contrario se asigna un array vacío
        setPermissions(Array.isArray(response.permissions) ? response.permissions : []);
      } else {
        // Si la respuesta no es válida, se asignan arrays vacíos a roles y permisos
        setRoles([]);
        setPermissions([]);
      }
    } catch (error) {
      // Captura y muestra en consola cualquier error durante la obtención de datos
      console.error("Error cargando datos:", error);
      // En caso de error, asigna arrays vacíos a roles y permisos
      setRoles([]);
      setPermissions([]);
    }
  };

  const fetcRole = async () => {
    try {
      const role = await getRole();
    } catch (error) {

    }
  }

  // useEffect para cargar los datos una vez al montar el componente
  useEffect(() => {
    fetchData();
  }, []);

  // 🛠️ Función para manejar la actualización de permisos en un rol
  const handlePermissionToggle = async (roleId: number, permissionId: number, checked: boolean) => {
    // Crea una nueva lista de roles actualizando solo el rol que coincide con roleId
    const updatedRoles = roles.map((role) => {
      if (role.id === roleId) {
        // Si el checkbox está activado, se agrega el permiso; de lo contrario, se elimina el permiso
        const updatedPermissions = checked
          ? [
            ...role.permissions,
            // Se agrega el permiso completo obtenido del estado "permissions"
            permissions.find((perm) => perm.id === permissionId)!
          ]
          : role.permissions.filter((perm) => perm.id !== permissionId);

        // Retorna el rol actualizado con la nueva lista de permisos
        return { ...role, permissions: updatedPermissions };
      }
      // Retorna el rol sin modificaciones si no coincide con roleId
      return role;
    });

    // Actualiza el estado de roles con la lista modificada
    setRoles(updatedRoles);

    try {
      // Envía la actualización al backend (puede enviar solo el permissionId o el array completo, según lo necesite tu endpoint)
      await updateRolePermissions(roleId, permissionId);
    } catch (error) {
      // Muestra en consola cualquier error al actualizar permisos
      console.error("Error actualizando permisos:", error);
    }
  };

  // Función para crear un nuevo permiso
  const handleSave = async (name: string, description: string, status: number) => {
    try {
      // Llama a la función para crear el permiso en el backend
      await createPermission(name, description, status);
      // Recarga los datos para reflejar el nuevo permiso en la interfaz
      await fetchData(); // 🔄 Recargar datos después de crear
      // Muestra un mensaje de éxito al usuario
      showSuccess('Permiso creado correctamenete');
    } catch (error) {
      // Muestra en consola el error y notifica al usuario en caso de fallo
      console.error("Error creando permiso:", error);
      showError("Hubo un error al crear el permiso");
    }
    // Cierra el modal una vez finalizada la operación
    setIsModalOpen(false);
  };

  // Función para actualizar un permiso existente
  const handleUpdate = async (id: number) => {
    try {
      // Prepara el objeto de datos a enviar al backend con los valores actuales
      const data = { name, description, status };
      // Llama a la función que actualiza el permiso en el backend
      await updatePermission(id, data);
      // Recarga los datos para actualizar la interfaz con los cambios realizados
      await fetchData();
      // Notifica al usuario que la actualización fue exitosa
      showSuccess('Permiso actualizado correctamenete');
    } catch (error) {
      // En caso de error, lo muestra en consola
      console.error("Error al actualizar cliente:", error);
    }
  };

  // Función para eliminar un permiso
  const handleDelete = async (id: number) => {
    // Muestra una confirmación al usuario antes de proceder a eliminar el permiso
    showConfirm("¿Estás seguro de eliminar este permiso?", async () => {
      try {
        // Llama a la función para eliminar el permiso en el backend
        await deletePermission(id);
        // Actualiza el estado de permisos eliminando el permiso borrado
        setPermissions(permissions.filter((perm) => perm.id !== id));
        // Informa al usuario que el permiso fue eliminado correctamente
        showSuccess("Permiso eliminado correctamente");
      } catch (error) {
        // Muestra en consola el error y notifica al usuario en caso de fallo
        console.error("Error eliminando permiso:", error);
        showError("Hubo un error al eliminar el permiso");
      }
    });
  };

  // Función para editar un permiso existente
  const handleEdit = async (id: number) => {
    try {
      // Obtiene los datos del permiso mediante su ID desde el backend
      const permiso = await getPermissionId(id);
      if (permiso) {
        // Actualiza los estados locales con los datos del permiso para poder editarlos
        setName(permiso.name);
        setDescription(permiso.description);
        setStatus(permiso.status);
        setEditingId(id);
      }
      // Abre el modal para mostrar el formulario de edición
      setIsModalOpen(true);
    } catch (error) {
      // Muestra en consola cualquier error al obtener los datos del permiso
      console.error("Error al obtener datos del cliente:", error);
    }
  };

  // Guarda un rol nuevo
  const handleSaveRole = async () => {
    try {
      console.log("Enviando rol:", { name: roleName });
      await createRole({ name: roleName });
      showSuccess("Rol creado correctamente");
      await fetchData();
    } catch (error: unknown) {
      console.error("Error al crear rol:", error);
      // Si el error tiene una propiedad response, puedes acceder a los datos del error
      showError("Error al crear rol");
    } finally {
      resetRoleModal();
      setIsRoleModalOpen(false);
    }
  };

  // Actualiza un rol existente
  const handleUpdateRole = async () => {
    if (editingRoleId) {
      try {
        await updateRole(editingRoleId, { name: roleName });
        showSuccess("Rol actualizado correctamente");
        await fetchData();
      } catch (error) {
        console.error("Error al actualizar rol:", error);
        showError("Error al actualizar rol");
      }
    }
    resetRoleModal();
    setIsRoleModalOpen(false);
  };

  // Abre el modal de rol con la información para editarlo
  const handleEditRole = async (roleId: number) => {
    try {
      // Si cuentas con un endpoint para obtener un rol por ID:
      const roleData = await getRoleId(roleId);
      if (roleData) {
        setRoleName(roleData.name);
        setEditingRoleId(roleId);
        setIsRoleModalOpen(true);
      }
    } catch (error) {
      console.error("Error al obtener datos del rol:", error);
      showError("Error al obtener datos del rol");
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    // Muestra una confirmación al usuario antes de proceder a eliminar el rol
    showConfirm("¿Estás seguro de eliminar este rol?", async () => {
      try {
        // Llama a la función para eliminar el rol en el backend
        await deleteRole(roleId);
        // Actualiza el estado de roles eliminando el rol borrado
        setRoles(roles.filter((role) => role.id !== roleId));
        // Informa al usuario que el rol fue eliminado correctamente
        showSuccess("Rol eliminado correctamente");
      } catch (error) {
        // Muestra en consola el error y notifica al usuario en caso de fallo
        console.error("Error eliminando rol:", error);
        showError("Hubo un error al eliminar el rol");
      }
    });
  };


  return (
    <div className="overflow-x-auto">

      <div className="flex justify-center space-x-2 mb-2">
        <PermissionCheck requiredPermission="crear_permiso">
          <Button onClick={() => {
            setName('');
            setDescription('');
            setStatus(0);
            setEditingId(null);
            setIsModalOpen(true);
          }} variant="create" label="Crear Permiso" />
        </PermissionCheck>
        <PermissionCheck requiredPermission="crear_roles">
          <Button onClick={() => {
            resetRoleModal();
            setIsRoleModalOpen(true);
          }} variant="create" label="Crear Roles" />
        </PermissionCheck>
      </div>
      {/*Modal Permisos*/}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white p-6 rounded shadow-lg w-96"
          >
            <h2 className="text-lg font-bold text-center text-black mb-4">
              Crear Permiso
            </h2>
            <input
              type="text"
              placeholder="Nombre"
              className="w-full border p-2 rounded mb-2 text-black"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <input
              type="text"
              placeholder="Descripción"
              className="w-full border p-2 rounded mb-2 text-black"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <select
              className="w-full border p-2 rounded mb-4 text-black"
              value={status}
              onChange={(e) => setStatus(Number(e.target.value))}
            >
              <option value={0}>Inactivo</option>
              <option value={1}>Activo</option>
            </select>
            <div className="flex justify-center space-x-2">
              <Button onClick={() => setIsModalOpen(false)} variant="cancel" />
              <Button onClick={() => { editingId ? handleUpdate(editingId) : handleSave(name, description, status) }} variant="save" />
            </div>
          </motion.div>
        </div>
      )}

      {/*Modal Role*/}
      {isRoleModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white p-6 rounded shadow-lg w-96"
          >
            <h2 className="text-lg font-bold text-center text-black mb-4">
              {editingRoleId ? "Editar Rol" : "Crear Rol"}
            </h2>
            <input
              type="text"
              placeholder="Nombre del rol"
              className="w-full border p-2 rounded mb-2 text-black"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
            />
            <div className="flex justify-center space-x-2">
              <Button onClick={() => {
                resetRoleModal();
                setIsRoleModalOpen(false);
              }} variant="cancel" />
              <Button onClick={() => { editingRoleId ? handleUpdateRole() : handleSaveRole() }} variant="save" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Contenedor de la tabla con scroll vertical */}
      <div
        className="w-full overflow-auto custom-scroll"
        style={{ maxHeight: '400px' }}
      >
        {/* Estilos para el scroll */}
        <style jsx>{`
          .custom-scroll::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          .custom-scroll::-webkit-scrollbar-track {
            background: #242424; /* Fondo similar al de tu contenedor */
            border-radius: 4px;
          }
          .custom-scroll::-webkit-scrollbar-thumb {
            background-color: #555; /* Color del thumb */
            border-radius: 4px;
            border: 2px solid #242424; /* Crea un efecto de separación */
          }
          .custom-scroll::-webkit-scrollbar-thumb:hover {
            background-color: #777;
          }
          /* Firefox */
          .custom-scroll {
            scrollbar-width: thin;
            scrollbar-color: #555 #242424;
          }
        `}</style>

        <table className="w-full bg-gray-700 shadow-md rounded-lg border border-gray-200 table-auto">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-900 text-white">
              <th className="p-2 text-left text-xs sm:text-sm text-gray-300">
                Permiso
              </th>
              {roles.map((role) => (
                <th
                  key={role.id}
                  className="p-2 text-center text-xs sm:text-sm capitalize relative"
                >
                  <div
                    className="flex flex-col items-center"
                    onMouseEnter={() => {
                      clearTimeout(hideTimeout);
                      setHoveredRole(role.id);
                    }}
                    onMouseLeave={() => {
                      hideTimeout = setTimeout(() => setHoveredRole(null), 300);
                    }}
                  >
                    <span className="cursor-pointer truncate max-w-[80px] sm:max-w-none">
                      {role.name}
                    </span>
                  </div>
                  {hoveredRole === role.id && (
                    <div
                      className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2"
                      onMouseEnter={() => clearTimeout(hideTimeout)}
                      onMouseLeave={() => setHoveredRole(null)}
                    >
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -10 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="bg-white shadow-lg rounded-lg p-2 flex space-x-2 border border-gray-200"
                      >
                        <Button onClick={() => handleEditRole(role.id)} variant="edit" />
                        <Button onClick={() => handleDeleteRole(role.id)} variant="delete" />
                      </motion.div>
                    </div>
                  )}
                </th>
              ))}
              <th className="p-2 text-center text-xs sm:text-sm text-gray-300">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((permission, index) => (
              <tr
                key={permission.id}
                className={`${index % 2 === 0 ? "bg-gray-600" : "bg-gray-800"
                  } text-gray-300 border-b`}
              >
                <td className="p-2 text-xs sm:text-sm">{permission.description}</td>
                {roles.map((role) => (
                  <td key={`${role.id}-${permission.id}`} className="text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 sm:w-5 sm:h-5 accent-blue-500 cursor-pointer"
                      checked={role.permissions.some((p) => p.id === permission.id)}
                      onChange={(e) =>
                        handlePermissionToggle(role.id, permission.id, e.target.checked)
                      }
                    />
                  </td>
                ))}
                <td className="px-4 py-2 sm:px-6 sm:py-3 flex justify-center gap-2 sm:gap-3">
                  <Button onClick={() => handleEdit(permission.id)} variant="edit" />
                  <Button onClick={() => handleDelete(permission.id)} variant="delete" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default Roles;
