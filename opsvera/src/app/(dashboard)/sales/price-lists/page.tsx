import { getPriceLists } from "@/actions/price-lists";
import { PriceListsClient } from "./client";
import { checkPermission } from "@/lib/rbac";
import { getCurrentUser } from "@/lib/rbac";
import { redirect } from "next/navigation";

export default async function PriceListsPage() {
  const user = await getCurrentUser();
  if (!user || !checkPermission(user.role, "sales", "read")) {
    redirect("/dashboard");
  }

  const priceLists = await getPriceLists();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Price Lists</h1>
        <p className="text-muted-foreground mt-2">
          Manage dynamic pricing rules, tier pricing, and volume discounts.
        </p>
      </div>

      <PriceListsClient initialData={priceLists} />
    </div>
  );
}
