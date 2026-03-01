import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AlertTriangle, Bell, CheckCheck, Clock, Info, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { Notification } from "../backend.d";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from "../hooks/useQueries";
import { formatDate } from "../utils/format";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function getNotifIcon(type: string) {
  switch (type.toLowerCase()) {
    case "low_stock":
      return <AlertTriangle size={15} className="text-warning" />;
    case "expiry":
      return <Clock size={15} className="text-destructive" />;
    default:
      return <Info size={15} className="text-primary" />;
  }
}

function NotificationItem({
  notif,
  onRead,
}: {
  notif: Notification;
  onRead: (id: bigint) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (!notif.is_read) onRead(notif.id);
      }}
      className={cn(
        "w-full text-left px-4 py-3 border-b border-border hover:bg-accent/50 transition-colors",
        !notif.is_read && "bg-primary/5",
      )}
    >
      <div className="flex gap-3 items-start">
        <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full bg-accent flex items-center justify-center">
          {getNotifIcon(notif.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm leading-snug",
              !notif.is_read
                ? "font-medium text-foreground"
                : "text-muted-foreground",
            )}
          >
            {notif.message}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {formatDate(notif.created_at)}
          </p>
        </div>
        {!notif.is_read && (
          <span className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-primary" />
        )}
      </div>
    </button>
  );
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { data: notifications, isLoading } = useNotifications();
  const { data: unreadCount } = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const unread = Number(unreadCount ?? 0);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const handleMarkRead = (id: bigint) => {
    markRead.mutate(id, {
      onError: () => toast.error("Failed to mark notification as read"),
    });
  };

  const handleMarkAll = () => {
    markAll.mutate(undefined, {
      onSuccess: () => toast.success("All notifications marked as read"),
      onError: () => toast.error("Failed to mark all as read"),
    });
  };

  const skeletonKeys = ["sk-n1", "sk-n2", "sk-n3", "sk-n4", "sk-n5"];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={onClose}
          onKeyDown={(e) => e.key === "Escape" && onClose()}
          role="presentation"
        />
      )}

      {/* Panel — using <dialog> semantics via div with role */}
      <div
        ref={panelRef}
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-card border-l border-border shadow-2xl flex flex-col transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
        aria-label="Notifications"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-primary" />
            <h2 className="font-display font-semibold text-base">
              Notifications
            </h2>
            {unread > 0 && (
              <Badge
                variant="destructive"
                className="text-[10px] px-1.5 py-0.5 h-auto"
              >
                {unread}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAll}
                disabled={markAll.isPending}
                className="text-xs h-8 text-primary hover:text-primary"
              >
                <CheckCheck size={14} className="mr-1" />
                Mark all read
              </Button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Close notifications"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {skeletonKeys.map((k) => (
                <div key={k} className="flex gap-3">
                  <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : !notifications?.length ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-3">
                <Bell size={20} className="text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground mb-1">All caught up!</p>
              <p className="text-sm text-muted-foreground">
                No notifications yet.
              </p>
            </div>
          ) : (
            <div>
              {notifications.map((notif) => (
                <NotificationItem
                  key={Number(notif.id)}
                  notif={notif}
                  onRead={handleMarkRead}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </>
  );
}
