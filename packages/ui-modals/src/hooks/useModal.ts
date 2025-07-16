/**
 * @repo/ui-modals - Modal Hook
 * 
 * 모달 상태 관리를 위한 편의 훅
 */

import { useState, useCallback, useRef } from 'react';
import { useModalContext } from '../providers/ModalProvider';

interface UseModalOptions {
  id?: string;
  onOpen?: () => void;
  onClose?: () => void;
}

export function useModal(options: UseModalOptions = {}) {
  const { manager } = useModalContext();
  const [isOpen, setIsOpen] = useState(false);
  const modalId = useRef(options.id || `modal-${Date.now()}`);
  
  const open = useCallback(() => {
    setIsOpen(true);
    manager.open(modalId.current);
    options.onOpen?.();
  }, [manager, options]);
  
  const close = useCallback(() => {
    setIsOpen(false);
    manager.close(modalId.current);
    options.onClose?.();
  }, [manager, options]);
  
  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);
  
  return {
    isOpen,
    open,
    close,
    toggle,
    modalId: modalId.current
  };
}

// Alert modal hook
export function useAlertModal() {
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    detail?: string;
  }>({
    isOpen: false,
    type: 'info',
    message: ''
  });
  
  const showAlert = useCallback((
    type: 'info' | 'success' | 'warning' | 'error',
    message: string,
    detail?: string
  ) => {
    setAlertState({
      isOpen: true,
      type,
      message,
      ...(detail !== undefined ? { detail } : {})
    });
  }, []);
  
  const hideAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  }, []);
  
  return {
    alertState,
    showAlert,
    hideAlert,
    showInfo: (message: string, detail?: string) => showAlert('info', message, detail),
    showSuccess: (message: string, detail?: string) => showAlert('success', message, detail),
    showWarning: (message: string, detail?: string) => showAlert('warning', message, detail),
    showError: (message: string, detail?: string) => showAlert('error', message, detail)
  };
}

// Confirm modal hook
export function useConfirmModal() {
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    message: string;
    detail?: string;
    onConfirm: () => void | Promise<void>;
    variant?: 'default' | 'danger';
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => {}
  });
  
  const showConfirm = useCallback((
    message: string,
    onConfirm: () => void | Promise<void>,
    options?: {
      detail?: string;
      variant?: 'default' | 'danger';
    }
  ) => {
    setConfirmState({
      isOpen: true,
      message,
      onConfirm,
      ...(options?.detail !== undefined ? { detail: options.detail } : {}),
      ...(options?.variant !== undefined ? { variant: options.variant } : {})
    });
  }, []);
  
  const hideConfirm = useCallback(() => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  }, []);
  
  const handleConfirm = useCallback(async () => {
    await confirmState.onConfirm();
    hideConfirm();
  }, [confirmState.onConfirm, hideConfirm]);
  
  return {
    confirmState,
    showConfirm,
    hideConfirm,
    handleConfirm
  };
}