import React from "react";
import WindowManager from "../windowManager/WindowManager";
import NewAdaptation from "./NewAdaptation";
import useUserData from "../../hooks/useUserData";
import PermissionWrapper from "../PermissionWrapper/PermissionWrapper";
import NonePermission from "../loader/NonePermission";

function Adaptation() {
    const { userName } = useUserData();
    if (!userName) return <p>No estás logueado. Por favor, inicia sesión.</p>;
    return (
        <WindowManager
            windowsData={[
                { id: 1, title: "Ordenes de Acondicionamiento", component: <PermissionWrapper fallback={<NonePermission />} allowedRoles={["J_Calidad", "Calidad"]}><NewAdaptation /></PermissionWrapper>, isProtected: true },
            ]}
        />
    )
}

export default Adaptation