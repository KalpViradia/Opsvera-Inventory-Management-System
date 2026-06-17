"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Lock, ShieldAlert, Check } from "lucide-react";
import { updateRolePermission } from "@/actions/roles";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MODULES } from "@/constants/roles";
import { Role, RolePermission } from "@prisma/client";

// Group modules for better UI
const MODULE_GROUPS = {
  Core: [MODULES.DASHBOARD, MODULES.PRODUCTS, MODULES.INVENTORY],
  Sales: [MODULES.SALES, MODULES.CUSTOMERS],
  Purchasing: [MODULES.PURCHASES, MODULES.SUPPLIERS],
  Finance: [MODULES.ACCOUNTING, MODULES.REPORTS],
  Administration: [MODULES.SETTINGS, MODULES.USERS, MODULES.CUSTOM_FIELDS, MODULES.AUDIT],
};

interface RolePermissionEditorProps {
  roles: (Role & { permissions: RolePermission[] })[];
}

export function RolePermissionEditor({ roles }: RolePermissionEditorProps) {
  // We only show editable roles in the main matrix to keep it clean,
  // Owner and Admin are implicit "all permissions"
  const editableRoles = roles.filter(r => r.name !== "owner" && r.name !== "admin");
  const immutableRoles = roles.filter(r => r.name === "owner" || r.name === "admin");

  const [localRoles, setLocalRoles] = useState(editableRoles);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleToggle = async (roleId: string, module: string, action: "canRead" | "canWrite" | "canDelete" | "canApprove", checked: boolean) => {
    const updateKey = `${roleId}-${module}-${action}`;
    setIsUpdating(updateKey);

    // Optimistic update
    setLocalRoles(current => 
      current.map(role => {
        if (role.id === roleId) {
          const existingPermIndex = role.permissions.findIndex(p => p.module === module);
          const newPermissions = [...role.permissions];
          
          if (existingPermIndex >= 0) {
            newPermissions[existingPermIndex] = { ...newPermissions[existingPermIndex], [action]: checked };
          } else {
            // Need to mock a new permission record
            newPermissions.push({
              id: "temp",
              roleId,
              companyId: role.companyId,
              module,
              canRead: action === "canRead" ? checked : false,
              canWrite: action === "canWrite" ? checked : false,
              canDelete: action === "canDelete" ? checked : false,
              canApprove: action === "canApprove" ? checked : false,
            });
          }
          return { ...role, permissions: newPermissions };
        }
        return role;
      })
    );

    try {
      await updateRolePermission(roleId, module, { [action]: checked });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update permission");
      // Revert optimism if failed (simplified: requires full refetch or reverting state, 
      // but for this UI we'll just show the error)
    } finally {
      setIsUpdating(null);
    }
  };

  const getPermission = (role: Role & { permissions: RolePermission[] }, module: string) => {
    return role.permissions.find(p => p.module === module) || {
      canRead: false,
      canWrite: false,
      canDelete: false,
      canApprove: false,
    };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            System Roles
          </CardTitle>
          <CardDescription>
            These foundational roles cannot be modified to ensure system stability.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            {immutableRoles.map(role => (
              <div key={role.id} className="flex-1 border rounded-lg p-4 bg-muted/10">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold capitalize text-base">{role.name}</h4>
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Has full access to all system modules and actions.
                </p>
                {role.name === "owner" && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-500" /> Billing & deletion rights
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role Permissions Matrix</CardTitle>
          <CardDescription>
            Customize access levels for your team members. Changes are saved automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full max-w-full overflow-auto">
            <div className="min-w-[800px] p-6 pt-0">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left py-4 px-4 sticky left-0 bg-background z-10 w-[200px] border-b">Module</th>
                    {localRoles.map(role => (
                      <th key={role.id} className="text-center py-4 px-2 border-b min-w-[200px]">
                        <div className="capitalize font-semibold text-lg">{role.label}</div>
                        <div className="text-xs font-normal text-muted-foreground mt-1 px-4 truncate" title={role.description || ""}>
                          {role.description}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(MODULE_GROUPS).map(([groupName, modules]) => (
                    <React.Fragment key={groupName}>
                      {/* Group Header */}
                      <tr className="bg-muted/30">
                        <td colSpan={localRoles.length + 1} className="py-2 px-4 font-semibold text-sm text-muted-foreground border-y">
                          {groupName}
                        </td>
                      </tr>
                      
                      {/* Modules */}
                      {modules.map(module => (
                        <tr key={module} className="border-b hover:bg-muted/10 transition-colors">
                          <td className="py-4 px-4 sticky left-0 bg-background z-10 capitalize font-medium">
                            {module.replace("_", " ")}
                          </td>
                          
                          {localRoles.map(role => {
                            const perms = getPermission(role, module);
                            return (
                              <td key={`${role.id}-${module}`} className="py-4 px-2 align-top border-l">
                                <div className="space-y-3 px-4">
                                  {/* Read */}
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm">Read</span>
                                    <Switch 
                                      checked={perms.canRead} 
                                      onCheckedChange={(c) => handleToggle(role.id, module, "canRead", c)}
                                      disabled={isUpdating === `${role.id}-${module}-canRead`}
                                    />
                                  </div>
                                  
                                  {/* Write */}
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm">Write</span>
                                    <Switch 
                                      checked={perms.canWrite} 
                                      onCheckedChange={(c) => handleToggle(role.id, module, "canWrite", c)}
                                      disabled={isUpdating === `${role.id}-${module}-canWrite` || !perms.canRead} // Must be able to read to write
                                    />
                                  </div>
                                  
                                  {/* Delete */}
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm">Delete</span>
                                    <Switch 
                                      checked={perms.canDelete} 
                                      onCheckedChange={(c) => handleToggle(role.id, module, "canDelete", c)}
                                      disabled={isUpdating === `${role.id}-${module}-canDelete` || !perms.canWrite} // Must be able to write to delete
                                    />
                                  </div>
                                  
                                  {/* Approve (Only relevant for some modules, but we'll show it everywhere for simplicity, or conditionally) */}
                                  {["purchases", "sales", "inventory"].includes(module) && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-primary font-medium">Approve</span>
                                      <Switch 
                                        checked={perms.canApprove} 
                                        onCheckedChange={(c) => handleToggle(role.id, module, "canApprove", c)}
                                        disabled={isUpdating === `${role.id}-${module}-canApprove` || !perms.canRead}
                                      />
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
