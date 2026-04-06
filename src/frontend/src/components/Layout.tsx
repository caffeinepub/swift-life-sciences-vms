import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  BarChart3,
  Bell,
  ChevronDown,
  ClipboardCheck,
  DoorOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PackageCheck,
  PackageOpen,
  ScanLine,
  Settings,
  Truck,
  UserCog,
  Users,
  Warehouse,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AppUser } from "../mockData";
import type {
  AppView,
  CurrentUser,
  Material,
  Notification,
  ReturnRepairItem,
  StoreInwardItem,
} from "../types";
import { NotificationPanel } from "./NotificationPanel";

interface LayoutProps {
  children: React.ReactNode;
  currentUser: CurrentUser;
  currentView: AppView;
  notifications: Notification[];
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  storeItems?: StoreInwardItem[];
  materials?: Material[];
  currentUserData?: AppUser | null;
  returnRepairItems?: ReturnRepairItem[];
}

type NavRole =
  | "admin"
  | "employee"
  | "security"
  | "dispatch_manager"
  | "store_manager";

interface NavItem {
  id: AppView;
  label: string;
  icon: React.ReactNode;
  roles: NavRole[];
}

const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard size={18} />,
    roles: ["admin"],
  },
  {
    id: "gate-entry",
    label: "Gate Entry",
    icon: <DoorOpen size={18} />,
    roles: ["security"],
  },
  {
    id: "visitor-form",
    label: "Visitors",
    icon: <Users size={18} />,
    roles: ["admin"],
  },
  {
    id: "material-form",
    label: "Materials",
    icon: <Package size={18} />,
    roles: ["admin"],
  },
  {
    id: "other-form",
    label: "Other Entries",
    icon: <ClipboardCheck size={18} />,
    roles: ["admin"],
  },
  {
    id: "employee-approvals",
    label: "My Approvals",
    icon: <ClipboardCheck size={18} />,
    roles: ["employee", "admin"],
  },
  {
    id: "security-exit",
    label: "Pending Exit",
    icon: <DoorOpen size={18} />,
    roles: ["security", "admin"],
  },
  {
    id: "material-inward-verify",
    label: "Material Verify",
    icon: <PackageOpen size={18} />,
    roles: ["security", "admin"],
  },
  {
    id: "dispatch-gatepass",
    label: "Dispatch Gatepass",
    icon: <Truck size={18} />,
    roles: ["dispatch_manager", "admin"],
  },
  {
    id: "security-dispatch-verify",
    label: "Dispatch Verify",
    icon: <ScanLine size={18} />,
    roles: ["security", "admin"],
  },
  {
    id: "security-return-verify",
    label: "Return Verify",
    icon: <PackageCheck size={18} />,
    roles: ["security", "admin"],
  },
  {
    id: "store-inward",
    label: "Store Inward",
    icon: <Warehouse size={18} />,
    roles: ["store_manager", "admin"],
  },
  {
    id: "reports",
    label: "Reports",
    icon: <BarChart3 size={18} />,
    roles: ["admin"],
  },
  {
    id: "admin-users",
    label: "User Management",
    icon: <UserCog size={18} />,
    roles: ["admin"],
  },
];

const ROLE_LABELS: Record<NavRole, string> = {
  admin: "Administrator",
  employee: "Employee",
  security: "Security Guard",
  dispatch_manager: "Dispatch Manager",
  store_manager: "Store Manager",
};

export function Layout({
  children,
  currentUser,
  currentView,
  notifications,
  onNavigate,
  onLogout,
  onMarkAllRead,
  onClearAll,
  storeItems,
  materials,
  currentUserData,
  returnRepairItems,
}: LayoutProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNav = navItems.filter((item) =>
    (item.roles as string[]).includes(currentUser.role),
  );

  // Badge counts
  const pendingStoreCount =
    storeItems?.filter((s) => !s.acknowledged).length ?? 0;
  const pendingMaterialInCount =
    materials?.filter((m) => m.type === "In" && m.status === "Pending")
      .length ?? 0;
  // Repair items pending Security outgoing verification — show in Dispatch Verify tab
  const pendingDispatchVerifyRepairCount =
    returnRepairItems?.filter((i) => i.status === "PendingSecurityOut")
      .length ?? 0;
  // Return verify: items pending Security inward verification on return
  const pendingReturnVerifyCount =
    returnRepairItems?.filter((i) => i.status === "PendingReturnVerify")
      .length ?? 0;
  const pendingDispatchAcceptCount =
    returnRepairItems?.filter((i) => i.status === "PendingDispatchAccept")
      .length ?? 0;

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const roleLabel =
    ROLE_LABELS[currentUser.role as NavRole] ?? currentUser.role;

  const getBadgeCount = (itemId: AppView): number => {
    if (itemId === "store-inward") return pendingStoreCount;
    if (itemId === "material-inward-verify") return pendingMaterialInCount;
    if (itemId === "security-dispatch-verify")
      return pendingDispatchVerifyRepairCount;
    if (itemId === "security-return-verify") return pendingReturnVerifyCount;
    if (itemId === "dispatch-gatepass") return pendingDispatchAcceptCount;
    return 0;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: overlay
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`sidebar fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          background: "linear-gradient(180deg, #B71C1C 0%, #8B0000 100%)",
        }}
      >
        {/* Logo Block */}
        <div className="flex flex-col items-center px-4 py-5 border-b border-red-900/40">
          <div className="flex items-center gap-3 w-full">
            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src="/assets/logo-019d6222-36be-748a-bc3b-3755cb68bffb.jpg"
                alt="Swift Life Sciences"
                className="w-11 h-11 object-contain rounded-lg"
              />
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm leading-tight">
                SWIFT LIFE
              </p>
              <p className="text-white font-bold text-sm leading-tight">
                SCIENCES
              </p>
              <p className="text-red-200 text-[10px] leading-tight mt-0.5 truncate">
                Gate Pass System
              </p>
            </div>
          </div>
          <p className="text-red-200/70 text-[10px] mt-2 text-center leading-tight">
            D-1, Sara Industrial Estate, Selaqui
          </p>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <p className="text-red-300/60 text-[10px] font-semibold uppercase tracking-wider px-4 mb-2">
            Navigation
          </p>
          <ul className="space-y-0.5 px-2">
            {filteredNav.map((item) => {
              const badge = getBadgeCount(item.id);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    data-ocid={`nav.${item.id}.link`}
                    onClick={() => {
                      onNavigate(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      currentView === item.id
                        ? "bg-white/20 text-white border-l-2 border-white"
                        : "text-red-100 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {badge > 0 && (
                      <span className="ml-auto bg-white text-[#B71C1C] text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom user section */}
        <div className="p-3 border-t border-red-900/40 space-y-1">
          {currentUser.role === "admin" && (
            <button
              type="button"
              data-ocid="nav.settings.link"
              onClick={() => {
                onNavigate("settings");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                currentView === "settings"
                  ? "bg-white/20 text-white border-l-2 border-white"
                  : "text-red-100 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Settings size={18} />
              Settings
            </button>
          )}
          <button
            type="button"
            data-ocid="nav.logout.button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-100 hover:bg-white/10 hover:text-white transition-all"
          >
            <LogOut size={18} />
            Logout
          </button>

          {/* User info block */}
          <div className="px-3 pt-2 pb-1">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-white/20 text-white text-xs font-bold">
                  {currentUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold leading-tight truncate">
                  {currentUser.name}
                </p>
                {currentUserData?.employeeId && (
                  <p className="text-red-200 text-[10px] font-mono leading-tight">
                    {currentUserData.employeeId}
                  </p>
                )}
                <p className="text-red-300/80 text-[10px] leading-tight">
                  {roleLabel}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP HEADER */}
        <header
          className="app-header bg-white border-b border-gray-200 h-16 flex items-center px-4 lg:px-6 gap-4 flex-shrink-0"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          {/* Mobile menu */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          {/* Welcome */}
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-gray-900 truncate">
              Welcome to Gate Pass Dashboard
            </p>
            <p className="text-xs text-gray-500">
              {formatDate(currentTime)} &nbsp;&bull;&nbsp;{" "}
              {formatTime(currentTime)}
            </p>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                data-ocid="notifications.bell.button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Bell size={20} className="text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#D32F2F] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-12 z-50">
                  <NotificationPanel
                    notifications={notifications}
                    onMarkAllRead={onMarkAllRead}
                    onClearAll={onClearAll}
                    onClose={() => setShowNotifications(false)}
                  />
                </div>
              )}
            </div>

            {/* User info */}
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-[#D32F2F] text-white text-xs font-bold">
                  {currentUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-gray-900 leading-tight">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-gray-500">{roleLabel}</p>
              </div>
              <ChevronDown size={14} className="text-gray-400" />
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="main-content flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
