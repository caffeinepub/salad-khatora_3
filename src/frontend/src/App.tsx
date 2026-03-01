import { Toaster } from "@/components/ui/sonner";
import {
  Navigate,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { AppLayout } from "./components/AppLayout";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { DashboardPage } from "./pages/DashboardPage";
import { InventoryPage } from "./pages/InventoryPage";
import { LoginPage } from "./pages/LoginPage";
import { SalesPage } from "./pages/SalesPage";

// Root route
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster position="top-right" richColors />
    </>
  ),
});

// Login route
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

// Protected layout route
const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  component: ProtectedLayout,
});

function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm font-medium">
            Loading...
          </p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return <AppLayout />;
}

// Index redirect
const indexRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/",
  component: () => <Navigate to="/dashboard" />,
});

// Dashboard
const dashboardRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/dashboard",
  component: DashboardPage,
});

// Inventory
const inventoryRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/inventory",
  component: InventoryPage,
});

// Sales
const salesRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/sales",
  component: SalesPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  protectedRoute.addChildren([
    indexRoute,
    dashboardRoute,
    inventoryRoute,
    salesRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
