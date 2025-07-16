import { BaseEntity } from '@company/types';

export interface WishlistNotification extends BaseEntity {
  userId: string;
  wishlistId: string;
  itemId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data: NotificationData;
  isRead: boolean;
  readAt?: Date;
  priority: 'low' | 'medium' | 'high';
  expiresAt?: Date;
  actionUrl?: string;
  actionLabel?: string;
}

export type NotificationType = 
  | 'price_drop'
  | 'back_in_stock'
  | 'low_stock'
  | 'wishlist_shared'
  | 'item_added_by_collaborator'
  | 'price_increase'
  | 'target_price_reached'
  | 'item_expiring'
  | 'wishlist_reminder';

export interface NotificationData {
  productId?: string;
  productName?: string;
  previousPrice?: number;
  currentPrice?: number;
  priceChange?: number;
  stockLevel?: number;
  sharedByUser?: string;
  collaboratorName?: string;
  [key: string]: any;
}