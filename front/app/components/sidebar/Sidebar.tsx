"use client";
import React, { useState, useEffect } from "react";
import {
  FaHome,
  FaUserAlt,
  FaVials,
  FaCog,
  FaCapsules,
  FaAngleDown,
  FaSignOutAlt,
  FaArrowLeft,
  FaBars
} from "react-icons/fa";
import nookies from "nookies";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getUserByEmail } from '../../services/authservices';
import { useAuth } from "../../hooks/useAuth";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  link?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    label: "Inicio",
    link: "/pages/dashboard",
    icon: <FaHome />,
  },
  {
    label: "Maestras",
    icon: <FaCapsules  />,
    children: [
      {
        label: "Ingredientes",
        icon: <FaVials />,
        link: "/pages/ingredients"
      },
      
    ],
  },
  {
    label: "Ajustes",
    icon: <FaCog />,
    children: [
      { label: "General", icon: <FaCog />, link: "/ajustes/general" },
      { label: "Seguridad", icon: <FaCog />, link: "/ajustes/seguridad" },
    ],
  },
];


const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const [openSubMenus, setOpenSubMenus] = useState<{ [key: number]: boolean }>({});
  const [isMobile, setIsMobile] = useState(false);
  const [userName, setUserName] = useState("");
  const router = useRouter();
  const { isAuthenticated } = useAuth();


  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const cookies = nookies.get(null);
        const email = cookies.email;
        if (email) {
          const decodedEmail = decodeURIComponent(email);
          const user = await getUserByEmail(decodedEmail);
          if (user.usuario) {
            setUserName(user.usuario.name);
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };


    if (isAuthenticated) fetchUserData();
  }, [isAuthenticated]);

  const handleLogout = () => {
    if (isMobile) setSidebarOpen(false);
    nookies.destroy(null, "token", { path: "/" });
    nookies.destroy(null, "userName", { path: "/" });
    nookies.destroy(null, "userData", { path: "/" });
    router.push("/");
  };

  return (
 <aside
      className={`transition-all duration-500 ease-in-out h-screen sticky top-0 bg-[#000] ${
        sidebarOpen ? "w-64" : "w-16"
      }`}
    >
      <div className="h-full w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-lg flex flex-col">
        {/* Header */}
        <div
          className={`flex items-center ${
            sidebarOpen ? "justify-between" : "justify-center"
          } p-4`}
        >
          {sidebarOpen && (
            <img src="/logipack_2.png" alt="Logipack" className="h-10 w-auto" />
          )}
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="p-2 bg-black/50 text-white rounded hover:bg-black/70 transition-colors"
            aria-label={sidebarOpen ? "Cerrar Sidebar" : "Abrir Sidebar"}
          >
            {sidebarOpen ? <FaArrowLeft /> : <FaBars />}
          </button>
        </div>

        {/* Navigation con flex-1 para que ocupe el espacio disponible */}
        <nav className="flex-1 overflow-y-auto mt-4">
          {menuItems.map((item, index) =>
            item.children ? (
              <div
                key={index}
                onMouseEnter={() =>
                  sidebarOpen &&
                  setOpenSubMenus((prev) => ({ ...prev, [index]: true }))
                }
                onMouseLeave={() =>
                  sidebarOpen &&
                  setOpenSubMenus((prev) => ({ ...prev, [index]: false }))
                }
              >
                <div
                  onClick={() => {
                    if (!sidebarOpen) {
                      setSidebarOpen(true);
                    } else {
                      setOpenSubMenus((prev) => ({
                        ...prev,
                        [index]: !prev[index],
                      }));
                    }
                  }}
                  className={`cursor-pointer p-2 hover:bg-white/20 rounded transition-colors ${
                    sidebarOpen ? "flex items-center" : "flex justify-center"
                  }`}
                >
                  <span className="text-lg text-white">{item.icon}</span>
                  {sidebarOpen && (
                    <>
                      <span className="ml-4 text-white">{item.label}</span>
                      <span className="ml-auto text-white transition-transform duration-300 transform">
                        <FaAngleDown
                          className={`${openSubMenus[index] ? "rotate-180" : ""}`}
                        />
                      </span>
                    </>
                  )}
                </div>
                <AnimatePresence initial={false}>
                  {openSubMenus[index] && sidebarOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="ml-8 overflow-hidden"
                    >
                      {item.children.map((subItem, subIndex) => (
                        <div
                          key={subIndex}
                          className="flex items-center cursor-pointer p-2 hover:bg-white/20 rounded transition-colors"
                          onClick={() => subItem.link && router.push(subItem.link)}
                        >
                          <span className="text-lg text-white">
                            {subItem.icon}
                          </span>
                          <span className="ml-4 text-white">{subItem.label}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div key={index}>
                <div
                  onClick={() => item.link && router.push(item.link)}
                  className={`cursor-pointer p-2 hover:bg-white/20 rounded transition-colors ${
                    sidebarOpen ? "flex items-center" : "flex justify-center"
                  }`}
                >
                  <span className="text-lg text-white">{item.icon}</span>
                  {sidebarOpen && (
                    <span className="ml-4 text-white">{item.label}</span>
                  )}
                </div>
              </div>
            )
          )}
        </nav>

        {/* Footer section */}
        <div className="mt-auto p-3 border-t border-white/10">
          {/* User profile */}
          <div className="flex items-center mb-4">
            <img
              src="/user.jpg"
              alt={userName}
              className="h-10 w-10 rounded-full object-cover cursor-pointer"
              onClick={() => router.push("/pages/perfil")}
            />
            {sidebarOpen && (
              <span className="ml-2 text-white font-medium">{userName}</span>
            )}
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors flex items-center justify-center p-2"
          >
            <FaSignOutAlt className="text-xl" />
            <span
              className={`${!sidebarOpen ? "hidden" : "inline"} text-sm ml-2`}
            >
              Cerrar Sesión
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;