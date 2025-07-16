# Influencer Profiles Module

## Overview
The Influencer Profiles module manages influencer profiles, social metrics, portfolios, and verification for the LinkPick platform.

## Features
- **Profile Management**: Create, update, and manage influencer profiles
- **Social Metrics**: Track and sync social media metrics across platforms
- **Portfolio Management**: Showcase campaigns, media, and testimonials
- **Verification System**: Multi-level verification with document upload
- **Search & Discovery**: Advanced search with filters and recommendations
- **Favorites & Comparison**: Save favorite profiles and compare metrics

## Installation

```bash
npm install @revu/influencer-profiles
```

## Usage

### Basic Profile Management

```typescript
import { useProfile, ProfileCard } from '@revu/influencer-profiles';

function InfluencerProfileView({ profileId }) {
  const { profile, loading, updateProfile } = useProfile(profileId);

  if (loading) return <Spinner />;

  return (
    <ProfileCard 
      profile={profile}
      onUpdate={updateProfile}
    />
  );
}
```

### Profile Search

```typescript
import { ProfileSearch, ProfileGrid, useProfileSearch } from '@revu/influencer-profiles';

function DiscoverInfluencers() {
  const { results, search, loading } = useProfileSearch();

  return (
    <>
      <ProfileSearch onSearch={search} loading={loading} />
      {results && (
        <ProfileGrid 
          profiles={results.profiles}
          loading={loading}
        />
      )}
    </>
  );
}
```

### Social Metrics Sync

```typescript
import { useSocialMetrics } from '@revu/influencer-profiles';

function SocialAccountsManager({ profileId }) {
  const { 
    accounts, 
    metrics, 
    syncMetrics, 
    connectSocialAccount 
  } = useSocialMetrics(profileId, true); // Auto-sync enabled

  return (
    <div>
      <Button onClick={syncMetrics}>Sync Now</Button>
      <SocialMetrics metrics={metrics} accounts={accounts} />
    </div>
  );
}
```

### Verification Process

```typescript
import { useVerification } from '@revu/influencer-profiles';

function VerificationUpload({ profileId }) {
  const { 
    status, 
    uploadDocument, 
    submitVerification 
  } = useVerification(profileId);

  const handleFileUpload = async (file: File) => {
    const document = await uploadDocument('identity', file);
    await submitVerification([document]);
  };

  return (
    <FileUpload 
      onUpload={handleFileUpload}
      accept="image/*,application/pdf"
    />
  );
}
```

## API Reference

### Types

#### InfluencerProfile
```typescript
interface InfluencerProfile {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  bio: string;
  category: InfluencerCategory[];
  socialAccounts: SocialAccount[];
  metrics: InfluencerMetrics;
  portfolio: Portfolio;
  verification: VerificationStatus;
  pricing: PricingInfo;
  // ... more fields
}
```

### Hooks

#### useProfile(profileId?: string)
- `profile`: Current profile data
- `loading`: Loading state
- `error`: Error state
- `updateProfile`: Update profile function
- `deleteProfile`: Delete profile function
- `syncMetrics`: Sync social metrics

#### useProfileSearch()
- `results`: Search results with facets
- `search`: Search function
- `suggestions`: Search suggestions
- `loading`: Loading state

#### useVerification(profileId: string)
- `status`: Verification status
- `submitVerification`: Submit documents
- `uploadDocument`: Upload single document
- `requestManualReview`: Request manual review

### Components

#### ProfileCard
Displays profile summary with metrics and actions.

#### ProfileGrid
Responsive grid layout for multiple profiles.

#### ProfileDetail
Full profile view with tabs for different sections.

#### ProfileSearch
Advanced search interface with filters.

#### ProfileForm
Multi-step form for creating/editing profiles.

#### VerificationBadge
Visual indicator of verification level.

#### SocialMetrics
Comprehensive metrics dashboard.

#### PortfolioGallery
Media gallery for campaigns and content.

## Events

The module emits the following events:

- `profile:created` - When a new profile is created
- `profile:updated` - When a profile is updated
- `profile:deleted` - When a profile is deleted
- `metrics:synced` - When social metrics are synced
- `verification:submitted` - When verification is submitted

## Configuration

```typescript
// Configure module settings
import { configureInfluencerProfiles } from '@revu/influencer-profiles';

configureInfluencerProfiles({
  autoSyncInterval: 300000, // 5 minutes
  maxProfileCacheSize: 100,
  defaultSearchLimit: 20,
  verificationLevels: ['basic', 'verified', 'premium', 'elite']
});
```

## License

MIT