import type { AccessControlDoc, AccessMatrix, AccessRoleDefinition } from "./access-types";
import { buildDefaultAccessControlDoc } from "./defaults";

type AccessSnapshot = {
  roles: AccessRoleDefinition[];
  matrix: AccessMatrix;
  hydrated: boolean;
};

const snapshot: AccessSnapshot = {
  ...buildDefaultAccessControlDoc(),
  hydrated: false,
};

export function getAccessSnapshot(): AccessControlDoc & { hydrated: boolean } {
  return {
    roles: snapshot.roles,
    matrix: snapshot.matrix,
    hydrated: snapshot.hydrated,
  };
}

export function hydrateAccessControl(doc: AccessControlDoc): void {
  snapshot.roles = Array.isArray(doc.roles) ? doc.roles.map((r) => ({ ...r })) : [];
  snapshot.matrix = doc.matrix && typeof doc.matrix === "object" ? structuredClone(doc.matrix) : {};
  snapshot.hydrated = true;
}

export function resetAccessControlToBuiltin(): void {
  const doc = buildDefaultAccessControlDoc();
  snapshot.roles = doc.roles;
  snapshot.matrix = doc.matrix;
  snapshot.hydrated = false;
}

export function getRoleDefinition(roleId: string): AccessRoleDefinition | undefined {
  return snapshot.roles.find((r) => r.id === roleId);
}

export function getActiveRoles(): AccessRoleDefinition[] {
  return snapshot.roles
    .filter((r) => r.active)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getRoleLabel(roleId: string): string {
  const found = snapshot.roles.find((r) => r.id === roleId);
  if (found) return found.label;
  return roleId;
}
