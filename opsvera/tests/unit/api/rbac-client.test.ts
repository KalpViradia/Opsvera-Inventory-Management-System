import { describe, it, expect } from "vitest";
import { checkPermission, checkMinimumRole } from "../../../src/lib/rbac-client";
import { ROLES } from "../../../src/constants/roles";

describe("rbac-client: checkPermission()", () => {
  it("returns false for null/undefined role", () => {
    expect(checkPermission(null, "products", "read")).toBe(false);
    expect(checkPermission(undefined, "products", "read")).toBe(false);
  });

  it("Admin can read products", () => {
    expect(checkPermission(ROLES.ADMIN, "products", "read")).toBe(true);
  });

  it("Viewer can read products but not write", () => {
    expect(checkPermission(ROLES.VIEWER, "products", "read")).toBe(true);
    expect(checkPermission(ROLES.VIEWER, "products", "write")).toBe(false);
  });

  it("Staff cannot read accounting", () => {
    expect(checkPermission(ROLES.STAFF, "accounting", "read")).toBe(false);
  });

  it("Manager can read accounting", () => {
    expect(checkPermission(ROLES.MANAGER, "accounting", "read")).toBe(true);
  });

  it("No role can access settings except Owner and Admin", () => {
    expect(checkPermission(ROLES.OWNER, "settings", "read")).toBe(true);
    expect(checkPermission(ROLES.ADMIN, "settings", "read")).toBe(true);
    expect(checkPermission(ROLES.MANAGER, "settings", "read")).toBe(false);
    expect(checkPermission(ROLES.STAFF, "settings", "read")).toBe(false);
    expect(checkPermission(ROLES.VIEWER, "settings", "read")).toBe(false);
  });
});

describe("rbac-client: checkMinimumRole()", () => {
  it("returns false for null/undefined role", () => {
    expect(checkMinimumRole(null, ROLES.VIEWER)).toBe(false);
    expect(checkMinimumRole(undefined, ROLES.ADMIN)).toBe(false);
  });

  it("Admin meets the admin minimum", () => {
    expect(checkMinimumRole(ROLES.ADMIN, ROLES.ADMIN)).toBe(true);
  });

  it("Owner exceeds admin minimum", () => {
    expect(checkMinimumRole(ROLES.OWNER, ROLES.ADMIN)).toBe(true);
  });

  it("Manager does NOT meet admin minimum", () => {
    expect(checkMinimumRole(ROLES.MANAGER, ROLES.ADMIN)).toBe(false);
  });

  it("Viewer does NOT meet staff minimum", () => {
    expect(checkMinimumRole(ROLES.VIEWER, ROLES.STAFF)).toBe(false);
  });
});
