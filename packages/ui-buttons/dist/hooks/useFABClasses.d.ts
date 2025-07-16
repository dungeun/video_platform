/**
 * @company/ui-buttons - FAB Classes Hook
 * 플로팅 액션 버튼 스타일 클래스를 생성하는 훅
 */
interface UseFABClassesProps {
    size: 'sm' | 'md' | 'lg';
    extended: boolean;
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    className?: string;
}
export declare function useFABClasses({ size, extended, position, className }: UseFABClassesProps): string;
export {};
//# sourceMappingURL=useFABClasses.d.ts.map