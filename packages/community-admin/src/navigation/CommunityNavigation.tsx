import React from 'react';
import { 
  Home, 
  Users, 
  MessageSquare, 
  Flag, 
  BarChart3, 
  Settings,
  FileText,
  Image,
  Tag,
  UserCheck,
  Shield,
  AlertTriangle,
  TrendingUp,
  Bell,
  Search
} from 'lucide-react';

interface NavigationItem {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  current?: boolean;
  badge?: number;
  children?: NavigationItem[];
}

export const CommunityNavigation: React.FC = () => {
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set(['content', 'moderation']));

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      href: '/community-admin',
      icon: Home,
      current: true
    },
    {
      id: 'content',
      name: 'Content Management',
      href: '/community-admin/content',
      icon: MessageSquare,
      children: [
        {
          id: 'posts',
          name: 'Posts',
          href: '/community-admin/content/posts',
          icon: FileText,
          badge: 12
        },
        {
          id: 'comments',
          name: 'Comments',
          href: '/community-admin/content/comments',
          icon: MessageSquare,
          badge: 8
        },
        {
          id: 'media',
          name: 'Media',
          href: '/community-admin/content/media',
          icon: Image,
          badge: 3
        },
        {
          id: 'categories',
          name: 'Categories',
          href: '/community-admin/content/categories',
          icon: Tag
        }
      ]
    },
    {
      id: 'users',
      name: 'User Management',
      href: '/community-admin/users',
      icon: Users,
      children: [
        {
          id: 'all-users',
          name: 'All Users',
          href: '/community-admin/users/all',
          icon: Users
        },
        {
          id: 'roles',
          name: 'Roles & Permissions',
          href: '/community-admin/users/roles',
          icon: UserCheck
        },
        {
          id: 'user-reports',
          name: 'User Reports',
          href: '/community-admin/users/reports',
          icon: Flag,
          badge: 5
        },
        {
          id: 'banned-users',
          name: 'Banned Users',
          href: '/community-admin/users/banned',
          icon: Shield,
          badge: 2
        }
      ]
    },
    {
      id: 'moderation',
      name: 'Moderation',
      href: '/community-admin/moderation',
      icon: Flag,
      badge: 15,
      children: [
        {
          id: 'queue',
          name: 'Moderation Queue',
          href: '/community-admin/moderation/queue',
          icon: Flag,
          badge: 15
        },
        {
          id: 'reports',
          name: 'Reports',
          href: '/community-admin/moderation/reports',
          icon: AlertTriangle,
          badge: 7
        },
        {
          id: 'auto-rules',
          name: 'Auto Moderation',
          href: '/community-admin/moderation/auto-rules',
          icon: Shield
        },
        {
          id: 'escalations',
          name: 'Escalations',
          href: '/community-admin/moderation/escalations',
          icon: TrendingUp,
          badge: 2
        }
      ]
    },
    {
      id: 'analytics',
      name: 'Analytics',
      href: '/community-admin/analytics',
      icon: BarChart3,
      children: [
        {
          id: 'overview',
          name: 'Overview',
          href: '/community-admin/analytics/overview',
          icon: BarChart3
        },
        {
          id: 'content-analytics',
          name: 'Content Analytics',
          href: '/community-admin/analytics/content',
          icon: FileText
        },
        {
          id: 'user-analytics',
          name: 'User Analytics',
          href: '/community-admin/analytics/users',
          icon: Users
        },
        {
          id: 'engagement',
          name: 'Engagement',
          href: '/community-admin/analytics/engagement',
          icon: TrendingUp
        }
      ]
    },
    {
      id: 'notifications',
      name: 'Notifications',
      href: '/community-admin/notifications',
      icon: Bell,
      badge: 3
    },
    {
      id: 'settings',
      name: 'Settings',
      href: '/community-admin/settings',
      icon: Settings,
      children: [
        {
          id: 'general',
          name: 'General',
          href: '/community-admin/settings/general',
          icon: Settings
        },
        {
          id: 'moderation-rules',
          name: 'Moderation Rules',
          href: '/community-admin/settings/moderation',
          icon: Shield
        },
        {
          id: 'notification-settings',
          name: 'Notification Settings',
          href: '/community-admin/settings/notifications',
          icon: Bell
        }
      ]
    }
  ];

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <nav className="h-full overflow-y-auto">
      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search admin..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Navigation Items */}
      <div className="p-4 space-y-1">
        {navigationItems.map((item) => (
          <NavigationItem
            key={item.id}
            item={item}
            isExpanded={expandedItems.has(item.id)}
            onToggle={toggleExpanded}
          />
        ))}
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-t border-gray-200">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Quick Stats
        </h4>
        <div className="space-y-2">
          <QuickStat label="Pending Reviews" value="24" trend="+3" />
          <QuickStat label="Active Users" value="1,247" trend="+12%" />
          <QuickStat label="Reports Today" value="8" trend="-2" />
        </div>
      </div>
    </nav>
  );
};

interface NavigationItemProps {
  item: NavigationItem;
  isExpanded: boolean;
  onToggle: (itemId: string) => void;
  depth?: number;
}

const NavigationItem: React.FC<NavigationItemProps> = ({ 
  item, 
  isExpanded, 
  onToggle, 
  depth = 0 
}) => {
  const hasChildren = item.children && item.children.length > 0;
  const paddingLeft = depth === 0 ? 'pl-3' : 'pl-8';

  return (
    <div>
      <button
        onClick={() => hasChildren ? onToggle(item.id) : undefined}
        className={`
          w-full flex items-center justify-between ${paddingLeft} pr-3 py-2 text-sm font-medium rounded-lg
          transition-colors duration-150 ease-in-out group
          ${item.current 
            ? 'bg-blue-100 text-blue-700' 
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }
        `}
      >
        <div className="flex items-center space-x-3">
          <item.icon 
            className={`h-5 w-5 ${
              item.current ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
            }`} 
          />
          <span>{item.name}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {item.badge && (
            <span className={`
              inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
              ${item.badge > 0 
                ? 'bg-red-100 text-red-800' 
                : 'bg-gray-100 text-gray-800'
              }
            `}>
              {item.badge}
            </span>
          )}
          {hasChildren && (
            <svg
              className={`h-4 w-4 transition-transform duration-150 ${
                isExpanded ? 'rotate-90' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 5l7 7-7 7" 
              />
            </svg>
          )}
        </div>
      </button>

      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {item.children!.map((child) => (
            <NavigationItem
              key={child.id}
              item={child}
              isExpanded={false}
              onToggle={onToggle}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface QuickStatProps {
  label: string;
  value: string;
  trend: string;
}

const QuickStat: React.FC<QuickStatProps> = ({ label, value, trend }) => {
  const isPositive = trend.startsWith('+');
  const isNegative = trend.startsWith('-');

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-600">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
      <span className={`
        text-xs font-medium
        ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600'}
      `}>
        {trend}
      </span>
    </div>
  );
};

export default CommunityNavigation;