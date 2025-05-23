"use client";
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
import CreateUser from "./CreateUser";

function User() {
  const { userName } = useUserData();
  if (!userName) return <p>No estás logueado. Por favor, inicia sesión.</p>;
  return (
    <div>
      {/* Administrador de ventanas */}
      <WindowManager
        windowsData={[
          { id: 1, title: "Usuarios", component: <CreateUser />, isProtected: true },
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
