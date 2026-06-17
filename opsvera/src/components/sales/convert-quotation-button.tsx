"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRightLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { convertQuotationToSO } from "@/actions/quotations";

export function ConvertQuotationButton({ quotationId }: { quotationId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleConvert = async () => {
    setIsLoading(true);
    try {
      const result = await convertQuotationToSO(quotationId);
      toast.success("Converted to Sales Order successfully");
      router.push(`/sales/${result.data?.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to convert");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleConvert} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
      <ArrowRightLeft className="w-4 h-4 mr-2" />
      {isLoading ? "Converting..." : "Convert to Sales Order"}
    </Button>
  );
}
