import React from 'react';
import { Users, MessageSquare, Flag, BarChart3, Settings, Bell } from 'lucide-react';
import type { CommunityAdminLayoutProps } from '../types';

export const CommunityAdminLayout: React.FC<CommunityAdminLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
  sidebar
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Community Admin</h1>
              </div>
              {title && (
                <div className="hidden sm:block">
                  <div className="text-sm text-gray-500">/</div>
                  <div className="ml-2">
                    <h2 className="text-lg font-medium text-gray-900">{title}</h2>
                    {subtitle && (
                      <p className="text-sm text-gray-600">{subtitle}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              
              {/* Actions */}
              {actions && (
                <div className="flex items-center space-x-2">
                  {actions}
                </div>
              )}
              
              {/* User Menu */}
              <div className="flex items-center space-x-2">
                <img
                  className="h-8 w-8 rounded-full"
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt="User avatar"
                />
                <span className="text-sm font-medium text-gray-700">Admin</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]">
          {sidebar || <DefaultSidebar />}
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-73px)]">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const DefaultSidebar: React.FC = () => {
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '#',
      icon: BarChart3,
      current: true,
      badge: null
    },
    {
      name: 'Content Management',
      href: '#',
      icon: MessageSquare,
      current: false,
      badge: null,
      children: [
        { name: 'Posts', href: '#', current: false },
        { name: 'Comments', href: '#', current: false },
        { name: 'Media', href: '#', current: false },
        { name: 'Categories', href: '#', current: false }
      ]
    },
    {
      name: 'User Management',
      href: '#',
      icon: Users,
      current: false,
      badge: null,
      children: [
        { name: 'All Users', href: '#', current: false },
        { name: 'Roles & Permissions', href: '#', current: false },
        { name: 'User Reports', href: '#', current: false },
        { name: 'Banned Users', href: '#', current: false }
      ]
    },
    {
      name: 'Moderation',
      href: '#',
      icon: Flag,
      current: false,
      badge: 5,
      children: [
        { name: 'Queue', href: '#', current: false, badge: 5 },
        { name: 'Reports', href: '#', current: false, badge: 3 },
        { name: 'Auto Rules', href: '#', current: false },
        { name: 'Escalations', href: '#', current: false, badge: 1 }
      ]
    },
    {
      name: 'Analytics',
      href: '#',
      icon: BarChart3,
      current: false,
      badge: null,
      children: [
        { name: 'Overview', href: '#', current: false },
        { name: 'Content Analytics', href: '#', current: false },
        { name: 'User Analytics', href: '#', current: false },
        { name: 'Engagement', href: '#', current: false },
        { name: 'Reports', href: '#', current: false }
      ]
    },
    {
      name: 'Settings',
      href: '#',
      icon: Settings,
      current: false,
      badge: null,
      children: [
        { name: 'General', href: '#', current: false },
        { name: 'Moderation Rules', href: '#', current: false },
        { name: 'Notifications', href: '#', current: false },
        { name: 'Integrations', href: '#', current: false }
      ]
    }
  ];

  return (
    <nav className="p-4 space-y-2">
      {navigationItems.map((item) => (
        <SidebarItem key={item.name} item={item} />
      ))}
    </nav>
  );
};

interface SidebarItemProps {
  item: {
    name: string;
    href: string;
    icon: React.ComponentType<any>;
    current: boolean;
    badge?: number | null;
    children?: Array<{
      name: string;
      href: string;
      current: boolean;
      badge?: number;
    }>;
  };
}

const SidebarItem: React.FC<SidebarItemProps> = ({ item }) => {
  const [isExpanded, setIsExpanded] = React.useState(item.current || item.children?.some(child => child.current));

  return (
    <div>
      <button
        onClick={() => item.children && setIsExpanded(!isExpanded)}
        className={`
          w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md
          ${item.current 
            ? 'bg-blue-100 text-blue-700' 
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }
        `}
      >
        <div className="flex items-center space-x-3">
          <item.icon className={`h-5 w-5 ${item.current ? 'text-blue-500' : 'text-gray-400'}`} />
          <span>{item.name}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {item.badge && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {item.badge}
            </span>
          )}
          {item.children && (
            <svg
              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      </button>

      {item.children && isExpanded && (
        <div className="ml-8 mt-1 space-y-1">
          {item.children.map((child) => (
            <a
              key={child.name}
              href={child.href}
              className={`
                flex items-center justify-between px-3 py-1.5 text-sm rounded-md
                ${child.current 
                  ? 'bg-blue-50 text-blue-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <span>{child.name}</span>
              {child.badge && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {child.badge}
                </span>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityAdminLayout;