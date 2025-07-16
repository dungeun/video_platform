import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@repo/auth-core';
import { 
  WishlistService, 
  WishlistItemService,
  WishlistShareService 
} from '../services';
import {
  CreateWishlistRequest,
  UpdateWishlistRequest,
  WishlistResponse,
  WishlistListResponse,
  WishlistFilters,
  WishlistSort
} from '../types';

export function useWishlist() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [wishlists, setWishlists] = useState<WishlistListResponse | null>(null);
  const [currentWishlist, setCurrentWishlist] = useState<WishlistResponse | null>(null);

  // Initialize services (in real app, these would be injected)
  const wishlistService = new WishlistService(
    {} as any, // Repository implementations
    {} as any,
    {} as any
  );

  const createWishlist = useCallback(async (data: CreateWishlistRequest) => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await wishlistService.createWishlist(user.id, data);
      setCurrentWishlist(response);
      
      // Refresh wishlist list
      if (wishlists) {
        setWishlists({
          ...wishlists,
          wishlists: [...wishlists.wishlists, response.wishlist],
          total: wishlists.total + 1
        });
      }
      
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, wishlists]);

  const updateWishlist = useCallback(async (
    wishlistId: string,
    data: UpdateWishlistRequest
  ) => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await wishlistService.updateWishlist(wishlistId, user.id, data);
      setCurrentWishlist(response);
      
      // Update in list
      if (wishlists) {
        setWishlists({
          ...wishlists,
          wishlists: wishlists.wishlists.map(w => 
            w.id === wishlistId ? response.wishlist : w
          )
        });
      }
      
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, wishlists]);

  const deleteWishlist = useCallback(async (wishlistId: string) => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await wishlistService.deleteWishlist(wishlistId, user.id);
      
      // Remove from list
      if (wishlists) {
        setWishlists({
          ...wishlists,
          wishlists: wishlists.wishlists.filter(w => w.id !== wishlistId),
          total: wishlists.total - 1
        });
      }
      
      // Clear current if it was deleted
      if (currentWishlist?.wishlist.id === wishlistId) {
        setCurrentWishlist(null);
      }
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, wishlists, currentWishlist]);

  const getWishlist = useCallback(async (wishlistId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await wishlistService.getWishlist(wishlistId, user?.id);
      setCurrentWishlist(response);
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getUserWishlists = useCallback(async (
    filters?: WishlistFilters,
    sort?: WishlistSort
  ) => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await wishlistService.getUserWishlists(user.id, filters, sort);
      setWishlists(response);
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getDefaultWishlist = useCallback(async () => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const wishlist = await wishlistService.getOrCreateDefaultWishlist(user.id);
      const response = await wishlistService.getWishlist(wishlist.id, user.id);
      setCurrentWishlist(response);
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const generateShareLink = useCallback(async (wishlistId: string) => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await wishlistService.generateShareToken(wishlistId);
      const shareUrl = `${window.location.origin}/wishlists/shared/${token}`;
      return { token, shareUrl };
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load user wishlists on mount
  useEffect(() => {
    if (user) {
      getUserWishlists();
    }
  }, [user]);

  return {
    wishlists,
    currentWishlist,
    loading,
    error,
    createWishlist,
    updateWishlist,
    deleteWishlist,
    getWishlist,
    getUserWishlists,
    getDefaultWishlist,
    generateShareLink
  };
}