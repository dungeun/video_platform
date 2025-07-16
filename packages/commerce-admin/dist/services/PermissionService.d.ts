export declare const permissionService: {
    getUserPermissions: (userId: string) => never[];
    assignRoles: (userId: string, roles: string[]) => void;
    hasPermission: (userId: string, permission: string) => boolean;
    hasAnyPermission: (userId: string, permissions: string[]) => boolean;
    hasAllPermissions: (userId: string, permissions: string[]) => boolean;
};
//# sourceMappingURL=PermissionService.d.ts.map