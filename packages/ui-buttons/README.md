# @repo/ui-buttons

초세분화된 버튼 전용 UI 모듈

## 🎯 모듈 목적

**버튼 컴포넌트만 담당**하는 극도로 세분화된 모듈입니다.

- ✅ 버튼, 아이콘 버튼, 버튼 그룹, FAB만 제공
- ✅ 다른 UI 요소(폼, 테이블 등)와 완전히 분리
- ✅ 최소 의존성 (React만 필요)
- ✅ 충돌 방지 (버튼 기능은 이 모듈에만 존재)

## 📦 설치

```bash
npm install @repo/ui-buttons
```

## 🚀 사용법

### 기본 버튼

```tsx
import { Button } from '@repo/ui-buttons';

function App() {
  return (
    <div>
      <Button variant="primary" size="md">
        기본 버튼
      </Button>
      
      <Button variant="outline-secondary" loading>
        로딩 버튼
      </Button>
      
      <Button 
        variant="success" 
        icon={<CheckIcon />}
        iconPosition="left"
      >
        아이콘 버튼
      </Button>
    </div>
  );
}
```

### 버튼 그룹

```tsx
import { Button, ButtonGroup } from '@repo/ui-buttons';

function ToolbarExample() {
  return (
    <ButtonGroup size="sm" attached>
      <Button variant="outline-primary">왼쪽</Button>
      <Button variant="outline-primary">가운데</Button>
      <Button variant="outline-primary">오른쪽</Button>
    </ButtonGroup>
  );
}
```

### 아이콘 버튼

```tsx
import { IconButton } from '@repo/ui-buttons';

function IconExample() {
  return (
    <IconButton
      icon={<HeartIcon />}
      aria-label="좋아요"
      variant="ghost"
      size="lg"
    />
  );
}
```

### 플로팅 액션 버튼

```tsx
import { FAB } from '@repo/ui-buttons';

function FABExample() {
  return (
    <FAB
      icon={<PlusIcon />}
      position="bottom-right"
      size="lg"
      onClick={() => console.log('새 항목 추가')}
    />
  );
}
```

## 🎨 컴포넌트

### Button

기본 버튼 컴포넌트

**Props:**
- `variant`: 버튼 스타일 ('primary' | 'secondary' | 'success' | ...)
- `size`: 버튼 크기 ('xs' | 'sm' | 'md' | 'lg' | 'xl')
- `loading`: 로딩 상태 (boolean | LoadingState)
- `icon`: 아이콘 요소
- `iconPosition`: 아이콘 위치 ('left' | 'right' | 'only')
- `fullWidth`: 전체 너비 사용
- `rounded`: 둥근 모서리
- `shadow`: 그림자 효과

### ButtonGroup

버튼들을 그룹화하는 컴포넌트

**Props:**
- `vertical`: 세로 배치
- `attached`: 연결된 스타일
- `spacing`: 버튼 간격
- `size`: 그룹 내 버튼 기본 크기
- `variant`: 그룹 내 버튼 기본 변형

### IconButton

아이콘 전용 버튼 컴포넌트

**Props:**
- `icon`: 아이콘 (필수)
- `aria-label`: 접근성 라벨 (필수)
- `square`: 정사각형 모양 유지

### FAB (Floating Action Button)

플로팅 액션 버튼 컴포넌트

**Props:**
- `position`: 화면 위치 ('bottom-right' | 'bottom-left' | ...)
- `extended`: 확장형 (텍스트 포함)
- `size`: FAB 크기 ('sm' | 'md' | 'lg')

## 🎯 세분화의 장점

### 1. 독립성
```tsx
// 버튼만 필요할 때 버튼만 가져오기
import { Button } from '@repo/ui-buttons';
// 폼이나 테이블 같은 다른 UI는 안 가져옴
```

### 2. 충돌 방지
- 버튼 기능은 이 모듈에만 존재
- 다른 모듈에서 중복 구현 불가능
- 버튼 수정이 필요하면 이 모듈만 수정

### 3. 팀 협업
- A팀이 버튼 기능 개발 시 이 모듈만 작업
- B팀이 폼 기능 개발 시 @repo/ui-forms 모듈 작업
- 서로 충돌 없음

### 4. 선택적 사용
```tsx
// CMS에서는 버튼과 폼만 사용
import '@repo/ui-buttons';
import '@repo/ui-forms';

// 간단한 페이지에서는 버튼만 사용
import '@repo/ui-buttons';
```

## 📋 타입 정의

모든 컴포넌트는 완전한 TypeScript 지원을 제공합니다.

```tsx
import type { 
  BaseButtonProps, 
  ButtonVariant, 
  ButtonSize 
} from '@repo/ui-buttons';
```

## 🧪 테스트

```bash
npm run test
```

## 📄 라이선스

MIT