import { Metadata } from "next";
import { getProductionOrders, getBOMs } from "@/actions/manufacturing";
import { ProductionClient } from "./client";
import { checkPermission, getCurrentUser } from "@/lib/rbac";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Production Orders | Opsvera",
  description: "Manage manufacturing and assembly orders",
};

export default async function ProductionPage() {
  const user = await getCurrentUser();
  if (!user || !checkPermission(user.role, "inventory", "read")) {
    redirect("/dashboard");
  }

  const [orders, boms] = await Promise.all([
    getProductionOrders(),
    getBOMs()
  ]);
  const canWrite = await checkPermission(user.role, "inventory", "write");

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Production Orders</h2>
          <p className="text-muted-foreground">
            Track and manage assembly of finished goods.
          </p>
        </div>
      </div>
      
      <ProductionClient initialData={orders} boms={boms} canWrite={canWrite} />
    </div>
  );
}
