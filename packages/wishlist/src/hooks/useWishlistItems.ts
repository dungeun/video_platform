import { useState, useCallback } from 'react';
import { useAuth } from '@repo/auth-core';
import { WishlistItemService } from '../services';
import {
  AddItemRequest,
  UpdateItemRequest,
  WishlistItemResponse,
  ItemFilters,
  ItemSort
} from '../types';
import { WishlistItem } from '../entities';

export function useWishlistItems(wishlistId?: string) {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize service (in real app, this would be injected)
  const itemService = new WishlistItemService(
    {} as any, // Repository implementations
    {} as any,
    {} as any
  );

  const addItem = useCallback(async (
    targetWishlistId: string,
    data: AddItemRequest
  ) => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await itemService.addItem(targetWishlistId, user.id, data);
      
      // Add to local state if it's the current wishlist
      if (targetWishlistId === wishlistId) {
        setItems(prev => [...prev, response.item]);
      }
      
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, wishlistId]);

  const updateItem = useCallback(async (
    itemId: string,
    data: UpdateItemRequest
  ) => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await itemService.updateItem(itemId, user.id, data);
      
      // Update in local state
      setItems(prev => prev.map(item => 
        item.id === itemId ? response.item : item
      ));
      
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const removeItem = useCallback(async (itemId: string) => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await itemService.removeItem(itemId, user.id);
      
      // Remove from local state
      setItems(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const moveItems = useCallback(async (
    itemIds: string[],
    targetWishlistId: string
  ) => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await itemService.moveItems(itemIds, targetWishlistId, user.id);
      
      // Remove from local state if moving from current wishlist
      if (wishlistId) {
        setItems(prev => prev.filter(item => !itemIds.includes(item.id)));
      }
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, wishlistId]);

  const markAsPurchased = useCallback(async (itemId: string) => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await itemService.markAsPurchased(itemId, user.id);
      
      // Update in local state
      setItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, isPurchased: true, purchasedAt: new Date() }
          : item
      ));
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshPrices = useCallback(async () => {
    if (!items.length) return;

    setLoading(true);
    setError(null);

    try {
      // In a real app, this would call a price update service
      // For now, we'll just simulate it
      const promises = items.map(item => {
        // Simulate price check
        const priceChange = (Math.random() - 0.5) * 0.1; // +/- 10%
        const newPrice = item.currentPrice * (1 + priceChange);
        return itemService.updatePrice(item.id, newPrice);
      });

      await Promise.all(promises);
      
      // Refresh items
      // In real app, would fetch updated items
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [items]);

  const sortItems = useCallback((
    sortBy: ItemSort['field'],
    order: ItemSort['order'] = 'asc'
  ) => {
    const sorted = [...items];
    
    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortBy) {
        case 'price':
          aValue = a.currentPrice;
          bValue = b.currentPrice;
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority || 'medium'];
          bValue = priorityOrder[b.priority || 'medium'];
          break;
        case 'addedAt':
          aValue = new Date(a.addedAt).getTime();
          bValue = new Date(b.addedAt).getTime();
          break;
        case 'name':
          aValue = a.productName.toLowerCase();
          bValue = b.productName.toLowerCase();
          break;
        case 'targetPrice':
          aValue = a.targetPrice || 0;
          bValue = b.targetPrice || 0;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
    
    setItems(sorted);
  }, [items]);

  const filterItems = useCallback((filters: ItemFilters) => {
    // This would typically be done server-side
    // For now, we'll implement client-side filtering
    let filtered = [...items];
    
    if (filters.priority) {
      filtered = filtered.filter(item => item.priority === filters.priority);
    }
    
    if (filters.isPurchased !== undefined) {
      filtered = filtered.filter(item => item.isPurchased === filters.isPurchased);
    }
    
    if (filters.priceRange) {
      const { min, max } = filters.priceRange;
      filtered = filtered.filter(item => {
        if (min !== undefined && item.currentPrice < min) return false;
        if (max !== undefined && item.currentPrice > max) return false;
        return true;
      });
    }
    
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(item => 
        item.tags.some(tag => filters.tags!.includes(tag))
      );
    }
    
    return filtered;
  }, [items]);

  return {
    items,
    loading,
    error,
    addItem,
    updateItem,
    removeItem,
    moveItems,
    markAsPurchased,
    refreshPrices,
    sortItems,
    filterItems
  };
}