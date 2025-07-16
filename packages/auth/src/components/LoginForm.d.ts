/**
 * @company/auth - Login Form Component
 * Pure login form for authentication
 */
interface LoginFormProps {
    onLoginSuccess?: () => void;
    onLoginError?: (error: string) => void;
    className?: string;
    showRememberMe?: boolean;
}
export declare function LoginForm({ onLoginSuccess, onLoginError, className, showRememberMe }: LoginFormProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=LoginForm.d.ts.map