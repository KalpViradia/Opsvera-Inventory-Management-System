import { getBatches } from "@/actions/batches";
import { BatchesClient } from "./client";
import { PageShell } from "@/components/shared/page-shell";
import { requirePermission } from "@/lib/rbac";

export const metadata = {
  title: "Batch Tracking | Opsvera",
  description: "Track inventory batches and expiry dates",
};

export default async function BatchesPage() {
  await requirePermission("inventory:read");

  const batches = await getBatches();

  return (
    <PageShell
      title="Batch Tracking"
      description="Monitor inventory batches, manufacturing dates, and upcoming expirations."
    >
      <BatchesClient data={batches} />
    </PageShell>
  );
}
