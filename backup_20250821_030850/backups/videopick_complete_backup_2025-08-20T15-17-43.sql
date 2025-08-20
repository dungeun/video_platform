-- VideoPick Complete Database Backup
-- Generated: 2025-08-20T15:19:08.319Z
-- 
-- This backup includes:
-- 1. Database schema (tables, indexes, constraints)
-- 2. All data from core tables
--
-- Restore instructions:
-- 1. Create a new PostgreSQL database
-- 2. Run this SQL file: psql -d your_database < backup_file.sql
-- 3. Update your DATABASE_URL environment variable
--


-- VideoPick Database Schema Backup
-- Generated: 2025-08-20T15:17:43.246Z
-- Source: Prisma Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  role VARCHAR DEFAULT 'USER',
  is_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR,
  reset_token VARCHAR,
  reset_token_expires_at TIMESTAMP,
  login_attempts INTEGER DEFAULT 0,
  last_login_attempt TIMESTAMP,
  is_locked BOOLEAN DEFAULT false,
  locked_until TIMESTAMP,
  profile_image_url VARCHAR,
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Channels table
CREATE TABLE IF NOT EXISTS channels (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  profile_image_url VARCHAR,
  banner_image_url VARCHAR,
  subscriber_count INTEGER DEFAULT 0,
  video_count INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_streams INTEGER DEFAULT 0,
  total_stream_time INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id VARCHAR PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  user_id VARCHAR NOT NULL,
  channel_id VARCHAR NOT NULL,
  video_url VARCHAR NOT NULL,
  thumbnail_url VARCHAR,
  hls_url VARCHAR,
  dash_url VARCHAR,
  duration INTEGER,
  file_size BIGINT,
  mime_type VARCHAR,
  width INTEGER,
  height INTEGER,
  status VARCHAR DEFAULT 'PROCESSING',
  category VARCHAR DEFAULT 'general',
  tags TEXT[],
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  is_live_recording BOOLEAN DEFAULT false,
  original_stream_id VARCHAR,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (channel_id) REFERENCES channels(id),
  FOREIGN KEY (original_stream_id) REFERENCES live_streams(id)
);

-- Live streams table
CREATE TABLE IF NOT EXISTS live_streams (
  id VARCHAR PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  channel_id VARCHAR NOT NULL,
  stream_key VARCHAR UNIQUE NOT NULL,
  status VARCHAR DEFAULT 'PREPARING',
  category VARCHAR DEFAULT 'general',
  rtmp_url VARCHAR,
  hls_url VARCHAR,
  flv_url VARCHAR,
  viewer_count INTEGER DEFAULT 0,
  max_viewers INTEGER DEFAULT 0,
  duration INTEGER,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  scheduled_at TIMESTAMP,
  terminated_reason VARCHAR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
);

-- Stream keys table
CREATE TABLE IF NOT EXISTS stream_keys (
  id VARCHAR PRIMARY KEY,
  channel_id VARCHAR NOT NULL,
  key_name VARCHAR NOT NULL,
  stream_key VARCHAR UNIQUE NOT NULL,
  status VARCHAR DEFAULT 'ACTIVE',
  permissions TEXT[],
  last_used_at TIMESTAMP,
  regenerated_at TIMESTAMP,
  status_updated_at TIMESTAMP,
  deleted_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
);

-- Files table
CREATE TABLE IF NOT EXISTS files (
  id VARCHAR PRIMARY KEY,
  file_name VARCHAR NOT NULL,
  mime_type VARCHAR NOT NULL,
  size BIGINT NOT NULL,
  status VARCHAR DEFAULT 'UPLOADING',
  upload_progress INTEGER DEFAULT 0,
  uploaded_size BIGINT DEFAULT 0,
  user_id VARCHAR NOT NULL,
  error_message TEXT,
  metadata JSONB,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_channels_user_id ON channels(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_channel_id ON videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_live_streams_channel_id ON live_streams(channel_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_stream_key ON live_streams(stream_key);
CREATE INDEX IF NOT EXISTS idx_stream_keys_channel_id ON stream_keys(channel_id);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);


-- VideoPick Database Data Backup
-- Generated: 2025-08-20T15:17:43.246Z

-- Disable foreign key checks
SET session_replication_role = replica;

-- Error backing up users: 
Invalid `prisma.$queryRawUnsafe()` invocation:


Can't reach database server at `141.164.60.51:5434`

Please make sure your database server is running at `141.164.60.51:5434`.

-- Error backing up channels: 
Invalid `prisma.$queryRawUnsafe()` invocation:


Can't reach database server at `141.164.60.51:5434`

Please make sure your database server is running at `141.164.60.51:5434`.

-- Error backing up videos: 
Invalid `prisma.$queryRawUnsafe()` invocation:


Can't reach database server at `141.164.60.51:5434`

Please make sure your database server is running at `141.164.60.51:5434`.

-- Error backing up live_streams: 
Invalid `prisma.$queryRawUnsafe()` invocation:


Can't reach database server at `141.164.60.51:5434`

Please make sure your database server is running at `141.164.60.51:5434`.

-- Error backing up stream_keys: 
Invalid `prisma.$queryRawUnsafe()` invocation:


Can't reach database server at `141.164.60.51:5434`

Please make sure your database server is running at `141.164.60.51:5434`.

-- Error backing up files: 
Invalid `prisma.$queryRawUnsafe()` invocation:


Can't reach database server at `141.164.60.51:5434`

Please make sure your database server is running at `141.164.60.51:5434`.

-- Error backing up business_profiles: 
Invalid `prisma.$queryRawUnsafe()` invocation:


Can't reach database server at `141.164.60.51:5434`

Please make sure your database server is running at `141.164.60.51:5434`.

-- Error backing up campaigns: 
Invalid `prisma.$queryRawUnsafe()` invocation:


Can't reach database server at `141.164.60.51:5434`

Please make sure your database server is running at `141.164.60.51:5434`.

-- Error backing up campaign_applications: 
Invalid `prisma.$queryRawUnsafe()` invocation:


Can't reach database server at `141.164.60.51:5434`

Please make sure your database server is running at `141.164.60.51:5434`.

-- Error backing up payouts: 
Invalid `prisma.$queryRawUnsafe()` invocation:


Can't reach database server at `141.164.60.51:5434`

Please make sure your database server is running at `141.164.60.51:5434`.

-- Error backing up subscription_plans: 
Invalid `prisma.$queryRawUnsafe()` invocation:


Can't reach database server at `141.164.60.51:5434`

Please make sure your database server is running at `141.164.60.51:5434`.

-- Error backing up subscriptions: 
Invalid `prisma.$queryRawUnsafe()` invocation:


Can't reach database server at `141.164.60.51:5434`

Please make sure your database server is running at `141.164.60.51:5434`.

-- Error backing up video_comments: 
Invalid `prisma.$queryRawUnsafe()` invocation:


Can't reach database server at `141.164.60.51:5434`

Please make sure your database server is running at `141.164.60.51:5434`.

-- Error backing up video_likes: 
Invalid `prisma.$queryRawUnsafe()` invocation:


Can't reach database server at `141.164.60.51:5434`

Please make sure your database server is running at `141.164.60.51:5434`.

-- Error backing up video_views: 
Invalid `prisma.$queryRawUnsafe()` invocation:


Can't reach database server at `141.164.60.51:5434`

Please make sure your database server is running at `141.164.60.51:5434`.

-- Error backing up chat_messages: 
Invalid `prisma.$queryRawUnsafe()` invocation:


Can't reach database server at `141.164.60.51:5434`

Please make sure your database server is running at `141.164.60.51:5434`.

-- Error backing up stream_stats: 
Invalid `prisma.$queryRawUnsafe()` invocation:


Can't reach database server at `141.164.60.51:5434`

Please make sure your database server is running at `141.164.60.51:5434`.

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

