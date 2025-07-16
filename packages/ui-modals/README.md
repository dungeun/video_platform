# @company/ui-modals

초세분화된 모달 전용 UI 모듈입니다.

## 특징

- **모달 전용**: 모달 컴포넌트만 담당하는 초세분화 모듈
- **다이얼로그 관리**: 전역 모달 상태 관리 시스템
- **오버레이 처리**: 커스터마이징 가능한 오버레이
- **모달 스택**: 다중 모달 스택 관리
- **키보드 네비게이션**: ESC, Tab 등 키보드 지원
- **포커스 관리**: Focus trap 및 자동 포커스
- **스크롤 잠금**: 모달 열림 시 배경 스크롤 방지
- **애니메이션**: 다양한 애니메이션 효과
- **접근성**: ARIA 속성 및 키보드 접근성 지원
- **TypeScript**: 완전한 타입 지원

## 설치

```bash
npm install @company/ui-modals
```

## 사용법

### 기본 설정

```tsx
import { ModalProvider } from '@company/ui-modals';

function App() {
  return (
    <ModalProvider>
      {/* Your app content */}
    </ModalProvider>
  );
}
```

### 기본 모달

```tsx
import { Modal, useModal } from '@company/ui-modals';

function MyComponent() {
  const { isOpen, open, close } = useModal();
  
  return (
    <>
      <button onClick={open}>Open Modal</button>
      
      <Modal
        isOpen={isOpen}
        onClose={close}
        title="Example Modal"
        size="md"
        animation="fade"
      >
        <p>Modal content goes here</p>
      </Modal>
    </>
  );
}
```

### Alert 모달

```tsx
import { AlertModal, useAlertModal } from '@company/ui-modals';

function MyComponent() {
  const { alertState, showSuccess, showError, hideAlert } = useAlertModal();
  
  const handleSuccess = () => {
    showSuccess('Operation completed successfully!');
  };
  
  return (
    <>
      <button onClick={handleSuccess}>Show Success</button>
      
      <AlertModal
        isOpen={alertState.isOpen}
        onClose={hideAlert}
        type={alertState.type}
        message={alertState.message}
        detail={alertState.detail}
      />
    </>
  );
}
```

### Confirm 모달

```tsx
import { ConfirmModal, useConfirmModal } from '@company/ui-modals';

function MyComponent() {
  const { confirmState, showConfirm, hideConfirm, handleConfirm } = useConfirmModal();
  
  const handleDelete = () => {
    showConfirm(
      'Are you sure you want to delete this item?',
      async () => {
        await deleteItem();
        console.log('Item deleted');
      },
      { variant: 'danger' }
    );
  };
  
  return (
    <>
      <button onClick={handleDelete}>Delete Item</button>
      
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={hideConfirm}
        message={confirmState.message}
        onConfirm={handleConfirm}
        variant={confirmState.variant}
      />
    </>
  );
}
```

### Drawer 모달

```tsx
import { DrawerModal } from '@company/ui-modals';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Drawer</button>
      
      <DrawerModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        direction="right"
        width="400px"
        title="Settings"
      >
        <div className="p-4">
          <h3>Settings Panel</h3>
          {/* Drawer content */}
        </div>
      </DrawerModal>
    </>
  );
}
```

## 컴포넌트

### Modal
기본 모달 컴포넌트

### AlertModal
알림 전용 모달 (info, success, warning, error)

### ConfirmModal
확인 대화상자 모달

### DrawerModal
슬라이드 방식의 서랍형 모달

## 훅

- `useModal`: 모달 상태 관리
- `useAlertModal`: Alert 모달 전용 훅
- `useConfirmModal`: Confirm 모달 전용 훅
- `useFocusTrap`: 포커스 가두기
- `useKeyboardNavigation`: 키보드 네비게이션
- `useScrollLock`: 스크롤 잠금

## 모달 크기

- `sm`: 384px
- `md`: 448px (기본값)
- `lg`: 512px
- `xl`: 576px
- `full`: 전체 화면

## 애니메이션

- `fade`: 페이드 인/아웃
- `slide`: 슬라이드 업/다운
- `scale`: 스케일 인/아웃
- `none`: 애니메이션 없음

## 라이선스

MIT