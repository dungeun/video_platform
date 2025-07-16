/**
 * @company/ui-modals - UI Modals Module
 * 
 * 초세분화된 모달 전용 모듈
 * - 모달 컴포넌트만 담당
 * - 다이얼로그 관리, 오버레이 처리
 * - 모달 스택 관리, 키보드 네비게이션
 * - 다른 UI 요소와 완전히 분리
 * 
 * @version 1.0.0
 * @author Enterprise AI Team
 */

// ===== 컴포넌트 =====
export {
  Modal,
  AlertModal,
  ConfirmModal,
  DrawerModal
} from './components';

// ===== 타입 =====
export type {
  // Basic types
  ModalSize,
  ModalPosition,
  ModalAnimation,
  ModalState,
  OverlayConfig,
  ModalActions,
  
  // Component props
  BaseModalProps,
  AlertModalProps,
  ConfirmModalProps,
  DrawerModalProps,
  
  // Manager types
  ModalManagerState,
  ModalManager,
  ModalStackItem,
  ModalStackManager,
  
  // Other types
  KeyboardNavigationOptions,
  AnimationConfig,
  ModalTheme
} from './types';

// ===== Provider =====
export {
  ModalProvider,
  useModalContext
} from './providers';

// ===== 훅 =====
export {
  useModal,
  useAlertModal,
  useConfirmModal,
  useFocusTrap,
  useKeyboardNavigation,
  useScrollLock
} from './hooks';

// ===== 유틸리티 =====
export {
  // Style utilities
  getModalAnimation,
  getModalClasses,
  getOverlayClasses,
  getModalSizeStyle,
  getModalZIndex,
  
  // Helper utilities
  generateModalId,
  isClickOutside,
  getFocusableElements,
  trapFocus,
  mergeRefs,
  preventBodyScroll,
  createModalRoot,
  getModalAriaAttributes,
  
  // Theme utilities
  getModalTheme,
  setModalTheme,
  resetModalTheme,
  applyModalTheme,
  createModalThemeStyles
} from './utils';

// ===== 모듈 정보 =====
export const UI_MODALS_MODULE_INFO = {
  name: '@company/ui-modals',
  version: '1.0.0',
  description: 'Ultra-Fine-Grained UI Modal Components Module',
  author: 'Enterprise AI Team',
  license: 'MIT',
  features: [
    'Base Modal Component',
    'Alert Modal',
    'Confirm Modal',
    'Drawer Modal',
    'Dialog Management',
    'Overlay Handling',
    'Modal Stacking',
    'Keyboard Navigation',
    'Focus Management',
    'Scroll Lock',
    'Animation Support',
    'Accessibility Support',
    'TypeScript Support'
  ],
  dependencies: {
    react: '>=16.8.0',
    'react-dom': '>=16.8.0',
    'framer-motion': '^10.0.0'
  }
} as const;