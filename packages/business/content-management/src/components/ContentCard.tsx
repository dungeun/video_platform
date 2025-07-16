import React from 'react';
import { Card, Text, Badge, Button, Avatar, Image } from '@revu/ui-kit';
import { formatDate, formatRelativeTime } from '@revu/shared-utils';
import type { Content } from '../types';

interface ContentCardProps {
  content: Content;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  showActions?: boolean;
  showMetrics?: boolean;
}

export const ContentCard: React.FC<ContentCardProps> = ({
  content,
  onClick,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  showActions = true,
  showMetrics = false
}) => {
  const getStatusColor = (status: Content['status']) => {
    const colors = {
      draft: 'secondary',
      in_review: 'warning',
      approved: 'success',
      scheduled: 'info',
      published: 'primary',
      rejected: 'error',
      archived: 'secondary'
    };
    return colors[status] || 'secondary';
  };

  const getPlatformIcon = (platform: Content['platform']) => {
    return platform; // Assuming icon names match platform names
  };

  return (
    <Card 
      className="content-card"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="content-card__header">
        <div className="content-card__meta">
          <Badge
            variant={getStatusColor(content.status)}
            size="small"
          >
            {content.status}
          </Badge>
          <Badge
            variant="outline"
            size="small"
            icon={getPlatformIcon(content.platform)}
          >
            {content.platform}
          </Badge>
          <Badge variant="outline" size="small">
            {content.type}
          </Badge>
        </div>
      </div>

      <div className="content-card__body">
        <Text variant="h4" numberOfLines={1}>
          {content.title}
        </Text>
        
        {content.media.length > 0 && (
          <div className="content-card__media-preview">
            {content.media[0].type === 'image' ? (
              <Image
                src={content.media[0].thumbnailUrl || content.media[0].url}
                alt={content.title}
                aspectRatio="16:9"
                objectFit="cover"
              />
            ) : (
              <div className="video-placeholder">
                <Badge variant="dark">Video</Badge>
              </div>
            )}
            {content.media.length > 1 && (
              <div className="media-count">
                +{content.media.length - 1}
              </div>
            )}
          </div>
        )}

        <Text variant="body2" color="secondary" numberOfLines={2}>
          {content.caption || content.description}
        </Text>

        <div className="content-card__tags">
          {content.hashtags.slice(0, 3).map((tag) => (
            <Text key={tag} variant="caption" color="primary">
              #{tag}
            </Text>
          ))}
          {content.hashtags.length > 3 && (
            <Text variant="caption" color="secondary">
              +{content.hashtags.length - 3} more
            </Text>
          )}
        </div>
      </div>

      <div className="content-card__footer">
        <div className="content-card__dates">
          {content.scheduledAt ? (
            <Text variant="caption" color="secondary">
              Scheduled: {formatDate(content.scheduledAt)}
            </Text>
          ) : content.publishedAt ? (
            <Text variant="caption" color="secondary">
              Published: {formatRelativeTime(content.publishedAt)}
            </Text>
          ) : (
            <Text variant="caption" color="secondary">
              Created: {formatRelativeTime(content.createdAt)}
            </Text>
          )}
        </div>

        {showMetrics && content.performance && (
          <div className="content-card__metrics">
            <div className="metric">
              <Text variant="caption" color="secondary">Views</Text>
              <Text variant="body2">{content.performance.views}</Text>
            </div>
            <div className="metric">
              <Text variant="caption" color="secondary">Engagement</Text>
              <Text variant="body2">{content.performance.engagement}%</Text>
            </div>
          </div>
        )}

        {showActions && (
          <div className="content-card__actions">
            {content.status === 'draft' && (
              <>
                <Button size="small" variant="ghost" onClick={onEdit}>
                  Edit
                </Button>
                <Button size="small" variant="ghost" onClick={onDelete}>
                  Delete
                </Button>
              </>
            )}
            {content.status === 'in_review' && (
              <>
                <Button size="small" variant="success" onClick={onApprove}>
                  Approve
                </Button>
                <Button size="small" variant="error" onClick={onReject}>
                  Reject
                </Button>
              </>
            )}
            {content.status === 'published' && showMetrics && (
              <Button size="small" variant="ghost">
                View Analytics
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ContentCard;