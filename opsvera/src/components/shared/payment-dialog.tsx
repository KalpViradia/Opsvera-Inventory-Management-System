"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, DollarSign } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { recordPayment } from "@/actions/payments";

interface PaymentDialogProps {
  invoiceId: string;
  invoiceType: "SALES" | "PURCHASE";
  totalAmount: number;
  paidAmount: number;
}

export function PaymentDialog({ invoiceId, invoiceType, totalAmount, paidAmount }: PaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const remainingAmount = Math.max(0, totalAmount - paidAmount);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      amount: remainingAmount,
      method: "BANK_TRANSFER",
      reference: "",
      notes: "",
    },
  });

  const onSubmit = async (data: { amount: number; method: string; reference?: string; notes?: string }) => {
    setIsLoading(true);
    try {
      await recordPayment({
        invoiceId,
        invoiceType,
        date: new Date(),
        ...data,
      });
      toast.success("Payment recorded successfully");
      setOpen(false);
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to record payment");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={remainingAmount <= 0}>
          <DollarSign className="h-4 w-4" />
          {remainingAmount <= 0 ? "Fully Paid" : "Record Payment"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Enter the details for this {invoiceType === "SALES" ? "incoming" : "outgoing"} payment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number" onFocus={(e) => e.target.select()}
              step="0.01"
              max={remainingAmount}
              {...register("amount", { valueAsNumber: true, min: 0.01, max: remainingAmount })}
            />
            {errors.amount && <p className="text-xs text-destructive">Invalid amount</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Payment Method *</Label>
            <select
              id="method"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register("method")}
            >
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="CASH">Cash</option>
              <option value="CHECK">Check</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference / Transaction ID</Label>
            <Input id="reference" {...register("reference")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
