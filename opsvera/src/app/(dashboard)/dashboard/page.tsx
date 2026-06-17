import { Metadata } from "next";
import {
  Package,
  Box,
  Users,
  Warehouse,
  Activity,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { SalesTrendChart } from "@/components/dashboard/sales-trend-chart";
import { OrderStatusChart } from "@/components/dashboard/order-status-chart";

export const metadata: Metadata = {
  title: "Dashboard | Opsvera",
  description: "Overview of your operations",
};

async function getDashboardStats(companyId: string) {
  const [productsCount, warehousesCount, suppliersCount, stockLevels, recentActivities, salesData, poStatusCounts, soStatusCounts] = await Promise.all([
    prisma.product.count({ where: { companyId, status: "ACTIVE" } }),
    prisma.warehouse.count({ where: { companyId, isActive: true } }),
    prisma.supplier.count({ where: { companyId, isActive: true } }),
    prisma.stockLevel.aggregate({
      where: { location: { companyId } },
      _sum: {
        quantity: true
      }
    }),
    prisma.activity.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: {
          select: { name: true }
        }
      }
    }),
    prisma.salesOrder.findMany({
      where: {
        companyId,
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)),
        },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    }),
    prisma.purchaseOrder.groupBy({
      by: ["status"],
      where: { companyId },
      _count: true,
    }),
    prisma.salesOrder.groupBy({
      by: ["status"],
      where: { companyId },
      _count: true,
    }),
  ]);

  return {
    productsCount,
    warehousesCount,
    suppliersCount,
    totalStockItems: stockLevels._sum.quantity || 0,
    recentActivities,
    salesData,
    poStatusCounts,
    soStatusCounts,
  };
}

const kpiCards = [
  {
    key: "products",
    label: "Active Products",
    icon: Package,
    href: "/products",
    linkText: "View catalog",
    gradient: "from-violet-500/15 via-violet-500/5 to-transparent",
    iconBg: "bg-violet-500/15",
    iconColor: "text-violet-500",
    linkColor: "text-violet-500",
    borderAccent: "border-l-violet-500",
  },
  {
    key: "stock",
    label: "Total Items in Stock",
    icon: Box,
    href: "/inventory",
    linkText: "View inventory",
    gradient: "from-sky-500/15 via-sky-500/5 to-transparent",
    iconBg: "bg-sky-500/15",
    iconColor: "text-sky-500",
    linkColor: "text-sky-500",
    borderAccent: "border-l-sky-500",
  },
  {
    key: "warehouses",
    label: "Active Warehouses",
    icon: Warehouse,
    href: "/warehouses",
    linkText: "Manage locations",
    gradient: "from-amber-500/15 via-amber-500/5 to-transparent",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-500",
    linkColor: "text-amber-500",
    borderAccent: "border-l-amber-500",
  },
  {
    key: "suppliers",
    label: "Active Suppliers",
    icon: Users,
    href: "/suppliers",
    linkText: "View vendors",
    gradient: "from-emerald-500/15 via-emerald-500/5 to-transparent",
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-500",
    linkColor: "text-emerald-500",
    borderAccent: "border-l-emerald-500",
  },
];

export default async function DashboardPage() {
  const user = await requirePermission("dashboard:read");
  const stats = await getDashboardStats(user.companyId!);

  const kpiValues: Record<string, number> = {
    products: stats.productsCount,
    stock: stats.totalStockItems,
    warehouses: stats.warehousesCount,
    suppliers: stats.suppliersCount,
  };

  return (
    <div className="space-y-8 p-4 md:p-8 pt-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Welcome back 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Here is an overview of your current operations.
        </p>
      </div>

      {/* KPI Cards — Glassmorphism Style */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.key}
              className={`
                relative overflow-hidden border-l-4 ${card.borderAccent}
                bg-gradient-to-br ${card.gradient}
                backdrop-blur-xl
                hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20
                transition-all duration-300 ease-out
                hover:-translate-y-0.5
                group
              `}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-muted-foreground">
                      {card.label}
                    </p>
                    <div className="text-3xl font-bold tracking-tight">
                      {kpiValues[card.key]}
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                </div>
                <div className="mt-3 flex items-center text-sm">
                  <Link href={card.href} className={`${card.linkColor} font-medium flex items-center hover:underline group/link`}>
                    {card.linkText}
                    <ArrowRight className="ml-1 w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Activity + Quick Stats */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center">
              <Activity className="w-4 h-4 mr-2 text-muted-foreground" />
              Recent Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivities.length > 0 ? (
              <div className="space-y-4">
                {stats.recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0 group/item hover:bg-muted/30 -mx-2 px-2 py-2 rounded-lg transition-colors">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 ring-1 ring-primary/10">
                      <Activity className="w-4 h-4 text-primary" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-medium leading-none truncate">
                        {activity.details || `${activity.action} ${activity.entityType}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleString()} by {activity.user.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed rounded-lg p-6">
                <Activity className="w-8 h-8 text-muted-foreground mb-3" />
                <h3 className="font-medium text-lg">No recent activity</h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                  Activity logs will appear here once you start creating orders and moving inventory.
                </p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/products">Get Started</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stat Panel */}
        <Card className="lg:col-span-2 border backdrop-blur-sm bg-gradient-to-br from-primary/5 via-transparent to-transparent">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-muted-foreground" />
              Quick Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {[
                { label: "Purchase Orders", count: stats.poStatusCounts.reduce((a, b) => a + b._count, 0), color: "bg-sky-500" },
                { label: "Sales Orders", count: stats.soStatusCounts.reduce((a, b) => a + b._count, 0), color: "bg-emerald-500" },
              ].map(item => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-700 ease-out`}
                      style={{ width: `${Math.min(item.count * 10, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 rounded-xl bg-muted/50">
                  <div className="text-2xl font-bold">{stats.productsCount}</div>
                  <div className="text-xs text-muted-foreground mt-1">Products</div>
                </div>
                <div className="p-3 rounded-xl bg-muted/50">
                  <div className="text-2xl font-bold">{stats.totalStockItems}</div>
                  <div className="text-xs text-muted-foreground mt-1">Stock Units</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Sales Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesTrendChart salesData={stats.salesData.map((d: any) => ({ ...d, totalAmount: Number(d.totalAmount) }))} />
          </CardContent>
        </Card>

        <Card className="border backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Order Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderStatusChart 
              poStatusCounts={stats.poStatusCounts} 
              soStatusCounts={stats.soStatusCounts} 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
