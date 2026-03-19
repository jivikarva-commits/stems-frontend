import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  GraduationCap, LayoutDashboard, BookOpen, FileText,
  PenTool, Calendar, BarChart3, Scale, CreditCard,
  Settings, LogOut, Menu, X, ChevronRight, Bell, BookMarked, PlayCircle,
} from "lucide-react";
import { API } from "../../App";

// ─────────────────────────────────────────────────────────────────────────────
// DashboardLayout
//
// Props:
//   children      – page content
//   user          – current user object
//   headerAction  – optional ReactNode injected into the top-right header slot
//                   (e.g. an "Export PDF" icon button from StudyPlanner)
// ─────────────────────────────────────────────────────────────────────────────
const DashboardLayout = ({ children, user, headerAction }) => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [sidebarOpen,    setSidebarOpen]    = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/dashboard",    label: "Dashboard",     icon: <LayoutDashboard className="w-5 h-5" /> },
    { path: "/learn",           label: "Learn",           icon: <BookOpen        className="w-5 h-5" /> },
    { path: "/lectures",        label: "Video Lectures",  icon: <PlayCircle      className="w-5 h-5" /> },
    { path: "/tests",           label: "Mock Tests",      icon: <FileText        className="w-5 h-5" /> },
    { path: "/drafting",     label: "Drafting Lab",   icon: <PenTool         className="w-5 h-5" /> },
    { path: "/planner",      label: "Study Planner",  icon: <Calendar        className="w-5 h-5" /> },
    { path: "/analytics",    label: "Analytics",      icon: <BarChart3       className="w-5 h-5" /> },
    { path: "/caselaws",        label: "Case Laws",       icon: <Scale           className="w-5 h-5" /> },
    { path: "/revision-notes",  label: "Revision Notes",  icon: <BookMarked      className="w-5 h-5" /> },
    { path: "/subscription",    label: "Subscription",    icon: <CreditCard      className="w-5 h-5" /> },
  ];

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (_) {}
    localStorage.removeItem("token");
    toast.success("Logged out successfully");
    navigate("/");
  };

  const isActive    = (path) => location.pathname === path;
  const pageTitle   = navItems.find((i) => isActive(i.path))?.label ?? "Revision Notes";

  return (
    // Root — fills viewport, no body scroll, no horizontal overflow
    <div className="flex h-[100dvh] bg-slate-50 overflow-hidden">

      {/* ── DESKTOP SIDEBAR ─────────────────────────────────────────────── */}
      <aside
        className={`
          hidden lg:flex flex-col flex-shrink-0
          bg-white border-r border-slate-200
          transition-all duration-300 overflow-hidden
          ${sidebarOpen ? "w-64" : "w-[72px]"}
        `}
      >
        {/* Logo row */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 flex-shrink-0 min-w-0">
          <Link to="/dashboard" className="flex items-center gap-2 min-w-0 overflow-hidden">
            <div className="w-9 h-9 bg-indigo-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <span className="text-lg font-bold text-slate-900 truncate" style={{ fontFamily: "Outfit" }}>
                STEMS AI
              </span>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg flex-shrink-0"
            data-testid="sidebar-toggle-btn"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              title={!sidebarOpen ? item.label : undefined}
              data-testid={`nav-${item.path.slice(1)}`}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-colors whitespace-nowrap overflow-hidden
                ${isActive(item.path)
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}
                ${!sidebarOpen ? "justify-center px-2" : ""}
              `}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="p-2 border-t border-slate-200 flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`
                  flex items-center gap-3 w-full p-2 rounded-lg
                  hover:bg-slate-100 transition-colors overflow-hidden
                  ${!sidebarOpen ? "justify-center" : ""}
                `}
              >
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={user?.picture} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 font-medium text-sm">
                    {user?.name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                {sidebarOpen && (
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{user?.name || "User"}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.level || "Executive"}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <Settings className="w-4 h-4 mr-2" /> Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* ── RIGHT COLUMN ────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* ── MOBILE HEADER ─────────────────────────────────────────────── */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur border-b border-slate-200 flex-shrink-0 z-50">
          {/* Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-1 text-slate-600 hover:bg-slate-100 rounded-lg"
            data-testid="mobile-menu-btn"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-indigo-700 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-sm" style={{ fontFamily: "Outfit" }}>
              STEMS AI
            </span>
          </Link>

          {/* Right slot: injected page action + avatar */}
          <div className="flex items-center gap-1">
            {headerAction && headerAction}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-0.5">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.picture} />
                    <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-medium">
                      {user?.name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <Settings className="w-4 h-4 mr-2" /> Profile Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* ── MOBILE SLIDE-IN DRAWER ────────────────────────────────────── */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          >
            <nav
              className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 flex-shrink-0">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-9 h-9 bg-indigo-700 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>
                    STEMS AI
                  </span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Nav links — scrollable */}
              <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium
                      transition-colors active:scale-[0.98]
                      ${isActive(item.path)
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-700 hover:bg-slate-100"}
                    `}
                  >
                    {item.icon}
                    <span className="flex-1">{item.label}</span>
                    {isActive(item.path) && (
                      <ChevronRight className="w-4 h-4 text-indigo-400" />
                    )}
                  </Link>
                ))}
              </div>

              {/* User row */}
              <div className="p-4 border-t border-slate-200 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={user?.picture} />
                    <AvatarFallback className="bg-indigo-100 text-indigo-700 font-medium">
                      {user?.name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || "User"}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </nav>
          </div>
        )}

        {/* ── DESKTOP STICKY HEADER ─────────────────────────────────────── */}
        <header className="hidden lg:flex items-center justify-between bg-white/95 backdrop-blur border-b border-slate-200 px-8 py-4 flex-shrink-0 sticky top-0 z-30">
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>
            {pageTitle}
          </h1>
          <div className="flex items-center gap-3">
            {/* Page-specific action injected here (e.g. Export PDF) */}
            {headerAction && headerAction}
            <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full">
              {user?.subscription_plan?.toUpperCase() || "FREE"} Plan
            </span>
          </div>
        </header>

        {/* ── PAGE CONTENT ──────────────────────────────────────────────── */}
        {/* flex-1 + overflow-y-auto = this scrolls, not the whole window    */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-4 md:p-6 lg:p-8 w-full max-w-screen-2xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
