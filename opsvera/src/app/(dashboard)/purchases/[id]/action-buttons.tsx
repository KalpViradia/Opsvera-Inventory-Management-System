"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, FileText, Ban } from "lucide-react";
import { updatePurchaseOrderStatus } from "@/actions/purchases";
import { toast } from "sonner";
import { POStatus } from "@prisma/client";

interface ActionButtonsProps {
  poId: string;
  currentStatus: POStatus;
  canWrite: boolean;
  canApprove: boolean;
}

export function ActionButtons({ poId, currentStatus, canWrite, canApprove }: ActionButtonsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: POStatus, loadingKey: string) => {
    setIsLoading(loadingKey);
    try {
      await updatePurchaseOrderStatus(poId, { status: newStatus });
      
      toast.success(`Purchase order status updated to ${newStatus}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <>
      {currentStatus === "DRAFT" && canWrite && (
        <Button 
          variant="outline" 
          onClick={() => handleStatusChange("SUBMITTED", "submit")}
          disabled={isLoading !== null}
        >
          <FileText className="mr-2 h-4 w-4" /> 
          {isLoading === "submit" ? "Submitting..." : "Submit for Approval"}
        </Button>
      )}

      {currentStatus === "SUBMITTED" && canApprove && (
        <Button 
          className="bg-blue-600 hover:bg-blue-700" 
          onClick={() => handleStatusChange("APPROVED", "approve")}
          disabled={isLoading !== null}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" /> 
          {isLoading === "approve" ? "Approving..." : "Approve Order"}
        </Button>
      )}

      {(currentStatus === "DRAFT" || currentStatus === "SUBMITTED") && canWrite && (
        <Button 
          variant="destructive" 
          onClick={() => handleStatusChange("CANCELLED", "cancel")}
          disabled={isLoading !== null}
        >
          <Ban className="mr-2 h-4 w-4" /> 
          {isLoading === "cancel" ? "Cancelling..." : "Cancel Order"}
        </Button>
      )}
    </>
  );
}
