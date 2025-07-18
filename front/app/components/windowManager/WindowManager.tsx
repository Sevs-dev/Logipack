import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "../loader/Loader";
import { Menu } from "lucide-react";

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
    const cacheRef = useRef<Window[]>([]);
    const [windows, setWindows] = useState<Window[]>([]);
    const [activeWindow, setActiveWindow] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [menuOpen, setMenuOpen] = useState<boolean>(false);

    // Cargar caché inicial solo si está vacía
    useEffect(() => {
        if (windowsData.length && cacheRef.current.length === 0) {
            cacheRef.current = windowsData;
        }
        setWindows(cacheRef.current);
        if (cacheRef.current.length > 0) {
            setActiveWindow(cacheRef.current[0].id);
        }
    }, [windowsData]);

    // Simula carga al cambiar ventana
    useEffect(() => {
        if (activeWindow !== null) {
            setIsLoading(true);
            const timeout = setTimeout(() => setIsLoading(false), 400); // más rápido
            return () => clearTimeout(timeout);
        }
    }, [activeWindow]);

    const currentWindow = useMemo(() => windows.find(win => win.id === activeWindow), [windows, activeWindow]);

    const closeWindow = (id: number) => {
        setWindows(prev => {
            const filtered = prev.filter(win => win.id !== id);
            if (activeWindow === id) {
                setActiveWindow(filtered.length ? filtered[0].id : null);
            }
            return filtered;
        });
    };

    return (
        <div className="relative h-auto flex flex-col bg-gray-900 rounded-xl border border-gray-500 text-white overflow-hidden shadow-lg mt-2 mx-2 w-auto">
            {/* Header móvil */}
            <div className="sm:hidden flex justify-between items-center px-4 py-2 bg-gray-850 border-b border-gray-700">
                <span className="text-white font-semibold">Ventanas</span>
                <button onClick={() => setMenuOpen(!menuOpen)} className="text-white p-2 hover:bg-gray-700 rounded-md">
                    <Menu size={24} />
                </button>
            </div>

            {/* Menú móvil */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="sm:hidden absolute top-12 left-0 w-full bg-gray-850 border-b border-gray-700 z-10"
                    >
                        {windows.map(win => (
                            <button
                                key={win.id}
                                aria-label={`Ventana ${win.title}`}
                                className={`block w-full px-4 py-2 text-left text-sm font-semibold border-b border-gray-700 transition-all ${activeWindow === win.id ? "bg-gray-950 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                    }`}
                                onClick={() => { setActiveWindow(win.id); setMenuOpen(false); }}
                            >
                                {win.title}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tabs escritorio */}
            <div className="hidden sm:flex flex-wrap items-center gap-1 px-3 py-2 bg-gray-850 rounded-t-xl shadow-md border-b border-gray-700">
                {windows.map(win => (
                    <div key={win.id} className="relative">
                        <button
                            aria-label={`Ventana ${win.title}`}
                            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-t-md transition-all flex items-center gap-2 border border-gray-700 shadow-sm ${activeWindow === win.id ? "bg-gray-950 text-white border-blue-500" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                }`}
                            onClick={() => setActiveWindow(win.id)}
                        >
                            <span className="truncate max-w-[80px] sm:max-w-none">{win.title}</span>
                        </button>
                        {!win.isProtected && (
                            <span
                                className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 text-red-400 hover:text-red-300 cursor-pointer text-xs hover:scale-110"
                                onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
                            >
                                ✖
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {/* Contenido */}
            <div className="flex-grow bg-gray-800 rounded-b-xl shadow-inner border border-gray-500 w-full max-h-full overflow-auto flex items-center justify-center p-[20px]">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loader"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="w-full h-full flex items-center justify-center"
                        >
                            <Loader />
                        </motion.div>
                    ) : currentWindow && (
                        <motion.div
                            key={currentWindow.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="w-full h-full overflow-auto p-[20x]"
                        >
                            {currentWindow.content}
                            {currentWindow.component}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default WindowManager;
