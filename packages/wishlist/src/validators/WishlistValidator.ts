import { z } from 'zod';

// Wishlist schemas
export const CreateWishlistSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
  isDefault: z.boolean().default(false),
  tags: z.array(z.string().max(50)).max(20).optional(),
  settings: z.object({
    notifyOnPriceChange: z.boolean().default(true),
    notifyOnStock: z.boolean().default(true),
    priceDropThreshold: z.number().min(0).max(100).optional(),
    autoRemoveOutOfStock: z.boolean().default(false),
    allowComments: z.boolean().default(true),
    requireApprovalForSharing: z.boolean().default(false)
  }).optional()
});

export const UpdateWishlistSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  coverImage: z.string().url().optional(),
  settings: z.object({
    notifyOnPriceChange: z.boolean().optional(),
    notifyOnStock: z.boolean().optional(),
    priceDropThreshold: z.number().min(0).max(100).optional(),
    autoRemoveOutOfStock: z.boolean().optional(),
    allowComments: z.boolean().optional(),
    requireApprovalForSharing: z.boolean().optional()
  }).optional()
});

// Item schemas
export const AddItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1).max(200),
  productImage: z.string().url().optional(),
  productUrl: z.string().url().optional(),
  quantity: z.number().int().min(1).max(999).default(1),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  notes: z.string().max(1000).optional(),
  targetPrice: z.number().positive().optional(),
  currentPrice: z.number().positive(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  customFields: z.record(z.any()).optional()
});

export const UpdateItemSchema = z.object({
  quantity: z.number().int().min(1).max(999).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  notes: z.string().max(1000).optional(),
  targetPrice: z.number().positive().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  customFields: z.record(z.any()).optional()
});

// Share schemas
export const ShareWishlistSchema = z.object({
  wishlistId: z.string().min(1),
  sharedWithEmail: z.string().email().optional(),
  sharedWithUserId: z.string().optional(),
  shareType: z.enum(['view', 'edit', 'collaborate']),
  message: z.string().max(500).optional(),
  expiresAt: z.date().optional(),
  permissions: z.object({
    canView: z.boolean().optional(),
    canAddItems: z.boolean().optional(),
    canRemoveItems: z.boolean().optional(),
    canEditItems: z.boolean().optional(),
    canInviteOthers: z.boolean().optional(),
    canDelete: z.boolean().optional()
  }).optional()
}).refine(
  data => data.sharedWithEmail || data.sharedWithUserId,
  { message: 'Either sharedWithEmail or sharedWithUserId must be provided' }
);

// Collection schemas
export const CreateCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['manual', 'smart']),
  rules: z.array(z.object({
    field: z.enum(['tag', 'price', 'category', 'brand', 'date_added', 'priority']),
    operator: z.enum(['equals', 'contains', 'greater_than', 'less_than', 'between', 'in', 'not_in']),
    value: z.any(),
    combineWith: z.enum(['AND', 'OR']).optional()
  })).optional(),
  wishlistIds: z.array(z.string()).optional(),
  coverImage: z.string().url().optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  isPublic: z.boolean().default(false)
}).refine(
  data => {
    if (data.type === 'smart') return !!data.rules && data.rules.length > 0;
    return true;
  },
  { message: 'Smart collections must have at least one rule' }
);

export const UpdateCollectionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  rules: z.array(z.object({
    field: z.enum(['tag', 'price', 'category', 'brand', 'date_added', 'priority']),
    operator: z.enum(['equals', 'contains', 'greater_than', 'less_than', 'between', 'in', 'not_in']),
    value: z.any(),
    combineWith: z.enum(['AND', 'OR']).optional()
  })).optional(),
  coverImage: z.string().url().optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  isPublic: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional()
});

// Query schemas
export const WishlistFiltersSchema = z.object({
  userId: z.string().optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  hasItems: z.boolean().optional()
});

export const ItemFiltersSchema = z.object({
  wishlistId: z.string().optional(),
  productId: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  isPurchased: z.boolean().optional(),
  priceRange: z.object({
    min: z.number().positive().optional(),
    max: z.number().positive().optional()
  }).optional(),
  tags: z.array(z.string()).optional()
});

export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20)
});

// Type exports
export type CreateWishlistInput = z.infer<typeof CreateWishlistSchema>;
export type UpdateWishlistInput = z.infer<typeof UpdateWishlistSchema>;
export type AddItemInput = z.infer<typeof AddItemSchema>;
export type UpdateItemInput = z.infer<typeof UpdateItemSchema>;
export type ShareWishlistInput = z.infer<typeof ShareWishlistSchema>;
export type CreateCollectionInput = z.infer<typeof CreateCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof UpdateCollectionSchema>;
export type WishlistFiltersInput = z.infer<typeof WishlistFiltersSchema>;
export type ItemFiltersInput = z.infer<typeof ItemFiltersSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;