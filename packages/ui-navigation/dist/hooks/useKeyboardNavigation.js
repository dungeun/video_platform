/**
 * useKeyboardNavigation Hook
 * 키보드 네비게이션 관리
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { getFocusableElements, NAVIGATION_KEYS } from '../utils/keyboardNavigation';
export const useKeyboardNavigation = (options) => {
    const { containerRef, orientation = 'vertical', loop = true, disabled = false, onFocusChange, onActivate, onEscape } = options;
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [focusedElement, setFocusedElement] = useState(null);
    const internalContainerRef = useRef(null);
    const elementsRef = useRef([]);
    // 컨테이너 ref 결정
    const activeContainerRef = containerRef || internalContainerRef;
    // 포커스 가능한 요소들 업데이트
    const updateFocusableElements = useCallback(() => {
        if (!activeContainerRef.current)
            return;
        const elements = getFocusableElements(activeContainerRef.current);
        elementsRef.current = elements;
        // 현재 인덱스가 범위를 벗어나면 조정
        if (currentIndex >= elements.length) {
            setCurrentIndex(elements.length - 1);
        }
    }, [activeContainerRef, currentIndex]);
    // 요소 변화 감지
    useEffect(() => {
        updateFocusableElements();
        if (!activeContainerRef.current)
            return;
        const observer = new MutationObserver(updateFocusableElements);
        observer.observe(activeContainerRef.current, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['tabindex', 'disabled', 'aria-disabled']
        });
        return () => observer.disconnect();
    }, [updateFocusableElements]);
    // 인덱스 변경시 포커스 업데이트
    useEffect(() => {
        const elements = elementsRef.current;
        if (currentIndex >= 0 && currentIndex < elements.length) {
            const element = elements[currentIndex];
            if (element) {
                setFocusedElement(element);
                onFocusChange?.(currentIndex, element);
            }
        }
        else {
            setFocusedElement(null);
        }
    }, [currentIndex, onFocusChange]);
    // 인덱스 설정
    const handleSetCurrentIndex = useCallback((index) => {
        if (disabled)
            return;
        const elements = elementsRef.current;
        const clampedIndex = Math.max(-1, Math.min(index, elements.length - 1));
        setCurrentIndex(clampedIndex);
    }, [disabled]);
    // 첫 번째 요소로 포커스
    const focusFirst = useCallback(() => {
        handleSetCurrentIndex(0);
    }, [handleSetCurrentIndex]);
    // 마지막 요소로 포커스
    const focusLast = useCallback(() => {
        const elements = elementsRef.current;
        handleSetCurrentIndex(elements.length - 1);
    }, [handleSetCurrentIndex]);
    // 다음 요소로 포커스
    const focusNext = useCallback(() => {
        const elements = elementsRef.current;
        if (elements.length === 0)
            return;
        let nextIndex = currentIndex + 1;
        if (nextIndex >= elements.length) {
            nextIndex = loop ? 0 : elements.length - 1;
        }
        handleSetCurrentIndex(nextIndex);
    }, [currentIndex, loop, handleSetCurrentIndex]);
    // 이전 요소로 포커스
    const focusPrevious = useCallback(() => {
        const elements = elementsRef.current;
        if (elements.length === 0)
            return;
        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) {
            prevIndex = loop ? elements.length - 1 : 0;
        }
        handleSetCurrentIndex(prevIndex);
    }, [currentIndex, loop, handleSetCurrentIndex]);
    // 특정 인덱스로 포커스
    const focusIndex = useCallback((index) => {
        handleSetCurrentIndex(index);
    }, [handleSetCurrentIndex]);
    // 현재 요소 활성화
    const activate = useCallback((index) => {
        if (disabled)
            return;
        const targetIndex = index ?? currentIndex;
        const elements = elementsRef.current;
        if (targetIndex >= 0 && targetIndex < elements.length) {
            const element = elements[targetIndex];
            if (element) {
                onActivate?.(targetIndex, element);
                // 기본 클릭 이벤트 트리거
                element.click();
            }
        }
    }, [disabled, currentIndex, onActivate]);
    // 키보드 이벤트 핸들러
    const handleKeyDown = useCallback((event) => {
        if (disabled)
            return;
        const { key } = event;
        // 방향키 처리
        if (orientation === 'vertical' || orientation === 'both') {
            if (key === NAVIGATION_KEYS.ARROW_DOWN) {
                event.preventDefault();
                focusNext();
                return;
            }
            if (key === NAVIGATION_KEYS.ARROW_UP) {
                event.preventDefault();
                focusPrevious();
                return;
            }
        }
        if (orientation === 'horizontal' || orientation === 'both') {
            if (key === NAVIGATION_KEYS.ARROW_RIGHT) {
                event.preventDefault();
                focusNext();
                return;
            }
            if (key === NAVIGATION_KEYS.ARROW_LEFT) {
                event.preventDefault();
                focusPrevious();
                return;
            }
        }
        // 기타 키 처리
        switch (key) {
            case NAVIGATION_KEYS.HOME:
                event.preventDefault();
                focusFirst();
                break;
            case NAVIGATION_KEYS.END:
                event.preventDefault();
                focusLast();
                break;
            case NAVIGATION_KEYS.ENTER:
            case NAVIGATION_KEYS.SPACE:
                event.preventDefault();
                activate();
                break;
            case NAVIGATION_KEYS.ESCAPE:
                onEscape?.();
                break;
        }
    }, [
        disabled,
        orientation,
        focusNext,
        focusPrevious,
        focusFirst,
        focusLast,
        activate,
        onEscape
    ]);
    // 실제 DOM 포커스 적용
    useEffect(() => {
        if (focusedElement && document.activeElement !== focusedElement) {
            focusedElement.focus();
        }
    }, [focusedElement]);
    // 컨테이너 props
    const containerProps = {
        onKeyDown: handleKeyDown,
        tabIndex: disabled ? -1 : 0
    };
    return {
        currentIndex,
        focusedElement,
        setCurrentIndex: handleSetCurrentIndex,
        focusFirst,
        focusLast,
        focusNext,
        focusPrevious,
        focusIndex,
        activate,
        handleKeyDown,
        containerProps
    };
};
//# sourceMappingURL=useKeyboardNavigation.js.map