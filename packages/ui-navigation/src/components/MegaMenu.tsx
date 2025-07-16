/**
 * MegaMenu Component
 * 메가 메뉴 컴포넌트
 */

import React from 'react';
import type { MegaMenuProps, MegaMenuItem, MegaMenuColumn } from '../types';
import { useMegaMenu } from '../hooks/useMegaMenu';
import { createNavigationAria, createMenuAria, createMenuItemAria } from '../utils/accessibility';

export const MegaMenu: React.FC<MegaMenuProps> = ({
  items,
  trigger = 'hover',
  delay = 150,
  position = 'left',
  width = 'auto',
  onOpen,
  onClose,
  className = '',
  children,
  'data-testid': dataTestId = 'mega-menu',
  ...props
}) => {
  const {
    isMenuOpen,
    menuProps
  } = useMegaMenu({
    items,
    trigger,
    delay,
    onOpen,
    onClose
  });

  const navigationAria = createNavigationAria({
    label: 'Main navigation'
  });

  return (
    <nav
      className={`mega-menu ${className}`}
      data-testid={dataTestId}
      {...navigationAria}
      {...props}
    >
      <div className="mega-menu-container">
        {items.map((item) => (
          <MegaMenuItem
            key={item.id}
            item={item}
            isOpen={isMenuOpen(item.id)}
            position={position}
            width={width}
            {...menuProps(item.id)}
          />
        ))}
      </div>
      {children}
    </nav>
  );
};

interface MegaMenuItemProps {
  item: MegaMenuItem;
  isOpen: boolean;
  position: 'left' | 'center' | 'right';
  width: 'auto' | 'full' | number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

const MegaMenuItem: React.FC<MegaMenuItemProps> = ({
  item,
  isOpen,
  position,
  width,
  onMouseEnter,
  onMouseLeave,
  onClick
}) => {
  const hasSubmenu = (item.children && item.children.length > 0) || 
                    (item.columns && item.columns.length > 0);

  const itemAria = createMenuItemAria({
    hasPopup: hasSubmenu,
    expanded: isOpen,
    controls: hasSubmenu ? `mega-menu-${item.id}` : undefined
  });

  const handleClick = (event: React.MouseEvent) => {
    if (item.disabled) {
      event.preventDefault();
      return;
    }

    onClick();
    
    if (item.onClick) {
      item.onClick(event);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleClick(event as any);
        break;
      case 'ArrowDown':
        if (hasSubmenu) {
          event.preventDefault();
          onClick();
        }
        break;
      case 'Escape':
        event.preventDefault();
        // 부모에서 처리
        break;
    }
  };

  const getMenuStyles = (): React.CSSProperties => {
    const styles: React.CSSProperties = {};

    if (width === 'full') {
      styles.width = '100vw';
      styles.left = '0';
    } else if (typeof width === 'number') {
      styles.width = `${width}px`;
    }

    switch (position) {
      case 'center':
        styles.left = '50%';
        styles.transform = 'translateX(-50%)';
        break;
      case 'right':
        styles.right = '0';
        break;
      default:
        styles.left = '0';
    }

    return styles;
  };

  return (
    <div
      className={`mega-menu-item ${item.featured ? 'featured' : ''} ${item.disabled ? 'disabled' : ''}`}
      data-menu-id={item.id}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        className={`mega-menu-trigger ${isOpen ? 'active' : ''}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={item.disabled}
        {...itemAria}
      >
        {item.icon && <span className="mega-menu-icon">{item.icon}</span>}
        <span className="mega-menu-label">{item.label}</span>
        {hasSubmenu && (
          <span className={`mega-menu-arrow ${isOpen ? 'open' : ''}`}>
            ▼
          </span>
        )}
      </button>

      {hasSubmenu && (
        <div
          id={`mega-menu-${item.id}`}
          className={`mega-menu-dropdown ${isOpen ? 'open' : 'closed'}`}
          style={getMenuStyles()}
          {...createMenuAria({
            labelledBy: `mega-menu-trigger-${item.id}`
          })}
        >
          <div className="mega-menu-content">
            {/* 커스텀 콘텐츠 */}
            {item.content && (
              <div className="mega-menu-custom-content">
                {item.content}
              </div>
            )}

            {/* 컬럼 레이아웃 */}
            {item.columns && item.columns.length > 0 && (
              <div className={`mega-menu-columns columns-${item.columns.length}`}>
                {item.columns.map((column) => (
                  <MegaMenuColumn key={column.id} column={column} />
                ))}
              </div>
            )}

            {/* 기본 아이템 목록 */}
            {item.children && item.children.length > 0 && !item.columns && (
              <div className="mega-menu-items">
                {item.children.map((child) => (
                  <MegaMenuSubItem key={child.id} item={child} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface MegaMenuColumnProps {
  column: MegaMenuColumn;
}

const MegaMenuColumn: React.FC<MegaMenuColumnProps> = ({ column }) => {
  return (
    <div className={`mega-menu-column ${column.featured ? 'featured' : ''}`}>
      {column.title && (
        <h3 className="mega-menu-column-title">{column.title}</h3>
      )}
      <div className="mega-menu-column-items">
        {column.items.map((item) => (
          <MegaMenuSubItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

interface MegaMenuSubItemProps {
  item: import('../types').NavigationItem;
}

const MegaMenuSubItem: React.FC<MegaMenuSubItemProps> = ({ item }) => {
  const handleClick = (event: React.MouseEvent) => {
    if (item.disabled) {
      event.preventDefault();
      return;
    }

    if (item.onClick) {
      item.onClick(event);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick(event as any);
    }
  };

  if (item.href) {
    return (
      <a
        href={item.href}
        className={`mega-menu-subitem ${item.disabled ? 'disabled' : ''}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={item.disabled ? -1 : 0}
        {...createMenuItemAria({ disabled: item.disabled })}
      >
        {item.icon && <span className="mega-menu-subitem-icon">{item.icon}</span>}
        <span className="mega-menu-subitem-label">{item.label}</span>
      </a>
    );
  }

  return (
    <button
      className={`mega-menu-subitem ${item.disabled ? 'disabled' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={item.disabled}
      {...createMenuItemAria({ disabled: item.disabled })}
    >
      {item.icon && <span className="mega-menu-subitem-icon">{item.icon}</span>}
      <span className="mega-menu-subitem-label">{item.label}</span>
    </button>
  );
};

export default MegaMenu;