"use client";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./components/navbar/Navbar";
import Sidebar from "./components/sidebar/Sidebar";
import Toaster from "./components/toastr/Toaster";
import { AuthProvider } from "./context/AuthProvider";
// import PlanningNotifier from "@/app/components/clock/PlanningNotifier"; 

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const navbarRoutes = ["/", "/pages/login", "/pages/register"];
  const showNavbar = navbarRoutes.includes(pathname);

  // Estado para controlar si el sidebar está expandido o colapsado
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      <AuthProvider>
        {showNavbar ? (
          <main className="w-full">
            <Navbar />
            <Toaster />
            {children}
          </main>
        ) : (
          <>
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <main className="flex-1 bg-[#242424]"> 
              {children}
            </main> 
            {/* <PlanningNotifier /> */}
            <Toaster />
          </>
        )}
      </AuthProvider>
    </div>
  );

}
