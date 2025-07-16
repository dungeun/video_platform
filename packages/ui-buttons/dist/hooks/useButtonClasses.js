/**
 * @company/ui-buttons - Button Classes Hook
 * 버튼 스타일 클래스를 생성하는 훅
 */
import { useMemo } from 'react';
import { getButtonTheme } from '../utils/buttonTheme';
export function useButtonClasses({ size, variant, fullWidth, loading, rounded, shadow, noAnimation, hasIcon, iconPosition, className = '' }) {
    return useMemo(() => {
        const theme = getButtonTheme();
        const classes = [];
        // 기본 버튼 스타일
        classes.push('inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none');
        // 크기
        classes.push(theme.sizes[size]);
        // 변형
        classes.push(theme.variants[variant]);
        // 전체 너비
        if (fullWidth) {
            classes.push('w-full');
        }
        // 로딩 상태
        if (loading) {
            classes.push('cursor-wait');
        }
        // 둥근 모서리
        if (rounded) {
            if (typeof rounded === 'boolean') {
                classes.push('rounded-md');
            }
            else {
                classes.push(theme.rounded[rounded] || `rounded-${rounded}`);
            }
        }
        else {
            classes.push('rounded-md');
        }
        // 그림자
        if (shadow) {
            if (typeof shadow === 'boolean') {
                classes.push('shadow-sm');
            }
            else {
                classes.push(theme.shadows[shadow] || `shadow-${shadow}`);
            }
        }
        // 애니메이션
        if (!noAnimation) {
            classes.push(theme.animations.hover);
            classes.push(theme.animations.active);
        }
        // 아이콘 전용 버튼 패딩 조정
        if (hasIcon && iconPosition === 'only') {
            // 정사각형 모양을 위한 패딩 조정
            const iconPadding = {
                xs: 'p-1',
                sm: 'p-1.5',
                md: 'p-2',
                lg: 'p-2.5',
                xl: 'p-3'
            };
            classes.push(iconPadding[size]);
        }
        // 커스텀 클래스
        if (className) {
            classes.push(className);
        }
        return classes.join(' ');
    }, [size, variant, fullWidth, loading, rounded, shadow, noAnimation, hasIcon, iconPosition, className]);
}
//# sourceMappingURL=useButtonClasses.js.map