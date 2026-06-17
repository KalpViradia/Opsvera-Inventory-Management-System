"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { createLedgerAccount } from "@/actions/accounting";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const accountSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]),
  parentId: z.string().optional(),
  isGroup: z.boolean().default(false),
});

type AccountFormValues = z.infer<typeof accountSchema>;

export function CoaForm({ accounts }: { accounts: { id: string; code: string; name: string; isGroup: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AccountFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(accountSchema) as any,
    defaultValues: {
      isGroup: false,
      type: "ASSET",
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const isGroup = watch("isGroup");

  const onSubmit = async (data: AccountFormValues) => {
    setIsLoading(true);
    try {
      await createLedgerAccount(data);
      toast.success("Ledger account created");
      setOpen(false);
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Ledger Account</DialogTitle>
          <DialogDescription>
            Add a new account to your Chart of Accounts.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Account Code</Label>
              <Input
                id="code"
                placeholder="e.g. 1040"
                {...register("code")}
                className={errors.code ? "border-destructive" : ""}
              />
              {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Account Type</Label>
              <Select onValueChange={(val: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE") => setValue("type", val)} defaultValue="ASSET">
                <SelectTrigger id="type" className={errors.type ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASSET">Asset</SelectItem>
                  <SelectItem value="LIABILITY">Liability</SelectItem>
                  <SelectItem value="EQUITY">Equity</SelectItem>
                  <SelectItem value="REVENUE">Revenue</SelectItem>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Account Name</Label>
            <Input
              id="name"
              placeholder="e.g. Inventory"
              {...register("name")}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentId">Parent Group (Optional)</Label>
            <Select onValueChange={(val) => setValue("parentId", val === "none" ? undefined : val)}>
              <SelectTrigger id="parentId">
                <SelectValue placeholder="None (Root level)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Root level)</SelectItem>
                {accounts.filter(a => a.isGroup).map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.code} - {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="isGroup"
              checked={isGroup}
              onCheckedChange={(checked) => setValue("isGroup", checked)}
            />
            <Label htmlFor="isGroup" className="font-normal">
              This is a group account (cannot have direct transactions)
            </Label>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
