import { useState, useCallback } from 'react';
import { useAuth } from '@repo/auth-core';
import { WishlistShareService } from '../services';
import { ShareWishlistRequest, ShareResponse } from '../types';
import { WishlistShare } from '../entities';

export function useWishlistShare() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [shares, setShares] = useState<WishlistShare[]>([]);
  const [currentShare, setCurrentShare] = useState<WishlistShare | null>(null);

  // Initialize service (in real app, this would be injected)
  const shareService = new WishlistShareService(
    {} as any, // Repository implementations
    {} as any,
    {} as any
  );

  const shareWishlist = useCallback(async (data: ShareWishlistRequest) => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await shareService.shareWishlist(user.id, data);
      
      // Add to local shares
      setShares(prev => [...prev, response.share]);
      
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const accessSharedWishlist = useCallback(async (shareToken: string) => {
    setLoading(true);
    setError(null);

    try {
      const share = await shareService.accessSharedWishlist(shareToken, user?.id);
      setCurrentShare(share);
      return share;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const revokeShare = useCallback(async (shareId: string) => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await shareService.revokeShare(shareId, user.id);
      
      // Remove from local shares
      setShares(prev => prev.filter(share => share.id !== shareId));
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getWishlistShares = useCallback(async (wishlistId: string) => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const wishlistShares = await shareService.getWishlistShares(wishlistId, user.id);
      setShares(wishlistShares);
      return wishlistShares;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const copyShareLink = useCallback(async (shareToken: string) => {
    const shareUrl = `${window.location.origin}/wishlists/shared/${shareToken}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      return true;
    } catch (err) {
      setError(new Error('Failed to copy share link'));
      return false;
    }
  }, []);

  const generateQRCode = useCallback((shareToken: string) => {
    const shareUrl = `${window.location.origin}/wishlists/shared/${shareToken}`;
    // In a real app, you'd use a QR code library
    // For now, we'll use a QR code API
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
  }, []);

  return {
    shares,
    currentShare,
    loading,
    error,
    shareWishlist,
    accessSharedWishlist,
    revokeShare,
    getWishlistShares,
    copyShareLink,
    generateQRCode
  };
}