import type { BadgePreset } from '../types';

export const badgePresets: Record<string, BadgePreset> = {
  new: {
    type: 'new',
    text: 'NEW',
    color: '#ffffff',
    bgColor: '#ef4444',
    icon: '✨'
  },
  best: {
    type: 'best',
    text: 'BEST',
    color: '#ffffff',
    bgColor: '#3b82f6',
    icon: '⭐'
  },
  sale: {
    type: 'sale',
    text: 'SALE',
    color: '#ffffff',
    bgColor: '#10b981',
    icon: '🎯'
  },
  limited: {
    type: 'limited',
    text: '한정판',
    color: '#ffffff',
    bgColor: '#8b5cf6',
    icon: '⏰'
  },
  soldout: {
    type: 'soldout',
    text: '품절',
    color: '#ffffff',
    bgColor: '#6b7280',
    icon: '🚫'
  },
  freeShipping: {
    type: 'freeShipping',
    text: '무료배송',
    color: '#ffffff',
    bgColor: '#0891b2',
    icon: '🚚'
  },
  exclusive: {
    type: 'exclusive',
    text: '단독',
    color: '#ffffff',
    bgColor: '#dc2626',
    icon: '💎'
  }
};

export function getBadgePreset(type: string): BadgePreset | undefined {
  return badgePresets[type];
}

export function createCustomBadge(
  text: string,
  color: string,
  bgColor: string,
  icon?: string
): BadgePreset {
  return {
    type: 'custom',
    text,
    color,
    bgColor,
    icon
  };
}