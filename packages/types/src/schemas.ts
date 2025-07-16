/**
 * @repo/types - Zod 검증 스키마
 */

import { z } from 'zod';

// ===== 기본 스키마 =====
export const IdSchema = z.string().min(1);
export const UuidSchema = z.string().uuid();
export const EmailSchema = z.string().email();
export const UrlSchema = z.string().url();
export const TimestampSchema = z.number().int().positive();
export const DateStringSchema = z.string().datetime();

// ===== 공통 스키마 =====
export const MoneySchema = z.object({
  amount: z.number().min(0),
  currency: z.enum(['KRW', 'USD', 'EUR', 'JPY', 'CNY'])
});

export const AddressSchema = z.object({
  country: z.string().min(1),
  state: z.string().optional(),
  city: z.string().min(1),
  district: z.string().optional(),
  street: z.string().min(1),
  detail: z.string().optional(),
  postalCode: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional()
});

export const ContactInfoSchema = z.object({
  phone: z.string().optional(),
  mobile: z.string().optional(),
  email: EmailSchema.optional(),
  fax: z.string().optional(),
  website: UrlSchema.optional()
});

export const FileInfoSchema = z.object({
  id: IdSchema,
  name: z.string().min(1),
  originalName: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
  url: UrlSchema,
  thumbnailUrl: UrlSchema.optional(),
  uploadedAt: z.date(),
  uploadedBy: IdSchema.optional(),
  metadata: z.object({
    width: z.number().optional(),
    height: z.number().optional(),
    duration: z.number().optional(),
    encoding: z.string().optional()
  }).optional()
});

export const EntityMetadataSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: IdSchema.optional(),
  updatedBy: IdSchema.optional(),
  version: z.number().int().min(1),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
});

// ===== 응답 스키마 =====
export const ErrorInfoSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.any().optional(),
  timestamp: z.number()
});

export const ResponseMetaSchema = z.object({
  version: z.string(),
  requestId: z.string(),
  duration: z.number(),
  pagination: z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
    hasNext: z.boolean(),
    hasPrev: z.boolean()
  }).optional()
});

export const ResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => z.object({
  success: z.boolean(),
  data: dataSchema.optional(),
  error: ErrorInfoSchema.optional(),
  meta: ResponseMetaSchema.optional()
});

export const PaginationParamsSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional()
});

// ===== 사용자 인증 스키마 =====
export const LoginCredentialsSchema = z.object({
  email: EmailSchema.optional(),
  username: z.string().min(1).optional(),
  password: z.string().min(8),
  rememberMe: z.boolean().optional(),
  deviceInfo: z.object({
    type: z.enum(['mobile', 'tablet', 'desktop', 'tv', 'watch', 'unknown']).optional(),
    os: z.string().optional(),
    osVersion: z.string().optional(),
    browser: z.string().optional(),
    browserVersion: z.string().optional(),
    isMobile: z.boolean().optional(),
    isTablet: z.boolean().optional(),
    isDesktop: z.boolean().optional()
  }).optional()
}).refine(data => data.email || data.username, {
  message: "Either email or username must be provided"
});

export const UserProfileSchema = z.object({
  phone: z.string().optional(),
  birthDate: z.date().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  nationality: z.string().optional(),
  language: z.string().min(2),
  timezone: z.string().min(1),
  address: AddressSchema.partial().optional(),
  contacts: ContactInfoSchema.optional(),
  socialLinks: z.object({
    facebook: UrlSchema.optional(),
    twitter: UrlSchema.optional(),
    linkedin: UrlSchema.optional(),
    instagram: UrlSchema.optional(),
    github: UrlSchema.optional(),
    website: UrlSchema.optional()
  }).optional(),
  occupation: z.string().optional(),
  company: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional()
});

export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']),
  language: z.string().min(2),
  timezone: z.string().min(1),
  dateFormat: z.string().min(1),
  timeFormat: z.string().min(1),
  currency: z.enum(['KRW', 'USD', 'EUR', 'JPY', 'CNY']),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    sms: z.boolean(),
    inApp: z.boolean(),
    marketing: z.boolean(),
    digest: z.enum(['realtime', 'hourly', 'daily', 'weekly', 'never'])
  }),
  privacy: z.object({
    profileVisibility: z.enum(['public', 'friends', 'private']),
    showEmail: z.boolean(),
    showPhone: z.boolean(),
    showLastSeen: z.boolean(),
    allowDirectMessages: z.boolean(),
    allowFriendRequests: z.boolean()
  }),
  accessibility: z.object({
    fontSize: z.enum(['small', 'medium', 'large', 'xlarge']),
    highContrast: z.boolean(),
    reduceMotion: z.boolean(),
    screenReader: z.boolean(),
    keyboardNavigation: z.boolean()
  })
});

export const UserSchema = z.object({
  id: IdSchema,
  email: EmailSchema,
  username: z.string().min(1).optional(),
  displayName: z.string().min(1),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatar: UrlSchema.optional(),
  bio: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending', 'deleted']),
  emailVerified: z.boolean(),
  phoneVerified: z.boolean(),
  twoFactorEnabled: z.boolean(),
  lastLoginAt: z.date().optional(),
  lastActiveAt: z.date().optional(),
  roles: z.array(z.object({
    id: IdSchema,
    name: z.string(),
    displayName: z.string(),
    description: z.string().optional(),
    level: z.number().int(),
    permissions: z.array(z.any()),
    isSystemRole: z.boolean(),
    isDefault: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date()
  })),
  permissions: z.array(z.object({
    id: IdSchema,
    name: z.string(),
    resource: z.string(),
    action: z.enum(['create', 'read', 'update', 'delete', 'list', 'execute', '*']),
    conditions: z.array(z.any()).optional(),
    description: z.string().optional()
  })),
  profile: UserProfileSchema,
  preferences: UserPreferencesSchema,
  security: z.object({
    lastPasswordChange: z.date().optional(),
    passwordExpiresAt: z.date().optional(),
    failedLoginAttempts: z.number().int().min(0),
    lockedUntil: z.date().optional(),
    ipWhitelist: z.array(z.string()).optional(),
    trustedDevices: z.array(z.any()),
    sessions: z.array(z.any()),
    auditLog: z.array(z.any())
  })
}).extend(EntityMetadataSchema.shape);

// ===== 비즈니스 스키마 =====
export const ProductInventorySchema = z.object({
  quantity: z.number().int().min(0),
  reservedQuantity: z.number().int().min(0),
  minQuantity: z.number().int().min(0),
  maxQuantity: z.number().int().min(0).optional(),
  trackQuantity: z.boolean(),
  allowBackorder: z.boolean(),
  stockStatus: z.enum(['in_stock', 'out_of_stock', 'on_backorder'])
});

export const ProductAttributeSchema = z.object({
  name: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean()]),
  type: z.enum(['text', 'number', 'boolean', 'select', 'multiselect', 'color', 'image']),
  isRequired: z.boolean(),
  isVariable: z.boolean(),
  displayOrder: z.number().int().min(0)
});

export const ProductVariantSchema = z.object({
  id: IdSchema,
  sku: z.string().min(1),
  name: z.string().min(1),
  price: MoneySchema,
  inventory: ProductInventorySchema,
  attributes: z.record(z.string()),
  image: UrlSchema.optional(),
  isDefault: z.boolean()
});

export const ProductSchema = z.object({
  id: IdSchema,
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  shortDescription: z.string().optional(),
  categoryId: IdSchema,
  brandId: IdSchema.optional(),
  supplierId: IdSchema.optional(),
  status: z.enum(['active', 'inactive', 'draft', 'archived', 'out_of_stock']),
  type: z.enum(['simple', 'variable', 'grouped', 'external', 'subscription']),
  price: MoneySchema,
  originalPrice: MoneySchema.optional(),
  costPrice: MoneySchema.optional(),
  inventory: ProductInventorySchema,
  images: z.array(FileInfoSchema),
  videos: z.array(FileInfoSchema).optional(),
  documents: z.array(FileInfoSchema).optional(),
  attributes: z.array(ProductAttributeSchema),
  variants: z.array(ProductVariantSchema).optional(),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    slug: z.string().min(1)
  }),
  weight: z.number().min(0).optional(),
  dimensions: z.object({
    length: z.number().min(0),
    width: z.number().min(0),
    height: z.number().min(0),
    unit: z.enum(['cm', 'in'])
  }).optional(),
  isDigital: z.boolean(),
  isTaxable: z.boolean(),
  isShippable: z.boolean()
}).extend(EntityMetadataSchema.shape);

export const OrderItemSchema = z.object({
  id: IdSchema,
  productId: IdSchema,
  variantId: IdSchema.optional(),
  sku: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().int().min(1),
  unitPrice: MoneySchema,
  totalPrice: MoneySchema,
  tax: MoneySchema,
  discount: MoneySchema,
  attributes: z.record(z.string()).optional(),
  image: UrlSchema.optional()
});

export const OrderSchema = z.object({
  id: IdSchema,
  orderNumber: z.string().min(1),
  customerId: IdSchema.optional(),
  guestInfo: z.object({
    email: EmailSchema,
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().optional()
  }).optional(),
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'returned']),
  items: z.array(OrderItemSchema).min(1),
  subtotal: MoneySchema,
  tax: MoneySchema,
  shipping: MoneySchema,
  discount: MoneySchema,
  total: MoneySchema,
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema,
  shippingMethod: z.object({
    id: IdSchema,
    name: z.string().min(1),
    description: z.string().optional(),
    price: MoneySchema,
    estimatedDays: z.number().int().min(0),
    trackingEnabled: z.boolean(),
    carrier: z.string().optional()
  }),
  payment: z.object({
    method: z.enum(['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash', 'crypto']),
    status: z.enum(['pending', 'authorized', 'paid', 'failed', 'cancelled', 'refunded']),
    transactionId: z.string().optional(),
    gatewayResponse: z.record(z.any()).optional(),
    paidAt: z.date().optional(),
    failedAt: z.date().optional(),
    failureReason: z.string().optional()
  }),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  source: z.enum(['web', 'mobile', 'pos', 'phone', 'email', 'api']),
  estimatedDelivery: z.date().optional(),
  deliveredAt: z.date().optional(),
  cancelledAt: z.date().optional(),
  refundedAt: z.date().optional()
}).extend(EntityMetadataSchema.shape);

// ===== UI 스키마 =====
export const FormFieldSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['text', 'email', 'password', 'number', 'tel', 'url', 'textarea', 'select', 'multiselect', 'checkbox', 'radio', 'date', 'datetime', 'time', 'file', 'image', 'color', 'range', 'hidden']),
  required: z.boolean(),
  placeholder: z.string().optional(),
  description: z.string().optional(),
  defaultValue: z.any().optional(),
  options: z.array(z.object({
    label: z.string(),
    value: z.any(),
    disabled: z.boolean().optional(),
    group: z.string().optional()
  })).optional(),
  validation: z.array(z.object({
    type: z.enum(['required', 'min', 'max', 'pattern', 'custom']),
    value: z.any().optional(),
    message: z.string()
  })).optional(),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['eq', 'ne', 'gt', 'lt', 'in', 'nin', 'empty', 'exists']),
    value: z.any(),
    action: z.enum(['show', 'hide', 'enable', 'disable', 'require'])
  })).optional(),
  styling: z.object({
    width: z.string().optional(),
    className: z.string().optional(),
    labelPosition: z.enum(['top', 'left', 'right', 'bottom']).optional(),
    hideLabel: z.boolean().optional()
  }).optional()
});

export const FormDefinitionSchema = z.object({
  id: IdSchema,
  name: z.string().min(1),
  description: z.string().optional(),
  schema: z.object({
    fields: z.array(FormFieldSchema),
    sections: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string().optional(),
      fields: z.array(z.string()),
      collapsible: z.boolean().optional(),
      defaultExpanded: z.boolean().optional()
    })).optional()
  }),
  layout: z.object({
    type: z.enum(['single', 'multi', 'wizard', 'accordion']),
    columns: z.number().int().min(1).optional(),
    gap: z.string().optional(),
    alignment: z.enum(['left', 'center', 'right']).optional()
  }),
  validation: z.object({
    mode: z.enum(['onChange', 'onBlur', 'onSubmit', 'all']),
    revalidateMode: z.enum(['onChange', 'onBlur', 'onSubmit']),
    resolver: z.string().optional(),
    schema: z.any().optional()
  }),
  submission: z.object({
    method: z.enum(['POST', 'PUT', 'PATCH']),
    action: z.string().min(1),
    redirect: z.string().optional(),
    successMessage: z.string().optional(),
    errorMessage: z.string().optional(),
    resetOnSuccess: z.boolean().optional()
  }),
  styling: z.object({
    theme: z.string(),
    className: z.string().optional(),
    customCSS: z.string().optional()
  }),
  settings: z.object({
    saveProgress: z.boolean().optional(),
    progressIndicator: z.boolean().optional(),
    confirmBeforeLeave: z.boolean().optional(),
    autoSave: z.object({
      enabled: z.boolean(),
      interval: z.number().int().min(1000)
    }).optional()
  })
});

// ===== 검색/필터링 스키마 =====
export const FilterConditionSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'like', 'regex', 'exists', 'null', 'empty']),
  value: z.any(),
  type: z.enum(['and', 'or']).optional()
});

export const SearchParamsSchema = z.object({
  query: z.string().optional(),
  filters: z.record(z.any()).optional(),
  pagination: PaginationParamsSchema.optional()
});

// ===== 검증 헬퍼 함수 =====
export const validate = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
};

export const validateAsync = async <T>(schema: z.ZodSchema<T>, data: unknown): Promise<{ success: true; data: T } | { success: false; errors: z.ZodError }> => {
  try {
    const validData = await schema.parseAsync(data);
    return { success: true, data: validData };
  } catch (error) {
    return { success: false, errors: error as z.ZodError };
  }
};

// ===== 스키마 타입 추출 =====
export type InferSchema<T extends z.ZodTypeAny> = z.infer<T>;

// ===== 자주 사용되는 조합 스키마 =====
export const CreateUserSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  version: true,
  lastLoginAt: true,
  lastActiveAt: true
}).partial({
  roles: true,
  permissions: true,
  security: true
});

export const UpdateUserSchema = UserSchema.partial().omit({
  id: true,
  createdAt: true,
  createdBy: true
});

export const CreateProductSchema = ProductSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  version: true
});

export const UpdateProductSchema = ProductSchema.partial().omit({
  id: true,
  createdAt: true,
  createdBy: true
});

export const CreateOrderSchema = OrderSchema.omit({
  id: true,
  orderNumber: true,
  createdAt: true,
  updatedAt: true,
  version: true
});