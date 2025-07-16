import React from 'react';
import { Grid, Empty, Spinner } from '@revu/ui-kit';
import type { InfluencerProfile } from '../types';
import { ProfileCard } from './ProfileCard';
import { useProfileStore } from '../store';

interface ProfileGridProps {
  profiles: InfluencerProfile[];
  loading?: boolean;
  onProfileClick?: (profile: InfluencerProfile) => void;
  emptyMessage?: string;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
}

export const ProfileGrid: React.FC<ProfileGridProps> = ({
  profiles,
  loading = false,
  onProfileClick,
  emptyMessage = 'No profiles found',
  columns = { xs: 1, sm: 2, md: 3, lg: 4 }
}) => {
  const { viewMode } = useProfileStore();

  if (loading) {
    return (
      <div className="profile-grid__loading">
        <Spinner size="large" />
      </div>
    );
  }

  if (profiles.length === 0) {
    return <Empty message={emptyMessage} />;
  }

  if (viewMode === 'list') {
    return (
      <div className="profile-list">
        {profiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            onClick={() => onProfileClick?.(profile)}
          />
        ))}
      </div>
    );
  }

  return (
    <Grid columns={columns} gap="medium" className="profile-grid">
      {profiles.map((profile) => (
        <ProfileCard
          key={profile.id}
          profile={profile}
          onClick={() => onProfileClick?.(profile)}
        />
      ))}
    </Grid>
  );
};

export default ProfileGrid;