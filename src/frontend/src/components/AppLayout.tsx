import { Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "./Header";
import { NotificationPanel } from "./NotificationPanel";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
          role="presentation"
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onBellClick={() => setNotifOpen((v) => !v)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Notification slide-in panel */}
      <NotificationPanel
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
      />
    </div>
  );
}
