import React from "react";
import WindowManager from "../windowManager/WindowManager";
import NewTestigos from "../ordenes_ejecutadas/NewTestigos";
import useUserData from '../../hooks/useUserData';
import PermissionWrapper from "../PermissionWrapper/PermissionWrapper";
import NonePermission from "../loader/NonePermission";

function Testigos() {
    const { userName } = useUserData();
    if (!userName) return <p>No estás logueado. Por favor, inicia sesión.</p>;
    return (
        <div >
            <WindowManager
                windowsData={[
                    { id: 1, title: "testigo", component: <PermissionWrapper 
                        fallback={<NonePermission />}><NewTestigos /></PermissionWrapper>, isProtected: true },
                ]}
            />
        </div>
    )
}

export default Testigos