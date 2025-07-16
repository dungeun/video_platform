import React from 'react';
import { Grid, Empty, Spinner, Select, Button } from '@revu/ui-kit';
import type { Content, ContentStatus } from '../types';
import { ContentCard } from './ContentCard';
import { useContentStore } from '../store';

interface ContentGridProps {
  contents: Content[];
  loading?: boolean;
  onContentClick?: (content: Content) => void;
  onContentEdit?: (content: Content) => void;
  onContentDelete?: (content: Content) => void;
  onContentApprove?: (content: Content) => void;
  onContentReject?: (content: Content) => void;
  emptyMessage?: string;
  showFilters?: boolean;
}

export const ContentGrid: React.FC<ContentGridProps> = ({
  contents,
  loading = false,
  onContentClick,
  onContentEdit,
  onContentDelete,
  onContentApprove,
  onContentReject,
  emptyMessage = 'No content found',
  showFilters = true
}) => {
  const { contentFilter, setContentFilter } = useContentStore();

  const handleStatusFilter = (status: ContentStatus | 'all') => {
    if (status === 'all') {
      setContentFilter({ ...contentFilter, status: undefined });
    } else {
      setContentFilter({ ...contentFilter, status: [status] });
    }
  };

  if (loading) {
    return (
      <div className="content-grid__loading">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="content-grid">
      {showFilters && (
        <div className="content-grid__filters">
          <Select
            value={contentFilter.status?.[0] || 'all'}
            onChange={handleStatusFilter as any}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'draft', label: 'Draft' },
              { value: 'in_review', label: 'In Review' },
              { value: 'approved', label: 'Approved' },
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'published', label: 'Published' },
              { value: 'rejected', label: 'Rejected' }
            ]}
          />
          
          <Select
            value={contentFilter.platform?.[0] || 'all'}
            onChange={(value) => {
              if (value === 'all') {
                setContentFilter({ ...contentFilter, platform: undefined });
              } else {
                setContentFilter({ ...contentFilter, platform: [value as any] });
              }
            }}
            options={[
              { value: 'all', label: 'All Platforms' },
              { value: 'instagram', label: 'Instagram' },
              { value: 'youtube', label: 'YouTube' },
              { value: 'tiktok', label: 'TikTok' },
              { value: 'twitter', label: 'Twitter' }
            ]}
          />
          
          <Select
            value={contentFilter.type?.[0] || 'all'}
            onChange={(value) => {
              if (value === 'all') {
                setContentFilter({ ...contentFilter, type: undefined });
              } else {
                setContentFilter({ ...contentFilter, type: [value as any] });
              }
            }}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'post', label: 'Post' },
              { value: 'story', label: 'Story' },
              { value: 'reel', label: 'Reel' },
              { value: 'video', label: 'Video' }
            ]}
          />
          
          <Button
            variant="ghost"
            size="small"
            onClick={() => setContentFilter({})}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {contents.length === 0 ? (
        <Empty message={emptyMessage} />
      ) : (
        <Grid columns={{ xs: 1, sm: 2, md: 3, lg: 4 }} gap="medium">
          {contents.map((content) => (
            <ContentCard
              key={content.id}
              content={content}
              onClick={() => onContentClick?.(content)}
              onEdit={() => onContentEdit?.(content)}
              onDelete={() => onContentDelete?.(content)}
              onApprove={() => onContentApprove?.(content)}
              onReject={() => onContentReject?.(content)}
              showMetrics={content.status === 'published'}
            />
          ))}
        </Grid>
      )}
    </div>
  );
};

export default ContentGrid;