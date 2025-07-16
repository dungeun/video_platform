import { useState, useEffect, useContext, createContext } from 'react';
import { adminRegistry } from '../services/AdminRegistryService';
import { permissionService } from '../services/PermissionService';
import { ModuleConfig, UserRole } from '../types';

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
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  refreshModules: () => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export const useAdmin = (): AdminContextValue => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const useAdminProvider = (): AdminContextValue => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [modules, setModules] = useState<ModuleConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeAdmin();
  }, []);

  const initializeAdmin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check for existing session
      const storedUser = localStorage.getItem('admin_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Load user permissions
        const userPermissions = permissionService.getUserPermissions(userData.id);
        setPermissions(userPermissions);
      }

      // Load modules
      refreshModules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize admin');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    try {
      setIsLoading(true);
      setError(null);

      // Mock authentication - replace with actual API call
      const mockUser: AdminUser = {
        id: 'admin-1',
        name: 'Admin User',
        email: credentials.email,
        role: 'admin',
        permissions: []
      };

      // Assign default role
      permissionService.assignRoles(mockUser.id, ['admin']);
      const userPermissions = permissionService.getUserPermissions(mockUser.id);
      
      mockUser.permissions = userPermissions;
      setUser(mockUser);
      setPermissions(userPermissions);

      // Store in localStorage
      localStorage.setItem('admin_user', JSON.stringify(mockUser));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setPermissions([]);
    localStorage.removeItem('admin_user');
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return permissionService.hasPermission(user.id, permission);
  };

  const hasAnyPermission = (requiredPermissions: string[]): boolean => {
    if (!user) return false;
    return permissionService.hasAnyPermission(user.id, requiredPermissions);
  };

  const hasAllPermissions = (requiredPermissions: string[]): boolean => {
    if (!user) return false;
    return permissionService.hasAllPermissions(user.id, requiredPermissions);
  };

  const refreshModules = () => {
    const registeredModules = adminRegistry.getModules();
    setModules(registeredModules);
  };

  return {
    user,
    permissions,
    modules,
    isLoading,
    error,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshModules
  };
};

// Provider component
// export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const adminValue = useAdminProvider();
  
//   return (
//     <AdminContext.Provider value={adminValue}>
//       {children}
//     </AdminContext.Provider>
//   );
// };

// export default useAdmin;