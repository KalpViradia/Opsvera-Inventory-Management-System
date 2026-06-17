// ============================================
// OPSVERA RBAC CONSTANTS
// Role-Based Access Control system definitions
// ============================================

/**
 * System roles ordered by privilege level (highest to lowest).
 * Owner is the company creator. Admin has full access.
 * These map to the `role` field on the User model.
 */
export const ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  MANAGER: "manager",
  STAFF: "staff",
  VIEWER: "viewer",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Role hierarchy levels — higher number = more access.
 * Used for "at least this role" checks.
 */
export const ROLE_LEVELS: Record<Role, number> = {
  [ROLES.OWNER]: 5,
  [ROLES.ADMIN]: 4,
  [ROLES.MANAGER]: 3,
  [ROLES.STAFF]: 2,
  [ROLES.VIEWER]: 1,
};

/**
 * Human-readable labels for roles.
 */
export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.OWNER]: "Owner",
  [ROLES.ADMIN]: "Admin",
  [ROLES.MANAGER]: "Manager",
  [ROLES.STAFF]: "Staff",
  [ROLES.VIEWER]: "Viewer",
};

/**
 * Role descriptions for UI display.
 */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  [ROLES.OWNER]: "Full access. Company creator with billing and deletion rights.",
  [ROLES.ADMIN]: "Full access to all modules and settings. Cannot delete the company.",
  [ROLES.MANAGER]: "Can manage operations, approve orders, and view reports.",
  [ROLES.STAFF]: "Can create and edit records in assigned modules.",
  [ROLES.VIEWER]: "Read-only access across permitted modules.",
};

// ============================================
// MODULES & PERMISSIONS
// ============================================

/**
 * All application modules that can have permissions.
 */
export const MODULES = {
  DASHBOARD: "dashboard",
  PRODUCTS: "products",
  INVENTORY: "inventory",
  PURCHASES: "purchases",
  SUPPLIERS: "suppliers",
  SALES: "sales",
  CUSTOMERS: "customers",
  ACCOUNTING: "accounting",
  REPORTS: "reports",
  SETTINGS: "settings",
  USERS: "users",
  CUSTOM_FIELDS: "custom_fields",
  AUDIT: "audit",
} as const;

export type Module = (typeof MODULES)[keyof typeof MODULES];

/**
 * Permission actions that can be granted per module.
 */
export const ACTIONS = {
  READ: "read",
  WRITE: "write",
  DELETE: "delete",
  APPROVE: "approve",
} as const;

export type Action = (typeof ACTIONS)[keyof typeof ACTIONS];

/**
 * A permission string in the format "module:action"
 * e.g. "products:read", "sales:write", "users:delete"
 */
export type Permission = `${Module}:${Action}`;

/**
 * Helper to construct a typed permission string.
 */
export function permission(module: Module, action: Action): Permission {
  return `${module}:${action}`;
}

// ============================================
// PERMISSION MATRIX
// ============================================

interface ModulePermissions {
  read: boolean;
  write: boolean;
  delete: boolean;
  approve: boolean;
}

type PermissionMatrix = Record<Module, ModulePermissions>;

const FULL: ModulePermissions = { read: true, write: true, delete: true, approve: true };
const READ_WRITE: ModulePermissions = { read: true, write: true, delete: false, approve: false };
const READ_WRITE_APPROVE: ModulePermissions = { read: true, write: true, delete: false, approve: true };
const READ_ONLY: ModulePermissions = { read: true, write: false, delete: false, approve: false };
const NONE: ModulePermissions = { read: false, write: false, delete: false, approve: false };

/**
 * Default permission matrix for each system role.
 * This is used to seed RolePermission records when a company is created.
 */
export const ROLE_PERMISSION_MATRIX: Record<Role, PermissionMatrix> = {
  [ROLES.OWNER]: {
    [MODULES.DASHBOARD]: FULL,
    [MODULES.PRODUCTS]: FULL,
    [MODULES.INVENTORY]: FULL,
    [MODULES.PURCHASES]: FULL,
    [MODULES.SUPPLIERS]: FULL,
    [MODULES.SALES]: FULL,
    [MODULES.CUSTOMERS]: FULL,
    [MODULES.ACCOUNTING]: FULL,
    [MODULES.REPORTS]: FULL,
    [MODULES.SETTINGS]: FULL,
    [MODULES.USERS]: FULL,
    [MODULES.CUSTOM_FIELDS]: FULL,
    [MODULES.AUDIT]: FULL,
  },
  [ROLES.ADMIN]: {
    [MODULES.DASHBOARD]: FULL,
    [MODULES.PRODUCTS]: FULL,
    [MODULES.INVENTORY]: FULL,
    [MODULES.PURCHASES]: FULL,
    [MODULES.SUPPLIERS]: FULL,
    [MODULES.SALES]: FULL,
    [MODULES.CUSTOMERS]: FULL,
    [MODULES.ACCOUNTING]: FULL,
    [MODULES.REPORTS]: FULL,
    [MODULES.SETTINGS]: FULL,
    [MODULES.USERS]: FULL,
    [MODULES.CUSTOM_FIELDS]: FULL,
    [MODULES.AUDIT]: READ_ONLY,
  },
  [ROLES.MANAGER]: {
    [MODULES.DASHBOARD]: READ_ONLY,
    [MODULES.PRODUCTS]: READ_WRITE,
    [MODULES.INVENTORY]: READ_WRITE_APPROVE,
    [MODULES.PURCHASES]: READ_WRITE_APPROVE,
    [MODULES.SUPPLIERS]: READ_WRITE,
    [MODULES.SALES]: READ_WRITE_APPROVE,
    [MODULES.CUSTOMERS]: READ_WRITE,
    [MODULES.ACCOUNTING]: READ_ONLY,
    [MODULES.REPORTS]: READ_ONLY,
    [MODULES.SETTINGS]: NONE,
    [MODULES.USERS]: NONE,
    [MODULES.CUSTOM_FIELDS]: READ_ONLY,
    [MODULES.AUDIT]: READ_ONLY,
  },
  [ROLES.STAFF]: {
    [MODULES.DASHBOARD]: READ_ONLY,
    [MODULES.PRODUCTS]: READ_WRITE,
    [MODULES.INVENTORY]: READ_WRITE,
    [MODULES.PURCHASES]: READ_WRITE,
    [MODULES.SUPPLIERS]: READ_ONLY,
    [MODULES.SALES]: READ_WRITE,
    [MODULES.CUSTOMERS]: READ_WRITE,
    [MODULES.ACCOUNTING]: NONE,
    [MODULES.REPORTS]: READ_ONLY,
    [MODULES.SETTINGS]: NONE,
    [MODULES.USERS]: NONE,
    [MODULES.CUSTOM_FIELDS]: NONE,
    [MODULES.AUDIT]: NONE,
  },
  [ROLES.VIEWER]: {
    [MODULES.DASHBOARD]: READ_ONLY,
    [MODULES.PRODUCTS]: READ_ONLY,
    [MODULES.INVENTORY]: READ_ONLY,
    [MODULES.PURCHASES]: READ_ONLY,
    [MODULES.SUPPLIERS]: READ_ONLY,
    [MODULES.SALES]: READ_ONLY,
    [MODULES.CUSTOMERS]: READ_ONLY,
    [MODULES.ACCOUNTING]: READ_ONLY,
    [MODULES.REPORTS]: READ_ONLY,
    [MODULES.SETTINGS]: NONE,
    [MODULES.USERS]: NONE,
    [MODULES.CUSTOM_FIELDS]: NONE,
    [MODULES.AUDIT]: READ_ONLY,
  },
};

/**
 * Flat permission list for a role. Used for quick permission checks
 * without querying the database.
 */
export function getRolePermissions(role: Role): Permission[] {
  const matrix = ROLE_PERMISSION_MATRIX[role];
  if (!matrix) return [];

  const permissions: Permission[] = [];
  for (const [module, perms] of Object.entries(matrix)) {
    const mod = module as Module;
    if (perms.read) permissions.push(permission(mod, ACTIONS.READ));
    if (perms.write) permissions.push(permission(mod, ACTIONS.WRITE));
    if (perms.delete) permissions.push(permission(mod, ACTIONS.DELETE));
    if (perms.approve) permissions.push(permission(mod, ACTIONS.APPROVE));
  }
  return permissions;
}

/**
 * Check if a role has a specific permission (from the static matrix).
 */
export function roleHasPermission(role: Role, perm: Permission): boolean {
  const permissions = getRolePermissions(role);
  return permissions.includes(perm);
}

/**
 * Check if a role meets or exceeds a minimum role level.
 */
export function isAtLeastRole(userRole: Role, minimumRole: Role): boolean {
  return (ROLE_LEVELS[userRole] ?? 0) >= (ROLE_LEVELS[minimumRole] ?? 0);
}

/**
 * List of all system roles for seeding.
 */
export const SYSTEM_ROLES = Object.values(ROLES).map((name) => ({
  name,
  label: ROLE_LABELS[name],
  description: ROLE_DESCRIPTIONS[name],
  level: ROLE_LEVELS[name],
  isSystem: true,
}));
