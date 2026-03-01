import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  AreaChart,
  BarChart,
  BarChart2,
  Calendar,
  Download,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  AreaChart as ReAreaChart,
  BarChart as ReBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SaleRecord } from "../backend.d";
import { useReportSalesByDateRange, useReportStats } from "../hooks/useQueries";
import { formatCurrency, formatDate } from "../utils/format";

// ─── Date range helpers ───────────────────────────────────────────────────────

type Preset = "today" | "week" | "month" | "all";

function getMidnightMs(daysAgo = 0): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.getTime();
}

function presetToRange(preset: Preset): { from: bigint; to: bigint } {
  const nowNs = BigInt(Date.now()) * 1_000_000n;
  switch (preset) {
    case "today":
      return { from: BigInt(getMidnightMs(0)) * 1_000_000n, to: nowNs };
    case "week":
      return { from: BigInt(getMidnightMs(7)) * 1_000_000n, to: nowNs };
    case "month":
      return { from: BigInt(getMidnightMs(30)) * 1_000_000n, to: nowNs };
    case "all":
      return { from: 0n, to: nowNs };
  }
}

function dateStringToNs(dateStr: string, endOfDay = false): bigint {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 0n;
  if (endOfDay) {
    d.setHours(23, 59, 59, 999);
  } else {
    d.setHours(0, 0, 0, 0);
  }
  return BigInt(d.getTime()) * 1_000_000n;
}

function nsToDisplayDate(labelStr: string): string {
  try {
    const ns = BigInt(labelStr);
    const ms = Number(ns / 1_000_000n);
    return new Date(ms).toLocaleDateString("en-PK", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return labelStr;
  }
}

// ─── CSV export ───────────────────────────────────────────────────────────────

function exportToCSV(sales: SaleRecord[], label: string): void {
  const headers = [
    "Date",
    "Item",
    "Qty",
    "Unit Price (PKR)",
    "Revenue (PKR)",
    "Cost (PKR)",
    "Profit (PKR)",
  ];
  const rows = sales.map((s) => [
    formatDate(s.created_at),
    s.menu_item_name,
    Number(s.quantity),
    s.unit_price.toFixed(2),
    s.total_amount.toFixed(2),
    s.cost_amount.toFixed(2),
    s.profit.toFixed(2),
  ]);
  const csv = [headers, ...rows]
    .map((row) =>
      row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `salad-khatora-report-${label}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  isLoading,
  isCurrency = true,
}: {
  title: string;
  value?: number | bigint;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  isLoading: boolean;
  isCurrency?: boolean;
}) {
  const displayValue = useMemo(() => {
    if (value === undefined) return "—";
    const num = typeof value === "bigint" ? Number(value) : value;
    if (isCurrency) return formatCurrency(num);
    return num.toLocaleString("en-PK");
  }, [value, isCurrency]);

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
                {displayValue}
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

// ─── Revenue & Profit Trend Chart ────────────────────────────────────────────

const CHART_COLORS = {
  revenue: "#16a34a",
  profit: "#0ea5e9",
};

function TrendChart({
  data,
  isLoading,
}: {
  data?: {
    date_label: string;
    revenue: number;
    profit: number;
    orders: bigint;
  }[];
  isLoading: boolean;
}) {
  const chartData = useMemo(
    () =>
      (data ?? []).map((d) => ({
        date: nsToDisplayDate(d.date_label),
        Revenue: Math.round(d.revenue),
        Profit: Math.round(d.profit),
        Orders: Number(d.orders),
      })),
    [data],
  );

  return (
    <Card className="bg-card border-border shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <AreaChart size={16} className="text-primary" />
          Revenue & Profit Trend
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading chart…</p>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center gap-2">
            <AlertCircle
              size={28}
              className="text-muted-foreground opacity-40"
            />
            <p className="text-sm font-medium text-foreground">
              No data for this period
            </p>
            <p className="text-xs text-muted-foreground">
              Record some sales to see trends here.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <ReAreaChart
              data={chartData}
              margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
            >
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={CHART_COLORS.revenue}
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="95%"
                    stopColor={CHART_COLORS.revenue}
                    stopOpacity={0.02}
                  />
                </linearGradient>
                <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={CHART_COLORS.profit}
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="95%"
                    stopColor={CHART_COLORS.profit}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.9 0.02 149)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "oklch(0.5 0.02 150)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "oklch(0.5 0.02 150)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "white",
                  border: "1px solid oklch(0.9 0.02 149)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
                formatter={(value: number, name: string) => [
                  `PKR ${value.toLocaleString("en-PK")}`,
                  name,
                ]}
              />
              <Area
                type="monotone"
                dataKey="Revenue"
                stroke={CHART_COLORS.revenue}
                strokeWidth={2}
                fill="url(#gradRevenue)"
                dot={false}
                activeDot={{ r: 4, fill: CHART_COLORS.revenue }}
              />
              <Area
                type="monotone"
                dataKey="Profit"
                stroke={CHART_COLORS.profit}
                strokeWidth={2}
                fill="url(#gradProfit)"
                dot={false}
                activeDot={{ r: 4, fill: CHART_COLORS.profit }}
              />
            </ReAreaChart>
          </ResponsiveContainer>
        )}
        {/* Legend */}
        {!isLoading && chartData.length > 0 && (
          <div className="flex items-center gap-5 mt-2 justify-center">
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: CHART_COLORS.revenue }}
              />
              <span className="text-xs text-muted-foreground">Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: CHART_COLORS.profit }}
              />
              <span className="text-xs text-muted-foreground">Profit</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Top Sellers Bar Chart ────────────────────────────────────────────────────

const BAR_COLORS = ["#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0"];

function TopSellersChart({
  data,
  isLoading,
}: {
  data?: { name: string; units_sold: bigint; revenue: number }[];
  isLoading: boolean;
}) {
  const chartData = useMemo(
    () =>
      (data ?? []).slice(0, 5).map((d) => ({
        name: d.name.length > 14 ? `${d.name.slice(0, 13)}…` : d.name,
        fullName: d.name,
        Units: Number(d.units_sold),
        Revenue: Math.round(d.revenue),
      })),
    [data],
  );

  return (
    <Card className="bg-card border-border shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <BarChart size={16} className="text-primary" />
          Top Sellers
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading chart…</p>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center gap-2">
            <BarChart2 size={28} className="text-muted-foreground opacity-40" />
            <p className="text-sm font-medium text-foreground">
              No top sellers yet
            </p>
            <p className="text-xs text-muted-foreground">
              Sales data will appear once recorded.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <ReBarChart
              data={chartData}
              margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.9 0.02 149)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "oklch(0.5 0.02 150)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "oklch(0.5 0.02 150)" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "white",
                  border: "1px solid oklch(0.9 0.02 149)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
                formatter={(
                  value: number,
                  name: string,
                  props: { payload?: { fullName?: string } },
                ) => [`${value} units`, props?.payload?.fullName ?? name]}
              />
              <Bar dataKey="Units" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={BAR_COLORS[i % BAR_COLORS.length]}
                  />
                ))}
              </Bar>
            </ReBarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Sales Table ──────────────────────────────────────────────────────────────

function ReportSalesTable({
  sales,
  isLoading,
  rangeLabel,
}: {
  sales: SaleRecord[];
  isLoading: boolean;
  rangeLabel: string;
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
            Sales Records
            {!isLoading && sales.length > 0 && (
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/20 text-xs ml-1"
              >
                {sales.length} records
              </Badge>
            )}
          </CardTitle>
          {!isLoading && sorted.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(sorted, rangeLabel)}
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
            {["r1", "r2", "r3", "r4", "r5"].map((k) => (
              <div key={k} className="flex items-center gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
            <ShoppingCart
              size={32}
              className="text-muted-foreground opacity-30 mb-1"
            />
            <p className="text-sm font-medium text-foreground">
              No sales in this period
            </p>
            <p className="text-xs text-muted-foreground">
              Try a wider date range or record some sales.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  {[
                    "Date & Time",
                    "Item",
                    "Qty",
                    "Revenue",
                    "Cost",
                    "Profit",
                  ].map((h) => (
                    <TableHead
                      key={h}
                      className="font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap"
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((sale) => (
                  <TableRow
                    key={String(sale.id)}
                    className="hover:bg-accent/30 transition-colors"
                  >
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(sale.created_at)}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">
                      {sale.menu_item_name}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {Number(sale.quantity)}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums font-semibold text-primary">
                      {formatCurrency(sale.total_amount)}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums text-muted-foreground">
                      {formatCurrency(sale.cost_amount)}
                    </TableCell>
                    <TableCell>
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

const PRESET_LABELS: Record<Preset, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  all: "All Time",
};

export function ReportsPage() {
  const [preset, setPreset] = useState<Preset>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  const dateRange = useMemo(() => {
    if (useCustom && customFrom && customTo) {
      return {
        from: dateStringToNs(customFrom, false),
        to: dateStringToNs(customTo, true),
      };
    }
    return presetToRange(preset);
  }, [preset, customFrom, customTo, useCustom]);

  const rangeLabel =
    useCustom && customFrom && customTo
      ? `${customFrom}-to-${customTo}`
      : preset;

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useReportStats(dateRange.from, dateRange.to);

  const { data: sales = [], isLoading: salesLoading } =
    useReportSalesByDateRange(dateRange.from, dateRange.to);

  const statCards = [
    {
      title: "Total Revenue",
      value: stats?.total_revenue,
      icon: Wallet,
      color: "bg-primary/10 text-primary",
      isCurrency: true,
    },
    {
      title: "Total Profit",
      value: stats?.total_profit,
      icon: TrendingUp,
      color: "bg-emerald-50 text-emerald-600",
      isCurrency: true,
    },
    {
      title: "Total Orders",
      value: stats?.total_orders,
      icon: ShoppingCart,
      color: "bg-blue-50 text-blue-600",
      isCurrency: false,
    },
    {
      title: "Avg Order Value",
      value: stats?.avg_order_value,
      icon: BarChart2,
      color: "bg-purple-50 text-purple-600",
      isCurrency: true,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-display font-semibold text-foreground">
          Reports
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Analyze revenue, profit, and sales trends across any time period.
        </p>
      </div>

      {/* Date range selector */}
      <Card className="bg-card border-border shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Preset tabs */}
            <div className="flex gap-1.5 flex-wrap">
              {(["today", "week", "month", "all"] as Preset[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setPreset(p);
                    setUseCustom(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    !useCustom && preset === p
                      ? "bg-primary text-white shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {PRESET_LABELS[p]}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-8 bg-border self-center" />

            {/* Custom range */}
            <div className="flex items-end gap-2 flex-wrap">
              <div className="space-y-1">
                <label
                  htmlFor="rep-from"
                  className="text-xs font-medium text-muted-foreground block"
                >
                  From
                </label>
                <Input
                  id="rep-from"
                  type="date"
                  value={customFrom}
                  onChange={(e) => {
                    setCustomFrom(e.target.value);
                    if (e.target.value && customTo) setUseCustom(true);
                  }}
                  className="h-8 text-sm w-36"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="rep-to"
                  className="text-xs font-medium text-muted-foreground block"
                >
                  To
                </label>
                <Input
                  id="rep-to"
                  type="date"
                  value={customTo}
                  onChange={(e) => {
                    setCustomTo(e.target.value);
                    if (customFrom && e.target.value) setUseCustom(true);
                  }}
                  className="h-8 text-sm w-36"
                />
              </div>
              {useCustom && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setUseCustom(false);
                    setCustomFrom("");
                    setCustomTo("");
                  }}
                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Active range label */}
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
            <Calendar size={12} />
            {useCustom && customFrom && customTo ? (
              <span>
                Custom range:{" "}
                <span className="font-medium text-foreground">
                  {new Date(customFrom).toLocaleDateString("en-PK", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {" – "}
                  {new Date(customTo).toLocaleDateString("en-PK", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </span>
            ) : (
              <span>
                Showing:{" "}
                <span className="font-medium text-foreground">
                  {PRESET_LABELS[preset]}
                </span>
              </span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Error state */}
      {statsError && (
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle size={18} className="text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">
              Failed to load report data. Please try refreshing the page.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} isLoading={statsLoading} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TrendChart data={stats?.daily_breakdown} isLoading={statsLoading} />
        <TopSellersChart data={stats?.top_sellers} isLoading={statsLoading} />
      </div>

      {/* Sales Table */}
      <ReportSalesTable
        sales={sales}
        isLoading={salesLoading}
        rangeLabel={rangeLabel}
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
