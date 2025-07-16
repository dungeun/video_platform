import React from 'react';
import { Badge, Tooltip } from '@revu/ui-kit';
import type { VerificationLevel } from '../types';

interface VerificationBadgeProps {
  level: VerificationLevel;
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
}

const verificationConfig: Record<VerificationLevel, {
  color: string;
  icon: string;
  label: string;
  description: string;
}> = {
  basic: {
    color: 'gray',
    icon: 'user',
    label: 'Basic',
    description: 'Email verified'
  },
  verified: {
    color: 'blue',
    icon: 'check',
    label: 'Verified',
    description: 'Identity and social accounts verified'
  },
  premium: {
    color: 'purple',
    icon: 'star',
    label: 'Premium',
    description: 'Premium verified influencer'
  },
  elite: {
    color: 'gold',
    icon: 'crown',
    label: 'Elite',
    description: 'Elite partner with proven track record'
  }
};

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  level,
  size = 'medium',
  showTooltip = true
}) => {
  const config = verificationConfig[level];

  const badge = (
    <Badge
      variant="solid"
      color={config.color}
      size={size}
      icon={config.icon}
      className="verification-badge"
    >
      {size !== 'small' && config.label}
    </Badge>
  );

  if (showTooltip) {
    return (
      <Tooltip content={config.description}>
        {badge}
      </Tooltip>
    );
  }

  return badge;
};

export default VerificationBadge;