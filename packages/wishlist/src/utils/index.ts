import { WishlistItem } from '../entities';

/**
 * Generate a unique share token
 */
export function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Calculate total value of wishlist items
 */
export function calculateWishlistValue(items: WishlistItem[]): number {
  return items.reduce((total, item) => {
    if (!item.isPurchased) {
      return total + (item.currentPrice * item.quantity);
    }
    return total;
  }, 0);
}

/**
 * Calculate total savings from price drops
 */
export function calculateTotalSavings(items: WishlistItem[]): number {
  return items.reduce((total, item) => {
    const savings = (item.originalPrice - item.currentPrice) * item.quantity;
    return total + Math.max(0, savings);
  }, 0);
}

/**
 * Group items by priority
 */
export function groupItemsByPriority(items: WishlistItem[]): Record<string, WishlistItem[]> {
  return items.reduce((groups, item) => {
    const priority = item.priority || 'medium';
    if (!groups[priority]) {
      groups[priority] = [];
    }
    groups[priority].push(item);
    return groups;
  }, {} as Record<string, WishlistItem[]>);
}

/**
 * Group items by tags
 */
export function groupItemsByTags(items: WishlistItem[]): Record<string, WishlistItem[]> {
  const groups: Record<string, WishlistItem[]> = {};
  
  items.forEach(item => {
    if (item.tags && item.tags.length > 0) {
      item.tags.forEach(tag => {
        if (!groups[tag]) {
          groups[tag] = [];
        }
        groups[tag].push(item);
      });
    } else {
      if (!groups['untagged']) {
        groups['untagged'] = [];
      }
      groups['untagged'].push(item);
    }
  });
  
  return groups;
}

/**
 * Sort items by various criteria
 */
export function sortItems(
  items: WishlistItem[],
  sortBy: 'price' | 'priority' | 'addedAt' | 'name' | 'savings',
  order: 'asc' | 'desc' = 'asc'
): WishlistItem[] {
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
      case 'savings':
        aValue = (a.originalPrice - a.currentPrice) * a.quantity;
        bValue = (b.originalPrice - b.currentPrice) * b.quantity;
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) return order === 'asc' ? -1 : 1;
    if (aValue > bValue) return order === 'asc' ? 1 : -1;
    return 0;
  });
  
  return sorted;
}

/**
 * Filter items by price range
 */
export function filterByPriceRange(
  items: WishlistItem[],
  minPrice?: number,
  maxPrice?: number
): WishlistItem[] {
  return items.filter(item => {
    if (minPrice !== undefined && item.currentPrice < minPrice) return false;
    if (maxPrice !== undefined && item.currentPrice > maxPrice) return false;
    return true;
  });
}

/**
 * Get items with target price reached
 */
export function getItemsWithTargetPriceReached(items: WishlistItem[]): WishlistItem[] {
  return items.filter(item => 
    item.targetPrice && item.currentPrice <= item.targetPrice
  );
}

/**
 * Get items with significant price drops
 */
export function getItemsWithPriceDrops(
  items: WishlistItem[],
  threshold: number = 10
): WishlistItem[] {
  return items.filter(item => {
    const dropPercentage = ((item.originalPrice - item.currentPrice) / item.originalPrice) * 100;
    return dropPercentage >= threshold;
  });
}

/**
 * Format share URL
 */
export function formatShareUrl(baseUrl: string, shareToken: string): string {
  return `${baseUrl}/wishlists/shared/${shareToken}`;
}

/**
 * Check if wishlist is editable by user
 */
export function canEditWishlist(
  wishlist: { userId: string },
  userId: string,
  sharePermissions?: { canEditItems: boolean }
): boolean {
  return wishlist.userId === userId || (sharePermissions?.canEditItems || false);
}

/**
 * Check if item needs price update
 */
export function needsPriceUpdate(
  lastChecked: Date,
  updateInterval: number = 3600000 // 1 hour default
): boolean {
  return Date.now() - new Date(lastChecked).getTime() > updateInterval;
}

/**
 * Generate wishlist statistics
 */
export function generateWishlistStats(items: WishlistItem[]) {
  const activeItems = items.filter(item => !item.isPurchased);
  const purchasedItems = items.filter(item => item.isPurchased);
  
  return {
    totalItems: items.length,
    activeItems: activeItems.length,
    purchasedItems: purchasedItems.length,
    totalValue: calculateWishlistValue(activeItems),
    totalSavings: calculateTotalSavings(activeItems),
    averagePrice: activeItems.length > 0 
      ? calculateWishlistValue(activeItems) / activeItems.length 
      : 0,
    itemsWithTargetPrice: items.filter(item => item.targetPrice).length,
    itemsAtTargetPrice: getItemsWithTargetPriceReached(items).length,
    priorityBreakdown: {
      high: items.filter(item => item.priority === 'high').length,
      medium: items.filter(item => item.priority === 'medium').length,
      low: items.filter(item => item.priority === 'low').length
    }
  };
}