/**
 * Breadcrumbs Component
 * 브레드크럼 컴포넌트
 */

import React from 'react';
import type { BreadcrumbProps, BreadcrumbItem } from '../types';
import { useBreadcrumbs } from '../hooks/useBreadcrumbs';
import { createBreadcrumbAria } from '../utils/accessibility';

export const Breadcrumbs: React.FC<BreadcrumbProps> = ({
  items,
  separator,
  maxItems = 4,
  showHome = true,
  homeIcon,
  onItemClick,
  className = '',
  children,
  'data-testid': dataTestId = 'breadcrumbs',
  ...props
}) => {
  const {
    visibleBreadcrumbs,
    collapsedCount,
    isCollapsed,
    showCollapsed,
    toggleCollapsed,
    handleItemClick
  } = useBreadcrumbs({
    items,
    maxItems,
    showHome,
    onItemClick
  });

  const breadcrumbAria = createBreadcrumbAria({
    label: 'Breadcrumb navigation'
  });

  const defaultSeparator = separator || (
    <span className="breadcrumb-separator" aria-hidden="true">
      /
    </span>
  );

  return (
    <nav
      className={`breadcrumbs ${className}`}
      data-testid={dataTestId}
      role="navigation"
      aria-label="Breadcrumb navigation"
      {...props}
    >
      <ol className="breadcrumb-list" role="list">
        {visibleBreadcrumbs.map((item, index) => {
          const isLast = index === visibleBreadcrumbs.length - 1;
          const isCollapsedIndicator = item.id === 'collapsed';

          return (
            <li key={item.id} className="breadcrumb-item">
              {/* 브레드크럼 아이템 */}
              <BreadcrumbItem
                item={item}
                isLast={isLast}
                isCollapsedIndicator={isCollapsedIndicator}
                onItemClick={(item) => handleItemClick(item, index)}
                homeIcon={homeIcon}
                showHome={showHome}
              />

              {/* 구분자 */}
              {!isLast && (
                <span className="breadcrumb-separator-wrapper">
                  {defaultSeparator}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {/* 접힌 아이템들 표시 */}
      {isCollapsed && showCollapsed && collapsedCount > 0 && (
        <div className="breadcrumb-collapsed-items">
          <button
            className="breadcrumb-collapse-toggle"
            onClick={toggleCollapsed}
            aria-label="Hide collapsed breadcrumb items"
          >
            Hide {collapsedCount} items
          </button>
        </div>
      )}

      {children}
    </nav>
  );
};

interface BreadcrumbItemComponentProps {
  item: BreadcrumbItem;
  isLast: boolean;
  isCollapsedIndicator: boolean;
  onItemClick: (item: BreadcrumbItem) => void;
  homeIcon?: React.ReactNode;
  showHome?: boolean;
}

const BreadcrumbItem: React.FC<BreadcrumbItemComponentProps> = ({
  item,
  isLast,
  isCollapsedIndicator,
  onItemClick,
  homeIcon,
  showHome
}) => {
  const isHome = showHome && item.id === 'home';
  const isCurrent = item.current || isLast;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (isCollapsedIndicator) {
      event.preventDefault();
      onItemClick(item);
      return;
    }

    if (isCurrent) {
      event.preventDefault();
      return;
    }

    onItemClick(item);

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

  const itemAria = {
    'aria-current': isCurrent ? ('page' as const) : undefined
  };

  // 접힌 아이템 표시
  if (isCollapsedIndicator) {
    return (
      <button
        className="breadcrumb-collapsed-indicator"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label="Show collapsed breadcrumb items"
        title="Show collapsed items"
      >
        {item.label}
      </button>
    );
  }

  // 현재 페이지 (링크가 아님)
  if (isCurrent) {
    return (
      <span
        className="breadcrumb-current"
        {...itemAria}
      >
        {isHome && homeIcon ? (
          <>
            {homeIcon}
            <span className="breadcrumb-label">{item.label}</span>
          </>
        ) : (
          item.label
        )}
      </span>
    );
  }

  // 링크 아이템
  if (item.href) {
    return (
      <a
        href={item.href}
        className="breadcrumb-link"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...itemAria}
      >
        {isHome && homeIcon ? (
          <>
            {homeIcon}
            <span className="breadcrumb-label">{item.label}</span>
          </>
        ) : (
          item.label
        )}
      </a>
    );
  }

  // 버튼 아이템
  return (
    <button
      className="breadcrumb-button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...itemAria}
    >
      {isHome && homeIcon ? (
        <>
          {homeIcon}
          <span className="breadcrumb-label">{item.label}</span>
        </>
      ) : (
        item.label
      )}
    </button>
  );
};

export default Breadcrumbs;