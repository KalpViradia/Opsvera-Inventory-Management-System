"use client";

import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

interface ProfitLossProps {
  startDate?: Date;
  endDate?: Date;
  revenues: Array<{ name: string; balance: number }>;
  expenses: Array<{ name: string; balance: number }>;
  totalRevenue: number;
  totalExpense: number;
  netIncome: number;
}

export function ProfitLossReport({ startDate, endDate, revenues, expenses, totalRevenue, totalExpense, netIncome }: ProfitLossProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Income Statement (P&L)
        </CardTitle>
        <CardDescription>
          {startDate ? format(startDate, "MMM d, yyyy") : "All Time"} – {endDate ? format(endDate, "MMM d, yyyy") : "All Time"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Operating Revenue</h4>
          <div className="space-y-2">
            {revenues.length === 0 && <p className="text-sm text-muted-foreground italic">No revenue recorded</p>}
            {revenues.map(r => (
              <div key={r.name} className="flex justify-between text-sm">
                <span>{r.name}</span>
                <span>{formatCurrency(r.balance)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm font-medium mt-3 pt-3 border-t">
            <span>Total Revenue</span>
            <span>{formatCurrency(totalRevenue)}</span>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Operating Expenses</h4>
          <div className="space-y-2">
            {expenses.length === 0 && <p className="text-sm text-muted-foreground italic">No expenses recorded</p>}
            {expenses.map(e => (
              <div key={e.name} className="flex justify-between text-sm">
                <span>{e.name}</span>
                <span>{formatCurrency(e.balance)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm font-medium mt-3 pt-3 border-t">
            <span>Total Expenses</span>
            <span>{formatCurrency(totalExpense)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <span className="font-semibold">Net Income</span>
          <span className={`font-bold text-lg ${netIncome >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
            {formatCurrency(netIncome)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
