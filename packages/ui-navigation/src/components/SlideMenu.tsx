/**
 * SlideMenu Component
 * 슬라이드 메뉴 컴포넌트
 */

import React from 'react';
import { SlideMenuProps, NavigationItem } from '../types';
import { useSlideMenu } from '../hooks/useSlideMenu';
import { createNavigationAria, createMenuItemAria } from '../utils/accessibility';

export const SlideMenu: React.FC<SlideMenuProps> = ({
  items,
  isOpen,
  onClose,
  position = 'left',
  overlay = true,
  width = 280,
  onItemClick,
  className = '',
  children,
  'data-testid': dataTestId = 'slide-menu',
  ...props
}) => {
  const {
    isAnimating,
    handleItemClick,
    overlayProps,
    menuProps
  } = useSlideMenu({
    isOpen,
    onClose,
    overlay
  });

  const navigationAria = createNavigationAria({
    label: 'Slide navigation menu'
  });

  const menuStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    [position]: 0
  };

  if (!isOpen && !isAnimating) {
    return null;
  }

  return (
    <>
      {/* 오버레이 */}
      {overlay && (
        <div
          className={`slide-menu-overlay ${overlayProps.className}`}
          onClick={overlayProps.onClick}
          data-testid={`${dataTestId}-overlay`}
        />
      )}

      {/* 메뉴 */}
      <aside
        className={`slide-menu slide-menu-${position} ${menuProps.className} ${className}`}
        style={menuStyle}
        data-testid={menuProps['data-testid']}
        {...navigationAria}
        {...props}
      >
        <div className="slide-menu-content">
          {/* 헤더 */}
          <div className="slide-menu-header">
            <button
              className="slide-menu-close"
              onClick={onClose}
              aria-label="Close menu"
              data-testid={`${dataTestId}-close`}
            >
              ✕
            </button>
          </div>

          {/* 메뉴 아이템들 */}
          <nav className="slide-menu-nav">
            <ul className="slide-menu-list" role="menu">
              {items.map((item) => (
                <SlideMenuItem
                  key={item.id}
                  item={item}
                  onItemClick={(item) => handleItemClick(item, onItemClick)}
                  level={0}
                />
              ))}
            </ul>
          </nav>

          {/* 추가 콘텐츠 */}
          {children && (
            <div className="slide-menu-footer">
              {children}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

interface SlideMenuItemProps {
  item: NavigationItem;
  onItemClick: (item: NavigationItem) => void;
  level: number;
}

const SlideMenuItem: React.FC<SlideMenuItemProps> = ({
  item,
  onItemClick,
  level
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const hasChildren = item.children && item.children.length > 0;

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
      setIsExpanded(!isExpanded);
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
      case 'ArrowRight':
        if (hasChildren && !isExpanded) {
          event.preventDefault();
          setIsExpanded(true);
        }
        break;
      case 'ArrowLeft':
        if (hasChildren && isExpanded) {
          event.preventDefault();
          setIsExpanded(false);
        }
        break;
    }
  };

  const ItemContent = () => (
    <>
      {item.icon && (
        <span className="slide-menu-item-icon">{item.icon}</span>
      )}
      <span className="slide-menu-item-label">{item.label}</span>
      {hasChildren && (
        <span className={`slide-menu-item-arrow ${isExpanded ? 'expanded' : ''}`}>
          ▶
        </span>
      )}
    </>
  );

  return (
    <li className="slide-menu-item" style={{ '--level': level } as React.CSSProperties}>
      {item.href && !hasChildren ? (
        <a
          href={item.href}
          className={`slide-menu-item-link ${item.disabled ? 'disabled' : ''}`}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          tabIndex={item.disabled ? -1 : 0}
          {...itemAria}
        >
          <ItemContent />
        </a>
      ) : (
        <button
          className={`slide-menu-item-button ${item.disabled ? 'disabled' : ''} ${isExpanded ? 'expanded' : ''}`}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          disabled={item.disabled}
          {...itemAria}
        >
          <ItemContent />
        </button>
      )}

      {/* 하위 메뉴 */}
      {hasChildren && (
        <ul
          className={`slide-menu-submenu ${isExpanded ? 'expanded' : 'collapsed'}`}
          role="menu"
          aria-hidden={!isExpanded}
        >
          {item.children!.map((childItem) => (
            <SlideMenuItem
              key={childItem.id}
              item={childItem}
              onItemClick={onItemClick}
              level={level + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export default SlideMenu;