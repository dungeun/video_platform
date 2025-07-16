import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WishlistService, WishlistItemService } from '../src/services';
import { 
  CreateWishlistRequest, 
  AddItemRequest,
  WishlistErrorCode 
} from '../src/types';

describe('WishlistService', () => {
  let wishlistService: WishlistService;
  let mockWishlistRepo: any;
  let mockItemRepo: any;
  let mockNotificationRepo: any;

  beforeEach(() => {
    mockWishlistRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      search: vi.fn(),
      getDefaultWishlist: vi.fn(),
      incrementViewCount: vi.fn()
    };

    mockItemRepo = {
      findByWishlistId: vi.fn(),
      deleteByWishlistId: vi.fn()
    };

    mockNotificationRepo = {
      create: vi.fn()
    };

    wishlistService = new WishlistService(
      mockWishlistRepo,
      mockItemRepo,
      mockNotificationRepo
    );
  });

  describe('createWishlist', () => {
    it('should create a new wishlist', async () => {
      const userId = 'user123';
      const createRequest: CreateWishlistRequest = {
        name: 'My Birthday Wishlist',
        description: 'Things I want for my birthday',
        isPublic: true,
        tags: ['birthday', 'gifts']
      };

      const expectedWishlist = {
        id: 'wishlist123',
        userId,
        ...createRequest,
        isDefault: false,
        itemCount: 0,
        sharedCount: 0,
        viewCount: 0,
        settings: {
          notifyOnPriceChange: true,
          notifyOnStock: true,
          autoRemoveOutOfStock: false,
          allowComments: true,
          requireApprovalForSharing: false
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockWishlistRepo.count.mockResolvedValue(0);
      mockWishlistRepo.create.mockResolvedValue(expectedWishlist);

      const result = await wishlistService.createWishlist(userId, createRequest);

      expect(result.wishlist).toEqual(expectedWishlist);
      expect(result.itemCount).toBe(0);
      expect(mockWishlistRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createRequest,
          settings: expect.any(Object)
        })
      );
    });

    it('should throw error when wishlist limit exceeded', async () => {
      const userId = 'user123';
      mockWishlistRepo.count.mockResolvedValue(50); // Max limit

      await expect(
        wishlistService.createWishlist(userId, { name: 'New Wishlist' })
      ).rejects.toThrow();
    });

    it('should unset other default wishlists when creating default', async () => {
      const userId = 'user123';
      const existingWishlists = [
        { id: '1', isDefault: true },
        { id: '2', isDefault: false }
      ];

      mockWishlistRepo.count.mockResolvedValue(2);
      mockWishlistRepo.findByUserId.mockResolvedValue(existingWishlists);
      mockWishlistRepo.create.mockResolvedValue({ id: '3', isDefault: true });

      await wishlistService.createWishlist(userId, {
        name: 'New Default',
        isDefault: true
      });

      expect(mockWishlistRepo.update).toHaveBeenCalledWith('1', { isDefault: false });
    });
  });

  describe('getWishlist', () => {
    it('should return wishlist with items', async () => {
      const wishlistId = 'wishlist123';
      const wishlist = {
        id: wishlistId,
        userId: 'user123',
        name: 'My Wishlist',
        isPublic: true,
        itemCount: 2
      };
      const items = [
        { id: 'item1', wishlistId, productName: 'Product 1' },
        { id: 'item2', wishlistId, productName: 'Product 2' }
      ];

      mockWishlistRepo.findById.mockResolvedValue(wishlist);
      mockItemRepo.findByWishlistId.mockResolvedValue(items);

      const result = await wishlistService.getWishlist(wishlistId);

      expect(result.wishlist).toEqual(wishlist);
      expect(result.items).toEqual(items);
      expect(result.itemCount).toBe(2);
    });

    it('should throw error for non-existent wishlist', async () => {
      mockWishlistRepo.findById.mockResolvedValue(null);

      await expect(
        wishlistService.getWishlist('invalid-id')
      ).rejects.toThrow();
    });

    it('should throw error for private wishlist without permission', async () => {
      const wishlist = {
        id: 'wishlist123',
        userId: 'owner123',
        isPublic: false
      };

      mockWishlistRepo.findById.mockResolvedValue(wishlist);

      await expect(
        wishlistService.getWishlist('wishlist123', 'other-user')
      ).rejects.toThrow();
    });
  });
});

describe('WishlistItemService', () => {
  let itemService: WishlistItemService;
  let mockWishlistRepo: any;
  let mockItemRepo: any;
  let mockNotificationRepo: any;

  beforeEach(() => {
    mockWishlistRepo = {
      findById: vi.fn(),
      update: vi.fn()
    };

    mockItemRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      checkDuplicate: vi.fn(),
      updatePrice: vi.fn(),
      markAsPurchased: vi.fn()
    };

    mockNotificationRepo = {
      create: vi.fn()
    };

    itemService = new WishlistItemService(
      mockWishlistRepo,
      mockItemRepo,
      mockNotificationRepo
    );
  });

  describe('addItem', () => {
    it('should add item to wishlist', async () => {
      const wishlistId = 'wishlist123';
      const userId = 'user123';
      const wishlist = {
        id: wishlistId,
        userId,
        settings: { notifyOnPriceChange: true }
      };
      
      const addItemRequest: AddItemRequest = {
        productId: 'prod123',
        productName: 'Test Product',
        currentPrice: 99.99,
        quantity: 1
      };

      const expectedItem = {
        id: 'item123',
        wishlistId,
        ...addItemRequest,
        priority: 'medium',
        originalPrice: 99.99,
        lowestPrice: 99.99,
        highestPrice: 99.99,
        priceHistory: [{ price: 99.99, timestamp: expect.any(Date), currency: 'USD' }]
      };

      mockWishlistRepo.findById.mockResolvedValue(wishlist);
      mockItemRepo.count.mockResolvedValue(0);
      mockItemRepo.checkDuplicate.mockResolvedValue(false);
      mockItemRepo.create.mockResolvedValue(expectedItem);

      const result = await itemService.addItem(wishlistId, userId, addItemRequest);

      expect(result.item).toEqual(expectedItem);
      expect(mockWishlistRepo.update).toHaveBeenCalledWith(wishlistId, { itemCount: 1 });
    });

    it('should throw error for duplicate item', async () => {
      const wishlist = { id: 'wishlist123', userId: 'user123' };
      
      mockWishlistRepo.findById.mockResolvedValue(wishlist);
      mockItemRepo.count.mockResolvedValue(1);
      mockItemRepo.checkDuplicate.mockResolvedValue(true);

      await expect(
        itemService.addItem('wishlist123', 'user123', {
          productId: 'prod123',
          productName: 'Test',
          currentPrice: 10
        })
      ).rejects.toThrow();
    });
  });

  describe('updatePrice', () => {
    it('should send notification on significant price drop', async () => {
      const item = {
        id: 'item123',
        wishlistId: 'wishlist123',
        productName: 'Test Product',
        currentPrice: 100,
        targetPrice: null
      };
      
      const wishlist = {
        id: 'wishlist123',
        userId: 'user123',
        settings: {
          notifyOnPriceChange: true,
          priceDropThreshold: 10
        }
      };

      mockItemRepo.findById.mockResolvedValue(item);
      mockWishlistRepo.findById.mockResolvedValue(wishlist);

      await itemService.updatePrice('item123', 80); // 20% drop

      expect(mockNotificationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'price_drop',
          userId: 'user123',
          priority: 'high'
        })
      );
    });
  });
});