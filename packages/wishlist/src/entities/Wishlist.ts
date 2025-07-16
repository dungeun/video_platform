import { BaseEntity } from '@company/types';

export interface Wishlist extends BaseEntity {
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  isDefault: boolean;
  shareToken?: string;
  itemCount: number;
  sharedCount: number;
  viewCount: number;
  coverImage?: string;
  tags: string[];
  settings: WishlistSettings;
}

export interface WishlistSettings {
  notifyOnPriceChange: boolean;
  notifyOnStock: boolean;
  priceDropThreshold?: number;
  autoRemoveOutOfStock: boolean;
  allowComments: boolean;
  requireApprovalForSharing: boolean;
}