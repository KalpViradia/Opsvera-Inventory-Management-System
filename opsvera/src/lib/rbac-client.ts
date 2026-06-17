/**
 * Client-safe RBAC helpers.
 *
 * These are synchronous, pure functions that can be imported from
 * "use client" components without pulling in server-only deps
 * like next/headers.
 */
import {
  type Role,
  type Permission,
  type Module,
  type Action,
  ROLE_LEVELS,
  roleHasPermission,
} from "@/constants/roles";

/**
 * Synchronous permission check for client components
 * when the user object is already available.
 */
export function checkPermission(
  userRole: string | null | undefined,
  module: Module,
  action: Action
): boolean {
  if (!userRole) return false;
  const perm = `${module}:${action}` as Permission;
  return roleHasPermission(userRole as Role, perm);
}

/**
 * Synchronous role level check for client components.
 */
export function checkMinimumRole(
  userRole: string | null | undefined,
  minimumRole: Role
): boolean {
  if (!userRole) return false;
  return (ROLE_LEVELS[userRole as Role] ?? 0) >= (ROLE_LEVELS[minimumRole] ?? 0);
}
