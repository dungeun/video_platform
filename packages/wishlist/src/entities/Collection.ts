import { BaseEntity } from '@company/types';

export interface Collection extends BaseEntity {
  userId: string;
  name: string;
  description?: string;
  type: 'manual' | 'smart';
  rules?: CollectionRule[];
  wishlistIds: string[];
  coverImage?: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  isPublic: boolean;
  shareToken?: string;
  metadata?: Record<string, any>;
}

export interface CollectionRule {
  field: 'tag' | 'price' | 'category' | 'brand' | 'date_added' | 'priority';
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in';
  value: any;
  combineWith?: 'AND' | 'OR';
}