import React, { useState, useEffect } from "react";
import CreateUser from "./CreateUser";
import DataUsers from "./DataUsers";
import { useAuth } from "../../hooks/useAuth";
import { getUserByEmail } from "../../services/authservices";
import nookies from "nookies";

function User() {
  const { isAuthenticated } = useAuth();
  const [userName, setUserName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const cookies = nookies.get(null);
        const email = cookies.email;
        if (email) {
          const decodedEmail = decodeURIComponent(email);
          const user = await getUserByEmail(decodedEmail);
          if (user.usuario) {
            setUserName(user.usuario.name);
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setError("No se pudo obtener la información del usuario.");
      }
    };

    if (isAuthenticated) fetchUserData();
  }, [isAuthenticated]);

  return (
    <div className="container mx-auto p-6">
      {/* Título */}
      <h1 className="text-3xl font-bold text-gray-800 text-center">Panel de Administración</h1>
      {userName && <h2 className="text-lg text-gray-600 text-center mt-2">Bienvenido, <span className="font-semibold">{userName}</span></h2>}
      {error && <p className="text-red-500 text-center mt-2">{error}</p>}

      {/* Sección principal */}
      <div className="bg-white shadow-lg rounded-lg p-6 mt-6">
        {/* Botón arriba y tabla abajo */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <CreateUser />
        </div>

        {/* Tabla de usuarios */}
        <div className="overflow-x-auto">
          <DataUsers />
        </div>
      </div>
    </div>
  );
}

export default User;
