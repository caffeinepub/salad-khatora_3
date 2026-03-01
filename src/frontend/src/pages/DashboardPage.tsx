import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  Package,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { useDashboardStats, useLowStockIngredients } from "../hooks/useQueries";
import { formatCurrency } from "../utils/format";

const SKELETON_ROWS_LOW_STOCK = ["sk-ls1", "sk-ls2", "sk-ls3"];
const SKELETON_ROWS_TOP_SELLERS = ["sk-ts1", "sk-ts2", "sk-ts3", "sk-ts4"];
const SKELETON_ROWS_TRANSACTIONS = [
  "sk-tr1",
  "sk-tr2",
  "sk-tr3",
  "sk-tr4",
  "sk-tr5",
];

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  isLoading,
}: {
  title: string;
  value?: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  isLoading: boolean;
}) {
  return (
    <Card className="bg-card border-border shadow-card sk-card-hover">
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
                {formatCurrency(value ?? 0)}
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

function LowStockPanel() {
  const { data: items, isLoading } = useLowStockIngredients();

  return (
    <Card className="bg-card border-border shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <AlertTriangle size={16} className="text-warning" />
          Low Stock Alerts
          {items && items.length > 0 && (
            <Badge className="bg-warning/10 text-warning-foreground border-warning/30 text-xs ml-auto">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-2">
            {SKELETON_ROWS_LOW_STOCK.map((k) => (
              <Skeleton key={k} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : !items?.length ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Package
              size={28}
              className="text-muted-foreground mb-2 opacity-40"
            />
            <p className="text-sm font-medium text-foreground">
              All stocked up!
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              No low-stock ingredients.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const pct = Math.min(
                (item.quantity / item.low_stock_threshold) * 100,
                100,
              );
              const isCritical =
                item.quantity <= item.low_stock_threshold * 0.5;
              return (
                <div
                  key={Number(item.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isCritical
                      ? "bg-destructive/5 border-destructive/20"
                      : "bg-warning/5 border-warning/20"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.quantity} {item.unit} remaining · threshold:{" "}
                      {item.low_stock_threshold} {item.unit}
                    </p>
                    <div className="mt-1.5 h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isCritical ? "bg-destructive" : "bg-warning"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <Badge
                    className={`ml-3 flex-shrink-0 text-[10px] font-semibold ${
                      isCritical
                        ? "bg-destructive/10 text-destructive border-destructive/30"
                        : "bg-warning/10 text-warning-foreground border-warning/30"
                    }`}
                    variant="outline"
                  >
                    {isCritical ? "Critical" : "Low"}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TopSellersPanel({
  stats,
  isLoading,
}: {
  stats?: { name: string; units_sold: bigint; revenue: number }[];
  isLoading: boolean;
}) {
  return (
    <Card className="bg-card border-border shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <TrendingUp size={16} className="text-primary" />
          Top Selling Salad Bowls
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {SKELETON_ROWS_TOP_SELLERS.map((k) => (
              <div key={k} className="flex items-center gap-3">
                <Skeleton className="w-7 h-7 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : !stats?.length ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BarChart3
              size={28}
              className="text-muted-foreground mb-2 opacity-40"
            />
            <p className="text-sm font-medium text-foreground">
              No sales data yet
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sales data appears here as orders come in.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
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
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Number(item.units_sold)} units sold
                  </p>
                </div>
                <p className="text-sm font-semibold text-primary flex-shrink-0">
                  {formatCurrency(item.revenue)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentTransactions({
  stats,
  isLoading,
}: {
  stats?: { id: bigint; item: string; amount: number; time: string }[];
  isLoading: boolean;
}) {
  return (
    <Card className="bg-card border-border shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <ShoppingCart size={16} className="text-primary" />
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {SKELETON_ROWS_TRANSACTIONS.map((k) => (
              <div key={k} className="flex justify-between items-center">
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : !stats?.length ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ShoppingCart
              size={28}
              className="text-muted-foreground mb-2 opacity-40"
            />
            <p className="text-sm font-medium text-foreground">
              No transactions yet
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Recent orders will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {stats.map((txn) => (
              <div
                key={Number(txn.id)}
                className="flex items-center justify-between py-2.5 hover:bg-accent/30 transition-colors px-1 rounded"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {txn.item}
                  </p>
                  <p className="text-xs text-muted-foreground">{txn.time}</p>
                </div>
                <p className="text-sm font-semibold text-primary">
                  {formatCurrency(txn.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();

  const statCards = [
    {
      title: "Today's Sales",
      value: stats?.daily_sales,
      icon: ShoppingCart,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Weekly Sales",
      value: stats?.weekly_sales,
      icon: Calendar,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Monthly Sales",
      value: stats?.monthly_sales,
      icon: BarChart3,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Total Profit",
      value: stats?.total_profit,
      icon: TrendingUp,
      color: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} isLoading={isLoading} />
        ))}
      </div>

      {/* Low Stock + Top Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LowStockPanel />
        <TopSellersPanel stats={stats?.top_sellers} isLoading={isLoading} />
      </div>

      {/* Recent Transactions */}
      <RecentTransactions
        stats={stats?.recent_transactions}
        isLoading={isLoading}
      />

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
