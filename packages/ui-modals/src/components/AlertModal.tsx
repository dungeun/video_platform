/**
 * @company/ui-modals - Alert Modal Component
 * 
 * 알림 전용 모달 컴포넌트
 */

import React from 'react';
import { AlertModalProps } from '../types';
import { Modal } from './Modal';

const iconMap = {
  info: (
    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  success: (
    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  error: (
    <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
};

const colorMap = {
  info: 'bg-blue-50 border-blue-200',
  success: 'bg-green-50 border-green-200',
  warning: 'bg-yellow-50 border-yellow-200',
  error: 'bg-red-50 border-red-200'
};

export const AlertModal: React.FC<AlertModalProps> = ({
  type,
  message,
  detail,
  icon,
  onConfirm,
  confirmText = 'OK',
  ...modalProps
}) => {
  const handleConfirm = () => {
    onConfirm?.();
    modalProps.onClose();
  };

  return (
    <Modal
      {...modalProps}
      size="sm"
      showCloseButton={false}
      role="alertdialog"
      actions={{
        confirm: {
          label: confirmText,
          onClick: handleConfirm
        }
      }}
    >
      <div className={`p-6 rounded-lg ${colorMap[type]}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {icon || iconMap[type]}
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-gray-900">
              {message}
            </h3>
            {detail && (
              <div className="mt-2 text-sm text-gray-500">
                {detail}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};