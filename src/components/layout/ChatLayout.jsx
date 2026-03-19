import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "../ui/dropdown-menu";
import {
  Plus, MessageSquare, FileText, PenTool, Calendar,
  BarChart3, Scale, CreditCard, LogOut,
  Menu, X, ChevronDown, Trash2,
  LayoutDashboard, GraduationCap
} from "lucide-react";
import { API } from "../../App";

const ChatLayout = ({
  children, user, chatSessions = [], onNewChat, onSelectChat,
  onDeleteChat, onClearAllChats, currentChatId, refreshChats
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/tests",        label: "Mock Tests",    icon: <FileText   className="w-4 h-4" /> },
    { path: "/drafting",     label: "Drafting Lab",  icon: <PenTool    className="w-4 h-4" /> },
    { path: "/planner",      label: "Study Planner", icon: <Calendar   className="w-4 h-4" /> },
    { path: "/caselaws",     label: "Case Laws",     icon: <Scale      className="w-4 h-4" /> },
    { path: "/analytics",    label: "Analytics",     icon: <BarChart3  className="w-4 h-4" /> },
    { path: "/subscription", label: "Subscription",  icon: <CreditCard className="w-4 h-4" /> },
  ];

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      localStorage.removeItem("token");
      toast.success("Logged out successfully");
      navigate("/");
    } catch {
      localStorage.removeItem("token");
      navigate("/");
    }
  };

  const isActive     = (path)   => location.pathname === path;
  const isChatActive = (chatId) => currentChatId === chatId;

  const formatDate = (dateString) => {
    const date     = new Date(dateString);
    const now      = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7)   return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const groupedChats = chatSessions.reduce((groups, chat) => {
    const dateKey = formatDate(chat.updated_at || chat.created_at);
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(chat);
    return groups;
  }, {});

  const sharedProps = {
    user, navItems, groupedChats, chatSessions,
    onDeleteChat, onClearAllChats, refreshChats,
    isChatActive, isActive, handleLogout, navigate,
  };

  return (
    <div className="h-screen flex bg-slate-900 overflow-hidden">

      {/* ── Mobile Header ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-700">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:bg-slate-800 rounded-lg"
            data-testid="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white text-sm">STEMS AI</span>
          </div>
          <Button
            onClick={onNewChat}
            size="sm"
            className="bg-slate-800 hover:bg-slate-700 text-white"
            data-testid="mobile-new-chat-btn"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* ── Mobile Sidebar Overlay ── */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className="w-72 h-full bg-slate-900 border-r border-slate-700"
            onClick={e => e.stopPropagation()}
          >
            <SidebarContent
              {...sharedProps}
              onNewChat={() => { onNewChat(); setMobileMenuOpen(false); }}
              onSelectChat={(id) => { onSelectChat(id); setMobileMenuOpen(false); }}
            />
          </aside>
        </div>
      )}

      {/* ── Desktop Sidebar ── */}
      <aside
        className={`hidden lg:flex flex-col bg-slate-900 border-r border-slate-700 transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-0 overflow-hidden"
        }`}
      >
        <SidebarContent
          {...sharedProps}
          onNewChat={onNewChat}
          onSelectChat={onSelectChat}
          sidebarOpen={sidebarOpen}
        />
      </aside>

      {/* ── Toggle Sidebar Button ── */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="hidden lg:flex absolute top-1/2 -translate-y-1/2 z-50 w-6 h-12 bg-slate-800 hover:bg-slate-700 items-center justify-center rounded-r-lg border border-l-0 border-slate-700 text-slate-400 hover:text-white transition-all"
        style={{ left: sidebarOpen ? "256px" : "0px" }}
        data-testid="toggle-sidebar-btn"
      >
        <ChevronDown className={`w-4 h-4 transition-transform ${sidebarOpen ? "-rotate-90" : "rotate-90"}`} />
      </button>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col h-screen pt-14 lg:pt-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   SidebarContent — owns all selection-mode state
   ═══════════════════════════════════════════════════════════ */
const SidebarContent = ({
  user, navItems, groupedChats, chatSessions,
  onNewChat, onSelectChat,
  onDeleteChat, refreshChats,
  isChatActive, isActive, handleLogout, navigate,
}) => {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds,   setSelectedIds]   = useState(new Set());
  const [isDeleting,    setIsDeleting]    = useState(false);

  const totalChats = chatSessions.length;

  const enterSelectionMode  = () => { setSelectionMode(true);  setSelectedIds(new Set()); };
  const cancelSelectionMode = () => { setSelectionMode(false); setSelectedIds(new Set()); };

  const toggleSelect = (chatId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(chatId) ? next.delete(chatId) : next.add(chatId);
      return next;
    });
  };

  const selectAll   = () => setSelectedIds(new Set(chatSessions.map(c => c.chat_id)));
  const deselectAll = () => setSelectedIds(new Set());

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0 || isDeleting) return;
    const count = selectedIds.size;
    const idsToDelete = Array.from(selectedIds);
    setIsDeleting(true);
    try {
      // Fire all deletes in parallel — no sequential React state updates mid-loop
      await Promise.all(
        idsToDelete.map(id =>
          axios.delete(`${API}/chats/${id}`, {
            headers: getAuthHeaders(),
            withCredentials: true,
          })
        )
      );
      toast.success(`Deleted ${count} chat${count > 1 ? "s" : ""}`);
      cancelSelectionMode();
      // Refresh the parent chat list once after all deletes complete
      if (refreshChats) refreshChats();
    } catch {
      toast.error("Some chats could not be deleted");
    } finally {
      // Always reset — prevents the "stuck at Deleting…" bug
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">

      {/* ── Logo + Header Buttons ── */}
      <div className="p-3 border-b border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white" style={{ fontFamily: "Outfit" }}>STEMS AI</span>
        </div>

        {/* + New Chat  |  🗑 Delete */}
        <div className="flex gap-2">
          <Button
            onClick={onNewChat}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 justify-start gap-2"
            data-testid="new-chat-btn"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>

          {totalChats > 0 && !selectionMode && (
            <Button
              onClick={enterSelectionMode}
              variant="ghost"
              className="px-3 text-slate-400 hover:text-red-400 hover:bg-slate-800 border border-slate-700 gap-1.5"
              title="Select chats to delete"
              data-testid="enter-selection-mode-btn"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-xs">Delete</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Selection Mode Action Bar ── */}
      {selectionMode && (
        <div className="px-3 py-2.5 border-b border-slate-700 bg-slate-800/50 space-y-2">
          {/* Delete Selected + Cancel */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteSelected}
              disabled={selectedIds.size === 0 || isDeleting}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                selectedIds.size > 0
                  ? "bg-red-600 hover:bg-red-700 text-white shadow-sm"
                  : "bg-slate-700 text-slate-500 cursor-not-allowed"
              }`}
              data-testid="delete-selected-btn"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isDeleting
                ? "Deleting…"
                : selectedIds.size > 0
                  ? `Delete Selected (${selectedIds.size})`
                  : "Select chats below"}
            </button>

            <button
              onClick={cancelSelectionMode}
              className="px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700"
              data-testid="cancel-selection-btn"
            >
              Cancel
            </button>
          </div>

          {/* Select all / Deselect all */}
          <button
            onClick={selectedIds.size === totalChats ? deselectAll : selectAll}
            className="w-full text-left text-xs text-slate-500 hover:text-indigo-400 px-0.5 transition-colors"
            data-testid="select-all-btn"
          >
            {selectedIds.size === totalChats
              ? "✕  Deselect all"
              : `✓  Select all (${totalChats})`}
          </button>
        </div>
      )}

      {/* ── Chat History ── */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-2">

            {/* Section label */}
            {Object.keys(groupedChats).length > 0 && (
              <div className="px-2 py-1.5 mb-1">
                <span className="text-xs text-slate-500 font-medium">
                  {selectionMode
                    ? selectedIds.size === 0 ? "Tap to select chats" : `${selectedIds.size} selected`
                    : "History"}
                </span>
              </div>
            )}

            {Object.entries(groupedChats).map(([date, chats]) => (
              <div key={date} className="mb-4">
                <p className="text-xs text-slate-500 px-2 py-1 font-medium">{date}</p>

                {chats.map((chat) => {
                  const isSelected = selectedIds.has(chat.chat_id);

                  return (
                    <div
                      key={chat.chat_id}
                      onClick={() =>
                        selectionMode
                          ? toggleSelect(chat.chat_id)
                          : onSelectChat(chat.chat_id)
                      }
                      className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all min-w-0 ${
                        selectionMode
                          ? isSelected
                            ? "bg-red-500/15 border border-red-500/40 text-white"
                            : "text-slate-300 hover:bg-slate-800 border border-transparent"
                          : isChatActive(chat.chat_id)
                            ? "bg-slate-700 text-white border border-transparent"
                            : "text-slate-300 hover:bg-slate-800 border border-transparent"
                      }`}
                      data-testid={`chat-item-${chat.chat_id}`}
                    >
                      {/* Checkbox OR message icon */}
                      {selectionMode ? (
                        <div
                          className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                            isSelected
                              ? "bg-red-500 border-red-500"
                              : "border-slate-500 bg-transparent"
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                              <path
                                d="M1.5 5l2.5 2.5 4.5-4.5"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                      ) : (
                        <MessageSquare className="w-4 h-4 flex-shrink-0 text-slate-400" />
                      )}

                      {/* Title — truncates cleanly */}
                      <span className="flex-1 truncate text-sm min-w-0">
                        {chat.title || "New Chat"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}

            {Object.keys(groupedChats).length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No chat history</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* ── Navigation Grid ── */}
      <div className="border-t border-slate-700 p-2">
        <div className="grid grid-cols-3 gap-1 mb-2">
          {navItems.slice(0, 6).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                isActive(item.path)
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
              title={item.label}
              data-testid={`nav-${item.path.slice(1)}`}
            >
              {item.icon}
              <span className="text-[10px] truncate w-full text-center">{item.label.split(" ")[0]}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── User Profile ── */}
      <div className="p-3 border-t border-slate-700">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-indigo-600 text-white text-xs font-medium">
                  {user?.name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name || "User"}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate("/dashboard")}>
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/analytics")}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/subscription")}>
              <CreditCard className="w-4 h-4 mr-2" />
              Subscription
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-500">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ChatLayout;
