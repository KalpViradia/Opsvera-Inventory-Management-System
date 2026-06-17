"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deactivateUser } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface DeactivateUserButtonProps {
  userId: string;
  userName: string;
  disabled: boolean;
}

export function DeactivateUserButton({ userId, userName, disabled }: DeactivateUserButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeactivate = async () => {
    try {
      await deactivateUser(userId);
      toast.success("User deactivated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to deactivate user");
    } finally {
      setShowConfirm(false);
    }
  };

  if (disabled) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive"
        onClick={() => setShowConfirm(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      
      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        onConfirm={handleDeactivate}
        title="Deactivate User"
        description={`Are you sure you want to deactivate ${userName}? They will lose access to the company immediately.`}
        confirmLabel="Deactivate"
        variant="destructive"
      />
    </>
  );
}
