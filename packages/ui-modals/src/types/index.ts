/**
 * @company/ui-modals - Types
 * 
 * 모달 컴포넌트 전용 타입 정의
 */

import { ReactNode, CSSProperties } from 'react';

// ===== 기본 타입 =====
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ModalPosition = 'center' | 'top' | 'bottom' | 'left' | 'right';
export type ModalAnimation = 'fade' | 'slide' | 'scale' | 'none';

// ===== 모달 상태 =====
export interface ModalState {
  isOpen: boolean;
  id: string;
  zIndex: number;
  focusTrapActive: boolean;
}

// ===== 오버레이 설정 =====
export interface OverlayConfig {
  visible?: boolean;
  opacity?: number;
  blur?: boolean;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  preventClose?: boolean;
}

// ===== 모달 액션 =====
export interface ModalActions {
  confirm?: {
    label: string;
    onClick: () => void | Promise<void>;
    variant?: 'primary' | 'danger' | 'warning';
    loading?: boolean;
    disabled?: boolean;
  };
  cancel?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  customActions?: ReactNode;
}

// ===== 기본 모달 Props =====
export interface BaseModalProps {
  // 필수
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  
  // 선택
  id?: string;
  title?: ReactNode;
  subtitle?: string;
  size?: ModalSize;
  position?: ModalPosition;
  animation?: ModalAnimation;
  
  // 스타일
  className?: string;
  style?: CSSProperties;
  contentClassName?: string;
  contentStyle?: CSSProperties;
  
  // 오버레이
  overlay?: boolean | OverlayConfig;
  
  // 동작
  closeOnEsc?: boolean;
  closeOnOverlayClick?: boolean;
  preventScroll?: boolean;
  focusTrap?: boolean;
  autoFocus?: boolean;
  returnFocus?: boolean;
  
  // 액션
  actions?: ModalActions;
  showCloseButton?: boolean;
  
  // 접근성
  ariaLabel?: string;
  ariaDescribedBy?: string;
  role?: 'dialog' | 'alertdialog';
  
  // 이벤트
  onAfterOpen?: () => void;
  onAfterClose?: () => void;
  onEscPress?: () => void;
  onOverlayClick?: () => void;
}

// ===== Alert 모달 Props =====
export interface AlertModalProps extends Omit<BaseModalProps, 'children' | 'actions'> {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  detail?: string;
  icon?: ReactNode;
  onConfirm?: () => void;
  confirmText?: string;
}

// ===== Confirm 모달 Props =====
export interface ConfirmModalProps extends Omit<BaseModalProps, 'children' | 'actions'> {
  message: string;
  detail?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  variant?: 'default' | 'danger';
  loading?: boolean;
}

// ===== Drawer 모달 Props =====
export interface DrawerModalProps extends BaseModalProps {
  direction: 'left' | 'right' | 'top' | 'bottom';
  width?: string | number;
  height?: string | number;
  pushContent?: boolean;
}

// ===== 모달 관리자 =====
export interface ModalManagerState {
  modals: Map<string, ModalState>;
  activeModalId: string | null;
  zIndexBase: number;
}

export interface ModalManager {
  open: (id: string, options?: Partial<ModalState>) => void;
  close: (id: string) => void;
  closeAll: () => void;
  isOpen: (id: string) => boolean;
  getState: (id: string) => ModalState | undefined;
  getActiveModal: () => string | null;
  setActiveModal: (id: string | null) => void;
}

// ===== 모달 스택 =====
export interface ModalStackItem {
  id: string;
  component: ReactNode;
  props: BaseModalProps;
  timestamp: number;
}

export interface ModalStackManager {
  push: (item: ModalStackItem) => void;
  pop: () => ModalStackItem | undefined;
  peek: () => ModalStackItem | undefined;
  clear: () => void;
  size: () => number;
  getAll: () => ModalStackItem[];
}

// ===== 키보드 네비게이션 =====
export interface KeyboardNavigationOptions {
  enableArrowNavigation?: boolean;
  enableTabNavigation?: boolean;
  wrapFocus?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement>;
  restoreFocusRef?: React.RefObject<HTMLElement>;
}

// ===== 애니메이션 설정 =====
export interface AnimationConfig {
  duration?: number;
  easing?: string;
  delay?: number;
  custom?: {
    initial?: any;
    animate?: any;
    exit?: any;
  };
}

// ===== 테마 =====
export interface ModalTheme {
  colors: {
    overlay: string;
    background: string;
    border: string;
    shadow: string;
    header: {
      background: string;
      text: string;
      border: string;
    };
    footer: {
      background: string;
      border: string;
    };
  };
  sizes: Record<ModalSize, {
    width: string;
    maxHeight: string;
    padding: string;
  }>;
  animations: Record<ModalAnimation, AnimationConfig>;
  zIndex: {
    base: number;
    increment: number;
  };
}