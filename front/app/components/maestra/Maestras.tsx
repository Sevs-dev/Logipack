import React from "react";
import WindowManager from "../windowManager/WindowManager";
import NewMaestra from "./NewMaestra";
import NewStage from "./NewStage";
import NewActivity from "./NewActivity"; 
import useUserData from '../../hooks/useUserData';
import NewTipos from "./NewTipoAcondicionamiento";
function Maestras() {
    const { userName } = useUserData();
    if (!userName) return <p>No estás logueado. Por favor, inicia sesión.</p>;
    return (
        <div >
            <WindowManager
                windowsData={[
                    { id: 1, title: "Maestras", component:<NewMaestra />, isProtected: true },
                    { id: 2, title: "Acondicionamientos", component:<NewTipos />, isProtected: true },
                    { id: 3, title: "Fases", component:<NewStage />, isProtected: true },
                    { id: 4, title: "Actividade", component:<NewActivity />, isProtected: true },
                ]}
            />
        </div>
    )
}

export default Maestras