/**
 * @company/ui-buttons - Button Group Classes Hook
 * 버튼 그룹 스타일 클래스를 생성하는 훅
 */

import { useMemo } from 'react';

interface UseButtonGroupClassesProps {
  vertical: boolean;
  attached: boolean;
  spacing: 'none' | 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function useButtonGroupClasses({
  vertical,
  attached,
  spacing,
  className = ''
}: UseButtonGroupClassesProps): string {
  return useMemo(() => {
    const classes: string[] = [];

    // 기본 레이아웃
    classes.push('inline-flex');

    // 방향
    if (vertical) {
      classes.push('flex-col');
    } else {
      classes.push('flex-row');
    }

    // 간격
    if (!attached && spacing !== 'none') {
      const spacingMap = {
        xs: vertical ? 'space-y-1' : 'space-x-1',
        sm: vertical ? 'space-y-2' : 'space-x-2',
        md: vertical ? 'space-y-3' : 'space-x-3',
        lg: vertical ? 'space-y-4' : 'space-x-4'
      };
      classes.push(spacingMap[spacing]);
    }

    // 연결된 스타일
    if (attached) {
      classes.push('shadow-sm');
    }

    // 커스텀 클래스
    if (className) {
      classes.push(className);
    }

    return classes.join(' ');
  }, [vertical, attached, spacing, className]);
}