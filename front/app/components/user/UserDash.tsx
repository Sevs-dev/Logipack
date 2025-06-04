"use client";
import React from "react";
import WindowManager from "../windowManager/WindowManager";
import Products from "./CreateProducts";
import Factory from "./CreateFactory"
import Lista from "./CreateManufacturing"
import Clients from "./CreateClient"
import Consecutive from "./CreateConsecutive";
import Machinery from "./CreateMachinery";
import useUserData from '../../hooks/useUserData';
import CreateUser from "./CreateUser";
import PermissionWrapper from "./PermissionWrapper";
import NonePermission from "../loader/NonePermission";

function User() {
  const { userName } = useUserData();
  if (!userName) return <p>No estás logueado. Por favor, inicia sesión.</p>;
  return (
    <div>
      {/* Administrador de ventanas */}
      <WindowManager
        windowsData={[
          { id: 1, title: "Usuarios", component: <PermissionWrapper fallback={<NonePermission />}><CreateUser /></PermissionWrapper>, isProtected: true },
          { id: 2, title: "Plantas", component: <PermissionWrapper fallback={<NonePermission />}><Factory /></PermissionWrapper>, isProtected: true },
          { id: 3, title: "Productos", component: <PermissionWrapper fallback={<NonePermission />}><Products /></PermissionWrapper>, isProtected: true },
          { id: 4, title: "Lineas", component: <PermissionWrapper fallback={<NonePermission />}><Lista /></PermissionWrapper>, isProtected: true },
          { id: 5, title: "Clientes", component: <PermissionWrapper fallback={<NonePermission />}><Clients /></PermissionWrapper>, isProtected: true },
          { id: 6, title: "Maquinaria", component: <PermissionWrapper fallback={<NonePermission />}><Machinery /></PermissionWrapper>, isProtected: true },
          { id: 7, title: "Consecutivo", component: <PermissionWrapper fallback={<NonePermission />}><Consecutive /></PermissionWrapper>, isProtected: true },
        ]}
      />
    </div>
  );
}

export default User;
