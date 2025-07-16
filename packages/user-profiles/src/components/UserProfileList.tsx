import type { FC } from 'react';
import type { UserProfile } from '../types';
import { UserProfileCard } from './UserProfileCard';

export interface UserProfileListProps {
  profiles: UserProfile[];
  loading?: boolean;
  error?: string | null;
  onProfileClick?: (profile: UserProfile) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  className?: string;
  emptyMessage?: string;
}

/**
 * UserProfileList component for displaying a list of user profiles
 */
export const UserProfileList: FC<UserProfileListProps> = ({
  profiles,
  loading = false,
  error = null,
  onProfileClick,
  onLoadMore,
  hasMore = false,
  className = '',
  emptyMessage = 'No profiles found'
}) => {
  if (error) {
    return (
      <div className={`user-profile-list-error ${className}`}>
        <div className="text-red-600 p-4 border border-red-200 rounded-md bg-red-50">
          <p className="font-medium">Error loading profiles</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!loading && profiles.length === 0) {
    return (
      <div className={`user-profile-list-empty ${className}`}>
        <div className="text-gray-500 p-8 text-center">
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`user-profile-list ${className}`}>
      <div className="profiles-grid grid gap-4">
        {profiles.map((profile) => (
          <UserProfileCard
            key={profile.id}
            profile={profile}
            onClick={onProfileClick}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          />
        ))}
      </div>

      {loading && (
        <div className="loading-indicator p-8 text-center">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading profiles...</span>
          </div>
        </div>
      )}

      {hasMore && !loading && onLoadMore && (
        <div className="load-more-section pt-6 text-center">
          <button
            onClick={onLoadMore}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};