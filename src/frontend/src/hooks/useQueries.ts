import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  DashboardStats,
  Ingredient,
  IngredientUsage,
  MenuItem,
  MenuItemId,
  Notification,
  ReportStats,
  SaleId,
  SaleRecord,
  UserProfile,
} from "../backend.d";
import { useActor } from "./useActor";

// ─── Ingredients ────────────────────────────────────────────────────────────

export function useIngredients() {
  const { actor, isFetching } = useActor();
  return useQuery<Ingredient[]>({
    queryKey: ["ingredients"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getIngredients();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useLowStockIngredients() {
  const { actor, isFetching } = useActor();
  return useQuery<Ingredient[]>({
    queryKey: ["low-stock"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLowStockIngredients();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTotalInventoryValue() {
  const { actor, isFetching } = useActor();
  return useQuery<number>({
    queryKey: ["total-inventory-value"],
    queryFn: async () => {
      if (!actor) return 0;
      return actor.getTotalInventoryValue();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddIngredient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      quantity: number;
      unit: string;
      cost_price: number;
      supplier: string;
      threshold: number;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addIngredient(
        data.name,
        data.quantity,
        data.unit,
        data.cost_price,
        data.supplier,
        data.threshold,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["total-inventory-value"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });
}

export function useUpdateIngredient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      name: string;
      quantity: number;
      unit: string;
      cost_price: number;
      supplier: string;
      threshold: number;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateIngredient(
        data.id,
        data.name,
        data.quantity,
        data.unit,
        data.cost_price,
        data.supplier,
        data.threshold,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["total-inventory-value"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });
}

export function useDeleteIngredient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteIngredient(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["total-inventory-value"] });
    },
  });
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export function useDashboardStats() {
  const { actor, isFetching } = useActor();
  return useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      if (!actor) {
        return {
          daily_sales: 0,
          weekly_sales: 0,
          monthly_sales: 0,
          total_revenue: 0,
          total_profit: 0,
          top_sellers: [],
          recent_transactions: [],
        };
      }
      return actor.getDashboardStats();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Notifications ───────────────────────────────────────────────────────────

export function useNotifications() {
  const { actor, isFetching } = useActor();
  return useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getNotifications();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUnreadCount() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["unread-count"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getUnreadCount();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.markNotificationRead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.markAllNotificationsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });
}

// ─── Menu Items ───────────────────────────────────────────────────────────────

export function useMenuItems() {
  const { actor, isFetching } = useActor();
  return useQuery<MenuItem[]>({
    queryKey: ["menu-items"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMenuItems();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddMenuItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      selling_price: number;
      cost_per_bowl: number;
      ingredientUsage: IngredientUsage[];
    }): Promise<MenuItemId> => {
      if (!actor) throw new Error("Not connected");
      return actor.addMenuItem(
        data.name,
        data.description,
        data.selling_price,
        data.cost_per_bowl,
        data.ingredientUsage,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
    },
  });
}

export function useUpdateMenuItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: MenuItemId;
      name: string;
      description: string;
      selling_price: number;
      cost_per_bowl: number;
      ingredientUsage: IngredientUsage[];
    }): Promise<void> => {
      if (!actor) throw new Error("Not connected");
      return actor.updateMenuItem(
        data.id,
        data.name,
        data.description,
        data.selling_price,
        data.cost_per_bowl,
        data.ingredientUsage,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
    },
  });
}

export function useDeleteMenuItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: MenuItemId): Promise<void> => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteMenuItem(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
    },
  });
}

export function useSeedMenuItems() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      if (!actor) throw new Error("Not connected");
      return actor.seedMenuItems();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
    },
  });
}

// ─── Sales ────────────────────────────────────────────────────────────────────

export function useSales() {
  const { actor, isFetching } = useActor();
  return useQuery<SaleRecord[]>({
    queryKey: ["sales"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSales();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRecordSale() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      menu_item_id: MenuItemId;
      quantity: bigint;
    }): Promise<SaleId> => {
      if (!actor) throw new Error("Not connected");
      return actor.recordSale(data.menu_item_id, data.quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useDeleteSale() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: SaleId): Promise<void> => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteSale(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export function useReportStats(from: bigint, to: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<ReportStats>({
    queryKey: ["report-stats", from.toString(), to.toString()],
    queryFn: async () => {
      if (!actor) {
        return {
          total_units: 0n,
          total_orders: 0n,
          total_revenue: 0,
          total_profit: 0,
          avg_order_value: 0,
          daily_breakdown: [],
          top_sellers: [],
        };
      }
      return actor.getReportStats(from, to);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useReportSalesByDateRange(from: bigint, to: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<SaleRecord[]>({
    queryKey: ["report-sales", from.toString(), to.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSalesByDateRange(from, to);
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── User Profile ────────────────────────────────────────────────────────────

export function useCallerUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["caller-profile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caller-profile"] });
    },
  });
}
