import { Metadata } from "next";
import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { hasPermission, requirePermission } from "@/lib/rbac";
import { getJournalEntries } from "@/actions/accounting";
import { ExportButton } from "@/components/shared/export-button";

export const metadata: Metadata = {
  title: "Journal Entries | Opsvera",
  description: "View and manage double-entry accounting journals",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default async function JournalEntriesPage() {
  await requirePermission("accounting:read");
  const canWrite = await hasPermission("accounting:write");
  const { data } = await getJournalEntries();
  const { entries, total } = data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exportData = entries.map((je: any) => ({
    Date: format(new Date(je.date), "yyyy-MM-dd"),
    "Entry Number": je.entryNumber,
    Narration: je.narration,
    "Reference Type": je.refType || "",
    "Reference ID": je.refId || "",
    "Total Amount": Number(je.totalAmount),
  }));

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Journal Entries</h2>
          <p className="text-muted-foreground mt-1">
            General ledger transactions and manual entries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} filename={`Journal_Entries_${format(new Date(), "yyyyMMdd")}`} />
          {canWrite && (
            <Button asChild>
              <Link href="/accounting/journals/new">
                <Plus className="w-4 h-4 mr-2" />
                New Journal Entry
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Journal History
          </CardTitle>
          <CardDescription>
            Showing {entries.length} of {total} entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Entry #</TableHead>
                <TableHead>Narration</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Total Debit</TableHead>
                <TableHead className="text-right">Total Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No journal entries found.
                  </TableCell>
                </TableRow>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                entries.map((je: any) => (
                  <TableRow key={je.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(je.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="font-medium">{je.entryNumber}</TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {je.narration}
                    </TableCell>
                    <TableCell>
                      {je.refType ? (
                        <Badge variant="outline">{je.refType}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(je.totalAmount))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(je.totalAmount))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
