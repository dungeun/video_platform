/**
 * Keyboard Navigation Utilities
 * 키보드 네비게이션 유틸리티
 */
/**
 * 키보드 네비게이션 키 코드
 */
export const NAVIGATION_KEYS = {
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    TAB: 'Tab',
    HOME: 'Home',
    END: 'End'
};
/**
 * 네비게이션 키인지 확인
 */
export const isNavigationKey = (key) => {
    return Object.values(NAVIGATION_KEYS).includes(key);
};
/**
 * 방향키인지 확인
 */
export const isArrowKey = (key) => {
    return [
        NAVIGATION_KEYS.ARROW_UP,
        NAVIGATION_KEYS.ARROW_DOWN,
        NAVIGATION_KEYS.ARROW_LEFT,
        NAVIGATION_KEYS.ARROW_RIGHT
    ].includes(key);
};
/**
 * 수직 방향키인지 확인
 */
export const isVerticalArrowKey = (key) => {
    return [NAVIGATION_KEYS.ARROW_UP, NAVIGATION_KEYS.ARROW_DOWN].includes(key);
};
/**
 * 수평 방향키인지 확인
 */
export const isHorizontalArrowKey = (key) => {
    return [NAVIGATION_KEYS.ARROW_LEFT, NAVIGATION_KEYS.ARROW_RIGHT].includes(key);
};
/**
 * 활성화 키인지 확인 (Enter 또는 Space)
 */
export const isActivationKey = (key) => {
    return [NAVIGATION_KEYS.ENTER, NAVIGATION_KEYS.SPACE].includes(key);
};
/**
 * 포커스 가능한 요소 선택자
 */
export const FOCUSABLE_SELECTORS = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[role="button"]:not([disabled])',
    '[role="menuitem"]:not([disabled])',
    '[role="option"]:not([disabled])'
].join(', ');
/**
 * 포커스 가능한 요소들 찾기
 */
export const getFocusableElements = (container) => {
    return Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS));
};
/**
 * 다음 포커스 요소 찾기
 */
export const getNextFocusableElement = (container, currentElement, direction = 'next') => {
    const focusableElements = getFocusableElements(container);
    const currentIndex = focusableElements.indexOf(currentElement);
    if (currentIndex === -1)
        return null;
    let nextIndex;
    if (direction === 'next') {
        nextIndex = (currentIndex + 1) % focusableElements.length;
    }
    else {
        nextIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
    }
    return focusableElements[nextIndex] || null;
};
/**
 * 첫 번째 포커스 요소 찾기
 */
export const getFirstFocusableElement = (container) => {
    const focusableElements = getFocusableElements(container);
    return focusableElements[0] || null;
};
/**
 * 마지막 포커스 요소 찾기
 */
export const getLastFocusableElement = (container) => {
    const focusableElements = getFocusableElements(container);
    return focusableElements[focusableElements.length - 1] || null;
};
export const createKeyboardNavigationHandler = (options) => {
    return (event) => {
        const { key, shiftKey } = event;
        switch (key) {
            case NAVIGATION_KEYS.ARROW_UP:
                options.onUp?.();
                break;
            case NAVIGATION_KEYS.ARROW_DOWN:
                options.onDown?.();
                break;
            case NAVIGATION_KEYS.ARROW_LEFT:
                options.onLeft?.();
                break;
            case NAVIGATION_KEYS.ARROW_RIGHT:
                options.onRight?.();
                break;
            case NAVIGATION_KEYS.ENTER:
                options.onEnter?.();
                break;
            case NAVIGATION_KEYS.SPACE:
                options.onSpace?.();
                break;
            case NAVIGATION_KEYS.ESCAPE:
                options.onEscape?.();
                break;
            case NAVIGATION_KEYS.TAB:
                options.onTab?.(shiftKey);
                break;
            case NAVIGATION_KEYS.HOME:
                options.onHome?.();
                break;
            case NAVIGATION_KEYS.END:
                options.onEnd?.();
                break;
            default:
                return; // 처리하지 않는 키는 기본 동작 유지
        }
        if (options.preventDefault) {
            event.preventDefault();
        }
        if (options.stopPropagation) {
            event.stopPropagation();
        }
    };
};
/**
 * 원형 네비게이션 (처음과 끝이 연결됨)
 */
export const navigateCircular = (currentIndex, totalItems, direction) => {
    if (direction === 'next') {
        return (currentIndex + 1) % totalItems;
    }
    else {
        return currentIndex === 0 ? totalItems - 1 : currentIndex - 1;
    }
};
/**
 * 그리드 네비게이션 (2차원 배열)
 */
export const navigateGrid = (currentRow, currentCol, maxRows, maxCols, direction) => {
    let newRow = currentRow;
    let newCol = currentCol;
    switch (direction) {
        case 'up':
            newRow = Math.max(0, currentRow - 1);
            break;
        case 'down':
            newRow = Math.min(maxRows - 1, currentRow + 1);
            break;
        case 'left':
            newCol = Math.max(0, currentCol - 1);
            break;
        case 'right':
            newCol = Math.min(maxCols - 1, currentCol + 1);
            break;
    }
    return { row: newRow, col: newCol };
};
/**
 * 포커스 트랩 생성 (모달 등에서 사용)
 */
export const createFocusTrap = (container) => {
    const focusableElements = getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const handleKeydown = (event) => {
        if (event.key !== NAVIGATION_KEYS.TAB)
            return;
        if (event.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
                event.preventDefault();
                lastElement?.focus();
            }
        }
        else {
            // Tab
            if (document.activeElement === lastElement) {
                event.preventDefault();
                firstElement?.focus();
            }
        }
    };
    return {
        activate: () => {
            firstElement?.focus();
            container.addEventListener('keydown', handleKeydown);
        },
        deactivate: () => {
            container.removeEventListener('keydown', handleKeydown);
        }
    };
};
//# sourceMappingURL=keyboardNavigation.js.map