import { BaseEntity } from '@repo/types';

export interface WishlistItem extends BaseEntity {
  wishlistId: string;
  productId: string;
  productName: string;
  productImage?: string;
  productUrl?: string;
  quantity: number;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  targetPrice?: number;
  originalPrice: number;
  currentPrice: number;
  lowestPrice: number;
  highestPrice: number;
  priceHistory: PricePoint[];
  addedAt: Date;
  lastChecked: Date;
  isPurchased: boolean;
  purchasedAt?: Date;
  tags: string[];
  customFields?: Record<string, any>;
}

export interface PricePoint {
  price: number;
  timestamp: Date;
  currency: string;
}