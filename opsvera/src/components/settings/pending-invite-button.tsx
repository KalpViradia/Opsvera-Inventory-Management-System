"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";
import { cancelInvitation } from "@/actions/invitations";

import { Button } from "@/components/ui/button";

export function PendingInviteButton({ inviteId }: { inviteId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      await cancelInvitation(inviteId);
      toast.success("Invitation cancelled");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel invitation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={handleCancel}
      disabled={isLoading}
      title="Cancel Invitation"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </Button>
  );
}
