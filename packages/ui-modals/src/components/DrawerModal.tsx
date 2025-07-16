/**
 * @company/ui-modals - Drawer Modal Component
 * 
 * 슬라이드 방식의 서랍형 모달 컴포넌트
 */

import React from 'react';
import { MotionDiv } from './MotionWrapper';
import { DrawerModalProps } from '../types';
import { Modal } from './Modal';

const directionVariants = {
  left: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' }
  },
  right: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' }
  },
  top: {
    initial: { y: '-100%' },
    animate: { y: 0 },
    exit: { y: '-100%' }
  },
  bottom: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' }
  }
};

const getDrawerClasses = (direction: DrawerModalProps['direction']) => {
  const baseClasses = 'fixed bg-white shadow-xl';
  
  switch (direction) {
    case 'left':
      return `${baseClasses} left-0 top-0 h-full`;
    case 'right':
      return `${baseClasses} right-0 top-0 h-full`;
    case 'top':
      return `${baseClasses} top-0 left-0 w-full`;
    case 'bottom':
      return `${baseClasses} bottom-0 left-0 w-full`;
  }
};

const getDrawerStyle = (
  direction: DrawerModalProps['direction'],
  width?: string | number,
  height?: string | number
) => {
  const style: React.CSSProperties = {};
  
  if (direction === 'left' || direction === 'right') {
    style.width = width || '320px';
    style.maxWidth = '90vw';
  } else {
    style.height = height || '320px';
    style.maxHeight = '90vh';
  }
  
  return style;
};

export const DrawerModal: React.FC<DrawerModalProps> = ({
  direction,
  width,
  height,
  pushContent = false,
  children,
  className,
  style,
  ...modalProps
}) => {
  const drawerClasses = getDrawerClasses(direction);
  const drawerStyle = getDrawerStyle(direction, width, height);
  
  // For drawer, we override some default modal behaviors
  const drawerModalProps = {
    ...modalProps,
    animation: 'none' as const, // We handle animation ourselves
    position: 'center' as const, // Not used for drawer
    className: `${drawerClasses} ${className || ''}`,
    style: { ...drawerStyle, ...style }
  };

  return (
    <Modal {...drawerModalProps}>
      <MotionDiv
        className="h-full overflow-auto"
        variants={directionVariants[direction]}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        {children}
      </MotionDiv>
    </Modal>
  );
};