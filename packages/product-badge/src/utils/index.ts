export * from './badgePresets';
export * from './badgeRules';

import type { BadgeConfig, BadgeSize } from '../types';

export const defaultBadgeConfig: BadgeConfig = {
  position: 'top-left',
  size: 'sm',
  shape: 'rounded',
  maxBadges: 3,
  stackDirection: 'vertical',
  gap: 4,
  animated: true
};

export function getBadgeSizeClasses(size: BadgeSize): string {
  const sizeMap = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-1.5',
    lg: 'text-lg px-4 py-2'
  };
  return sizeMap[size];
}

export function getBadgeShapeClasses(shape: string): string {
  const shapeMap: Record<string, string> = {
    rectangle: 'rounded-none',
    rounded: 'rounded',
    pill: 'rounded-full',
    circle: 'rounded-full aspect-square'
  };
  return shapeMap[shape] || 'rounded';
}

export function getBadgePositionClasses(position: string): string {
  const positionMap: Record<string, string> = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2'
  };
  return positionMap[position] || 'top-2 left-2';
}

export function sortBadgesByPriority<T extends { priority?: number }>(badges: T[]): T[] {
  return [...badges].sort((a, b) => (b.priority || 0) - (a.priority || 0));
}