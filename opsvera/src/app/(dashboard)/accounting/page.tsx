import { Metadata } from "next";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requirePermission } from "@/lib/rbac";
import { getAccountingOverview } from "@/actions/accounting";

export const metadata: Metadata = {
  title: "Accounting | Opsvera",
  description: "Financial overview — accounts payable and receivable",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function invoiceStatusBadge(status: string) {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    DRAFT: { variant: "secondary", label: "Draft" },
    UNPAID: { variant: "destructive", label: "Unpaid" },
    PARTIAL: { variant: "outline", label: "Partial" },
    PAID: { variant: "default", label: "Paid" },
    CANCELLED: { variant: "secondary", label: "Cancelled" },
  };

  const config = variants[status] || { variant: "secondary" as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default async function AccountingPage() {
  await requirePermission("accounting:read");
  const { data, error } = await getAccountingOverview();

  if (error || !data) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Accounting</h2>
        <div className="flex h-[400px] items-center justify-center rounded-md border border-dashed">
          <p className="text-muted-foreground">{error || "Unable to load accounting data."}</p>
        </div>
      </div>
    );
  }

  const { summary, purchaseInvoices, salesInvoices } = data;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Accounting</h2>
        <p className="text-muted-foreground mt-1">
          Financial overview of accounts payable and receivable.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden border bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </p>
                <div className="text-2xl font-bold tracking-tight">
                  {formatCurrency(summary.totalReceivable)}
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-sm text-muted-foreground">
              <ArrowUpRight className="w-3.5 h-3.5 mr-1 text-emerald-500" />
              From {salesInvoices.length} invoices
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Expenses
                </p>
                <div className="text-2xl font-bold tracking-tight">
                  {formatCurrency(summary.totalPayable)}
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-sm text-muted-foreground">
              <ArrowDownRight className="w-3.5 h-3.5 mr-1 text-red-500" />
              From {purchaseInvoices.length} invoices
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">
                  Outstanding Receivables
                </p>
                <div className="text-2xl font-bold tracking-tight text-emerald-600">
                  {formatCurrency(summary.outstandingReceivable)}
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <div className="mt-3 text-sm text-muted-foreground">
              {formatCurrency(summary.totalReceived)} collected
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">
                  Outstanding Payables
                </p>
                <div className="text-2xl font-bold tracking-tight text-red-600">
                  {formatCurrency(summary.outstandingPayable)}
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <div className="mt-3 text-sm text-muted-foreground">
              {formatCurrency(summary.totalPaid)} paid
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: AP and AR */}
      <Tabs defaultValue="receivable" className="space-y-4">
        <TabsList>
          <TabsTrigger value="receivable">Accounts Receivable</TabsTrigger>
          <TabsTrigger value="payable">Accounts Payable</TabsTrigger>
        </TabsList>

        <TabsContent value="receivable" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sales Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {salesInvoices.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
                  No sales invoices found.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesInvoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                        <TableCell>{inv.customer.name}</TableCell>
                        <TableCell className="text-muted-foreground">{inv.so.soNumber}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(inv.amount))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(inv.paidAmount))}</TableCell>
                        <TableCell>
                          {inv.dueDate
                            ? new Date(inv.dueDate).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell>{invoiceStatusBadge(inv.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payable" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Purchase Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {purchaseInvoices.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
                  No purchase invoices found.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>PO</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseInvoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                        <TableCell>{inv.supplier.name}</TableCell>
                        <TableCell className="text-muted-foreground">{inv.po.poNumber}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(inv.amount))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(inv.paidAmount))}</TableCell>
                        <TableCell>
                          {inv.dueDate
                            ? new Date(inv.dueDate).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell>{invoiceStatusBadge(inv.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
