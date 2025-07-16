/**
 * User Profile Types
 */

export interface UserProfile {
  id: string;
  name: string;
  picture?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserProfileInput {
  id: string;
  name: string;
  picture?: string;
  bio?: string;
}

export interface UpdateUserProfileInput {
  name?: string;
  picture?: string;
  bio?: string;
}

export interface UserProfileFilters {
  name?: string;
  hasProfilePicture?: boolean;
}

export interface UserProfileQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: keyof UserProfile;
  sortOrder?: 'asc' | 'desc';
  filters?: UserProfileFilters;
}

export interface UserProfileServiceConfig {
  tableName?: string;
  maxBioLength?: number;
  allowedImageFormats?: string[];
}

// Events
export interface UserProfileEvents {
  'profile:created': { profile: UserProfile };
  'profile:updated': { profile: UserProfile; changes: UpdateUserProfileInput };
  'profile:deleted': { profileId: string };
}

// Validation
export interface UserProfileValidationRules {
  nameMinLength: number;
  nameMaxLength: number;
  bioMaxLength: number;
  pictureMaxSize: number;
}