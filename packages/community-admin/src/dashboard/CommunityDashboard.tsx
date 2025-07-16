import React from 'react';
import { 
  Users, 
  MessageSquare, 
  Flag, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Heart,
  Share2,
  MoreVertical
} from 'lucide-react';

export const CommunityDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community Dashboard</h1>
          <p className="text-gray-600">Monitor and manage your community activity</p>
        </div>
        <div className="flex items-center space-x-3">
          <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value="12,847"
          change="+12.3%"
          changeType="positive"
          icon={Users}
          description="Active community members"
        />
        <MetricCard
          title="Posts Today"
          value="156"
          change="+8.2%"
          changeType="positive"
          icon={MessageSquare}
          description="New posts created"
        />
        <MetricCard
          title="Pending Reviews"
          value="24"
          change="-15.7%"
          changeType="negative"
          icon={Flag}
          description="Items awaiting moderation"
        />
        <MetricCard
          title="Engagement Rate"
          value="68.4%"
          change="+5.1%"
          changeType="positive"
          icon={TrendingUp}
          description="User interaction rate"
        />
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Community Activity</h3>
          <ActivityChart />
        </div>

        {/* Moderation Queue */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Moderation Queue</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </button>
          </div>
          <ModerationQueue />
        </div>
      </div>

      {/* Recent Activity and Top Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <RecentActivity />
        </div>

        {/* Top Content */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Content</h3>
          <TopContent />
        </div>
      </div>

      {/* Community Health */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Community Health</h3>
        <CommunityHealth />
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<any>;
  description: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  description 
}) => {
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
        <div className="p-3 bg-blue-50 rounded-lg">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className={`text-sm font-medium ${changeColor}`}>
          {change}
        </span>
        <span className="text-xs text-gray-500">{description}</span>
      </div>
    </div>
  );
};

const ActivityChart: React.FC = () => {
  // Mock data for the chart
  const data = [
    { day: 'Mon', posts: 45, comments: 120, users: 89 },
    { day: 'Tue', posts: 52, comments: 145, users: 95 },
    { day: 'Wed', posts: 38, comments: 98, users: 76 },
    { day: 'Thu', posts: 61, comments: 167, users: 112 },
    { day: 'Fri', posts: 73, comments: 201, users: 134 },
    { day: 'Sat', posts: 28, comments: 87, users: 65 },
    { day: 'Sun', posts: 31, comments: 92, users: 71 }
  ];

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-gray-600">Posts</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-gray-600">Comments</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span className="text-gray-600">Active Users</span>
        </div>
      </div>

      {/* Simple bar chart representation */}
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-4">
            <div className="w-10 text-xs text-gray-600">{item.day}</div>
            <div className="flex-1 flex items-center space-x-1">
              <div 
                className="h-4 bg-blue-500 rounded"
                style={{ width: `${(item.posts / 80) * 100}%` }}
              ></div>
              <div 
                className="h-4 bg-green-500 rounded"
                style={{ width: `${(item.comments / 250) * 100}%` }}
              ></div>
              <div 
                className="h-4 bg-purple-500 rounded"
                style={{ width: `${(item.users / 150) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ModerationQueue: React.FC = () => {
  const queueItems = [
    {
      id: 1,
      type: 'post',
      title: 'Inappropriate content report',
      priority: 'high',
      timeAgo: '2h ago'
    },
    {
      id: 2,
      type: 'comment',
      title: 'Spam detection alert',
      priority: 'medium',
      timeAgo: '4h ago'
    },
    {
      id: 3,
      type: 'user',
      title: 'Harassment complaint',
      priority: 'urgent',
      timeAgo: '1h ago'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-3">
      {queueItems.map((item) => (
        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white rounded-lg">
              {item.type === 'post' && <MessageSquare className="h-4 w-4 text-blue-600" />}
              {item.type === 'comment' && <MessageSquare className="h-4 w-4 text-green-600" />}
              {item.type === 'user' && <Users className="h-4 w-4 text-purple-600" />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{item.title}</p>
              <p className="text-xs text-gray-500">{item.timeAgo}</p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
            {item.priority}
          </span>
        </div>
      ))}
    </div>
  );
};

const RecentActivity: React.FC = () => {
  const activities = [
    {
      id: 1,
      type: 'moderation',
      message: 'Post flagged for review by auto-moderator',
      time: '2 minutes ago',
      icon: Flag,
      iconColor: 'text-orange-600'
    },
    {
      id: 2,
      type: 'user',
      message: 'New user registered: john_doe',
      time: '15 minutes ago',
      icon: Users,
      iconColor: 'text-green-600'
    },
    {
      id: 3,
      type: 'content',
      message: 'High engagement post detected',
      time: '1 hour ago',
      icon: TrendingUp,
      iconColor: 'text-blue-600'
    },
    {
      id: 4,
      type: 'moderation',
      message: 'Comment approved by moderator',
      time: '2 hours ago',
      icon: CheckCircle,
      iconColor: 'text-green-600'
    }
  ];

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-3">
          <div className={`p-2 rounded-lg bg-gray-100`}>
            <activity.icon className={`h-4 w-4 ${activity.iconColor}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-900">{activity.message}</p>
            <p className="text-xs text-gray-500">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const TopContent: React.FC = () => {
  const topPosts = [
    {
      id: 1,
      title: 'Welcome to our community guidelines',
      author: 'admin',
      views: 1247,
      likes: 89,
      comments: 23
    },
    {
      id: 2,
      title: 'Tips for new members',
      author: 'moderator_jane',
      views: 892,
      likes: 67,
      comments: 18
    },
    {
      id: 3,
      title: 'Weekly community highlights',
      author: 'community_team',
      views: 756,
      likes: 54,
      comments: 12
    }
  ];

  return (
    <div className="space-y-4">
      {topPosts.map((post) => (
        <div key={post.id} className="border-b border-gray-200 pb-4 last:border-b-0">
          <h4 className="text-sm font-medium text-gray-900 mb-1">{post.title}</h4>
          <p className="text-xs text-gray-500 mb-2">by {post.author}</p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Eye className="h-3 w-3" />
              <span>{post.views}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Heart className="h-3 w-3" />
              <span>{post.likes}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageSquare className="h-3 w-3" />
              <span>{post.comments}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const CommunityHealth: React.FC = () => {
  const healthMetrics = [
    {
      name: 'Overall Health',
      score: 85,
      status: 'Good',
      color: 'bg-green-500'
    },
    {
      name: 'Content Quality',
      score: 78,
      status: 'Good',
      color: 'bg-green-500'
    },
    {
      name: 'User Engagement',
      score: 92,
      status: 'Excellent',
      color: 'bg-green-500'
    },
    {
      name: 'Moderation Load',
      score: 67,
      status: 'Fair',
      color: 'bg-yellow-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {healthMetrics.map((metric) => (
        <div key={metric.name} className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-3">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-200"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - metric.score / 100)}`}
                className={metric.color.replace('bg-', 'text-')}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-900">{metric.score}</span>
            </div>
          </div>
          <h4 className="text-sm font-medium text-gray-900">{metric.name}</h4>
          <p className={`text-xs mt-1 ${metric.color.replace('bg-', 'text-')}`}>
            {metric.status}
          </p>
        </div>
      ))}
    </div>
  );
};

export default CommunityDashboard;