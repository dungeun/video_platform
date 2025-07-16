/**
 * @company/ui-modals - Modal Styles Utility
 * 
 * 모달 스타일 관련 유틸리티
 */

import { ModalSize, ModalPosition, ModalAnimation } from '../types';

// Size classes
const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full mx-4'
};

// Position classes
const positionClasses: Record<ModalPosition, string> = {
  center: 'items-center justify-center',
  top: 'items-start justify-center pt-10',
  bottom: 'items-end justify-center pb-10',
  left: 'items-center justify-start pl-10',
  right: 'items-center justify-end pr-10'
};

// Animation variants
export const getModalAnimation = (animation: ModalAnimation) => {
  switch (animation) {
    case 'fade':
      return {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 }
      };
      
    case 'slide':
      return {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 20 }
      };
      
    case 'scale':
      return {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.8 }
      };
      
    case 'none':
    default:
      return {
        initial: {},
        animate: {},
        exit: {}
      };
  }
};

// Get modal classes
interface ModalClassOptions {
  size: ModalSize;
  position: ModalPosition;
  className?: string;
}

export const getModalClasses = ({
  size,
  position,
  className
}: ModalClassOptions): string => {
  const baseClasses = 'relative w-full bg-white rounded-lg shadow-xl overflow-hidden';
  const sizeClass = sizeClasses[size];
  const positionClass = positionClasses[position];
  
  return [
    'fixed inset-0 z-50 flex',
    positionClass,
    baseClasses,
    sizeClass,
    className
  ].filter(Boolean).join(' ');
};

// Get overlay classes
interface OverlayClassOptions {
  blur?: boolean;
  className?: string;
}

export const getOverlayClasses = ({
  blur,
  className
}: OverlayClassOptions): string => {
  const baseClasses = 'fixed inset-0 bg-black transition-opacity';
  const blurClass = blur ? 'backdrop-blur-sm' : '';
  
  return [baseClasses, blurClass, className].filter(Boolean).join(' ');
};

// Get size styles
export const getModalSizeStyle = (size: ModalSize): React.CSSProperties => {
  const styles: Record<ModalSize, React.CSSProperties> = {
    sm: { width: '384px' },
    md: { width: '448px' },
    lg: { width: '512px' },
    xl: { width: '576px' },
    full: { width: 'calc(100% - 2rem)' }
  };
  
  return styles[size] || styles.md;
};

// Get z-index for stacking
export const getModalZIndex = (stackLevel: number, baseZIndex: number = 1000): number => {
  return baseZIndex + (stackLevel * 10);
};