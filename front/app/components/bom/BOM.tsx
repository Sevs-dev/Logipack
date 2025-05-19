import React from "react";
import WindowManager from "../windowManager/WindowManager";
import NewBOM from './NewBOM';
import useUserData from '../../hooks/useUserData';

function BOM() {
    const { userName } = useUserData();
    if (!userName) return <p>No estás logueado. Por favor, inicia sesión.</p>;
    return (
        <div>
            <WindowManager
                windowsData={[
                    { id: 1, title: "BOM", component: <NewBOM />, isProtected: true },
                ]}
            />
        </div>
    )
}

export default BOM