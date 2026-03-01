import { useLocation } from "@tanstack/react-router";
import { Bell, Menu } from "lucide-react";
import { useUnreadCount } from "../hooks/useQueries";

interface HeaderProps {
  onMenuClick: () => void;
  onBellClick: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/inventory": "Inventory Management",
  "/sales": "Sales",
};

export function Header({ onMenuClick, onBellClick }: HeaderProps) {
  const location = useLocation();
  const { data: unreadCount } = useUnreadCount();
  const unread = Number(unreadCount ?? 0);

  const title = PAGE_TITLES[location.pathname] ?? "Salad Khatora";

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 flex-shrink-0 shadow-xs">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="font-display font-semibold text-lg text-foreground">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBellClick}
          className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        >
          <Bell size={20} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
