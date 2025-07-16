export interface Product {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  imageUrl: string;
  imageAlt?: string;
  badges?: ProductBadge[];
  rating?: number;
  reviewCount?: number;
  isNew?: boolean;
  isSoldOut?: boolean;
  discount?: number;
}

export interface ProductBadge {
  id: string;
  type: 'new' | 'sale' | 'best' | 'limited' | 'custom';
  text: string;
  color?: string;
  bgColor?: string;
}

export type GridLayout = 'grid' | 'list' | 'masonry';
export type GridColumns = 2 | 3 | 4 | 5 | 6;

export interface GridConfig {
  layout: GridLayout;
  columns: GridColumns;
  gap: number;
  showQuickView: boolean;
  showAddToCart: boolean;
  showWishlist: boolean;
  imageAspectRatio: string;
  enableInfiniteScroll: boolean;
  itemsPerPage: number;
}

export interface SortOption {
  value: string;
  label: string;
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterOption {
  id: string;
  type: 'range' | 'select' | 'multi-select' | 'boolean';
  field: string;
  label: string;
  options?: Array<{ value: string; label: string; count?: number }>;
  min?: number;
  max?: number;
}

export interface GridState {
  products: Product[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  page: number;
  totalPages: number;
  totalItems: number;
  sortBy: string;
  filters: Record<string, any>;
}

export interface ProductGridProps {
  products: Product[];
  config?: Partial<GridConfig>;
  loading?: boolean;
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  className?: string;
}

export interface ProductCardProps {
  product: Product;
  layout: GridLayout;
  showQuickView?: boolean;
  showAddToCart?: boolean;
  showWishlist?: boolean;
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  imageAspectRatio?: string;
  className?: string;
}

export interface GridControlsProps {
  layout: GridLayout;
  columns: GridColumns;
  sortBy: string;
  totalItems: number;
  onLayoutChange: (layout: GridLayout) => void;
  onColumnsChange: (columns: GridColumns) => void;
  onSortChange: (sortBy: string) => void;
  sortOptions: SortOption[];
  className?: string;
}

export interface InfiniteScrollProps {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  loader?: React.ReactNode;
  endMessage?: React.ReactNode;
  children: React.ReactNode;
}