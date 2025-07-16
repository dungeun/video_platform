import { useState, useEffect, useCallback } from 'react';
import type { 
  ProductOption, 
  ProductVariant, 
  OptionCombination,
  VariantSearchParams 
} from '../types';
import { OptionService, VariantService } from '../services';

interface UseProductOptionsReturn {
  options: ProductOption[];
  variants: ProductVariant[];
  selectedOptions: Record<string, string>;
  selectedVariant: ProductVariant | null;
  availableValues: Record<string, string[]>;
  isLoading: boolean;
  error: Error | null;
  selectOption: (optionName: string, value: string) => void;
  resetOptions: () => void;
  getPrice: () => number;
  getStock: () => number;
  isSelectionComplete: () => boolean;
}

export function useProductOptions(productId: string): UseProductOptionsReturn {
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const optionService = new OptionService();
  const variantService = new VariantService();

  // Load options and variants
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [loadedOptions, loadedVariants] = await Promise.all([
          optionService.getProductOptions(productId),
          variantService.getProductVariants(productId)
        ]);

        setOptions(loadedOptions);
        setVariants(loadedVariants);

        // Set default selections
        const defaults: Record<string, string> = {};
        loadedOptions.forEach(option => {
          const defaultValue = option.values.find(v => v.isDefault);
          if (defaultValue) {
            defaults[option.name] = defaultValue.value;
          }
        });
        setSelectedOptions(defaults);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [productId]);

  // Update selected variant when options change
  useEffect(() => {
    if (options.length === 0 || variants.length === 0) return;

    const allSelected = options.every(opt => selectedOptions[opt.name]);
    if (!allSelected) {
      setSelectedVariant(null);
      return;
    }

    // Find matching variant
    const matchingVariant = variants.find(variant => {
      return variant.optionCombination.every(combo => {
        return selectedOptions[combo.optionName] === combo.value;
      });
    });

    setSelectedVariant(matchingVariant || null);
  }, [selectedOptions, options, variants]);

  // Calculate available values based on current selection
  const availableValues = useCallback((): Record<string, string[]> => {
    const available: Record<string, string[]> = {};

    options.forEach(option => {
      const availableForOption = new Set<string>();

      variants.forEach(variant => {
        if (!variant.isActive || variant.stock === 0) return;

        // Check if variant matches current selections (except this option)
        const matchesOtherSelections = variant.optionCombination.every(combo => {
          if (combo.optionName === option.name) return true;
          return selectedOptions[combo.optionName] === combo.value;
        });

        if (matchesOtherSelections) {
          const variantValue = variant.optionCombination.find(
            combo => combo.optionName === option.name
          );
          if (variantValue) {
            availableForOption.add(variantValue.value);
          }
        }
      });

      available[option.name] = Array.from(availableForOption);
    });

    return available;
  }, [options, variants, selectedOptions]);

  const selectOption = useCallback((optionName: string, value: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionName]: value
    }));
  }, []);

  const resetOptions = useCallback(() => {
    const defaults: Record<string, string> = {};
    options.forEach(option => {
      const defaultValue = option.values.find(v => v.isDefault);
      if (defaultValue) {
        defaults[option.name] = defaultValue.value;
      }
    });
    setSelectedOptions(defaults);
  }, [options]);

  const getPrice = useCallback((): number => {
    if (!selectedVariant) {
      // Calculate base price with option modifiers
      let basePrice = 0;
      options.forEach(option => {
        const selectedValue = option.values.find(
          v => v.value === selectedOptions[option.name]
        );
        if (selectedValue && selectedValue.priceModifierType === 'fixed') {
          basePrice += selectedValue.priceModifier;
        }
      });
      return basePrice;
    }
    return selectedVariant.price;
  }, [selectedVariant, options, selectedOptions]);

  const getStock = useCallback((): number => {
    return selectedVariant?.stock || 0;
  }, [selectedVariant]);

  const isSelectionComplete = useCallback((): boolean => {
    return options.every(opt => {
      if (opt.required) {
        return !!selectedOptions[opt.name];
      }
      return true;
    });
  }, [options, selectedOptions]);

  return {
    options,
    variants,
    selectedOptions,
    selectedVariant,
    availableValues: availableValues(),
    isLoading,
    error,
    selectOption,
    resetOptions,
    getPrice,
    getStock,
    isSelectionComplete
  };
}