import React from 'react';
import type { BadgeProps } from '../types';
import { getBadgePreset } from '../utils/badgePresets';
import { getBadgeSizeClasses, getBadgeShapeClasses } from '../utils';

export const Badge: React.FC<BadgeProps> = ({
  badge,
  size = 'sm',
  shape = 'rounded',
  animated = false,
  className = '',
  onClick
}) => {
  const preset = getBadgePreset(badge.type);
  const finalBadge = {
    ...preset,
    ...badge
  };

  const sizeClasses = getBadgeSizeClasses(size);
  const shapeClasses = getBadgeShapeClasses(shape);
  
  const animationClasses = animated ? 'animate-pulse' : '';
  const clickableClasses = onClick ? 'cursor-pointer hover:scale-105 transition-transform' : '';

  return (
    <span
      onClick={onClick}
      className={`
        inline-flex items-center justify-center font-semibold
        ${sizeClasses} ${shapeClasses} ${animationClasses} ${clickableClasses}
        ${className}
      `}
      style={{
        color: finalBadge.color,
        backgroundColor: finalBadge.bgColor,
        borderColor: finalBadge.borderColor,
        borderWidth: finalBadge.borderColor ? '1px' : '0'
      }}
    >
      {finalBadge.icon && (
        <span className="mr-1">{finalBadge.icon}</span>
      )}
      {finalBadge.text}
    </span>
  );
};