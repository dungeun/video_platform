import { ModuleConfig } from '../types';
interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: string;
    permissions: string[];
    avatar?: string;
}
interface AdminContextValue {
    user: AdminUser | null;
    permissions: string[];
    modules: ModuleConfig[];
    isLoading: boolean;
    error: string | null;
    login: (credentials: {
        email: string;
        password: string;
    }) => Promise<void>;
    logout: () => void;
    hasPermission: (permission: string) => boolean;
    hasAnyPermission: (permissions: string[]) => boolean;
    hasAllPermissions: (permissions: string[]) => boolean;
    refreshModules: () => void;
}
export declare const useAdmin: () => AdminContextValue;
export declare const useAdminProvider: () => AdminContextValue;
export {};
//# sourceMappingURL=useAdmin.d.ts.map