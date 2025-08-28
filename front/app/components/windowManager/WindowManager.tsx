import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useId,
} from "react";
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
  initialActiveId?: number | null;
  /** Clave para recordar la pestaña activa en localStorage */
  storageKey?: string;
}

const getStoredActive = (key: string): number | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
};

const WindowManager: React.FC<WindowManagerProps> = ({
  windowsData = [],
  initialActiveId = null,
  storageKey = "wm:activeId",
}) => {
  const tabsListId = useId();
  const closedRef = useRef<Set<number>>(new Set());

  // 1) Inicializa leyendo de localStorage primero
  const [activeWindow, setActiveWindow] = useState<number | null>(() => {
    const fromStorage = getStoredActive(storageKey);
    return fromStorage ?? initialActiveId ?? null;
  });

  const [windows, setWindows] = useState<Window[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const exists = useCallback(
    (id: number | null, list: Window[]) =>
      id != null && list.some((w) => w.id === id),
    []
  );

  // 2) Sync con windowsData respetando cierres locales y preservando activo
  useEffect(() => {
    const incoming = (windowsData ?? []).filter(
      (w) => !closedRef.current.has(w.id)
    );

    setWindows((prev) => {
      const prevMap = new Map<number, Window>(
        prev.filter((p) => !closedRef.current.has(p.id)).map((p) => [p.id, p])
      );
      for (const w of incoming) {
        const before = prevMap.get(w.id);
        prevMap.set(w.id, { ...before, ...w });
      }
      return Array.from(prevMap.values());
    });

    setActiveWindow((curr) => {
      // Si la actual sigue existiendo: no tocar
      if (exists(curr, incoming)) return curr;

      // Si hay guardada en storage y existe, úsala
      const stored = getStoredActive(storageKey);
      if (exists(stored, incoming)) return stored!;

      // Si initialActiveId existe, úsalo
      if (exists(initialActiveId, incoming)) return initialActiveId!;

      // Si no, primera o null
      return incoming[0]?.id ?? null;
    });
  }, [windowsData, initialActiveId, storageKey, exists]);

  // 3) Simulación de carga al cambiar de ventana (opcional)
  useEffect(() => {
    if (activeWindow === null) return;
    let cancelled = false;
    setIsLoading(true);
    const t = setTimeout(() => {
      if (!cancelled) setIsLoading(false);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [activeWindow]);

  // 4) Persistir cada cambio en localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (activeWindow == null) {
      window.localStorage.removeItem(storageKey);
    } else {
      window.localStorage.setItem(storageKey, String(activeWindow));
    }
  }, [activeWindow, storageKey]);

  const currentWindow = useMemo(
    () => windows.find((win) => win.id === activeWindow) ?? null,
    [windows, activeWindow]
  );

  const closeWindow = useCallback(
    (id: number) => {
      closedRef.current.add(id);
      setWindows((prev) => prev.filter((win) => win.id !== id));
      setActiveWindow((curr) => {
        if (curr !== id) return curr;
        // siguiente: derecha; si no, izquierda; si no, null
        const idx = windows.findIndex((w) => w.id === id);
        const right = windows[idx + 1]?.id;
        const left = windows[idx - 1]?.id;
        return right ?? left ?? null;
      });
    },
    [windows]
  );

  // Middle click en tab -> cerrar
  const handleTabMouseUp = useCallback(
    (e: React.MouseEvent, id: number) => {
      if (e.button === 1) {
        e.preventDefault();
        closeWindow(id);
      }
    },
    [closeWindow]
  );

  // Atajos de teclado: Ctrl+Tab / Ctrl+Shift+Tab / Ctrl+W
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!windows.length) return;
      const isCtrl = e.ctrlKey || e.metaKey;

      // Ctrl+W cierra la activa (si no está protegida)
      if (isCtrl && e.key.toLowerCase() === "w") {
        e.preventDefault();
        if (activeWindow != null) {
          const win = windows.find((w) => w.id === activeWindow);
          if (win && !win.isProtected) closeWindow(activeWindow);
        }
        return;
      }

      // Ctrl+Tab / Ctrl+Shift+Tab navega entre pestañas
      if (isCtrl && e.key === "Tab") {
        e.preventDefault();
        const idx = windows.findIndex((w) => w.id === activeWindow);
        if (idx === -1) {
          setActiveWindow(windows[0].id);
          return;
        }
        const next = e.shiftKey
          ? windows[(idx - 1 + windows.length) % windows.length]
          : windows[(idx + 1) % windows.length];
        setActiveWindow(next.id);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [windows, activeWindow, closeWindow]);

  return (
    <div className="relative h-auto flex flex-col bg-gray-900 rounded-xl border border-gray-500 text-white overflow-hidden shadow-lg mt-2 mx-2 w-auto">
      {/* Header móvil */}
      <div className="sm:hidden flex justify-between items-center px-4 py-2 bg-gray-850 border-b border-gray-700">
        <span className="text-white font-semibold ml-16">Ventanas</span>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="text-white p-2 hover:bg-gray-700 rounded-md"
          aria-expanded={menuOpen}
          aria-controls="mobile-window-menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Menú móvil */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-window-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="sm:hidden absolute top-12 left-0 w-full bg-gray-850 border-b border-gray-700 z-10"
          >
            {windows.map((win) => (
              <div key={win.id} className="relative">
                <button
                  aria-label={`Ventana ${win.title}`}
                  className={[
                    "block w-full px-4 py-2 text-left text-sm font-semibold border-b border-gray-700 transition-all",
                    activeWindow === win.id
                      ? "bg-gray-950 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700",
                  ].join(" ")}
                  onClick={() => {
                    setActiveWindow(win.id);
                    setMenuOpen(false);
                  }}
                >
                  {win.title}
                </button>
                {!win.isProtected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeWindow(win.id);
                    }}
                    className="absolute top-1 right-2 text-red-400 hover:text-red-300 text-xs"
                    aria-label={`Cerrar ${win.title}`}
                  >
                    ✖
                  </button>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs escritorio */}
      <div
        className="hidden sm:flex ml-8 items-center flex-nowrap gap-0 px-3 py-2
             bg-gray-850 rounded-t-xl shadow-md border-b border-gray-700"
        role="tablist"
        aria-orientation="horizontal"
        id={tabsListId}
      >
        {windows.map((win) => {
          const selected = activeWindow === win.id;
          const panelId = `panel-${win.id}`;
          const tabId = `tab-${win.id}`;

          return (
            // solapa 1px para evitar “doble borde” entre botones
            <div key={win.id} className="relative -ml-px first:ml-0">
              <button
                id={tabId}
                role="tab"
                aria-selected={selected}
                aria-controls={panelId}
                tabIndex={selected ? 0 : -1}
                className={[
                  // sin gap, todos pegados; mantenemos borde en cada uno
                  "px-4 py-2 text-xs sm:text-sm font-semibold rounded-t-md transition-all flex items-center",
                  "border border-gray-700 shadow-sm ml-1",
                  selected
                    ? "bg-gray-950 text-white border-blue-500"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700",
                ].join(" ")}
                onClick={() => setActiveWindow(win.id)}
                onMouseUp={(e) => handleTabMouseUp(e, win.id)}
                onAuxClick={(e) => {
                  if (e.button === 1) closeWindow(win.id);
                }}
              >
                <span className="truncate max-w-[120px] sm:max-w-none">
                  {win.title}
                </span>
              </button>

              {!win.isProtected && (
                <button
                  className="absolute -top-1 -right-1 text-red-400 hover:text-red-300 cursor-pointer text-xs hover:scale-110"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeWindow(win.id);
                  }}
                  aria-label={`Cerrar ${win.title}`}
                >
                  ✖
                </button>
              )}
            </div>
          );
        })}
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
          ) : currentWindow ? (
            <motion.div
              key={currentWindow.id}
              id={`panel-${currentWindow.id}`}
              role="tabpanel"
              aria-labelledby={`tab-${currentWindow.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full h-full overflow-auto p-[20px]"
            >
              {currentWindow.content}
              {currentWindow.component}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full h-full flex items-center justify-center text-gray-400 text-sm"
            >
              No hay ventanas abiertas.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WindowManager;
