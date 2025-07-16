export interface ProductOption {
  id: string;
  productId: string;
  name: string;
  displayName: string;
  type: 'select' | 'radio' | 'checkbox' | 'color' | 'size' | 'custom';
  required: boolean;
  position: number;
  values: OptionValue[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OptionValue {
  id: string;
  optionId: string;
  value: string;
  displayValue: string;
  priceModifier: number;
  priceModifierType: 'fixed' | 'percentage';
  sku?: string;
  barcode?: string;
  position: number;
  isDefault: boolean;
  metadata?: Record<string, any>;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  barcode?: string;
  optionCombination: OptionCombination[];
  price: number;
  compareAtPrice?: number;
  cost?: number;
  stock: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OptionCombination {
  optionId: string;
  optionName: string;
  valueId: string;
  value: string;
}

export interface VariantStock {
  variantId: string;
  available: number;
  reserved: number;
  incoming: number;
  outgoing: number;
  lastUpdated: Date;
}

export interface PriceRule {
  id: string;
  productId: string;
  variantId?: string;
  type: 'bulk' | 'tier' | 'customer_group' | 'date_range';
  conditions: PriceCondition[];
  priceModifier: number;
  modifierType: 'fixed' | 'percentage';
  priority: number;
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
}

export interface PriceCondition {
  field: string;
  operator: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'in';
  value: any;
}

export interface OptionGroup {
  id: string;
  name: string;
  options: ProductOption[];
  allowMultiple: boolean;
  isRequired: boolean;
}

export interface VariantMatrix {
  productId: string;
  options: ProductOption[];
  variants: ProductVariant[];
  totalCombinations: number;
  activeCombinations: number;
}

export interface BulkVariantUpdate {
  variantIds: string[];
  updates: Partial<ProductVariant>;
}

export interface OptionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface VariantSearchParams {
  productId?: string;
  sku?: string;
  barcode?: string;
  optionValues?: Record<string, string>;
  priceRange?: { min: number; max: number };
  stockRange?: { min: number; max: number };
  isActive?: boolean;
}