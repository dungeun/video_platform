import { 
  Wishlist, 
  WishlistItem, 
  WishlistShare, 
  WishlistNotification,
  Collection 
} from '../entities';
import {
  CreateWishlistRequest,
  UpdateWishlistRequest,
  AddItemRequest,
  UpdateItemRequest,
  ShareWishlistRequest,
  CreateCollectionRequest,
  WishlistFilters,
  ItemFilters,
  WishlistSort,
  ItemSort
} from '../types';

export interface IWishlistRepository {
  // Wishlist CRUD
  create(data: CreateWishlistRequest): Promise<Wishlist>;
  findById(id: string): Promise<Wishlist | null>;
  findByUserId(userId: string): Promise<Wishlist[]>;
  findByShareToken(token: string): Promise<Wishlist | null>;
  update(id: string, data: UpdateWishlistRequest): Promise<Wishlist>;
  delete(id: string): Promise<void>;
  
  // Queries
  search(filters: WishlistFilters, sort?: WishlistSort): Promise<Wishlist[]>;
  count(filters: WishlistFilters): Promise<number>;
  getDefaultWishlist(userId: string): Promise<Wishlist | null>;
  incrementViewCount(id: string): Promise<void>;
}

export interface IWishlistItemRepository {
  // Item CRUD
  create(data: AddItemRequest & { wishlistId: string }): Promise<WishlistItem>;
  findById(id: string): Promise<WishlistItem | null>;
  findByWishlistId(wishlistId: string): Promise<WishlistItem[]>;
  update(id: string, data: UpdateItemRequest): Promise<WishlistItem>;
  delete(id: string): Promise<void>;
  
  // Bulk operations
  deleteByWishlistId(wishlistId: string): Promise<void>;
  moveItems(itemIds: string[], targetWishlistId: string): Promise<void>;
  copyItems(itemIds: string[], targetWishlistId: string): Promise<WishlistItem[]>;
  
  // Queries
  search(filters: ItemFilters, sort?: ItemSort): Promise<WishlistItem[]>;
  count(filters: ItemFilters): Promise<number>;
  checkDuplicate(wishlistId: string, productId: string): Promise<boolean>;
  
  // Price tracking
  updatePrice(id: string, price: number): Promise<void>;
  getPriceHistory(id: string, days?: number): Promise<WishlistItem['priceHistory']>;
  markAsPurchased(id: string): Promise<void>;
}

export interface IWishlistShareRepository {
  // Share CRUD
  create(data: ShareWishlistRequest): Promise<WishlistShare>;
  findById(id: string): Promise<WishlistShare | null>;
  findByToken(token: string): Promise<WishlistShare | null>;
  findByWishlistId(wishlistId: string): Promise<WishlistShare[]>;
  update(id: string, data: Partial<WishlistShare>): Promise<WishlistShare>;
  delete(id: string): Promise<void>;
  
  // Access tracking
  incrementAccessCount(id: string): Promise<void>;
  updateLastAccessed(id: string): Promise<void>;
  
  // Queries
  findActiveShares(wishlistId: string): Promise<WishlistShare[]>;
  findExpiredShares(): Promise<WishlistShare[]>;
  revokeShare(id: string): Promise<void>;
}

export interface IWishlistNotificationRepository {
  // Notification CRUD
  create(data: Omit<WishlistNotification, 'id' | 'createdAt' | 'updatedAt'>): Promise<WishlistNotification>;
  findById(id: string): Promise<WishlistNotification | null>;
  findByUserId(userId: string, unreadOnly?: boolean): Promise<WishlistNotification[]>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  delete(id: string): Promise<void>;
  
  // Bulk operations
  deleteExpired(): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
  
  // Queries
  countUnread(userId: string): Promise<number>;
  findByType(userId: string, type: WishlistNotification['type']): Promise<WishlistNotification[]>;
}

export interface ICollectionRepository {
  // Collection CRUD
  create(data: CreateCollectionRequest): Promise<Collection>;
  findById(id: string): Promise<Collection | null>;
  findByUserId(userId: string): Promise<Collection[]>;
  update(id: string, data: Partial<Collection>): Promise<Collection>;
  delete(id: string): Promise<void>;
  
  // Wishlist management
  addWishlist(collectionId: string, wishlistId: string): Promise<void>;
  removeWishlist(collectionId: string, wishlistId: string): Promise<void>;
  getWishlists(collectionId: string): Promise<Wishlist[]>;
  
  // Smart collections
  evaluateRules(collection: Collection): Promise<string[]>;
  updateSmartCollection(id: string): Promise<void>;
}