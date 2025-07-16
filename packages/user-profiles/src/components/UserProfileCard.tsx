import type { FC } from 'react';
import type { UserProfile } from '../types';
import { generateProfilePlaceholder } from '../utils';

export interface UserProfileCardProps {
  profile: UserProfile;
  showBio?: boolean;
  className?: string;
  onClick?: (profile: UserProfile) => void;
}

/**
 * UserProfileCard component for displaying user profile information
 */
export const UserProfileCard: FC<UserProfileCardProps> = ({
  profile,
  showBio = true,
  className = '',
  onClick
}) => {
  const profilePicture = profile.picture || generateProfilePlaceholder(profile.name);

  const handleClick = () => {
    if (onClick) {
      onClick(profile);
    }
  };

  return (
    <div
      className={`user-profile-card ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      } : undefined}
    >
      <div className="profile-picture">
        <img
          src={profilePicture}
          alt={`${profile.name}'s profile picture`}
          className="w-12 h-12 rounded-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = generateProfilePlaceholder(profile.name);
          }}
        />
      </div>
      
      <div className="profile-info">
        <h3 className="profile-name text-lg font-semibold">
          {profile.name}
        </h3>
        
        {showBio && profile.bio && (
          <p className="profile-bio text-gray-600 text-sm mt-1">
            {profile.bio}
          </p>
        )}
        
        <div className="profile-meta text-xs text-gray-500 mt-2">
          <span>Joined {profile.createdAt.toLocaleDateString()}</span>
          {profile.updatedAt.getTime() !== profile.createdAt.getTime() && (
            <span className="ml-2">
              • Updated {profile.updatedAt.toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};