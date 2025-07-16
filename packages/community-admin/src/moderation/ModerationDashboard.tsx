import React from 'react';
import { 
  Flag, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Eye,
  Shield
} from 'lucide-react';

export const ModerationDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Moderation Dashboard</h1>
          <p className="text-gray-600">Monitor and manage community moderation activities</p>
        </div>
        <div className="flex items-center space-x-3">
          <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option>Last 24 hours</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
          </select>
          <button className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700">
            Emergency Mode
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              High Priority Items Pending
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              You have 5 urgent reports that require immediate attention.
            </p>
          </div>
          <button className="ml-auto bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700">
            Review Now
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ModerationMetricCard
          title="Pending Reviews"
          value="24"
          change="+3"
          changeType="neutral"
          icon={Clock}
          color="orange"
        />
        <ModerationMetricCard
          title="Reports Today"
          value="18"
          change="-5"
          changeType="positive"
          icon={Flag}
          color="red"
        />
        <ModerationMetricCard
          title="Resolved Actions"
          value="156"
          change="+12"
          changeType="positive"
          icon={CheckCircle}
          color="green"
        />
        <ModerationMetricCard
          title="Response Time"
          value="2.4h"
          change="-0.3h"
          changeType="positive"
          icon={TrendingDown}
          color="blue"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority Queue */}
        <div className="lg:col-span-2">
          <PriorityQueue />
        </div>

        {/* Moderation Stats */}
        <div className="space-y-6">
          <ModerationStats />
          <AutoModerationStatus />
        </div>
      </div>

      {/* Recent Actions and Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActions />
        <ModerationTrends />
      </div>
    </div>
  );
};

interface ModerationMetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<any>;
  color: 'orange' | 'red' | 'green' | 'blue';
}

const ModerationMetricCard: React.FC<ModerationMetricCardProps> = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  color 
}) => {
  const colorClasses = {
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600'
  };

  const changeColor = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  }[changeType];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-4">
        <span className={`text-sm font-medium ${changeColor}`}>
          {change}
        </span>
        <span className="text-xs text-gray-500 ml-1">from yesterday</span>
      </div>
    </div>
  );
};

const PriorityQueue: React.FC = () => {
  const queueItems = [
    {
      id: '1',
      type: 'user_report',
      title: 'Harassment report against user @toxic_user',
      priority: 'urgent',
      reportedAt: '5 minutes ago',
      assignedTo: 'unassigned',
      description: 'Multiple users reporting threatening behavior and harassment in comments.',
      reporter: 'jane_doe'
    },
    {
      id: '2',
      type: 'content_report',
      title: 'Hate speech detected in post',
      priority: 'high',
      reportedAt: '15 minutes ago',
      assignedTo: 'moderator_john',
      description: 'Auto-moderation flagged discriminatory language.',
      reporter: 'Auto System'
    },
    {
      id: '3',
      type: 'copyright_claim',
      title: 'Copyright violation claim',
      priority: 'high',
      reportedAt: '1 hour ago',
      assignedTo: 'unassigned',
      description: 'DMCA takedown request for image in community post.',
      reporter: 'copyright_holder'
    },
    {
      id: '4',
      type: 'spam_detection',
      title: 'Spam pattern detected',
      priority: 'medium',
      reportedAt: '2 hours ago',
      assignedTo: 'moderator_sarah',
      description: 'Multiple posts with similar promotional content.',
      reporter: 'Auto System'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user_report': return <Users className="h-4 w-4" />;
      case 'content_report': return <MessageSquare className="h-4 w-4" />;
      case 'copyright_claim': return <Shield className="h-4 w-4" />;
      case 'spam_detection': return <Flag className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Priority Moderation Queue</h3>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All
          </button>
        </div>
      </div>
      <div className="p-6 space-y-4">
        {queueItems.map((item) => (
          <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  {getTypeIcon(item.type)}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
                  <p className="text-xs text-gray-500">Reported by {item.reporter} • {item.reportedAt}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(item.priority)}`}>
                {item.priority}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">{item.description}</p>
            
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {item.assignedTo === 'unassigned' ? (
                  <span className="text-orange-600 font-medium">Unassigned</span>
                ) : (
                  <span>Assigned to {item.assignedTo}</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">
                  Review
                </button>
                <button className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700">
                  Assign
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ModerationStats: React.FC = () => {
  const stats = [
    { label: 'Auto-Approved', value: 89, color: 'text-green-600' },
    { label: 'Auto-Flagged', value: 23, color: 'text-red-600' },
    { label: 'Manual Review', value: 15, color: 'text-yellow-600' },
    { label: 'User Reports', value: 8, color: 'text-blue-600' }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Today's Activity</h3>
      </div>
      <div className="p-6 space-y-4">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{stat.label}</span>
            <span className={`text-lg font-semibold ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AutoModerationStatus: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Auto-Moderation</h3>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600">System Status</span>
          <span className="flex items-center text-sm text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Online
          </span>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Accuracy Rate</span>
            <span className="text-sm font-medium text-gray-900">94.2%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Items Processed</span>
            <span className="text-sm font-medium text-gray-900">1,247</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">False Positives</span>
            <span className="text-sm font-medium text-gray-900">12</span>
          </div>
        </div>
        
        <button className="w-full mt-4 bg-gray-100 text-gray-700 py-2 px-4 rounded-md text-sm hover:bg-gray-200">
          Configure Rules
        </button>
      </div>
    </div>
  );
};

const RecentActions: React.FC = () => {
  const actions = [
    {
      id: 1,
      action: 'Post approved',
      moderator: 'john_doe',
      target: 'Welcome to our community',
      time: '2 minutes ago',
      type: 'approve'
    },
    {
      id: 2,
      action: 'User suspended',
      moderator: 'sarah_admin',
      target: '@toxic_user',
      time: '15 minutes ago',
      type: 'suspend'
    },
    {
      id: 3,
      action: 'Comment deleted',
      moderator: 'mike_mod',
      target: 'Spam comment in post #1247',
      time: '1 hour ago',
      type: 'delete'
    },
    {
      id: 4,
      action: 'Report resolved',
      moderator: 'emma_admin',
      target: 'Harassment report #892',
      time: '2 hours ago',
      type: 'resolve'
    }
  ];

  const getActionColor = (type: string) => {
    switch (type) {
      case 'approve': return 'text-green-600';
      case 'suspend': return 'text-red-600';
      case 'delete': return 'text-red-600';
      case 'resolve': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recent Actions</h3>
      </div>
      <div className="p-6 space-y-4">
        {actions.map((action) => (
          <div key={action.id} className="flex items-start space-x-3">
            <div className={`p-1 rounded-full ${getActionColor(action.type)}`}>
              <div className="w-2 h-2 bg-current rounded-full"></div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">
                <span className={`font-medium ${getActionColor(action.type)}`}>
                  {action.action}
                </span>
                {' '}by{' '}
                <span className="font-medium">{action.moderator}</span>
              </p>
              <p className="text-sm text-gray-600">{action.target}</p>
              <p className="text-xs text-gray-500">{action.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ModerationTrends: React.FC = () => {
  const trendData = [
    { day: 'Mon', reports: 12, resolved: 15 },
    { day: 'Tue', reports: 18, resolved: 20 },
    { day: 'Wed', reports: 8, resolved: 12 },
    { day: 'Thu', reports: 25, resolved: 18 },
    { day: 'Fri', reports: 15, resolved: 22 },
    { day: 'Sat', reports: 6, resolved: 8 },
    { day: 'Sun', reports: 4, resolved: 6 }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">7-Day Trend</h3>
      </div>
      <div className="p-6">
        <div className="flex items-center space-x-6 text-sm mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">Reports</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Resolved</span>
          </div>
        </div>
        
        <div className="space-y-3">
          {trendData.map((item, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-8 text-xs text-gray-600">{item.day}</div>
              <div className="flex-1 flex items-center space-x-1">
                <div 
                  className="h-3 bg-red-500 rounded"
                  style={{ width: `${(item.reports / 30) * 100}%` }}
                ></div>
                <div 
                  className="h-3 bg-green-500 rounded"
                  style={{ width: `${(item.resolved / 30) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 w-12 text-right">
                {item.reports}/{item.resolved}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModerationDashboard;