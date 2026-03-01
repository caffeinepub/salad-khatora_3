import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type IngredientId = bigint;
export interface MenuItem {
    id: MenuItemId;
    updated_at: bigint;
    name: string;
    selling_price: number;
    description: string;
    created_at: bigint;
    ingredientUsage: Array<IngredientUsage>;
    cost_per_bowl: number;
}
export type MenuItemId = bigint;
export interface ReportStats {
    total_units: bigint;
    total_orders: bigint;
    total_revenue: number;
    top_sellers: Array<{
        revenue: number;
        name: string;
        units_sold: bigint;
    }>;
    avg_order_value: number;
    daily_breakdown: Array<{
        revenue: number;
        orders: bigint;
        profit: number;
        date_label: string;
    }>;
    total_profit: number;
}
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
export type NotificationId = bigint;
export interface Notification {
    id: NotificationId;
    is_read: boolean;
    type: string;
    created_at: bigint;
    message: string;
}
export type SaleId = bigint;
export interface SaleRecord {
    id: SaleId;
    total_amount: number;
    cost_amount: number;
    menu_item_name: string;
    created_at: bigint;
    unit_price: number;
    quantity: bigint;
    profit: number;
    menu_item_id: MenuItemId;
}
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
export interface IngredientUsage {
    quantity_used: number;
    ingredientName: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addIngredient(name: string, quantity: number, unit: string, cost_price: number, supplier: string, threshold: number): Promise<IngredientId>;
    addMenuItem(name: string, description: string, selling_price: number, cost_per_bowl: number, ingredientUsage: Array<IngredientUsage>): Promise<MenuItemId>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteIngredient(id: IngredientId): Promise<void>;
    deleteMenuItem(id: MenuItemId): Promise<void>;
    deleteSale(id: SaleId): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDashboardStats(): Promise<DashboardStats>;
    getIngredient(id: IngredientId): Promise<Ingredient>;
    getIngredients(): Promise<Array<Ingredient>>;
    getLowStockIngredients(): Promise<Array<Ingredient>>;
    getMenuItem(id: MenuItemId): Promise<MenuItem>;
    getMenuItems(): Promise<Array<MenuItem>>;
    getNotifications(): Promise<Array<Notification>>;
    getReportStats(from: bigint, to: bigint): Promise<ReportStats>;
    getSaleById(id: SaleId): Promise<SaleRecord>;
    getSales(): Promise<Array<SaleRecord>>;
    getSalesByDateRange(from: bigint, to: bigint): Promise<Array<SaleRecord>>;
    getTotalInventoryValue(): Promise<number>;
    getUnreadCount(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markAllNotificationsRead(): Promise<void>;
    markNotificationRead(id: NotificationId): Promise<void>;
    recordSale(menu_item_id: MenuItemId, quantity: bigint): Promise<SaleId>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    seedIngredients(): Promise<void>;
    seedMenuItems(): Promise<void>;
    updateIngredient(id: IngredientId, name: string, quantity: number, unit: string, cost_price: number, supplier: string, threshold: number): Promise<void>;
    updateMenuItem(id: MenuItemId, name: string, description: string, selling_price: number, cost_per_bowl: number, ingredientUsage: Array<IngredientUsage>): Promise<void>;
}
