import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { API_BASE_URL } from "../config/axios";
import { toast } from "react-toastify";
import {
  Squares2X2Icon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserCircleIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
 ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/outline";

export default function Sidebar({ isMobile = false, onClose, isCollapsed, setIsCollapsed }) {
  const [userName, setUserName] = useState("User");
  const [userRole, setUserRole] = useState("user");
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const shouldCollapse = isMobile ? false : isCollapsed;

  const decodeJWT = (token) => {
    try {
      if (!token) throw new Error("Token is missing");
      return jwtDecode(token);
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 30) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  const handleDeleteConversation = async (convId) => {
    if (!window.confirm("Delete this conversation permanently?")) return;
    const accessToken = Cookies.get("access_token");
    if (!accessToken) return;

    try {
      await axios.delete(
        `${API_BASE_URL}/bi-history/conversations/${convId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setConversations((prev) => prev.filter((c) => c.conversation_id !== convId));
      
      // ✅ FIX: Check if we're currently viewing the deleted conversation
      if (location.pathname === `/ai-assistant/${convId}`) {
        navigate("/ai-assistant", { replace: true });
      }
      
      toast.success("Conversation deleted successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Error deleting conversation.");
    }
  };

  // ✅ FIX: Add fetchConversations as a separate function that can be called
  const fetchConversations = async () => {
    const accessToken = Cookies.get("access_token");
    if (!accessToken) {
      setLoadingConversations(false);
      return;
    }

    setLoadingConversations(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/bi-history/conversations`,
        {
          params: {
            limit: 3,
            offset: 0,
            include_archived: false,
            sort_by: "last_updated",
            sort_order: "desc",
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );
      
      const convs = response.data.conversations || [];
      convs.sort(
        (a, b) =>
          new Date(b.last_updated || b.created_at) -
          new Date(a.last_updated || a.created_at)
      );
      setConversations(convs);
    } catch (error) {
      console.error("❌ Error fetching conversations:", error);
      toast.error("Error fetching data. Check ngrok URL or token validity.");
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    const accessToken = Cookies.get("access_token");
    if (accessToken) {
      const decoded = decodeJWT(accessToken);
      if (decoded?.user_id) {
        setUserName(decoded.user_id);
        setUserRole(decoded.role || "user");
      }
      fetchConversations();
    } else {
      setLoadingConversations(false);
    }
  }, []);

  // ✅ FIX: Refresh conversations when location changes (optional but helpful)
  useEffect(() => {
    // Only refresh if we're on an AI assistant route
    if (location.pathname.startsWith('/ai-assistant')) {
      const accessToken = Cookies.get("access_token");
      if (accessToken) {
        fetchConversations();
      }
    }
  }, [location.pathname]);

  const handleLogout = () => {
    Cookies.remove("access_token", { path: "/" });
    localStorage.removeItem("dashboardCache");
    navigate("/login");
  };

  // ✅ FIX: Helper to determine if a conversation is active
  // Only show as active if we're actually on an AI assistant route
  const isConversationActive = (convId) => {
    return location.pathname === `/ai-assistant/${convId}`;
  };

  // ✅ FIX: Helper to check if we're on the main AI assistant page (no conversation)
  const isMainAIAssistantActive = () => {
    return location.pathname === '/ai-assistant';
  };

  // ✅ FIX: Check if we're on any AI assistant route at all
  const isOnAIAssistantRoute = () => {
    return location.pathname.startsWith('/ai-assistant');
  };

  return (
    <aside
      className={`
        ${shouldCollapse ? "w-20" : "w-64"}
        bg-white/80 backdrop-blur-xl border-r border-gray-200/50
        flex flex-col transition-all duration-300 ease-in-out relative shadow-lg
        h-screen
      `}
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

      {/* Desktop Toggle */}
      {!isMobile && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-[72px] bg-white text-gray-400 rounded-full p-1 shadow-sm hover:shadow border border-gray-200/50 transform transition-all duration-200 hover:text-blue-500 hover:border-blue-100 hover:scale-105 group z-50"
          aria-label={shouldCollapse ? "Expand sidebar" : "Collapse sidebar"}
        >
          {shouldCollapse ? (
            <ChevronRightIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          ) : (
            <ChevronLeftIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
          )}
        </button>
      )}

      {/* Logo */}
      <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200/50">
        <div className="px-4 py-5">
          <h1
            className={`text-lg font-semibold flex items-center gap-3 ${
              shouldCollapse ? "justify-center" : ""
            }`}
          >
            <span className="rounded-lg p-1 bg-white/80 shadow-sm">
              <ChartBarIcon className="h-6 w-6 text-blue-500" />
            </span>
            {!shouldCollapse && (
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-bold">
                BI Analytics
              </span>
            )}
          </h1>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Primary Navigation */}
        <nav className="px-3 pt-4 pb-3 space-y-2">
          {/* Dashboard */}
          <div className="relative group">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center ${
                  shouldCollapse ? "justify-center" : ""
                } gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Squares2X2Icon
                    className={`h-5 w-5 transition-colors duration-150 ${
                      isActive ? "text-white" : "text-gray-500"
                    }`}
                  />
                  {!shouldCollapse && <span className="transition-colors duration-150">Dashboard</span>}
                </>
              )}
            </NavLink>
          </div>

          {/* AI Assistant (main entry → new chat) */}
          <div className="relative group">
            <NavLink
              to="/ai-assistant"
              end
              className={({ isActive }) =>
                `flex items-center ${
                  shouldCollapse ? "justify-center" : ""
                } gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <ChatBubbleLeftRightIcon
                    className={`h-5 w-5 transition-colors duration-150 ${
                      isActive ? "text-white" : "text-gray-500"
                    }`}
                  />
                  {!shouldCollapse && <span className="transition-colors duration-150">AI Assistant</span>}
                </>
              )}
            </NavLink>
          </div>

          {/* Alert Monitoring */}
          <div className="relative group">
            <NavLink
              to="/insights"
              className={({ isActive }) =>
                `flex items-center ${
                  shouldCollapse ? "justify-center" : ""
                } gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <MagnifyingGlassIcon
                    className={`h-5 w-5 transition-colors duration-150 ${
                      isActive ? "text-white" : "text-gray-500"
                    }`}
                  />
                  {!shouldCollapse && <span className="transition-colors duration-150">Alert Monitoring</span>}
                </>
              )}
            </NavLink>
          </div>
        </nav>

        {/* Conversation History – hidden when collapsed */}
        {!shouldCollapse && (
          <div className="flex-1 overflow-y-auto px-3 pb-4">
            <div className="border-t border-gray-200/50 pt-5 mt-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
                Conversations
              </p>

              {/* New Chat Button */}
              <button
                onClick={() => navigate("/ai-assistant", { replace: true })}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-blue-50/80 hover:text-blue-600 transition-colors duration-150 mb-3"
              >
                <PlusIcon className="h-5 w-5 transition-colors duration-150" />
                New Chat
              </button>

              {/* Loading State */}
              {loadingConversations && (
                <div className="space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="px-3 py-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded mt-2 w-4/5 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loadingConversations && conversations.length === 0 && (
                <div className="text-center py-12 text-gray-400 text-sm">
                  <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No conversations yet</p>
                  <p className="text-xs mt-1">
                    Start asking your BI questions!
                  </p>
                </div>
              )}

              {/* Conversations List */}
              {!loadingConversations && conversations.length > 0 && (
                <div className="space-y-1.5">
                  {conversations.map((conv) => {
                    // ✅ FIX: Only show as active if we're on AI assistant routes
                    const isActive = isOnAIAssistantRoute() && isConversationActive(conv.conversation_id);
                    const title = conv.title?.trim() || "Untitled Conversation";
                    const preview = conv.preview_message || conv.last_message || null;
                    
                    return (
                      <div key={conv.conversation_id} className="relative group">
                        <button
                          onClick={() => navigate(`/ai-assistant/${conv.conversation_id}`)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl transition-none pr-10
                            ${
                              isActive
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20"
                                : "hover:bg-gray-100/80 text-gray-700"
                            }`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <p
                                className={`font-medium text-sm truncate transition-none ${
                                  isActive ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {title}
                              </p>
                              {preview && (
                                <p
                                  className={`text-xs mt-0.5 truncate transition-none ${
                                    isActive ? "text-blue-100" : "text-gray-500"
                                  }`}
                                >
                                  {preview}
                                </p>
                              )}
                            </div>
                            <span
                              className={`text-xs flex-shrink-0 transition-none ${
                                isActive ? "text-blue-100" : "text-gray-400"
                              }`}
                            >
                              {formatRelativeTime(
                                conv.last_updated || conv.created_at
                              )}
                            </span>
                          </div>
                        </button>
                        
                        {/* Delete */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConversation(conv.conversation_id);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-500/20 rounded-lg"
                          aria-label="Delete conversation"
                        >
                          <TrashIcon className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Profile */}
      <div className="border-t border-gray-200/50 p-4">
        <div
          className={`flex items-center ${
            shouldCollapse ? "justify-center" : "space-x-3"
          }`}
        >
          <div className="relative group">
            <UserCircleIcon className="h-8 w-8 text-gray-600 hover:text-blue-500 transition-colors duration-150" />
          </div>
          {!shouldCollapse && (
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-800">{userName}</h3>
              <p className="text-xs text-gray-500">{userRole}</p>
            </div>
          )}
          {!shouldCollapse && (
            <button
              onClick={handleLogout}
              className="p-1.5 hover:bg-red-100 rounded-lg transition-colors duration-150"
              aria-label="Logout"
            >
              <ArrowRightStartOnRectangleIcon className="h-5 w-5 text-red-500 hover:text-red-600 transition-colors duration-150" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}