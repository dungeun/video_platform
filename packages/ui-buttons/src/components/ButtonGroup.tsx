/**
 * @repo/ui-buttons - Button Group Component
 * 버튼 그룹 컴포넌트 (버튼들을 그룹화)
 */

import React, { Children, cloneElement, isValidElement } from 'react';
import { ButtonGroupProps } from '../types';
import { useButtonGroupClasses } from '../hooks/useButtonGroupClasses';

/**
 * 버튼 그룹 컴포넌트
 */
export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  size,
  variant,
  vertical = false,
  attached = true,
  spacing = 'none',
  className = '',
  children
}) => {
  const groupClasses = useButtonGroupClasses({
    vertical,
    attached,
    spacing,
    className
  });

  const renderChildren = () => {
    return Children.map(children, (child, index) => {
      if (!isValidElement(child)) {
        return child;
      }

      // 버튼에 그룹 속성 전달
      const isFirst = index === 0;
      const isLast = index === Children.count(children) - 1;
      
      let groupSpecificClass = '';
      
      if (attached) {
        if (vertical) {
          if (isFirst) groupSpecificClass += ' rounded-b-none border-b-0';
          if (isLast) groupSpecificClass += ' rounded-t-none';
          if (!isFirst && !isLast) groupSpecificClass += ' rounded-none border-b-0';
        } else {
          if (isFirst) groupSpecificClass += ' rounded-r-none border-r-0';
          if (isLast) groupSpecificClass += ' rounded-l-none';
          if (!isFirst && !isLast) groupSpecificClass += ' rounded-none border-r-0';
        }
      }

      return cloneElement(child as React.ReactElement<any>, {
        size: (child.props as any).size || size,
        variant: (child.props as any).variant || variant,
        className: `${(child.props as any).className || ''} ${groupSpecificClass}`.trim()
      });
    });
  };

  return (
    <div className={groupClasses} role="group">
      {renderChildren()}
    </div>
  );
};

ButtonGroup.displayName = 'ButtonGroup';