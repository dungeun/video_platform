# Product Grid Module

상품 그리드 레이아웃 및 표시를 위한 모듈입니다.

## 주요 기능

- **다양한 레이아웃**: 그리드, 리스트, 마소니 레이아웃
- **반응형 디자인**: 화면 크기에 따른 열 수 자동 조정
- **무한 스크롤**: Intersection Observer를 활용한 효율적인 로딩
- **상품 카드**: 빠른 보기, 장바구니, 위시리스트 기능
- **정렬 및 필터**: 다양한 정렬 옵션과 필터 지원

## 설치

```bash
npm install @modules/product-grid
```

## 사용법

### 1. 기본 사용

```tsx
import { ProductGrid } from '@modules/product-grid';

function ProductListPage() {
  const products = [
    {
      id: '1',
      name: '스타일리시 티셔츠',
      price: 29900,
      imageUrl: '/images/product1.jpg',
      badges: [{ id: '1', type: 'new', text: 'NEW', bgColor: '#ef4444' }]
    },
    // ... more products
  ];

  return (
    <ProductGrid
      products={products}
      onProductClick={(product) => console.log('Product clicked:', product)}
      onAddToCart={(product) => console.log('Add to cart:', product)}
    />
  );
}
```

### 2. Hook 사용 (고급)

```tsx
import { 
  ProductGrid, 
  GridControls, 
  InfiniteScroll,
  useProductGrid 
} from '@modules/product-grid';

function AdvancedProductList() {
  const {
    products,
    loading,
    hasMore,
    layout,
    columns,
    sortBy,
    totalItems,
    setLayout,
    setColumns,
    sort,
    loadMore,
    getConfig
  } = useProductGrid({
    itemsPerPage: 20,
    enableInfiniteScroll: true,
    onFetch: async ({ page, sortBy, filters }) => {
      // API 호출
      const response = await fetch(`/api/products?page=${page}&sort=${sortBy}`);
      const data = await response.json();
      return {
        products: data.products,
        total: data.total
      };
    }
  });

  const sortOptions = [
    { value: 'latest', label: '최신순', field: 'createdAt', direction: 'desc' },
    { value: 'price-low', label: '낮은 가격순', field: 'price', direction: 'asc' },
    { value: 'price-high', label: '높은 가격순', field: 'price', direction: 'desc' }
  ];

  return (
    <div>
      <GridControls
        layout={layout}
        columns={columns}
        sortBy={sortBy}
        totalItems={totalItems}
        onLayoutChange={setLayout}
        onColumnsChange={setColumns}
        onSortChange={sort}
        sortOptions={sortOptions}
      />

      <InfiniteScroll
        hasMore={hasMore}
        loading={loading}
        onLoadMore={loadMore}
      >
        <ProductGrid
          products={products}
          config={getConfig()}
          loading={loading}
        />
      </InfiniteScroll>
    </div>
  );
}
```

### 3. 커스텀 상품 카드

```tsx
import { ProductCard } from '@modules/product-grid';

function CustomProductDisplay({ product }) {
  return (
    <ProductCard
      product={product}
      layout="grid"
      showQuickView={true}
      showAddToCart={true}
      showWishlist={true}
      onProductClick={(product) => navigateToProduct(product.id)}
      onAddToCart={(product) => addToCart(product)}
      imageAspectRatio="4/5"
    />
  );
}
```

### 4. 필터 및 정렬

```tsx
import { filterProducts, sortProducts } from '@modules/product-grid';

const filteredProducts = filterProducts(products, {
  priceMin: 10000,
  priceMax: 50000,
  rating: 4.0,
  inStock: true
});

const sortedProducts = sortProducts(filteredProducts, 'price-low');
```

## API Reference

### Components

#### ProductGrid
상품 그리드 메인 컴포넌트

```typescript
interface ProductGridProps {
  products: Product[];
  config?: Partial<GridConfig>;
  loading?: boolean;
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  className?: string;
}
```

#### GridControls
그리드 컨트롤 UI

```typescript
interface GridControlsProps {
  layout: GridLayout;
  columns: GridColumns;
  sortBy: string;
  totalItems: number;
  onLayoutChange: (layout: GridLayout) => void;
  onColumnsChange: (columns: GridColumns) => void;
  onSortChange: (sortBy: string) => void;
  sortOptions: SortOption[];
}
```

#### InfiniteScroll
무한 스크롤 컴포넌트

```typescript
interface InfiniteScrollProps {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  loader?: React.ReactNode;
  endMessage?: React.ReactNode;
  children: React.ReactNode;
}
```

### Hooks

#### useProductGrid
상품 그리드 상태 관리 Hook

```typescript
const {
  products,
  loading,
  error,
  hasMore,
  page,
  totalPages,
  totalItems,
  sortBy,
  filters,
  layout,
  columns,
  setLayout,
  setColumns,
  loadMore,
  sort,
  filter,
  reset,
  getConfig
} = useProductGrid(options);
```

## 타입 정의

```typescript
interface Product {
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

type GridLayout = 'grid' | 'list' | 'masonry';
type GridColumns = 2 | 3 | 4 | 5 | 6;
```

## 의존성

- `@modules/core`: 핵심 모듈 기능
- `@modules/types`: 공통 타입 정의
- `@tanstack/react-virtual`: 가상 스크롤
- `react-intersection-observer`: 무한 스크롤