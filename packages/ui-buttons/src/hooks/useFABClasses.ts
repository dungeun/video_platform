/**
 * @company/ui-buttons - FAB Classes Hook
 * 플로팅 액션 버튼 스타일 클래스를 생성하는 훅
 */

import { useMemo } from 'react';

interface UseFABClassesProps {
  size: 'sm' | 'md' | 'lg';
  extended: boolean;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}

export function useFABClasses({
  size,
  extended,
  position,
  className = ''
}: UseFABClassesProps): string {
  return useMemo(() => {
    const classes: string[] = [];

    // 기본 FAB 스타일
    classes.push('fixed z-50');

    // 위치
    const positionMap = {
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4'
    };
    classes.push(positionMap[position]);

    // 크기별 특별한 스타일
    const sizeStyles = {
      sm: extended ? 'h-10 min-w-[2.5rem]' : 'h-10 w-10',
      md: extended ? 'h-12 min-w-[3rem]' : 'h-12 w-12',
      lg: extended ? 'h-14 min-w-[3.5rem]' : 'h-14 w-14'
    };
    classes.push(sizeStyles[size]);

    // 확장된 FAB 패딩
    if (extended) {
      classes.push('px-4');
    }

    // 호버 효과
    classes.push('hover:scale-105 transition-transform duration-200');

    // 커스텀 클래스
    if (className) {
      classes.push(className);
    }

    return classes.join(' ');
  }, [size, extended, position, className]);
}