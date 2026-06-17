import { Metadata } from "next";
import {
  Package,
  Box,
  Truck,
  ShoppingCart,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { SalesAnalyticsChart } from "@/components/reports/sales-analytics-chart";
import { InventoryDistributionChart } from "@/components/reports/inventory-distribution-chart";

export const metadata: Metadata = {
  title: "Reports | Opsvera",
  description: "Business analytics and reporting",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

async function getReportsData(companyId: string) {
  const [
    totalProducts,
    activeProducts,
    draftProducts,
    archivedProducts,
    stockLevels,
    purchaseOrders,
    salesOrders,
    topStockedProducts,
    purchasesByStatus,
    salesByStatus,
    suppliers,
    customers,
  ] = await Promise.all([
    prisma.product.count({ where: { companyId } }),
    prisma.product.count({ where: { companyId, status: "ACTIVE" } }),
    prisma.product.count({ where: { companyId, status: "DRAFT" } }),
    prisma.product.count({ where: { companyId, status: "ARCHIVED" } }),
    prisma.stockLevel.aggregate({
      where: { location: { companyId } },
      _sum: { quantity: true },
    }),
    prisma.purchaseOrder.count({ where: { companyId } }),
    prisma.salesOrder.count({ where: { companyId } }),
    prisma.stockLevel.findMany({
      where: { location: { companyId }, quantity: { gt: 0 } },
      include: {
        product: { select: { name: true, sku: true } },
        location: { select: { name: true, warehouse: { select: { name: true } } } },
      },
      orderBy: { quantity: "desc" },
      take: 10,
    }),
    prisma.purchaseOrder.groupBy({
      by: ["status"],
      where: { companyId },
      _count: true,
      _sum: { totalAmount: true },
    }),
    prisma.salesOrder.groupBy({
      by: ["status"],
      where: { companyId },
      _count: true,
      _sum: { totalAmount: true },
    }),
    prisma.supplier.count({ where: { companyId, isActive: true } }),
    prisma.customer.count({ where: { companyId, isActive: true } }),
  ]);

  // Estimate inventory value from stock levels * variant cost
  const stockWithCost = await prisma.stockLevel.findMany({
    where: { location: { companyId }, quantity: { gt: 0 } },
    include: {
      product: {
        include: {
          variants: { take: 1, select: { cost: true } },
        },
      },
    },
  });

  let inventoryValue = 0;
  for (const sl of stockWithCost) {
    const cost = sl.product.variants[0]?.cost ? Number(sl.product.variants[0].cost) : 0;
    inventoryValue += sl.quantity * cost;
  }

  // 30-day trend data
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [recentPurchases, recentSales] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where: { companyId, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, totalAmount: true },
    }),
    prisma.salesOrder.findMany({
      where: { companyId, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, totalAmount: true },
    }),
  ]);

  const salesDataMap = new Map<string, { sales: number; purchases: number }>();
  for (let i = 0; i <= 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    salesDataMap.set(d.toISOString().split("T")[0], { sales: 0, purchases: 0 });
  }

  recentPurchases.forEach((p) => {
    const date = p.createdAt.toISOString().split("T")[0];
    if (salesDataMap.has(date)) {
      salesDataMap.get(date)!.purchases += Number(p.totalAmount || 0);
    }
  });

  recentSales.forEach((s) => {
    const date = s.createdAt.toISOString().split("T")[0];
    if (salesDataMap.has(date)) {
      salesDataMap.get(date)!.sales += Number(s.totalAmount || 0);
    }
  });

  const salesData = Array.from(salesDataMap.entries()).map(([date, data]) => ({
    date,
    ...data,
  }));

  // Inventory distribution by warehouse
  const stockWithLocation = await prisma.stockLevel.findMany({
    where: { location: { companyId }, quantity: { gt: 0 } },
    include: {
      location: { include: { warehouse: true } },
      product: { include: { variants: { take: 1, select: { cost: true } } } },
    },
  });

  const inventoryByWarehouseMap = new Map<string, number>();
  stockWithLocation.forEach((sl) => {
    const cost = sl.product.variants[0]?.cost ? Number(sl.product.variants[0].cost) : 0;
    const value = sl.quantity * cost;
    const warehouseName = sl.location.warehouse.name;
    inventoryByWarehouseMap.set(warehouseName, (inventoryByWarehouseMap.get(warehouseName) || 0) + value);
  });

  const inventoryDistribution = Array.from(inventoryByWarehouseMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return {
    totalProducts,
    activeProducts,
    draftProducts,
    archivedProducts,
    totalStockItems: stockLevels._sum.quantity || 0,
    inventoryValue,
    purchaseOrders,
    salesOrders,
    topStockedProducts,
    purchasesByStatus,
    salesByStatus,
    suppliers,
    customers,
    salesData,
    inventoryDistribution,
  };
}

export default async function ReportsPage() {
  const user = await requirePermission("reports:read");
  const data = await getReportsData(user.companyId!);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
        <p className="text-muted-foreground mt-1">
          Business analytics and operational insights.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden border bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                <div className="text-2xl font-bold">{data.totalProducts}</div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">{data.activeProducts} active</Badge>
              <Badge variant="secondary" className="text-xs">{data.draftProducts} draft</Badge>
              {data.archivedProducts > 0 && (
                <Badge variant="secondary" className="text-xs">{data.archivedProducts} archived</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Inventory Value</p>
                <div className="text-2xl font-bold">{formatCurrency(data.inventoryValue)}</div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <div className="mt-3 text-sm text-muted-foreground">
              {data.totalStockItems.toLocaleString()} items in stock
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Purchase Orders</p>
                <div className="text-2xl font-bold">{data.purchaseOrders}</div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Truck className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <div className="mt-3 text-sm text-muted-foreground">
              {data.suppliers} active suppliers
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Sales Orders</p>
                <div className="text-2xl font-bold">{data.salesOrders}</div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <div className="mt-3 text-sm text-muted-foreground">
              {data.customers} active customers
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Charts */}
      <div className="grid gap-6 grid-cols-1 xl:grid-cols-3">
        <SalesAnalyticsChart data={data.salesData} />
        <InventoryDistributionChart data={data.inventoryDistribution} />
      </div>

      {/* Tables Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Stocked Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center">
              <Box className="w-4 h-4 mr-2" />
              Top Products by Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topStockedProducts.map((sl) => (
                  <TableRow key={sl.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{sl.product.name}</p>
                        <p className="text-xs text-muted-foreground">{sl.product.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {sl.location.name}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {sl.quantity.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Order Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Order Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Purchases */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Purchase Orders</h4>
              <div className="space-y-2">
                {data.purchasesByStatus.map((item) => (
                  <div key={item.status} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs min-w-[80px] justify-center">
                        {item.status}
                      </Badge>
                      <span className="text-muted-foreground">{item._count} orders</span>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(Number(item._sum.totalAmount || 0))}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sales */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Sales Orders</h4>
              <div className="space-y-2">
                {data.salesByStatus.map((item) => (
                  <div key={item.status} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs min-w-[80px] justify-center">
                        {item.status}
                      </Badge>
                      <span className="text-muted-foreground">{item._count} orders</span>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(Number(item._sum.totalAmount || 0))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
