"use client";

import { Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

interface BalanceSheetProps {
  asOfDate?: Date;
  assets: Array<{ name: string; balance: number }>;
  liabilities: Array<{ name: string; balance: number }>;
  equities: Array<{ name: string; balance: number }>;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  netIncome: number;
  isBalanced: boolean;
}

export function BalanceSheetReport({ asOfDate, assets, liabilities, equities, totalAssets, totalLiabilities, totalEquity, netIncome, isBalanced }: BalanceSheetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary" />
          Balance Sheet
        </CardTitle>
        <CardDescription>
          As of {asOfDate ? format(asOfDate, "MMM d, yyyy") : "All Time"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Assets</h4>
          <div className="space-y-2">
            {assets.length === 0 && <p className="text-sm text-muted-foreground italic">No assets recorded</p>}
            {assets.map(a => (
              <div key={a.name} className="flex justify-between text-sm">
                <span>{a.name}</span>
                <span>{formatCurrency(a.balance)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm font-medium mt-3 pt-3 border-t">
            <span>Total Assets</span>
            <span className="text-primary">{formatCurrency(totalAssets)}</span>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Liabilities</h4>
          <div className="space-y-2">
            {liabilities.length === 0 && <p className="text-sm text-muted-foreground italic">No liabilities recorded</p>}
            {liabilities.map(l => (
              <div key={l.name} className="flex justify-between text-sm">
                <span>{l.name}</span>
                <span>{formatCurrency(l.balance)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm font-medium mt-3 pt-3 border-t">
            <span>Total Liabilities</span>
            <span>{formatCurrency(totalLiabilities)}</span>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Equity</h4>
          <div className="space-y-2">
            {equities.map(e => (
              <div key={e.name} className="flex justify-between text-sm">
                <span>{e.name}</span>
                <span>{formatCurrency(e.balance)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
              <span>Current Year Net Income</span>
              <span>{formatCurrency(netIncome)}</span>
            </div>
          </div>
          <div className="flex justify-between text-sm font-medium mt-3 pt-3 border-t">
            <span>Total Equity</span>
            <span>{formatCurrency(totalEquity)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Liabilities + Equity</span>
            {isBalanced ? (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Balanced</Badge>
            ) : (
              <Badge variant="destructive">Out of Balance</Badge>
            )}
          </div>
          <span className="font-bold text-lg text-primary">
            {formatCurrency(totalLiabilities + totalEquity)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
