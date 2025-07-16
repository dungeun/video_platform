import React from 'react';
import { Card, Avatar, Badge, Button, Text } from '@revu/ui-kit';
import { formatNumber } from '@revu/shared-utils';
import type { InfluencerProfile } from '../types';
import { VerificationBadge } from './VerificationBadge';
import { useProfileStore } from '../store';

interface ProfileCardProps {
  profile: InfluencerProfile;
  onClick?: () => void;
  onFavorite?: () => void;
  showMetrics?: boolean;
  showActions?: boolean;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  onClick,
  onFavorite,
  showMetrics = true,
  showActions = true
}) => {
  const { toggleFavorite, isFavorite } = useProfileStore();
  const isFav = isFavorite(profile.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(profile.id);
    onFavorite?.();
  };

  return (
    <Card 
      className="profile-card" 
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="profile-card__header">
        <Avatar
          src={profile.avatar}
          alt={profile.displayName}
          size="large"
        />
        <div className="profile-card__info">
          <div className="profile-card__name">
            <Text variant="h3">{profile.displayName}</Text>
            <VerificationBadge level={profile.verification.level} />
          </div>
          <Text variant="body2" color="secondary">
            @{profile.username}
          </Text>
        </div>
        {showActions && (
          <Button
            variant="ghost"
            size="small"
            onClick={handleFavoriteClick}
            icon={isFav ? 'star-filled' : 'star'}
          />
        )}
      </div>

      <Text variant="body2" className="profile-card__bio" numberOfLines={2}>
        {profile.bio}
      </Text>

      <div className="profile-card__tags">
        {profile.category.slice(0, 3).map((cat) => (
          <Badge key={cat} variant="secondary" size="small">
            {cat}
          </Badge>
        ))}
        {profile.category.length > 3 && (
          <Badge variant="secondary" size="small">
            +{profile.category.length - 3}
          </Badge>
        )}
      </div>

      {showMetrics && (
        <div className="profile-card__metrics">
          <div className="metric">
            <Text variant="caption" color="secondary">Followers</Text>
            <Text variant="h4">{formatNumber(profile.metrics.totalFollowers)}</Text>
          </div>
          <div className="metric">
            <Text variant="caption" color="secondary">Engagement</Text>
            <Text variant="h4">{profile.metrics.averageEngagement.toFixed(1)}%</Text>
          </div>
          <div className="metric">
            <Text variant="caption" color="secondary">Reach</Text>
            <Text variant="h4">{formatNumber(profile.metrics.reachEstimate)}</Text>
          </div>
        </div>
      )}

      <div className="profile-card__platforms">
        {profile.socialAccounts.map((account) => (
          <Badge
            key={account.platform}
            variant="outline"
            size="small"
            icon={account.platform}
          >
            {formatNumber(account.followers)}
          </Badge>
        ))}
      </div>

      {showActions && (
        <div className="profile-card__actions">
          <Button variant="primary" size="small" fullWidth>
            View Profile
          </Button>
        </div>
      )}
    </Card>
  );
};

export default ProfileCard;