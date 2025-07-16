# @company/user-profiles

User Profile Management Module providing CRUD operations for user profile information including name, picture, and bio.

## Features

- ✅ **CRUD Operations**: Create, Read, Update, Delete user profiles
- ✅ **Validation**: Built-in input validation and sanitization
- ✅ **React Integration**: Hooks and components for React applications
- ✅ **Database Integration**: Works with @company/database module
- ✅ **TypeScript**: Full TypeScript support with comprehensive types
- ✅ **Testing**: Complete test coverage with Vitest

## Installation

```bash
pnpm add @company/user-profiles
```

## Quick Start

### Service Usage

```typescript
import { UserProfileService } from '@company/user-profiles';
import { DatabaseManager } from '@company/database';

const db = new DatabaseManager(/* config */);
const profileService = new UserProfileService(db);

// Create a profile
const profile = await profileService.create({
  id: 'user-123',
  name: 'John Doe',
  picture: 'https://example.com/avatar.jpg',
  bio: 'Software developer'
});

// Get a profile
const profile = await profileService.findById('user-123');

// Update a profile
const updated = await profileService.update('user-123', {
  name: 'John Smith',
  bio: 'Senior Software Developer'
});

// Delete a profile
await profileService.delete('user-123');
```

### React Hook Usage

```typescript
import { useUserProfile } from '@company/user-profiles';

function UserProfileComponent({ userId }: { userId: string }) {
  const { profile, loading, error, update } = useUserProfile({
    service: profileService,
    userId
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>{profile?.name}</h1>
      <button onClick={() => update({ name: 'New Name' })}>
        Update Name
      </button>
    </div>
  );
}
```

### React Component Usage

```typescript
import { UserProfileCard, UserProfileForm } from '@company/user-profiles';

function ProfileDisplay({ profile }: { profile: UserProfile }) {
  return (
    <UserProfileCard
      profile={profile}
      onClick={(profile) => console.log('Clicked:', profile)}
    />
  );
}

function ProfileEditor({ onSubmit }: { onSubmit: (data: any) => void }) {
  return (
    <UserProfileForm
      onSubmit={onSubmit}
      onCancel={() => console.log('Cancelled')}
    />
  );
}
```

## API Reference

### Types

#### `UserProfile`
```typescript
interface UserProfile {
  id: string;
  name: string;
  picture?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### `CreateUserProfileInput`
```typescript
interface CreateUserProfileInput {
  id: string;
  name: string;
  picture?: string;
  bio?: string;
}
```

#### `UpdateUserProfileInput`
```typescript
interface UpdateUserProfileInput {
  name?: string;
  picture?: string;
  bio?: string;
}
```

### Services

#### `UserProfileService`

Main service class for managing user profiles.

**Methods:**
- `create(input: CreateUserProfileInput): Promise<UserProfile>`
- `findById(id: string): Promise<UserProfile | null>`
- `update(id: string, input: UpdateUserProfileInput): Promise<UserProfile>`
- `delete(id: string): Promise<void>`
- `findMany(options?: UserProfileQueryOptions): Promise<UserProfile[]>`
- `count(filters?: UserProfileFilters): Promise<number>`

### Hooks

#### `useUserProfile`

Hook for managing a single user profile.

```typescript
const {
  profile,
  loading,
  error,
  create,
  update,
  delete: deleteProfile,
  reload
} = useUserProfile({ service, userId });
```

#### `useUserProfiles`

Hook for managing multiple user profiles with pagination.

```typescript
const {
  profiles,
  loading,
  error,
  totalCount,
  hasMore,
  loadMore,
  reload,
  updateQueryOptions
} = useUserProfiles({ service, queryOptions });
```

### Components

#### `UserProfileCard`

Displays user profile information in a card format.

**Props:**
- `profile: UserProfile` - The profile to display
- `showBio?: boolean` - Whether to show bio (default: true)
- `className?: string` - Additional CSS classes
- `onClick?: (profile: UserProfile) => void` - Click handler

#### `UserProfileForm`

Form component for creating/editing user profiles.

**Props:**
- `profile?: UserProfile` - Existing profile for editing
- `onSubmit: (data: CreateUserProfileInput | UpdateUserProfileInput) => Promise<void>`
- `onCancel?: () => void` - Cancel handler
- `loading?: boolean` - Loading state
- `className?: string` - Additional CSS classes

#### `UserProfileList`

Displays a list of user profiles with pagination support.

**Props:**
- `profiles: UserProfile[]` - Array of profiles
- `loading?: boolean` - Loading state
- `error?: string | null` - Error message
- `onProfileClick?: (profile: UserProfile) => void` - Profile click handler
- `onLoadMore?: () => void` - Load more handler
- `hasMore?: boolean` - Whether more items are available
- `className?: string` - Additional CSS classes
- `emptyMessage?: string` - Message when no profiles found

## Validation Rules

- **Name**: Required, 1-100 characters
- **Bio**: Optional, max 500 characters
- **Picture**: Optional, must be valid URL
- **ID**: Required for creation, must be unique

## Database Schema

The module expects a table with the following structure:

```sql
CREATE TABLE user_profiles (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  picture TEXT NULL,
  bio TEXT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build module
pnpm build

# Type checking
pnpm typecheck
```

## License

MIT