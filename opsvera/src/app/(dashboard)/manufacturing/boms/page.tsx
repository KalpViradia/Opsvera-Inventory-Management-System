import { Metadata } from "next";
import { getBOMs } from "@/actions/manufacturing";
import { BomsClient } from "./client";
import { checkPermission, getCurrentUser } from "@/lib/rbac";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Bill of Materials | Opsvera",
  description: "Manage manufacturing recipes",
};

export default async function BomsPage() {
  const user = await getCurrentUser();
  // We're treating manufacturing as an extension of inventory permissions
  if (!user || !checkPermission(user.role, "inventory", "read")) {
    redirect("/dashboard");
  }

  // Get all active products to serve as potential finished goods and components
  const products = await prisma.product.findMany({
    where: { companyId: user.companyId!, status: "ACTIVE" },
    select: { id: true, name: true, sku: true, unitId: true },
    orderBy: { name: "asc" }
  });

  const boms = await getBOMs();
  const canWrite = await checkPermission(user.role, "inventory", "write");

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bill of Materials</h2>
          <p className="text-muted-foreground">
            Define recipes to assemble finished goods from raw materials.
          </p>
        </div>
      </div>
      
      <BomsClient initialData={boms} products={products} canWrite={canWrite} />
    </div>
  );
}
