"use client";

import React, { useState, useEffect } from "react";
import {
  FaHome, FaVials, FaCog, FaFileInvoice, FaAngleDown, FaSignOutAlt,
  FaChartLine, FaArrowLeft, FaBars, FaIoxhost, FaBook, FaBorderAll,
  FaDolly, FaCalendarAlt, FaBookmark
} from "react-icons/fa";
import nookies from "nookies";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getUserByEmail } from "../../services/userDash/authservices";
import Image from "next/image";
import SidebarFlyoutPortal from "./SidebarFlyoutPortal";
import ThemeToggle from "../buttons/ThemeToggle";

// ---- Hook Mobile ----
function useIsMobile(breakpoint = 1024) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

// ---- Types ----
interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}
interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  link?: string;
  children?: MenuItem[];
}

// ---- Menu Data ----
const menuItems: MenuItem[] = [
  { key: "inicio", label: "Inicio", link: "/pages/dashboard", icon: <FaHome /> },
  {
    key: "seteos", label: "Seteos", icon: <FaBook />, children: [
      { key: "maestras", label: "Config. de Maestras", icon: <FaVials />, link: "/pages/maestra" },
      { key: "bom", label: "Config. de BOM", icon: <FaIoxhost />, link: "/pages/bom" },
    ],
  },
  {
    key: "datos", label: "Datos", icon: <FaBorderAll />, children: [
      { key: "ordenes", label: "Ordenes de Acon.", icon: <FaFileInvoice />, link: "/pages/adaptation" },
      { key: "planing", label: "Gestión de Ordenes", icon: <FaBookmark />, link: "/pages/planificacion" },
    ],
  },
  {
    key: "analisis", label: "Analisis", icon: <FaChartLine />, children: [
      { key: "inventario", label: "Inventario", icon: <FaDolly />, link: "/pages/inventory" },
      { key: "calendario", label: "Calendario", icon: <FaCalendarAlt />, link: "/pages/calendar" },
    ],
  },
  { key: "ajustes", label: "Ajustes", icon: <FaCog />, children: [
    { key: "general", label: "General", icon: <FaCog />, link: "/pages/perfil" }, 
  ]}, 
];

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const [openSubMenus, setOpenSubMenus] = useState<{ [k: string]: boolean }>({});
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [flyoutPosition, setFlyoutPosition] = useState<{ top: number; left: number } | null>(null);
  const [userName, setUserName] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const isAuthenticated = Boolean(nookies.get(null).token);

  // Cargar usuario
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const cookies = nookies.get(null);
        const email = cookies.email;
        if (email) {
          const decodedEmail = decodeURIComponent(email);
          const user = await getUserByEmail(decodedEmail);
          if (user.usuario && typeof user.usuario === "object" && "name" in user.usuario) {
            setUserName((user.usuario as { name?: string }).name || "");
          }
        }
      } catch (e) {
        console.error("Error fetching user:", e);
      }
    };
    if (isAuthenticated) fetchUserData();
  }, [isAuthenticated]);

  // Cerrar en navegación si estás en móvil
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [pathname, isMobile, setSidebarOpen]);

  // ESC para cerrar en móvil
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobile && sidebarOpen) setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobile, sidebarOpen, setSidebarOpen]);

  // Bloquear scroll del body cuando el sidebar móvil está abierto
  useEffect(() => {
    if (!isMobile) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = sidebarOpen ? "hidden" : original || "";
    return () => { document.body.style.overflow = original || ""; };
  }, [isMobile, sidebarOpen]);

  // Swipe-to-close (móvil)
  useEffect(() => {
    if (!isMobile) return;
    let startX = 0;
    let currentX = 0;
    let touching = false;

    const onTouchStart = (e: TouchEvent) => {
      touching = true;
      startX = e.touches[0].clientX;
      currentX = startX;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!touching) return;
      currentX = e.touches[0].clientX;
    };
    const onTouchEnd = () => {
      if (!touching) return;
      const delta = currentX - startX;
      if (delta < -60 && sidebarOpen) setSidebarOpen(false);
      touching = false;
    };

    document.addEventListener("touchstart", onTouchStart);
    document.addEventListener("touchmove", onTouchMove);
    document.addEventListener("touchend", onTouchEnd);
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [isMobile, sidebarOpen, setSidebarOpen]);

  const handleLogout = () => {
    if (isMobile) setSidebarOpen(false);
    ["token", "userName", "userData", "email", "role"].forEach((c) =>
      nookies.destroy(null, c, { path: "/" })
    );
    router.push("/");
  };

  const isMenuItemActive = (item: MenuItem) =>
    (item.link && pathname === item.link) ||
    (item.children && item.children.some((c) => c.link === pathname));

  const isSubMenuItemActive = (sub: MenuItem) => sub.link === pathname;

  // --- Botón hamburguesa SOLO móvil ---
  const MobileHamburger = () =>
    !sidebarOpen ? (
      <button
        aria-label="Abrir menú"
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-[60] rounded-full p-2 bg-background/80 text-foreground border border-foreground/20 shadow-md active:scale-95"
      >
        <FaBars />
      </button>
    ) : null;

  return (
    <>
      {/* Backdrop móvil */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-foreground/50 backdrop-blur-[1px]"
          aria-hidden="true"
        />
      )}

      {/* Hamburguesa móvil */}
      <MobileHamburger />

      {/* Sidebar */}
      <motion.aside
        animate={!isMobile ? { width: sidebarOpen ? 256 : 64 } : {}}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className={[
          "z-50 bg-background text-foreground rounded-none lg:rounded-xl shadow-lg",
          "fixed lg:sticky inset-y-0 left-0",
          "w-72 max-w-[85vw] lg:w-auto",
          "transform transition-transform duration-300 ease-in-out",
          isMobile ? (sidebarOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0",
          "lg:top-0 lg:h-screen",
          "border-r border-foreground/20"
        ].join(" ")}
        role="dialog"
        aria-modal={isMobile ? true : false}
        aria-label="Barra lateral de navegación"
      >
        <div className="h-full w-full bg-background text-foreground flex flex-col">
          {/* Header */}
          <div className={`flex items-center ${sidebarOpen ? "justify-between" : "justify-center"} p-4 border-b border-foreground/20`}>
            {sidebarOpen && (
              <Image src="/logipack_2.png" alt="Logipack" width={60} height={40} priority />
            )}
            <button
              onClick={() => setSidebarOpen((p) => !p)}
              className="p-2 bg-background text-foreground border border-foreground/20 rounded hover:border-foreground/40 transition-colors"
              aria-label={sidebarOpen ? "Cerrar Sidebar" : "Abrir Sidebar"}
            >
              {sidebarOpen ? <FaArrowLeft /> : <FaBars />}
            </button>
          </div>

          {/* Menú */}
          <nav className="flex-1 overflow-y-auto py-2">
            {menuItems.map((item) =>
              item.children ? (
                <div
                  key={item.key}
                  onMouseEnter={(e) => {
                    if (!isMobile && sidebarOpen) {
                      setOpenSubMenus((prev) => ({ ...prev, [item.key]: true }));
                    } else if (!isMobile && !sidebarOpen) {
                      setHoveredMenu(item.key);
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setFlyoutPosition({ top: rect.top, left: rect.right + 6 });
                    }
                  }}
                  onMouseLeave={() => {
                    if (!isMobile && sidebarOpen) {
                      setOpenSubMenus((prev) => ({ ...prev, [item.key]: false }));
                    } else if (!isMobile) {
                      setHoveredMenu(null);
                      setFlyoutPosition(null);
                    }
                  }}
                  className="relative"
                >
                  {/* Botón principal */}
                  <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={!!openSubMenus[item.key]}
                    onClick={() => {
                      if (!sidebarOpen) setSidebarOpen(true);
                      else setOpenSubMenus((prev) => ({ ...prev, [item.key]: !prev[item.key] }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (!sidebarOpen) setSidebarOpen(true);
                        else setOpenSubMenus((prev) => ({ ...prev, [item.key]: !prev[item.key] }));
                      }
                    }}
                    className={[
                      "relative cursor-pointer p-2 rounded transition-colors select-none",
                      "hover:bg-foreground/10",
                      sidebarOpen ? "flex items-center" : "flex justify-center",
                    ].join(" ")}
                    style={{
                      borderLeft: isMenuItemActive(item) ? "4px solid #eab308" : "4px solid transparent",
                      // usa var para un highlight suave en ambos temas
                      background: isMenuItemActive(item) ? "color-mix(in oklab, rgb(var(--foreground)) 10%, transparent)" : "transparent",
                      transition: "border-color 0.2s, background 0.2s",
                    }}
                  >
                    <span className="text-lg mr-2">{item.icon}</span>
                    {sidebarOpen && (
                      <div className="flex items-center w-full">
                        <span className="mr-2">{item.label}</span>
                        <span className="ml-auto transition-transform duration-300 transform">
                          <FaAngleDown className={`${openSubMenus[item.key] ? "rotate-180" : ""}`} />
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Flyout (solo desktop/hover) */}
                  <AnimatePresence>
                    {!isMobile && !sidebarOpen && hoveredMenu === item.key && flyoutPosition && (
                      <SidebarFlyoutPortal>
                        <motion.div
                          key={item.key}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ duration: 0.18 }}
                          className="fixed z-[9999] min-w-[180px] bg-background text-foreground rounded-xl shadow-xl border border-foreground/20 py-2"
                          style={{ top: flyoutPosition.top, left: flyoutPosition.left, boxShadow: "0 2px 12px 0 #00000060" }}
                          onMouseLeave={() => {
                            setHoveredMenu(null);
                            setFlyoutPosition(null);
                          }}
                          onMouseEnter={() => setHoveredMenu(item.key)}
                        >
                          {item.children.map((sub) => (
                            <div
                              key={sub.key}
                              role="button"
                              tabIndex={0}
                              aria-current={isSubMenuItemActive(sub)}
                              className="flex items-center cursor-pointer p-2 rounded transition-colors select-none hover:bg-foreground/10"
                              onClick={() => {
                                if (sub.link) router.push(sub.link);
                                setHoveredMenu(null);
                                setFlyoutPosition(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  if (sub.link) router.push(sub.link);
                                  setHoveredMenu(null);
                                  setFlyoutPosition(null);
                                }
                              }}
                              style={{
                                borderLeft: isSubMenuItemActive(sub) ? "3px solid #22d3ee" : "3px solid transparent",
                                background: isSubMenuItemActive(sub) ? "color-mix(in oklab, rgb(var(--foreground)) 8%, transparent)" : "transparent",
                                transition: "border-color 0.2s, background 0.2s",
                              }}
                            >
                              <span className="text-lg mr-2">{sub.icon}</span>
                              <span>{sub.label}</span>
                            </div>
                          ))}
                        </motion.div>
                      </SidebarFlyoutPortal>
                    )}
                  </AnimatePresence>

                  {/* Submenú acordeón */}
                  <AnimatePresence initial={false}>
                    {openSubMenus[item.key] && sidebarOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="ml-8 overflow-hidden"
                      >
                        {item.children.map((sub) => (
                          <div
                            key={sub.key}
                            role="button"
                            tabIndex={0}
                            aria-current={isSubMenuItemActive(sub)}
                            className="flex items-center cursor-pointer p-2 rounded transition-colors select-none hover:bg-foreground/10"
                            onClick={() => sub.link && router.push(sub.link)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                if (sub.link) router.push(sub.link);
                              }
                            }}
                            style={{
                              borderLeft: isSubMenuItemActive(sub) ? "3px solid #22d3ee" : "3px solid transparent",
                              background: isSubMenuItemActive(sub) ? "color-mix(in oklab, rgb(var(--foreground)) 8%, transparent)" : "transparent",
                              transition: "border-color 0.2s, background 0.2s",
                            }}
                          >
                            <span className="text-lg mr-2">{sub.icon}</span>
                            {sidebarOpen && <span>{sub.label}</span>}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div key={item.key}>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-current={isMenuItemActive(item)}
                    onClick={() => item.link && router.push(item.link)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (item.link) router.push(item.link);
                      }
                    }}
                    className={[
                      "relative cursor-pointer p-2 rounded transition-colors select-none",
                      "hover:bg-foreground/10",
                      sidebarOpen ? "flex items-center" : "flex justify-center",
                    ].join(" ")}
                    style={{
                      borderLeft: isMenuItemActive(item) ? "4px solid #eab308" : "4px solid transparent",
                      background: isMenuItemActive(item) ? "color-mix(in oklab, rgb(var(--foreground)) 10%, transparent)" : "transparent",
                      transition: "border-color 0.2s, background 0.2s",
                    }}
                  >
                    <span className="text-lg mr-2">{item.icon}</span>
                    {sidebarOpen && <span>{item.label}</span>}
                  </div>
                </div>
              )
            )}
          </nav>

          {/* Footer */}
          <div className="mt-auto p-3 border-t border-foreground/20">
            <ThemeToggle
              showLabel={sidebarOpen}
              className={[
                "w-full", 
                sidebarOpen ? "justify-center mb-2" : "justify-center mb-2 p-2",
              ].join(" ")}
            />
            <div className="mb-2 flex items-center">
              <Image
                src="/avatar.png"
                alt={userName || "Usuario"}
                width={40}
                height={40}
                priority
                className="w-[40px] h-[40px] rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                  router.push("/pages/userProfile");
                  if (isMobile) setSidebarOpen(false);
                }}
              />
              {sidebarOpen && (
                <span className="ml-2 font-medium truncate max-w-[120px]">{userName}</span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors flex items-center justify-center p-2"
            >
              <FaSignOutAlt className="text-xl" />
              {sidebarOpen && <span className="text-sm ml-2">Cerrar Sesión</span>}
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
