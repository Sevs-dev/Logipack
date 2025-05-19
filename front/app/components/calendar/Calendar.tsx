import React from "react";
import WindowManager from "../windowManager/WindowManager";
import Gantt from "./CalendarGantt";
import useUserData from '../../hooks/useUserData';

function Calendar() {
    const { userName } = useUserData();
    if (!userName) return <p>No estás logueado. Por favor, inicia sesión.</p>;
    return (
        <div >
            <WindowManager
                windowsData={[
                    { id: 1, title: "Calendario", component:<Gantt />, isProtected: true }, 
                ]}
            />
        </div>
    )
}

export default Calendar