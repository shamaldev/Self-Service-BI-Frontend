import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";   // ✅ Import this
import Sidebar from "./Sidebar";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="flex h-screen min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <Bars3Icon className="h-6 w-6 text-gray-600" />
      </button>

      {/* Mobile Overlay */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          ${isMobile ? "fixed inset-y-0 left-0 z-50" : "relative h-full"}
          transition-transform duration-300 ease-in-out
          ${isMobile && !sidebarOpen ? "-translate-x-full" : "translate-x-0"}
        `}
      >
        <Sidebar isMobile={isMobile} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <main
        className={`
          flex-1 overflow-y-auto transition-all duration-300 h-full
          ${isMobile ? "p-4 pt-16" : "p-6"}
        `}
      >
        <div className="max-w-7xl mx-auto">
          {/* 👇 This is where Dashboard or AIAssistant will render */}
          <Outlet />  
        </div>
      </main>
    </div>
  );
}
