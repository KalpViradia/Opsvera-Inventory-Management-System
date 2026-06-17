import { Metadata } from "next";
import { FolderTree } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { hasPermission, requirePermission } from "@/lib/rbac";
import { getChartOfAccounts } from "@/actions/accounting";
import { CoaForm } from "@/components/accounting/coa-form";

export const metadata: Metadata = {
  title: "Chart of Accounts | Opsvera",
  description: "Manage ledger accounts",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AccountData = { id: string; code: string; name: string; isGroup: boolean; type: string; balance: any; children?: AccountData[] };

function AccountRow({ account, depth = 0 }: { account: AccountData; depth?: number }) {
  const isGroup = account.isGroup;

  return (
    <>
      <div 
        className={`flex items-center justify-between py-3 px-4 border-b hover:bg-muted/50 transition-colors ${isGroup ? 'bg-muted/20 font-medium' : ''}`}
        style={{ paddingLeft: `${Math.max(1, depth * 1.5)}rem` }}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground w-16">{account.code}</span>
          <span className={`${isGroup ? 'text-foreground' : 'text-muted-foreground'}`}>
            {account.name}
          </span>
          {isGroup && <Badge variant="outline" className="text-[10px] ml-2">GROUP</Badge>}
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="w-20 justify-center">{account.type}</Badge>
          <span className={`w-28 text-right tabular-nums ${Number(account.balance) < 0 ? 'text-destructive' : ''}`}>
            {formatCurrency(Number(account.balance))}
          </span>
        </div>
      </div>
      {account.children?.map((child: AccountData) => (
        <AccountRow key={child.id} account={child} depth={depth + 1} />
      ))}
    </>
  );
}

export default async function ChartOfAccountsPage() {
  await requirePermission("accounting:read");
  const canWrite = await hasPermission("accounting:write");
  const { data: accounts } = await getChartOfAccounts();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Chart of Accounts</h2>
          <p className="text-muted-foreground mt-1">
            Manage your ledger accounts and view current balances.
          </p>
        </div>
        {canWrite && <CoaForm accounts={accounts} />}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-primary" />
            Ledger Structure
          </CardTitle>
          <CardDescription>
            Hierarchical view of all asset, liability, equity, revenue, and expense accounts.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex items-center justify-between py-2 px-4 border-b border-t bg-muted/50 text-sm font-medium text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="w-16">Code</span>
              <span>Account Name</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-20 text-center">Type</span>
              <span className="w-28 text-right">Balance</span>
            </div>
          </div>
          <div className="divide-y">
            {accounts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground border-b">
                No accounts found. Create your first ledger account to begin.
              </div>
            ) : (
              accounts.map((account) => (
                <AccountRow key={account.id} account={account} />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
