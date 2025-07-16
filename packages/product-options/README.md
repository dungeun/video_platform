# Product Options Module

상품 옵션 및 변형(Variant) 관리를 위한 모듈입니다.

## 주요 기능

- **상품 옵션 관리**: 색상, 사이즈, 재질 등 다양한 옵션 타입 지원
- **변형(Variant) 관리**: 옵션 조합별 SKU, 가격, 재고 관리
- **동적 가격 책정**: 옵션별 가격 조정, 대량 구매 할인, 프로모션 규칙
- **재고 연동**: 옵션 조합별 실시간 재고 관리
- **UI 컴포넌트**: 옵션 선택기, 가격 표시, 장바구니 추가 폼

## 설치

```bash
npm install @modules/product-options
```

## 사용법

### 1. 옵션 생성

```typescript
import { OptionService } from '@modules/product-options';

const optionService = new OptionService();

// 색상 옵션 생성
const colorOption = await optionService.createOption('product123', {
  name: 'color',
  displayName: '색상',
  type: 'color',
  required: true,
  position: 0,
  values: [
    {
      value: 'black',
      displayValue: '블랙',
      priceModifier: 0,
      priceModifierType: 'fixed',
      metadata: { colorCode: '#000000' }
    },
    {
      value: 'white',
      displayValue: '화이트',
      priceModifier: 0,
      priceModifierType: 'fixed',
      metadata: { colorCode: '#FFFFFF' }
    }
  ]
});
```

### 2. 변형(Variant) 생성

```typescript
import { VariantService } from '@modules/product-options';

const variantService = new VariantService();

// 변형 생성
const variant = await variantService.createVariant('product123', {
  sku: 'PROD123-BLK-L',
  optionCombination: [
    {
      optionId: 'opt_color',
      optionName: 'color',
      valueId: 'val_black',
      value: 'black'
    },
    {
      optionId: 'opt_size',
      optionName: 'size',
      valueId: 'val_large',
      value: 'large'
    }
  ],
  price: 50000,
  compareAtPrice: 60000,
  stock: 100,
  isActive: true
});
```

### 3. React 컴포넌트 사용

```tsx
import { ProductOptionsForm } from '@modules/product-options';

function ProductPage({ productId }) {
  const handleAddToCart = (variantId: string, quantity: number) => {
    // 장바구니에 추가하는 로직
    console.log(`Adding ${quantity} of variant ${variantId} to cart`);
  };

  return (
    <div>
      <h1>상품명</h1>
      <ProductOptionsForm
        productId={productId}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
```

### 4. Hook 사용

```tsx
import { useProductOptions } from '@modules/product-options';

function CustomProductOptions({ productId }) {
  const {
    options,
    selectedOptions,
    selectedVariant,
    selectOption,
    getPrice,
    getStock
  } = useProductOptions(productId);

  return (
    <div>
      {options.map(option => (
        <div key={option.id}>
          <h3>{option.displayName}</h3>
          {/* 커스텀 옵션 선택 UI */}
        </div>
      ))}
      
      <p>가격: {getPrice().toLocaleString()}원</p>
      <p>재고: {getStock()}개</p>
    </div>
  );
}
```

### 5. 가격 규칙 설정

```typescript
import { PricingService } from '@modules/product-options';

const pricingService = new PricingService();

// 대량 구매 할인 규칙
await pricingService.createPriceRule({
  productId: 'product123',
  type: 'bulk',
  conditions: [
    {
      field: 'quantity',
      operator: 'gte',
      value: 10
    }
  ],
  priceModifier: 10,
  modifierType: 'percentage',
  priority: 1,
  isActive: true
});

// 가격 계산
const { finalPrice, appliedRules } = await pricingService.calculatePrice(
  variant,
  15, // 수량
  { customerGroup: 'vip' }
);
```

## API Reference

### Services

#### OptionService
- `createOption()`: 옵션 생성
- `updateOption()`: 옵션 수정
- `deleteOption()`: 옵션 삭제
- `addOptionValue()`: 옵션 값 추가
- `removeOptionValue()`: 옵션 값 제거

#### VariantService
- `createVariant()`: 변형 생성
- `updateVariant()`: 변형 수정
- `deleteVariant()`: 변형 삭제
- `generateVariants()`: 옵션 조합으로 변형 자동 생성
- `updateVariantStock()`: 재고 업데이트

#### PricingService
- `createPriceRule()`: 가격 규칙 생성
- `calculatePrice()`: 최종 가격 계산
- `applyDynamicPricing()`: 동적 가격 적용

### Components

#### ProductOptionsForm
상품 옵션 선택 및 장바구니 추가를 위한 통합 폼

#### OptionSelector
개별 옵션 선택기 (select, radio, color, size 등)

#### VariantPriceDisplay
변형 가격 및 할인 정보 표시

## 타입 정의

```typescript
interface ProductOption {
  id: string;
  productId: string;
  name: string;
  displayName: string;
  type: 'select' | 'radio' | 'checkbox' | 'color' | 'size' | 'custom';
  required: boolean;
  position: number;
  values: OptionValue[];
}

interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  optionCombination: OptionCombination[];
  price: number;
  compareAtPrice?: number;
  stock: number;
  isActive: boolean;
}
```

## 의존성

- `@modules/core`: 핵심 모듈 기능
- `@modules/database`: 데이터베이스 연동
- `@modules/cache`: 캐싱 기능
- `@modules/types`: 공통 타입 정의