export const permissionService = {
  getUserPermissions: (userId: string) => [],
  assignRoles: (userId: string, roles: string[]) => {},
  hasPermission: (userId: string, permission: string) => true,
  hasAnyPermission: (userId: string, permissions: string[]) => true,
  hasAllPermissions: (userId: string, permissions: string[]) => true,
};