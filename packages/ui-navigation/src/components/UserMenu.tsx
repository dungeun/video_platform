/**
 * UserMenu Component
 * 사용자 메뉴 컴포넌트
 */

import React from 'react';
import { UserMenuProps, UserMenuItem, UserInfo } from '../types';
import { useUserMenu } from '../hooks/useUserMenu';
import { createButtonAria, createMenuItemAria } from '../utils/accessibility';

export const UserMenu: React.FC<UserMenuProps> = ({
  user,
  items,
  avatarSrc,
  showAvatar = true,
  showName = true,
  position = 'bottom-right',
  onItemClick,
  className = '',
  children,
  'data-testid': dataTestId = 'user-menu',
  ...props
}) => {
  const {
    isOpen,
    handleItemClick,
    menuProps,
    triggerProps
  } = useUserMenu({
    user,
    items,
    onItemClick
  });

  const triggerAria = createButtonAria({
    label: `User menu for ${user.name}`,
    expanded: isOpen,
    hasPopup: true,
    controls: `${dataTestId}-dropdown`
  });

  return (
    <div
      className={`user-menu user-menu-${position} ${className}`}
      data-testid={dataTestId}
      {...props}
    >
      {/* 사용자 메뉴 트리거 */}
      <button
        {...triggerProps}
        className={`user-menu-trigger ${isOpen ? 'active' : ''}`}
        {...triggerAria}
        data-testid={`${dataTestId}-trigger`}
      >
        <UserAvatar 
          user={user} 
          avatarSrc={avatarSrc}
          showAvatar={showAvatar}
          showName={showName}
        />
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div
          {...menuProps}
          id={`${dataTestId}-dropdown`}
          className={`user-menu-dropdown user-menu-dropdown-${position} ${menuProps.className}`}
          role="menu"
          aria-labelledby={`${dataTestId}-trigger`}
          data-testid={`${dataTestId}-dropdown`}
        >
          {/* 사용자 정보 헤더 */}
          <div className="user-menu-header">
            <UserInfo user={user} avatarSrc={avatarSrc} />
          </div>

          {/* 메뉴 아이템들 */}
          <div className="user-menu-items">
            {items.map((item, index) => (
              <UserMenuItemComponent
                key={item.id}
                item={item}
                onClick={() => handleItemClick(item)}
                dataTestId={`${dataTestId}-item-${index}`}
              />
            ))}
          </div>

          {/* 추가 콘텐츠 */}
          {children && (
            <div className="user-menu-footer">
              {children}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface UserAvatarProps {
  user: UserInfo;
  avatarSrc?: string;
  showAvatar: boolean;
  showName: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  avatarSrc,
  showAvatar,
  showName
}) => {
  const avatar = avatarSrc || user.avatar;

  return (
    <div className="user-menu-avatar-container">
      {showAvatar && (
        <div className="user-menu-avatar">
          {avatar ? (
            <img
              src={avatar}
              alt={`${user.name} avatar`}
              className="user-menu-avatar-image"
            />
          ) : (
            <div className="user-menu-avatar-placeholder">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}

      {showName && (
        <div className="user-menu-user-info">
          <span className="user-menu-user-name">{user.name}</span>
          {user.role && (
            <span className="user-menu-user-role">{user.role}</span>
          )}
        </div>
      )}

      <span className="user-menu-dropdown-arrow">▼</span>
    </div>
  );
};

interface UserInfoProps {
  user: UserInfo;
  avatarSrc?: string;
}

const UserInfo: React.FC<UserInfoProps> = ({ user, avatarSrc }) => {
  const avatar = avatarSrc || user.avatar;

  return (
    <div className="user-menu-user-details">
      <div className="user-menu-user-avatar">
        {avatar ? (
          <img
            src={avatar}
            alt={`${user.name} avatar`}
            className="user-menu-user-avatar-image"
          />
        ) : (
          <div className="user-menu-user-avatar-placeholder">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="user-menu-user-text">
        <div className="user-menu-user-name">{user.name}</div>
        {user.email && (
          <div className="user-menu-user-email">{user.email}</div>
        )}
        {user.role && (
          <div className="user-menu-user-role">{user.role}</div>
        )}
      </div>
    </div>
  );
};

interface UserMenuItemComponentProps {
  item: UserMenuItem;
  onClick: () => void;
  dataTestId: string;
}

const UserMenuItemComponent: React.FC<UserMenuItemComponentProps> = ({
  item,
  onClick,
  dataTestId
}) => {
  // 구분선
  if (item.divider) {
    return <div className="user-menu-divider" role="separator" />;
  }

  const itemAria = createMenuItemAria({
    disabled: item.disabled
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
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick(event as any);
    }
  };

  const itemClasses = [
    'user-menu-item',
    item.disabled ? 'disabled' : '',
    item.danger ? 'danger' : ''
  ].filter(Boolean).join(' ');

  if (item.href) {
    return (
      <a
        href={item.href}
        className={itemClasses}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={item.disabled ? -1 : 0}
        data-testid={dataTestId}
        {...itemAria}
      >
        {item.icon && (
          <span className="user-menu-item-icon">{item.icon}</span>
        )}
        <span className="user-menu-item-label">{item.label}</span>
      </a>
    );
  }

  return (
    <button
      className={itemClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={item.disabled}
      data-testid={dataTestId}
      {...itemAria}
    >
      {item.icon && (
        <span className="user-menu-item-icon">{item.icon}</span>
      )}
      <span className="user-menu-item-label">{item.label}</span>
    </button>
  );
};

export default UserMenu;