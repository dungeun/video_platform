/**
 * @company/ui-buttons - Button Types
 * 버튼 컴포넌트 전용 타입 정의
 */
import { ReactNode, ButtonHTMLAttributes } from 'react';
/**
 * 버튼 크기
 */
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
/**
 * 버튼 변형
 */
export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 'outline-primary' | 'outline-secondary' | 'outline-success' | 'outline-danger' | 'outline-warning' | 'outline-info' | 'outline-light' | 'outline-dark' | 'ghost' | 'link';
/**
 * 로딩 상태
 */
export interface LoadingState {
    isLoading: boolean;
    loadingText?: string;
    spinner?: ReactNode;
}
/**
 * 아이콘 위치
 */
export type IconPosition = 'left' | 'right' | 'only';
/**
 * 기본 버튼 Props
 */
export interface BaseButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
    /**
     * 버튼 크기
     */
    size?: ButtonSize;
    /**
     * 버튼 변형 스타일
     */
    variant?: ButtonVariant;
    /**
     * 전체 너비 차지 여부
     */
    fullWidth?: boolean;
    /**
     * 로딩 상태
     */
    loading?: boolean | LoadingState;
    /**
     * 아이콘
     */
    icon?: ReactNode;
    /**
     * 아이콘 위치
     */
    iconPosition?: IconPosition;
    /**
     * 라운드 모서리
     */
    rounded?: boolean | 'sm' | 'md' | 'lg' | 'full';
    /**
     * 그림자
     */
    shadow?: boolean | 'sm' | 'md' | 'lg' | 'xl';
    /**
     * 애니메이션 비활성화
     */
    noAnimation?: boolean;
    /**
     * 커스텀 클래스명
     */
    className?: string;
    /**
     * 자식 요소
     */
    children?: ReactNode;
}
/**
 * 버튼 그룹 Props
 */
export interface ButtonGroupProps {
    /**
     * 버튼들의 기본 크기
     */
    size?: ButtonSize;
    /**
     * 버튼들의 기본 변형
     */
    variant?: ButtonVariant;
    /**
     * 세로 배치
     */
    vertical?: boolean;
    /**
     * 연결된 스타일 (모서리 제거)
     */
    attached?: boolean;
    /**
     * 간격
     */
    spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
    /**
     * 커스텀 클래스명
     */
    className?: string;
    /**
     * 자식 버튼들
     */
    children: ReactNode;
}
/**
 * 아이콘 버튼 Props
 */
export interface IconButtonProps extends Omit<BaseButtonProps, 'children' | 'icon' | 'iconPosition'> {
    /**
     * 아이콘 (필수)
     */
    icon: ReactNode;
    /**
     * 접근성을 위한 라벨
     */
    'aria-label': string;
    /**
     * 정사각형 여부
     */
    square?: boolean;
}
/**
 * 플로팅 액션 버튼 Props
 */
export interface FABProps extends Omit<BaseButtonProps, 'size' | 'variant'> {
    /**
     * FAB 크기
     */
    size?: 'sm' | 'md' | 'lg';
    /**
     * 확장된 FAB (텍스트 포함)
     */
    extended?: boolean;
    /**
     * 위치
     */
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}
/**
 * 버튼 테마 설정
 */
export interface ButtonTheme {
    sizes: Record<ButtonSize, string>;
    variants: Record<ButtonVariant, string>;
    animations: {
        hover: string;
        active: string;
        loading: string;
    };
    shadows: Record<string, string>;
    rounded: Record<string, string>;
}
//# sourceMappingURL=index.d.ts.map