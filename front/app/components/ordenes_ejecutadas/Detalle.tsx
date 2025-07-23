import React from "react";
import WindowManager from "../windowManager/WindowManager";
import NewDetalle from "./NewDetalle"
import useUserData from '../../hooks/useUserData';
import PermissionWrapper from "../PermissionWrapper/PermissionWrapper";
import NonePermission from "../loader/NonePermission";

function Maestras() {
    const { userName } = useUserData();
    if (!userName) return <p>No estás logueado. Por favor, inicia sesión.</p>;
    return (
        <div >
            <WindowManager
                windowsData={[
                    { id: 1, title: "Detalle", component: <PermissionWrapper fallback={<NonePermission />}><NewDetalle /></PermissionWrapper>, isProtected: true },
                ]}
            />
        </div>
    )
}

export default Maestras