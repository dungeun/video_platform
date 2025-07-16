/**
 * @company/ui-modals - Base Modal Component
 * 
 * 기본 모달 컴포넌트
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MotionDiv, AnimatePresence } from './MotionWrapper';
import { BaseModalProps } from '../types';
import { useModalContext } from '../providers/ModalProvider';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { useScrollLock } from '../hooks/useScrollLock';
import { getModalAnimation, getModalClasses, getOverlayClasses } from '../utils/modalStyles';
import { generateModalId } from '../utils/modalHelpers';

export const Modal: React.FC<BaseModalProps> = ({
  // Required
  isOpen,
  onClose,
  children,
  
  // Optional
  id,
  title,
  subtitle,
  size = 'md',
  position = 'center',
  animation = 'fade',
  
  // Style
  className,
  style,
  contentClassName,
  contentStyle,
  
  // Overlay
  overlay = true,
  
  // Behavior
  closeOnEsc = true,
  closeOnOverlayClick = true,
  preventScroll = true,
  focusTrap = true,
  autoFocus = true,
  returnFocus = true,
  
  // Actions
  actions,
  showCloseButton = true,
  
  // Accessibility
  ariaLabel,
  ariaDescribedBy,
  role = 'dialog',
  
  // Events
  onAfterOpen,
  onAfterClose,
  onEscPress,
  onOverlayClick
}) => {
  // Context
  const { manager, stack } = useModalContext();
  
  // Refs
  const modalRef = useRef<HTMLDivElement>(null);
  const modalId = useRef(id || generateModalId());
  const previousActiveElement = useRef<HTMLElement | null>(null);
  
  // Overlay config
  const overlayConfig = typeof overlay === 'boolean' 
    ? { visible: overlay } 
    : { visible: true, ...overlay };
  
  // Hooks
  useScrollLock(isOpen && preventScroll);
  
  const { activateTrap, deactivateTrap } = useFocusTrap({
    containerRef: modalRef,
    enabled: isOpen && focusTrap,
    autoFocus,
    returnFocus: returnFocus && previousActiveElement.current ? previousActiveElement.current : false
  });
  
  useKeyboardNavigation({
    containerRef: modalRef,
    enabled: isOpen,
    ...(closeOnEsc ? {
      onEscape: () => {
        onEscPress?.();
        onClose();
      }
    } : {})
  });
  
  // Handle overlay click
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick && !overlayConfig.preventClose) {
      onOverlayClick?.();
      onClose();
    }
  }, [closeOnOverlayClick, overlayConfig.preventClose, onOverlayClick, onClose]);
  
  // Handle modal lifecycle
  useEffect(() => {
    if (isOpen) {
      // Store current active element
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Add to stack
      stack.push({
        id: modalId.current,
        component: null, // Will be set by portal
        props: {} as BaseModalProps,
        timestamp: Date.now()
      });
      
      // Register with manager
      manager.open(modalId.current);
      
      // Activate focus trap
      if (focusTrap) {
        activateTrap();
      }
      
      // Call after open callback
      onAfterOpen?.();
    } else {
      // Remove from stack
      const removed = stack.pop();
      if (removed) {
        manager.close(removed.id);
      }
      
      // Deactivate focus trap
      deactivateTrap();
      
      // Return focus
      if (returnFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
      
      // Call after close callback
      onAfterClose?.();
    }
  }, [isOpen]);
  
  // Get animation variants
  const animationVariants = getModalAnimation(animation);
  
  // Modal classes
  const modalClasses = getModalClasses({
    size,
    position,
    ...(className ? { className } : {})
  });
  
  const overlayClasses = getOverlayClasses({
    ...(overlayConfig.blur !== undefined ? { blur: overlayConfig.blur } : {}),
    ...(overlayConfig.className ? { className: overlayConfig.className } : {})
  });
  
  // Portal container
  const container = document.getElementById('modal-root') || document.body;
  
  // Render nothing if not open
  if (!isOpen) return null;
  
  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          {overlayConfig.visible && (
            <MotionDiv
              className={overlayClasses}
              initial={{ opacity: 0 }}
              animate={{ opacity: overlayConfig.opacity || 0.5 }}
              exit={{ opacity: 0 }}
              onClick={handleOverlayClick}
              style={overlayConfig.style as any}
            />
          )}
          
          {/* Modal */}
          <MotionDiv
            ref={modalRef}
            className={modalClasses}
            style={style as any}
            role={role}
            aria-label={ariaLabel || title?.toString()}
            aria-describedby={ariaDescribedBy}
            aria-modal="true"
            tabIndex={-1}
            variants={animationVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="modal-header flex items-center justify-between p-4 border-b">
                <div>
                  {title && (
                    <h2 className="text-lg font-semibold">{title}</h2>
                  )}
                  {subtitle && (
                    <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                  )}
                </div>
                
                {showCloseButton && (
                  <button
                    type="button"
                    className="modal-close p-1 rounded hover:bg-gray-100"
                    onClick={onClose}
                    aria-label="Close modal"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}
            
            {/* Content */}
            <div className={`modal-content ${contentClassName || ''}`} style={contentStyle}>
              {children}
            </div>
            
            {/* Footer/Actions */}
            {actions && (
              <div className="modal-footer flex items-center justify-end gap-2 p-4 border-t">
                {actions.customActions || (
                  <>
                    {actions.cancel && (
                      <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        onClick={actions.cancel.onClick}
                        disabled={actions.cancel.disabled}
                      >
                        {actions.cancel.label}
                      </button>
                    )}
                    
                    {actions.confirm && (
                      <button
                        type="button"
                        className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                          actions.confirm.variant === 'danger' 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : actions.confirm.variant === 'warning'
                            ? 'bg-yellow-600 hover:bg-yellow-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                        onClick={actions.confirm.onClick}
                        disabled={actions.confirm.disabled || actions.confirm.loading}
                      >
                        {actions.confirm.loading && (
                          <svg className="inline-block w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        )}
                        {actions.confirm.label}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </MotionDiv>
        </div>
      )}
    </AnimatePresence>,
    container
  );
};