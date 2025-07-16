/**
 * Keyboard Navigation Utilities
 * 키보드 네비게이션 유틸리티
 */
import { KeyboardEvent } from 'react';
/**
 * 키보드 네비게이션 키 코드
 */
export declare const NAVIGATION_KEYS: {
    readonly ARROW_UP: "ArrowUp";
    readonly ARROW_DOWN: "ArrowDown";
    readonly ARROW_LEFT: "ArrowLeft";
    readonly ARROW_RIGHT: "ArrowRight";
    readonly ENTER: "Enter";
    readonly SPACE: " ";
    readonly ESCAPE: "Escape";
    readonly TAB: "Tab";
    readonly HOME: "Home";
    readonly END: "End";
};
/**
 * 네비게이션 키인지 확인
 */
export declare const isNavigationKey: (key: string) => boolean;
/**
 * 방향키인지 확인
 */
export declare const isArrowKey: (key: string) => boolean;
/**
 * 수직 방향키인지 확인
 */
export declare const isVerticalArrowKey: (key: string) => boolean;
/**
 * 수평 방향키인지 확인
 */
export declare const isHorizontalArrowKey: (key: string) => boolean;
/**
 * 활성화 키인지 확인 (Enter 또는 Space)
 */
export declare const isActivationKey: (key: string) => boolean;
/**
 * 포커스 가능한 요소 선택자
 */
export declare const FOCUSABLE_SELECTORS: string;
/**
 * 포커스 가능한 요소들 찾기
 */
export declare const getFocusableElements: (container: Element) => HTMLElement[];
/**
 * 다음 포커스 요소 찾기
 */
export declare const getNextFocusableElement: (container: Element, currentElement: Element, direction?: "next" | "previous") => HTMLElement | null;
/**
 * 첫 번째 포커스 요소 찾기
 */
export declare const getFirstFocusableElement: (container: Element) => HTMLElement | null;
/**
 * 마지막 포커스 요소 찾기
 */
export declare const getLastFocusableElement: (container: Element) => HTMLElement | null;
/**
 * 키보드 네비게이션 핸들러 생성
 */
export interface KeyboardNavigationOptions {
    onUp?: () => void;
    onDown?: () => void;
    onLeft?: () => void;
    onRight?: () => void;
    onEnter?: () => void;
    onSpace?: () => void;
    onEscape?: () => void;
    onTab?: (shiftKey: boolean) => void;
    onHome?: () => void;
    onEnd?: () => void;
    preventDefault?: boolean;
    stopPropagation?: boolean;
}
export declare const createKeyboardNavigationHandler: (options: KeyboardNavigationOptions) => (event: KeyboardEvent) => void;
/**
 * 원형 네비게이션 (처음과 끝이 연결됨)
 */
export declare const navigateCircular: (currentIndex: number, totalItems: number, direction: "next" | "previous") => number;
/**
 * 그리드 네비게이션 (2차원 배열)
 */
export declare const navigateGrid: (currentRow: number, currentCol: number, maxRows: number, maxCols: number, direction: "up" | "down" | "left" | "right") => {
    row: number;
    col: number;
};
/**
 * 포커스 트랩 생성 (모달 등에서 사용)
 */
export declare const createFocusTrap: (container: Element) => {
    activate: () => void;
    deactivate: () => void;
};
//# sourceMappingURL=keyboardNavigation.d.ts.map