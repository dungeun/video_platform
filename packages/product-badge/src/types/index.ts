export type BadgeType = 
  | 'new' 
  | 'best' 
  | 'sale' 
  | 'limited' 
  | 'soldout'
  | 'freeShipping'
  | 'exclusive'
  | 'custom';

export type BadgePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';
export type BadgeShape = 'rectangle' | 'rounded' | 'pill' | 'circle';

export interface Badge {
  id: string;
  type: BadgeType;
  text: string;
  color?: string;
  bgColor?: string;
  borderColor?: string;
  icon?: string;
  priority?: number;
  conditions?: BadgeCondition[];
}

export interface BadgeCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'between';
  value: any;
}

export interface BadgeConfig {
  position: BadgePosition;
  size: BadgeSize;
  shape: BadgeShape;
  maxBadges: number;
  stackDirection: 'vertical' | 'horizontal';
  gap: number;
  animated: boolean;
}

export interface ProductBadgeProps {
  badges: Badge[];
  config?: Partial<BadgeConfig>;
  className?: string;
}

export interface BadgeProps {
  badge: Badge;
  size?: BadgeSize;
  shape?: BadgeShape;
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

export interface BadgePreset {
  type: BadgeType;
  text: string;
  color: string;
  bgColor: string;
  borderColor?: string;
  icon?: string;
}

export interface BadgeRule {
  id: string;
  name: string;
  type: BadgeType;
  conditions: BadgeCondition[];
  badge: Omit<Badge, 'id' | 'type' | 'conditions'>;
  priority: number;
  isActive: boolean;
}