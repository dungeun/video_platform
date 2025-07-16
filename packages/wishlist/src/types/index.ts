import { Wishlist, WishlistItem, WishlistShare, WishlistNotification, Collection } from '../entities';

// Request types
export interface CreateWishlistRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
  isDefault?: boolean;
  tags?: string[];
  settings?: Partial<Wishlist['settings']>;
}

export interface UpdateWishlistRequest {
  name?: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
  coverImage?: string;
  settings?: Partial<Wishlist['settings']>;
}

export interface AddItemRequest {
  productId: string;
  productName: string;
  productImage?: string;
  productUrl?: string;
  quantity?: number;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  targetPrice?: number;
  currentPrice: number;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface UpdateItemRequest {
  quantity?: number;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  targetPrice?: number;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface ShareWishlistRequest {
  wishlistId: string;
  sharedWithEmail?: string;
  sharedWithUserId?: string;
  shareType: 'view' | 'edit' | 'collaborate';
  message?: string;
  expiresAt?: Date;
  permissions?: Partial<WishlistShare['permissions']>;
}

export interface CreateCollectionRequest {
  name: string;
  description?: string;
  type: 'manual' | 'smart';
  rules?: Collection['rules'];
  wishlistIds?: string[];
  coverImage?: string;
  icon?: string;
  color?: string;
  isPublic?: boolean;
}

// Response types
export interface WishlistResponse {
  wishlist: Wishlist;
  items?: WishlistItem[];
  itemCount: number;
}

export interface WishlistListResponse {
  wishlists: Wishlist[];
  total: number;
  page: number;
  pageSize: number;
}

export interface WishlistItemResponse {
  item: WishlistItem;
  priceChange?: {
    amount: number;
    percentage: number;
    direction: 'up' | 'down' | 'stable';
  };
}

export interface ShareResponse {
  share: WishlistShare;
  shareUrl: string;
}

export interface NotificationListResponse {
  notifications: WishlistNotification[];
  unreadCount: number;
  total: number;
}

// Filter and sort types
export interface WishlistFilters {
  userId?: string;
  isPublic?: boolean;
  tags?: string[];
  search?: string;
  hasItems?: boolean;
}

export interface ItemFilters {
  wishlistId?: string;
  productId?: string;
  priority?: 'low' | 'medium' | 'high';
  isPurchased?: boolean;
  priceRange?: {
    min?: number;
    max?: number;
  };
  tags?: string[];
}

export interface WishlistSort {
  field: 'name' | 'createdAt' | 'updatedAt' | 'itemCount' | 'viewCount';
  order: 'asc' | 'desc';
}

export interface ItemSort {
  field: 'addedAt' | 'priority' | 'price' | 'name' | 'targetPrice';
  order: 'asc' | 'desc';
}

// Analytics types
export interface WishlistAnalytics {
  totalWishlists: number;
  totalItems: number;
  totalValue: number;
  averageItemPrice: number;
  priceDropsSaved: number;
  mostWishedCategories: Array<{
    category: string;
    count: number;
  }>;
  priceHistory: Array<{
    date: Date;
    totalValue: number;
  }>;
}

// Event types
export interface WishlistEvent {
  type: 'created' | 'updated' | 'deleted' | 'shared' | 'item_added' | 'item_removed' | 'item_purchased';
  wishlistId: string;
  userId: string;
  timestamp: Date;
  data?: any;
}

// Error types
export interface WishlistError extends Error {
  code: WishlistErrorCode;
  details?: any;
}

export enum WishlistErrorCode {
  WISHLIST_NOT_FOUND = 'WISHLIST_NOT_FOUND',
  ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',
  DUPLICATE_ITEM = 'DUPLICATE_ITEM',
  INVALID_SHARE_TOKEN = 'INVALID_SHARE_TOKEN',
  SHARE_EXPIRED = 'SHARE_EXPIRED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  WISHLIST_LIMIT_EXCEEDED = 'WISHLIST_LIMIT_EXCEEDED',
  ITEM_LIMIT_EXCEEDED = 'ITEM_LIMIT_EXCEEDED',
  INVALID_PRICE = 'INVALID_PRICE',
  COLLECTION_NOT_FOUND = 'COLLECTION_NOT_FOUND'
}