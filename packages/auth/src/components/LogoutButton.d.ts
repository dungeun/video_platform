/**
 * @repo/auth - Logout Button Component
 * Simple logout button for authentication
 */
import React from 'react';
interface LogoutButtonProps {
    onLogoutSuccess?: () => void;
    onLogoutError?: (error: string) => void;
    className?: string;
    children?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger';
}
export declare function LogoutButton({ onLogoutSuccess, onLogoutError, className, children, variant }: LogoutButtonProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=LogoutButton.d.ts.map