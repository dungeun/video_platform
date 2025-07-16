# @company/ui-navigation

> Ultra-Fine-Grained UI Navigation Components Module

완전히 독립적인 네비게이션 전용 모듈로, 네비게이션과 관련된 모든 로직, 상태 관리, 유틸리티를 포함합니다.

## 🚧 현재 상태

**Phase 1 완료**: 핵심 인프라 및 로직 구현
- ✅ 타입 정의 완료
- ✅ 훅 시스템 구현
- ✅ 유틸리티 함수 구현
- ✅ 테마 시스템 구축
- ✅ 접근성 지원
- ✅ 키보드 네비게이션
- 🚧 React 컴포넌트 (TypeScript 호환성 이슈로 인해 개발 중)

## 📦 설치

```bash
npm install @company/ui-navigation
# 또는
yarn add @company/ui-navigation
```

## 🚀 주요 기능

- **메가 메뉴**: 다중 컬럼 지원하는 고급 메가 메뉴
- **슬라이드 메뉴**: 중첩된 네비게이션이 있는 슬라이딩 메뉴
- **모바일 네비게이션**: 터치 지원하는 모바일 최적화 네비게이션
- **브레드크럼**: 오버플로우 처리가 있는 계층적 네비게이션
- **검색바**: 자동완성 기능이 있는 검색 입력
- **사용자 메뉴**: 프로필 표시가 있는 사용자 드롭다운 메뉴
- **키보드 네비게이션**: 완전한 키보드 지원
- **접근성**: ARIA 완전 지원
- **테마 커스터마이징**: 다크/라이트 모드 지원
- **TypeScript**: 완전한 타입 지원
- **모바일 우선**: 반응형 디자인

## 📖 사용법

### 기본 사용법

```typescript
import { 
  MegaMenu, 
  SlideMenu, 
  MobileNavigation,
  Breadcrumbs,
  SearchBar,
  UserMenu 
} from '@company/ui-navigation';

// 네비게이션 아이템 정의
const navigationItems = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    icon: '🏠'
  },
  {
    id: 'products',
    label: 'Products',
    children: [
      { id: 'category1', label: 'Category 1', href: '/products/category1' },
      { id: 'category2', label: 'Category 2', href: '/products/category2' }
    ]
  }
];

// 메가 메뉴
function MyMegaMenu() {
  return (
    <MegaMenu
      items={navigationItems}
      trigger="hover"
      position="center"
      onOpen={(menuId) => console.log('Menu opened:', menuId)}
    />
  );
}
```

### 슬라이드 메뉴

```typescript
function MySlideMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SlideMenu
      items={navigationItems}
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      position="left"
      width={280}
      onItemClick={(item) => {
        console.log('Item clicked:', item);
        setIsOpen(false);
      }}
    />
  );
}
```

### 모바일 네비게이션

```typescript
function MyMobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <MobileNavigation
      items={navigationItems}
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
      position="top"
      showBackdrop={true}
    />
  );
}
```

### 브레드크럼

```typescript
function MyBreadcrumbs() {
  const breadcrumbItems = [
    { id: 'home', label: 'Home', href: '/' },
    { id: 'products', label: 'Products', href: '/products' },
    { id: 'category', label: 'Category', href: '/products/category' },
    { id: 'current', label: 'Current Page', current: true }
  ];

  return (
    <Breadcrumbs
      items={breadcrumbItems}
      maxItems={4}
      showHome={true}
      homeIcon="🏠"
      onItemClick={(item, index) => {
        console.log('Breadcrumb clicked:', item, index);
      }}
    />
  );
}
```

### 검색바

```typescript
function MySearchBar() {
  const [query, setQuery] = useState('');
  
  const suggestions = [
    { id: '1', text: 'React Components', category: 'Development' },
    { id: '2', text: 'TypeScript Guide', category: 'Documentation' },
    { id: '3', text: 'UI Design', category: 'Design' }
  ];

  return (
    <SearchBar
      value={query}
      onChange={setQuery}
      onSearch={(query) => console.log('Search:', query)}
      suggestions={suggestions}
      placeholder="Search documentation..."
      size="md"
      clearable={true}
      showIcon={true}
    />
  );
}
```

### 사용자 메뉴

```typescript
function MyUserMenu() {
  const user = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: '/path/to/avatar.jpg',
    role: 'Admin'
  };

  const menuItems = [
    { id: 'profile', label: 'Profile', href: '/profile', icon: '👤' },
    { id: 'settings', label: 'Settings', href: '/settings', icon: '⚙️' },
    { id: 'divider', divider: true },
    { id: 'logout', label: 'Logout', danger: true, icon: '🚪' }
  ];

  return (
    <UserMenu
      user={user}
      items={menuItems}
      showAvatar={true}
      showName={true}
      position="bottom-right"
      onItemClick={(item) => {
        console.log('Menu item clicked:', item);
      }}
    />
  );
}
```

## 🎨 테마 커스터마이징

```typescript
import { useNavigationTheme } from '@company/ui-navigation';

function MyApp() {
  const {
    theme,
    isDarkMode,
    toggleDarkMode,
    setTheme
  } = useNavigationTheme({
    autoDetectDarkMode: true,
    persistTheme: true
  });

  // 커스텀 테마 적용
  const customTheme = {
    colors: {
      primary: '#3b82f6',
      background: '#ffffff',
      text: '#1f2937'
    }
  };

  return (
    <div>
      <button onClick={toggleDarkMode}>
        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
      </button>
      
      <button onClick={() => setTheme(customTheme)}>
        Apply Custom Theme
      </button>
    </div>
  );
}
```

## 🎯 고급 사용법

### 키보드 네비게이션

```typescript
import { useKeyboardNavigation } from '@company/ui-navigation';

function KeyboardNavigableMenu() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    currentIndex,
    handleKeyDown,
    containerProps
  } = useKeyboardNavigation({
    containerRef,
    orientation: 'vertical',
    loop: true,
    onActivate: (index, element) => {
      console.log('Item activated:', index, element);
    }
  });

  return (
    <div
      ref={containerRef}
      {...containerProps}
      className="keyboard-navigable-menu"
    >
      <button>Item 1</button>
      <button>Item 2</button>
      <button>Item 3</button>
    </div>
  );
}
```

### 접근성 유틸리티

```typescript
import { 
  createNavigationAria,
  createMenuItemAria,
  manageFocus
} from '@company/ui-navigation';

function AccessibleNavigation() {
  const navigationAria = createNavigationAria({
    label: 'Main navigation',
    current: true
  });

  const menuItemAria = createMenuItemAria({
    hasPopup: true,
    expanded: false
  });

  return (
    <nav {...navigationAria}>
      <button {...menuItemAria}>
        Menu Item
      </button>
    </nav>
  );
}
```

## 📱 반응형 지원

모든 컴포넌트는 모바일 우선으로 설계되었으며, 자동으로 화면 크기에 따라 적응합니다:

```typescript
// 자동 모바일 감지
const { isMobile } = useMobileNavigation({
  items: navigationItems,
  breakpoint: 768, // 커스텀 브레이크포인트
  autoDetectMobile: true
});

// 조건부 렌더링
return (
  <>
    {isMobile ? (
      <MobileNavigation {...props} />
    ) : (
      <MegaMenu {...props} />
    )}
  </>
);
```

## 🔧 API 참조

### 컴포넌트 Props

모든 컴포넌트의 상세한 Props는 TypeScript 정의를 참조하세요:

- `MegaMenuProps`
- `SlideMenuProps`
- `MobileNavigationProps`
- `BreadcrumbProps`
- `SearchBarProps`
- `UserMenuProps`

### 훅 API

- `useNavigation`: 기본 네비게이션 상태 관리
- `useMegaMenu`: 메가 메뉴 상태 및 상호작용
- `useSlideMenu`: 슬라이드 메뉴 상태 관리
- `useMobileNavigation`: 모바일 네비게이션 상태
- `useBreadcrumbs`: 브레드크럼 네비게이션 로직
- `useSearchBar`: 검색 기능 및 제안사항
- `useUserMenu`: 사용자 메뉴 상태 관리
- `useKeyboardNavigation`: 키보드 네비게이션 지원
- `useNavigationTheme`: 테마 관리 및 커스터마이징

## 🎨 스타일링

CSS 변수를 통해 쉽게 커스터마이징할 수 있습니다:

```css
:root {
  --nav-color-primary: #3b82f6;
  --nav-color-background: #ffffff;
  --nav-color-text: #1f2937;
  --nav-spacing-md: 1rem;
  --nav-border-radius-md: 0.375rem;
}
```

## 🔍 예제

더 많은 예제는 `/examples` 폴더를 참조하세요:

- 기본 네비게이션 예제
- 고급 메가 메뉴 예제
- 모바일 네비게이션 예제
- 검색 통합 예제
- 테마 커스터마이징 예제

## 🤝 기여하기

1. 이 저장소를 포크하세요
2. 기능 브랜치를 만드세요 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 푸시하세요 (`git push origin feature/amazing-feature`)
5. Pull Request를 열어주세요

## 📄 라이선스

MIT License

## 🆘 지원

- 문서: [링크]
- 이슈: [GitHub Issues]
- 디스코드: [커뮤니티 링크]