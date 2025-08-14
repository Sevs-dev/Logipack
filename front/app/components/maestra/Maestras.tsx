import React from "react";
import WindowManager from "../windowManager/WindowManager";
import NewMaestra from "./NewMaestra";
import NewStage from "./NewStage";
import NewActivity from "./NewActivity";
import useUserData from '../../hooks/useUserData';
import NewTipos from "./NewTipoAcondicionamiento";
import PermissionWrapper from "../PermissionWrapper/PermissionWrapper";
import NonePermission from "../loader/MiniLoader";
import DateLoader from '@/app/components/loader/DateLoader';

function Maestras() {
    const { userName } = useUserData();
    if (!userName) {
        return (
            <DateLoader message="No estás logueado. Por favor, inicia sesión." backgroundColor="#242424" color="#ffff" />
        );
    }
    <DateLoader message="Generando PDF..." backgroundColor="#242424" color="#ffff" />
    return (
        <div >
            <WindowManager
                windowsData={[
                    { id: 1, title: "Maestras", component: <PermissionWrapper fallback={<NonePermission />}><NewMaestra /></PermissionWrapper>, isProtected: true },
                    { id: 2, title: "T. Acondicionamientos", component: <PermissionWrapper fallback={<NonePermission />}><NewTipos /></PermissionWrapper>, isProtected: true },
                    { id: 3, title: "Fases", component: <PermissionWrapper fallback={<NonePermission />}><NewStage /></PermissionWrapper>, isProtected: true },
                    { id: 4, title: "Actividades", component: <PermissionWrapper fallback={<NonePermission />}><NewActivity /></PermissionWrapper>, isProtected: true },
                ]}
            />
        </div>
    )
}

export default Maestras