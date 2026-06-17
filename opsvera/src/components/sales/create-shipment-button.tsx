"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PackagePlus } from "lucide-react";
import { createShipmentFromSO } from "@/actions/shipments";
import { toast } from "sonner";

export function CreateShipmentButton({ soId, disabled }: { soId: string, disabled?: boolean }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateShipment = async () => {
    setIsLoading(true);
    try {
      await createShipmentFromSO(soId);
      toast.success("Shipment created successfully. Ready for picking.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create shipment");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleCreateShipment} 
      disabled={isLoading || disabled}
      variant="secondary"
      className="w-full sm:w-auto"
    >
      <PackagePlus className="w-4 h-4 mr-2" />
      {isLoading ? "Creating..." : "Create Shipment"}
    </Button>
  );
}
