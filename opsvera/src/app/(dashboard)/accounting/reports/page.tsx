import { Metadata } from "next";
import { parseISO } from "date-fns";

import { requirePermission } from "@/lib/rbac";
import { getFinancialReports } from "@/actions/accounting";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { ProfitLossReport } from "@/components/accounting/profit-loss-report";
import { BalanceSheetReport } from "@/components/accounting/balance-sheet-report";
import { TrialBalanceReport } from "@/components/accounting/trial-balance-report";

export const metadata: Metadata = {
  title: "Financial Reports | Opsvera",
  description: "View Profit & Loss, Balance Sheet, and Trial Balance statements",
};

export default async function FinancialReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requirePermission("accounting:read");

  const resolvedParams = await searchParams;
  const from = typeof resolvedParams.from === "string" ? resolvedParams.from : undefined;
  const to = typeof resolvedParams.to === "string" ? resolvedParams.to : undefined;

  const endDate = to ? parseISO(to) : new Date();
  const startDate = from ? parseISO(from) : new Date(endDate.getFullYear(), 0, 1);

  const { data } = await getFinancialReports(startDate, endDate);
  const { balances, netIncome, totalAssets, totalLiabilities, totalEquity, isBalanced, accountDetails, totalDebits, totalCredits } = data;

  const revenues = accountDetails.filter(a => a.type === "REVENUE");
  const expenses = accountDetails.filter(a => a.type === "EXPENSE");
  const assets = accountDetails.filter(a => a.type === "ASSET");
  const liabilities = accountDetails.filter(a => a.type === "LIABILITY");
  const equities = accountDetails.filter(a => a.type === "EQUITY");

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financial Reports</h2>
          <p className="text-muted-foreground mt-1">
            View financial performance and position.
          </p>
        </div>
        <div>
          <DatePickerWithRange defaultDate={{ from: startDate, to: endDate }} />
        </div>
      </div>

      <Tabs defaultValue="pl" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pl">Profit & Loss</TabsTrigger>
          <TabsTrigger value="bs">Balance Sheet</TabsTrigger>
          <TabsTrigger value="tb">Trial Balance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pl" className="space-y-4">
          <ProfitLossReport
            startDate={startDate}
            endDate={endDate}
            revenues={revenues}
            expenses={expenses}
            totalRevenue={balances.REVENUE}
            totalExpense={balances.EXPENSE}
            netIncome={netIncome}
          />
        </TabsContent>

        <TabsContent value="bs" className="space-y-4">
          <BalanceSheetReport
            asOfDate={endDate}
            assets={assets}
            liabilities={liabilities}
            equities={equities}
            totalAssets={totalAssets}
            totalLiabilities={totalLiabilities}
            totalEquity={totalEquity}
            netIncome={netIncome}
            isBalanced={isBalanced}
          />
        </TabsContent>

        <TabsContent value="tb" className="space-y-4">
          <TrialBalanceReport
            startDate={startDate}
            endDate={endDate}
            accountDetails={accountDetails}
            totalDebits={totalDebits}
            totalCredits={totalCredits}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
