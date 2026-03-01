import { cn } from "@/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";
import {
  BarChart2,
  LayoutDashboard,
  Leaf,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/inventory", icon: Package, label: "Inventory" },
  { to: "/menu", icon: UtensilsCrossed, label: "Menu" },
  { to: "/sales", icon: ShoppingCart, label: "Sales" },
  { to: "/reports", icon: BarChart2, label: "Reports" },
  { to: "/settings", icon: Settings, label: "Settings" },
] as const;

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-30 h-full w-60 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 ease-in-out",
        "lg:relative lg:translate-x-0 lg:z-auto",
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
      )}
    >
      {/* Brand */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0">
            <img
              src="/assets/uploads/Salad-Khatora-1.jpeg"
              alt="Salad Khatora"
              className="w-9 h-9 object-contain rounded-lg"
            />
          </div>
          <div>
            <p className="font-display font-semibold text-base leading-tight">
              Salad Khatora
            </p>
            <p className="text-sidebar-foreground/60 text-xs">Admin Panel</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors p-1 rounded"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive =
            location.pathname === to || location.pathname.startsWith(`${to}/`);
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-white/20 text-white shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-5 border-t border-sidebar-border pt-4">
        <div className="flex items-center gap-2.5 px-3 py-2 mb-3 rounded-lg bg-white/10">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <Leaf size={14} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">Admin</p>
            <p className="text-[10px] text-sidebar-foreground/60 truncate">
              admin@saladkhatora.com
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-sidebar-foreground/80 hover:bg-red-500/20 hover:text-white transition-all duration-150"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
