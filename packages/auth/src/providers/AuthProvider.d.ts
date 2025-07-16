/**
 * @repo/auth - Authentication Provider
 * React Context provider for pure authentication
 */
import React, { ReactNode } from 'react';
import { AuthConfig } from '../types';
import { AuthService } from '../auth/AuthService';
interface AuthContextValue {
    authService: AuthService | null;
    config: AuthConfig;
}
interface AuthProviderProps {
    children: ReactNode;
    config: AuthConfig;
    authService?: AuthService;
}
export declare function AuthProvider({ children, config, authService: externalAuthService }: AuthProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useAuthContext(): AuthContextValue;
export declare function useAuthService(): AuthService | null;
export declare function useAuthConfig(): AuthConfig;
export declare function withAuth<P extends object>(Component: React.ComponentType<P>): (props: P) => import("react/jsx-runtime").JSX.Element;
interface SimpleAuthProviderProps {
    children: ReactNode;
    apiUrl?: string;
    tokenStorageKey?: string;
    refreshTokenKey?: string;
}
export declare function SimpleAuthProvider({ children, apiUrl, tokenStorageKey, refreshTokenKey }: SimpleAuthProviderProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=AuthProvider.d.ts.map