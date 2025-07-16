import { Logger } from '@repo/core';
import { CacheManager } from '@repo/cache';
import { 
  IWishlistRepository,
  IWishlistItemRepository,
  IWishlistNotificationRepository 
} from '../repositories/interfaces';
import {
  AddItemRequest,
  UpdateItemRequest,
  WishlistItemResponse,
  ItemFilters,
  ItemSort,
  WishlistError,
  WishlistErrorCode
} from '../types';
import { WishlistItem, WishlistNotification } from '../entities';

export class WishlistItemService {
  private readonly logger = new Logger('WishlistItemService');
  private readonly cache: CacheManager;
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly MAX_ITEMS_PER_WISHLIST = 500;

  constructor(
    private readonly wishlistRepo: IWishlistRepository,
    private readonly itemRepo: IWishlistItemRepository,
    private readonly notificationRepo: IWishlistNotificationRepository
  ) {
    this.cache = new CacheManager({ defaultTTL: this.CACHE_TTL });
  }

  async addItem(
    wishlistId: string,
    userId: string,
    data: AddItemRequest
  ): Promise<WishlistItemResponse> {
    try {
      // Verify wishlist exists and user has permission
      const wishlist = await this.wishlistRepo.findById(wishlistId);
      if (!wishlist) {
        throw this.createError(
          WishlistErrorCode.WISHLIST_NOT_FOUND,
          'Wishlist not found'
        );
      }

      if (wishlist.userId !== userId) {
        throw this.createError(
          WishlistErrorCode.PERMISSION_DENIED,
          'You do not have permission to add items to this wishlist'
        );
      }

      // Check item limit
      const itemCount = await this.itemRepo.count({ wishlistId });
      if (itemCount >= this.MAX_ITEMS_PER_WISHLIST) {
        throw this.createError(
          WishlistErrorCode.ITEM_LIMIT_EXCEEDED,
          `Maximum ${this.MAX_ITEMS_PER_WISHLIST} items allowed per wishlist`
        );
      }

      // Check for duplicate
      const isDuplicate = await this.itemRepo.checkDuplicate(wishlistId, data.productId);
      if (isDuplicate) {
        throw this.createError(
          WishlistErrorCode.DUPLICATE_ITEM,
          'This item is already in the wishlist'
        );
      }

      // Create item
      const item = await this.itemRepo.create({
        ...data,
        wishlistId,
        quantity: data.quantity || 1,
        priority: data.priority || 'medium',
        originalPrice: data.currentPrice,
        lowestPrice: data.currentPrice,
        highestPrice: data.currentPrice,
        priceHistory: [{
          price: data.currentPrice,
          timestamp: new Date(),
          currency: 'USD'
        }]
      });

      // Update wishlist item count
      await this.wishlistRepo.update(wishlistId, { 
        itemCount: itemCount + 1 
      });

      // Clear cache
      await this.clearWishlistCache(wishlistId);

      // Check if price notifications are enabled
      if (wishlist.settings.notifyOnPriceChange && data.targetPrice) {
        await this.checkPriceTarget(item, wishlist.userId);
      }

      this.logger.info('Item added to wishlist', { 
        itemId: item.id, 
        wishlistId, 
        productId: data.productId 
      });

      return {
        item,
        priceChange: {
          amount: 0,
          percentage: 0,
          direction: 'stable'
        }
      };
    } catch (error) {
      this.logger.error('Failed to add item', error);
      throw error;
    }
  }

  async updateItem(
    itemId: string,
    userId: string,
    data: UpdateItemRequest
  ): Promise<WishlistItemResponse> {
    try {
      // Get item
      const item = await this.itemRepo.findById(itemId);
      if (!item) {
        throw this.createError(
          WishlistErrorCode.ITEM_NOT_FOUND,
          'Item not found'
        );
      }

      // Verify wishlist ownership
      const wishlist = await this.wishlistRepo.findById(item.wishlistId);
      if (!wishlist || wishlist.userId !== userId) {
        throw this.createError(
          WishlistErrorCode.PERMISSION_DENIED,
          'You do not have permission to update this item'
        );
      }

      // Update item
      const updatedItem = await this.itemRepo.update(itemId, data);

      // Clear cache
      await this.clearWishlistCache(item.wishlistId);

      // Check if target price is reached
      if (data.targetPrice && wishlist.settings.notifyOnPriceChange) {
        await this.checkPriceTarget(updatedItem, wishlist.userId);
      }

      this.logger.info('Item updated', { itemId });

      return {
        item: updatedItem,
        priceChange: this.calculatePriceChange(item, updatedItem)
      };
    } catch (error) {
      this.logger.error('Failed to update item', error);
      throw error;
    }
  }

  async removeItem(
    itemId: string,
    userId: string
  ): Promise<void> {
    try {
      // Get item
      const item = await this.itemRepo.findById(itemId);
      if (!item) {
        throw this.createError(
          WishlistErrorCode.ITEM_NOT_FOUND,
          'Item not found'
        );
      }

      // Verify wishlist ownership
      const wishlist = await this.wishlistRepo.findById(item.wishlistId);
      if (!wishlist || wishlist.userId !== userId) {
        throw this.createError(
          WishlistErrorCode.PERMISSION_DENIED,
          'You do not have permission to remove this item'
        );
      }

      // Delete item
      await this.itemRepo.delete(itemId);

      // Update wishlist item count
      const itemCount = await this.itemRepo.count({ wishlistId: item.wishlistId });
      await this.wishlistRepo.update(item.wishlistId, { itemCount });

      // Clear cache
      await this.clearWishlistCache(item.wishlistId);

      this.logger.info('Item removed from wishlist', { itemId });
    } catch (error) {
      this.logger.error('Failed to remove item', error);
      throw error;
    }
  }

  async moveItems(
    itemIds: string[],
    targetWishlistId: string,
    userId: string
  ): Promise<void> {
    try {
      // Verify target wishlist
      const targetWishlist = await this.wishlistRepo.findById(targetWishlistId);
      if (!targetWishlist || targetWishlist.userId !== userId) {
        throw this.createError(
          WishlistErrorCode.PERMISSION_DENIED,
          'You do not have permission to move items to this wishlist'
        );
      }

      // Check item limit
      const currentCount = await this.itemRepo.count({ wishlistId: targetWishlistId });
      if (currentCount + itemIds.length > this.MAX_ITEMS_PER_WISHLIST) {
        throw this.createError(
          WishlistErrorCode.ITEM_LIMIT_EXCEEDED,
          'Moving these items would exceed the wishlist limit'
        );
      }

      // Move items
      await this.itemRepo.moveItems(itemIds, targetWishlistId);

      // Update item counts
      const affectedWishlistIds = new Set<string>();
      for (const itemId of itemIds) {
        const item = await this.itemRepo.findById(itemId);
        if (item) {
          affectedWishlistIds.add(item.wishlistId);
        }
      }

      for (const wishlistId of [...affectedWishlistIds, targetWishlistId]) {
        const count = await this.itemRepo.count({ wishlistId });
        await this.wishlistRepo.update(wishlistId, { itemCount: count });
        await this.clearWishlistCache(wishlistId);
      }

      this.logger.info('Items moved', { 
        itemCount: itemIds.length, 
        targetWishlistId 
      });
    } catch (error) {
      this.logger.error('Failed to move items', error);
      throw error;
    }
  }

  async updatePrice(
    itemId: string,
    newPrice: number
  ): Promise<void> {
    try {
      const item = await this.itemRepo.findById(itemId);
      if (!item) {
        return;
      }

      const oldPrice = item.currentPrice;
      await this.itemRepo.updatePrice(itemId, newPrice);

      // Get wishlist for notifications
      const wishlist = await this.wishlistRepo.findById(item.wishlistId);
      if (!wishlist) {
        return;
      }

      // Check for price drop notification
      if (wishlist.settings.notifyOnPriceChange) {
        const priceDropThreshold = wishlist.settings.priceDropThreshold || 10;
        const dropPercentage = ((oldPrice - newPrice) / oldPrice) * 100;

        if (dropPercentage >= priceDropThreshold) {
          await this.notificationRepo.create({
            userId: wishlist.userId,
            wishlistId: wishlist.id,
            itemId: item.id,
            type: 'price_drop',
            title: 'Price Drop Alert!',
            message: `${item.productName} price dropped by ${dropPercentage.toFixed(0)}%`,
            data: {
              productId: item.productId,
              productName: item.productName,
              previousPrice: oldPrice,
              currentPrice: newPrice,
              priceChange: oldPrice - newPrice
            },
            priority: 'high',
            isRead: false
          });
        }

        // Check if target price reached
        if (item.targetPrice && newPrice <= item.targetPrice) {
          await this.notificationRepo.create({
            userId: wishlist.userId,
            wishlistId: wishlist.id,
            itemId: item.id,
            type: 'target_price_reached',
            title: 'Target Price Reached!',
            message: `${item.productName} has reached your target price of $${item.targetPrice}`,
            data: {
              productId: item.productId,
              productName: item.productName,
              currentPrice: newPrice,
              targetPrice: item.targetPrice
            },
            priority: 'high',
            isRead: false
          });
        }
      }

      await this.clearWishlistCache(item.wishlistId);
    } catch (error) {
      this.logger.error('Failed to update price', error);
    }
  }

  async markAsPurchased(
    itemId: string,
    userId: string
  ): Promise<void> {
    try {
      const item = await this.itemRepo.findById(itemId);
      if (!item) {
        throw this.createError(
          WishlistErrorCode.ITEM_NOT_FOUND,
          'Item not found'
        );
      }

      const wishlist = await this.wishlistRepo.findById(item.wishlistId);
      if (!wishlist || wishlist.userId !== userId) {
        throw this.createError(
          WishlistErrorCode.PERMISSION_DENIED,
          'You do not have permission to mark this item as purchased'
        );
      }

      await this.itemRepo.markAsPurchased(itemId);
      await this.clearWishlistCache(item.wishlistId);

      this.logger.info('Item marked as purchased', { itemId });
    } catch (error) {
      this.logger.error('Failed to mark item as purchased', error);
      throw error;
    }
  }

  private async checkPriceTarget(
    item: WishlistItem,
    userId: string
  ): Promise<void> {
    if (item.targetPrice && item.currentPrice <= item.targetPrice) {
      await this.notificationRepo.create({
        userId,
        wishlistId: item.wishlistId,
        itemId: item.id,
        type: 'target_price_reached',
        title: 'Target Price Reached!',
        message: `${item.productName} is now at or below your target price`,
        data: {
          productId: item.productId,
          productName: item.productName,
          currentPrice: item.currentPrice,
          targetPrice: item.targetPrice
        },
        priority: 'high',
        isRead: false
      });
    }
  }

  private calculatePriceChange(
    oldItem: WishlistItem,
    newItem: WishlistItem
  ): WishlistItemResponse['priceChange'] {
    const amount = newItem.currentPrice - oldItem.currentPrice;
    const percentage = (amount / oldItem.currentPrice) * 100;
    const direction = amount > 0 ? 'up' : amount < 0 ? 'down' : 'stable';

    return { amount, percentage, direction };
  }

  private async clearWishlistCache(wishlistId: string): Promise<void> {
    await this.cache.delete(`wishlist_${wishlistId}`);
    await this.cache.deletePattern(`wishlist_items_${wishlistId}_*`);
  }

  private createError(code: WishlistErrorCode, message: string): WishlistError {
    const error = new Error(message) as WishlistError;
    error.code = code;
    return error;
  }
}