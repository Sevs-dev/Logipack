"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { post, getRole } from "../../services/authservices";

function CreateUser() {
  const { isAuthenticated } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  interface Role {
    id: number;
    name: string;
  }
  const [roles, setRoles] = useState<Role[]>([]);

  // Obtener los roles desde el backend cuando el componente se monta
  // Actualiza tu `useEffect` para usar el servicio getRole con Axios
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const data = await getRole();  // Usamos el servicio getRole
        setRoles(data); // Suponiendo que la respuesta tiene la forma [{ id, name }, ...]
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };

    fetchRoles();
  }, []);

  const handleCreateUser = async () => {
    setLoading(true);
    try {
      await post({
        name,
        email,
        password,
        role,
      });
      alert("Usuario creado exitosamente");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creando usuario:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-green-500 text-white p-2 rounded"
      >
        Crear Usuario
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h1 className="text-2xl font-bold mb-4">Crear Usuario</h1>
            <form>
              <input
                type="text"
                placeholder="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border p-2 mb-2 w-full"
              />
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border p-2 mb-2 w-full"
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border p-2 mb-2 w-full"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="border p-2 mb-2 w-full"
              >
                <option value="">Seleccionar rol</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleCreateUser}
                disabled={loading}
                className="bg-blue-500 text-white p-2 rounded w-full"
              >
                {loading ? "Creando..." : "Crear Usuario"}
              </button>
            </form>
            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-4 text-red-500"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateUser;
