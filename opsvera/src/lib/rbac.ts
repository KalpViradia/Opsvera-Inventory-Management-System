import {
  type Role,
  type Permission,
  type Module,
  type Action,
  ROLE_LEVELS,
  roleHasPermission,
} from "@/constants/roles";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// ============================================
// SESSION HELPERS
// ============================================

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role | null;
  companyId: string | null;
  image?: string | null;
}

/**
 * Get the current authenticated session.
 * Returns null if not authenticated.
 */
export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

/**
 * Get the current user from session, typed with our fields.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session?.user) return null;

  let role = (session.user.role as Role) || null;
  let companyId = (session.user.companyId as string) || null;

  // Auto-accept pending invites for this email if they don't have a company yet
  if (!companyId) {
    const { prisma } = await import("@/lib/prisma");
    const pendingInvite = await prisma.invitation.findFirst({
      where: {
        email: session.user.email,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    if (pendingInvite) {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: session.user.id },
          data: {
            companyId: pendingInvite.companyId,
            role: pendingInvite.role,
          },
        });
        await tx.invitation.update({
          where: { id: pendingInvite.id },
          data: { status: "ACCEPTED" },
        });
      });
      companyId = pendingInvite.companyId;
      role = pendingInvite.role as Role;
    }
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role,
    companyId,
    image: session.user.image,
  };
}

// ============================================
// PERMISSION CHECKS (Server-side)
// ============================================

/**
 * Check if the current user has a specific permission.
 * Returns false if not authenticated or no role.
 */
export async function hasPermission(perm: Permission): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user?.role || !user.companyId) return false;
  
  const [module, action] = perm.split(":") as [Module, Action];
  
  // Try to find the DB role
  const { prisma } = await import("@/lib/prisma");
  const dbRole = await prisma.role.findUnique({
    where: {
      companyId_name: {
        companyId: user.companyId,
        name: user.role,
      }
    },
    include: {
      permissions: {
        where: { module }
      }
    }
  });

  if (dbRole && dbRole.permissions.length > 0) {
    const p = dbRole.permissions[0];
    switch (action) {
      case "read": return p.canRead;
      case "write": return p.canWrite;
      case "delete": return p.canDelete;
      case "approve": return p.canApprove;
      default: return false;
    }
  }

  // Fallback to static matrix
  return roleHasPermission(user.role, perm);
}

/**
 * Check if the current user has a specific role.
 */
export async function hasRole(role: Role): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === role;
}

/**
 * Check if the current user's role is at or above the minimum level.
 */
export async function hasMinimumRole(minimumRole: Role): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user?.role) return false;
  return (ROLE_LEVELS[user.role] ?? 0) >= (ROLE_LEVELS[minimumRole] ?? 0);
}

/**
 * Require a specific permission. Throws if not authorized.
 * Use in Server Actions and API routes.
 */
export async function requirePermission(perm: Permission): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: Not authenticated");
  }
  if (!user.companyId || !user.role) {
    redirect("/onboarding/company");
  }
  if (!roleHasPermission(user.role, perm)) {
    throw new Error(`Forbidden: Missing permission ${perm}. User role: ${user.role}, User ID: ${user.id}`);
  }
  return user;
}

/**
 * Require a specific role. Throws if not authorized.
 */
export async function requireRole(role: Role): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: Not authenticated");
  }
  if (!user.companyId || !user.role) {
    redirect("/onboarding/company");
  }
  if (user.role !== role) {
    throw new Error(`Forbidden: Requires role ${role}`);
  }
  return user;
}

/**
 * Require minimum role level. Throws if not authorized.
 */
export async function requireMinimumRole(minimumRole: Role): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: Not authenticated");
  }
  if (!user.companyId || !user.role) {
    redirect("/onboarding/company");
  }
  if ((ROLE_LEVELS[user.role] ?? 0) < (ROLE_LEVELS[minimumRole] ?? 0)) {
    throw new Error(`Forbidden: Requires at least ${minimumRole} role`);
  }
  return user;
}

/**
 * Require authentication. Throws if not authenticated.
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: Not authenticated");
  }
  return user;
}

/**
 * Require that the user has a company. Throws if no company assigned.
 */
export async function requireCompany(): Promise<SessionUser & { companyId: string }> {
  const user = await requireAuth();
  if (!user.companyId) {
    throw new Error("Forbidden: No company assigned");
  }
  return user as SessionUser & { companyId: string };
}

// ============================================
// CLIENT-SIDE HELPERS (Synchronous)
// ============================================

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
