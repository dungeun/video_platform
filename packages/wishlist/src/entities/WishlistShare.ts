import { BaseEntity } from '@company/types';

export interface WishlistShare extends BaseEntity {
  wishlistId: string;
  sharedByUserId: string;
  sharedWithUserId?: string;
  sharedWithEmail?: string;
  shareType: 'view' | 'edit' | 'collaborate';
  shareToken: string;
  expiresAt?: Date;
  accessCount: number;
  lastAccessedAt?: Date;
  message?: string;
  isActive: boolean;
  permissions: SharePermissions;
}

export interface SharePermissions {
  canView: boolean;
  canAddItems: boolean;
  canRemoveItems: boolean;
  canEditItems: boolean;
  canInviteOthers: boolean;
  canDelete: boolean;
}