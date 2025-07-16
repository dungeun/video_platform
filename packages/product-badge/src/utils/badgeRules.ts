import type { Badge, BadgeCondition } from '../types';

export function evaluateBadgeConditions(
  conditions: BadgeCondition[],
  product: Record<string, any>
): boolean {
  return conditions.every(condition => {
    const value = getNestedValue(product, condition.field);
    return evaluateCondition(value, condition.operator, condition.value);
  });
}

function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function evaluateCondition(value: any, operator: string, target: any): boolean {
  switch (operator) {
    case 'eq':
      return value === target;
    case 'ne':
      return value !== target;
    case 'gt':
      return value > target;
    case 'gte':
      return value >= target;
    case 'lt':
      return value < target;
    case 'lte':
      return value <= target;
    case 'in':
      return Array.isArray(target) && target.includes(value);
    case 'between':
      return Array.isArray(target) && target.length === 2 && 
             value >= target[0] && value <= target[1];
    default:
      return false;
  }
}

export function applyBadgeRules(
  product: Record<string, any>,
  rules: Array<{
    conditions: BadgeCondition[];
    badge: Omit<Badge, 'id' | 'conditions'>;
    priority: number;
  }>
): Badge[] {
  const applicableBadges = rules
    .filter(rule => evaluateBadgeConditions(rule.conditions, product))
    .sort((a, b) => b.priority - a.priority)
    .map(rule => ({
      ...rule.badge,
      id: `badge-${Math.random().toString(36).substr(2, 9)}`,
      priority: rule.priority
    }));

  return applicableBadges;
}

export const defaultBadgeRules = [
  {
    conditions: [
      { field: 'createdAt', operator: 'gte' as const, value: Date.now() - 7 * 24 * 60 * 60 * 1000 }
    ],
    badge: { type: 'new' as const, text: 'NEW' },
    priority: 10
  },
  {
    conditions: [
      { field: 'discount', operator: 'gt' as const, value: 0 }
    ],
    badge: { type: 'sale' as const, text: 'SALE' },
    priority: 20
  },
  {
    conditions: [
      { field: 'stock', operator: 'lte' as const, value: 10 },
      { field: 'stock', operator: 'gt' as const, value: 0 }
    ],
    badge: { type: 'limited' as const, text: '한정수량' },
    priority: 30
  },
  {
    conditions: [
      { field: 'stock', operator: 'eq' as const, value: 0 }
    ],
    badge: { type: 'soldout' as const, text: '품절' },
    priority: 100
  },
  {
    conditions: [
      { field: 'price', operator: 'gte' as const, value: 50000 }
    ],
    badge: { type: 'freeShipping' as const, text: '무료배송' },
    priority: 5
  }
];