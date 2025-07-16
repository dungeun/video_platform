/**
 * useUserMenu Hook
 * 사용자 메뉴 상태 관리
 */
import { useState, useCallback, useRef, useEffect } from 'react';
export const useUserMenu = (options) => {
    const { user, items, onItemClick, closeOnItemClick = true, closeOnOutsideClick = true } = options;
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    const triggerRef = useRef(null);
    // 메뉴 열기
    const open = useCallback(() => {
        setIsOpen(true);
    }, []);
    // 메뉴 닫기
    const close = useCallback(() => {
        setIsOpen(false);
    }, []);
    // 메뉴 토글
    const toggle = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);
    // 아이템 클릭 핸들러
    const handleItemClick = useCallback((item) => {
        if (item.disabled)
            return;
        // 구분선은 클릭 불가
        if (item.divider)
            return;
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
    }, [onItemClick, closeOnItemClick, close]);
    // 외부 클릭 핸들러
    const handleOutsideClick = useCallback((event) => {
        if (!closeOnOutsideClick || !isOpen)
            return;
        const target = event.target;
        // 메뉴나 트리거 내부 클릭은 무시
        if ((menuRef.current && menuRef.current.contains(target)) ||
            (triggerRef.current && triggerRef.current.contains(target))) {
            return;
        }
        close();
    }, [closeOnOutsideClick, isOpen, close]);
    // 외부 클릭 감지
    useEffect(() => {
        if (isOpen && closeOnOutsideClick) {
            document.addEventListener('mousedown', handleOutsideClick);
            return () => {
                document.removeEventListener('mousedown', handleOutsideClick);
            };
        }
        return undefined;
    }, [isOpen, closeOnOutsideClick, handleOutsideClick]);
    // ESC 키로 메뉴 닫기
    useEffect(() => {
        if (isOpen) {
            const handleKeyDown = (event) => {
                if (event.key === 'Escape') {
                    close();
                    triggerRef.current?.focus();
                }
            };
            document.addEventListener('keydown', handleKeyDown);
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
        return undefined;
    }, [isOpen, close]);
    // 키보드 네비게이션 (메뉴 내부)
    useEffect(() => {
        if (isOpen && menuRef.current) {
            const menuItems = menuRef.current.querySelectorAll('[role="menuitem"]');
            let currentIndex = 0;
            const handleMenuKeyDown = (event) => {
                switch (event.key) {
                    case 'ArrowDown':
                        event.preventDefault();
                        currentIndex = (currentIndex + 1) % menuItems.length;
                        menuItems[currentIndex]?.focus();
                        break;
                    case 'ArrowUp':
                        event.preventDefault();
                        currentIndex = currentIndex === 0 ? menuItems.length - 1 : currentIndex - 1;
                        menuItems[currentIndex]?.focus();
                        break;
                    case 'Home':
                        event.preventDefault();
                        currentIndex = 0;
                        menuItems[currentIndex]?.focus();
                        break;
                    case 'End':
                        event.preventDefault();
                        currentIndex = menuItems.length - 1;
                        menuItems[currentIndex]?.focus();
                        break;
                    case 'Enter':
                    case ' ':
                        event.preventDefault();
                        menuItems[currentIndex]?.click();
                        break;
                }
            };
            const currentMenuRef = menuRef.current;
            currentMenuRef.addEventListener('keydown', handleMenuKeyDown);
            // 첫 번째 아이템에 포커스
            if (menuItems.length > 0) {
                menuItems[0]?.focus();
            }
            return () => {
                currentMenuRef?.removeEventListener('keydown', handleMenuKeyDown);
            };
        }
        return undefined;
    }, [isOpen]);
    // 메뉴 props
    const menuProps = {
        ref: menuRef,
        className: `user-menu ${isOpen ? 'open' : 'closed'}`,
        'data-testid': 'user-menu'
    };
    // 트리거 props
    const triggerProps = {
        ref: triggerRef,
        onClick: toggle,
        'aria-expanded': isOpen,
        'aria-haspopup': true
    };
    return {
        isOpen,
        user,
        items,
        open,
        close,
        toggle,
        handleItemClick,
        handleOutsideClick,
        menuRef,
        triggerRef,
        menuProps,
        triggerProps
    };
};
//# sourceMappingURL=useUserMenu.js.map