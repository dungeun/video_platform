import { EventEmitter } from '@company/core';
import { WishlistEvent } from '../types';

export class WishlistEventEmitter extends EventEmitter {
  private static instance: WishlistEventEmitter;

  private constructor() {
    super();
  }

  static getInstance(): WishlistEventEmitter {
    if (!WishlistEventEmitter.instance) {
      WishlistEventEmitter.instance = new WishlistEventEmitter();
    }
    return WishlistEventEmitter.instance;
  }

  emitWishlistCreated(wishlistId: string, userId: string, data?: any) {
    const event: WishlistEvent = {
      type: 'created',
      wishlistId,
      userId,
      timestamp: new Date(),
      data
    };
    this.emit('wishlist:created', event);
  }

  emitWishlistUpdated(wishlistId: string, userId: string, data?: any) {
    const event: WishlistEvent = {
      type: 'updated',
      wishlistId,
      userId,
      timestamp: new Date(),
      data
    };
    this.emit('wishlist:updated', event);
  }

  emitWishlistDeleted(wishlistId: string, userId: string, data?: any) {
    const event: WishlistEvent = {
      type: 'deleted',
      wishlistId,
      userId,
      timestamp: new Date(),
      data
    };
    this.emit('wishlist:deleted', event);
  }

  emitWishlistShared(wishlistId: string, userId: string, data?: any) {
    const event: WishlistEvent = {
      type: 'shared',
      wishlistId,
      userId,
      timestamp: new Date(),
      data
    };
    this.emit('wishlist:shared', event);
  }

  emitItemAdded(wishlistId: string, userId: string, data?: any) {
    const event: WishlistEvent = {
      type: 'item_added',
      wishlistId,
      userId,
      timestamp: new Date(),
      data
    };
    this.emit('wishlist:item_added', event);
  }

  emitItemRemoved(wishlistId: string, userId: string, data?: any) {
    const event: WishlistEvent = {
      type: 'item_removed',
      wishlistId,
      userId,
      timestamp: new Date(),
      data
    };
    this.emit('wishlist:item_removed', event);
  }

  emitItemPurchased(wishlistId: string, userId: string, data?: any) {
    const event: WishlistEvent = {
      type: 'item_purchased',
      wishlistId,
      userId,
      timestamp: new Date(),
      data
    };
    this.emit('wishlist:item_purchased', event);
  }

  onWishlistEvent(
    eventType: WishlistEvent['type'],
    callback: (event: WishlistEvent) => void
  ) {
    this.on(`wishlist:${eventType}`, callback);
  }

  offWishlistEvent(
    eventType: WishlistEvent['type'],
    callback: (event: WishlistEvent) => void
  ) {
    this.off(`wishlist:${eventType}`, callback);
  }
}

export const wishlistEvents = WishlistEventEmitter.getInstance();