import React from 'react';
import { Users, MessageSquare, TrendingUp, Clock } from 'lucide-react';
import type { DashboardWidgetProps } from '../types';

export const CommunityStatsWidget: React.FC<DashboardWidgetProps> = ({ 
  widget, 
  onUpdate, 
  onRemove 
}) => {
  const [timeRange, setTimeRange] = React.useState('7d');

  const stats = {
    totalUsers: 12847,
    activeUsers: 2456,
    newUsers: 156,
    totalPosts: 8934,
    newPosts: 89,
    totalComments: 15672,
    newComments: 234,
    engagementRate: 68.4,
    avgSessionTime: '12m 34s'
  };

  const changes = {
    totalUsers: '+12.3%',
    activeUsers: '+8.7%',
    newUsers: '+23.1%',
    totalPosts: '+15.6%',
    newPosts: '+5.2%',
    totalComments: '+18.9%',
    newComments: '+12.4%',
    engagementRate: '+5.1%',
    avgSessionTime: '+2.3%'
  };

  const getChangeColor = (change: string) => {
    if (change.startsWith('+')) return 'text-green-600';
    if (change.startsWith('-')) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Widget Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Community Statistics</h3>
        <div className="flex items-center space-x-2">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          change={changes.totalUsers}
          icon={Users}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers.toLocaleString()}
          change={changes.activeUsers}
          icon={Users}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <StatCard
          title="Total Posts"
          value={stats.totalPosts.toLocaleString()}
          change={changes.totalPosts}
          icon={MessageSquare}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
        <StatCard
          title="Engagement"
          value={`${stats.engagementRate}%`}
          change={changes.engagementRate}
          icon={TrendingUp}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
        />
      </div>

      {/* Detailed Stats */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Detailed Statistics</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <DetailedStat
              label="New Users"
              value={stats.newUsers.toLocaleString()}
              change={changes.newUsers}
              period={getTimePeriodLabel(timeRange)}
            />
            <DetailedStat
              label="New Posts"
              value={stats.newPosts.toLocaleString()}
              change={changes.newPosts}
              period={getTimePeriodLabel(timeRange)}
            />
            <DetailedStat
              label="New Comments"
              value={stats.newComments.toLocaleString()}
              change={changes.newComments}
              period={getTimePeriodLabel(timeRange)}
            />
          </div>
          <div className="space-y-3">
            <DetailedStat
              label="Total Comments"
              value={stats.totalComments.toLocaleString()}
              change={changes.totalComments}
              period="all time"
            />
            <DetailedStat
              label="Avg Session Time"
              value={stats.avgSessionTime}
              change={changes.avgSessionTime}
              period={getTimePeriodLabel(timeRange)}
            />
            <DetailedStat
              label="User Growth Rate"
              value={changes.totalUsers}
              change=""
              period={getTimePeriodLabel(timeRange)}
              isRate={true}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-t border-gray-200 pt-6 mt-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Quick Actions</span>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
              Export Data
            </button>
            <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  iconBg: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  iconColor, 
  iconBg 
}) => {
  const getChangeColor = (change: string) => {
    if (change.startsWith('+')) return 'text-green-600';
    if (change.startsWith('-')) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <span className={`text-sm font-medium ${getChangeColor(change)}`}>
          {change}
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-600">{title}</p>
      </div>
    </div>
  );
};

interface DetailedStatProps {
  label: string;
  value: string;
  change: string;
  period: string;
  isRate?: boolean;
}

const DetailedStat: React.FC<DetailedStatProps> = ({ 
  label, 
  value, 
  change, 
  period, 
  isRate = false 
}) => {
  const getChangeColor = (change: string) => {
    if (change.startsWith('+')) return 'text-green-600';
    if (change.startsWith('-')) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{period}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-gray-900">
          {isRate ? (
            <span className={getChangeColor(value)}>{value}</span>
          ) : (
            value
          )}
        </p>
        {change && !isRate && (
          <p className={`text-xs ${getChangeColor(change)}`}>
            {change}
          </p>
        )}
      </div>
    </div>
  );
};

const getTimePeriodLabel = (timeRange: string): string => {
  switch (timeRange) {
    case '24h': return 'today';
    case '7d': return 'this week';
    case '30d': return 'this month';
    case '90d': return 'this quarter';
    default: return 'this period';
  }
};

export default CommunityStatsWidget;