import React, { useState, useEffect } from "react";
import CreateUser from "./CreateUser";
import DataUsers from "./DataUsers";
import WindowManager from "../windowManager/WindowManager";
import Roles from "../roles/Roles";
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
    <div>
      {/* Administrador de ventanas */}
      <WindowManager
        windowsData={[
          {
            id: 1, title: "Panel de Administración", component:
              <div>
                {/* Botón arriba y tabla abajo */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                  <CreateUser />
                </div>

                {/* Tabla de usuarios */}
                <div className="overflow-x-auto">
                  <DataUsers />
                </div>
              </div>
            , isProtected: true
          },
          { id: 2, title: "Roles", component: <Roles />, isProtected: true },
        ]}
      />
    </div>
  );
}

export default User;
