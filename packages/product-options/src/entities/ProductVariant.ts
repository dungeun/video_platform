import { z } from 'zod';
import type { ProductVariant, OptionCombination } from '../types';

export const OptionCombinationSchema = z.object({
  optionId: z.string(),
  optionName: z.string(),
  valueId: z.string(),
  value: z.string()
});

export const ProductVariantSchema = z.object({
  id: z.string(),
  productId: z.string(),
  sku: z.string(),
  barcode: z.string().optional(),
  optionCombination: z.array(OptionCombinationSchema),
  price: z.number().min(0),
  compareAtPrice: z.number().min(0).optional(),
  cost: z.number().min(0).optional(),
  stock: z.number().min(0).default(0),
  weight: z.number().min(0).optional(),
  dimensions: z.object({
    length: z.number().min(0),
    width: z.number().min(0),
    height: z.number().min(0)
  }).optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date()
});

export class ProductVariantEntity implements ProductVariant {
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

  constructor(data: ProductVariant) {
    const validated = ProductVariantSchema.parse(data);
    Object.assign(this, validated);
  }

  updatePrice(price: number, compareAtPrice?: number): void {
    this.price = Math.max(0, price);
    if (compareAtPrice !== undefined) {
      this.compareAtPrice = Math.max(0, compareAtPrice);
    }
    this.updatedAt = new Date();
  }

  updateStock(quantity: number): void {
    this.stock = Math.max(0, quantity);
    this.updatedAt = new Date();
  }

  adjustStock(adjustment: number): number {
    const newStock = Math.max(0, this.stock + adjustment);
    const actualAdjustment = newStock - this.stock;
    this.stock = newStock;
    this.updatedAt = new Date();
    return actualAdjustment;
  }

  hasStock(): boolean {
    return this.stock > 0;
  }

  getDiscountPercentage(): number {
    if (!this.compareAtPrice || this.compareAtPrice <= this.price) {
      return 0;
    }
    return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
  }

  getProfit(): number | null {
    if (this.cost === undefined) return null;
    return this.price - this.cost;
  }

  getProfitMargin(): number | null {
    if (this.cost === undefined || this.price === 0) return null;
    return ((this.price - this.cost) / this.price) * 100;
  }

  getOptionValues(): Record<string, string> {
    return this.optionCombination.reduce((acc, combo) => {
      acc[combo.optionName] = combo.value;
      return acc;
    }, {} as Record<string, string>);
  }

  matchesOptions(options: Record<string, string>): boolean {
    const variantOptions = this.getOptionValues();
    return Object.entries(options).every(
      ([key, value]) => variantOptions[key] === value
    );
  }

  getVariantTitle(): string {
    return this.optionCombination
      .map(combo => combo.value)
      .join(' / ');
  }

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  toJSON(): ProductVariant {
    return {
      id: this.id,
      productId: this.productId,
      sku: this.sku,
      barcode: this.barcode,
      optionCombination: this.optionCombination,
      price: this.price,
      compareAtPrice: this.compareAtPrice,
      cost: this.cost,
      stock: this.stock,
      weight: this.weight,
      dimensions: this.dimensions,
      imageUrl: this.imageUrl,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}