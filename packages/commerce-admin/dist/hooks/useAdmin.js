var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { useState, useEffect, useContext, createContext } from 'react';
import { adminRegistry } from '../services/AdminRegistryService';
import { permissionService } from '../services/PermissionService';
var AdminContext = createContext(null);
export var useAdmin = function () {
    var context = useContext(AdminContext);
    if (!context) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
};
export var useAdminProvider = function () {
    var _a = useState(null), user = _a[0], setUser = _a[1];
    var _b = useState([]), permissions = _b[0], setPermissions = _b[1];
    var _c = useState([]), modules = _c[0], setModules = _c[1];
    var _d = useState(true), isLoading = _d[0], setIsLoading = _d[1];
    var _e = useState(null), error = _e[0], setError = _e[1];
    useEffect(function () {
        initializeAdmin();
    }, []);
    var initializeAdmin = function () { return __awaiter(void 0, void 0, void 0, function () {
        var storedUser, userData, userPermissions;
        return __generator(this, function (_a) {
            try {
                setIsLoading(true);
                setError(null);
                storedUser = localStorage.getItem('admin_user');
                if (storedUser) {
                    userData = JSON.parse(storedUser);
                    setUser(userData);
                    userPermissions = permissionService.getUserPermissions(userData.id);
                    setPermissions(userPermissions);
                }
                // Load modules
                refreshModules();
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to initialize admin');
            }
            finally {
                setIsLoading(false);
            }
            return [2 /*return*/];
        });
    }); };
    var login = function (credentials) { return __awaiter(void 0, void 0, void 0, function () {
        var mockUser, userPermissions;
        return __generator(this, function (_a) {
            try {
                setIsLoading(true);
                setError(null);
                mockUser = {
                    id: 'admin-1',
                    name: 'Admin User',
                    email: credentials.email,
                    role: 'admin',
                    permissions: []
                };
                // Assign default role
                permissionService.assignRoles(mockUser.id, ['admin']);
                userPermissions = permissionService.getUserPermissions(mockUser.id);
                mockUser.permissions = userPermissions;
                setUser(mockUser);
                setPermissions(userPermissions);
                // Store in localStorage
                localStorage.setItem('admin_user', JSON.stringify(mockUser));
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Login failed');
                throw err;
            }
            finally {
                setIsLoading(false);
            }
            return [2 /*return*/];
        });
    }); };
    var logout = function () {
        setUser(null);
        setPermissions([]);
        localStorage.removeItem('admin_user');
    };
    var hasPermission = function (permission) {
        if (!user)
            return false;
        return permissionService.hasPermission(user.id, permission);
    };
    var hasAnyPermission = function (requiredPermissions) {
        if (!user)
            return false;
        return permissionService.hasAnyPermission(user.id, requiredPermissions);
    };
    var hasAllPermissions = function (requiredPermissions) {
        if (!user)
            return false;
        return permissionService.hasAllPermissions(user.id, requiredPermissions);
    };
    var refreshModules = function () {
        var registeredModules = adminRegistry.getModules();
        setModules(registeredModules);
    };
    return {
        user: user,
        permissions: permissions,
        modules: modules,
        isLoading: isLoading,
        error: error,
        login: login,
        logout: logout,
        hasPermission: hasPermission,
        hasAnyPermission: hasAnyPermission,
        hasAllPermissions: hasAllPermissions,
        refreshModules: refreshModules
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
//# sourceMappingURL=useAdmin.js.map