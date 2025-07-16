/**
 * MobileNavigation Component
 * 모바일 네비게이션 컴포넌트
 */

import React from 'react';
import { MobileNavigationProps, NavigationItem } from '../types';
import { useMobileNavigation } from '../hooks/useMobileNavigation';
import { createNavigationAria, createButtonAria, createMenuItemAria } from '../utils/accessibility';

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  items,
  isOpen,
  onToggle,
  position = 'top',
  showBackdrop = true,
  hamburgerIcon,
  closeIcon,
  className = '',
  children,
  'data-testid': dataTestId = 'mobile-navigation',
  ...props
}) => {
  const {
    isMobile,
    activeSubmenu,
    handleItemClick,
    handleBackdropClick,
    navigationProps,
    backdropProps,
    openSubmenu,
    closeSubmenu
  } = useMobileNavigation({
    items,
    closeOnItemClick: true
  });

  const navigationAria = createNavigationAria({
    label: 'Mobile navigation'
  });

  const hamburgerAria = createButtonAria({
    label: 'Toggle navigation menu',
    expanded: isOpen,
    hasPopup: true,
    controls: `${dataTestId}-menu`
  });

  // 모바일이 아닌 경우 렌더링하지 않음
  if (!isMobile) {
    return null;
  }

  return (
    <>
      {/* 햄버거 버튼 */}
      <button
        className={`mobile-navigation-toggle ${isOpen ? 'active' : ''}`}
        onClick={onToggle}
        data-testid={`${dataTestId}-toggle`}
        {...hamburgerAria}
      >
        {isOpen ? (
          closeIcon || (
            <span className="mobile-navigation-close-icon">
              <span></span>
              <span></span>
              <span></span>
            </span>
          )
        ) : (
          hamburgerIcon || (
            <span className="mobile-navigation-hamburger-icon">
              <span></span>
              <span></span>
              <span></span>
            </span>
          )
        )}
      </button>

      {/* 백드롭 */}
      {showBackdrop && isOpen && (
        <div
          className={backdropProps.className}
          onClick={backdropProps.onClick}
          data-testid={`${dataTestId}-backdrop`}
        />
      )}

      {/* 네비게이션 메뉴 */}
      <nav
        id={`${dataTestId}-menu`}
        className={`mobile-navigation mobile-navigation-${position} ${navigationProps.className} ${className}`}
        data-testid={navigationProps['data-testid']}
        aria-expanded={navigationProps['aria-expanded']}
        {...navigationAria}
        {...props}
      >
        <div className="mobile-navigation-content">
          {/* 헤더 */}
          <div className="mobile-navigation-header">
            <button
              className="mobile-navigation-close"
              onClick={onToggle}
              aria-label="Close navigation menu"
              data-testid={`${dataTestId}-close`}
            >
              {closeIcon || '✕'}
            </button>
          </div>

          {/* 메뉴 아이템들 */}
          <div className="mobile-navigation-body">
            <ul className="mobile-navigation-list" role="menu">
              {items.map((item) => (
                <MobileNavigationItem
                  key={item.id}
                  item={item}
                  activeSubmenu={activeSubmenu}
                  onItemClick={(item) => handleItemClick(item)}
                  onOpenSubmenu={openSubmenu}
                  onCloseSubmenu={closeSubmenu}
                  level={0}
                />
              ))}
            </ul>
          </div>

          {/* 푸터 */}
          {children && (
            <div className="mobile-navigation-footer">
              {children}
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

interface MobileNavigationItemProps {
  item: NavigationItem;
  activeSubmenu: string | null;
  onItemClick: (item: NavigationItem) => void;
  onOpenSubmenu: (itemId: string) => void;
  onCloseSubmenu: () => void;
  level: number;
}

const MobileNavigationItem: React.FC<MobileNavigationItemProps> = ({
  item,
  activeSubmenu,
  onItemClick,
  onOpenSubmenu,
  onCloseSubmenu,
  level
}) => {
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = activeSubmenu === item.id;

  const itemAria = createMenuItemAria({
    hasPopup: hasChildren,
    expanded: hasChildren ? isExpanded : undefined,
    disabled: item.disabled
  });

  const handleClick = (event: React.MouseEvent) => {
    if (item.disabled) {
      event.preventDefault();
      return;
    }

    if (hasChildren) {
      if (isExpanded) {
        onCloseSubmenu();
      } else {
        onOpenSubmenu(item.id);
      }
    } else {
      onItemClick(item);
    }

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
        if (hasChildren && !isExpanded) {
          event.preventDefault();
          onOpenSubmenu(item.id);
        }
        break;
      case 'ArrowUp':
        if (hasChildren && isExpanded) {
          event.preventDefault();
          onCloseSubmenu();
        }
        break;
    }
  };

  const ItemContent = () => (
    <>
      {item.icon && (
        <span className="mobile-navigation-item-icon">{item.icon}</span>
      )}
      <span className="mobile-navigation-item-label">{item.label}</span>
      {hasChildren && (
        <span className={`mobile-navigation-item-arrow ${isExpanded ? 'expanded' : ''}`}>
          ▼
        </span>
      )}
    </>
  );

  return (
    <li 
      className="mobile-navigation-item"
      style={{ '--level': level } as React.CSSProperties}
    >
      {item.href && !hasChildren ? (
        <a
          href={item.href}
          className={`mobile-navigation-item-link ${item.disabled ? 'disabled' : ''}`}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          tabIndex={item.disabled ? -1 : 0}
          {...itemAria}
        >
          <ItemContent />
        </a>
      ) : (
        <button
          className={`mobile-navigation-item-button ${item.disabled ? 'disabled' : ''} ${isExpanded ? 'expanded' : ''}`}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          disabled={item.disabled}
          {...itemAria}
        >
          <ItemContent />
        </button>
      )}

      {/* 서브메뉴 */}
      {hasChildren && (
        <div className={`mobile-navigation-submenu ${isExpanded ? 'expanded' : 'collapsed'}`}>
          {/* 뒤로가기 버튼 */}
          <div className="mobile-navigation-submenu-header">
            <button
              className="mobile-navigation-back"
              onClick={onCloseSubmenu}
              aria-label={`Go back from ${item.label}`}
            >
              ← {item.label}
            </button>
          </div>

          {/* 서브메뉴 아이템들 */}
          <ul className="mobile-navigation-submenu-list" role="menu">
            {item.children!.map((childItem) => (
              <MobileNavigationItem
                key={childItem.id}
                item={childItem}
                activeSubmenu={activeSubmenu}
                onItemClick={onItemClick}
                onOpenSubmenu={onOpenSubmenu}
                onCloseSubmenu={onCloseSubmenu}
                level={level + 1}
              />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
};

export default MobileNavigation;