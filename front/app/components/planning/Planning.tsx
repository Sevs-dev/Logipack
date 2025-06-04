import React from "react";
import WindowManager from "../windowManager/WindowManager";
import EditPlanning from "./EditPlanning";
import useUserData from "../../hooks/useUserData";
import PermissionWrapper from "../PermissionWrapper/PermissionWrapper";
import NonePermission from "../loader/NonePermission";

function Planificacion() {
  const { userName } = useUserData();
  if (!userName) return <p>No estás logueado. Por favor, inicia sesión.</p>;
  return (
    <WindowManager
      windowsData={[
        { id: 1, title: "Planificación", component: <PermissionWrapper fallback={<NonePermission />}><EditPlanning /></PermissionWrapper>, isProtected: true },
      ]}
    />
  )
}

export default Planificacion