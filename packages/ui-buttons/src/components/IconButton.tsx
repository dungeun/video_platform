/**
 * @repo/ui-buttons - Icon Button Component
 * 아이콘 전용 버튼 컴포넌트
 */

import React, { forwardRef } from 'react';
import { IconButtonProps } from '../types';
import { Button } from './Button';

/**
 * 아이콘 버튼 컴포넌트
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({
  icon,
  square = true,
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const squareClass = square ? 'aspect-square' : '';
  const combinedClassName = `${squareClass} ${className}`.trim();

  return (
    <Button
      ref={ref}
      size={size}
      icon={icon}
      iconPosition="only"
      className={combinedClassName}
      {...props}
    />
  );
});

IconButton.displayName = 'IconButton';