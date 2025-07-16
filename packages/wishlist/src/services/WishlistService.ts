import { Logger } from '@repo/core';
import { CacheManager } from '@repo/cache';
import { 
  IWishlistRepository, 
  IWishlistItemRepository,
  IWishlistNotificationRepository 
} from '../repositories/interfaces';
import {
  CreateWishlistRequest,
  UpdateWishlistRequest,
  WishlistResponse,
  WishlistListResponse,
  WishlistFilters,
  WishlistSort,
  WishlistError,
  WishlistErrorCode
} from '../types';
import { Wishlist } from '../entities';
import { generateShareToken } from '../utils';

export class WishlistService {
  private readonly logger = new Logger('WishlistService');
  private readonly cache: CacheManager;
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly MAX_WISHLISTS_PER_USER = 50;

  constructor(
    private readonly wishlistRepo: IWishlistRepository,
    private readonly itemRepo: IWishlistItemRepository,
    private readonly notificationRepo: IWishlistNotificationRepository
  ) {
    this.cache = new CacheManager({ defaultTTL: this.CACHE_TTL });
  }

  async createWishlist(
    userId: string,
    data: CreateWishlistRequest
  ): Promise<WishlistResponse> {
    try {
      // Check wishlist limit
      const existingCount = await this.wishlistRepo.count({ userId });
      if (existingCount >= this.MAX_WISHLISTS_PER_USER) {
        throw this.createError(
          WishlistErrorCode.WISHLIST_LIMIT_EXCEEDED,
          `Maximum ${this.MAX_WISHLISTS_PER_USER} wishlists allowed per user`
        );
      }

      // If setting as default, unset other defaults
      if (data.isDefault) {
        const wishlists = await this.wishlistRepo.findByUserId(userId);
        for (const wishlist of wishlists) {
          if (wishlist.isDefault) {
            await this.wishlistRepo.update(wishlist.id, { isDefault: false });
          }
        }
      }

      // Create wishlist
      const wishlist = await this.wishlistRepo.create({
        ...data,
        settings: {
          notifyOnPriceChange: true,
          notifyOnStock: true,
          autoRemoveOutOfStock: false,
          allowComments: true,
          requireApprovalForSharing: false,
          ...data.settings
        }
      });

      // Clear user's wishlist cache
      await this.cache.delete(`user_wishlists_${userId}`);

      this.logger.info('Wishlist created', { wishlistId: wishlist.id, userId });

      return {
        wishlist,
        itemCount: 0
      };
    } catch (error) {
      this.logger.error('Failed to create wishlist', error);
      throw error;
    }
  }

  async getWishlist(
    wishlistId: string,
    userId?: string
  ): Promise<WishlistResponse> {
    const cacheKey = `wishlist_${wishlistId}`;
    
    try {
      // Check cache
      const cached = await this.cache.get<WishlistResponse>(cacheKey);
      if (cached) {
        return cached;
      }

      // Get wishlist
      const wishlist = await this.wishlistRepo.findById(wishlistId);
      if (!wishlist) {
        throw this.createError(
          WishlistErrorCode.WISHLIST_NOT_FOUND,
          'Wishlist not found'
        );
      }

      // Check access permissions
      if (!wishlist.isPublic && wishlist.userId !== userId) {
        throw this.createError(
          WishlistErrorCode.PERMISSION_DENIED,
          'You do not have permission to view this wishlist'
        );
      }

      // Get items
      const items = await this.itemRepo.findByWishlistId(wishlistId);

      // Increment view count if not owner
      if (userId && userId !== wishlist.userId) {
        await this.wishlistRepo.incrementViewCount(wishlistId);
      }

      const response: WishlistResponse = {
        wishlist,
        items,
        itemCount: items.length
      };

      // Cache the response
      await this.cache.set(cacheKey, response);

      return response;
    } catch (error) {
      this.logger.error('Failed to get wishlist', error);
      throw error;
    }
  }

  async updateWishlist(
    wishlistId: string,
    userId: string,
    data: UpdateWishlistRequest
  ): Promise<WishlistResponse> {
    try {
      // Get wishlist
      const wishlist = await this.wishlistRepo.findById(wishlistId);
      if (!wishlist) {
        throw this.createError(
          WishlistErrorCode.WISHLIST_NOT_FOUND,
          'Wishlist not found'
        );
      }

      // Check ownership
      if (wishlist.userId !== userId) {
        throw this.createError(
          WishlistErrorCode.PERMISSION_DENIED,
          'You do not have permission to update this wishlist'
        );
      }

      // Update wishlist
      const updated = await this.wishlistRepo.update(wishlistId, data);

      // Clear cache
      await this.cache.delete(`wishlist_${wishlistId}`);
      await this.cache.delete(`user_wishlists_${userId}`);

      this.logger.info('Wishlist updated', { wishlistId });

      return {
        wishlist: updated,
        itemCount: updated.itemCount
      };
    } catch (error) {
      this.logger.error('Failed to update wishlist', error);
      throw error;
    }
  }

  async deleteWishlist(
    wishlistId: string,
    userId: string
  ): Promise<void> {
    try {
      // Get wishlist
      const wishlist = await this.wishlistRepo.findById(wishlistId);
      if (!wishlist) {
        throw this.createError(
          WishlistErrorCode.WISHLIST_NOT_FOUND,
          'Wishlist not found'
        );
      }

      // Check ownership
      if (wishlist.userId !== userId) {
        throw this.createError(
          WishlistErrorCode.PERMISSION_DENIED,
          'You do not have permission to delete this wishlist'
        );
      }

      // Delete all items first
      await this.itemRepo.deleteByWishlistId(wishlistId);

      // Delete wishlist
      await this.wishlistRepo.delete(wishlistId);

      // Clear cache
      await this.cache.delete(`wishlist_${wishlistId}`);
      await this.cache.delete(`user_wishlists_${userId}`);

      this.logger.info('Wishlist deleted', { wishlistId });
    } catch (error) {
      this.logger.error('Failed to delete wishlist', error);
      throw error;
    }
  }

  async getUserWishlists(
    userId: string,
    filters?: WishlistFilters,
    sort?: WishlistSort
  ): Promise<WishlistListResponse> {
    const cacheKey = `user_wishlists_${userId}_${JSON.stringify(filters)}_${JSON.stringify(sort)}`;
    
    try {
      // Check cache
      const cached = await this.cache.get<WishlistListResponse>(cacheKey);
      if (cached) {
        return cached;
      }

      // Get wishlists
      const wishlists = await this.wishlistRepo.search(
        { ...filters, userId },
        sort || { field: 'updatedAt', order: 'desc' }
      );

      const total = await this.wishlistRepo.count({ ...filters, userId });

      const response: WishlistListResponse = {
        wishlists,
        total,
        page: 1,
        pageSize: wishlists.length
      };

      // Cache the response
      await this.cache.set(cacheKey, response);

      return response;
    } catch (error) {
      this.logger.error('Failed to get user wishlists', error);
      throw error;
    }
  }

  async getOrCreateDefaultWishlist(userId: string): Promise<Wishlist> {
    try {
      // Check for existing default
      const defaultWishlist = await this.wishlistRepo.getDefaultWishlist(userId);
      if (defaultWishlist) {
        return defaultWishlist;
      }

      // Create default wishlist
      const response = await this.createWishlist(userId, {
        name: 'My Wishlist',
        description: 'Default wishlist',
        isDefault: true,
        isPublic: false
      });

      return response.wishlist;
    } catch (error) {
      this.logger.error('Failed to get or create default wishlist', error);
      throw error;
    }
  }

  async generateShareToken(wishlistId: string): Promise<string> {
    try {
      const token = generateShareToken();
      await this.wishlistRepo.update(wishlistId, { shareToken: token });
      
      // Clear cache
      await this.cache.delete(`wishlist_${wishlistId}`);
      
      return token;
    } catch (error) {
      this.logger.error('Failed to generate share token', error);
      throw error;
    }
  }

  private createError(code: WishlistErrorCode, message: string): WishlistError {
    const error = new Error(message) as WishlistError;
    error.code = code;
    return error;
  }
}