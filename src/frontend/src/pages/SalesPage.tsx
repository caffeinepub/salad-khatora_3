import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  Calendar,
  Download,
  Loader2,
  ShoppingCart,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import type { SaleRecord } from "../backend.d";
import {
  useIngredients,
  useMenuItems,
  useRecordSale,
  useSales,
  useUpdateIngredient,
} from "../hooks/useQueries";
import { formatCurrency } from "../utils/format";

// ─── Date helpers (bigint nanoseconds) ───────────────────────────────────────

function nsToMs(ns: bigint): number {
  return Number(ns / 1_000_000n);
}

function isToday(ns: bigint): boolean {
  const d = new Date(nsToMs(ns));
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isWithinDays(ns: bigint, days: number): boolean {
  const ms = nsToMs(ns);
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return ms >= cutoff;
}

function formatDisplayDate(ns: bigint): string {
  return new Date(nsToMs(ns)).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

function exportSalesToCSV(sales: SaleRecord[]): void {
  const headers = [
    "Date",
    "Menu Item",
    "Qty",
    "Unit Price (₹)",
    "Total (₹)",
    "Cost (₹)",
    "Profit (₹)",
  ];
  const rows = sales.map((s) => [
    formatDisplayDate(s.created_at),
    s.menu_item_name,
    Number(s.quantity),
    s.unit_price.toFixed(2),
    s.total_amount.toFixed(2),
    s.cost_amount.toFixed(2),
    s.profit.toFixed(2),
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `salad-khatora-sales-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
  isLoading,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  isLoading?: boolean;
}) {
  return (
    <Card className="bg-card border-border shadow-card">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
              {title}
            </p>
            {isLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <p className="text-2xl font-bold text-foreground font-display">
                {formatCurrency(value)}
              </p>
            )}
          </div>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-3 ${color}`}
          >
            <Icon size={18} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Top Sellers ──────────────────────────────────────────────────────────────

function TopSellers({
  sales,
  isLoading,
}: {
  sales: SaleRecord[];
  isLoading?: boolean;
}) {
  const topItems = useMemo(() => {
    const map: Record<
      string,
      { name: string; units: number; revenue: number }
    > = {};
    for (const s of sales) {
      if (!map[s.menu_item_name]) {
        map[s.menu_item_name] = {
          name: s.menu_item_name,
          units: 0,
          revenue: 0,
        };
      }
      map[s.menu_item_name].units += Number(s.quantity);
      map[s.menu_item_name].revenue += s.total_amount;
    }
    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [sales]);

  const maxRevenue = topItems[0]?.revenue ?? 1;

  return (
    <Card className="bg-card border-border shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <TrendingUp size={16} className="text-primary" />
          Top Sellers
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {["ts1", "ts2", "ts3"].map((k) => (
              <div key={k} className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : topItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BarChart3
              size={28}
              className="text-muted-foreground mb-2 opacity-40"
            />
            <p className="text-sm font-medium text-foreground">
              No sales data yet
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Record your first sale to see top sellers.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {topItems.map((item, index) => {
              const pct = (item.revenue / maxRevenue) * 100;
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          index === 0
                            ? "bg-yellow-100 text-yellow-700"
                            : index === 1
                              ? "bg-gray-100 text-gray-600"
                              : index === 2
                                ? "bg-orange-100 text-orange-700"
                                : "bg-accent text-muted-foreground"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-foreground truncate">
                        {item.name}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {item.units} sold
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-primary flex-shrink-0">
                      {formatCurrency(item.revenue)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Record Sale ──────────────────────────────────────────────────────────────

function RecordSale() {
  const { data: ingredients } = useIngredients();
  const { data: menuItems, isLoading: menuLoading } = useMenuItems();
  const updateIngredient = useUpdateIngredient();
  const recordSaleMutation = useRecordSale();
  const queryClient = useQueryClient();

  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedMenuItem = menuItems?.find(
    (m) => String(m.id) === selectedItemId,
  );

  const qty = Math.max(1, Number.parseInt(quantity, 10) || 1);
  const totalAmount = selectedMenuItem
    ? selectedMenuItem.selling_price * qty
    : 0;
  const estimatedCost = selectedMenuItem
    ? selectedMenuItem.cost_per_bowl * qty
    : 0;
  const estimatedProfit = totalAmount - estimatedCost;

  const handleRecordSale = useCallback(async () => {
    if (!selectedMenuItem) {
      toast.error("Please select a menu item");
      return;
    }
    if (!qty || qty < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    setIsSubmitting(true);

    try {
      // Deduct inventory for each ingredient used
      if (ingredients && ingredients.length > 0) {
        const updates = selectedMenuItem.ingredientUsage
          .map((usage) => {
            const ingredient = ingredients.find(
              (ing) =>
                ing.name.toLowerCase().trim() ===
                usage.ingredientName.toLowerCase().trim(),
            );
            if (!ingredient) return null;
            const newQty = Math.max(
              0,
              ingredient.quantity - usage.quantity_used * qty,
            );
            return {
              id: ingredient.id,
              name: ingredient.name,
              quantity: newQty,
              unit: ingredient.unit,
              cost_price: ingredient.cost_price,
              supplier: ingredient.supplier,
              threshold: ingredient.low_stock_threshold,
            };
          })
          .filter((u): u is NonNullable<typeof u> => u !== null);

        // Fire all inventory updates in parallel
        await Promise.all(
          updates.map((update) =>
            updateIngredient.mutateAsync(update).catch((err) => {
              console.warn(`Failed to update ingredient ${update.name}:`, err);
            }),
          ),
        );
      }

      // Record sale in the backend
      await recordSaleMutation.mutateAsync({
        menu_item_id: selectedMenuItem.id,
        quantity: BigInt(qty),
      });

      // Invalidate all relevant caches
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sales"] }),
        queryClient.invalidateQueries({ queryKey: ["ingredients"] }),
        queryClient.invalidateQueries({ queryKey: ["low-stock"] }),
        queryClient.invalidateQueries({ queryKey: ["total-inventory-value"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
        queryClient.invalidateQueries({ queryKey: ["unread-count"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
      ]);

      toast.success(
        `Sale recorded: ${qty}× ${selectedMenuItem.name} — ${formatCurrency(totalAmount)}`,
      );

      // Reset form
      setSelectedItemId("");
      setQuantity("1");
    } catch (err) {
      console.error(err);
      toast.error("Failed to record sale. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedMenuItem,
    qty,
    ingredients,
    updateIngredient,
    recordSaleMutation,
    queryClient,
    totalAmount,
  ]);

  // Loading state
  if (menuLoading) {
    return (
      <Card className="bg-card border-border shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <ShoppingCart size={16} className="text-primary" />
            Record New Sale
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-9 lg:col-span-2" />
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // No menu items state
  if (!menuItems || menuItems.length === 0) {
    return (
      <Card className="bg-card border-border shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <ShoppingCart size={16} className="text-primary" />
            Record New Sale
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
            <UtensilsCrossed
              size={28}
              className="text-muted-foreground opacity-40"
            />
            <div>
              <p className="text-sm font-medium text-foreground">
                No menu items available
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add bowls from the{" "}
                <Link
                  to="/menu"
                  className="text-primary hover:underline font-medium"
                >
                  Menu Management
                </Link>{" "}
                page before recording sales.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <ShoppingCart size={16} className="text-primary" />
          Record New Sale
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Menu Item */}
          <div className="space-y-1.5 lg:col-span-2">
            <Label htmlFor="sale-item" className="text-sm font-medium">
              Menu Item
            </Label>
            <Select
              value={selectedItemId}
              onValueChange={setSelectedItemId}
              disabled={isSubmitting}
            >
              <SelectTrigger id="sale-item">
                <SelectValue placeholder="Select a salad bowl..." />
              </SelectTrigger>
              <SelectContent>
                {menuItems.map((item) => (
                  <SelectItem key={String(item.id)} value={String(item.id)}>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted-foreground ml-2">
                      — {formatCurrency(item.selling_price)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <Label htmlFor="sale-qty" className="text-sm font-medium">
              Quantity
            </Label>
            <Input
              id="sale-qty"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={isSubmitting}
              placeholder="1"
            />
          </div>

          {/* Record Button */}
          <div className="flex items-end">
            <Button
              onClick={() => void handleRecordSale()}
              disabled={isSubmitting || !selectedItemId}
              className="w-full bg-primary hover:bg-primary/90 gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <ShoppingCart size={15} />
                  Record Sale
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Auto-calculated preview */}
        {selectedMenuItem && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-primary/5 border border-primary/15 rounded-lg px-3 py-2.5">
              <p className="text-xs text-muted-foreground mb-0.5">
                Total Amount
              </p>
              <p className="text-sm font-semibold text-primary font-display">
                {formatCurrency(totalAmount)}
              </p>
            </div>
            <div className="bg-muted/50 border border-border rounded-lg px-3 py-2.5">
              <p className="text-xs text-muted-foreground mb-0.5">Est. Cost</p>
              <p className="text-sm font-semibold text-foreground font-display">
                {formatCurrency(estimatedCost)}
              </p>
            </div>
            <div
              className={`border rounded-lg px-3 py-2.5 ${
                estimatedProfit >= 0
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-destructive/5 border-destructive/20"
              }`}
            >
              <p className="text-xs text-muted-foreground mb-0.5">
                Est. Profit
              </p>
              <p
                className={`text-sm font-semibold font-display ${
                  estimatedProfit >= 0 ? "text-emerald-700" : "text-destructive"
                }`}
              >
                {formatCurrency(estimatedProfit)}
              </p>
            </div>
          </div>
        )}

        {/* Ingredient deduction preview */}
        {selectedMenuItem && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {selectedMenuItem.ingredientUsage.map((usage) => (
              <Badge
                key={usage.ingredientName}
                variant="outline"
                className="text-[11px] bg-accent/50 border-border text-muted-foreground"
              >
                {usage.ingredientName}: −{usage.quantity_used * qty}g
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Sales History Table ──────────────────────────────────────────────────────

function SalesHistoryTable({
  sales,
  isLoading,
}: {
  sales: SaleRecord[];
  isLoading?: boolean;
}) {
  const sorted = useMemo(
    () => [...sales].sort((a, b) => Number(b.created_at - a.created_at)),
    [sales],
  );

  return (
    <Card className="bg-card border-border shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            Sales History
            {sales.length > 0 && (
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/20 text-xs ml-1"
              >
                {sales.length} records
              </Badge>
            )}
          </CardTitle>
          {sales.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportSalesToCSV(sorted)}
              className="gap-1.5 h-8"
            >
              <Download size={13} />
              Export CSV
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {["sh1", "sh2", "sh3", "sh4", "sh5"].map((k) => (
              <div key={k} className="flex items-center gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28 flex-1" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingCart
              size={32}
              className="text-muted-foreground mb-3 opacity-30"
            />
            <p className="text-sm font-medium text-foreground">
              No sales recorded yet
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Use the form above to record your first sale.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                    Date & Time
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                    Menu Item
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap text-right">
                    Qty
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap text-right">
                    Unit Price
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap text-right">
                    Total
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap text-right">
                    Cost
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap text-right">
                    Profit
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((sale) => (
                  <TableRow
                    key={String(sale.id)}
                    className="hover:bg-accent/30 transition-colors"
                  >
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDisplayDate(sale.created_at)}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">
                      {sale.menu_item_name}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums text-right">
                      {Number(sale.quantity)}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums text-right text-muted-foreground">
                      {formatCurrency(sale.unit_price)}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums font-semibold text-primary text-right">
                      {formatCurrency(sale.total_amount)}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums text-muted-foreground text-right">
                      {formatCurrency(sale.cost_amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`text-sm tabular-nums font-semibold ${
                          sale.profit >= 0
                            ? "text-emerald-600"
                            : "text-destructive"
                        }`}
                      >
                        {formatCurrency(sale.profit)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function SalesPage() {
  const { data: sales = [], isLoading: salesLoading } = useSales();

  const todayRevenue = useMemo(
    () =>
      sales
        .filter((s) => isToday(s.created_at))
        .reduce((sum, s) => sum + s.total_amount, 0),
    [sales],
  );

  const weeklyRevenue = useMemo(
    () =>
      sales
        .filter((s) => isWithinDays(s.created_at, 7))
        .reduce((sum, s) => sum + s.total_amount, 0),
    [sales],
  );

  const monthlyRevenue = useMemo(
    () =>
      sales
        .filter((s) => isWithinDays(s.created_at, 30))
        .reduce((sum, s) => sum + s.total_amount, 0),
    [sales],
  );

  const totalProfit = useMemo(
    () => sales.reduce((sum, s) => sum + s.profit, 0),
    [sales],
  );

  const summaryCards = [
    {
      title: "Today's Revenue",
      value: todayRevenue,
      icon: ShoppingCart,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Weekly Revenue",
      value: weeklyRevenue,
      icon: Calendar,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Monthly Revenue",
      value: monthlyRevenue,
      icon: BarChart3,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Total Profit",
      value: totalProfit,
      icon: TrendingUp,
      color: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <SummaryCard key={card.title} {...card} isLoading={salesLoading} />
        ))}
      </div>

      {/* Top Sellers */}
      <TopSellers sales={sales} isLoading={salesLoading} />

      {/* Record New Sale */}
      <RecordSale />

      {/* Sales History */}
      <SalesHistoryTable sales={sales} isLoading={salesLoading} />

      {/* Footer */}
      <footer className="text-center py-4 border-t border-border mt-8">
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          © {new Date().getFullYear()}. Built with ♥ using caffeine.ai
        </a>
      </footer>
    </div>
  );
}
