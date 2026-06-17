import { describe, it, expect } from "vitest";
import {
  ROLES,
  ROLE_LEVELS,
  ROLE_PERMISSION_MATRIX,
  roleHasPermission,
  isAtLeastRole,
  getRolePermissions,
  SYSTEM_ROLES,
  MODULES,
} from "../../../src/constants/roles";

describe("RBAC Constants & Logic", () => {
  describe("roleHasPermission()", () => {
    // Owner/Admin have FULL access to everything
    it("Owner should have full access to all modules", () => {
      for (const mod of Object.values(MODULES)) {
        expect(roleHasPermission(ROLES.OWNER, `${mod}:read`)).toBe(true);
        expect(roleHasPermission(ROLES.OWNER, `${mod}:write`)).toBe(true);
        expect(roleHasPermission(ROLES.OWNER, `${mod}:delete`)).toBe(true);
      }
    });

    it("Admin should have write access to products", () => {
      expect(roleHasPermission(ROLES.ADMIN, "products:write")).toBe(true);
    });

    it("Viewer should NOT have write access to products", () => {
      expect(roleHasPermission(ROLES.VIEWER, "products:write")).toBe(false);
    });

    it("Viewer should have read access to products", () => {
      expect(roleHasPermission(ROLES.VIEWER, "products:read")).toBe(true);
    });

    it("Staff should NOT have read access to accounting", () => {
      expect(roleHasPermission(ROLES.STAFF, "accounting:read")).toBe(false);
    });

    it("Staff should have write access to products", () => {
      expect(roleHasPermission(ROLES.STAFF, "products:write")).toBe(true);
    });

    it("Manager should have read access to accounting", () => {
      expect(roleHasPermission(ROLES.MANAGER, "accounting:read")).toBe(true);
    });

    it("Manager should NOT have write access to accounting", () => {
      expect(roleHasPermission(ROLES.MANAGER, "accounting:write")).toBe(false);
    });

    it("Viewer should NOT have access to settings", () => {
      expect(roleHasPermission(ROLES.VIEWER, "settings:read")).toBe(false);
    });
  });

  describe("isAtLeastRole()", () => {
    it("Owner is at least Admin", () => {
      expect(isAtLeastRole(ROLES.OWNER, ROLES.ADMIN)).toBe(true);
    });

    it("Admin is at least Admin", () => {
      expect(isAtLeastRole(ROLES.ADMIN, ROLES.ADMIN)).toBe(true);
    });

    it("Manager is at least Staff", () => {
      expect(isAtLeastRole(ROLES.MANAGER, ROLES.STAFF)).toBe(true);
    });

    it("Staff is NOT at least Manager", () => {
      expect(isAtLeastRole(ROLES.STAFF, ROLES.MANAGER)).toBe(false);
    });

    it("Viewer is NOT at least Staff", () => {
      expect(isAtLeastRole(ROLES.VIEWER, ROLES.STAFF)).toBe(false);
    });
  });

  describe("getRolePermissions()", () => {
    it("should return a non-empty array for all roles", () => {
      for (const role of Object.values(ROLES)) {
        const perms = getRolePermissions(role);
        expect(perms.length).toBeGreaterThan(0);
      }
    });

    it("Owner should have the most permissions", () => {
      const ownerPerms = getRolePermissions(ROLES.OWNER);
      const viewerPerms = getRolePermissions(ROLES.VIEWER);
      expect(ownerPerms.length).toBeGreaterThan(viewerPerms.length);
    });
  });

  describe("ROLE_LEVELS hierarchy", () => {
    it("Owner should have the highest level", () => {
      expect(ROLE_LEVELS[ROLES.OWNER]).toBeGreaterThan(ROLE_LEVELS[ROLES.ADMIN]);
    });

    it("Levels should be strictly ordered", () => {
      expect(ROLE_LEVELS[ROLES.OWNER]).toBeGreaterThan(ROLE_LEVELS[ROLES.ADMIN]);
      expect(ROLE_LEVELS[ROLES.ADMIN]).toBeGreaterThan(ROLE_LEVELS[ROLES.MANAGER]);
      expect(ROLE_LEVELS[ROLES.MANAGER]).toBeGreaterThan(ROLE_LEVELS[ROLES.STAFF]);
      expect(ROLE_LEVELS[ROLES.STAFF]).toBeGreaterThan(ROLE_LEVELS[ROLES.VIEWER]);
    });
  });

  describe("SYSTEM_ROLES seed data", () => {
    it("should have exactly 5 roles", () => {
      expect(SYSTEM_ROLES).toHaveLength(5);
    });

    it("every role should be marked isSystem", () => {
      for (const role of SYSTEM_ROLES) {
        expect(role.isSystem).toBe(true);
      }
    });
  });

  describe("ROLE_PERMISSION_MATRIX", () => {
    it("Staff should have NONE for accounting", () => {
      const staffAccounting = ROLE_PERMISSION_MATRIX[ROLES.STAFF][MODULES.ACCOUNTING];
      expect(staffAccounting.read).toBe(false);
      expect(staffAccounting.write).toBe(false);
    });

    it("Viewer should have read-only for products", () => {
      const viewerProducts = ROLE_PERMISSION_MATRIX[ROLES.VIEWER][MODULES.PRODUCTS];
      expect(viewerProducts.read).toBe(true);
      expect(viewerProducts.write).toBe(false);
      expect(viewerProducts.delete).toBe(false);
    });
  });
});
