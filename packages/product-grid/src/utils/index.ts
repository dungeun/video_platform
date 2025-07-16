import type { Product, SortOption } from '../types';

export const defaultSortOptions: SortOption[] = [
  { value: 'latest', label: '최신순', field: 'createdAt', direction: 'desc' },
  { value: 'popular', label: '인기순', field: 'viewCount', direction: 'desc' },
  { value: 'price-low', label: '낮은 가격순', field: 'price', direction: 'asc' },
  { value: 'price-high', label: '높은 가격순', field: 'price', direction: 'desc' },
  { value: 'discount', label: '할인율순', field: 'discount', direction: 'desc' },
  { value: 'rating', label: '높은 평점순', field: 'rating', direction: 'desc' }
];

export function sortProducts(products: Product[], sortBy: string): Product[] {
  const sortOption = defaultSortOptions.find(opt => opt.value === sortBy);
  if (!sortOption) return products;

  return [...products].sort((a, b) => {
    const aValue = (a as any)[sortOption.field] || 0;
    const bValue = (b as any)[sortOption.field] || 0;

    if (sortOption.direction === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });
}

export function filterProducts(
  products: Product[],
  filters: Record<string, any>
): Product[] {
  return products.filter(product => {
    for (const [key, value] of Object.entries(filters)) {
      if (value === null || value === undefined || value === '') continue;

      switch (key) {
        case 'priceMin':
          if (product.price < value) return false;
          break;
        case 'priceMax':
          if (product.price > value) return false;
          break;
        case 'rating':
          if (!product.rating || product.rating < value) return false;
          break;
        case 'isNew':
          if (value && !product.isNew) return false;
          break;
        case 'hasDiscount':
          if (value && !product.discount) return false;
          break;
        case 'inStock':
          if (value && product.isSoldOut) return false;
          break;
        default:
          if ((product as any)[key] !== value) return false;
      }
    }
    return true;
  });
}

export function calculateGridColumns(containerWidth: number): number {
  if (containerWidth < 640) return 2;
  if (containerWidth < 768) return 3;
  if (containerWidth < 1024) return 4;
  if (containerWidth < 1280) return 5;
  return 6;
}

export function generateMockProducts(count: number): Product[] {
  const categories = ['상의', '하의', '신발', '가방', '액세서리'];
  const badges = [
    { id: 'new', type: 'new' as const, text: 'NEW', bgColor: '#ef4444' },
    { id: 'best', type: 'best' as const, text: 'BEST', bgColor: '#3b82f6' },
    { id: 'sale', type: 'sale' as const, text: 'SALE', bgColor: '#10b981' },
    { id: 'limited', type: 'limited' as const, text: '한정', bgColor: '#8b5cf6' }
  ];

  return Array.from({ length: count }, (_, i) => {
    const price = Math.floor(Math.random() * 100000) + 10000;
    const hasDiscount = Math.random() > 0.7;
    const discount = hasDiscount ? Math.floor(Math.random() * 50) + 10 : 0;
    const compareAtPrice = hasDiscount ? Math.floor(price / (1 - discount / 100)) : undefined;

    return {
      id: `product-${i + 1}`,
      name: `${categories[Math.floor(Math.random() * categories.length)]} 상품 ${i + 1}`,
      price,
      compareAtPrice,
      imageUrl: `https://via.placeholder.com/300x300?text=Product+${i + 1}`,
      imageAlt: `상품 ${i + 1} 이미지`,
      badges: Math.random() > 0.7 ? [badges[Math.floor(Math.random() * badges.length)]] : [],
      rating: Math.random() > 0.5 ? Number((Math.random() * 2 + 3).toFixed(1)) : undefined,
      reviewCount: Math.random() > 0.5 ? Math.floor(Math.random() * 1000) : undefined,
      isNew: Math.random() > 0.8,
      isSoldOut: Math.random() > 0.9,
      discount
    };
  });
}