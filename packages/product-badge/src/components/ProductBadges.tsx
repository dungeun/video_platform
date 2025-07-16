import React from 'react';
import { Badge } from './Badge';
import type { ProductBadgeProps } from '../types';
import { 
  defaultBadgeConfig, 
  getBadgePositionClasses, 
  sortBadgesByPriority 
} from '../utils';

export const ProductBadges: React.FC<ProductBadgeProps> = ({
  badges,
  config = {},
  className = ''
}) => {
  const finalConfig = { ...defaultBadgeConfig, ...config };
  
  if (!badges || badges.length === 0) {
    return null;
  }

  const sortedBadges = sortBadgesByPriority(badges);
  const displayBadges = sortedBadges.slice(0, finalConfig.maxBadges);
  const positionClasses = getBadgePositionClasses(finalConfig.position);
  
  const stackClasses = finalConfig.stackDirection === 'vertical' 
    ? 'flex-col' 
    : 'flex-row flex-wrap';

  return (
    <div 
      className={`
        absolute ${positionClasses} 
        flex ${stackClasses} 
        gap-${finalConfig.gap / 4}
        ${className}
      `}
    >
      {displayBadges.map((badge) => (
        <Badge
          key={badge.id}
          badge={badge}
          size={finalConfig.size}
          shape={finalConfig.shape}
          animated={finalConfig.animated}
        />
      ))}
      
      {badges.length > finalConfig.maxBadges && (
        <Badge
          badge={{
            id: 'more',
            type: 'custom',
            text: `+${badges.length - finalConfig.maxBadges}`,
            color: '#6b7280',
            bgColor: '#f3f4f6'
          }}
          size={finalConfig.size}
          shape={finalConfig.shape}
        />
      )}
    </div>
  );
};