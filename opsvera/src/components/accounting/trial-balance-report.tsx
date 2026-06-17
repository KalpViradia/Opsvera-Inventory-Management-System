"use client";

import { ListTree } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

interface TrialBalanceProps {
  startDate?: Date;
  endDate?: Date;
  accountDetails: Array<{ id: string; name: string; type: string; code: string; debit: number; credit: number; balance: number }>;
  totalDebits: number;
  totalCredits: number;
}

export function TrialBalanceReport({ startDate, endDate, accountDetails, totalDebits, totalCredits }: TrialBalanceProps) {
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <ListTree className="w-5 h-5 text-primary" />
          Trial Balance
        </CardTitle>
        <CardDescription>
          {startDate ? format(startDate, "MMM d, yyyy") : "All Time"} – {endDate ? format(endDate, "MMM d, yyyy") : "All Time"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="w-full overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground border-b">
                <tr>
                  <th className="h-10 px-4 text-left font-medium">Code</th>
                  <th className="h-10 px-4 text-left font-medium">Account</th>
                  <th className="h-10 px-4 text-left font-medium">Type</th>
                  <th className="h-10 px-4 text-right font-medium">Debit</th>
                  <th className="h-10 px-4 text-right font-medium">Credit</th>
                </tr>
              </thead>
              <tbody>
                {accountDetails.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                      No journal entries recorded for this period.
                    </td>
                  </tr>
                ) : (
                  accountDetails.map(acc => (
                    <tr key={acc.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle font-mono text-xs">{acc.code}</td>
                      <td className="p-4 align-middle font-medium">{acc.name}</td>
                      <td className="p-4 align-middle text-muted-foreground">{acc.type}</td>
                      <td className="p-4 align-middle text-right">{acc.debit > 0 ? formatCurrency(acc.debit) : "-"}</td>
                      <td className="p-4 align-middle text-right">{acc.credit > 0 ? formatCurrency(acc.credit) : "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-muted/50 font-semibold border-t">
                <tr>
                  <td colSpan={3} className="p-4 text-right">Totals</td>
                  <td className="p-4 text-right">{formatCurrency(totalDebits)}</td>
                  <td className="p-4 text-right">{formatCurrency(totalCredits)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-muted-foreground">Trial Balance Status</span>
            {isBalanced ? (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Balanced</Badge>
            ) : (
              <Badge variant="destructive">Out of Balance</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
