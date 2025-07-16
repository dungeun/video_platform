/**
 * @company/ui-buttons - Button Classes Hook
 * 버튼 스타일 클래스를 생성하는 훅
 */
import { ButtonSize, ButtonVariant, IconPosition } from '../types';
interface UseButtonClassesProps {
    size: ButtonSize;
    variant: ButtonVariant;
    fullWidth: boolean;
    loading: boolean;
    rounded: boolean | string;
    shadow: boolean | string;
    noAnimation: boolean;
    hasIcon: boolean;
    iconPosition: IconPosition;
    className?: string;
}
export declare function useButtonClasses({ size, variant, fullWidth, loading, rounded, shadow, noAnimation, hasIcon, iconPosition, className }: UseButtonClassesProps): string;
export {};
//# sourceMappingURL=useButtonClasses.d.ts.map