import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Ingredient {
    id: IngredientId;
    updated_at: bigint;
    cost_price: number;
    low_stock_threshold: number;
    supplier: string;
    name: string;
    unit: string;
    created_at: bigint;
    quantity: number;
}
export interface Notification {
    id: NotificationId;
    is_read: boolean;
    type: string;
    created_at: bigint;
    message: string;
}
export type NotificationId = bigint;
export interface DashboardStats {
    recent_transactions: Array<{
        id: bigint;
        item: string;
        time: string;
        amount: number;
    }>;
    monthly_sales: number;
    weekly_sales: number;
    total_revenue: number;
    top_sellers: Array<{
        revenue: number;
        name: string;
        units_sold: bigint;
    }>;
    daily_sales: number;
    total_profit: number;
}
export interface UserProfile {
    name: string;
}
export type IngredientId = bigint;
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addIngredient(name: string, quantity: number, unit: string, cost_price: number, supplier: string, threshold: number): Promise<IngredientId>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteIngredient(id: IngredientId): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDashboardStats(): Promise<DashboardStats>;
    getIngredient(id: IngredientId): Promise<Ingredient>;
    getIngredients(): Promise<Array<Ingredient>>;
    getLowStockIngredients(): Promise<Array<Ingredient>>;
    getNotifications(): Promise<Array<Notification>>;
    getTotalInventoryValue(): Promise<number>;
    getUnreadCount(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markAllNotificationsRead(): Promise<void>;
    markNotificationRead(id: NotificationId): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    seedIngredients(): Promise<void>;
    updateIngredient(id: IngredientId, name: string, quantity: number, unit: string, cost_price: number, supplier: string, threshold: number): Promise<void>;
}
