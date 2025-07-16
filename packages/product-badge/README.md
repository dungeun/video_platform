# Product Badge Module

상품 뱃지 시스템을 위한 모듈입니다.

## 주요 기능

- **다양한 뱃지 타입**: NEW, BEST, SALE, 한정판, 품절, 무료배송 등
- **커스텀 뱃지**: 사용자 정의 뱃지 생성
- **조건부 뱃지**: 상품 속성에 따른 자동 뱃지 표시
- **우선순위 관리**: 중요도에 따른 뱃지 순서 조정
- **다양한 스타일**: 크기, 모양, 위치, 애니메이션 옵션

## 설치

```bash
npm install @modules/product-badge
```

## 사용법

### 1. 기본 사용

```tsx
import { ProductBadges } from '@modules/product-badge';

function ProductCard({ product }) {
  const badges = [
    { id: '1', type: 'new', text: 'NEW' },
    { id: '2', type: 'sale', text: '30% OFF' }
  ];

  return (
    <div className="relative">
      <img src={product.imageUrl} alt={product.name} />
      <ProductBadges badges={badges} />
      {/* 상품 정보 */}
    </div>
  );
}
```

### 2. 커스텀 설정

```tsx
import { ProductBadges } from '@modules/product-badge';

function ProductCard({ product }) {
  const config = {
    position: 'top-right',
    size: 'md',
    shape: 'pill',
    maxBadges: 2,
    stackDirection: 'horizontal',
    gap: 8,
    animated: true
  };

  return (
    <div className="relative">
      <img src={product.imageUrl} alt={product.name} />
      <ProductBadges 
        badges={product.badges} 
        config={config}
      />
    </div>
  );
}
```

### 3. 조건부 뱃지 규칙

```tsx
import { applyBadgeRules, defaultBadgeRules } from '@modules/product-badge';

function getProductBadges(product) {
  // 기본 규칙 + 커스텀 규칙
  const customRules = [
    {
      conditions: [
        { field: 'category', operator: 'eq', value: 'exclusive' }
      ],
      badge: { type: 'exclusive', text: '단독상품' },
      priority: 50
    },
    {
      conditions: [
        { field: 'price', operator: 'gte', value: 100000 }
      ],
      badge: { type: 'custom', text: 'PREMIUM', bgColor: '#fbbf24' },
      priority: 40
    }
  ];

  const allRules = [...defaultBadgeRules, ...customRules];
  return applyBadgeRules(product, allRules);
}
```

### 4. 뱃지 관리자 UI

```tsx
import { BadgeManager } from '@modules/product-badge';

function AdminBadgeSettings() {
  const [rules, setRules] = useState([]);

  const handleSaveRule = (rule) => {
    // API 호출로 규칙 저장
    console.log('Save rule:', rule);
  };

  const handleDeleteRule = (ruleId) => {
    // API 호출로 규칙 삭제
    console.log('Delete rule:', ruleId);
  };

  const handleToggleRule = (ruleId) => {
    // API 호출로 규칙 활성/비활성
    console.log('Toggle rule:', ruleId);
  };

  return (
    <BadgeManager
      rules={rules}
      onSaveRule={handleSaveRule}
      onDeleteRule={handleDeleteRule}
      onToggleRule={handleToggleRule}
    />
  );
}
```

### 5. 개별 뱃지 컴포넌트

```tsx
import { Badge } from '@modules/product-badge';

function CustomBadgeDisplay() {
  return (
    <div className="flex gap-2">
      <Badge 
        badge={{
          id: '1',
          type: 'new',
          text: 'NEW ARRIVAL',
          icon: '✨'
        }}
        size="lg"
        shape="pill"
        animated
        onClick={() => console.log('Badge clicked')}
      />
      
      <Badge
        badge={{
          id: '2',
          type: 'custom',
          text: '한정판매',
          color: '#ffffff',
          bgColor: '#dc2626',
          icon: '🔥'
        }}
        size="md"
      />
    </div>
  );
}
```

## API Reference

### Components

#### ProductBadges
상품에 여러 뱃지를 표시하는 컴포넌트

```typescript
interface ProductBadgeProps {
  badges: Badge[];
  config?: Partial<BadgeConfig>;
  className?: string;
}
```

#### Badge
개별 뱃지 컴포넌트

```typescript
interface BadgeProps {
  badge: Badge;
  size?: BadgeSize;
  shape?: BadgeShape;
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}
```

### Types

```typescript
type BadgeType = 
  | 'new' 
  | 'best' 
  | 'sale' 
  | 'limited' 
  | 'soldout'
  | 'freeShipping'
  | 'exclusive'
  | 'custom';

interface Badge {
  id: string;
  type: BadgeType;
  text: string;
  color?: string;
  bgColor?: string;
  borderColor?: string;
  icon?: string;
  priority?: number;
}

interface BadgeConfig {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size: 'xs' | 'sm' | 'md' | 'lg';
  shape: 'rectangle' | 'rounded' | 'pill' | 'circle';
  maxBadges: number;
  stackDirection: 'vertical' | 'horizontal';
  gap: number;
  animated: boolean;
}
```

### Utils

#### applyBadgeRules
조건에 따라 뱃지를 자동 적용

```typescript
function applyBadgeRules(
  product: Record<string, any>,
  rules: Array<{
    conditions: BadgeCondition[];
    badge: Omit<Badge, 'id' | 'conditions'>;
    priority: number;
  }>
): Badge[]
```

## 의존성

- `@modules/core`: 핵심 모듈 기능
- `@modules/types`: 공통 타입 정의