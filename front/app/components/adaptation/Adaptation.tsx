import React from "react";
import WindowManager from "../windowManager/WindowManager";
import NewAdaptation from "./NewAdaptation";
import useUserData from "../../hooks/useUserData";
import PermissionWrapper from "../PermissionWrapper/PermissionWrapper";
import NonePermission from "../loader/NonePermission";
// import EditPlanning from "../planning/EditPlanning";

function Adaptation() {
    const { userName } = useUserData();
    if (!userName) return <p>No estás logueado. Por favor, inicia sesión.</p>;
    return (
        <WindowManager
            windowsData={[
                { id: 1, title: "Ordenes de Acondicionamiento", component: <PermissionWrapper fallback={<NonePermission />} allowedRoles={["Administrador", "J_Calidad", "Calidad"]}><NewAdaptation /></PermissionWrapper>, isProtected: true },
                // { id: 2, title: "Gestión de Ordenes", component: <PermissionWrapper fallback={<NonePermission />}><EditPlanning /></PermissionWrapper>, isProtected: true },
            ]}
        />
    )
}

export default Adaptation