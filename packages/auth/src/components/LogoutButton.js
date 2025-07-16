import { jsx as _jsx } from "react/jsx-runtime";
import { useAuth } from '../hooks/useAuth';
export function LogoutButton({ onLogoutSuccess, onLogoutError, className = '', children = '로그아웃', variant = 'secondary' }) {
    const { logout, isLoading } = useAuth();
    const handleLogout = async () => {
        const result = await logout();
        if (result.success) {
            onLogoutSuccess?.();
        }
        else {
            onLogoutError?.(result.error || '로그아웃에 실패했습니다');
        }
    };
    return (_jsx("button", { onClick: handleLogout, disabled: isLoading, className: `auth-logout-button auth-logout-button--${variant} ${className}`, children: isLoading ? '로그아웃 중...' : children }));
}
// 간단한 스타일링을 위한 CSS-in-JS (선택사항)
const styles = `
  .auth-logout-button {
    padding: 8px 16px;
    border: 1px solid transparent;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    display: inline-block;
  }

  .auth-logout-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .auth-logout-button--primary {
    background: #007bff;
    color: white;
    border-color: #007bff;
  }

  .auth-logout-button--primary:hover:not(:disabled) {
    background: #0056b3;
    border-color: #0056b3;
  }

  .auth-logout-button--secondary {
    background: #6c757d;
    color: white;
    border-color: #6c757d;
  }

  .auth-logout-button--secondary:hover:not(:disabled) {
    background: #545b62;
    border-color: #545b62;
  }

  .auth-logout-button--danger {
    background: #dc3545;
    color: white;
    border-color: #dc3545;
  }

  .auth-logout-button--danger:hover:not(:disabled) {
    background: #c82333;
    border-color: #c82333;
  }
`;
// 스타일 주입 (개발 환경에서만)
if (typeof document !== 'undefined' && !document.getElementById('auth-logout-button-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'auth-logout-button-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}
//# sourceMappingURL=LogoutButton.js.map