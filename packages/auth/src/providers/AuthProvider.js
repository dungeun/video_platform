import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @company/auth - Authentication Provider
 * React Context provider for pure authentication
 */
import React, { createContext, useContext, useEffect } from 'react';
import { AuthService } from '../auth/AuthService';
const AuthContext = createContext(null);
export function AuthProvider({ children, config, authService: externalAuthService }) {
    const [authService, setAuthService] = React.useState(externalAuthService || null);
    useEffect(() => {
        if (!externalAuthService) {
            const service = new AuthService(config);
            setAuthService(service);
            // 토큰 및 세션 자동 정리 설정은 서비스 내부에서 처리
            return () => {
                service.destroy();
            };
        }
    }, [config, externalAuthService]);
    const contextValue = {
        authService: externalAuthService || authService,
        config
    };
    return (_jsx(AuthContext.Provider, { value: contextValue, children: children }));
}
export function useAuthContext() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
}
// AuthProvider를 사용하는 편의 함수들
export function useAuthService() {
    const { authService } = useAuthContext();
    return authService;
}
export function useAuthConfig() {
    const { config } = useAuthContext();
    return config;
}
// HOC for protecting components
export function withAuth(Component) {
    return function AuthenticatedComponent(props) {
        const { authService } = useAuthContext();
        if (!authService?.isAuthenticated()) {
            return (_jsx("div", { className: "auth-required", children: _jsx("p", { children: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }) }));
        }
        return _jsx(Component, { ...props });
    };
}
export function SimpleAuthProvider({ children, apiUrl = '/api', tokenStorageKey = 'auth-token', refreshTokenKey = 'refresh-token' }) {
    const defaultConfig = {
        apiUrl,
        tokenStorageKey,
        refreshTokenKey,
        sessionTimeout: 120, // 2시간
        rememberMeDuration: 30, // 30일
        autoRefreshToken: true,
        logoutOnWindowClose: false
    };
    return (_jsx(AuthProvider, { config: defaultConfig, children: children }));
}
//# sourceMappingURL=AuthProvider.js.map