/**
 * useMobileNavigation Hook
 * 모바일 네비게이션 상태 관리
 */
import { useState, useCallback, useEffect } from 'react';
import { isMobileDevice } from '../utils/navigationHelpers';
export const useMobileNavigation = (options) => {
    const { breakpoint = 768, autoDetectMobile = true, closeOnItemClick = true, closeOnOutsideClick = true, preventBodyScroll = true } = options;
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [activeSubmenu, setActiveSubmenu] = useState(null);
    // 모바일 감지
    useEffect(() => {
        if (!autoDetectMobile)
            return undefined;
        const checkMobile = () => {
            const mobile = window.innerWidth < breakpoint || isMobileDevice();
            setIsMobile(mobile);
            // 데스크톱으로 변경시 메뉴 닫기
            if (!mobile && isOpen) {
                setIsOpen(false);
                setActiveSubmenu(null);
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, [autoDetectMobile, breakpoint, isOpen]);
    // 바디 스크롤 제어
    useEffect(() => {
        if (preventBodyScroll && isOpen && isMobile) {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
        return undefined;
    }, [isOpen, isMobile, preventBodyScroll]);
    // ESC 키로 메뉴 닫기
    useEffect(() => {
        if (isOpen) {
            const handleKeyDown = (event) => {
                if (event.key === 'Escape') {
                    if (activeSubmenu) {
                        setActiveSubmenu(null);
                    }
                    else {
                        setIsOpen(false);
                    }
                }
            };
            document.addEventListener('keydown', handleKeyDown);
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
        return undefined;
    }, [isOpen, activeSubmenu]);
    // 메뉴 토글
    const toggle = useCallback(() => {
        setIsOpen(prev => !prev);
        if (isOpen) {
            setActiveSubmenu(null);
        }
    }, [isOpen]);
    // 메뉴 열기
    const open = useCallback(() => {
        setIsOpen(true);
    }, []);
    // 메뉴 닫기
    const close = useCallback(() => {
        setIsOpen(false);
        setActiveSubmenu(null);
    }, []);
    // 서브메뉴 열기
    const openSubmenu = useCallback((itemId) => {
        setActiveSubmenu(itemId);
    }, []);
    // 서브메뉴 닫기
    const closeSubmenu = useCallback(() => {
        setActiveSubmenu(null);
    }, []);
    // 아이템 클릭 핸들러
    const handleItemClick = useCallback((item, onItemClick) => {
        if (item.disabled)
            return;
        // 하위 메뉴가 있는 경우
        if (item.children && item.children.length > 0) {
            if (activeSubmenu === item.id) {
                closeSubmenu();
            }
            else {
                openSubmenu(item.id);
            }
            return;
        }
        // 커스텀 핸들러 실행
        onItemClick?.(item);
        // 아이템 자체 핸들러 실행
        if (item.onClick) {
            item.onClick({});
        }
        // 메뉴 닫기 (옵션에 따라)
        if (closeOnItemClick) {
            close();
        }
    }, [activeSubmenu, closeOnItemClick, openSubmenu, closeSubmenu, close]);
    // 백드롭 클릭 핸들러
    const handleBackdropClick = useCallback(() => {
        if (closeOnOutsideClick) {
            close();
        }
    }, [closeOnOutsideClick, close]);
    // 네비게이션 props
    const navigationProps = {
        className: `mobile-navigation ${isOpen ? 'open' : 'closed'}`,
        'data-testid': 'mobile-navigation',
        'aria-expanded': isOpen
    };
    // 백드롭 props
    const backdropProps = {
        onClick: handleBackdropClick,
        className: `mobile-navigation-backdrop ${isOpen ? 'open' : 'closed'}`
    };
    return {
        isOpen,
        isMobile,
        activeSubmenu,
        toggle,
        open,
        close,
        openSubmenu,
        closeSubmenu,
        handleItemClick,
        handleBackdropClick,
        navigationProps,
        backdropProps
    };
};
//# sourceMappingURL=useMobileNavigation.js.map