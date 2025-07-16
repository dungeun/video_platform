import React from 'react';
import { Flag, Clock, AlertTriangle, CheckCircle, XCircle, Filter } from 'lucide-react';
import type { ModerationLayoutProps } from '../types';

export const ModerationLayout: React.FC<ModerationLayoutProps> = ({
  children,
  queue,
  filters
}) => {
  return (
    <div className="flex h-full space-x-6">
      {/* Moderation Queue Sidebar */}
      <div className="w-80 bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Flag className="h-5 w-5 text-orange-500 mr-2" />
              Moderation Queue
            </h3>
            <div className="flex items-center space-x-2">
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Queue Stats */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">24</div>
              <div className="text-xs text-gray-500">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">156</div>
              <div className="text-xs text-gray-500">Resolved</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        {filters && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            {filters}
          </div>
        )}

        {/* Queue Items */}
        <div className="flex-1 overflow-y-auto">
          {queue || <DefaultQueue />}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200">
        {children}
      </div>
    </div>
  );
};

const DefaultQueue: React.FC = () => {
  const queueItems = [
    {
      id: '1',
      type: 'post',
      title: 'Inappropriate content in community post',
      priority: 'high',
      reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      reporterName: 'john_doe',
      contentPreview: 'This post contains inappropriate language and violates our community guidelines...',
      status: 'pending'
    },
    {
      id: '2',
      type: 'comment',
      title: 'Spam comment detected',
      priority: 'medium',
      reportedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      reporterName: 'Auto Moderation',
      contentPreview: 'Check out this amazing deal! Click here to buy now...',
      status: 'investigating'
    },
    {
      id: '3',
      type: 'user',
      title: 'Harassment report against user',
      priority: 'urgent',
      reportedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      reporterName: 'jane_smith',
      contentPreview: 'User has been sending threatening messages and harassing other members...',
      status: 'pending'
    },
    {
      id: '4',
      type: 'post',
      title: 'Copyright violation claim',
      priority: 'high',
      reportedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      reporterName: 'copyright_owner',
      contentPreview: 'This post contains copyrighted images that belong to our company...',
      status: 'assigned'
    },
    {
      id: '5',
      type: 'comment',
      title: 'Hate speech in comment thread',
      priority: 'urgent',
      reportedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      reporterName: 'community_member',
      contentPreview: 'Comment contains hate speech and discriminatory language...',
      status: 'pending'
    }
  ];

  return (
    <div className="p-4 space-y-3">
      {queueItems.map((item) => (
        <QueueItem key={item.id} item={item} />
      ))}
    </div>
  );
};

interface QueueItemProps {
  item: {
    id: string;
    type: 'post' | 'comment' | 'user';
    title: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    reportedAt: Date;
    reporterName: string;
    contentPreview: string;
    status: 'pending' | 'investigating' | 'assigned';
  };
}

const QueueItem: React.FC<QueueItemProps> = ({ item }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'investigating':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'assigned':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'post':
        return '📝';
      case 'comment':
        return '💬';
      case 'user':
        return '👤';
      default:
        return '❓';
    }
  };

  const timeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getTypeIcon(item.type)}</span>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
            {item.priority}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          {getStatusIcon(item.status)}
          <span className="text-xs text-gray-500">{timeAgo(item.reportedAt)}</span>
        </div>
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
        {item.title}
      </h4>

      {/* Content Preview */}
      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
        {item.contentPreview}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Reported by {item.reporterName}</span>
        <span className="capitalize">{item.status}</span>
      </div>
    </div>
  );
};

export default ModerationLayout;