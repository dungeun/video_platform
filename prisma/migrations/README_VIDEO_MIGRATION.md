# Video Platform Schema Migration

## Overview
This migration extends the existing LinkPick schema to support video platform features while maintaining backward compatibility.

## Changes Made

### 1. Updated User Types
- Added `CREATOR` type (for video creators, transformed from BUSINESS)
- Added `VIEWER` type (for video viewers, transformed from INFLUENCER)
- Kept existing types for backward compatibility

### 2. Extended Campaign Model
Added nullable fields to support video features:
- `videoUrl` - Video file URL
- `duration` - Video duration in seconds
- `likeCount` - Number of likes
- `dislikeCount` - Number of dislikes
- `isLive` - Live streaming flag
- `streamKey` - For live streaming
- `channelId` - Link to channel

### 3. New Models Added

#### Channel
- User channels for video creators
- One-to-one relationship with User
- Stores channel metadata (name, handle, subscriber count, etc.)

#### Video (Future Model)
- Dedicated video model for future migration
- Currently using Campaign model with video fields

#### LiveStream
- Live streaming sessions
- Linked to channels
- Stores streaming metadata and URLs

#### Subscription
- User subscriptions to channels
- Supports different tiers (free, member, premium)

#### VideoComment
- Comments on videos (compatible with Campaign model)
- Supports nested replies

#### VideoLike
- Like/dislike tracking for videos
- Works with both Campaign and future Video models

#### WatchHistory
- User viewing history
- Tracks watch time and completion

#### LiveChatMessage
- Real-time chat messages for live streams

## Migration Strategy

### Phase 1: Schema Extension (Current)
1. Add new models alongside existing ones
2. Extend Campaign model with video fields
3. Create database view for compatibility

### Phase 2: Data Migration
1. Transform existing Business users to Creators
2. Transform existing Influencer users to Viewers
3. Create channels for existing Business users

### Phase 3: API Migration
1. Create new /api/videos endpoints
2. Redirect /api/campaigns to /api/videos
3. Update frontend to use new models

## Database View
Created `videos` view that maps Campaign table to Video interface:
- Allows using Video model interface while data remains in Campaign table
- Supports INSERT, UPDATE, DELETE operations through triggers
- Enables gradual migration without breaking existing functionality

## Usage

### Apply Migration
```bash
# When database is accessible
npx prisma migrate dev --name add_video_models

# Apply the view
psql $DATABASE_URL < prisma/migrations/create_videos_view.sql
```

### Rollback
```sql
-- Drop the view and triggers
DROP VIEW IF EXISTS videos CASCADE;
DROP FUNCTION IF EXISTS handle_videos_view_dml() CASCADE;
```

## Testing

### Verify Schema
```bash
npx prisma validate
npx prisma generate
```

### Test Compatibility
1. Existing Campaign CRUD should work unchanged
2. New Video operations through the view
3. Channel creation for users
4. Subscription management

## Notes
- All new fields are nullable to maintain backward compatibility
- Foreign key constraints use CASCADE delete for cleanup
- Indexes added for performance on frequently queried fields
- View triggers handle data transformation automatically