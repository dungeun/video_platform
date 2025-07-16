/**
 * useSlideMenu Hook
 * 슬라이드 메뉴 상태 관리
 */
import { useState, useCallback, useEffect } from 'react';
export const useSlideMenu = (options) => {
    const { isOpen, onClose, closeOnOverlayClick = true, closeOnEscape = true, preventBodyScroll = true } = options;
    const [isAnimating, setIsAnimating] = useState(false);
    // 애니메이션 상태 관리
    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
        }
        else {
            const timer = setTimeout(() => {
                setIsAnimating(false);
            }, 300); // 애니메이션 duration과 맞춤
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [isOpen]);
    // 바디 스크롤 제어
    useEffect(() => {
        if (preventBodyScroll && isOpen) {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
        return undefined;
    }, [isOpen, preventBodyScroll]);
    // ESC 키로 메뉴 닫기
    useEffect(() => {
        if (closeOnEscape && isOpen) {
            const handleKeyDown = (event) => {
                if (event.key === 'Escape') {
                    onClose();
                }
            };
            document.addEventListener('keydown', handleKeyDown);
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
        return undefined;
    }, [isOpen, closeOnEscape, onClose]);
    // 오버레이 클릭 핸들러
    const handleOverlayClick = useCallback(() => {
        if (closeOnOverlayClick) {
            onClose();
        }
    }, [closeOnOverlayClick, onClose]);
    // 아이템 클릭 핸들러
    const handleItemClick = useCallback((item, onItemClick) => {
        if (item.disabled)
            return;
        // 커스텀 핸들러 실행
        onItemClick?.(item);
        // 아이템 자체 핸들러 실행
        if (item.onClick) {
            item.onClick({});
        }
        // 하위 메뉴가 없는 경우 메뉴 닫기
        if (!item.children || item.children.length === 0) {
            onClose();
        }
    }, [onClose]);
    // 오버레이 props
    const overlayProps = {
        onClick: handleOverlayClick,
        className: `slide-menu-overlay ${isOpen ? 'open' : 'closed'}`
    };
    // 메뉴 props
    const menuProps = {
        className: `slide-menu ${isOpen ? 'open' : 'closed'}`,
        'data-testid': 'slide-menu'
    };
    return {
        isAnimating,
        handleOverlayClick,
        handleItemClick,
        overlayProps,
        menuProps
    };
};
//# sourceMappingURL=useSlideMenu.js.map