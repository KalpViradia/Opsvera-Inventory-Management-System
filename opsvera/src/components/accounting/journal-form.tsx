"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createManualJournalEntry } from "@/actions/accounting";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const journalItemSchema = z.object({
  accountId: z.string().min(1, "Account required"),
  debit: z.number().min(0),
  credit: z.number().min(0),
  narration: z.string().optional(),
});

const journalSchema = z.object({
  date: z.string().min(1, "Date is required"),
  narration: z.string().min(1, "Narration is required"),
  items: z.array(journalItemSchema).min(2, "At least 2 lines required"),
});

type JournalFormValues = z.infer<typeof journalSchema>;

export function JournalForm({ accounts }: { accounts: { id: string; code: string; name: string; isGroup: boolean }[] }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<JournalFormValues>({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      items: [
        { accountId: "", debit: 0, credit: 0, narration: "" },
        { accountId: "", debit: 0, credit: 0, narration: "" },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const watchItems = watch("items");
  const totalDebit = watchItems.reduce((sum, item) => sum + (Number(item.debit) || 0), 0);
  const totalCredit = watchItems.reduce((sum, item) => sum + (Number(item.credit) || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.01 && totalDebit > 0;

  const onSubmit = async (data: JournalFormValues) => {
    if (!isBalanced) {
      toast.error("Journal entry is not balanced");
      return;
    }

    setIsLoading(true);
    try {
      await createManualJournalEntry({
        date: new Date(data.date),
        narration: data.narration,
        items: data.items,
      });
      toast.success("Journal entry created successfully");
      router.push("/accounting/journals");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create entry");
    } finally {
      setIsLoading(false);
    }
  };

  const leafAccounts = accounts.filter(a => !a.isGroup);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                {...register("date")}
                className={errors.date ? "border-destructive" : ""}
              />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="narration">Narration / Description</Label>
              <Input
                id="narration"
                placeholder="Description of the transaction"
                {...register("narration")}
                className={errors.narration ? "border-destructive" : ""}
              />
              {errors.narration && <p className="text-xs text-destructive">{errors.narration.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Narration (Line)</TableHead>
                <TableHead className="w-[150px] text-right">Debit</TableHead>
                <TableHead className="w-[150px] text-right">Credit</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell>
                    <Select
                      onValueChange={(val) => setValue(`items.${index}.accountId`, val)}
                    >
                      <SelectTrigger className={errors.items?.[index]?.accountId ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select Account" />
                      </SelectTrigger>
                      <SelectContent>
                        {leafAccounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.code} - {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Line description"
                      {...register(`items.${index}.narration`)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number" onFocus={(e) => e.target.select()}
                      step="0.01"
                      min="0"
                      className="text-right"
                      {...register(`items.${index}.debit`, { valueAsNumber: true })}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setValue(`items.${index}.debit`, val);
                        if (val > 0) setValue(`items.${index}.credit`, 0);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number" onFocus={(e) => e.target.select()}
                      step="0.01"
                      min="0"
                      className="text-right"
                      {...register(`items.${index}.credit`, { valueAsNumber: true })}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setValue(`items.${index}.credit`, val);
                        if (val > 0) setValue(`items.${index}.debit`, 0);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => remove(index)}
                      disabled={fields.length <= 2}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableCell colSpan={2}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ accountId: "", debit: 0, credit: 0, narration: "" })}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Line
                  </Button>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  ${totalDebit.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  ${totalCredit.toFixed(2)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {!isBalanced && totalDebit > 0 && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm font-medium border border-destructive/20 text-center">
          Journal entry is out of balance by ${difference.toFixed(2)}. Total Debits must equal Total Credits.
        </div>
      )}

      <div className="flex justify-end gap-4">
        <Button variant="outline" type="button" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !isBalanced}>
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Post Journal Entry
        </Button>
      </div>
    </form>
  );
}
