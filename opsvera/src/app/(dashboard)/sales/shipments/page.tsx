import { Metadata } from "next";
import { getShipments } from "@/actions/shipments";
import { ShipmentsClient } from "./client";
import { checkPermission, getCurrentUser } from "@/lib/rbac";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Shipments | Opsvera",
  description: "Manage Pick, Pack, and Ship operations",
};

export default async function ShipmentsPage() {
  const user = await getCurrentUser();
  if (!user || !checkPermission(user.role, "sales", "read")) {
    redirect("/dashboard");
  }

  const shipments = await getShipments();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Shipments</h2>
          <p className="text-muted-foreground">
            Manage your fulfillment workflow: Pick, Pack, and Ship.
          </p>
        </div>
      </div>
      
      <ShipmentsClient initialData={JSON.parse(JSON.stringify(shipments))} />
    </div>
  );
}
