import React, { useState, useEffect } from "react";

interface Window {
    id: number;
    title: string;
    content?: string;
    component?: React.ReactNode;
    isProtected?: boolean;
}

interface WindowManagerProps {
    windowsData?: Window[];
}

const WindowManager: React.FC<WindowManagerProps> = ({ windowsData = [] }) => {
    const [windows, setWindows] = useState<Window[]>(windowsData);
    const [activeWindow, setActiveWindow] = useState<number | null>(windowsData.length > 0 ? windowsData[0].id : null);

    useEffect(() => {
        if (windowsData.length > 0) {
            setActiveWindow(windowsData[0].id);
        }
    }, [windowsData]);

    const closeWindow = (id: number) => {
        const windowToClose = windows.find(win => win.id === id);
        if (windowToClose?.isProtected) return;

        setWindows(windows.filter(win => win.id !== id));
        if (activeWindow === id) {
            setActiveWindow(windows.length > 1 ? windows.find(win => win.id !== id)?.id || null : null);
        }
    };

    return (
        <div className="relative max-h-[94vh] h-screen flex flex-col bg-gray-900 rounded-lg text-white overflow-hidden">
            {/* Barra de Ventanas */}
            <div className="flex flex-wrap gap-2 p-2 bg-gray-800 rounded-lg shadow-md">
                {windows.map(win => (
                    <button
                        key={win.id}
                        className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 font-medium text-sm md:text-base
                        ${activeWindow === win.id ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-200 hover:bg-gray-600"}`}
                        onClick={() => setActiveWindow(win.id)}
                    >
                        {win.title}
                        {!win.isProtected && (
                            <span
                                className="text-red-400 hover:text-red-300 transition-all cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
                            >
                                ✖
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Contenido de la Ventana Activa con Scroll Interno */}
            {activeWindow !== null && (
                <div
                    className="flex-grow bg-gray-700 mt-2 rounded-lg shadow-lg border border-gray-600 
                    animate-fadeIn transition-all w-full max-h-full overflow-auto flex"
                >
                    <div className="w-full h-full overflow-auto p-2 md:p-6"
                        style={{
                            scrollbarWidth: "thin",
                            scrollbarColor: "#fff #2d3748",
                        }}>
                        {windows.find(win => win.id === activeWindow)?.content}
                        {windows.find(win => win.id === activeWindow)?.component}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WindowManager;
