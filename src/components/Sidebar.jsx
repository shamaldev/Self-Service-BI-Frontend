import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import {
  Squares2X2Icon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  XMarkIcon,
  MagnifyingGlassIcon
} from "@heroicons/react/24/outline";

export default function Sidebar({ isMobile = false, onClose }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userName, setUserName] = useState("User");
  const [userRole, setUserRole] = useState("user");
  const navigate = useNavigate();

  useEffect(() => {
    // Function to get cookie by name
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    };

    // Function to decode JWT payload
   const decodeJWT = (token) => {
  try {
    if (!token) throw new Error("Token is missing");

    const decoded = jwtDecode(token);
    console.log("Decoded JWT:", decoded);

    return decoded;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};


    const accessToken = getCookie("access_token");
    if (accessToken) {
      const decoded = decodeJWT(accessToken);
      
      
      if (decoded && decoded.user_id) {
        setUserName(decoded.user_id);
        setUserRole(decoded.role || "user")
      }
    }
  }, []);

  // Auto-collapse on mobile, but keep desktop state
  const shouldCollapse = isMobile ? false : isCollapsed;

  const handleLogout = () => {
    // Clear access token cookie manually
   Cookies.remove("access_token", { path: "/" })
   localStorage.removeItem("dashboardCache") 
    // Redirect to login or home
    navigate("/login");
  };

  return (
    <aside 
      className={`
        ${isMobile ? 'w-64' : (shouldCollapse ? 'w-20' : 'w-64')}
        bg-white/80 backdrop-blur-xl border-r border-gray-200/50 
        flex flex-col transition-all duration-300 ease-in-out relative shadow-lg
        h-screen min-h-screen
      `}
      style={{ height: '100vh', minHeight: '100vh' }}
    >
      {/* Mobile Close Button */}
      {isMobile && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
          aria-label="Close sidebar"
        >
          <XMarkIcon className="h-5 w-5 text-gray-600" />
        </button>
      )}
      {/* Toggle Button - Hidden on Mobile */}
      {!isMobile && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute -right-3 top-[72px] bg-white text-gray-400 rounded-full p-1
            shadow-sm hover:shadow border border-gray-200/50 
            transform transition-all duration-200 ease-in-out
            hover:text-blue-500 hover:border-blue-100 hover:scale-105 
            focus:outline-none focus:ring-1 focus:ring-blue-400 focus:ring-offset-1 
            group z-50 ${shouldCollapse ? 'hover:bg-blue-50' : 'hover:bg-blue-50'}`}
          aria-label={shouldCollapse ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <div className="relative">
            {shouldCollapse ? 
              <ChevronRightIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" /> : 
              <ChevronLeftIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
            }
            <span className="absolute top-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap
              bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100
              transition-opacity duration-200 pointer-events-none">
              {shouldCollapse ? 'Expand sidebar' : 'Collapse sidebar'}
            </span>
          </div>
        </button>
      )}

      {/* Logo / App Name */}
      <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="px-4 py-5 border-b border-gray-200/50">
          <h1 className={`text-lg font-semibold flex items-center gap-3 ${shouldCollapse ? 'justify-center' : ''}`}>
            <span className="rounded-lg p-1 bg-white/80 shadow-sm">
              <ChartBarIcon className="h-6 w-6 text-blue-500 transition-transform duration-300 hover:scale-110" />
            </span>
            {!shouldCollapse && (
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-bold">
                BI Analytics
              </span>
            )}
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-2">
        <div className="relative group">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center ${shouldCollapse ? 'justify-center' : ''} gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md scale-105 hover:from-blue-600 hover:to-blue-700"
                  : "text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:scale-105"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Squares2X2Icon
                  className={`h-5 w-5 ${
                    isActive ? "text-white" : "text-gray-500"
                  }`}
                />
                {!shouldCollapse && "Dashboard"}
                {shouldCollapse && !isMobile && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Dashboard
                  </div>
                )}
              </>
            )}
          </NavLink>
        </div>

        <div className="relative group">
          <NavLink
            to="/ai-assistant"
            className={({ isActive }) =>
              `flex items-center ${shouldCollapse ? 'justify-center' : ''} gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md scale-105 hover:from-blue-600 hover:to-blue-700"
                  : "text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:scale-105"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <ChatBubbleLeftRightIcon
                  className={`h-5 w-5 ${
                    isActive ? "text-white" : "text-gray-500"
                  }`}
                />
                {!shouldCollapse && "AI Assistant"}
                {shouldCollapse && !isMobile && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    AI Assistant
                  </div>
                )}
              </>
            )}
          </NavLink>
        </div>

        <div className="relative group">
          <NavLink
            to="/insights"
            className={({ isActive }) =>
              `flex items-center ${shouldCollapse ? 'justify-center' : ''} gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md scale-105 hover:from-blue-600 hover:to-blue-700"
                  : "text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:scale-105"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <MagnifyingGlassIcon
                  className={`h-5 w-5 ${
                    isActive ? "text-white" : "text-gray-500"
                  }`}
                />
                {!shouldCollapse && "Alert Monitoring"}
                {shouldCollapse && !isMobile && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Alert Monitor
                  </div>
                )}
              </>
            )}
          </NavLink>
        </div>
      </nav>

      {/* Persona Settings */}
      {/* <div className={`border-t border-gray-200/50 px-4 py-4 ${shouldCollapse ? 'hidden' : ''}`}>
        <p className="text-xs font-semibold text-blue-500 mb-3 tracking-wider">
          PERSONA
        </p>
        <div className="space-y-3 text-sm bg-gray-50/50 p-3 rounded-xl backdrop-blur-sm">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">Role</span>
            <span className="font-semibold text-gray-800">{userRole}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">Goal</span>
            <span className="font-semibold text-gray-800">
              Financial Performance
            </span>
          </div>
        </div>
      </div> */}

      {/* User Profile Section */}
      <div className="border-t border-gray-200/50 p-4">
        <div className={`flex items-center ${shouldCollapse ? 'justify-center' : 'space-x-3'}`}>
          <div className="relative group">
            <UserCircleIcon className="h-8 w-8 text-gray-600 hover:text-blue-500 transition-colors" />
            {shouldCollapse && !isMobile && (
              <div className="absolute left-full bottom-0 ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {userName}
              </div>
            )}
          </div>
          {!shouldCollapse && (
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-800">{userName}</h3>
              <p className="text-xs text-gray-500">{userRole}</p>
            </div>
          )}
          {!shouldCollapse && (
            <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <Cog6ToothIcon className="h-5 w-5 text-gray-500" />
            </button>
          )}
        </div>
        {!shouldCollapse && (
          <button
            onClick={handleLogout}
            className="w-full mt-3 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <XMarkIcon className="h-4 w-4" />
            Logout
          </button>
        )}
      </div>
    </aside>
  );
}