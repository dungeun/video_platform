import { Logger } from '@company/core';
import { 
  IWishlistRepository,
  IWishlistShareRepository,
  IWishlistNotificationRepository 
} from '../repositories/interfaces';
import {
  ShareWishlistRequest,
  ShareResponse,
  WishlistError,
  WishlistErrorCode
} from '../types';
import { WishlistShare } from '../entities';
import { generateShareToken } from '../utils';

export class WishlistShareService {
  private readonly logger = new Logger('WishlistShareService');
  private readonly BASE_SHARE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  constructor(
    private readonly wishlistRepo: IWishlistRepository,
    private readonly shareRepo: IWishlistShareRepository,
    private readonly notificationRepo: IWishlistNotificationRepository
  ) {}

  async shareWishlist(
    userId: string,
    data: ShareWishlistRequest
  ): Promise<ShareResponse> {
    try {
      // Verify wishlist exists and user has permission
      const wishlist = await this.wishlistRepo.findById(data.wishlistId);
      if (!wishlist) {
        throw this.createError(
          WishlistErrorCode.WISHLIST_NOT_FOUND,
          'Wishlist not found'
        );
      }

      if (wishlist.userId !== userId) {
        throw this.createError(
          WishlistErrorCode.PERMISSION_DENIED,
          'You do not have permission to share this wishlist'
        );
      }

      // Generate share token
      const shareToken = generateShareToken();

      // Create share record
      const share = await this.shareRepo.create({
        ...data,
        shareToken,
        sharedByUserId: userId,
        permissions: {
          canView: true,
          canAddItems: data.shareType !== 'view',
          canRemoveItems: data.shareType === 'collaborate',
          canEditItems: data.shareType === 'collaborate',
          canInviteOthers: false,
          canDelete: false,
          ...data.permissions
        }
      });

      // Update wishlist share count
      await this.wishlistRepo.update(data.wishlistId, {
        sharedCount: (wishlist.sharedCount || 0) + 1
      });

      // Send notification to recipient if user ID provided
      if (data.sharedWithUserId) {
        await this.notificationRepo.create({
          userId: data.sharedWithUserId,
          wishlistId: data.wishlistId,
          type: 'wishlist_shared',
          title: 'Wishlist Shared With You',
          message: `${userId} shared "${wishlist.name}" with you`,
          data: {
            sharedByUser: userId,
            shareType: data.shareType,
            wishlistName: wishlist.name
          },
          priority: 'medium',
          isRead: false,
          actionUrl: `/wishlists/shared/${shareToken}`,
          actionLabel: 'View Wishlist'
        });
      }

      const shareUrl = `${this.BASE_SHARE_URL}/wishlists/shared/${shareToken}`;

      this.logger.info('Wishlist shared', { 
        wishlistId: data.wishlistId, 
        shareType: data.shareType 
      });

      return { share, shareUrl };
    } catch (error) {
      this.logger.error('Failed to share wishlist', error);
      throw error;
    }
  }

  async accessSharedWishlist(
    shareToken: string,
    userId?: string
  ): Promise<WishlistShare> {
    try {
      // Find share by token
      const share = await this.shareRepo.findByToken(shareToken);
      if (!share) {
        throw this.createError(
          WishlistErrorCode.INVALID_SHARE_TOKEN,
          'Invalid or expired share link'
        );
      }

      // Check if share is active
      if (!share.isActive) {
        throw this.createError(
          WishlistErrorCode.SHARE_EXPIRED,
          'This share link has been revoked'
        );
      }

      // Check expiration
      if (share.expiresAt && new Date() > share.expiresAt) {
        await this.shareRepo.update(share.id, { isActive: false });
        throw this.createError(
          WishlistErrorCode.SHARE_EXPIRED,
          'This share link has expired'
        );
      }

      // Check if specific user access
      if (share.sharedWithUserId && share.sharedWithUserId !== userId) {
        throw this.createError(
          WishlistErrorCode.PERMISSION_DENIED,
          'This share link is not for you'
        );
      }

      // Update access tracking
      await this.shareRepo.incrementAccessCount(share.id);
      await this.shareRepo.updateLastAccessed(share.id);

      return share;
    } catch (error) {
      this.logger.error('Failed to access shared wishlist', error);
      throw error;
    }
  }

  async revokeShare(
    shareId: string,
    userId: string
  ): Promise<void> {
    try {
      const share = await this.shareRepo.findById(shareId);
      if (!share) {
        throw this.createError(
          WishlistErrorCode.WISHLIST_NOT_FOUND,
          'Share not found'
        );
      }

      const wishlist = await this.wishlistRepo.findById(share.wishlistId);
      if (!wishlist || wishlist.userId !== userId) {
        throw this.createError(
          WishlistErrorCode.PERMISSION_DENIED,
          'You do not have permission to revoke this share'
        );
      }

      await this.shareRepo.revokeShare(shareId);

      // Update wishlist share count
      const activeShares = await this.shareRepo.findActiveShares(share.wishlistId);
      await this.wishlistRepo.update(share.wishlistId, {
        sharedCount: activeShares.length
      });

      this.logger.info('Share revoked', { shareId });
    } catch (error) {
      this.logger.error('Failed to revoke share', error);
      throw error;
    }
  }

  async getWishlistShares(
    wishlistId: string,
    userId: string
  ): Promise<WishlistShare[]> {
    try {
      const wishlist = await this.wishlistRepo.findById(wishlistId);
      if (!wishlist || wishlist.userId !== userId) {
        throw this.createError(
          WishlistErrorCode.PERMISSION_DENIED,
          'You do not have permission to view shares for this wishlist'
        );
      }

      return await this.shareRepo.findActiveShares(wishlistId);
    } catch (error) {
      this.logger.error('Failed to get wishlist shares', error);
      throw error;
    }
  }

  async cleanupExpiredShares(): Promise<void> {
    try {
      const expiredShares = await this.shareRepo.findExpiredShares();
      
      for (const share of expiredShares) {
        await this.shareRepo.update(share.id, { isActive: false });
        
        // Update wishlist share count
        const activeShares = await this.shareRepo.findActiveShares(share.wishlistId);
        await this.wishlistRepo.update(share.wishlistId, {
          sharedCount: activeShares.length
        });
      }

      this.logger.info('Cleaned up expired shares', { count: expiredShares.length });
    } catch (error) {
      this.logger.error('Failed to cleanup expired shares', error);
    }
  }

  private createError(code: WishlistErrorCode, message: string): WishlistError {
    const error = new Error(message) as WishlistError;
    error.code = code;
    return error;
  }
}