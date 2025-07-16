/**
 * @repo/auth - Authentication Store
 * Zustand-based state management for pure authentication
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { AuthStatus } from '../types';
const initialState = {
    status: AuthStatus.LOADING,
    user: null,
    session: null,
    error: null,
    isLoading: false,
    lastActivity: null
};
export const useAuthStore = create()(subscribeWithSelector((set, get) => ({
    ...initialState,
    // Actions
    setLoading: (isLoading) => {
        set({ isLoading });
    },
    setUser: (user) => {
        set({ user });
    },
    setSession: (session) => {
        set({
            session,
            lastActivity: session ? new Date() : null
        });
    },
    setStatus: (status) => {
        set({ status });
    },
    setError: (error) => {
        set({ error });
    },
    updateLastActivity: () => {
        set({ lastActivity: new Date() });
    },
    clearAuth: () => {
        set({
            user: null,
            session: null,
            error: null,
            lastActivity: null
        });
    },
    // Getters
    isAuthenticated: () => {
        const state = get();
        return state.status === AuthStatus.AUTHENTICATED &&
            state.user !== null &&
            state.session !== null;
    },
    hasValidSession: () => {
        const state = get();
        if (!state.session)
            return false;
        const now = new Date();
        return state.session.expiresAt > now;
    }
})));
// Store 구독자들
export const subscribeToAuthChanges = (callback) => {
    return useAuthStore.subscribe(callback);
};
// 특정 필드만 구독
export const subscribeToUser = (callback) => {
    return useAuthStore.subscribe((state) => state.user, callback);
};
export const subscribeToStatus = (callback) => {
    return useAuthStore.subscribe((state) => state.status, callback);
};
export const subscribeToSession = (callback) => {
    return useAuthStore.subscribe((state) => state.session, callback);
};
// Store 액션 디스패처
export const authActions = {
    setLoading: useAuthStore.getState().setLoading,
    setUser: useAuthStore.getState().setUser,
    setSession: useAuthStore.getState().setSession,
    setStatus: useAuthStore.getState().setStatus,
    setError: useAuthStore.getState().setError,
    updateLastActivity: useAuthStore.getState().updateLastActivity,
    clearAuth: useAuthStore.getState().clearAuth
};
// 헬퍼 함수들
export const getAuthState = () => useAuthStore.getState();
export const isCurrentlyAuthenticated = () => {
    return useAuthStore.getState().isAuthenticated();
};
export const getCurrentUser = () => {
    return useAuthStore.getState().user;
};
export const getCurrentSession = () => {
    return useAuthStore.getState().session;
};
export const getAuthStatus = () => {
    return useAuthStore.getState().status;
};
export const getAuthError = () => {
    return useAuthStore.getState().error;
};
// Store 리셋 함수
export const resetAuthStore = () => {
    useAuthStore.setState(initialState);
};
// 개발자 도구용 (개발 환경에서만)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    window.authStore = useAuthStore;
    window.authActions = authActions;
}
//# sourceMappingURL=AuthStore.js.map