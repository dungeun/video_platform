import { WishlistError, WishlistErrorCode } from '../types';

export class WishlistNotFoundException extends Error implements WishlistError {
  code = WishlistErrorCode.WISHLIST_NOT_FOUND;
  
  constructor(message: string = 'Wishlist not found') {
    super(message);
    this.name = 'WishlistNotFoundException';
  }
}

export class ItemNotFoundException extends Error implements WishlistError {
  code = WishlistErrorCode.ITEM_NOT_FOUND;
  
  constructor(message: string = 'Wishlist item not found') {
    super(message);
    this.name = 'ItemNotFoundException';
  }
}

export class DuplicateItemException extends Error implements WishlistError {
  code = WishlistErrorCode.DUPLICATE_ITEM;
  
  constructor(message: string = 'Item already exists in wishlist') {
    super(message);
    this.name = 'DuplicateItemException';
  }
}

export class InvalidShareTokenException extends Error implements WishlistError {
  code = WishlistErrorCode.INVALID_SHARE_TOKEN;
  
  constructor(message: string = 'Invalid share token') {
    super(message);
    this.name = 'InvalidShareTokenException';
  }
}

export class ShareExpiredException extends Error implements WishlistError {
  code = WishlistErrorCode.SHARE_EXPIRED;
  
  constructor(message: string = 'Share link has expired') {
    super(message);
    this.name = 'ShareExpiredException';
  }
}

export class PermissionDeniedException extends Error implements WishlistError {
  code = WishlistErrorCode.PERMISSION_DENIED;
  
  constructor(message: string = 'Permission denied') {
    super(message);
    this.name = 'PermissionDeniedException';
  }
}

export class WishlistLimitExceededException extends Error implements WishlistError {
  code = WishlistErrorCode.WISHLIST_LIMIT_EXCEEDED;
  
  constructor(message: string = 'Wishlist limit exceeded') {
    super(message);
    this.name = 'WishlistLimitExceededException';
  }
}

export class ItemLimitExceededException extends Error implements WishlistError {
  code = WishlistErrorCode.ITEM_LIMIT_EXCEEDED;
  
  constructor(message: string = 'Item limit exceeded') {
    super(message);
    this.name = 'ItemLimitExceededException';
  }
}

export class InvalidPriceException extends Error implements WishlistError {
  code = WishlistErrorCode.INVALID_PRICE;
  
  constructor(message: string = 'Invalid price') {
    super(message);
    this.name = 'InvalidPriceException';
  }
}

export class CollectionNotFoundException extends Error implements WishlistError {
  code = WishlistErrorCode.COLLECTION_NOT_FOUND;
  
  constructor(message: string = 'Collection not found') {
    super(message);
    this.name = 'CollectionNotFoundException';
  }
}

export function isWishlistError(error: any): error is WishlistError {
  return error && error.code && Object.values(WishlistErrorCode).includes(error.code);
}

export function getErrorMessage(error: any): string {
  if (isWishlistError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

export function handleWishlistError(error: any): never {
  if (isWishlistError(error)) {
    throw error;
  }
  
  // Convert generic errors to wishlist errors
  if (error.message?.includes('not found')) {
    throw new WishlistNotFoundException();
  }
  
  if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
    throw new PermissionDeniedException();
  }
  
  if (error.message?.includes('duplicate') || error.message?.includes('already exists')) {
    throw new DuplicateItemException();
  }
  
  // Re-throw original error if we can't classify it
  throw error;
}