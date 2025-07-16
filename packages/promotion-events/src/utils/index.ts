/**
 * Promotion Events Utility Functions
 * Helper functions for promotions, events, and discount calculations
 */

import { format, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';
import { 
  PromotionCampaign, 
  Event, 
  Banner, 
  DiscountType, 
  CampaignStatus, 
  EventStatus,
  BannerPosition 
} from '../types';

// Date and time utilities
export const formatDate = (date: Date, formatString: string = 'yyyy-MM-dd'): string => {
  return format(date, formatString);
};

export const formatDateTime = (date: Date): string => {
  return format(date, 'yyyy-MM-dd HH:mm:ss');
};

export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInDays = differenceInDays(date, now);
  const diffInHours = differenceInHours(date, now);
  const diffInMinutes = differenceInMinutes(date, now);

  if (Math.abs(diffInDays) >= 1) {
    return `${Math.abs(diffInDays)} day${Math.abs(diffInDays) > 1 ? 's' : ''} ${diffInDays > 0 ? 'from now' : 'ago'}`;
  } else if (Math.abs(diffInHours) >= 1) {
    return `${Math.abs(diffInHours)} hour${Math.abs(diffInHours) > 1 ? 's' : ''} ${diffInHours > 0 ? 'from now' : 'ago'}`;
  } else if (Math.abs(diffInMinutes) >= 1) {
    return `${Math.abs(diffInMinutes)} minute${Math.abs(diffInMinutes) > 1 ? 's' : ''} ${diffInMinutes > 0 ? 'from now' : 'ago'}`;
  } else {
    return 'Just now';
  }
};

export const getTimeRemaining = (targetDate: Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} => {
  const now = new Date();
  const total = targetDate.getTime() - now.getTime();

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((total % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, total };
};

// Currency formatting utilities
export const formatCurrency = (amount: number, currency: string = 'KRW', locale: string = 'ko-KR'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: currency === 'KRW' ? 0 : 2
  }).format(amount);
};

export const formatNumber = (number: number, locale: string = 'ko-KR'): string => {
  return new Intl.NumberFormat(locale).format(number);
};

export const formatPercentage = (decimal: number, minimumFractionDigits: number = 0): string => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits: 2
  }).format(decimal);
};

// Promotion utilities
export const getPromotionStatus = (promotion: PromotionCampaign): {
  status: string;
  isActive: boolean;
  canActivate: boolean;
  canDeactivate: boolean;
  timeUntilStart: number;
  timeUntilEnd: number;
} => {
  const now = new Date();
  const timeUntilStart = promotion.startDate.getTime() - now.getTime();
  const timeUntilEnd = promotion.endDate.getTime() - now.getTime();

  const isActive = promotion.status === CampaignStatus.ACTIVE && 
                   timeUntilStart <= 0 && 
                   timeUntilEnd > 0;

  const canActivate = promotion.status === CampaignStatus.DRAFT || 
                      promotion.status === CampaignStatus.PAUSED;

  const canDeactivate = promotion.status === CampaignStatus.ACTIVE || 
                        promotion.status === CampaignStatus.SCHEDULED;

  let status = promotion.status;
  if (promotion.status === CampaignStatus.ACTIVE && timeUntilEnd <= 0) {
    status = 'expired';
  } else if (promotion.status === CampaignStatus.SCHEDULED && timeUntilStart <= 0) {
    status = 'active';
  }

  return {
    status,
    isActive,
    canActivate,
    canDeactivate,
    timeUntilStart,
    timeUntilEnd
  };
};

export const getDiscountDescription = (promotion: PromotionCampaign): string => {
  const config = promotion.discountConfig;

  switch (config.type) {
    case DiscountType.PERCENTAGE:
      const percentageConfig = config as any;
      return `${percentageConfig.percentage}% off${percentageConfig.maxAmount ? ` (max ${formatCurrency(percentageConfig.maxAmount)})` : ''}`;
    
    case DiscountType.FIXED:
      const fixedConfig = config as any;
      return `${formatCurrency(fixedConfig.amount)} off`;
    
    case DiscountType.BUY_X_GET_Y:
      const bogoConfig = config as any;
      return `Buy ${bogoConfig.buyQuantity}, get ${bogoConfig.getQuantity} ${bogoConfig.discountType || 'free'}`;
    
    case DiscountType.FREE_SHIPPING:
      const shippingConfig = config as any;
      return `Free shipping${shippingConfig.minimumOrderAmount ? ` on orders over ${formatCurrency(shippingConfig.minimumOrderAmount)}` : ''}`;
    
    default:
      return 'Special discount';
  }
};

export const calculatePromotionValue = (promotion: PromotionCampaign, orderAmount: number): number => {
  const config = promotion.discountConfig;

  switch (config.type) {
    case DiscountType.PERCENTAGE:
      const percentageConfig = config as any;
      const percentageDiscount = (orderAmount * percentageConfig.percentage) / 100;
      return percentageConfig.maxAmount ? Math.min(percentageDiscount, percentageConfig.maxAmount) : percentageDiscount;
    
    case DiscountType.FIXED:
      const fixedConfig = config as any;
      return Math.min(fixedConfig.amount, orderAmount);
    
    case DiscountType.FREE_SHIPPING:
      // Free shipping value would depend on actual shipping cost
      return 0; // Placeholder
    
    default:
      return 0;
  }
};

export const isPromotionEligible = (
  promotion: PromotionCampaign,
  orderAmount: number,
  userType?: string
): boolean => {
  const now = new Date();
  
  // Check if promotion is active and within date range
  if (promotion.status !== CampaignStatus.ACTIVE || 
      promotion.startDate > now || 
      promotion.endDate < now) {
    return false;
  }

  // Check minimum order amount
  if (promotion.usageConditions.minimumOrderAmount && 
      orderAmount < promotion.usageConditions.minimumOrderAmount) {
    return false;
  }

  // Check maximum order amount
  if (promotion.usageConditions.maximumOrderAmount && 
      orderAmount > promotion.usageConditions.maximumOrderAmount) {
    return false;
  }

  // Check usage limit
  if (promotion.usageConditions.usageLimit && 
      promotion.usage.totalUsed >= promotion.usageConditions.usageLimit) {
    return false;
  }

  return true;
};

// Event utilities
export const getEventStatus = (event: Event): {
  status: string;
  isLive: boolean;
  isUpcoming: boolean;
  hasEnded: boolean;
  timeUntilStart: number;
  timeUntilEnd: number;
} => {
  const now = new Date();
  const timeUntilStart = event.startDate.getTime() - now.getTime();
  const timeUntilEnd = event.endDate.getTime() - now.getTime();

  const isUpcoming = timeUntilStart > 0;
  const isLive = timeUntilStart <= 0 && timeUntilEnd > 0;
  const hasEnded = timeUntilEnd <= 0;

  let status = event.status;
  if (isLive && event.status === EventStatus.UPCOMING) {
    status = EventStatus.LIVE;
  } else if (hasEnded && event.status !== EventStatus.CANCELLED) {
    status = EventStatus.ENDED;
  }

  return {
    status,
    isLive,
    isUpcoming,
    hasEnded,
    timeUntilStart,
    timeUntilEnd
  };
};

export const formatEventDuration = (startDate: Date, endDate: Date): string => {
  const durationMs = endDate.getTime() - startDate.getTime();
  const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ${hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''}` : ''}`.trim();
  } else if (hours > 0) {
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''}` : ''}`.trim();
  } else {
    const minutes = Math.floor(durationMs / (1000 * 60));
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
};

// Banner utilities
export const getBannerDisplayPriority = (banner: Banner): number => {
  let priority = banner.priority;

  // Boost priority for certain positions
  switch (banner.position) {
    case BannerPosition.POPUP:
      priority += 1000;
      break;
    case BannerPosition.HERO:
      priority += 500;
      break;
    case BannerPosition.HEADER:
      priority += 300;
      break;
    case BannerPosition.TOP:
      priority += 200;
      break;
    default:
      break;
  }

  // Reduce priority for inactive banners
  if (!banner.isActive) {
    priority -= 10000;
  }

  return priority;
};

export const shouldShowBanner = (
  banner: Banner,
  currentPage: string,
  categoryId?: string,
  userImpressions: number = 0
): boolean => {
  if (!banner.isActive) return false;

  const now = new Date();
  
  // Check date range
  if (banner.startDate && banner.startDate > now) return false;
  if (banner.endDate && banner.endDate < now) return false;

  // Check page restrictions
  if (banner.displayRules.showOnPages && 
      !banner.displayRules.showOnPages.includes(currentPage)) {
    return false;
  }

  // Check category restrictions
  if (categoryId && 
      banner.displayRules.showOnCategories && 
      !banner.displayRules.showOnCategories.includes(categoryId)) {
    return false;
  }

  // Check impression limits
  if (banner.displayRules.maxImpressionsPerUser && 
      userImpressions >= banner.displayRules.maxImpressionsPerUser) {
    return false;
  }

  return true;
};

// Validation utilities
export const validateEmailFormat = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone: string, country: string = 'KR'): boolean => {
  if (country === 'KR') {
    const koreanPhoneRegex = /^(010|011|016|017|018|019)-?\d{3,4}-?\d{4}$/;
    return koreanPhoneRegex.test(phone.replace(/\s/g, ''));
  }
  // Add other country validations as needed
  return false;
};

export const validateCouponCode = (code: string): boolean => {
  // Basic coupon code validation
  if (!code || code.length < 3 || code.length > 20) return false;
  
  // Allow only alphanumeric characters and basic symbols
  const validCodeRegex = /^[A-Z0-9-_]+$/;
  return validCodeRegex.test(code.toUpperCase());
};

// Sorting and filtering utilities
export const sortPromotions = (
  promotions: PromotionCampaign[],
  sortBy: 'priority' | 'startDate' | 'endDate' | 'usage' | 'savings',
  order: 'asc' | 'desc' = 'desc'
): PromotionCampaign[] => {
  return [...promotions].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'priority':
        comparison = a.priority - b.priority;
        break;
      case 'startDate':
        comparison = a.startDate.getTime() - b.startDate.getTime();
        break;
      case 'endDate':
        comparison = a.endDate.getTime() - b.endDate.getTime();
        break;
      case 'usage':
        comparison = a.usage.totalUsed - b.usage.totalUsed;
        break;
      case 'savings':
        comparison = a.usage.totalSavings - b.usage.totalSavings;
        break;
      default:
        comparison = 0;
    }

    return order === 'asc' ? comparison : -comparison;
  });
};

export const filterPromotions = (
  promotions: PromotionCampaign[],
  filters: {
    status?: CampaignStatus[];
    discountType?: DiscountType[];
    tags?: string[];
    startDate?: Date;
    endDate?: Date;
    searchTerm?: string;
  }
): PromotionCampaign[] => {
  return promotions.filter(promotion => {
    // Status filter
    if (filters.status && !filters.status.includes(promotion.status)) {
      return false;
    }

    // Discount type filter
    if (filters.discountType && !filters.discountType.includes(promotion.discountConfig.type)) {
      return false;
    }

    // Tags filter
    if (filters.tags && !filters.tags.some(tag => promotion.tags.includes(tag))) {
      return false;
    }

    // Date range filter
    if (filters.startDate && promotion.startDate < filters.startDate) {
      return false;
    }
    if (filters.endDate && promotion.endDate > filters.endDate) {
      return false;
    }

    // Search term filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      const searchableText = [
        promotion.name,
        promotion.description || '',
        ...promotion.tags
      ].join(' ').toLowerCase();
      
      if (!searchableText.includes(searchTerm)) {
        return false;
      }
    }

    return true;
  });
};

// Analytics utilities
export const calculateConversionRate = (conversions: number, clicks: number): number => {
  return clicks > 0 ? (conversions / clicks) * 100 : 0;
};

export const calculateClickThroughRate = (clicks: number, impressions: number): number => {
  return impressions > 0 ? (clicks / impressions) * 100 : 0;
};

export const calculateROI = (revenue: number, cost: number): number => {
  return cost > 0 ? ((revenue - cost) / cost) * 100 : 0;
};

export const formatAnalyticsNumber = (value: number, type: 'currency' | 'percentage' | 'number'): string => {
  switch (type) {
    case 'currency':
      return formatCurrency(value);
    case 'percentage':
      return formatPercentage(value / 100);
    case 'number':
      return formatNumber(value);
    default:
      return value.toString();
  }
};

// URL and slug utilities
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

export const generatePromotionUrl = (promotion: PromotionCampaign, baseUrl: string = ''): string => {
  const slug = generateSlug(promotion.name);
  return `${baseUrl}/promotions/${promotion.id}/${slug}`;
};

export const generateEventUrl = (event: Event, baseUrl: string = ''): string => {
  const slug = generateSlug(event.name);
  return `${baseUrl}/events/${event.id}/${slug}`;
};

// Color utilities for banners and styling
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export const getContrastColor = (backgroundColor: string): string => {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return '#000000';
  
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 125 ? '#000000' : '#ffffff';
};

// Export all utilities as a default object
export default {
  // Date utilities
  formatDate,
  formatDateTime,
  formatRelativeTime,
  getTimeRemaining,
  
  // Currency utilities
  formatCurrency,
  formatNumber,
  formatPercentage,
  
  // Promotion utilities
  getPromotionStatus,
  getDiscountDescription,
  calculatePromotionValue,
  isPromotionEligible,
  
  // Event utilities
  getEventStatus,
  formatEventDuration,
  
  // Banner utilities
  getBannerDisplayPriority,
  shouldShowBanner,
  
  // Validation utilities
  validateEmailFormat,
  validatePhoneNumber,
  validateCouponCode,
  
  // Sorting and filtering
  sortPromotions,
  filterPromotions,
  
  // Analytics utilities
  calculateConversionRate,
  calculateClickThroughRate,
  calculateROI,
  formatAnalyticsNumber,
  
  // URL utilities
  generateSlug,
  generatePromotionUrl,
  generateEventUrl,
  
  // Color utilities
  hexToRgb,
  getContrastColor
};