"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateUserRole } from "@/actions/users";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface UserRoleSelectProps {
  userId: string;
  currentRole: string;
  isCurrentUser: boolean;
  canEdit: boolean;
}

export function UserRoleSelect({ userId, currentRole, isCurrentUser, canEdit }: UserRoleSelectProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleChange = async (newRole: string) => {
    if (newRole === currentRole) return;
    
    setIsLoading(true);
    try {
      await updateUserRole({
        userId,
        role: newRole as "admin" | "manager" | "staff" | "viewer",
      });
      toast.success("User role updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update role");
    } finally {
      setIsLoading(false);
    }
  };

  if (!canEdit || isCurrentUser || currentRole === "owner") {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      owner: { variant: "destructive", label: "Owner" },
      admin: { variant: "default", label: "Admin" },
      manager: { variant: "default", label: "Manager" },
      staff: { variant: "outline", label: "Staff" },
      viewer: { variant: "secondary", label: "Viewer" },
    };
  
    const config = variants[currentRole] || { variant: "secondary" as const, label: currentRole };
    return <Badge variant={config.variant} className="capitalize">{config.label}</Badge>;
  }

  return (
    <Select
      defaultValue={currentRole}
      onValueChange={handleRoleChange}
      disabled={isLoading}
    >
      <SelectTrigger className="w-[130px] h-8">
        <SelectValue placeholder="Select role" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="manager">Manager</SelectItem>
        <SelectItem value="staff">Staff</SelectItem>
        <SelectItem value="viewer">Viewer</SelectItem>
      </SelectContent>
    </Select>
  );
}
