/**
 * @repo/user-profiles
 * 
 * User Profile Management Module
 * Provides CRUD operations for user profile information (name, picture, bio)
 */

// Types
export * from './types';

// Services
export * from './services';

// Components
export * from './components';

// Hooks
export * from './hooks';

// Utils
export * from './utils';

// Default export for convenience
export { UserProfileService } from './services';
export { useUserProfile, useUserProfiles } from './hooks';
export { UserProfileCard, UserProfileForm, UserProfileList } from './components';