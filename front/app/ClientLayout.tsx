"use client";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./components/sidebar/Sidebar";
import Navbar from "./components/navbar/Navbar";
import Toaster from "./components/toastr/Toaster";
import { AuthProvider } from "./context/AuthProvider";
import { GlobalTimerProvider } from "./components/timer/GlobalTimerContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const navbarRoutes = ["/pages/login", "/pages/register"];
  const showNavbar = navbarRoutes.includes(pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <AuthProvider>
        {showNavbar ? (
          <main className="w-full">
            <Toaster />
            {children}
          </main>
        ) : (
          <GlobalTimerProvider>
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <div className="flex-1 flex flex-col min-w-0">
              <Navbar onToggleSidebar={() => setSidebarOpen((p) => !p)} />
              <main className="flex-1 bg-background">{children}</main>
            </div>
            <Toaster />
          </GlobalTimerProvider>
        )}
      </AuthProvider>
    </div>
  );
}
