import { Logger } from '@company/core';
import { CacheManager } from '@company/cache';
import { 
  ICollectionRepository,
  IWishlistRepository 
} from '../repositories/interfaces';
import {
  CreateCollectionRequest,
  WishlistError,
  WishlistErrorCode
} from '../types';
import { Collection } from '../entities';

export class CollectionService {
  private readonly logger = new Logger('CollectionService');
  private readonly cache: CacheManager;
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly MAX_COLLECTIONS_PER_USER = 20;

  constructor(
    private readonly collectionRepo: ICollectionRepository,
    private readonly wishlistRepo: IWishlistRepository
  ) {
    this.cache = new CacheManager({ defaultTTL: this.CACHE_TTL });
  }

  async createCollection(
    userId: string,
    data: CreateCollectionRequest
  ): Promise<Collection> {
    try {
      // Check collection limit
      const existingCollections = await this.collectionRepo.findByUserId(userId);
      if (existingCollections.length >= this.MAX_COLLECTIONS_PER_USER) {
        throw this.createError(
          WishlistErrorCode.COLLECTION_NOT_FOUND,
          `Maximum ${this.MAX_COLLECTIONS_PER_USER} collections allowed per user`
        );
      }

      // Validate wishlist IDs if manual collection
      if (data.type === 'manual' && data.wishlistIds) {
        for (const wishlistId of data.wishlistIds) {
          const wishlist = await this.wishlistRepo.findById(wishlistId);
          if (!wishlist || wishlist.userId !== userId) {
            throw this.createError(
              WishlistErrorCode.PERMISSION_DENIED,
              'You can only add your own wishlists to collections'
            );
          }
        }
      }

      // Create collection
      const collection = await this.collectionRepo.create({
        ...data,
        userId,
        sortOrder: existingCollections.length
      });

      // If smart collection, evaluate rules
      if (collection.type === 'smart') {
        await this.collectionRepo.updateSmartCollection(collection.id);
      }

      // Clear cache
      await this.cache.delete(`user_collections_${userId}`);

      this.logger.info('Collection created', { 
        collectionId: collection.id, 
        userId 
      });

      return collection;
    } catch (error) {
      this.logger.error('Failed to create collection', error);
      throw error;
    }
  }

  async updateCollection(
    collectionId: string,
    userId: string,
    data: Partial<Collection>
  ): Promise<Collection> {
    try {
      const collection = await this.collectionRepo.findById(collectionId);
      if (!collection) {
        throw this.createError(
          WishlistErrorCode.COLLECTION_NOT_FOUND,
          'Collection not found'
        );
      }

      if (collection.userId !== userId) {
        throw this.createError(
          WishlistErrorCode.PERMISSION_DENIED,
          'You do not have permission to update this collection'
        );
      }

      const updated = await this.collectionRepo.update(collectionId, data);

      // If smart collection with updated rules, re-evaluate
      if (updated.type === 'smart' && data.rules) {
        await this.collectionRepo.updateSmartCollection(collectionId);
      }

      // Clear cache
      await this.cache.delete(`collection_${collectionId}`);
      await this.cache.delete(`user_collections_${userId}`);

      this.logger.info('Collection updated', { collectionId });

      return updated;
    } catch (error) {
      this.logger.error('Failed to update collection', error);
      throw error;
    }
  }

  async deleteCollection(
    collectionId: string,
    userId: string
  ): Promise<void> {
    try {
      const collection = await this.collectionRepo.findById(collectionId);
      if (!collection) {
        throw this.createError(
          WishlistErrorCode.COLLECTION_NOT_FOUND,
          'Collection not found'
        );
      }

      if (collection.userId !== userId) {
        throw this.createError(
          WishlistErrorCode.PERMISSION_DENIED,
          'You do not have permission to delete this collection'
        );
      }

      await this.collectionRepo.delete(collectionId);

      // Clear cache
      await this.cache.delete(`collection_${collectionId}`);
      await this.cache.delete(`user_collections_${userId}`);

      this.logger.info('Collection deleted', { collectionId });
    } catch (error) {
      this.logger.error('Failed to delete collection', error);
      throw error;
    }
  }

  async addWishlistToCollection(
    collectionId: string,
    wishlistId: string,
    userId: string
  ): Promise<void> {
    try {
      const collection = await this.collectionRepo.findById(collectionId);
      if (!collection || collection.userId !== userId) {
        throw this.createError(
          WishlistErrorCode.PERMISSION_DENIED,
          'You do not have permission to modify this collection'
        );
      }

      if (collection.type !== 'manual') {
        throw this.createError(
          WishlistErrorCode.PERMISSION_DENIED,
          'Cannot manually add wishlists to smart collections'
        );
      }

      const wishlist = await this.wishlistRepo.findById(wishlistId);
      if (!wishlist || wishlist.userId !== userId) {
        throw this.createError(
          WishlistErrorCode.PERMISSION_DENIED,
          'You can only add your own wishlists to collections'
        );
      }

      await this.collectionRepo.addWishlist(collectionId, wishlistId);

      // Clear cache
      await this.cache.delete(`collection_${collectionId}`);

      this.logger.info('Wishlist added to collection', { 
        collectionId, 
        wishlistId 
      });
    } catch (error) {
      this.logger.error('Failed to add wishlist to collection', error);
      throw error;
    }
  }

  async removeWishlistFromCollection(
    collectionId: string,
    wishlistId: string,
    userId: string
  ): Promise<void> {
    try {
      const collection = await this.collectionRepo.findById(collectionId);
      if (!collection || collection.userId !== userId) {
        throw this.createError(
          WishlistErrorCode.PERMISSION_DENIED,
          'You do not have permission to modify this collection'
        );
      }

      if (collection.type !== 'manual') {
        throw this.createError(
          WishlistErrorCode.PERMISSION_DENIED,
          'Cannot manually remove wishlists from smart collections'
        );
      }

      await this.collectionRepo.removeWishlist(collectionId, wishlistId);

      // Clear cache
      await this.cache.delete(`collection_${collectionId}`);

      this.logger.info('Wishlist removed from collection', { 
        collectionId, 
        wishlistId 
      });
    } catch (error) {
      this.logger.error('Failed to remove wishlist from collection', error);
      throw error;
    }
  }

  async getCollections(userId: string): Promise<Collection[]> {
    const cacheKey = `user_collections_${userId}`;
    
    try {
      // Check cache
      const cached = await this.cache.get<Collection[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const collections = await this.collectionRepo.findByUserId(userId);

      // Cache the result
      await this.cache.set(cacheKey, collections);

      return collections;
    } catch (error) {
      this.logger.error('Failed to get collections', error);
      throw error;
    }
  }

  async getCollectionWishlists(
    collectionId: string,
    userId: string
  ): Promise<any[]> {
    try {
      const collection = await this.collectionRepo.findById(collectionId);
      if (!collection) {
        throw this.createError(
          WishlistErrorCode.COLLECTION_NOT_FOUND,
          'Collection not found'
        );
      }

      if (!collection.isPublic && collection.userId !== userId) {
        throw this.createError(
          WishlistErrorCode.PERMISSION_DENIED,
          'You do not have permission to view this collection'
        );
      }

      return await this.collectionRepo.getWishlists(collectionId);
    } catch (error) {
      this.logger.error('Failed to get collection wishlists', error);
      throw error;
    }
  }

  async refreshSmartCollections(userId: string): Promise<void> {
    try {
      const collections = await this.collectionRepo.findByUserId(userId);
      const smartCollections = collections.filter(c => c.type === 'smart');

      for (const collection of smartCollections) {
        await this.collectionRepo.updateSmartCollection(collection.id);
      }

      // Clear cache
      await this.cache.delete(`user_collections_${userId}`);

      this.logger.info('Smart collections refreshed', { 
        userId, 
        count: smartCollections.length 
      });
    } catch (error) {
      this.logger.error('Failed to refresh smart collections', error);
    }
  }

  private createError(code: WishlistErrorCode, message: string): WishlistError {
    const error = new Error(message) as WishlistError;
    error.code = code;
    return error;
  }
}