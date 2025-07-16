/**
 * @company/auth - Authentication Store
 * Zustand-based state management for pure authentication
 */
import { AuthState, AuthStatus, AuthUser, AuthSession } from '../types';
interface AuthStore extends AuthState {
    setLoading: (isLoading: boolean) => void;
    setUser: (user: AuthUser | null) => void;
    setSession: (session: AuthSession | null) => void;
    setStatus: (status: AuthStatus) => void;
    setError: (error: string | null) => void;
    updateLastActivity: () => void;
    clearAuth: () => void;
    isAuthenticated: () => boolean;
    hasValidSession: () => boolean;
}
export declare const useAuthStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<AuthStore>, "subscribe"> & {
    subscribe: {
        (listener: (selectedState: AuthStore, previousSelectedState: AuthStore) => void): () => void;
        <U>(selector: (state: AuthStore) => U, listener: (selectedState: U, previousSelectedState: U) => void, options?: {
            equalityFn?: ((a: U, b: U) => boolean) | undefined;
            fireImmediately?: boolean;
        } | undefined): () => void;
    };
}>;
export declare const subscribeToAuthChanges: (callback: (state: AuthState) => void) => () => void;
export declare const subscribeToUser: (callback: (user: AuthUser | null) => void) => () => void;
export declare const subscribeToStatus: (callback: (status: AuthStatus) => void) => () => void;
export declare const subscribeToSession: (callback: (session: AuthSession | null) => void) => () => void;
export declare const authActions: {
    setLoading: (isLoading: boolean) => void;
    setUser: (user: AuthUser | null) => void;
    setSession: (session: AuthSession | null) => void;
    setStatus: (status: AuthStatus) => void;
    setError: (error: string | null) => void;
    updateLastActivity: () => void;
    clearAuth: () => void;
};
export declare const getAuthState: () => AuthStore;
export declare const isCurrentlyAuthenticated: () => boolean;
export declare const getCurrentUser: () => AuthUser | null;
export declare const getCurrentSession: () => AuthSession | null;
export declare const getAuthStatus: () => AuthStatus;
export declare const getAuthError: () => string | null;
export declare const resetAuthStore: () => void;
export {};
//# sourceMappingURL=AuthStore.d.ts.map