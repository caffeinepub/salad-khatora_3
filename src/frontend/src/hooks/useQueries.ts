import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DashboardStats, Ingredient, Notification } from "../backend.d";
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
