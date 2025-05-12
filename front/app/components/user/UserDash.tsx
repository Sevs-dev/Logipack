import React from "react";
import DataUsers from "./DataUsers";
import WindowManager from "../windowManager/WindowManager";
import Roles from "./CreateRoles";
import Products from "./CreateProducts";
import Factory from "./CreateFactory"
import Lista from "./CreateManufacturing"
import Clients from "./CreateClient"
import Consecutive from "./CreateConsecutive";
import PermissionCheck from "..//permissionCheck/PermissionCheck";
import Machinery from "./CreateMachinery";
import useUserData from '../../hooks/useUserData';

function User() {
  const { userName } = useUserData();

  return (
    <div>
      {/* Administrador de ventanas */}
      <WindowManager
        windowsData={[
          {
            id: 1, title: "Usuarios", component:
              <PermissionCheck requiredPermission="crear_usuarios">
                <div>

                  {/* Tabla de usuarios */}
                  <div className="overflow-x-auto">
                    <DataUsers />
                  </div>
                </div>
              </PermissionCheck>
            , isProtected: true
          },
          { id: 2, title: "Roles", component: <Roles />, isProtected: true },
          { id: 3, title: "Plantas", component: <Factory />, isProtected: true },
          { id: 4, title: "Lineas", component: <Lista />, isProtected: true },
          { id: 5, title: "Productos", component: <Products />, isProtected: true },
          { id: 6, title: "Clientes", component: <Clients />, isProtected: true },
          { id: 7, title: "Maquinaria", component: <Machinery />, isProtected: true },
          { id: 8, title: "Consecutivo", component: <Consecutive />, isProtected: true },
        ]}
      />
    </div>
  );
}

export default User;
