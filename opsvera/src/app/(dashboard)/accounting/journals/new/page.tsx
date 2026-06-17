import { Metadata } from "next";
import { requirePermission } from "@/lib/rbac";
import { getChartOfAccounts } from "@/actions/accounting";
import { JournalForm } from "@/components/accounting/journal-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "New Journal Entry | Opsvera",
  description: "Create a manual journal entry",
};

type AccountData = { id: string; code: string; name: string; isGroup: boolean; children?: AccountData[] };

// Helper to flatten COA for the dropdown
function flattenAccounts(accounts: AccountData[], flat: AccountData[] = []) {
  for (const acc of accounts) {
    flat.push({
      id: acc.id,
      code: acc.code,
      name: acc.name,
      isGroup: acc.isGroup,
    });
    if (acc.children && acc.children.length > 0) {
      flattenAccounts(acc.children, flat);
    }
  }
  return flat;
}

export default async function NewJournalEntryPage() {
  await requirePermission("accounting:write");
  const { data: accounts } = await getChartOfAccounts();
  const flatAccounts = flattenAccounts(accounts);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/accounting/journals">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">New Journal Entry</h2>
          <p className="text-muted-foreground mt-1">
            Record a manual double-entry journal transaction.
          </p>
        </div>
      </div>

      <JournalForm accounts={flatAccounts} />
    </div>
  );
}
