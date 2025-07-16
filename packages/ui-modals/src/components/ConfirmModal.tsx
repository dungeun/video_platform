/**
 * @company/ui-modals - Confirm Modal Component
 * 
 * 확인 대화상자 모달 컴포넌트
 */

import React, { useState } from 'react';
import { ConfirmModalProps } from '../types';
import { Modal } from './Modal';

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  message,
  detail,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
  loading: externalLoading,
  ...modalProps
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = externalLoading ?? internalLoading;

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      const result = onConfirm();
      
      if (result instanceof Promise) {
        await result;
      }
      
      modalProps.onClose();
    } catch (error) {
      console.error('Confirm action failed:', error);
      // Error handling could be enhanced here
    } finally {
      setInternalLoading(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    modalProps.onClose();
  };

  return (
    <Modal
      {...modalProps}
      size="sm"
      closeOnEsc={!loading}
      closeOnOverlayClick={!loading}
      showCloseButton={!loading}
      actions={{
        cancel: {
          label: cancelText,
          onClick: handleCancel,
          disabled: loading
        },
        confirm: {
          label: confirmText,
          onClick: handleConfirm,
          variant: variant === 'danger' ? 'danger' : 'primary',
          loading,
          disabled: loading
        }
      }}
    >
      <div className="p-6">
        <div className="flex items-start">
          {variant === 'danger' && (
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          )}
          <div className={variant === 'danger' ? 'ml-3 flex-1' : 'flex-1'}>
            <h3 className="text-base font-medium text-gray-900">
              {message}
            </h3>
            {detail && (
              <p className="mt-2 text-sm text-gray-500">
                {detail}
              </p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};