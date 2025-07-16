/**
 * @company/ui-buttons - Button Group Classes Hook
 * 버튼 그룹 스타일 클래스를 생성하는 훅
 */
interface UseButtonGroupClassesProps {
    vertical: boolean;
    attached: boolean;
    spacing: 'none' | 'xs' | 'sm' | 'md' | 'lg';
    className?: string;
}
export declare function useButtonGroupClasses({ vertical, attached, spacing, className }: UseButtonGroupClassesProps): string;
export {};
//# sourceMappingURL=useButtonGroupClasses.d.ts.map