"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Ban } from "lucide-react";
import { updateSalesOrderStatus } from "@/actions/sales";
import { toast } from "sonner";
import { SOStatus } from "@prisma/client";

interface ActionButtonsProps {
  soId: string;
  currentStatus: SOStatus;
}

export function ActionButtons({ soId, currentStatus }: ActionButtonsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: SOStatus, loadingKey: string) => {
    setIsLoading(loadingKey);
    try {
      await updateSalesOrderStatus(soId, { status: newStatus });
      
      toast.success(`Sales order status updated to ${newStatus}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <>
      {currentStatus === "DRAFT" && (
        <Button 
          className="bg-blue-600 hover:bg-blue-700" 
          onClick={() => handleStatusChange("CONFIRMED", "confirm")}
          disabled={isLoading !== null}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" /> 
          {isLoading === "confirm" ? "Confirming..." : "Confirm Order"}
        </Button>
      )}

      {(currentStatus === "DRAFT" || currentStatus === "CONFIRMED") && (
        <Button 
          variant="destructive" 
          onClick={() => handleStatusChange("CANCELLED", "cancel")}
          disabled={isLoading !== null}
        >
          <Ban className="mr-2 h-4 w-4" /> 
          {isLoading === "cancel" ? "Cancelling..." : "Cancel Order"}
        </Button>
      )}

      {currentStatus !== "DRAFT" && currentStatus !== "CANCELLED" && (
        <Button variant="outline" asChild>
          <a href={`/api/pdf/invoice/${soId}`} target="_blank" rel="noreferrer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2 h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M12 18v-6" />
              <path d="M9 15l3 3 3-3" />
            </svg>
            Download PDF
          </a>
        </Button>
      )}
    </>
  );
}
