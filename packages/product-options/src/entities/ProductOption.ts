import { z } from 'zod';
import type { ProductOption, OptionValue } from '../types';

export const OptionValueSchema = z.object({
  id: z.string(),
  optionId: z.string(),
  value: z.string(),
  displayValue: z.string(),
  priceModifier: z.number().default(0),
  priceModifierType: z.enum(['fixed', 'percentage']).default('fixed'),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  position: z.number().default(0),
  isDefault: z.boolean().default(false),
  metadata: z.record(z.any()).optional()
});

export const ProductOptionSchema = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string(),
  displayName: z.string(),
  type: z.enum(['select', 'radio', 'checkbox', 'color', 'size', 'custom']),
  required: z.boolean().default(false),
  position: z.number().default(0),
  values: z.array(OptionValueSchema),
  createdAt: z.date(),
  updatedAt: z.date()
});

export class ProductOptionEntity implements ProductOption {
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

  constructor(data: ProductOption) {
    const validated = ProductOptionSchema.parse(data);
    Object.assign(this, validated);
  }

  addValue(value: Omit<OptionValue, 'id' | 'optionId'>): OptionValue {
    const newValue: OptionValue = {
      ...value,
      id: this.generateValueId(),
      optionId: this.id,
      position: value.position ?? this.values.length
    };
    
    this.values.push(newValue);
    this.values.sort((a, b) => a.position - b.position);
    this.updatedAt = new Date();
    
    return newValue;
  }

  removeValue(valueId: string): boolean {
    const index = this.values.findIndex(v => v.id === valueId);
    if (index === -1) return false;
    
    this.values.splice(index, 1);
    this.reorderValues();
    this.updatedAt = new Date();
    
    return true;
  }

  updateValue(valueId: string, updates: Partial<OptionValue>): OptionValue | null {
    const value = this.values.find(v => v.id === valueId);
    if (!value) return null;
    
    Object.assign(value, updates);
    if (updates.position !== undefined) {
      this.reorderValues();
    }
    this.updatedAt = new Date();
    
    return value;
  }

  reorderValues(): void {
    this.values.sort((a, b) => a.position - b.position);
    this.values.forEach((value, index) => {
      value.position = index;
    });
  }

  getDefaultValue(): OptionValue | undefined {
    return this.values.find(v => v.isDefault);
  }

  setDefaultValue(valueId: string): boolean {
    const value = this.values.find(v => v.id === valueId);
    if (!value) return false;
    
    this.values.forEach(v => {
      v.isDefault = v.id === valueId;
    });
    this.updatedAt = new Date();
    
    return true;
  }

  private generateValueId(): string {
    return `${this.id}_value_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON(): ProductOption {
    return {
      id: this.id,
      productId: this.productId,
      name: this.name,
      displayName: this.displayName,
      type: this.type,
      required: this.required,
      position: this.position,
      values: this.values,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}